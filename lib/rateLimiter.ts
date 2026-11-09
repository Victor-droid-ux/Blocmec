// src/lib/utils/rate-limit.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;
let hasLoggedMissingRedisConfig = false;
let hasLoggedDevBypass = false;

function getRedisClient(): Redis | null {
  const isDev = process.env.NODE_ENV === "development";
  const enableInDev = process.env.ENABLE_REDIS_RATE_LIMIT_IN_DEV === "true";
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const hasUpstashCreds = Boolean(url && token);

  if (isDev && !enableInDev && !hasUpstashCreds) {
    if (!hasLoggedDevBypass) {
      console.warn(
        "[RateLimit] Development mode detected. Redis-backed rate limiting is disabled locally.",
      );
      hasLoggedDevBypass = true;
    }
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  if (!url || !token) {
    if (!hasLoggedMissingRedisConfig) {
      console.error(
        "[SECURITY] Upstash env vars are not set. Rate limiting is DISABLED. This is a security risk in production.",
      );
      hasLoggedMissingRedisConfig = true;
    }
    // SECURITY: In production, we MUST NOT silently disable rate limiting
    // Only allow in development; in production throw error
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL: Rate limiting required in production but Redis credentials not found. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
      );
    }
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitKeyOptions {
  keySuffix?: string;
}

export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 },
  keyOptions: RateLimitKeyOptions = {},
) {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  try {
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const key = keyOptions.keySuffix
      ? `rate-limit:${keyOptions.keySuffix}:${ip}`
      : `rate-limit:${ip}`;

    // SECURITY: Use atomic INCR instead of GET + SET
    // This prevents race conditions where concurrent requests
    // can bypass the rate limit
    const current = await redis.incr(key);

    // Set expiration only on first increment of the window
    if (current === 1) {
      // Set expiration in seconds
      await redis.expire(key, Math.ceil(config.windowMs / 1000));
    }

    if (current > config.maxRequests) {
      // Return remaining time until reset
      const ttl = await redis.ttl(key);
      return NextResponse.json(
        {
          error: "Too many requests",
          retryAfter: ttl > 0 ? ttl : 1,
        },
        { 
          status: 429,
          headers: {
            "Retry-After": String(ttl > 0 ? ttl : 1),
          },
        }
      );
    }

    return null;
  } catch (error) {
    // SECURITY: In production, fail CLOSED (reject requests) not OPEN
    // This prevents bypass of rate limiting due to Redis outage
    const isProduction = process.env.NODE_ENV === "production";
    
    console.error(
      isProduction
        ? "[SECURITY] Rate limiter failed; REJECTING request to prevent bypass"
        : "[RateLimit] Redis request failed; bypassing rate limit in dev mode",
      error,
    );

    if (isProduction) {
      // In production, reject the request rather than allow unlimited throughput
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    // In dev, allow the request
    return null;
  }
}

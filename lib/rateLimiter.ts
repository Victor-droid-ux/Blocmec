// src/lib/utils/rate-limit.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;
let hasLoggedMissingRedisConfig = false;
let hasLoggedDevBypass = false;
let redisDisabledUntil = 0;
let hasLoggedRedisBypassCooldown = false;

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
      console.warn(
        "[RateLimit] Upstash env vars are not set. Redis-backed rate limiting is disabled.",
      );
      hasLoggedMissingRedisConfig = true;
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
  const now = Date.now();
  if (now < redisDisabledUntil) {
    if (!hasLoggedRedisBypassCooldown) {
      console.warn(
        "[RateLimit] Redis temporarily disabled after recent connectivity errors; bypassing rate limit.",
      );
      hasLoggedRedisBypassCooldown = true;
    }
    return null;
  }

  hasLoggedRedisBypassCooldown = false;

  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  try {
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const key = keyOptions.keySuffix
      ? `rate-limit:${keyOptions.keySuffix}`
      : `rate-limit:${ip}`;

    const current = (await redis.get<number>(key)) || 0;

    if (current >= config.maxRequests) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    await redis.set(key, current + 1, {
      ex: config.windowMs / 1000,
    });
    return null;
  } catch (error) {
    // Fail open if the rate limiter backend is down, so auth endpoints remain available.
    redisDisabledUntil = Date.now() + 60_000;
    redisClient = null;
    console.warn(
      "[RateLimit] Redis request failed; bypassing rate limit.",
      error,
    );
    return null;
  }
}

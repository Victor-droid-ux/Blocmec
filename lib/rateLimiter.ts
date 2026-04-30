// src/lib/utils/rate-limit.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;
let hasLoggedMissingRedisConfig = false;

function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

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
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const key = keyOptions.keySuffix
    ? `rate-limit:${keyOptions.keySuffix}`
    : `rate-limit:${ip}`;

  const current = (await redis.get<number>(key)) || 0;

  if (current >= config.maxRequests) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  await redis.setex(key, config.windowMs / 1000, current + 1);
  return null;
}

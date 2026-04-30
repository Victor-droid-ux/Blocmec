//lib/plan-rate-limit.ts

import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

function getRedisClient() {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

export async function enforceUserRateLimit(params: {
  userId: string;
  bucket: string;
  maxRequests: number;
  windowSeconds?: number;
}) {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  const key = `rate-limit:user:${params.userId}:${params.bucket}`;
  const ttl = params.windowSeconds ?? 60;
  const current = (await redis.get<number>(key)) || 0;

  if (current >= params.maxRequests) {
    return NextResponse.json(
      { error: "Rate limit exceeded for your current subscription plan" },
      { status: 429 },
    );
  }

  await redis.setex(key, ttl, current + 1);
  return null;
}

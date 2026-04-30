// lib/webhook-replay.ts

import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;
const inMemoryReplay = new Map<string, number>();

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

function cleanupExpiredInMemory(nowMs: number) {
  for (const [key, expiresAt] of inMemoryReplay.entries()) {
    if (expiresAt <= nowMs) {
      inMemoryReplay.delete(key);
    }
  }
}

export async function isReplayAndStore(params: {
  namespace: string;
  deliveryId: string;
  ttlSeconds: number;
}) {
  const key = `${params.namespace}:${params.deliveryId}`;
  const redis = getRedisClient();

  if (redis) {
    const existing = await redis.get<string>(key);
    if (existing) {
      return true;
    }

    await redis.setex(key, params.ttlSeconds, "1");
    return false;
  }

  const now = Date.now();
  cleanupExpiredInMemory(now);

  const existingExpiresAt = inMemoryReplay.get(key);
  if (existingExpiresAt && existingExpiresAt > now) {
    return true;
  }

  inMemoryReplay.set(key, now + params.ttlSeconds * 1000);
  return false;
}

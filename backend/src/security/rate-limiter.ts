import { Redis } from "@upstash/redis";
import { env } from "../config/env.js";

const redis = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

export class DistributedRateLimiter {
  public static async checkLimit(
    identifier: string,
    limit = 60,
    windowSeconds = 60
  ): Promise<RateLimitResult> {
    if (!redis) {
      return { allowed: true, limit, remaining: limit - 1, resetSeconds: windowSeconds };
    }

    const key = `ratelimit:${identifier}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    const allowed = current <= limit;
    const remaining = Math.max(0, limit - current);

    return {
      allowed,
      limit,
      remaining,
      resetSeconds: windowSeconds,
    };
  }

  public static async acquireIdempotencyLock(
    idempotencyKey: string,
    ttlSeconds = 300
  ): Promise<boolean> {
    if (!redis) return true;

    const lockKey = `lock:idempotency:${idempotencyKey}`;
    const acquired = await redis.set(lockKey, "LOCKED", { nx: true, ex: ttlSeconds });
    return acquired === "OK";
  }

  public static async releaseIdempotencyLock(idempotencyKey: string): Promise<void> {
    if (!redis) return;
    await redis.del(`lock:idempotency:${idempotencyKey}`);
  }
}


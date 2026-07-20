import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
  throw new Error('Missing Upstash Redis environment variables: UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN');
}

/**
 * Upstash Redis client singleton.
 * HTTP-based — no persistent TCP connection, safe for serverless/edge.
 * Used for: AI recommendation caching (TTL: 24h), rate limiting, BullMQ.
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

export const CACHE_TTL = {
  AI_RECOMMENDATIONS: 60 * 60 * 24,
  AUDIT_RESULT: 60 * 60 * 2,
  RATE_LIMIT_WINDOW: 60,
} as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  try { return await redis.get<T>(key); }
  catch (err) { console.error(`[redis] GET failed "${key}":`, err); return null; }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try { await redis.set(key, value, { ex: ttlSeconds }); }
  catch (err) { console.error(`[redis] SET failed "${key}":`, err); }
}

export async function cacheDel(key: string): Promise<void> {
  try { await redis.del(key); }
  catch (err) { console.error(`[redis] DEL failed "${key}":`, err); }
}

export default redis;

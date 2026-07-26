/**
 * Upstash Redis client — gracefully stubbed when env vars are absent.
 * Cache operations become no-ops; rate limiting falls back to in-memory.
 * Set UPSTASH_REDIS_URL + UPSTASH_REDIS_TOKEN to enable.
 */
import { Redis } from '@upstash/redis';

export const REDIS_ENABLED =
  Boolean(process.env.UPSTASH_REDIS_URL) &&
  Boolean(process.env.UPSTASH_REDIS_TOKEN);

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!REDIS_ENABLED) return null;
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    });
  }
  return _redis;
}

export const CACHE_TTL = {
  AI_RECOMMENDATIONS: 60 * 60 * 24,
  AUDIT_RESULT: 60 * 60 * 2,
  RATE_LIMIT_WINDOW: 60,
} as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try { return await r.get<T>(key); }
  catch (err) { console.error(`[redis] GET failed "${key}":`, err); return null; }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try { await r.set(key, value, { ex: ttlSeconds }); }
  catch (err) { console.error(`[redis] SET failed "${key}":`, err); }
}

export async function cacheDel(key: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try { await r.del(key); }
  catch (err) { console.error(`[redis] DEL failed "${key}":`, err); }
}

// Named export for code that imports `redis` directly
export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const r = getRedis();
    if (!r) {
      // Return a no-op function for any method call when Redis is disabled
      return () => Promise.resolve(null);
    }
    return r[prop as keyof Redis];
  },
});

export default redis;

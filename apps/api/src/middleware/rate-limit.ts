import type { MiddlewareHandler } from 'hono';
import type { AppVariables } from '../types/auth.js';
import { PLAN_LIMITS } from '../types/auth.js';
import { RateLimitError } from '../lib/errors.js';

/**
 * Per-user sliding-window rate limiter backed by Upstash Redis REST API.
 * Limits: FREE=10/day, PRO=100/day, AGENCY=unlimited
 *
 * Uses Upstash Redis INCR + EXPIRE via REST (no persistent connection needed).
 */
export const rateLimitMiddleware: MiddlewareHandler<{ Variables: AppVariables }> =
  async (c, next) => {
    const user = c.get('user');

    if (!user) {
      await next();
      return;
    }

    const limit = PLAN_LIMITS[user.plan].auditsPerDay;

    // AGENCY plan is unlimited
    if (limit === Infinity) {
      await next();
      return;
    }

    const redisUrl = process.env.UPSTASH_REDIS_URL;
    const redisToken = process.env.UPSTASH_REDIS_TOKEN;

    if (!redisUrl || !redisToken) {
      console.warn('[rate-limit] Upstash Redis not configured - skipping rate limit');
      await next();
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const key = `user:${user.id}:audits:${today}`;

    try {
      const incrRes = await fetch(`${redisUrl}/incr/${key}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!incrRes.ok) {
        console.error('[rate-limit] Redis INCR failed:', await incrRes.text());
        await next();
        return;
      }

      const { result: count } = (await incrRes.json()) as { result: number };

      if (count === 1) {
        const now = new Date();
        const endOfDay = new Date(now);
        endOfDay.setUTCHours(23, 59, 59, 999);
        const ttl = Math.ceil((endOfDay.getTime() - now.getTime()) / 1000);

        await fetch(`${redisUrl}/expire/${key}/${ttl}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${redisToken}` },
        });
      }

      if (count > limit) {
        throw new RateLimitError(
          `Daily audit limit reached (${limit}/day on ${user.plan} plan). Resets at midnight UTC.`,
          {
            limit,
            used: count - 1,
            remaining: 0,
            resetAt: getEndOfDayUTC(),
          }
        );
      }

      c.header('X-RateLimit-Limit', String(limit));
      c.header('X-RateLimit-Remaining', String(Math.max(0, limit - count)));
      c.header('X-RateLimit-Reset', getEndOfDayUTC());
    } catch (err) {
      if (err instanceof RateLimitError) throw err;
      console.error('[rate-limit] Unexpected error:', err);
    }

    await next();
  };

function getEndOfDayUTC(): string {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d.toISOString();
}

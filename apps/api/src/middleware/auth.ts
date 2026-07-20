import type { MiddlewareHandler } from 'hono';
import { verifySupabaseToken } from '../lib/supabase.js';
import { prisma } from '../lib/prisma.js';
import type { AppVariables, Plan } from '../types/auth.js';
import { UnauthorizedError } from '../lib/errors.js';

/**
 * JWT authentication middleware.
 * Extracts Bearer token -> verifies with Supabase -> loads user from DB -> attaches to context.
 *
 * Error codes:
 *   401 MISSING_TOKEN    - no Authorization header
 *   401 INVALID_TOKEN    - malformed or invalid JWT
 *   401 EXPIRED_TOKEN    - token has expired
 *   401 USER_NOT_FOUND   - valid token but user not in DB
 */
export const authMiddleware: MiddlewareHandler<{ Variables: AppVariables }> =
  async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header', 'MISSING_TOKEN');
    }

    const token = authHeader.slice(7);

    let supabaseUser;
    try {
      supabaseUser = await verifySupabaseToken(token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Token verification failed';
      const code = message.toLowerCase().includes('expired') ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN';
      throw new UnauthorizedError(message, code);
    }

    // Load full user record from DB to get plan info
    const dbUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
      select: { id: true, email: true, plan: true },
    });

    if (!dbUser) {
      throw new UnauthorizedError('User not found', 'USER_NOT_FOUND');
    }

    c.set('user', {
      id: dbUser.id,
      email: dbUser.email,
      plan: dbUser.plan as Plan,
    });

    await next();
  };

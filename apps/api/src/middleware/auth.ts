import type { Context, Next } from 'hono';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { supabaseAdmin } from '../lib/supabase.js';
import { prisma } from '../lib/prisma.js';
import type { Plan } from '@prisma/client';

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  plan: Plan;
  orgId?: string;
};

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

/**
 * Hono middleware: extracts and verifies the Supabase JWT from the
 * Authorization: Bearer <token> header.
 *
 * On success: attaches the resolved DB user to `c.var.user`.
 * On failure: throws 401 HTTPException.
 */
export const authMiddleware = createMiddleware(async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, {
      message: 'Missing or malformed Authorization header. Expected: Bearer <token>',
    });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    throw new HTTPException(401, { message: 'Empty bearer token' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    throw new HTTPException(401, {
      message: error?.message ?? 'Invalid or expired token',
    });
  }

  const supabaseUser = data.user;

  const dbUser = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
    select: { id: true, email: true, name: true, plan: true },
  });

  if (!dbUser) {
    const provisioned = await prisma.user.create({
      data: {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        name: supabaseUser.user_metadata?.full_name ?? null,
        plan: 'FREE',
      },
      select: { id: true, email: true, name: true, plan: true },
    });
    c.set('user', provisioned);
  } else {
    c.set('user', dbUser);
  }

  await next();
});

export const optionalAuthMiddleware = createMiddleware(async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const { data } = await supabaseAdmin.auth.getUser(token);

    if (data.user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: data.user.id },
        select: { id: true, email: true, name: true, plan: true },
      });
      if (dbUser) c.set('user', dbUser);
    }
  }

  await next();
});

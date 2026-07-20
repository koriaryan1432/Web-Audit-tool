import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { api } from './routes/index.js';
import { AppError } from './lib/errors.js';
import type { AppVariables } from './types/auth.js';

const app = new Hono<{ Variables: AppVariables }>();

// ─── Global middleware ────────────────────────────────────────────────────────

app.use('*', logger());

app.use(
  '*',
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [
      'http://localhost:3000',
      'https://sitegarde.com',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    credentials: true,
    maxAge: 86400,
  })
);

// ─── Routes ──────────────────────────────────────────────────────────────────

app.route('/api/v1', api);

// Root health check
app.get('/', (c) =>
  c.json({
    service: 'SiteGrade API',
    version: '1.0.0',
    status: 'ok',
  })
);

// ─── Global error handler ────────────────────────────────────────────────────

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(err.toJSON(), err.status);
  }

  // Unexpected errors — don't leak internals
  console.error('[api] Unhandled error:', err);
  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    500
  );
});

// 404 handler
app.notFound((c) =>
  c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404
  )
);

export { app };

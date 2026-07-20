import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { HTTPException } from 'hono/http-exception';
import { serve } from '@hono/node-server';
import { apiRouter } from './routes/index.js';
import { disconnectPrisma } from './lib/prisma.js';

const app = new Hono();

app.use('*', logger());

app.use('*', cors({
  origin: (origin) => {
    const allowed = [
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'https://sitegra.de', 'https://www.sitegra.de', 'https://app.sitegra.de',
    ];
    return allowed.includes(origin) ? origin : null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
  exposeHeaders: ['X-Request-Id'],
  credentials: true,
  maxAge: 86400,
}));

app.use('/api/v1/*', prettyJSON());
app.route('/api/v1', apiRouter);

app.get('/', (c) => c.json({ name: 'SiteGrade API', version: '1.0.0', docs: 'https://docs.sitegra.de' }));

app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message, status: err.status }, err.status);
  console.error('[api] Unhandled error:', err);
  return c.json({
    error: 'Internal server error', status: 500,
    ...(process.env.NODE_ENV === 'development' && { detail: err instanceof Error ? err.message : String(err) }),
  }, 500);
});

app.notFound((c) => c.json({ error: `Route ${c.req.method} ${c.req.path} not found` }, 404));

const PORT = parseInt(process.env.PORT ?? '3001', 10);

if (process.env.NODE_ENV !== 'test') {
  const server = serve({ fetch: app.fetch, port: PORT });
  console.log(`[api] SiteGrade API running on port ${PORT}`);

  const shutdown = async (signal: string) => {
    console.log(`[api] Received ${signal}, shutting down...`);
    server.close(async () => { await disconnectPrisma(); process.exit(0); });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export default app;

import { serve } from '@hono/node-server';
import { app } from './app.js';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

serve(
  {
    fetch: app.fetch,
    port: PORT,
    hostname: HOST,
  },
  (info) => {
    console.log(`[api] SiteGrade API running on http://${info.address}:${info.port}`);
    console.log(`[api] Environment: ${process.env.NODE_ENV ?? 'development'}`);
  }
);

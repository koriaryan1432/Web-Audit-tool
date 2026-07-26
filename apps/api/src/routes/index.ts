import { Hono } from 'hono';
import { auditsRouter } from './audits.js';
import { reportsRouter } from './reports.js';
import { billingRouter } from './billing.js';
import { webhooksRouter } from './webhooks.js';

const apiRouter = new Hono();

apiRouter.route('/audits', auditsRouter);
apiRouter.route('/', reportsRouter);
apiRouter.route('/billing', billingRouter);
apiRouter.route('/webhooks', webhooksRouter);

apiRouter.get('/health', (c) => {
  return c.json({
    status: 'ok',
    version: process.env.npm_package_version ?? '0.0.1',
    timestamp: new Date().toISOString(),
    features: {
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      redis: Boolean(process.env.UPSTASH_REDIS_URL) || Boolean(process.env.REDIS_URL),
      openai: Boolean(process.env.OPENAI_API_KEY),
    },
  });
});

export { apiRouter };

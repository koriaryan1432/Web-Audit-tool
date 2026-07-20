import { Hono } from 'hono';
import { auditsRouter } from './audits.js';
import { reportsRouter } from './reports.js';

const apiRouter = new Hono();

apiRouter.route('/audits', auditsRouter);
apiRouter.route('/', reportsRouter);

apiRouter.get('/health', (c) => {
  return c.json({ status: 'ok', version: process.env.npm_package_version ?? '0.0.1', timestamp: new Date().toISOString() });
});

export { apiRouter };

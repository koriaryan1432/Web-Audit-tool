import { Hono } from 'hono';
import { audits } from './audits.js';
import { reports } from './reports.js';
import type { AppVariables } from '../types/auth.js';

const api = new Hono<{ Variables: AppVariables }>();

api.route('/audits', audits);
api.route('/reports', reports);

// Health check
api.get('/health', (c) =>
  c.json({ status: 'ok', service: 'sitegarde-api', timestamp: new Date().toISOString() })
);

export { api };

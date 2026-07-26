/**
 * BullMQ audit job queue — gracefully disabled when Redis env vars are absent.
 * When Redis is not configured, dispatchAuditJob logs a warning and returns null.
 * Supports both local Redis (REDIS_URL / USE_LOCAL_REDIS) and Upstash (production).
 */
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { REDIS_ENABLED } from './redis.js';

export const AUDIT_QUEUE_NAME = 'audit';

// Inline type — avoids cross-app relative import from worker package
export type AuditJobData = {
  auditId: string;
  url: string;
  userId: string;
  orgId?: string;
  options: {
    categories?: Array<'performance' | 'accessibility' | 'best-practices' | 'seo'>;
    runAxe?: boolean;
    generateAiRecommendations?: boolean;
    device?: 'mobile' | 'desktop';
    throttling?: 'simulated' | 'devtools' | 'none';
  };
};

function createRedisConnection(): Redis {
  // Local Redis (Docker / dev) — USE_LOCAL_REDIS=true or REDIS_URL set without Upstash
  if (process.env.USE_LOCAL_REDIS === 'true' || (process.env.REDIS_URL && !process.env.UPSTASH_REDIS_URL)) {
    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
    return new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  // Upstash (production)
  const url = new URL(process.env.UPSTASH_REDIS_URL!);
  return new Redis({
    host: url.hostname,
    port: 6380,
    password: process.env.UPSTASH_REDIS_TOKEN,
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

// Redis is enabled if either local Redis or Upstash is configured
const LOCAL_REDIS_ENABLED =
  process.env.USE_LOCAL_REDIS === 'true' ||
  (Boolean(process.env.REDIS_URL) && !process.env.UPSTASH_REDIS_URL);

const QUEUE_ENABLED = REDIS_ENABLED || LOCAL_REDIS_ENABLED;

let _connection: Redis | null = null;
export function getRedisConnection(): Redis | null {
  if (!QUEUE_ENABLED) return null;
  if (!_connection) _connection = createRedisConnection();
  return _connection;
}

let _queue: Queue<AuditJobData> | null = null;

function getQueue(): Queue<AuditJobData> | null {
  if (!QUEUE_ENABLED) return null;
  if (!_queue) {
    const conn = getRedisConnection()!;
    _queue = new Queue<AuditJobData>(AUDIT_QUEUE_NAME, {
      connection: conn,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 86400, count: 1000 },
        removeOnFail: { age: 604800 },
      },
    });
  }
  return _queue;
}

export const auditQueue = new Proxy({} as Queue<AuditJobData>, {
  get(_target, prop) {
    const q = getQueue();
    if (!q) return () => Promise.resolve(null);
    return q[prop as keyof Queue<AuditJobData>];
  },
});

export async function dispatchAuditJob(data: AuditJobData) {
  const q = getQueue();
  if (!q) {
    console.warn('[queue] Redis not configured — audit job not dispatched:', data.auditId);
    return null;
  }
  const job = await q.add('run-audit', data, { jobId: `audit:${data.auditId}` });
  console.log(`[queue] Dispatched audit job ${job.id} for audit ${data.auditId}`);
  return job;
}

export async function getQueueMetrics() {
  const q = getQueue();
  if (!q) return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    q.getWaitingCount(), q.getActiveCount(),
    q.getCompletedCount(), q.getFailedCount(), q.getDelayedCount(),
  ]);
  return { waiting, active, completed, failed, delayed };
}

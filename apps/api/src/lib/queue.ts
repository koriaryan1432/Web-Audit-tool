import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import type { AuditJobData } from '../../../worker/src/queue/types.js';

function createRedisConnection(): IORedis {
  const url = new URL(process.env.UPSTASH_REDIS_URL!);
  return new IORedis({
    host: url.hostname,
    port: 6380,
    password: process.env.UPSTASH_REDIS_TOKEN,
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

let _connection: IORedis | null = null;
export function getRedisConnection(): IORedis {
  if (!_connection) _connection = createRedisConnection();
  return _connection;
}

export const AUDIT_QUEUE_NAME = 'audit';

export const auditQueue = new Queue<AuditJobData>(AUDIT_QUEUE_NAME, {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 86400, count: 1000 },
    removeOnFail: { age: 604800 },
  },
});

export async function dispatchAuditJob(data: AuditJobData) {
  const job = await auditQueue.add('run-audit', data, { jobId: `audit:${data.auditId}` });
  console.log(`[queue] Dispatched audit job ${job.id} for audit ${data.auditId}`);
  return job;
}

export async function getQueueMetrics() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    auditQueue.getWaitingCount(), auditQueue.getActiveCount(),
    auditQueue.getCompletedCount(), auditQueue.getFailedCount(), auditQueue.getDelayedCount(),
  ]);
  return { waiting, active, completed, failed, delayed };
}

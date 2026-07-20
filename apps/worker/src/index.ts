import { Worker } from 'bullmq';
import type { AuditJobData } from '../../api/src/types/queue.js';
import { processAuditJob } from './processor.js';
import { prisma } from './lib/db.js';

const QUEUE_NAME = 'audit-queue';
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY ?? '3', 10);

function parseRedisConnection() {
  const redisUrl = process.env.UPSTASH_REDIS_URL ?? '';
  const redisToken = process.env.UPSTASH_REDIS_TOKEN ?? '';

  if (!redisUrl) {
    return { host: '127.0.0.1', port: 6379 };
  }
  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      password: redisToken || url.password || undefined,
      tls: url.protocol === 'rediss:' || url.protocol === 'https:' ? {} : undefined,
      maxRetriesPerRequest: null,
    };
  } catch {
    return { host: '127.0.0.1', port: 6379 };
  }
}

const worker = new Worker<AuditJobData>(QUEUE_NAME, processAuditJob, {
  connection: parseRedisConnection(),
  concurrency: CONCURRENCY,
  limiter: {
    max: CONCURRENCY,
    duration: 1000,
  },
});

worker.on('completed', (job) => {
  console.log(`[worker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(
    `[worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}):`,
    err.message
  );
});

worker.on('progress', (job, progress) => {
  console.log(`[worker] Job ${job.id} progress: ${progress}%`);
});

worker.on('error', (err) => {
  console.error('[worker] Worker error:', err);
});

console.log(
  `[worker] SiteGrade audit worker started. Queue: ${QUEUE_NAME}, Concurrency: ${CONCURRENCY}`
);

async function shutdown(signal: string) {
  console.log(`[worker] Received ${signal}, shutting down gracefully...`);
  await worker.close();
  await prisma.$disconnect();
  console.log('[worker] Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

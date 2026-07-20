import { Queue } from 'bullmq';
import type { AuditJobData } from '../types/queue.js';

const redisUrl = process.env.UPSTASH_REDIS_URL ?? '';
const redisToken = process.env.UPSTASH_REDIS_TOKEN ?? '';

function parseRedisConnection() {
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
      maxRetriesPerRequest: null, // Required by BullMQ
    };
  } catch {
    return { host: '127.0.0.1', port: 6379 };
  }
}

export const AUDIT_QUEUE_NAME = 'audit-queue';

let _auditQueue: Queue<AuditJobData> | null = null;

/**
 * BullMQ Queue singleton for audit jobs.
 */
export function getAuditQueue(): Queue<AuditJobData> {
  if (!_auditQueue) {
    _auditQueue = new Queue<AuditJobData>(AUDIT_QUEUE_NAME, {
      connection: parseRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000, // 1s -> 5s -> 30s
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return _auditQueue;
}

/**
 * Enqueue an audit job. Returns jobId and estimated queue position.
 */
export async function enqueueAudit(
  jobData: AuditJobData
): Promise<{ jobId: string; queuePosition: number }> {
  const queue = getAuditQueue();
  const job = await queue.add(`audit:${jobData.auditId}`, jobData, {
    jobId: jobData.auditId,
  });
  const waiting = await queue.getWaitingCount();
  return { jobId: job.id ?? jobData.auditId, queuePosition: waiting };
}

/**
 * Get current progress for a running audit job.
 */
export async function getJobProgress(
  auditId: string
): Promise<{ progress: number; status: string } | null> {
  const queue = getAuditQueue();
  const job = await queue.getJob(auditId);
  if (!job) return null;
  const state = await job.getState();
  const progress = typeof job.progress === 'number' ? job.progress : 0;
  return { progress, status: state };
}

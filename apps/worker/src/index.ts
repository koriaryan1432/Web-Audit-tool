/**
 * SiteGrade Worker - BullMQ Audit Queue Consumer
 * Concurrency: 2 jobs (each needs ~1 Chrome instance)
 * Retry: 3 attempts with exponential backoff
 */

import { Worker, Queue, type Job } from "bullmq";
import { PrismaClient, AuditStatus } from "@prisma/client";
import IORedis from "ioredis";
import { validateAuditUrl } from "@sitegarde/utils";
import { runLighthouse, LighthouseError } from "./lighthouse/runner";
import type { AuditWorkerJob } from "./lighthouse/types";

const redis = new IORedis(process.env.UPSTASH_REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  tls: process.env.UPSTASH_REDIS_URL?.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
});

const prisma = new PrismaClient();

export const AUDIT_QUEUE_NAME = "sitegarde:audits";

export const auditQueue = new Queue<AuditWorkerJob>(AUDIT_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

const worker = new Worker<AuditWorkerJob>(
  AUDIT_QUEUE_NAME,
  async (job: Job<AuditWorkerJob>) => {
    const { auditId, url, options } = job.data;
    console.info(`[Worker] Starting audit ${auditId} for ${url}`);

    await prisma.audit.update({ where: { id: auditId }, data: { status: AuditStatus.RUNNING } });
    await job.updateProgress(10);

    const validation = await validateAuditUrl(url);
    if (!validation.valid) {
      await markFailed(auditId, `SSRF validation failed: ${validation.error}`);
      throw new Error(`Invalid URL: ${validation.error}`);
    }
    await job.updateProgress(20);

    let lighthouseResult;
    try {
      lighthouseResult = await runLighthouse(validation.sanitizedUrl!, {
        mobile: options.mobile ?? true,
        throttle: true,
        categories: ["performance", "accessibility", "best-practices", "seo"],
        timeoutMs: 60_000,
      });
    } catch (err) {
      const errorCode = err instanceof LighthouseError ? err.code : "UNKNOWN";
      const message = err instanceof Error ? err.message : "Unknown Lighthouse error";
      await markFailed(auditId, `${errorCode}: ${message}`);
      throw err;
    }
    await job.updateProgress(70);

    await prisma.auditResult.create({
      data: {
        auditId,
        performanceScore: lighthouseResult.scores.performance,
        accessibilityScore: lighthouseResult.scores.accessibility,
        seoScore: lighthouseResult.scores.seo,
        bestPracticesScore: lighthouseResult.scores.bestPractices,
        rawLighthouse: lighthouseResult.lhr as object,
        rawAxe: [],
        issues: lighthouseResult.issues as object[],
      },
    });
    await job.updateProgress(90);

    await prisma.audit.update({
      where: { id: auditId },
      data: { status: AuditStatus.COMPLETE, completedAt: new Date() },
    });
    await job.updateProgress(100);

    console.info(`[Worker] Audit ${auditId} complete in ${lighthouseResult.durationMs}ms — P:${lighthouseResult.scores.performance} A:${lighthouseResult.scores.accessibility} S:${lighthouseResult.scores.seo}`);
    return { auditId, scores: lighthouseResult.scores, durationMs: lighthouseResult.durationMs };
  },
  {
    connection: redis,
    concurrency: 2,
    limiter: { max: 10, duration: 60_000 },
  }
);

worker.on("completed", (job) => console.info(`[Worker] Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`[Worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message));
worker.on("error", (err) => console.error("[Worker] Worker error:", err));

async function shutdown() {
  console.info("[Worker] Shutting down gracefully...");
  await worker.close();
  await redis.quit();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

async function markFailed(auditId: string, reason: string) {
  console.error(`[Worker] Marking audit ${auditId} as FAILED: ${reason}`);
  await prisma.audit.update({ where: { id: auditId }, data: { status: AuditStatus.FAILED } });
}

console.info(`SiteGrade Worker started — listening on queue "${AUDIT_QUEUE_NAME}"`);

import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../../lib/prisma.js';
import { validateAuditUrl } from '@sitegarde/utils';
import { runLighthouse } from '../lighthouse/runner.js';
import { extractIssues } from '../lighthouse/extractor.js';
import { runAxe } from '../axe/runner.js';
import type { AuditJobData, AuditJobResult, AuditJobProgress } from './types.js';

const AUDIT_QUEUE_NAME = 'audit';

function createConnection(): IORedis {
  const url = new URL(process.env.UPSTASH_REDIS_URL!);
  return new IORedis({
    host: url.hostname, port: 6380,
    password: process.env.UPSTASH_REDIS_TOKEN,
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null, enableReadyCheck: false,
  });
}

async function processAuditJob(
  job: Job<AuditJobData, AuditJobResult>
): Promise<AuditJobResult> {
  const { auditId, url, options } = job.data;
  const startTime = Date.now();

  const progress = async (stage: AuditJobProgress['stage'], message: string, percent: number) => {
    await job.updateProgress({ stage, message, percent } satisfies AuditJobProgress);
    console.log(`[worker] [${auditId}] ${stage}: ${message} (${percent}%)`);
  };

  try {
    await progress('validating', 'Validating URL', 5);
    await prisma.audit.update({ where: { id: auditId }, data: { status: 'RUNNING' } });

    const validation = await validateAuditUrl(url);
    if (!validation.valid) throw new Error(`URL validation failed: ${validation.error}`);
    const safeUrl = validation.sanitizedUrl!;

    await progress('running_lighthouse', 'Running Lighthouse audit', 20);
    const lighthouseResult = await runLighthouse(safeUrl, {
      categories: options.categories ?? ['performance', 'accessibility', 'best-practices', 'seo'],
      device: options.device ?? 'mobile',
      throttling: options.throttling ?? 'simulated',
    });

    await progress('extracting_issues', 'Extracting issues', 55);
    const issues = extractIssues(lighthouseResult.lhr);

    let axeResult = null;
    if (options.runAxe !== false) {
      await progress('running_axe', 'Running axe-core accessibility scan', 65);
      try { axeResult = await runAxe(safeUrl); }
      catch (axeErr) { console.error(`[worker] [${auditId}] axe-core failed (non-fatal):`, axeErr); }
    }

    await progress('saving_results', 'Saving audit results', 80);
    const auditResult = await prisma.auditResult.create({
      data: {
        auditId,
        performanceScore: lighthouseResult.scores.performance,
        accessibilityScore: lighthouseResult.scores.accessibility,
        seoScore: lighthouseResult.scores.seo,
        bestPracticesScore: lighthouseResult.scores.bestPractices,
        rawLighthouse: lighthouseResult.lhr as object,
        rawAxe: axeResult ? (axeResult as object) : undefined,
        issues: issues as object,
      },
    });

    await prisma.audit.update({
      where: { id: auditId },
      data: { status: 'COMPLETE', completedAt: new Date() },
    });

    await progress('complete', 'Audit complete', 100);
    const durationMs = Date.now() - startTime;
    return { auditId, status: 'COMPLETE', auditResultId: auditResult.id, scores: lighthouseResult.scores, issueCount: issues.length, durationMs };
  } catch (err) {
    console.error(`[worker] [${auditId}] FAILED:`, err instanceof Error ? err.message : err);
    await prisma.audit.update({ where: { id: auditId }, data: { status: 'FAILED' } }).catch(() => {});
    throw err;
  }
}

export function createAuditWorker(): Worker<AuditJobData, AuditJobResult> {
  const connection = createConnection();
  const worker = new Worker<AuditJobData, AuditJobResult>(AUDIT_QUEUE_NAME, processAuditJob, {
    connection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY ?? '2', 10),
    limiter: { max: 10, duration: 60_000 },
  });
  worker.on('completed', (job, result) => console.log(`[worker] Job ${job.id} completed in ${result.durationMs}ms`));
  worker.on('failed', (job, err) => console.error(`[worker] Job ${job?.id} failed:`, err.message));
  worker.on('error', (err) => console.error('[worker] Worker error:', err));
  return worker;
}

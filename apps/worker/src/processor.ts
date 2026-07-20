import type { Job } from 'bullmq';
import type { AuditJobData } from '../../api/src/types/queue.js';
import { prisma } from './lib/db.js';
import { runLighthouse } from './lighthouse/runner.js';
import { runAxeScan } from './scanners/axe-scanner.js';
import { generateRecommendations } from './ai/recommendation-engine.js';

/**
 * Main audit job processor.
 * Called by BullMQ Worker for each job in the audit-queue.
 *
 * Progress milestones:
 *   10% -> Job picked up, audit marked RUNNING
 *   30% -> Lighthouse scan complete
 *   60% -> axe-core scan complete
 *   80% -> AI recommendations generated
 *  100% -> Results persisted, audit marked COMPLETE
 */
export async function processAuditJob(job: Job<AuditJobData>): Promise<void> {
  const { auditId, url, options } = job.data;

  // Mark audit as RUNNING
  await prisma.audit.update({
    where: { id: auditId },
    data: { status: 'RUNNING' },
  });

  await job.updateProgress(10);

  try {
    // Step 1: Lighthouse scan
    console.log(`[worker] [${auditId}] Starting Lighthouse scan for ${url}`);
    const lighthouseResult = await runLighthouse(url, {
      categories: options.categories,
      device: options.device,
      throttling: options.throttling,
    });
    await job.updateProgress(30);

    // Step 2: axe-core accessibility scan
    console.log(`[worker] [${auditId}] Starting axe-core scan`);
    const axeResult = await runAxeScan(url);
    await job.updateProgress(60);

    // Step 3: Merge issues and generate AI recommendations
    console.log(`[worker] [${auditId}] Generating AI recommendations`);
    const allIssues = [
      ...lighthouseResult.issues,
      ...axeResult.violations.map((v) => ({
        id: v.id,
        title: v.description,
        description: v.help,
        score: 0,
        weight: v.impact === 'critical' ? 10 : v.impact === 'serious' ? 5 : 2,
        category: 'accessibility' as const,
        impact: (['critical', 'serious'].includes(v.impact ?? '')
          ? v.impact === 'critical' ? 'critical' : 'high'
          : 'medium') as 'critical' | 'high' | 'medium' | 'low',
      })),
    ];

    const aiRecommendations = await generateRecommendations(allIssues);
    await job.updateProgress(80);

    // Step 4: Persist all results in a transaction
    console.log(`[worker] [${auditId}] Persisting results`);
    await prisma.$transaction(async (tx) => {
      const auditResult = await tx.auditResult.create({
        data: {
          auditId,
          performanceScore: lighthouseResult.scores.performance,
          accessibilityScore: Math.min(
            lighthouseResult.scores.accessibility,
            axeResult.score
          ),
          seoScore: lighthouseResult.scores.seo,
          bestPracticesScore: lighthouseResult.scores['best-practices'],
          rawLighthouse: lighthouseResult.lhr as object,
          rawAxe: axeResult as object,
          issues: allIssues as object,
        },
      });

      if (aiRecommendations.topIssues.length > 0) {
        await tx.aiRecommendation.createMany({
          data: aiRecommendations.topIssues.map((rec) => ({
            auditResultId: auditResult.id,
            category: rec.category ?? 'general',
            severity: rec.severity.toUpperCase() as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
            title: rec.title,
            description: rec.impact,
            fixSuggestion: rec.fix,
            cacheKey: `${auditId}:${rec.title.slice(0, 32)}`,
          })),
          skipDuplicates: true,
        });
      }

      await tx.audit.update({
        where: { id: auditId },
        data: { status: 'COMPLETE', completedAt: new Date() },
      });
    });

    await job.updateProgress(100);
    console.log(`[worker] [${auditId}] Audit complete`);
  } catch (err) {
    console.error(`[worker] [${auditId}] Audit failed:`, err);

    await prisma.audit
      .update({ where: { id: auditId }, data: { status: 'FAILED' } })
      .catch((dbErr) => {
        console.error(`[worker] [${auditId}] Failed to update audit status:`, dbErr);
      });

    throw err; // Re-throw so BullMQ handles retry with exponential backoff
  }
}

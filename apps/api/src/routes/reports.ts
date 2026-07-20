import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { planGuard } from '../middleware/plan-guard';
import { NotFoundError, ForbiddenError, AppError } from '../lib/errors';
import crypto from 'crypto';

const reportsRouter = new Hono();

// GET /api/v1/reports/:shareToken — public, no auth required
reportsRouter.get('/:shareToken', async (c) => {
  const { shareToken } = c.req.param();

  const report = await prisma.report.findUnique({
    where: { shareToken },
    include: {
      audit: {
        include: {
          auditResult: true,
          aiRecommendations: { orderBy: { severity: 'asc' }, take: 10 },
        },
      },
    },
  });

  if (!report) throw new NotFoundError('Report not found');
  if (!report.isPublic) throw new ForbiddenError('This report is private');
  if (report.expiresAt && report.expiresAt < new Date()) {
    throw new AppError('This report link has expired', 410, 'REPORT_EXPIRED');
  }

  return c.json({
    data: {
      id: report.id,
      shareToken: report.shareToken,
      pdfUrl: report.pdfUrl,
      createdAt: report.createdAt.toISOString(),
      expiresAt: report.expiresAt?.toISOString() ?? null,
      audit: {
        id: report.audit.id,
        url: report.audit.url,
        completedAt: report.audit.completedAt?.toISOString() ?? null,
        scores: {
          performance: report.audit.auditResult?.performanceScore ?? null,
          accessibility: report.audit.auditResult?.accessibilityScore ?? null,
          seo: report.audit.auditResult?.seoScore ?? null,
          bestPractices: report.audit.auditResult?.bestPracticesScore ?? null,
        },
        issues: report.audit.auditResult?.issues ?? [],
        aiRecommendations: report.audit.aiRecommendations,
      },
    },
  });
});

// POST /api/v1/audits/:id/report — generate shareable report link (PRO+)
reportsRouter.post('/audits/:id/report', authMiddleware, planGuard('PRO'), async (c) => {
  const user = c.get('user');
  const { id: auditId } = c.req.param();

  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    select: { id: true, userId: true, status: true },
  });

  if (!audit) throw new NotFoundError('Audit not found');
  if (audit.userId !== user.id) throw new ForbiddenError('Access denied');
  if (audit.status !== 'COMPLETE') {
    throw new AppError('Audit must be complete before generating a report', 400, 'AUDIT_NOT_COMPLETE');
  }

  const shareToken = crypto.randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const report = await prisma.report.upsert({
    where: { auditId },
    create: { auditId, userId: user.id, shareToken, isPublic: true, expiresAt },
    update: { shareToken, isPublic: true, expiresAt },
  });

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

  return c.json({
    data: {
      reportId: report.id,
      shareToken: report.shareToken,
      shareUrl: `${appUrl}/reports/${report.shareToken}`,
      expiresAt: report.expiresAt?.toISOString() ?? null,
    },
  }, 201);
});

// POST /api/v1/audits/:id/pdf — trigger async PDF generation (PRO+)
reportsRouter.post('/audits/:id/pdf', authMiddleware, planGuard('PRO'), async (c) => {
  const user = c.get('user');
  const { id: auditId } = c.req.param();

  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    select: { id: true, userId: true, status: true },
  });

  if (!audit) throw new NotFoundError('Audit not found');
  if (audit.userId !== user.id) throw new ForbiddenError('Access denied');
  if (audit.status !== 'COMPLETE') {
    throw new AppError('Audit must be complete before generating PDF', 400, 'AUDIT_NOT_COMPLETE');
  }

  // Lazy-import to avoid circular deps
  const { Queue } = await import('bullmq');
  const { getRedisConnection } = await import('../lib/redis');

  const pdfQueue = new Queue('pdf-queue', { connection: getRedisConnection() });
  const job = await pdfQueue.add(
    'generate-pdf',
    { auditId, userId: user.id },
    {
      jobId: `pdf-${auditId}`, // idempotent — same audit won't queue twice
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 86400 * 7 },
    }
  );

  return c.json({
    data: {
      jobId: job.id,
      status: 'generating',
      message: 'PDF generation queued. Check back in 30-60 seconds.',
    },
  }, 202);
});

// GET /api/v1/audits/:id/pdf — check PDF status / get URL
reportsRouter.get('/audits/:id/pdf', authMiddleware, async (c) => {
  const user = c.get('user');
  const { id: auditId } = c.req.param();

  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    select: { userId: true },
  });

  if (!audit) throw new NotFoundError('Audit not found');
  if (audit.userId !== user.id) throw new ForbiddenError('Access denied');

  const report = await prisma.report.findUnique({
    where: { auditId },
    select: { pdfUrl: true, createdAt: true },
  });

  if (!report || !report.pdfUrl) {
    return c.json({ data: { status: 'generating', pdfUrl: null } });
  }

  return c.json({
    data: {
      status: 'ready',
      pdfUrl: report.pdfUrl,
      generatedAt: report.createdAt.toISOString(),
    },
  });
});

export { reportsRouter };

import { Hono } from 'hono';
import { randomBytes } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireFeature } from '../middleware/plan-guard.js';

const reportsRouter = new Hono();

// POST /api/v1/audits/:id/report — generate shareable link (PRO+ only)
reportsRouter.post('/audits/:id/report', authMiddleware, requireFeature('publicReports'), async (c) => {
  const user = c.get('user');
  const auditId = c.req.param('id');

  const audit = await prisma.audit.findFirst({ where: { id: auditId, userId: user.id }, select: { id: true, status: true } });
  if (!audit) return c.json({ error: 'Audit not found' }, 404);
  if (audit.status !== 'COMPLETE') return c.json({ error: 'Report can only be generated for completed audits', status: audit.status }, 409);

  const existing = await prisma.report.findFirst({
    where: { auditId, isPublic: true, expiresAt: { gt: new Date() } },
    select: { id: true, shareToken: true, expiresAt: true },
  });

  if (existing) {
    return c.json({ reportId: existing.id, shareToken: existing.shareToken, shareUrl: buildShareUrl(c.req.url, existing.shareToken), expiresAt: existing.expiresAt, message: 'Existing report link returned (still valid)' });
  }

  const shareToken = randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const report = await prisma.report.create({
    data: { auditId, userId: user.id, shareToken, isPublic: true, expiresAt },
    select: { id: true, shareToken: true, expiresAt: true, createdAt: true },
  });

  return c.json({ reportId: report.id, shareToken: report.shareToken, shareUrl: buildShareUrl(c.req.url, report.shareToken), expiresAt: report.expiresAt, createdAt: report.createdAt }, 201);
});

// GET /api/v1/reports/:shareToken — public, no auth required
reportsRouter.get('/reports/:shareToken', async (c) => {
  const shareToken = c.req.param('shareToken');

  const report = await prisma.report.findUnique({
    where: { shareToken },
    include: {
      audit: {
        include: {
          auditResult: {
            include: {
              aiRecommendations: {
                orderBy: [{ severity: 'asc' }, { category: 'asc' }],
                select: { id: true, category: true, severity: true, title: true, description: true, fixSuggestion: true },
              },
            },
          },
        },
      },
    },
  });

  if (!report) return c.json({ error: 'Report not found' }, 404);
  if (!report.isPublic) return c.json({ error: 'This report is not publicly accessible' }, 403);
  if (report.expiresAt && report.expiresAt < new Date()) return c.json({ error: 'This report link has expired', expiredAt: report.expiresAt }, 410);

  return c.json({
    data: {
      url: report.audit.url,
      auditedAt: report.audit.completedAt,
      scores: {
        performance: report.audit.auditResult?.performanceScore,
        accessibility: report.audit.auditResult?.accessibilityScore,
        seo: report.audit.auditResult?.seoScore,
        bestPractices: report.audit.auditResult?.bestPracticesScore,
      },
      issues: report.audit.auditResult?.issues,
      recommendations: report.audit.auditResult?.aiRecommendations ?? [],
      expiresAt: report.expiresAt,
    },
  });
});

function buildShareUrl(requestUrl: string, shareToken: string): string {
  try {
    const url = new URL(requestUrl);
    return `${url.protocol}//${url.host}/api/v1/reports/${shareToken}`;
  } catch { return `/api/v1/reports/${shareToken}`; }
}

export { reportsRouter };

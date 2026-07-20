import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { dispatchAuditJob } from '../lib/queue.js';
import { authMiddleware } from '../middleware/auth.js';
import { auditQuotaGuard } from '../middleware/plan-guard.js';
import { validateAuditUrl } from '@sitegarde/utils';

const auditsRouter = new Hono();

const createAuditSchema = z.object({
  url: z.string().url('Must be a valid URL').max(2048),
  options: z.object({
    categories: z.array(z.enum(['performance', 'accessibility', 'best-practices', 'seo'])).optional(),
    runAxe: z.boolean().optional().default(true),
    generateAiRecommendations: z.boolean().optional().default(false),
    device: z.enum(['mobile', 'desktop']).optional().default('mobile'),
    throttling: z.enum(['simulated', 'devtools', 'none']).optional().default('simulated'),
  }).optional().default({}),
  orgId: z.string().uuid().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// POST /api/v1/audits
auditsRouter.post('/', authMiddleware, auditQuotaGuard, zValidator('json', createAuditSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');

  const validation = await validateAuditUrl(body.url);
  if (!validation.valid) return c.json({ error: 'Invalid URL', detail: validation.error }, 400);

  const safeUrl = validation.sanitizedUrl!;
  const audit = await prisma.audit.create({
    data: { url: safeUrl, userId: user.id, orgId: body.orgId ?? null, status: 'QUEUED', options: body.options as object },
    select: { id: true, url: true, status: true, createdAt: true, options: true },
  });

  await dispatchAuditJob({ auditId: audit.id, url: safeUrl, userId: user.id, orgId: body.orgId, options: body.options });

  return c.json({ auditId: audit.id, url: audit.url, status: audit.status, createdAt: audit.createdAt, message: 'Audit queued. Poll GET /api/v1/audits/:id for status.' }, 202);
});

// GET /api/v1/audits
auditsRouter.get('/', authMiddleware, zValidator('query', paginationSchema), async (c) => {
  const user = c.get('user');
  const { page, limit } = c.req.valid('query');
  const skip = (page - 1) * limit;

  const [audits, total] = await Promise.all([
    prisma.audit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
      select: {
        id: true, url: true, status: true, createdAt: true, completedAt: true,
        auditResult: { select: { performanceScore: true, accessibilityScore: true, seoScore: true, bestPracticesScore: true } },
      },
    }),
    prisma.audit.count({ where: { userId: user.id } }),
  ]);

  return c.json({ data: audits, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } });
});

// GET /api/v1/audits/:id
auditsRouter.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const auditId = c.req.param('id');

  const audit = await prisma.audit.findFirst({
    where: { id: auditId, userId: user.id },
    include: {
      auditResult: { include: { aiRecommendations: { orderBy: [{ severity: 'asc' }, { category: 'asc' }] } } },
      reports: { select: { id: true, shareToken: true, isPublic: true, expiresAt: true, createdAt: true } },
    },
  });

  if (!audit) return c.json({ error: 'Audit not found' }, 404);
  return c.json({ data: audit });
});

// DELETE /api/v1/audits/:id
auditsRouter.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const auditId = c.req.param('id');

  const audit = await prisma.audit.findFirst({ where: { id: auditId, userId: user.id }, select: { id: true, status: true } });
  if (!audit) return c.json({ error: 'Audit not found' }, 404);
  if (audit.status === 'RUNNING') return c.json({ error: 'Cannot delete a running audit.' }, 409);

  await prisma.audit.delete({ where: { id: auditId } });
  return c.json({ message: 'Audit deleted' }, 200);
});

export { auditsRouter };

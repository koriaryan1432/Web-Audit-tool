import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../lib/prisma.js';
import { enqueueAudit, getJobProgress } from '../lib/queue.js';
import { validateAuditUrl } from '@sitegarde/utils';
import {
  CreateAuditSchema,
  ListAuditsSchema,
  AuditIdSchema,
  GenerateReportSchema,
} from '../lib/validators.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimitMiddleware } from '../middleware/rate-limit.js';
import { planGuard } from '../middleware/plan-guard.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../lib/errors.js';
import type { AppVariables } from '../types/auth.js';
import { DEFAULT_AUDIT_OPTIONS } from '../types/queue.js';
import { randomUUID } from 'crypto';

const audits = new Hono<{ Variables: AppVariables }>();

// All audit routes require authentication
audits.use('*', authMiddleware);

/**
 * POST /api/v1/audits
 * Create and enqueue a new audit.
 */
audits.post(
  '/',
  rateLimitMiddleware,
  zValidator('json', CreateAuditSchema, (result, c) => {
    if (!result.success) {
      throw new ValidationError('Invalid request body', result.error.flatten());
    }
  }),
  async (c) => {
    const user = c.get('user');
    const { url, options } = c.req.valid('json');

    // SSRF validation
    const validation = await validateAuditUrl(url);
    if (!validation.valid) {
      throw new ValidationError(validation.error ?? 'Invalid URL', { url });
    }

    const sanitizedUrl = validation.sanitizedUrl ?? url;
    const auditId = randomUUID();

    // Create audit record
    await prisma.audit.create({
      data: {
        id: auditId,
        url: sanitizedUrl,
        userId: user.id,
        status: 'QUEUED',
        options: options as object,
      },
    });

    // Enqueue job
    const { jobId, queuePosition } = await enqueueAudit({
      auditId,
      url: sanitizedUrl,
      userId: user.id,
      options: { ...DEFAULT_AUDIT_OPTIONS, ...options },
    });

    const estimatedSeconds = Math.max(30, queuePosition * 45);

    return c.json(
      {
        auditId,
        jobId,
        status: 'QUEUED',
        url: sanitizedUrl,
        estimatedTime: estimatedSeconds,
        queuePosition,
      },
      201
    );
  }
);

/**
 * GET /api/v1/audits
 * Paginated list of audits for the authenticated user.
 */
audits.get(
  '/',
  zValidator('query', ListAuditsSchema, (result, c) => {
    if (!result.success) {
      throw new ValidationError('Invalid query parameters', result.error.flatten());
    }
  }),
  async (c) => {
    const user = c.get('user');
    const { page, limit, status, sort, order } = c.req.valid('query');

    const where = {
      userId: user.id,
      ...(status && { status }),
    };

    const [total, data] = await Promise.all([
      prisma.audit.count({ where }),
      prisma.audit.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          result: {
            select: {
              performanceScore: true,
              accessibilityScore: true,
              seoScore: true,
              bestPracticesScore: true,
            },
          },
        },
      }),
    ]);

    return c.json({
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
);

/**
 * GET /api/v1/audits/:id
 * Single audit with full results and live progress if running.
 */
audits.get(
  '/:id',
  zValidator('param', AuditIdSchema, (result, c) => {
    if (!result.success) throw new ValidationError('Invalid audit ID');
  }),
  async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');

    const audit = await prisma.audit.findUnique({
      where: { id },
      include: {
        result: {
          include: { recommendations: true },
        },
      },
    });

    if (!audit) throw new NotFoundError('Audit not found');
    if (audit.userId !== user.id) throw new ForbiddenError('Access denied');

    let progress: { progress: number; status: string } | null = null;
    if (audit.status === 'RUNNING' || audit.status === 'QUEUED') {
      progress = await getJobProgress(id);
    }

    return c.json({ ...audit, progress });
  }
);

/**
 * DELETE /api/v1/audits/:id
 * Soft delete — owner only.
 */
audits.delete(
  '/:id',
  zValidator('param', AuditIdSchema, (result, c) => {
    if (!result.success) throw new ValidationError('Invalid audit ID');
  }),
  async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');

    const audit = await prisma.audit.findUnique({ where: { id } });
    if (!audit) throw new NotFoundError('Audit not found');
    if (audit.userId !== user.id) throw new ForbiddenError('Access denied');

    await prisma.audit.delete({ where: { id } });

    return c.json({ success: true, deletedId: id });
  }
);

/**
 * POST /api/v1/audits/:id/report
 * Generate a shareable report link. PRO+ only.
 */
audits.post(
  '/:id/report',
  planGuard('PRO'),
  zValidator('param', AuditIdSchema, (result, c) => {
    if (!result.success) throw new ValidationError('Invalid audit ID');
  }),
  zValidator('json', GenerateReportSchema, (result, c) => {
    if (!result.success) {
      throw new ValidationError('Invalid request body', result.error.flatten());
    }
  }),
  async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const { expiresInDays, isPublic } = c.req.valid('json');

    const audit = await prisma.audit.findUnique({
      where: { id },
      include: { result: true },
    });

    if (!audit) throw new NotFoundError('Audit not found');
    if (audit.userId !== user.id) throw new ForbiddenError('Access denied');
    if (audit.status !== 'COMPLETE') {
      throw new ValidationError('Audit must be complete before generating a report');
    }

    const shareToken = randomUUID().replace(/-/g, '');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const report = await prisma.report.upsert({
      where: { auditId: id },
      create: {
        auditId: id,
        userId: user.id,
        shareToken,
        isPublic,
        expiresAt,
      },
      update: {
        shareToken,
        isPublic,
        expiresAt,
      },
    });

    return c.json({
      reportId: report.id,
      shareToken: report.shareToken,
      shareUrl: `/reports/${report.shareToken}`,
      expiresAt: report.expiresAt,
      isPublic: report.isPublic,
    });
  }
);

export { audits };

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../lib/prisma.js';
import { ShareTokenSchema } from '../lib/validators.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../lib/errors.js';

const reports = new Hono();

/**
 * GET /api/v1/reports/:shareToken
 * Public endpoint — no auth required.
 * Returns full audit results for a shared report.
 */
reports.get(
  '/:shareToken',
  zValidator('param', ShareTokenSchema, (result, c) => {
    if (!result.success) throw new ValidationError('Invalid share token');
  }),
  async (c) => {
    const { shareToken } = c.req.valid('param');

    const report = await prisma.report.findUnique({
      where: { shareToken },
      include: {
        audit: {
          include: {
            result: {
              include: { recommendations: true },
            },
          },
        },
      },
    });

    if (!report) throw new NotFoundError('Report not found');

    if (!report.isPublic) {
      throw new ForbiddenError('This report is private');
    }

    if (report.expiresAt && report.expiresAt < new Date()) {
      throw new NotFoundError('This report has expired');
    }

    // Return sanitized report — no user PII
    return c.json({
      reportId: report.id,
      shareToken: report.shareToken,
      createdAt: report.createdAt,
      expiresAt: report.expiresAt,
      audit: {
        id: report.audit.id,
        url: report.audit.url,
        status: report.audit.status,
        createdAt: report.audit.createdAt,
        completedAt: report.audit.completedAt,
        result: report.audit.result,
      },
    });
  }
);

export { reports };

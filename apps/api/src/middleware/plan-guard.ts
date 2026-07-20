import type { Context, Next } from 'hono';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { Plan } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    auditsPerMonth: 5,
    auditsPerDay: 2,
    maxConcurrentAudits: 1,
    aiRecommendations: false,
    pdfExport: false,
    publicReports: false,
    apiAccess: false,
    teamMembers: 1,
  },
  PRO: {
    auditsPerMonth: 100,
    auditsPerDay: 20,
    maxConcurrentAudits: 3,
    aiRecommendations: true,
    pdfExport: true,
    publicReports: true,
    apiAccess: true,
    teamMembers: 1,
  },
  AGENCY: {
    auditsPerMonth: 1000,
    auditsPerDay: 100,
    maxConcurrentAudits: 10,
    aiRecommendations: true,
    pdfExport: true,
    publicReports: true,
    apiAccess: true,
    teamMembers: 25,
  },
};

export type PlanLimits = {
  auditsPerMonth: number;
  auditsPerDay: number;
  maxConcurrentAudits: number;
  aiRecommendations: boolean;
  pdfExport: boolean;
  publicReports: boolean;
  apiAccess: boolean;
  teamMembers: number;
};

export type Feature = keyof Pick<PlanLimits, 'aiRecommendations' | 'pdfExport' | 'publicReports' | 'apiAccess'>;

export function requirePlan(minimumPlan: Plan) {
  const planOrder: Plan[] = ['FREE', 'PRO', 'AGENCY'];
  return createMiddleware(async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!user) throw new HTTPException(401, { message: 'Authentication required' });
    const userPlanIndex = planOrder.indexOf(user.plan);
    const requiredPlanIndex = planOrder.indexOf(minimumPlan);
    if (userPlanIndex < requiredPlanIndex) {
      throw new HTTPException(403, {
        message: `This feature requires the ${minimumPlan} plan. You are on ${user.plan}.`,
      });
    }
    await next();
  });
}

export function requireFeature(feature: Feature) {
  return createMiddleware(async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!user) throw new HTTPException(401, { message: 'Authentication required' });
    const limits = PLAN_LIMITS[user.plan];
    if (!limits[feature]) {
      throw new HTTPException(403, {
        message: `Feature '${feature}' is not available on the ${user.plan} plan. Upgrade to PRO or AGENCY.`,
      });
    }
    await next();
  });
}

export const auditQuotaGuard = createMiddleware(async (c: Context, next: Next) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Authentication required' });
  const limits = PLAN_LIMITS[user.plan];
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [monthCount, dayCount] = await Promise.all([
    prisma.audit.count({ where: { userId: user.id, createdAt: { gte: startOfMonth } } }),
    prisma.audit.count({ where: { userId: user.id, createdAt: { gte: startOfDay } } }),
  ]);
  if (monthCount >= limits.auditsPerMonth) {
    throw new HTTPException(429, {
      message: `Monthly audit limit reached (${limits.auditsPerMonth} audits/month on ${user.plan} plan).`,
    });
  }
  if (dayCount >= limits.auditsPerDay) {
    throw new HTTPException(429, {
      message: `Daily audit limit reached (${limits.auditsPerDay} audits/day on ${user.plan} plan).`,
    });
  }
  await next();
});

export const apiAccessGuard = requireFeature('apiAccess');

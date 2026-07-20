import type { Context } from 'hono';

export type Plan = 'FREE' | 'PRO' | 'AGENCY';

export interface AuthUser {
  id: string;
  email: string;
  plan: Plan;
  orgId?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  app_metadata?: {
    plan?: Plan;
    org_id?: string;
  };
  exp: number;
  iat: number;
}

export const PLAN_LIMITS: Record<Plan, { auditsPerDay: number }> = {
  FREE: { auditsPerDay: 10 },
  PRO: { auditsPerDay: 100 },
  AGENCY: { auditsPerDay: Infinity },
};

export const PLAN_HIERARCHY: Record<Plan, number> = {
  FREE: 0,
  PRO: 1,
  AGENCY: 2,
};

// Extend Hono context variables
export type AppVariables = {
  user: AuthUser;
};

export type AppContext = Context<{ Variables: AppVariables }>;

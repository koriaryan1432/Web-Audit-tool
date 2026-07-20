import type { MiddlewareHandler } from 'hono';
import type { AppVariables, Plan } from '../types/auth.js';
import { PLAN_HIERARCHY } from '../types/auth.js';
import { ForbiddenError } from '../lib/errors.js';

/**
 * Composable plan-gating middleware.
 * Usage: app.use('/api/v1/reports', planGuard('PRO'))
 *
 * Returns 403 if the authenticated user's plan is below the required tier.
 */
export function planGuard(
  requiredPlan: Plan
): MiddlewareHandler<{ Variables: AppVariables }> {
  return async (c, next) => {
    const user = c.get('user');

    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    const userLevel = PLAN_HIERARCHY[user.plan];
    const requiredLevel = PLAN_HIERARCHY[requiredPlan];

    if (userLevel < requiredLevel) {
      throw new ForbiddenError(
        `This feature requires the ${requiredPlan} plan or higher. ` +
          `Your current plan is ${user.plan}.`,
        'PLAN_UPGRADE_REQUIRED'
      );
    }

    await next();
  };
}

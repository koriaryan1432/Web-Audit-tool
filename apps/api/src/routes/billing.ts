import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { stripe } from '../lib/stripe';
import { getOrCreateStripeCustomer } from '../services/billing';
import { authMiddleware } from '../middleware/auth';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';

const billingRouter = new Hono();

const checkoutSchema = z.object({
  plan: z.enum(['PRO', 'AGENCY']),
});

// POST /api/v1/billing/checkout
billingRouter.post('/checkout', authMiddleware, zValidator('json', checkoutSchema), async (c) => {
  const user = c.get('user');
  const { plan } = c.req.valid('json');

  const priceId =
    plan === 'PRO'
      ? process.env.STRIPE_PRO_PRICE_ID
      : process.env.STRIPE_AGENCY_PRICE_ID;

  if (!priceId) {
    throw new AppError(`Price ID for plan ${plan} is not configured`, 500, 'PRICE_NOT_CONFIGURED');
  }

  const customerId = await getOrCreateStripeCustomer(user.id);
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard/settings/billing?canceled=true`,
    metadata: { userId: user.id, plan },
    subscription_data: { metadata: { userId: user.id, plan } },
    allow_promotion_codes: true,
  });

  return c.json({ checkoutUrl: session.url });
});

// GET /api/v1/billing/portal
billingRouter.get('/portal', authMiddleware, async (c) => {
  const user = c.get('user');
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  const customerId = await getOrCreateStripeCustomer(user.id);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard/settings/billing`,
  });

  return c.json({ portalUrl: session.url });
});

// GET /api/v1/billing/subscription
billingRouter.get('/subscription', authMiddleware, async (c) => {
  const user = c.get('user');

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
    select: {
      plan: true,
      status: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });

  if (!subscription) {
    return c.json({ plan: 'FREE', status: 'ACTIVE', currentPeriodEnd: null, cancelAtPeriodEnd: false });
  }

  return c.json({
    plan: subscription.plan,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
  });
});

export { billingRouter };

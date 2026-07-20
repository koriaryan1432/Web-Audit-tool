import { Plan, PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { stripe } from '../lib/stripe';

const prisma = new PrismaClient();

// Map Stripe price IDs to SiteGrade plan enum
export function getPlanFromPriceId(priceId: string): Plan {
  const priceMap: Record<string, Plan> = {
    [process.env.STRIPE_PRO_PRICE_ID!]: Plan.PRO,
    [process.env.STRIPE_AGENCY_PRICE_ID!]: Plan.AGENCY,
  };
  return priceMap[priceId] ?? Plan.FREE;
}

// Find or create a Stripe customer for a user
export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: {
      userId: user.id,
      source: 'sitegarde',
    },
  });

  // Persist stripe_customer_id
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// Upsert subscription record and update user plan
export async function syncSubscriptionToDb(
  subscription: Stripe.Subscription,
  userId: string
): Promise<void> {
  const priceId = subscription.items.data[0]?.price.id;
  const plan = priceId ? getPlanFromPriceId(priceId) : Plan.FREE;

  const subscriptionData = {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    plan,
    status: subscription.status.toUpperCase() as any,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        ...subscriptionData,
      },
      update: subscriptionData,
    }),
    prisma.user.update({
      where: { id: userId },
      data: { plan },
    }),
  ]);
}

// Downgrade user to FREE plan when subscription is cancelled
export async function downgradeToFree(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { plan: Plan.FREE },
    }),
    prisma.subscription.updateMany({
      where: { userId },
      data: { status: 'CANCELED' as any, plan: Plan.FREE },
    }),
  ]);
}

// Mark subscription as past_due on payment failure
export async function markSubscriptionPastDue(stripeCustomerId: string): Promise<void> {
  await prisma.subscription.updateMany({
    where: { stripeCustomerId },
    data: { status: 'PAST_DUE' as any },
  });
}

// Get user ID from Stripe customer ID
export async function getUserIdFromCustomer(stripeCustomerId: string): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId },
    select: { id: true },
  });
  return user?.id ?? null;
}

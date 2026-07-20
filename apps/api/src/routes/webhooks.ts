import { Hono } from 'hono';
import Stripe from 'stripe';
import { stripe } from '../lib/stripe';
import {
  syncSubscriptionToDb,
  downgradeToFree,
  markSubscriptionPastDue,
  getUserIdFromCustomer,
  getPlanFromPriceId,
} from '../services/billing';

const webhooksRouter = new Hono();

// In-memory idempotency set (use Redis in production for multi-instance)
const processedEvents = new Set<string>();

// POST /api/v1/webhooks/stripe
// IMPORTANT: No JSON body parsing — raw body required for Stripe signature verification
webhooksRouter.post('/stripe', async (c) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return c.json({ error: 'Webhook secret not configured' }, 500);
  }

  const signature = c.req.header('stripe-signature');
  if (!signature) {
    return c.json({ error: 'Missing stripe-signature header' }, 400);
  }

  // Read raw body for signature verification
  const rawBody = await c.req.raw.arrayBuffer();
  const bodyBuffer = Buffer.from(rawBody);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(bodyBuffer, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Webhook] Signature verification failed: ${message}`);
    return c.json({ error: `Webhook signature verification failed: ${message}` }, 400);
  }

  // Return 200 immediately, process async
  processWebhookEvent(event).catch((err) => {
    console.error(`[Webhook] Async processing error for ${event.id}:`, err);
  });

  return c.json({ received: true, eventId: event.id });
});

async function processWebhookEvent(event: Stripe.Event): Promise<void> {
  if (processedEvents.has(event.id)) {
    console.log(`[Webhook] Event ${event.id} already processed, skipping`);
    return;
  }

  console.log(`[Webhook] Processing: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;
        const userId = session.metadata?.userId;
        if (!userId) { console.error('[Webhook] Missing userId in metadata'); break; }
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        await syncSubscriptionToDb(subscription, userId);
        const priceId = subscription.items.data[0]?.price.id;
        const plan = priceId ? getPlanFromPriceId(priceId) : 'FREE';
        console.log(`[Webhook] User ${userId} upgraded to ${plan}`);
        try {
          const { sendPlanUpgradedEmail } = await import('../emails/plan-upgraded');
          sendPlanUpgradedEmail(userId, plan as any).catch(console.error);
        } catch { /* email is non-critical */ }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await getUserIdFromCustomer(subscription.customer as string);
        if (!userId) { console.error(`[Webhook] No user for customer ${subscription.customer}`); break; }
        await syncSubscriptionToDb(subscription, userId);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await getUserIdFromCustomer(subscription.customer as string);
        if (!userId) { console.error(`[Webhook] No user for customer ${subscription.customer}`); break; }
        await downgradeToFree(userId);
        console.log(`[Webhook] User ${userId} downgraded to FREE`);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await markSubscriptionPastDue(invoice.customer as string);
        console.log(`[Webhook] Payment failed for customer ${invoice.customer}`);
        break;
      }
      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    processedEvents.add(event.id);
    if (processedEvents.size > 1000) {
      const first = processedEvents.values().next().value;
      if (first) processedEvents.delete(first);
    }
  } catch (err) {
    console.error(`[Webhook] Error processing ${event.id}:`, err);
    throw err;
  }
}

export { webhooksRouter };

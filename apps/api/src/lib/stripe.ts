/**
 * Stripe client — gracefully stubbed when STRIPE_SECRET_KEY is not set.
 * The app boots and all non-billing routes work normally without Stripe keys.
 * Billing endpoints return 503 "Billing not configured" when the key is absent.
 */
import Stripe from 'stripe';

export const STRIPE_ENABLED = Boolean(process.env.STRIPE_SECRET_KEY);

// Lazy singleton — only instantiated when STRIPE_ENABLED is true
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!STRIPE_ENABLED) {
    throw new Error(
      'Stripe is not configured. Set STRIPE_SECRET_KEY to enable billing.'
    );
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-06-20',
      typescript: true,
      appInfo: {
        name: 'SiteGrade',
        version: '1.0.0',
        url: 'https://sitegade.app',
      },
    });
  }
  return _stripe;
}

// Named export kept for backward-compat — throws if Stripe not configured
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

export default stripe;

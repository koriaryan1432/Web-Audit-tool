import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
  appInfo: {
    name: 'SiteGrade',
    version: '1.0.0',
    url: 'https://sitegarde.app',
  },
});

export default stripe;

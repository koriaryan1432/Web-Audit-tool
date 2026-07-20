'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface SubscriptionData {
  plan: 'FREE' | 'PRO' | 'AGENCY';
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

const PLAN_DETAILS = {
  FREE: {
    name: 'Free',
    price: '$0',
    color: 'bg-gray-100 text-gray-700',
    features: ['10 audits/day', 'Basic reports', 'Performance + Accessibility'],
  },
  PRO: {
    name: 'Pro',
    price: '$29/mo',
    color: 'bg-indigo-100 text-indigo-700',
    features: ['100 audits/day', 'PDF reports', 'AI recommendations', 'Share links', 'Priority support'],
  },
  AGENCY: {
    name: 'Agency',
    price: '$99/mo',
    color: 'bg-purple-100 text-purple-700',
    features: ['Unlimited audits', 'Team management', 'White-label reports', 'API access', 'Dedicated support'],
  },
};

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    apiClient.billing.getSubscription()
      .then(setSubscription)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(plan: 'PRO' | 'AGENCY') {
    setUpgrading(plan);
    try {
      const { checkoutUrl } = await apiClient.billing.createCheckout(plan);
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Checkout failed:', err);
      setUpgrading(null);
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const { portalUrl } = await apiClient.billing.getPortal();
      window.location.href = portalUrl;
    } catch (err) {
      console.error('Portal failed:', err);
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-32 bg-gray-200 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-gray-200 rounded" />)}
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.plan ?? 'FREE';
  const planDetails = PLAN_DETAILS[currentPlan];
  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-500 mt-1">Manage your SiteGrade plan and payment details.</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Current Plan</p>
            <div className="flex items-center gap-3 mt-2">
              <h2 className="text-3xl font-bold text-gray-900">{planDetails.name}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${planDetails.color}`}>
                {planDetails.price}
              </span>
            </div>
            {periodEnd && (
              <p className="mt-2 text-sm text-gray-500">
                {subscription?.cancelAtPeriodEnd ? `⚠️ Cancels on ${periodEnd}` : `Renews on ${periodEnd}`}
              </p>
            )}
          </div>
          {currentPlan !== 'FREE' && (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {portalLoading ? 'Loading...' : 'Manage Subscription'}
            </button>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {planDetails.features.map((f) => (
            <span key={f} className="px-3 py-1 bg-gray-50 text-gray-600 text-sm rounded-full border border-gray-200">✓ {f}</span>
          ))}
        </div>
      </div>

      {subscription?.cancelAtPeriodEnd && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-amber-500 text-xl">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800">Subscription Cancelling</p>
            <p className="text-sm text-amber-700 mt-1">
              Your {currentPlan} plan will end on {periodEnd}. Click "Manage Subscription" to reactivate.
            </p>
          </div>
        </div>
      )}

      {/* Plan Comparison */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.entries(PLAN_DETAILS) as [keyof typeof PLAN_DETAILS, typeof PLAN_DETAILS['FREE']][]).map(([planKey, details]) => {
            const isCurrent = planKey === currentPlan;
            const isUpgrade =
              (currentPlan === 'FREE' && (planKey === 'PRO' || planKey === 'AGENCY')) ||
              (currentPlan === 'PRO' && planKey === 'AGENCY');

            return (
              <div key={planKey} className={`relative bg-white border-2 rounded-xl p-6 transition-all ${
                isCurrent ? 'border-indigo-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
              }`}>
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">CURRENT PLAN</span>
                  </div>
                )}
                {planKey === 'PRO' && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>
                  </div>
                )}
                <div className="mb-4">
                  <h4 className="text-xl font-bold text-gray-900">{details.name}</h4>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {details.price}
                    {planKey !== 'FREE' && <span className="text-sm font-normal text-gray-500"> /month</span>}
                  </p>
                </div>
                <ul className="space-y-2 mb-6">
                  {details.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500 font-bold">✓</span>{f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <button disabled className="w-full py-2 px-4 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed">Current Plan</button>
                ) : isUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(planKey as 'PRO' | 'AGENCY')}
                    disabled={upgrading !== null}
                    className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {upgrading === planKey ? 'Redirecting...' : `Upgrade to ${details.name}`}
                  </button>
                ) : (
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    Downgrade
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

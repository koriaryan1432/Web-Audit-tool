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
  FREE:   { name: 'Free',   price: '$0',     features: ['10 audits/day', 'Basic reports', 'Performance + Accessibility'] },
  PRO:    { name: 'Pro',    price: '$29/mo',  features: ['100 audits/day', 'PDF reports', 'AI recommendations', 'Share links', 'Priority support'] },
  AGENCY: { name: 'Agency', price: '$99/mo',  features: ['Unlimited audits', 'Team management', 'White-label reports', 'API access', 'Dedicated support'] },
};

function PlanCard({ planKey, details, isCurrent, isUpgrade, upgrading, onUpgrade, onManage, portalLoading }: {
  planKey: string; details: { name: string; price: string; features: string[] };
  isCurrent: boolean; isUpgrade: boolean; upgrading: string | null;
  onUpgrade: (plan: 'PRO' | 'AGENCY') => void; onManage: () => void; portalLoading: boolean;
}) {
  return (
    <div style={{ position: 'relative', background: 'var(--color-surface)', border: `1px solid ${isCurrent ? 'var(--color-signal)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', transition: `border-color 150ms var(--ease-out)` }}>
      {isCurrent && (
        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-signal)', color: '#fff', fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 600, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}>Current Plan</div>
      )}
      {planKey === 'PRO' && !isCurrent && (
        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-ink)', color: '#fff', fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 600, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}>Most Popular</div>
      )}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h3 style={{ marginBottom: 'var(--space-2)' }}>{details.name}</h3>
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'var(--text-3xl)', color: 'var(--color-ink)', lineHeight: 1 }}>{details.price}</p>
      </div>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        {details.features.map((f) => (
          <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-dust)' }}>
            <span style={{ color: 'var(--score-excellent)', fontWeight: 600 }}>+</span>{f}
          </li>
        ))}
      </ul>
      {isCurrent ? (
        <button disabled className="btn-secondary" style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }}>Current Plan</button>
      ) : isUpgrade ? (
        <button onClick={() => onUpgrade(planKey as 'PRO' | 'AGENCY')} disabled={upgrading !== null} className="btn-primary" style={{ width: '100%' }}>
          {upgrading === planKey ? 'Redirecting…' : `Upgrade to ${details.name}`}
        </button>
      ) : (
        <button onClick={onManage} disabled={portalLoading} className="btn-secondary" style={{ width: '100%' }}>Downgrade</button>
      )}
    </div>
  );
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [billingUnavailable, setBillingUnavailable] = useState(false);

  useEffect(() => {
    apiClient.billing.getSubscription().then(setSubscription).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(plan: 'PRO' | 'AGENCY') {
    setUpgrading(plan);
    try {
      const { checkoutUrl } = await apiClient.billing.createCheckout(plan);
      window.location.href = checkoutUrl;
    } catch (err: unknown) {
      const e = err as { status?: number; code?: string };
      if (e?.status === 503 || e?.code === 'BILLING_NOT_CONFIGURED') setBillingUnavailable(true);
      setUpgrading(null);
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const { portalUrl } = await apiClient.billing.getPortal();
      window.location.href = portalUrl;
    } catch (err: unknown) {
      const e = err as { status?: number; code?: string };
      if (e?.status === 503 || e?.code === 'BILLING_NOT_CONFIGURED') setBillingUnavailable(true);
      setPortalLoading(false);
    }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}><span className="spinner" /></div>;

  const currentPlan = subscription?.plan ?? 'FREE';
  const planDetails = PLAN_DETAILS[currentPlan];
  const periodEnd = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', maxWidth: 800 }}>
      <div>
        <h1 style={{ marginBottom: 'var(--space-1)' }}>Billing</h1>
        <p style={{ fontSize: 'var(--text-sm)' }}>Manage your SiteGrade plan and payment details.</p>
      </div>
      {billingUnavailable && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
          <span style={{ fontSize: 18 }}>⏳</span>
          <div>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: '#92400E', marginBottom: 'var(--space-1)' }}>Billing Coming Soon</p>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: '#B45309' }}>Stripe integration is being configured. Paid plans will be available shortly.</p>
          </div>
        </div>
      )}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Current Plan</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
              <h2>{planDetails.name}</h2>
              <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'var(--text-xl)', color: 'var(--color-dust)' }}>{planDetails.price}</span>
            </div>
            {periodEnd && <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>{subscription?.cancelAtPeriodEnd ? `Cancels on ${periodEnd}` : `Renews on ${periodEnd}`}</p>}
          </div>
          {currentPlan !== 'FREE' && <button onClick={handleManageSubscription} disabled={portalLoading} className="btn-secondary">{portalLoading ? 'Loading…' : 'Manage Subscription'}</button>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          {planDetails.features.map((f) => (
            <span key={f} style={{ padding: '3px 10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--color-dust)' }}>{f}</span>
          ))}
        </div>
      </div>
      <div>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Available Plans</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
          {(Object.entries(PLAN_DETAILS) as [keyof typeof PLAN_DETAILS, typeof PLAN_DETAILS['FREE']][]).map(([planKey, details]) => {
            const isCurrent = planKey === currentPlan;
            const isUpgrade = (currentPlan === 'FREE' && (planKey === 'PRO' || planKey === 'AGENCY')) || (currentPlan === 'PRO' && planKey === 'AGENCY');
            return <PlanCard key={planKey} planKey={planKey} details={details} isCurrent={isCurrent} isUpgrade={isUpgrade} upgrading={upgrading} onUpgrade={handleUpgrade} onManage={handleManageSubscription} portalLoading={portalLoading} />;
          })}
        </div>
      </div>
    </div>
  );
}

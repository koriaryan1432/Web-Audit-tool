'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseClient } from '../../lib/supabase';
import type { User } from '../../lib/supabase';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/dashboard/audits',
    label: 'Audits',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: '/dashboard/settings/billing',
    label: 'Billing',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

const PLAN_COLORS: Record<string, { bg: string; color: string }> = {
  FREE:   { bg: '#F0EEE9', color: 'var(--color-dust)' },
  PRO:    { bg: '#DBEAFE', color: '#1558C0' },
  AGENCY: { bg: '#EDE9FE', color: '#6D28D9' },
};

function Sidebar({
  user,
  plan,
  pathname,
  onSignOut,
}: {
  user: User | null;
  plan: string;
  pathname: string;
  onSignOut: () => void;
}) {
  const planStyle = PLAN_COLORS[plan] ?? PLAN_COLORS.FREE;
  const initial = user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
      }}
    >
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-6)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <Link
          href="/dashboard"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none' }}
        >
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20, color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>Site</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 20, fontWeight: 600, color: 'var(--color-signal)', letterSpacing: '-0.02em' }}>Grade</span>
        </Link>
      </div>

      <nav style={{ flex: 1, padding: 'var(--space-4) var(--space-3)', overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: '8px var(--space-3)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 2,
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: isActive ? 'var(--color-signal)' : 'var(--color-dust)',
                background: isActive ? '#EEF4FD' : 'transparent',
                textDecoration: 'none',
                transition: `background 150ms var(--ease-out), color 150ms var(--ease-out)`,
              }}
            >
              <span style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: 'var(--space-4) var(--space-3)', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '8px var(--space-3)' }}>
          <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-full)', background: '#EEF4FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-signal)' }}>{initial}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email ?? 'Loading…'}</p>
            <span style={{ display: 'inline-block', marginTop: 2, padding: '1px 6px', borderRadius: 'var(--radius-full)', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', background: planStyle.bg, color: planStyle.color }}>{plan}</span>
          </div>
          <button onClick={onSignOut} title="Sign out" style={{ background: 'none', border: 'none', padding: 4, color: 'var(--color-mist)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<string>('FREE');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setUser(data.user);
      setPlan((data.user.user_metadata?.plan as string) ?? 'FREE');
    });
  }, [router]);

  const handleSignOut = async () => {
    await getSupabaseClient().auth.signOut();
    router.push('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <div className="hidden lg:block">
        <Sidebar user={user} plan={plan} pathname={pathname} onSignOut={handleSignOut} />
      </div>
      {mobileOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,25,22,0.3)', zIndex: 39 }} onClick={() => setMobileOpen(false)} />
          <div className="lg:hidden"><Sidebar user={user} plan={plan} pathname={pathname} onSignOut={handleSignOut} /></div>
        </>
      )}
      <div style={{ marginLeft: 0 }} className="lg:ml-[240px]">
        <header className="lg:hidden" style={{ height: 56, background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', padding: '0 var(--space-4)', gap: 'var(--space-3)' }}>
          <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--color-dust)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, color: 'var(--color-ink)' }}>Site</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 18, fontWeight: 600, color: 'var(--color-signal)', marginLeft: -6 }}>Grade</span>
        </header>
        <main style={{ padding: 'var(--content-padding)', maxWidth: 'var(--max-width)', margin: '0 auto' }} className="page-fade">
          {children}
        </main>
      </div>
    </div>
  );
}

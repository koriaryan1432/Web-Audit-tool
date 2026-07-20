'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseClient } from '../../lib/supabase';
import type { User } from '../../lib/supabase';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/dashboard/audits', label: 'Audits', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { href: '/dashboard/reports', label: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
];

const PLAN_BADGE: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-600',
  PRO: 'bg-blue-100 text-blue-700',
  AGENCY: 'bg-purple-100 text-purple-700',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<string>('FREE');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SG</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg">SiteGrade</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                <svg className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-700 font-medium text-sm">{user?.email?.[0]?.toUpperCase() ?? '?'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.email ?? 'Loading...'}</p>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${PLAN_BADGE[plan] ?? PLAN_BADGE.FREE}`}>{plan}</span>
            </div>
            <button onClick={handleSignOut} className="text-gray-400 hover:text-gray-600 transition-colors" title="Sign out">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0">
          <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${PLAN_BADGE[plan] ?? PLAN_BADGE.FREE}`}>{plan} Plan</span>
            {plan === 'FREE' && <Link href="/dashboard/settings/billing" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Upgrade →</Link>}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

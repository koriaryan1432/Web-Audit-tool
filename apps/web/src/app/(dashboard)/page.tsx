'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auditsApi, type AuditSummary } from '../../lib/api';

const STATUS_COLORS: Record<string, string> = {
  QUEUED: 'bg-yellow-100 text-yellow-700',
  RUNNING: 'bg-blue-100 text-blue-700',
  COMPLETE: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

function ScorePill({ score }: { score: number | null }) {
  if (score === null) return <span className="text-gray-400 text-sm">—</span>;
  const color = score >= 90 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';
  return <span className={`font-semibold text-sm ${color}`}>{score}</span>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAudits = useCallback(async () => {
    try {
      const res = await auditsApi.list(1, 5);
      setAudits(res.data);
    } catch (err) { console.error('Failed to fetch audits:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAudits(); }, [fetchAudits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSubmitting(true); setError(null);
    try {
      const result = await auditsApi.create(url.trim(), { runAxe: true, device: 'mobile' });
      router.push(`/dashboard/audits/${result.auditId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start audit');
      setSubmitting(false);
    }
  };

  const completedAudits = audits.filter((a) => a.status === 'COMPLETE');
  const avgPerf = completedAudits.length > 0 ? Math.round(completedAudits.reduce((s, a) => s + (a.auditResult?.performanceScore ?? 0), 0) / completedAudits.length) : null;
  const avgA11y = completedAudits.length > 0 ? Math.round(completedAudits.reduce((s, a) => s + (a.auditResult?.accessibilityScore ?? 0), 0) / completedAudits.length) : null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Run audits and track your website performance.</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Run a New Audit</h2>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" required
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400" />
          <button type="submit" disabled={submitting || !url.trim()}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {submitting ? 'Starting...' : 'Audit'}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[{ label: 'Total Audits', value: audits.length, suffix: '' }, { label: 'Avg Performance', value: avgPerf, suffix: '/100' }, { label: 'Avg Accessibility', value: avgA11y, suffix: '/100' }].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {stat.value !== null ? <>{stat.value}<span className="text-base font-normal text-gray-400">{stat.suffix}</span></> : <span className="text-gray-300">—</span>}
            </p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Recent Audits</h2>
          <Link href="/dashboard/audits" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all →</Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : audits.length === 0 ? (
          <div className="p-8 text-center"><p className="text-gray-500 text-sm">No audits yet. Run your first audit above.</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {audits.map((audit) => (
              <Link key={audit.id} href={`/dashboard/audits/${audit.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{audit.url}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(audit.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
                    <span>Perf: <ScorePill score={audit.auditResult?.performanceScore ?? null} /></span>
                    <span>A11y: <ScorePill score={audit.auditResult?.accessibilityScore ?? null} /></span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[audit.status]}`}>{audit.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

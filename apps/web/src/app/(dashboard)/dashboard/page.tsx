import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import type { Audit } from '../../../../packages/shared/src/types/api';

function ScoreChip({ score }: { score: number }) {
  const color =
    score >= 90 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-bold ${color}`}>{score}</span>;
}

function StatusBadge({ status }: { status: Audit['status'] }) {
  const styles: Record<Audit['status'], string> = {
    QUEUED: 'bg-gray-700 text-gray-300',
    RUNNING: 'bg-blue-900 text-blue-300 animate-pulse',
    COMPLETE: 'bg-green-900 text-green-300',
    FAILED: 'bg-red-900 text-red-300',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

export default async function DashboardPage() {
  let recentAudits: Audit[] = [];
  let error: string | null = null;

  try {
    const res = await apiClient.audits.list({ limit: 5, sort: 'created_at' });
    recentAudits = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load audits';
  }

  const completedAudits = recentAudits.filter((a) => a.status === 'COMPLETE');
  const avgPerformance =
    completedAudits.length > 0
      ? Math.round(
          completedAudits.reduce(
            (sum, a) => sum + (a.result?.performanceScore ?? 0),
            0
          ) / completedAudits.length
        )
      : null;

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Audits', value: recentAudits.length },
          { label: 'Completed', value: completedAudits.length },
          { label: 'Avg Performance', value: avgPerformance ?? '—' },
          { label: 'Running', value: recentAudits.filter((a) => a.status === 'RUNNING').length },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent audits */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Audits</h2>
          <Link href="/dashboard/audits" className="text-sm text-blue-400 hover:text-blue-300">
            View all →
          </Link>
        </div>

        {error ? (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-300 text-sm">
            {error}
          </div>
        ) : recentAudits.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-400 mb-4">No audits yet. Run your first audit to get started.</p>
            <Link
              href="/dashboard/audits/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              ➕ Run New Audit
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAudits.map((audit) => (
              <Link
                key={audit.id}
                href={`/dashboard/audits/${audit.id}`}
                className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium truncate">{audit.url}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(audit.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  {audit.result && (
                    <div className="hidden md:flex gap-3 text-sm">
                      <span>P: <ScoreChip score={audit.result.performanceScore} /></span>
                      <span>A: <ScoreChip score={audit.result.accessibilityScore} /></span>
                    </div>
                  )}
                  <StatusBadge status={audit.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-800/50 rounded-xl p-6 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">Ready to audit a site?</h3>
          <p className="text-gray-400 text-sm mt-1">Get performance, accessibility, SEO, and AI recommendations in under 60 seconds.</p>
        </div>
        <Link
          href="/dashboard/audits/new"
          className="flex-shrink-0 ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Run Audit
        </Link>
      </div>
    </div>
  );
}

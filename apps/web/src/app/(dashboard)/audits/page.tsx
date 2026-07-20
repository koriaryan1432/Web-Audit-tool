import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import type { Audit } from '../../../../packages/shared/src/types/api';

function StatusBadge({ status }: { status: Audit['status'] }) {
  const styles: Record<Audit['status'], string> = {
    QUEUED: 'bg-gray-700 text-gray-300',
    RUNNING: 'bg-blue-900 text-blue-300',
    COMPLETE: 'bg-green-900 text-green-300',
    FAILED: 'bg-red-900 text-red-300',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function ScoreCell({ score }: { score?: number }) {
  if (score === undefined) return <span className="text-gray-600">—</span>;
  const color = score >= 90 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-semibold ${color}`}>{score}</span>;
}

export default async function AuditsPage() {
  let audits: Audit[] = [];
  let error: string | null = null;

  try {
    const res = await apiClient.audits.list({ limit: 50 });
    audits = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load audits';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Audits</h1>
        <Link
          href="/dashboard/audits/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          ➕ New Audit
        </Link>
      </div>

      {error ? (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-300 text-sm">
          {error}
        </div>
      ) : audits.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-400 mb-4">No audits yet.</p>
          <Link
            href="/dashboard/audits/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Run your first audit
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Perf</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">A11y</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">SEO</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {audits.map((audit) => (
                <tr key={audit.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/audits/${audit.id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium truncate block max-w-xs"
                    >
                      {audit.url}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={audit.status} />
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell text-sm">
                    <ScoreCell score={audit.result?.performanceScore} />
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell text-sm">
                    <ScoreCell score={audit.result?.accessibilityScore} />
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell text-sm">
                    <ScoreCell score={audit.result?.seoScore} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">
                    {new Date(audit.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

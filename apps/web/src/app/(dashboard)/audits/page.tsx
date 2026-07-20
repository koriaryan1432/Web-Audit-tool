'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { auditsApi, type AuditSummary } from '../../../lib/api';

const STATUS_COLORS: Record<string, string> = {
  QUEUED: 'bg-yellow-100 text-yellow-700',
  RUNNING: 'bg-blue-100 text-blue-700 animate-pulse',
  COMPLETE: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

function ScoreBar({ score, label }: { score: number | null; label: string }) {
  if (score === null) return null;
  const color = score >= 90 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-xs text-gray-500 w-8 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[40px]">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-6 text-right">{score}</span>
    </div>
  );
}

export default function AuditsPage() {
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAudits = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await auditsApi.list(p, 20);
      setAudits(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch (err) { console.error('Failed to fetch audits:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAudits(page); }, [fetchAudits, page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this audit? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await auditsApi.delete(id);
      setAudits((prev) => prev.filter((a) => a.id !== id));
    } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Failed to delete audit'); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audits</h1>
          <p className="text-gray-500 mt-1 text-sm">All your website audits in one place.</p>
        </div>
        <Link href="/dashboard" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">+ New Audit</Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading audits...</div>
        ) : audits.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No audits yet.</p>
            <Link href="/dashboard" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">Run your first audit →</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div className="col-span-4">URL</div><div className="col-span-2">Status</div>
              <div className="col-span-4">Scores</div><div className="col-span-1">Date</div><div className="col-span-1 text-right">Actions</div>
            </div>
            <div className="divide-y divide-gray-100">
              {audits.map((audit) => (
                <div key={audit.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-4 min-w-0">
                    <Link href={`/dashboard/audits/${audit.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate block">{audit.url}</Link>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[audit.status]}`}>{audit.status}</span>
                  </div>
                  <div className="col-span-4 space-y-1">
                    {audit.auditResult ? (
                      <><ScoreBar score={audit.auditResult.performanceScore} label="Perf" /><ScoreBar score={audit.auditResult.accessibilityScore} label="A11y" /></>
                    ) : <span className="text-xs text-gray-400">{audit.status === 'RUNNING' ? 'Running...' : '—'}</span>}
                  </div>
                  <div className="col-span-1">
                    <span className="text-xs text-gray-400">{new Date(audit.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="col-span-1 flex justify-end gap-2">
                    <Link href={`/dashboard/audits/${audit.id}`} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View</Link>
                    <button onClick={() => handleDelete(audit.id)} disabled={deletingId === audit.id || audit.status === 'RUNNING'}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed">
                      {deletingId === audit.id ? '...' : 'Del'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed">← Previous</button>
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

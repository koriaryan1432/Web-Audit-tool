'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { auditsApi, type AuditSummary } from '../../../lib/api';

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  QUEUED:   { bg: '#F0EEE9', color: 'var(--color-dust)' },
  RUNNING:  { bg: '#DBEAFE', color: '#1558C0' },
  COMPLETE: { bg: '#DCFCE7', color: '#166534' },
  FAILED:   { bg: '#FEE2E2', color: '#991B1B' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.QUEUED;
  return <span className="status-badge" style={{ background: s.bg, color: s.color }}>{status}</span>;
}

function ScorePill({ score, label }: { score: number; label: string }) {
  const color = score >= 90 ? 'var(--score-excellent)' : score >= 70 ? 'var(--score-good)' : score >= 50 ? 'var(--score-fair)' : 'var(--score-poor)';
  return (
    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--color-mist)' }}>
      {label} <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color }}>{score}</span>
    </span>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--space-1)' }}>Audits</h1>
          <p style={{ fontSize: 'var(--text-sm)' }}>All your website audits in one place.</p>
        </div>
        <Link href="/dashboard/audits/new" className="btn-primary">+ New Audit</Link>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}><span className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : audits.length === 0 ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-mist)', marginBottom: 'var(--space-4)' }}>No audits yet.</p>
            <Link href="/dashboard/audits/new" className="btn-primary">Run your first audit</Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 180px 80px 80px', padding: '0 var(--space-6)', height: 40, alignItems: 'center', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
              {['URL', 'Status', 'Scores', 'Date', ''].map((h) => (
                <span key={h} style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 500, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', color: 'var(--color-mist)' }}>{h}</span>
              ))}
            </div>
            {audits.map((audit, i) => (
              <div key={audit.id}
                style={{ display: 'grid', gridTemplateColumns: '1fr 100px 180px 80px 80px', padding: '0 var(--space-6)', height: 52, alignItems: 'center', borderBottom: i < audits.length - 1 ? '1px solid var(--color-border)' : 'none', transition: 'background 150ms var(--ease-out)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#FAFAF8'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <Link href={`/dashboard/audits/${audit.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none', paddingRight: 'var(--space-4)' }}>{audit.url}</Link>
                <div><StatusBadge status={audit.status} /></div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  {audit.auditResult ? (
                    <><ScorePill score={audit.auditResult.performanceScore} label="P" /><ScorePill score={audit.auditResult.accessibilityScore} label="A" /></>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--color-mist)' }}>{audit.status === 'RUNNING' ? 'Running…' : '—'}</span>
                  )}
                </div>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--color-mist)' }}>{new Date(audit.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                  <Link href={`/dashboard/audits/${audit.id}`} style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-signal)', textDecoration: 'none' }}>View</Link>
                  <button onClick={() => handleDelete(audit.id)} disabled={deletingId === audit.id || audit.status === 'RUNNING'} style={{ background: 'none', border: 'none', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--score-poor)', cursor: 'pointer', opacity: deletingId === audit.id || audit.status === 'RUNNING' ? 0.4 : 1 }}>{deletingId === audit.id ? '…' : 'Del'}</button>
                </div>
              </div>
            ))}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary" style={{ padding: '6px 14px', fontSize: 'var(--text-sm)' }}>← Previous</button>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-mist)' }}>Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary" style={{ padding: '6px 14px', fontSize: 'var(--text-sm)' }}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

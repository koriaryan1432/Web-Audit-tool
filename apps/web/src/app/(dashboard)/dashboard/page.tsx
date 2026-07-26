import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import type { Audit } from '../../../../packages/shared/src/types/api';

function ScoreChip({ score }: { score: number }) {
  const color = score >= 90 ? 'var(--score-excellent)' : score >= 70 ? 'var(--score-good)' : score >= 50 ? 'var(--score-fair)' : 'var(--score-poor)';
  return <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15, color, fontWeight: 400 }}>{score}</span>;
}

const STATUS_STYLES: Record<Audit['status'], { bg: string; color: string }> = {
  QUEUED:   { bg: '#F0EEE9', color: 'var(--color-dust)' },
  RUNNING:  { bg: '#DBEAFE', color: '#1558C0' },
  COMPLETE: { bg: '#DCFCE7', color: '#166534' },
  FAILED:   { bg: '#FEE2E2', color: '#991B1B' },
};

function StatusBadge({ status }: { status: Audit['status'] }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.QUEUED;
  return <span className="status-badge" style={{ background: s.bg, color: s.color }}>{status}</span>;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card" style={{ padding: 'var(--space-5)' }}>
      <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 500, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', color: 'var(--color-mist)', marginBottom: 'var(--space-2)' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'var(--text-3xl)', color: 'var(--color-ink)', lineHeight: 1 }}>{value}</p>
    </div>
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
  const avgPerformance = completedAudits.length > 0 ? Math.round(completedAudits.reduce((sum, a) => sum + (a.result?.performanceScore ?? 0), 0) / completedAudits.length) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--space-1)' }}>Dashboard</h1>
          <p style={{ fontSize: 'var(--text-sm)' }}>Your audit activity at a glance.</p>
        </div>
        <Link href="/dashboard/audits/new" className="btn-primary">+ New Audit</Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Total Audits" value={recentAudits.length} />
        <StatCard label="Completed" value={completedAudits.length} />
        <StatCard label="Avg Performance" value={avgPerformance ?? '—'} />
        <StatCard label="Running" value={recentAudits.filter((a) => a.status === 'RUNNING').length} />
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h2>Recent Audits</h2>
          <Link href="/dashboard/audits" style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-signal)', textDecoration: 'none' }}>View all →</Link>
        </div>
        {error ? (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', color: '#991B1B', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)' }}>{error}</div>
        ) : recentAudits.length === 0 ? (
          <div className="card" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-mist)', marginBottom: 'var(--space-4)' }}>No audits yet. Run your first audit to get started.</p>
            <Link href="/dashboard/audits/new" className="btn-primary">Run New Audit</Link>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {recentAudits.map((audit, i) => (
              <Link key={audit.id} href={`/dashboard/audits/${audit.id}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-6)', borderBottom: i < recentAudits.length - 1 ? '1px solid var(--color-border)' : 'none', textDecoration: 'none', transition: 'background 150ms var(--ease-out)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#FAFAF8'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{audit.url}</p>
                  <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--color-mist)', marginTop: 2 }}>{new Date(audit.createdAt).toLocaleDateString()}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', marginLeft: 'var(--space-4)', flexShrink: 0 }}>
                  {audit.result && (
                    <div style={{ display: 'flex', gap: 'var(--space-4)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--color-mist)' }}>
                      <span>Perf <ScoreChip score={audit.result.performanceScore} /></span>
                      <span>A11y <ScoreChip score={audit.result.accessibilityScore} /></span>
                    </div>
                  )}
                  <StatusBadge status={audit.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div>
          <h3 style={{ marginBottom: 'var(--space-1)' }}>Ready to audit a site?</h3>
          <p style={{ fontSize: 'var(--text-sm)' }}>Performance, accessibility, SEO, and AI recommendations in under 60 seconds.</p>
        </div>
        <Link href="/dashboard/audits/new" className="btn-primary" style={{ flexShrink: 0 }}>Run Audit</Link>
      </div>
    </div>
  );
}

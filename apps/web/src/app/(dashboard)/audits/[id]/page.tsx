'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { auditsApi, type AuditDetail, type AIRecommendation, type AuditIssue } from '../../../../lib/api';
import { ScoreRing, ScoreBreakdownRow } from '../../../../components/audit/ScoreRing';
import { IssueList } from '../../../../components/audit/IssueList';

const SEV_COLOR: Record<string, string> = {
  CRITICAL: 'var(--score-poor)',  critical: 'var(--score-poor)',
  HIGH:     'var(--score-fair)',  high:     'var(--score-fair)',
  MEDIUM:   'var(--score-good)', medium:   'var(--score-good)',
  LOW:      'var(--color-mist)', low:      'var(--color-mist)',
};

function SeverityDot({ s }: { s: string }) {
  return <span className="severity-dot" style={{ background: SEV_COLOR[s] ?? 'var(--color-mist)' }} />;
}

function RecsPanel({ recs }: { recs: AIRecommendation[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (recs.length === 0) return <div style={{ padding: 'var(--space-12)', textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-mist)' }}>No AI recommendations available.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {recs.map((rec) => (
        <div key={rec.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <button onClick={() => setExpanded(expanded === rec.id ? null : rec.id)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#FAFAF8'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <SeverityDot s={rec.severity} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-ink)' }}>{rec.title}</p>
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--color-mist)', marginTop: 2 }}>{rec.category}</p>
            </div>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} style={{ color: 'var(--color-mist)', flexShrink: 0, transform: expanded === rec.id ? 'rotate(180deg)' : 'none', transition: 'transform 150ms var(--ease-out)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expanded === rec.id && (
            <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Problem</p>
                <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-dust)' }}>{rec.description}</p>
              </div>
              <div>
                <p className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Fix</p>
                <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-dust)', whiteSpace: 'pre-wrap' }}>{rec.fixSuggestion}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AuditDetailPage() {
  const params = useParams();
  const auditId = params.id as string;
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'issues' | 'recommendations'>('issues');
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAudit = useCallback(async () => {
    try {
      const res = await auditsApi.get(auditId);
      setAudit(res.data);
      if (res.data.status === 'COMPLETE' || res.data.status === 'FAILED') {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch (err) { console.error('Failed to fetch audit:', err); }
    finally { setLoading(false); }
  }, [auditId]);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);
  useEffect(() => {
    if (!audit) return;
    if (audit.status === 'QUEUED' || audit.status === 'RUNNING') {
      pollRef.current = setInterval(fetchAudit, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [audit?.status, fetchAudit]);

  const handleShare = async () => {
    setSharing(true);
    try {
      const res = await auditsApi.generateReport(auditId);
      setShareUrl(res.shareUrl);
      await navigator.clipboard.writeText(res.shareUrl).catch(() => {});
    } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Failed to generate share link'); }
    finally { setSharing(false); }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}><span className="spinner" /></div>;
  if (!audit) return (
    <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
      <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-mist)' }}>Audit not found.</p>
      <Link href="/dashboard/audits" style={{ display: 'inline-block', marginTop: 'var(--space-3)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-signal)' }}>Back to audits</Link>
    </div>
  );

  const scores = audit.auditResult;
  const issues = (audit.auditResult?.issues as unknown as AuditIssue[]) ?? [];
  const recs = audit.auditResult?.aiRecommendations ?? [];
  const scoreValues = [scores?.performanceScore, scores?.accessibilityScore, scores?.seoScore, scores?.bestPracticesScore].filter((s): s is number => s !== null && s !== undefined);
  const overallScore = scoreValues.length > 0 ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-mist)' }}>
        <Link href="/dashboard/audits" style={{ color: 'var(--color-mist)', textDecoration: 'none' }}>Audits</Link>
        <span>/</span>
        <span style={{ color: 'var(--color-dust)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320, fontFamily: 'var(--font-mono)' }}>{audit.url}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 400, letterSpacing: 0, wordBreak: 'break-all', marginBottom: 'var(--space-1)' }}>{audit.url}</h1>
          <p style={{ fontSize: 'var(--text-sm)' }}>{audit.completedAt ? `Completed ${new Date(audit.completedAt).toLocaleString()}` : `Started ${new Date(audit.createdAt).toLocaleString()}`}</p>
        </div>
        {audit.status === 'COMPLETE' && (
          <button onClick={handleShare} disabled={sharing} className="btn-secondary" style={{ flexShrink: 0 }}>{sharing ? 'Generating…' : shareUrl ? '✓ Link Copied' : 'Share Report'}</button>
        )}
      </div>
      {(audit.status === 'QUEUED' || audit.status === 'RUNNING') && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span className="spinner" style={{ borderTopColor: '#1558C0', borderColor: '#BFDBFE' }} />
          <div>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: '#1558C0' }}>{audit.status === 'QUEUED' ? 'Audit queued…' : 'Audit in progress…'}</p>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: '#3B82F6', marginTop: 2 }}>This page updates automatically every 3 seconds.</p>
          </div>
        </div>
      )}
      {audit.status === 'FAILED' && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: '#991B1B' }}>Audit failed. Check the URL and try again.</div>
      )}
      {scores && overallScore !== null && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-8)', padding: 'var(--space-10)' }}>
          <ScoreRing score={overallScore} label="Overall Score" />
          <div style={{ width: '100%', height: 1, background: 'var(--color-border)' }} />
          <ScoreBreakdownRow performance={scores.performanceScore} accessibility={scores.accessibilityScore} seo={scores.seoScore} bestPractices={scores.bestPracticesScore} />
        </div>
      )}
      {audit.status === 'COMPLETE' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 var(--space-2)' }}>
            <button className={`tab-item ${activeTab === 'issues' ? 'active' : ''}`} onClick={() => setActiveTab('issues')}>Issues ({issues.length})</button>
            <button className={`tab-item ${activeTab === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveTab('recommendations')}>AI Recommendations ({recs.length})</button>
          </div>
          <div style={{ padding: 'var(--space-6)' }}>
            {activeTab === 'issues' ? (
              <IssueList issues={issues.map((i) => ({ id: i.id, impact: i.impact, title: i.title, description: i.description, url: undefined, score: i.score }))} />
            ) : (
              <RecsPanel recs={recs} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

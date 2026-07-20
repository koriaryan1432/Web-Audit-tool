'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { auditsApi, type AuditDetail, type AIRecommendation, type AuditIssue } from '../../../../lib/api';

function ScoreGauge({ score, label }: { score: number | null; label: string }) {
  const value = score ?? 0;
  const color = value >= 90 ? '#22c55e' : value >= 50 ? '#eab308' : '#ef4444';
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="8" />
          <circle cx="48" cy="48" r={radius} fill="none" stroke={score !== null ? color : '#e5e7eb'} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={score !== null ? strokeDashoffset : circumference}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold" style={{ color: score !== null ? color : '#9ca3af' }}>{score !== null ? score : '—'}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-gray-600 text-center">{label}</span>
    </div>
  );
}

const SEV: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-200', HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200', LOW: 'bg-blue-100 text-blue-700 border-blue-200',
  critical: 'bg-red-100 text-red-700 border-red-200', high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200', low: 'bg-blue-100 text-blue-700 border-blue-200',
};

function Badge({ s }: { s: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold ${SEV[s] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>{s.toUpperCase()}</span>;
}

function IssuesList({ issues }: { issues: AuditIssue[] }) {
  const byCategory = issues.reduce<Record<string, AuditIssue[]>>((acc, i) => { if (!acc[i.category]) acc[i.category] = []; acc[i.category].push(i); return acc; }, {});
  if (issues.length === 0) return <div className="text-center py-8 text-gray-400 text-sm">No issues found — great job!</div>;
  return (
    <div className="space-y-4">
      {Object.entries(byCategory).map(([cat, items]) => (
        <div key={cat}>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">{cat} ({items.length})</h4>
          <div className="space-y-2">
            {items.map((issue) => (
              <div key={issue.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <Badge s={issue.impact} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{issue.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{issue.description}</p>
                </div>
                {issue.score !== null && <span className="text-xs text-gray-400 flex-shrink-0">{Math.round(issue.score * 100)}/100</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecsPanel({ recs }: { recs: AIRecommendation[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (recs.length === 0) return <div className="text-center py-8 text-gray-400 text-sm">No AI recommendations available.</div>;
  return (
    <div className="space-y-3">
      {recs.map((rec) => (
        <div key={rec.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors" onClick={() => setExpanded(expanded === rec.id ? null : rec.id)}>
            <Badge s={rec.severity} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{rec.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{rec.category}</p>
            </div>
            <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expanded === rec.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expanded === rec.id && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Problem</p><p className="text-sm text-gray-700">{rec.description}</p></div>
              <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fix</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{rec.fixSuggestion}</p></div>
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

  if (loading) return <div className="p-6 flex items-center justify-center min-h-64"><div className="text-gray-400 text-sm">Loading audit...</div></div>;
  if (!audit) return <div className="p-6 text-center"><p className="text-gray-500">Audit not found.</p><Link href="/dashboard/audits" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">Back to audits</Link></div>;

  const scores = audit.auditResult;
  const issues = (audit.auditResult?.issues as unknown as AuditIssue[]) ?? [];
  const recs = audit.auditResult?.aiRecommendations ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/audits" className="hover:text-gray-700">Audits</Link>
        <span>/</span>
        <span className="text-gray-900 truncate max-w-xs">{audit.url}</span>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 break-all">{audit.url}</h1>
          <p className="text-sm text-gray-500 mt-1">{audit.completedAt ? `Completed ${new Date(audit.completedAt).toLocaleString()}` : `Started ${new Date(audit.createdAt).toLocaleString()}`}</p>
        </div>
        {audit.status === 'COMPLETE' && (
          <button onClick={handleShare} disabled={sharing} className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors flex-shrink-0">
            {sharing ? 'Generating...' : shareUrl ? '✓ Link Copied' : 'Share Report'}
          </button>
        )}
      </div>
      {(audit.status === 'QUEUED' || audit.status === 'RUNNING') && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">{audit.status === 'QUEUED' ? 'Audit queued...' : 'Audit in progress...'}</p>
            <p className="text-xs text-blue-600 mt-0.5">This page updates automatically every 3 seconds.</p>
          </div>
        </div>
      )}
      {audit.status === 'FAILED' && <div className="bg-red-50 border border-red-200 rounded-xl p-4"><p className="text-sm font-medium text-red-800">Audit failed. Check the URL and try again.</p></div>}
      {scores && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Scores</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <ScoreGauge score={scores.performanceScore} label="Performance" />
            <ScoreGauge score={scores.accessibilityScore} label="Accessibility" />
            <ScoreGauge score={scores.seoScore} label="SEO" />
            <ScoreGauge score={scores.bestPracticesScore} label="Best Practices" />
          </div>
        </div>
      )}
      {audit.status === 'COMPLETE' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex border-b border-gray-200">
            {(['issues', 'recommendations'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab === 'issues' ? `Issues (${issues.length})` : `AI Recommendations (${recs.length})`}
              </button>
            ))}
          </div>
          <div className="p-6">{activeTab === 'issues' ? <IssuesList issues={issues} /> : <RecsPanel recs={recs} />}</div>
        </div>
      )}
    </div>
  );
}

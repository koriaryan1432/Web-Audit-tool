import { notFound } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ScoreRing } from '@/components/audit/ScoreRing';
import { IssueCard } from '@/components/audit/IssueCard';
import { AuditStatusPoller } from '@/components/audit/AuditStatusPoller';
import type { AuditIssue } from '../../../../../packages/shared/src/types/ai';

interface AuditDetailPageProps {
  params: { id: string };
}

export default async function AuditDetailPage({ params }: AuditDetailPageProps) {
  let audit;
  try {
    audit = await apiClient.audits.get(params.id);
  } catch {
    notFound();
  }

  const result = audit.result;
  const issues = (result?.issues ?? []) as AuditIssue[];
  const criticalIssues = issues.filter((i) => i.impact === 'critical');
  const highIssues = issues.filter((i) => i.impact === 'high');
  const otherIssues = issues.filter((i) => i.impact !== 'critical' && i.impact !== 'high');

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <p className="text-gray-400 text-sm mb-1">Audit Report</p>
        <h1 className="text-xl font-bold text-white break-all">{audit.url}</h1>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(audit.createdAt).toLocaleString()}
          {audit.completedAt && ` · Completed ${new Date(audit.completedAt).toLocaleString()}`}
        </p>
      </div>

      {/* Status poller for running audits */}
      {(audit.status === 'QUEUED' || audit.status === 'RUNNING') && (
        <AuditStatusPoller
          auditId={audit.id}
          initialStatus={audit.status}
          initialProgress={audit.progress?.progress ?? 0}
        />
      )}

      {/* Score rings */}
      {result && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Scores</h2>
          <div className="flex flex-wrap gap-8 justify-center md:justify-start">
            <ScoreRing score={result.performanceScore} label="Performance" />
            <ScoreRing score={result.accessibilityScore} label="Accessibility" />
            <ScoreRing score={result.seoScore} label="SEO" />
            <ScoreRing score={result.bestPracticesScore} label="Best Practices" />
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {result?.recommendations && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🤖</span>
            <h2 className="text-lg font-semibold text-white">AI Recommendations</h2>
            {result.recommendations.fromCache && (
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">cached</span>
            )}
          </div>
          <p className="text-gray-300 mb-6">{result.recommendations.summary}</p>

          <div className="space-y-4">
            {result.recommendations.topIssues.map((rec, i) => (
              <div key={i} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-white font-medium">{rec.title}</h3>
                  <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                    rec.severity === 'critical' ? 'bg-red-900 text-red-300' :
                    rec.severity === 'high' ? 'bg-orange-900 text-orange-300' :
                    'bg-yellow-900 text-yellow-300'
                  }`}>{rec.severity}</span>
                </div>
                <p className="text-gray-400 text-sm mb-2">{rec.impact}</p>
                <p className="text-blue-300 text-sm">💡 {rec.fix}</p>
                <p className="text-gray-500 text-xs mt-2">Effort: {rec.effort}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues */}
      {issues.length > 0 && (
        <div className="space-y-4">
          {criticalIssues.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-red-400 mb-3">
                🔴 Critical Issues ({criticalIssues.length})
              </h2>
              <div className="space-y-3">
                {criticalIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            </div>
          )}

          {highIssues.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-orange-400 mb-3">
                🟠 High Priority ({highIssues.length})
              </h2>
              <div className="space-y-3">
                {highIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            </div>
          )}

          {otherIssues.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-400 mb-3">
                Other Issues ({otherIssues.length})
              </h2>
              <div className="space-y-3">
                {otherIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

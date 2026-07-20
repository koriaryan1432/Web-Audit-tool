import type { AuditIssue } from '../../../../packages/shared/src/types/ai';

interface IssueCardProps {
  issue: AuditIssue;
}

const SEVERITY_STYLES: Record<AuditIssue['impact'], string> = {
  critical: 'bg-red-900/40 text-red-300 border-red-800',
  high: 'bg-orange-900/40 text-orange-300 border-orange-800',
  medium: 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
  low: 'bg-gray-800 text-gray-400 border-gray-700',
};

const CATEGORY_ICONS: Record<AuditIssue['category'], string> = {
  performance: '⚡',
  accessibility: '♿',
  seo: '🔍',
  'best-practices': '✅',
};

export function IssueCard({ issue }: IssueCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">{CATEGORY_ICONS[issue.category]}</span>
          <h3 className="text-white font-medium text-sm truncate">{issue.title}</h3>
        </div>
        <span
          className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${SEVERITY_STYLES[issue.impact]}`}
        >
          {issue.impact}
        </span>
      </div>

      {issue.description && (
        <p className="text-gray-400 text-sm leading-relaxed">{issue.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="capitalize">{issue.category.replace('-', ' ')}</span>
        <span>Score: {issue.score}/100</span>
      </div>
    </div>
  );
}

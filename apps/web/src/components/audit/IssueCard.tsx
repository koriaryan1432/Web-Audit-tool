import type { AuditIssue } from '../../../../packages/shared/src/types/ai';

interface IssueCardProps {
  issue: AuditIssue;
}

const SEVERITY_COLOR: Record<AuditIssue['impact'], string> = {
  critical: 'var(--score-poor)',
  high:     'var(--score-fair)',
  medium:   'var(--score-good)',
  low:      'var(--color-mist)',
};

const CATEGORY_LABEL: Record<AuditIssue['category'], string> = {
  performance:    'Performance',
  accessibility:  'Accessibility',
  seo:            'SEO',
  'best-practices': 'Best Practices',
};

export function IssueCard({ issue }: IssueCardProps) {
  const dotColor = SEVERITY_COLOR[issue.impact] ?? 'var(--color-mist)';
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
          <span className="severity-dot" style={{ background: dotColor, flexShrink: 0 }} />
          <h3 style={{ fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</h3>
        </div>
        <span style={{ flexShrink: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 500, letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', color: dotColor }}>{issue.impact}</span>
      </div>
      {issue.description && <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{issue.description}</p>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--color-mist)' }}>
        <span>{CATEGORY_LABEL[issue.category] ?? issue.category}</span>
        {issue.score !== null && issue.score !== undefined && <span>Score: {issue.score}/100</span>}
      </div>
    </div>
  );
}

'use client';

import { getScoreColor } from './ScoreRing';

export interface Issue {
  id: string;
  impact: 'critical' | 'high' | 'medium' | 'low' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  url?: string;
  category?: string;
  description?: string;
  score?: number | null;
}

function severityColor(impact: string): string {
  const s = impact.toLowerCase();
  if (s === 'critical') return 'var(--score-poor)';
  if (s === 'high')     return 'var(--score-fair)';
  if (s === 'medium')   return 'var(--score-good)';
  return 'var(--color-mist)';
}

function severityLabel(impact: string): string {
  return impact.charAt(0).toUpperCase() + impact.slice(1).toLowerCase();
}

interface IssueListProps {
  issues: Issue[];
  onFixClick?: (issue: Issue) => void;
}

export function IssueList({ issues, onFixClick }: IssueListProps) {
  if (issues.length === 0) {
    return (
      <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-mist)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}>
        No issues found — great work.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontFamily: 'var(--font-ui)' }}>
        <thead>
          <tr>
            <th style={thStyle(120)}>Severity</th>
            <th style={thStyle()}>Issue</th>
            <th style={thStyle(280)}>URL</th>
            <th style={thStyle(60)}>Fix</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue, i) => (
            <IssueRow key={issue.id ?? i} issue={issue} onFixClick={onFixClick} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IssueRow({ issue, onFixClick }: { issue: Issue; onFixClick?: (issue: Issue) => void }) {
  const color = severityColor(issue.impact);
  return (
    <tr style={{ borderBottom: '1px solid var(--color-border)', transition: `background 150ms var(--ease-out)` }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#FAFAF8'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
    >
      <td style={{ ...tdStyle, width: 120, paddingRight: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="severity-dot" style={{ background: color }} aria-hidden="true" />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', color: 'var(--color-dust)' }}>{severityLabel(issue.impact)}</span>
        </div>
      </td>
      <td style={{ ...tdStyle, flex: 1 }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-ink)' }}>{issue.title}</span>
        {issue.description && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-mist)', marginTop: 2, lineHeight: 1.5 }}>{issue.description}</p>}
      </td>
      <td style={{ ...tdStyle, width: 280, maxWidth: 280 }}>
        {issue.url ? (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-dust)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }} title={issue.url}>{issue.url}</span>
        ) : (
          <span style={{ color: 'var(--color-mist)', fontSize: 'var(--text-xs)' }}>—</span>
        )}
      </td>
      <td style={{ ...tdStyle, width: 60, textAlign: 'right' }}>
        {onFixClick ? (
          <button onClick={() => onFixClick(issue)} style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-signal)', cursor: 'pointer' }}>Fix</button>
        ) : (
          <span style={{ color: 'var(--color-mist)', fontSize: 'var(--text-xs)' }}>—</span>
        )}
      </td>
    </tr>
  );
}

const tdStyle: React.CSSProperties = { padding: '0 var(--space-4)', height: 48, verticalAlign: 'middle' };

function thStyle(width?: number): React.CSSProperties {
  return { padding: '0 var(--space-4)', height: 40, textAlign: 'left', fontSize: 11, fontWeight: 500, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', color: 'var(--color-mist)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap', ...(width ? { width } : {}) };
}

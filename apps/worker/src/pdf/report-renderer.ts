// Self-contained HTML report renderer for PDF generation
// All CSS is inlined — no external dependencies

export interface AuditIssue {
  id: string;
  title: string;
  description: string;
  score: number | null;
  category: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
}

export interface AIRecommendation {
  title: string;
  severity: string;
  description: string;
  fix_suggestion: string;
}

export interface AuditWithResults {
  id: string;
  url: string;
  createdAt: Date;
  completedAt: Date | null;
  user: { name: string | null; email: string };
  auditResult: {
    performanceScore: number | null;
    accessibilityScore: number | null;
    seoScore: number | null;
    bestPracticesScore: number | null;
    issues: AuditIssue[];
  } | null;
  aiRecommendations: AIRecommendation[];
  report: { shareToken: string | null } | null;
}

const COLORS = {
  bg: '#0F172A',
  primary: '#6366F1',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#1E293B',
  textLight: '#64748B',
  border: '#E2E8F0',
  white: '#FFFFFF',
};

function scoreColor(score: number | null): string {
  if (score === null) return COLORS.textLight;
  if (score >= 90) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.error;
}

function scoreLabel(score: number | null): string {
  if (score === null) return 'N/A';
  if (score >= 90) return 'Good';
  if (score >= 50) return 'Needs Improvement';
  return 'Poor';
}

function impactBadge(impact: string): string {
  const colors: Record<string, string> = {
    critical: 'background:#FEE2E2;color:#991B1B',
    high: 'background:#FEF3C7;color:#92400E',
    medium: 'background:#DBEAFE;color:#1E40AF',
    low: 'background:#F0FDF4;color:#166534',
  };
  const style = colors[impact] ?? colors.low;
  return `<span style="${style};padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;text-transform:uppercase;">${impact}</span>`;
}

function scoreRing(score: number | null, label: string): string {
  const value = score ?? 0;
  const color = scoreColor(score);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;
  return [
    '<div style="text-align:center;">',
    `<svg width="100" height="100" viewBox="0 0 100 100">`,
    `<circle cx="50" cy="50" r="40" fill="none" stroke="${COLORS.border}" stroke-width="8"/>`,
    `<circle cx="50" cy="50" r="40" fill="none" stroke="${color}" stroke-width="8"`,
    ` stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"`,
    ` stroke-linecap="round" transform="rotate(-90 50 50)"/>`,
    `<text x="50" y="46" text-anchor="middle" font-size="18" font-weight="700" fill="${color}">${score ?? 'N/A'}</text>`,
    `<text x="50" y="62" text-anchor="middle" font-size="9" fill="${COLORS.textLight}">${scoreLabel(score)}</text>`,
    '</svg>',
    `<p style="margin:4px 0 0;font-size:12px;font-weight:600;color:${COLORS.textLight};">${label}</p>`,
    '</div>',
  ].join('');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderReportHTML(audit: AuditWithResults): string {
  const result = audit.auditResult;
  const issues = (result?.issues ?? []).slice(0, 10);
  const recs = audit.aiRecommendations.slice(0, 5);
  const appUrl = process.env.APP_URL ?? 'https://sitegade.app';
  const shareUrl = audit.report?.shareToken
    ? `${appUrl}/reports/${audit.report.shareToken}`
    : null;

  const issueRows = issues
    .map(
      (issue) =>
        `<tr style="border-bottom:1px solid ${COLORS.border};">
          <td style="padding:10px 12px;">${impactBadge(issue.impact)}</td>
          <td style="padding:10px 12px;font-weight:600;color:${COLORS.text};font-size:13px;">${escapeHtml(issue.title)}</td>
          <td style="padding:10px 12px;color:${COLORS.textLight};font-size:12px;">${escapeHtml(issue.category)}</td>
          <td style="padding:10px 12px;color:${COLORS.textLight};font-size:12px;">${escapeHtml(issue.description.slice(0, 100))}${issue.description.length > 100 ? '...' : ''}</td>
        </tr>`
    )
    .join('');

  const recCards = recs
    .map(
      (rec) =>
        `<div style="background:#F8FAFC;border:1px solid ${COLORS.border};border-radius:8px;padding:16px;margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            ${impactBadge(rec.severity.toLowerCase())}
            <span style="font-weight:700;color:${COLORS.text};font-size:14px;">${escapeHtml(rec.title)}</span>
          </div>
          <p style="color:${COLORS.textLight};font-size:13px;margin:0 0 8px;">${escapeHtml(rec.description)}</p>
          <div style="background:#EFF6FF;border-left:3px solid ${COLORS.primary};padding:8px 12px;">
            <span style="font-size:11px;font-weight:600;color:${COLORS.primary};text-transform:uppercase;">Fix: </span>
            <span style="font-size:12px;color:${COLORS.text};">${escapeHtml(rec.fix_suggestion)}</span>
          </div>
        </div>`
    )
    .join('');

  const header = `<div style="background:${COLORS.bg};padding:32px 40px;"><div style="display:flex;justify-content:space-between;align-items:center;"><div><div style="display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;background:${COLORS.primary};border-radius:8px;"><span style="color:white;font-weight:900;font-size:16px;padding:8px;">S</span></div><span style="color:white;font-size:20px;font-weight:800;">SiteGrade</span></div><p style="color:#94A3B8;font-size:12px;margin-top:4px;">Website Performance & UX Audit Report</p></div><div style="text-align:right;"><p style="color:#94A3B8;font-size:11px;">Generated on</p><p style="color:white;font-size:13px;font-weight:600;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div></div></div>`;

  const urlBanner = `<div style="background:#F1F5F9;padding:20px 40px;border-bottom:1px solid ${COLORS.border};"><p style="font-size:11px;color:${COLORS.textLight};font-weight:600;text-transform:uppercase;margin-bottom:4px;">Audited URL</p><p style="font-size:16px;font-weight:700;color:${COLORS.text};word-break:break-all;">${escapeHtml(audit.url)}</p><p style="font-size:12px;color:${COLORS.textLight};margin-top:4px;">Audit ID: ${audit.id} | Completed: ${audit.completedAt ? new Date(audit.completedAt).toLocaleString() : 'N/A'}</p></div>`;

  const scores = `<div style="padding:32px 40px;"><h2 style="font-size:18px;font-weight:700;color:${COLORS.text};margin-bottom:24px;">Score Summary</h2><div style="display:flex;justify-content:space-around;background:#F8FAFC;border:1px solid ${COLORS.border};border-radius:12px;padding:24px;">${scoreRing(result?.performanceScore ?? null, 'Performance')}${scoreRing(result?.accessibilityScore ?? null, 'Accessibility')}${scoreRing(result?.seoScore ?? null, 'SEO')}${scoreRing(result?.bestPracticesScore ?? null, 'Best Practices')}</div></div>`;

  const issuesSection = issues.length > 0
    ? `<div style="padding:0 40px 32px;"><h2 style="font-size:18px;font-weight:700;color:${COLORS.text};margin-bottom:16px;">Top Issues (${issues.length})</h2><div style="border:1px solid ${COLORS.border};border-radius:8px;overflow:hidden;"><table><thead><tr style="background:#F8FAFC;"><th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:${COLORS.textLight};text-transform:uppercase;">Impact</th><th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:${COLORS.textLight};text-transform:uppercase;">Issue</th><th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:${COLORS.textLight};text-transform:uppercase;">Category</th><th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:${COLORS.textLight};text-transform:uppercase;">Description</th></tr></thead><tbody>${issueRows}</tbody></table></div></div>`
    : '';

  const recsSection = recs.length > 0
    ? `<div style="padding:0 40px 32px;"><h2 style="font-size:18px;font-weight:700;color:${COLORS.text};margin-bottom:4px;">AI Recommendations</h2><p style="font-size:13px;color:${COLORS.textLight};margin-bottom:16px;">Powered by GPT-4o-mini — prioritized fixes for maximum impact</p>${recCards}</div>`
    : '';

  const footer = `<div style="background:#F8FAFC;border-top:1px solid ${COLORS.border};padding:24px 40px;"><div style="display:flex;justify-content:space-between;align-items:center;"><div><p style="font-size:12px;color:${COLORS.textLight};">Generated by <strong>SiteGrade</strong> — Website Performance & UX Audit Platform</p><p style="font-size:11px;color:${COLORS.textLight};margin-top:2px;">sitegade.app</p></div>${shareUrl ? `<div style="text-align:right;"><p style="font-size:11px;color:${COLORS.textLight};">Share this report:</p><p style="font-size:12px;color:${COLORS.primary};font-weight:600;">${shareUrl}</p></div>` : ''}</div></div>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>SiteGrade Audit Report — ${escapeHtml(audit.url)}</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${COLORS.text};background:${COLORS.white};}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}table{border-collapse:collapse;width:100%;}</style></head><body>${header}${urlBanner}${scores}${issuesSection}${recsSection}${footer}</body></html>`;
}

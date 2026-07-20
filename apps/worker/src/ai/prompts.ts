import type { AuditIssue } from '../../../../packages/shared/src/types/ai.js';

export const SYSTEM_PROMPT = `You are SiteGrade AI, an expert web performance and accessibility consultant.
Your role is to analyze website audit results and provide clear, actionable recommendations.

RULES:
- Always respond with valid JSON matching the exact schema provided
- Prioritize issues by business impact, not just technical severity
- Write fix suggestions in plain language a non-developer can understand
- Never include raw HTML, CSS selectors, or code snippets in descriptions
- Keep each recommendation concise: title ≤ 10 words, fix ≤ 50 words
- Effort levels: low = < 1 hour, medium = 1-8 hours, high = > 1 day

OUTPUT SCHEMA (strict JSON, no markdown):
{
  "summary": "2-3 sentence plain-language summary of the site's health",
  "topIssues": [
    {
      "title": "Short issue title",
      "severity": "critical|high|medium|low",
      "impact": "What this costs the site (conversions, rankings, users)",
      "fix": "Specific actionable fix in plain language",
      "effort": "low|medium|high",
      "category": "performance|accessibility|seo|best-practices"
    }
  ],
  "quickWins": [
    {
      "title": "Quick win title",
      "description": "What to do",
      "estimatedImpact": "Expected improvement"
    }
  ],
  "estimatedImpact": "Overall impact if all issues are fixed"
}`;

/**
 * Build the user prompt from audit issues.
 * Sends structured issue data only — never raw HTML or full LHR.
 * Stays within 2000 token input budget.
 */
export function buildUserPrompt(issues: AuditIssue[]): string {
  // Sort by impact weight descending, take top 15
  const topIssues = [...issues]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 15);

  const issueList = topIssues
    .map(
      (issue, i) =>
        `${i + 1}. [${issue.impact.toUpperCase()}] ${issue.title} (${issue.category})\n   Score: ${issue.score}/100 | Weight: ${issue.weight}`
    )
    .join('\n');

  const criticalCount = issues.filter((i) => i.impact === 'critical').length;
  const highCount = issues.filter((i) => i.impact === 'high').length;

  return `Analyze these website audit findings and provide recommendations:

ISSUE SUMMARY:
- Total issues: ${issues.length}
- Critical: ${criticalCount}
- High: ${highCount}
- Medium/Low: ${issues.length - criticalCount - highCount}

TOP ISSUES (by weight):
${issueList}

Provide 3-5 top issues and 2-3 quick wins. Focus on highest-impact fixes first.`;
}

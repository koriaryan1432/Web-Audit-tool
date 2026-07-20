import type {
  AIRecommendations,
  AuditIssue,
  AITopIssue,
} from '../../../../packages/shared/src/types/ai.js';

const CATEGORY_FIXES: Record<string, string> = {
  performance:
    'Optimize images, enable compression, reduce JavaScript bundle size, and leverage browser caching.',
  accessibility:
    'Add alt text to images, ensure sufficient color contrast, and make all interactive elements keyboard-accessible.',
  seo: 'Add descriptive meta tags, use semantic HTML headings, and ensure all pages have unique titles.',
  'best-practices':
    'Use HTTPS, avoid deprecated APIs, and ensure the page does not use browser errors.',
};

/**
 * Rule-based fallback recommendations.
 * Used when OpenAI is unavailable or times out.
 * Generates deterministic recommendations from issue severity/category.
 */
export function generateFallbackRecommendations(
  issues: AuditIssue[]
): AIRecommendations {
  const criticalIssues = issues.filter((i) => i.impact === 'critical');
  const highIssues = issues.filter((i) => i.impact === 'high');
  const topIssues = [...criticalIssues, ...highIssues].slice(0, 5);

  const mappedIssues: AITopIssue[] = topIssues.map((issue) => ({
    title: issue.title,
    severity: issue.impact as AITopIssue['severity'],
    impact: `This ${issue.category} issue is affecting your site's ${issue.category === 'performance' ? 'load time and user experience' : issue.category === 'accessibility' ? 'usability for all users' : issue.category === 'seo' ? 'search engine visibility' : 'overall quality score'}.`,
    fix:
      CATEGORY_FIXES[issue.category] ??
      'Review and address this issue following web best practices.',
    effort: issue.weight > 7 ? 'high' : issue.weight > 3 ? 'medium' : 'low',
    category: issue.category,
  }));

  const categoryBreakdown = issues.reduce(
    (acc, i) => {
      acc[i.category] = (acc[i.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const worstCategory = Object.entries(categoryBreakdown).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0];

  return {
    summary: `Your site has ${issues.length} issues identified across ${Object.keys(categoryBreakdown).length} categories. ${criticalIssues.length > 0 ? `There are ${criticalIssues.length} critical issues that need immediate attention.` : 'No critical issues were found.'} Focus on ${worstCategory ?? 'performance'} improvements for the biggest impact.`,
    topIssues: mappedIssues,
    quickWins: issues
      .filter((i) => i.impact === 'low' && i.weight < 2)
      .slice(0, 3)
      .map((i) => ({
        title: i.title,
        description: CATEGORY_FIXES[i.category] ?? 'Address this minor issue.',
        estimatedImpact: 'Minor improvement to overall score',
      })),
    estimatedImpact:
      criticalIssues.length > 0
        ? 'Fixing critical issues could improve your score by 15-30 points'
        : 'Addressing these issues could improve your score by 5-15 points',
    generatedAt: new Date().toISOString(),
    fromCache: false,
  };
}

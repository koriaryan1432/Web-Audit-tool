import { createHash } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { openai, AI_MODELS } from '../lib/ai.js';
import { cacheGet, cacheSet, CACHE_TTL } from '../lib/redis.js';
import type { Severity } from '@prisma/client';

export type AuditIssue = {
  id: string;
  title: string;
  description: string;
  score: number | null;
  weight: number;
  category: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
};

export type AIRecommendation = {
  category: string;
  severity: Severity;
  title: string;
  description: string;
  fixSuggestion: string;
  cacheKey: string;
};

type GPTRecommendation = {
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  fix_suggestion: string;
};

/**
 * Deterministic cache key based on sorted issue IDs.
 * Same set of issues = same key = cache hit regardless of audit ID.
 * Primary mechanism for achieving 65%+ cache hit rate.
 */
function buildCacheKey(issues: AuditIssue[]): string {
  const sortedIds = issues.map((i) => i.id).sort().join(',');
  return `ai:recs:${createHash('sha256').update(sortedIds).digest('hex').slice(0, 16)}`;
}

function buildPrompt(issues: AuditIssue[], url: string): string {
  const byCategory = issues.reduce<Record<string, AuditIssue[]>>((acc, issue) => {
    if (!acc[issue.category]) acc[issue.category] = [];
    acc[issue.category].push(issue);
    return acc;
  }, {});

  const issuesSummary = Object.entries(byCategory)
    .map(([category, categoryIssues]) => {
      const items = categoryIssues.slice(0, 5)
        .map((i) => `  - [${i.impact.toUpperCase()}] ${i.title}: ${i.description}`)
        .join('\n');
      return `### ${category.toUpperCase()}\n${items}`;
    })
    .join('\n\n');

  return `You are a web performance and UX expert. Analyze the following audit issues for ${url} and provide actionable recommendations.

## Audit Issues Found

${issuesSummary}

## Instructions

Return a JSON array of recommendations. Each recommendation must have:
- category: one of "performance", "accessibility", "seo", "best-practices", "security"
- severity: one of "CRITICAL", "HIGH", "MEDIUM", "LOW"
- title: concise title (max 80 chars)
- description: clear explanation of the problem and its impact (2-3 sentences)
- fix_suggestion: specific, actionable fix with code example if applicable (3-5 sentences)

Rules:
- Maximum 8 recommendations total
- Prioritize by business impact (user experience, SEO ranking, conversion)
- Be specific — avoid generic advice like "optimize images"
- Include concrete metrics where possible (e.g., "reduces LCP by ~300ms")

Return ONLY the JSON array, no markdown, no explanation.`;
}

/**
 * Generate AI-powered recommendations for an audit result.
 *
 * Flow:
 *   1. Build deterministic cache key from issue IDs
 *   2. Check Redis cache — return immediately on hit (65%+ target hit rate)
 *   3. On miss: call GPT-4o-mini with structured prompt
 *   4. Parse and validate response
 *   5. Save to ai_recommendations table
 *   6. Cache in Redis (TTL: 24h)
 */
export async function generateRecommendations(
  auditResultId: string,
  issues: AuditIssue[],
  url: string
): Promise<AIRecommendation[]> {
  if (issues.length === 0) return [];

  const actionableIssues = issues
    .filter((i) => i.score === null || i.score < 0.9)
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.impact] - order[b.impact];
    })
    .slice(0, 20);

  const cacheKey = buildCacheKey(actionableIssues);

  const cached = await cacheGet<AIRecommendation[]>(cacheKey);
  if (cached) {
    console.log(`[ai] Cache HIT for key ${cacheKey}`);
    await saveRecommendations(auditResultId, cached);
    return cached;
  }

  console.log(`[ai] Cache MISS for key ${cacheKey} — calling GPT-4o-mini`);

  let gptRecommendations: GPTRecommendation[] = [];

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODELS.RECOMMENDATIONS,
      messages: [
        { role: 'system', content: 'You are a web performance and accessibility expert. Always respond with valid JSON only.' },
        { role: 'user', content: buildPrompt(actionableIssues, url) },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from OpenAI');

    const parsed = JSON.parse(content);
    gptRecommendations = Array.isArray(parsed) ? parsed : (parsed.recommendations ?? parsed.data ?? []);
    console.log(`[ai] GPT-4o-mini returned ${gptRecommendations.length} recommendations. Tokens: ${response.usage?.total_tokens ?? 'unknown'}`);
  } catch (err) {
    console.error('[ai] OpenAI call failed:', err);
    return [];
  }

  const recommendations: AIRecommendation[] = gptRecommendations
    .filter((r) => r.title && r.description && r.fix_suggestion)
    .slice(0, 8)
    .map((r) => ({
      category: r.category ?? 'general',
      severity: (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(r.severity) ? r.severity : 'MEDIUM') as Severity,
      title: r.title.slice(0, 200),
      description: r.description.slice(0, 1000),
      fixSuggestion: r.fix_suggestion.slice(0, 2000),
      cacheKey,
    }));

  await saveRecommendations(auditResultId, recommendations);
  await cacheSet(cacheKey, recommendations, CACHE_TTL.AI_RECOMMENDATIONS);

  return recommendations;
}

async function saveRecommendations(auditResultId: string, recommendations: AIRecommendation[]): Promise<void> {
  if (recommendations.length === 0) return;
  try {
    await prisma.aiRecommendation.createMany({
      data: recommendations.map((r) => ({
        auditResultId, category: r.category, severity: r.severity,
        title: r.title, description: r.description, fixSuggestion: r.fixSuggestion, cacheKey: r.cacheKey,
      })),
      skipDuplicates: true,
    });
  } catch (err) {
    console.error('[ai] Failed to save recommendations to DB:', err);
  }
}

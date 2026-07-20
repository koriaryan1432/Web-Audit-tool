import { z } from 'zod';
import type { AIRecommendations, AuditIssue } from '../../../../packages/shared/src/types/ai.js';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts.js';
import {
  generateCacheKey,
  getCachedRecommendations,
  setCachedRecommendations,
} from './cache.js';
import { generateFallbackRecommendations } from './fallback.js';

const AI_TIMEOUT_MS = 10_000;
const MAX_OUTPUT_TOKENS = 800;

// Zod schema for validating OpenAI response
const RecommendationSchema = z.object({
  summary: z.string().min(1),
  topIssues: z
    .array(
      z.object({
        title: z.string(),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        impact: z.string(),
        fix: z.string(),
        effort: z.enum(['low', 'medium', 'high']),
        category: z.string().optional(),
      })
    )
    .min(1)
    .max(5),
  quickWins: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        estimatedImpact: z.string(),
      })
    )
    .max(3),
  estimatedImpact: z.string(),
});

/**
 * Generate AI recommendations for audit issues.
 *
 * Pipeline:
 *   1. Check Redis cache (key = SHA-256 of sorted issue IDs)
 *   2. On miss: call GPT-4o-mini with 10s timeout
 *   3. Validate response with Zod
 *   4. Cache result for 24h
 *   5. On any error: fall back to rule-based recommendations
 */
export async function generateRecommendations(
  issues: AuditIssue[]
): Promise<AIRecommendations> {
  if (issues.length === 0) {
    return {
      summary: 'No issues were found. Your site is performing well across all categories.',
      topIssues: [],
      quickWins: [],
      estimatedImpact: 'No improvements needed at this time.',
      generatedAt: new Date().toISOString(),
      fromCache: false,
    };
  }

  const cacheKey = generateCacheKey(issues);

  // 1. Cache check
  const cached = await getCachedRecommendations(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true, cacheKey };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[ai] OPENAI_API_KEY not set — using fallback recommendations');
    return generateFallbackRecommendations(issues);
  }

  // 2. Call GPT-4o-mini
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(issues) },
        ],
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.3, // Low temperature for consistent, factual output
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from OpenAI');

    // 3. Validate with Zod
    const parsed = RecommendationSchema.parse(JSON.parse(content));

    const recommendations: AIRecommendations = {
      ...parsed,
      generatedAt: new Date().toISOString(),
      fromCache: false,
      cacheKey,
    };

    // 4. Cache for 24h
    await setCachedRecommendations(cacheKey, recommendations);

    return recommendations;
  } catch (err) {
    // 5. Fallback on any error
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ai] Recommendation generation failed, using fallback:', errorMessage);
    return generateFallbackRecommendations(issues);
  }
}

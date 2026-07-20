import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

/**
 * OpenAI client singleton.
 *
 * Using GPT-4o-mini for recommendation generation:
 *   - ~10x cheaper than GPT-4o ($0.15/1M input vs $2.50/1M)
 *   - Sufficient quality for structured audit recommendations
 *   - Target: $0.006 per audit (65%+ cache hit rate reduces this further)
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30_000,
});

export const AI_MODELS = {
  RECOMMENDATIONS: 'gpt-4o-mini',
  COMPLEX_ANALYSIS: 'gpt-4o',
} as const;

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

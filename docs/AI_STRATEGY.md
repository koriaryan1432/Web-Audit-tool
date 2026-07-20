# SiteGrade — AI Strategy

**Document Version:** 1.0
**Last Updated:** July 20, 2026
**Author:** Atlas (Full-Stack Engineer)

---

## Table of Contents

1. [AI Purpose in SiteGrade](#1-ai-purpose-in-sitegrade)
2. [Model Selection](#2-model-selection)
3. [Prompt Design](#3-prompt-design)
4. [Token Budget & Cost Analysis](#4-token-budget--cost-analysis)
5. [Caching Strategy](#5-caching-strategy)
6. [Fallback Strategy](#6-fallback-strategy)
7. [Quality Control](#7-quality-control)
8. [Production Monitoring](#8-production-monitoring)

---

## 1. AI Purpose in SiteGrade

SiteGrade uses AI for one thing: **translating technical audit findings into actionable, plain-language recommendations.**

### What AI Does
1. **Per-issue recommendations** — what's wrong, why it matters, how to fix (steps + code examples), effort estimate (S/M/L), expected score improvement
2. **Executive summary** — 2-3 sentence overview of site health and top 3 priorities
3. **Priority ranking** — ranked by `impact × (1/effort)` — highest ROI first

### What AI Does NOT Do
❌ Run audit (Lighthouse + axe-core do that)
❌ Make business decisions
❌ Access the internet (no RAG)
❌ Store or learn from user data (stateless, per-audit only)
❌ Generate the overall score (that's a weighted formula)

---

## 2. Model Selection

### Primary: GPT-4o

| Attribute | Detail |
|-----------|--------|
| **Why** | Best reasoning for technical recommendations + code generation |
| **Cost** | $2.50/M input (cached: $1.25/M), $10.00/M output |
| **Latency** | ~3-5s per audit |
| **Features** | JSON mode, system prompt caching, low temperature (0.3) |

### Fallback: GPT-4o-mini
16× cheaper than GPT-4o ($0.15/M input, $0.60/M output). Used when GPT-4o unavailable. Slightly less precise code examples.

### Why Not Claude / Gemini / Llama?
Claude 3.5 — GPT-4o has superior structured JSON + automated caching (50% cost reduction)
Gemini 1.5 — Less consistent code generation
Llama 3 self-hosted — Operational overhead > cost savings at our scale

---

## 3. Prompt Design

### System Prompt (Static — Cached)

```
You are SiteGrade AI, an expert web performance and UX consultant.
Your job is to analyze website audit results and provide clear, actionable,
developer-friendly recommendations.

Rules:
- Write in plain English. Assume reader knows HTML/CSS/JS but not performance.
- Be specific: name exact element, file, or setting.
- Include code examples (HTML, CSS, JS, config). Use markdown code blocks.
- Estimate effort: S (<1hr), M (1-4hrs), L (4+ hrs)
- Estimate score impact: 1-20 points. Be conservative.
- Prioritize by impact/effort ratio (quick wins first).
- Never recommend paid tools, services, or plugins.
- Never suggest changes that could break functionality.
- Format as valid JSON matching the provided schema.
```

### User Prompt (Dynamic — Per Audit)
Contains: URL, device/viewport, overall score, 6 category scores, failing items JSON (top 20 by impact), and output schema.

### Prompt Engineering Principles
- **Low temperature (0.3)** — consistent, factual output
- **JSON mode** — guaranteed parseable, no preamble
- **Specific instructions** — "3-5 steps" beats "explain how to fix"
- **Conservative effort estimates** — prompt biases toward honesty
- **Code examples required** — key differentiator
- **Schema in user prompt** — ensures matching output structure

---

## 4. Token Budget & Cost Analysis

### Per-Audit Token Breakdown

| Component | Tokens | Cost (GPT-4o) |
|-----------|--------|---------------|
| System prompt (cached) | ~400 | $0.0005 |
| User prompt | ~800-1,200 | $0.002-0.003 |
| Output | ~1,500-2,500 | $0.015-0.025 |
| **Total** | **~2,700-4,100** | **~$0.006-0.023** |

### Monthly Cost Projections

| Audits/Month | Cache Hit | Effective Calls | Est. Cost |
|-------------|-----------|----------------|-----------|
| 100 | 30% | 70 | ~$1.15 |
| 1,000 | 65% | 350 | ~$5.75 |
| 5,000 | 70% | 1,500 | ~$24.60 |
| 10,000 | 75% | 2,500 | ~$41.00 |

### Cost Optimization Levers
- Cache system prompt: 50% input savings (auto with GPT-4o)
- Redis cache (7-day TTL): 60-70% fewer API calls
- GPT-4o-mini fallback: 93% cheaper
- Limit failing items to top 20: caps tokens at ~4K

---

## 5. Caching Strategy

**Cache key:** `ai:recommendations:{url_hash}:{audit_checksum}`
- `url_hash` = SHA-256(normalized_url)
- `audit_checksum` = SHA-256(JSON.stringify(failing_items))
- **TTL:** 7 days
- **Expected hit rate:** 60-70% (cross-user benefit for same URLs)

**Cache flow:** Audit completes → Build cache key → Redis GET → HIT: return cached / MISS: call OpenAI → Redis SET (7d TTL) → return

---

## 6. Fallback Strategy

```
Primary:    GPT-4o          ─── 99.5% success target
    ↓ fail/timeout >8s
Retry:      GPT-4o          ─── once after 2s
    ↓ still fails
Fallback:   GPT-4o-mini     ─── same prompt
    ↓ still fails
Degrade:    No AI           ─── results without recommendations
                              banner: "AI temporarily unavailable"
    ↓ background
Recover:    Queue retry     ─── background job + email notification
```

---

## 7. Quality Control

### Output Validation (Zod schema)
- `issue_id`: string (matches input)
- `whats_wrong`: 20-500 chars
- `why_matters`: 20-500 chars
- `how_to_fix`: 50-2000 chars
- `code_example`: optional string
- `effort`: "S" | "M" | "L"
- `expected_improvement`: integer 1-20
- `executive_summary`: 50-1000 chars

### Hallucination Mitigation
- Low temperature (0.3) — reduces fabrication
- Prompt constraints — "Never recommend paid tools"
- Code examples scoped to fix only
- Issue context from real audit data, not guessing

---

## 8. Production Monitoring

| Metric | Alert Threshold |
|--------|----------------|
| AI call success rate | < 95% |
| AI call latency (p95) | > 8s |
| Cache hit rate | < 50% |
| Monthly AI spend | > $50 |
| Schema validation failures | > 5% |
| Mini model fallback rate | > 10% |

**Every AI call logs:** auditId, model, cacheHit, inputTokens, outputTokens, durationMs, cost

---

**Next:** See [SECURITY.md](SECURITY.md) for security considerations.
# SiteGrade — API Integrations

**Document Version:** 1.0
**Last Updated:** July 20, 2026
**Author:** Atlas (Full-Stack Engineer)

---

## Table of Contents

1. [Integration Overview](#1-integration-overview)
2. [Google PageSpeed Insights API](#2-google-pagespeed-insights-api)
3. [Google Lighthouse (Node Module)](#3-google-lighthouse-node-module)
4. [axe-core](#4-axe-core)
5. [OpenAI GPT-4o](#5-openai-gpt-4o)
6. [Stripe](#6-stripe)
7. [Resend](#7-resend)
8. [Supabase](#8-supabase)
9. [Vercel](#9-vercel)
10. [Railway](#10-railway)
11. [Sentry](#11-sentry)
12. [PostHog](#12-posthog)
13. [Upstash Redis](#13-upstash-redis)
14. [Cost Summary](#14-cost-summary)

---

## 1. Integration Overview

```
┌──────────────┬───────────────┬───────────────┬───────────────┐
│   AUDIT      │     AI        │   PAYMENTS    │   COMMS       │
│──────────────│───────────────│───────────────│───────────────│
│ Lighthouse   │ OpenAI GPT-4o │ Stripe        │ Resend        │
│ PageSpeed API│ GPT-4o-mini   │               │               │
│ axe-core     │               │               │               │
├──────────────┴───────────────┴───────────────┴───────────────┤
│                    INFRASTRUCTURE                             │
│──────────────────────────────────────────────────────────────│
│ Supabase (DB+Auth+Storage) │ Upstash Redis │ Vercel │ Railway│
├──────────────────────────────────────────────────────────────┤
│                    MONITORING                                 │
│──────────────────────────────────────────────────────────────│
│ Sentry (errors)             │ PostHog (analytics)            │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Google PageSpeed Insights API

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Supplementary CrUX real-user data alongside Lighthouse lab data |
| **Endpoint** | `GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={url}` |
| **Auth** | API key in query parameter |
| **Cost** | Free: 25,000 queries/day | Paid: $0.0025/query above |

**Fallback:** Skip PSI, show local Lighthouse data only. No user-facing error.

---

## 3. Google Lighthouse (Node Module)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Core audit engine for Performance, SEO, Best Practices, PWA |
| **Package** | `lighthouse` (npm), `chrome-launcher` |
| **Output** | JSON (LHR — Lighthouse Result) |
| **Cost** | Free — open source. Compute only (Railway worker: ~$20/mo) |

**Resource requirements:** 20-40s per audit | ~500MB RAM (Chrome) | 2 vCPU recommended

**Fallback:** 45s timeout → retry once → mark as "failed" with explanation.

---

## 4. axe-core

| Attribute | Detail |
|-----------|--------|
| **Purpose** | WCAG 2.1 AA accessibility auditing |
| **Package** | `axe-core` + `@axe-core/puppeteer` |
| **Cost** | Free — open source (Deque Systems) |

**Fallback:** Skip accessibility audit if page can't load; note in results. Other categories continue.

---

## 5. OpenAI GPT-4o

| Attribute | Detail |
|-----------|--------|
| **Purpose** | AI fix recommendations, effort estimates, executive summaries |
| **SDK** | `openai` npm v4 |
| **Primary** | `gpt-4o` — $2.50/M input, $10.00/M output |
| **Fallback** | `gpt-4o-mini` — $0.15/M input, $0.60/M output |

**Per-audit cost:** ~$0.016 (GPT-4o, cached system prompt) or ~$0.0014 (GPT-4o-mini fallback)

**Monthly at 1,000 audits (65% cache hit):** ~$5-8/month

**Fallback ladder:** GPT-4o → retry once → GPT-4o-mini → no AI (banner + background retry job)

---

## 6. Stripe

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Payment processing, subscription management, invoicing |
| **SDK** | `stripe` npm |
| **Fee** | 2.9% + $0.30 per charge |

**Products:** Pro ($49/mo), Agency ($149/mo)
**Webhook events:** checkout.session.completed, customer.subscription.updated/deleted, invoice.paid/failed

---

## 7. Resend

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Transactional email — verification, password reset, notifications |
| **Cost** | Free: 3,000/month | Growth: 50,000/$20mo |

---

## 8. Supabase

| Attribute | Detail |
|-----------|--------|
| **Purpose** | PostgreSQL, Authentication, File Storage |
| **Cost** | Free: 500MB DB, 50K MAU | Pro: 8GB, 100K MAU, $25/mo |

---

## 9-13. Infrastructure (Summary)

| Service | Purpose | Cost |
|---------|---------|------|
| **Vercel** | Frontend hosting (Next.js) | Free Hobby tier |
| **Railway** | API + Worker hosting | ~$25/mo (2 services) |
| **Sentry** | Error tracking | Free Developer (5K events) |
| **PostHog** | Product analytics | Free (1M events) |
| **Upstash Redis** | Queue backend + AI cache + rate limiting | Free (10K commands) |

---

## 14. Cost Summary

### Launch (Phase 0)

| Service | Est. Cost |
|---------|-----------|
| Supabase | $0 (Free) |
| Upstash Redis | $0 (Free) |
| Vercel | $0 (Hobby) |
| Railway (api + worker) | ~$25 |
| Sentry | $0 (Dev) |
| PostHog | $0 (Free) |
| OpenAI | ~$10 |
| Resend | $0 (Free) |
| **Total** | **~$35/month** |

### Month 6 (100 customers)

| Service | Est. Cost |
|---------|-----------|
| Supabase Pro | $25 |
| Upstash Redis | ~$10 |
| Vercel Pro | $20 |
| Railway (3 workers) | ~$60 |
| Sentry Team | $26 |
| OpenAI | ~$15 |
| Resend Growth | $20 |
| **Total** | **~$176/month** |
| **Gross margin at $4,685 MRR** | **~96%** |

---

**Next:** See [AI_STRATEGY.md](AI_STRATEGY.md) for AI integration details.
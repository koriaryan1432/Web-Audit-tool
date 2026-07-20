# SiteGrade — Development Roadmap

**Document Version:** 1.0
**Last Updated:** July 20, 2026
**Author:** Atlas + Ben (Project Manager)

---

## Table of Contents

1. [Roadmap Overview](#1-roadmap-overview)
2. [Phase 0: Foundation (Week 1–2)](#2-phase-0-foundation-week-12)
3. [Phase 1: MVP (Week 3–8)](#3-phase-1-mvp-week-38)
4. [Phase 2: Monetization (Week 9–12)](#4-phase-2-monetization-week-912)
5. [Phase 3: Growth (Month 4–6)](#5-phase-3-growth-month-46)
6. [Phase 4: Scale (Month 7–12)](#6-phase-4-scale-month-712)
7. [Definition of Done (DoD)](#7-definition-of-done-dod)

---

## 1. Roadmap Overview

```
Phase 0          Phase 1            Phase 2            Phase 3            Phase 4
Foundation       MVP                Monetization       Growth             Scale
Week 1-2         Week 3-8           Week 9-12          Month 4-6          Month 7-12
─────┼────────────────┼──────────────────┼──────────────────┼──────────────────┤
     │                │                  │                  │                  │
  Repo setup     Auth + Audit      Stripe billing    Agency features   Performance opt
  Design system  Dashboard         AI recs           API access        Advanced analytics
  Customer disc  Landing page      PDF reports       Scheduled audits  Enterprise tier
  Content prep   Result view       Shareable links   Integrations      K8s migration
```

---

## 2. Phase 0: Foundation (Week 1–2)

**Goal:** Repository live, design system started, team aligned, first customer interviews done.
**Definition of Done:** Monorepo initialized, CI/CD green, design tokens defined, 15 interviews completed.

### Epic 0.1: Repository & Infrastructure Setup

| # | Task | Owner | Complexity |
|---|------|-------|-----------|
| 0.1.1 | Initialize Turborepo monorepo with pnpm | Atlas | S |
| 0.1.2 | Set up apps/web (Next.js 14 App Router) | Atlas | S |
| 0.1.3 | Set up apps/api (Hono.js) | Atlas | S |
| 0.1.4 | Set up apps/worker (Node.js + BullMQ) | Atlas | S |
| 0.1.5 | Set up packages: types, db, ui, config, utils | Atlas | S |
| 0.1.6 | Configure Supabase project (DB + Auth + Storage) | Atlas | S |
| 0.1.7 | Configure Upstash Redis instance | Atlas | S |
| 0.1.8 | Set up GitHub Actions CI (lint, type-check, test) | Atlas | S |
| 0.1.9 | Set up Vercel project for web app | Atlas | S |
| 0.1.10 | Set up Railway projects for api + worker | Atlas | S |
| 0.1.11 | Configure Sentry (web + api + worker) | Atlas | S |

### Epic 0.2: Design System Foundation

| # | Task | Owner | Complexity |
|---|------|-------|-----------|
| 0.2.1 | Define color tokens | Atelier | S |
| 0.2.2 | Define typography scale (Inter + JetBrains Mono) | Atelier | S |
| 0.2.3 | Define spacing, radius, shadow system | Atelier | S |
| 0.2.4 | Create ScoreRing component (Figma) | Atelier | M |
| 0.2.5 | Create CategoryCard component (Figma) | Atelier | M |
| 0.2.6 | Create IssueItem component (Figma) | Atelier | S |
| 0.2.7 | Logo design (3 concepts) | Atelier | M |
| 0.2.8 | Implement design tokens in Tailwind config | Atlas | S |

### Epic 0.3: Customer Discovery

| # | Task | Owner | Complexity |
|---|------|-------|-----------|
| 0.3.1 | Write 15-question interview script | Vega + Gwen | S |
| 0.3.2 | Identify 20 interview candidates | Vega | S |
| 0.3.3 | Conduct 15 customer interviews | Vega | M |
| 0.3.4 | Synthesize interview findings | Gwen + Ben | M |
| 0.3.5 | Validate pricing assumptions ($49/$149) | Vega | S |

### Epic 0.4: Content & Marketing

| # | Task | Owner | Complexity |
|---|------|-------|-----------|
| 0.4.1 | Competitive analysis | Gwen | M |
| 0.4.2 | Landing page copy | Gwen | M |
| 0.4.3 | SEO keyword research | Gwen | S |
| 0.4.4 | Set up project tracker (Linear) | Ben | S |

---

## 3. Phase 1: MVP (Week 3–8)

**Goal:** Working audit engine, basic dashboard, auth, free tier live.

### Epic 1.1: Authentication (7 tasks, Atlas, all M/S)
Setup Supabase Auth (email/password, Google OAuth, email verification, password reset), auth middleware, JWT validation, protected routes.

### Epic 1.2: Audit Engine — Core (10 tasks, Atlas, mixed S/M/L)
Lighthouse runner, axe-core runner, security headers checker, UX/mobile checker, SSL checker, weighted score calculator, SSRF URL validator, BullMQ queue setup, full audit orchestrator, status polling.

### Epic 1.3: Database & API (6 tasks, Atlas, S/M)
Prisma schema (8 tables), initial migration, POST/GET audit endpoints, RLS policies.

### Epic 1.4: Frontend — Dashboard MVP (8 tasks, Atelier + Atlas, mixed)
Dashboard layout, audit input page, progress indicator, score ring component, category score cards, issues list, audit history, loading states.

### Epic 1.5: Landing Page (5 tasks, Atelier + Atlas + Gwen, mixed)
Landing page design + implementation, URL input, SEO meta tags, pricing section.

---

## 4. Phase 2: Monetization (Week 9–12)

**Goal:** Stripe billing live, paid plans enforced, PDF reports, AI recommendations.

### Epic 2.1: AI Recommendations (8 tasks)
Prompt design, prompt builder, OpenAI GPT-4o integration, Redis caching, AI recommendations UI, summary paragraph, graceful degradation, GPT-4o-mini fallback.

### Epic 2.2: Stripe Billing (7 tasks)
Stripe products/prices setup, Checkout integration, webhook handler, Customer Portal, plan enforcement middleware, pricing page, invoice history.

### Epic 2.3: PDF Reports (6 tasks)
PDF report design, @react-pdf/renderer generation, upload to Supabase Storage, download endpoint, white-label (Agency), generation queue.

### Epic 2.4: Shareable Reports (4 tasks)
Share token generation, public report view page, share link UI, expiry enforcement.

---

## 5. Phase 3: Growth (Month 4–6)

**Goal:** Agency features, API access, integrations, 100 customers.

### Epic 3.1: Agency Features (5 tasks)
Org creation flow, team member invitation, RBAC, shared dashboard, bulk audit.

### Epic 3.2: API Access (5 tasks)
API key generation/management, key authentication, public API docs, webhook support, rate limiting per key.

### Epic 3.3: Scheduled Monitoring (5 tasks)
Scheduled audit config, cron-based scheduler, score regression detection, email notifications, Slack integration.

---

## 6. Phase 4: Scale (Month 7–12)

**Goal:** Performance optimization, enterprise readiness, advanced analytics.

### Epic 4.1: Performance & Reliability (5 tasks)
Worker horizontal scaling, audit result caching, DB query optimization, CDN for PDFs, Lighthouse median-of-3 runs.

### Epic 4.2: Advanced Analytics (4 tasks)
Score trend charts, category breakdown trends, comparative benchmarking, CSV export.

### Epic 4.3: Enterprise Features (5 tasks)
Enterprise SSO, custom audit rules builder, multi-page site crawl, on-premise deployment, SLA-backed support.

---

## 7. Definition of Done (DoD)

Every task must satisfy:

### Code Tasks (Atlas)
✅ Code committed, TypeScript compiles, ESLint passes, tests written/passing, self-reviewed, PR opened, reviewed, merged, deployed, no new Sentry errors.

### Design Tasks (Atelier)
✅ Figma shared, design tokens documented, all states covered, responsive designs, dark mode considered, WCAG AA contrast checked.

### Content Tasks (Gwen)
✅ Shared for approval, SEO keywords integrated, grammar/style checked, consistent brand voice.

### Research Tasks (Vega)
✅ Findings documented, raw data preserved, key insights highlighted, actionable recommendations included.

---

## Complexity Guide

| Label | Meaning | Expected Time |
|-------|---------|---------------|
| **S** | Well-understood, low risk | 2-4 hours |
| **M** | Requires design, moderate integration | 1-2 days |
| **L** | Complex, multi-file, significant testing | 3-5 days |
| **XL** | Research required, multiple unknowns | 1-2 weeks |

---

**Next:** See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for the design system specification.
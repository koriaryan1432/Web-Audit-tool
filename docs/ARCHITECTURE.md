# SiteGrade — System Architecture

**Document Version:** 1.0
**Last Updated:** July 20, 2026
**Author:** Atlas (Full-Stack Engineer)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [High-Level Architecture Diagram](#2-high-level-architecture-diagram)
3. [Component Breakdown](#3-component-breakdown)
4. [Data Flow: URL Audit (End-to-End)](#4-data-flow-url-audit-end-to-end)
5. [Authentication & Authorization Model](#5-authentication--authorization-model)
6. [Multi-Tenancy](#6-multi-tenancy)
7. [Rate Limiting & Abuse Prevention](#7-rate-limiting--abuse-prevention)
8. [Scalability Plan](#8-scalability-plan)
9. [Deployment Architecture](#9-deployment-architecture)

---

## 1. Architecture Overview

SiteGrade follows a **queue-driven, event-based microservices architecture** deployed across two platforms:

- **Vercel** — hosts the Next.js frontend (SSR, static, edge functions)
- **Railway** — hosts the Hono.js API and worker processes (long-running, stateful)

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Queue-based audit processing | Decouples API from heavy audit work; horizontal scaling of workers |
| Vercel + Railway split | Vercel for Next.js SSR; Railway for persistent worker processes |
| Monorepo (Turborepo) | Shared types, UI components, DB client; single source of truth |
| Supabase as core data layer | Eliminates DB ops; includes Auth, Storage, RLS out of the box |
| BullMQ + Upstash Redis | De-facto Node.js job queue; serverless Redis with no idle cost |

---

## 2. High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                             │
│  Browser (Next.js SSR/CSR)  ←→  CDN (Vercel Edge Network)        │
└──────────────────────────────┬───────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────▼───────────────────────────────────┐
│                        API LAYER                                  │
│  Next.js API Routes / Hono.js (Railway)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   Auth   │ │  Audits  │ │ Reports  │ │  Billing │           │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└──────────────────┬──────────────────────────────────────────────┘
                   │ Enqueue Job
┌──────────────────▼──────────────────────────────────────────────┐
│                       QUEUE LAYER                                 │
│  BullMQ + Redis (Upstash Redis)                                   │
│  ┌─────────────────┐  ┌─────────────┐  ┌────────────────┐       │
│  │  audit-queue    │  │  pdf-queue  │  │  email-queue   │       │
│  └────────┬────────┘  └──────┬──────┘  └───────┬────────┘       │
└───────────┼──────────────────┼──────────────────┼───────────────┘
            │ Dequeue          │ Dequeue          │ Dequeue
┌───────────▼──────────┐ ┌─────▼──────────┐ ┌─────▼──────────────┐
│   AUDIT WORKER       │ │  PDF WORKER    │ │  EMAIL WORKER      │
│   (Railway)          │ │  (Railway)     │ │  (Railway)         │
│  ┌────────────────┐  │ │  @react-pdf    │ │  Resend API        │
│  │ Lighthouse     │  │ │  renderer      │ └────────────────────┘
│  │ axe-core       │  │ └────────────────┘
│  │ Custom Checkers│  │
│  │ Score Calc     │  │
│  │ OpenAI GPT-4o  │  │
│  └────────────────┘  │
└───────────┬──────────┘
            │ Write Results
┌───────────▼──────────────────────────────────────────────────────┐
│                      DATA LAYER                                   │
│  ┌────────────────────────────┐  ┌──────────────────────────────┐│
│  │  PostgreSQL (Supabase)     │  │  Redis (Upstash)             ││
│  │  - users, organizations   │  │  - Job queues (BullMQ)       ││
│  │  - audits, audit_results  │  │  - Session cache             ││
│  │  - reports, subscriptions │  │  - AI response cache         ││
│  │  - api_keys               │  │  - Rate limit counters       ││
│  └────────────────────────────┘  └──────────────────────────────┘│
│                                  ┌──────────────────────────────┐│
│                                  │  Supabase Storage (S3)       ││
│                                  │  - Generated PDF reports     ││
│                                  │  - Audit screenshots         ││
│                                  └──────────────────────────────┘│
└───────────────┬──────────────────────────────────────────────────┘
                │ External APIs
┌───────────────▼──────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                              │
│  Google PageSpeed API  │  OpenAI GPT-4o  │  Stripe  │  Resend   │
│  Sentry (errors)       │  PostHog (analytics)     │  Vercel    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Breakdown

### 3.1 Web App (`apps/web`)

Next.js 14 frontend — landing pages, dashboard, audit results, settings.

**Routes:**

| Route | Auth | Description |
|-------|------|-------------|
| `/` | No | Landing page with URL input form |
| `/pricing` | No | Pricing page with Stripe checkout |
| `/blog/*` | No | Blog content |
| `/r/[token]` | No | Public shareable report view |
| `/dashboard` | Yes | Dashboard home (audit history, stats) |
| `/dashboard/audits/new` | Yes | New audit URL input page |
| `/dashboard/audits/[id]` | Yes | Individual audit results |
| `/dashboard/reports` | Yes | Report management |
| `/dashboard/settings` | Yes | Account, billing, API keys, team |

### 3.2 API Server (`apps/api`)

Hono.js REST API on Railway — handles all authenticated requests.

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/audits` | JWT | Create new audit, enqueue job |
| `GET` | `/audits` | JWT | List user's audits (paginated) |
| `GET` | `/audits/:id` | JWT | Get audit status + results |
| `GET` | `/reports/:token` | None | Public report view |
| `POST` | `/reports/:auditId/pdf` | JWT | Trigger PDF generation |
| `GET` | `/health` | None | Health check |
| `POST` | `/webhooks/stripe` | Stripe sig | Stripe webhook handler |

### 3.3 Audit Worker (`apps/worker`)

Background process running on Railway — picks up audit jobs, runs all checks, generates AI recommendations.

**Runner Details:**

| Runner | Tool | Output | Time |
|--------|------|--------|------|
| Lighthouse | `lighthouse` npm + `chrome-launcher` | JSON — performance, SEO, BP, PWA | 20-40s |
| axe-core | `@axe-core/puppeteer` | Violations by severity + WCAG criteria | 5-10s |
| Security | Custom (Node `fetch` + `tls`) | Header presence, SSL validity, exposed files | 1-3s |
| UX | Custom (Puppeteer DOM analysis) | Mobile viewport, tap targets, font legibility | 3-5s |

### 3.4 PDF Worker & Email Worker

Generate PDF reports asynchronously via `@react-pdf/renderer` and send transactional emails via Resend.

### 3.5 Shared Packages (`packages/*`)

| Package | Purpose |
|---------|---------|
| `types` | Shared TypeScript types + Zod schemas |
| `ui` | Shared React components: ScoreRing, CategoryCard, IssueItem |
| `db` | Prisma schema, migrations, singleton client |
| `config` | Shared ESLint, TypeScript, Tailwind configs |
| `utils` | URL normalization, SSRF validation, score helpers |

---

## 4. Data Flow: URL Audit (End-to-End)

```
Step 1: USER SUBMITS URL
  → POST /api/audits { url, options }
  → SSRF check (block private IPs, localhost, metadata endpoints)
  → Create audit record (status: "queued")
  → Enqueue BullMQ job
  → Return { auditId, status: "queued" }
  → Browser polls GET /audits/:id every 2 seconds

Step 2: AUDIT WORKER PROCESSES
  → Dequeue job, update status → "running"
  → Launch headless Chromium
  → Run Lighthouse (performance, SEO, best-practices, PWA)
  → Run axe-core (accessibility)
  → Run custom checkers (security headers, UX checks)
  → Kill Chromium

Step 3: SCORE CALCULATION
  → Aggregate raw results
  → Weighted scores: Performance 30%, SEO 20%, A11y 20%, Security 15%, UX 10%, BP 5%

Step 4: AI RECOMMENDATIONS
  → Check Redis cache (URL + audit checksum)
  → Cache HIT → use cached recommendations
  → Cache MISS → call GPT-4o with failing items → cache result (TTL: 7 days)

Step 5: PERSIST + NOTIFY
  → Write audit_results to PostgreSQL
  → Update audit status → "completed"
  → Enqueue PDF job (if plan allows)
  → Client polling detects completion → fetches full results
```

### Timing Budget

| Phase | Target | Max |
|-------|--------|-----|
| URL validation | < 200ms | 500ms |
| Lighthouse run | 25-35s | 45s |
| axe-core run | 5-8s | 15s |
| Security checks | 1-2s | 5s |
| UX checks | 3-5s | 10s |
| AI generation (cache miss) | 3-5s | 8s |
| **Total (p95)** | **~42s** | **60s** |

---

## 5. Authentication & Authorization

### Auth Provider: Supabase Auth
- JWT issuance, refresh, validation
- Email/password + email verification
- Google OAuth 2.0

### Authorization Model
```
Role Hierarchy: OWNER → ADMIN → MEMBER
Free/Pro users: personal audits only
Agency users: org-level audits, shared across team
```

### RLS Policies
Supabase Row-Level Security enforces data isolation at DB level. All tables have RLS enabled.

---

## 6. Multi-Tenancy

Shared database, row-level isolation model.
- Every table includes `org_id` (nullable for personal accounts)
- RLS policies enforce `org_id = auth.jwt()->>'orgId'`
- Agency plan creates `organizations` record; members linked via `org_members`
- White-label settings stored per org in `organizations.branding` (JSONB)

---

## 7. Rate Limiting

| Layer | Mechanism | Limits |
|-------|-----------|--------|
| API Gateway | Upstash Redis rate limiter | 100 req/min per IP (unauthenticated) |
| Audit endpoint | Per-user rate limit | Free: 3/month, Pro: 50/month, Agency: unlimited |
| URL validation | SSRF prevention | Block private IPs, localhost, metadata endpoints |
| AI endpoint | Per-audit | 1 AI call per audit (cache-miss only) |
| Auth endpoints | Rate limit | 5 attempts per IP per 15 minutes |

---

## 8. Scalability Plan

| Phase | Users | Workers | API Instances | Est. Infra Cost |
|-------|-------|---------|---------------|-----------------|
| Launch | 0-200 | 1 (2 vCPU, 4GB) | 1 (1 vCPU, 512MB) | $85-130/mo |
| Growth | 200-800 | 2-3 | 2 (load balanced) | $200-350/mo |
| Scale | 800-3,000 | 5-10 (auto-scale) | 3-5 | $500-800/mo |
| Enterprise | 3,000+ | K8s cluster | Multi-region | Architecture migration |

---

## 9. Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      VERCEL                             │
│  Next.js Web App — SSR landing, CSR dashboard, RSC     │
│  Edge Network → CDN for static assets                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                      RAILWAY                            │
│  API Service (Hono.js) — 1 vCPU, 512MB RAM             │
│  Worker Service (Node.js) — 2 vCPU, 4GB RAM            │
│  Auto-restart, Health check endpoints                  │
└─────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```
GitHub PR → Lint → Type-check → Test → Build
PR merge to main → Deploy web (Vercel) + api (Railway) + worker (Railway)
```

---

**Next:** See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for the complete database schema.
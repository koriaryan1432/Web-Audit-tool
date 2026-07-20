# SiteGrade — Tech Stack

**Document Version:** 1.0
**Last Updated:** July 20, 2026
**Author:** Atlas (Full-Stack Engineer)

---

## Table of Contents

1. [Stack Overview](#1-stack-overview)
2. [Frontend Decisions](#2-frontend-decisions)
3. [Backend Decisions](#3-backend-decisions)
4. [Database & Storage Decisions](#4-database--storage-decisions)
5. [Audit Engine Decisions](#5-audit-engine-decisions)
6. [AI Layer Decisions](#6-ai-layer-decisions)
7. [Infrastructure Decisions](#7-infrastructure-decisions)
8. [Development Tooling](#8-development-tooling)
9. [Alternatives Considered](#9-alternatives-considered)

---

## 1. Stack Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SITEGRADE TECH STACK                         │
├──────────────┬──────────────┬──────────────┬───────────────────────┤
│   FRONTEND   │    BACKEND   │   DATABASE   │    INFRASTRUCTURE     │
│──────────────│──────────────│──────────────│───────────────────────┤
│ Next.js 14   │ Hono.js      │ PostgreSQL   │ Vercel (web)          │
│ TypeScript 5 │ BullMQ v5    │ (Supabase)   │ Railway (api/workers) │
│ Tailwind CSS │ Prisma v7    │ Redis        │ GitHub Actions (CI/CD)│
│ shadcn/ui    │ Zod          │ (Upstash)    │ Sentry (errors)       │
│ Zustand      │ OpenAI SDK   │ Supabase     │ PostHog (analytics)   │
│ TanStack Qry │              │ Storage (S3) │ Stripe (payments)     │
│ Recharts     │              │              │ Resend (email)        │
│ Framer Motion│              │              │                       │
├──────────────┴──────────────┴──────────────┴───────────────────────┤
│                        AUDIT ENGINE                                 │
│────────────────────────────────────────────────────────────────────│
│  Lighthouse (Node)  │  axe-core  │  Custom checkers (security, UX) │
│────────────────────────────────────────────────────────────────────│
│                           AI LAYER                                  │
│────────────────────────────────────────────────────────────────────│
│  OpenAI GPT-4o (primary)  │  GPT-4o-mini (fallback)  │  Redis cache│
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Decisions

### 2.1 Next.js 14 (App Router)

**Chosen over:** Remix, SvelteKit, Nuxt, plain React

**Why Next.js:**
- SSR for SEO-critical landing page
- React Server Components for dashboard data fetching without client waterfalls
- Vercel-native zero-config deployment
- 4+ years deep expertise with Next.js
- File-based routing matching URL patterns

### 2.2 shadcn/ui

**Chosen over:** Material UI, Chakra UI, Headless UI

**Why shadcn/ui:**
- Copy-paste ownership — components live in your codebase
- Radix primitives under the hood — production-grade accessibility
- Tailwind-native — consistent with styling approach, no CSS-in-JS runtime
- No vendor lock-in — keep components if we outgrow it

### 2.3 Tailwind CSS v3

**Chosen over:** CSS Modules, styled-components, vanilla CSS

**Why Tailwind:**
- Utility-first for rapid iteration
- Consistent with shadcn/ui
- No runtime overhead — pure CSS generation at build time
- Design tokens as config — matching Figma design system
- Small production bundle — unused styles purged

### 2.4 Zustand + TanStack Query

**Chosen over:** Redux Toolkit, Jotai, React Query alone

**Why this combo:**
- Zustand for lightweight client state (UI, preferences, theme)
- TanStack Query for server state (audits, results) with automatic caching and polling
- Separation of concerns — each tool optimized for its domain

### 2.5 Recharts

**Chosen over:** Chart.js, D3.js, Nivo

**Why Recharts:**
- React-native — composed of React components
- Good enough for score trend line/bar charts
- Active maintenance with TypeScript support

### 2.6 Framer Motion

**Chosen over:** GSAP, React Spring, CSS only

**Why Framer Motion:**
- Declarative API — animations as JSX props
- Layout animations via `layoutId`
- AnimatePresence for exit animations
- Score ring animation trivial with SVG `animate`

---

## 3. Backend Decisions

### 3.1 Node.js 20 LTS

**Chosen over:** Python, Go, Bun

**Why Node.js:**
- Lighthouse runs natively in Node (no subprocess/HTTP proxy needed)
- TypeScript end-to-end — shared types via monorepo
- Large ecosystem — BullMQ, Prisma, OpenAI, Stripe are Node-first

### 3.2 Hono.js

**Chosen over:** Express, Fastify, Koa

**Why Hono:**
- Edge-compatible — runs on Vercel Edge, Workers, or Railway
- Significantly faster than Express (less middleware overhead)
- Excellent TypeScript support with type-safe request/response
- Built-in Zod integration via `zValidator`
- Lightweight (~14KB)

### 3.3 BullMQ v5

**Chosen over:** Bee-Queue, SQS+Lambda, RabbitMQ

**Why BullMQ:**
- Redis-backed — no additional infrastructure
- Job priorities — paid users get priority
- Retry with exponential backoff
- Dead letter queue for debugging
- OpenTelemetry support in v5
- De-facto standard for Node.js job queues

### 3.4 Prisma v7

**Chosen over:** Drizzle ORM, Knex.js, raw SQL, TypeORM

**Why Prisma:**
- Type-safe queries with generated types
- Battle-tested migration system
- Supabase compatibility (PgBouncer connection pooling)
- Schema as single source of truth
- Deep expertise — used since v2 across 5+ production projects

---

## 4. Database & Storage Decisions

### 4.1 PostgreSQL via Supabase

**Chosen over:** PlanetScale, Neon, AWS RDS

**Why Supabase:**
- All-in-one — Database + Auth + Storage + Realtime
- Managed PostgreSQL — no DB admin overhead
- Generous free tier — 500MB DB, 50,000 MAU
- RLS built-in — integrated with Supabase Auth JWTs
- PgBouncer for Prisma connection pooling
- S3-compatible Storage with CDN

### 4.2 Redis via Upstash

**Chosen over:** AWS ElastiCache, self-hosted Redis

**Why Upstash:**
- Serverless — pay per request, no idle cost
- BullMQ compatible — standard Redis protocol
- Global replication without configuration
- No connection limits

---

## 5. Audit Engine Decisions

### 5.1 Lighthouse (Node Module)

**Chosen over:** PageSpeed Insights API only, WebPageTest

**Why:** Free and unlimited (no API quota), identical results to PSI, programmatic control over device/throttling/categories

### 5.2 axe-core

**Chosen over:** WAVE API, Pa11y

**Why:** Industry standard (Deque's engine), 57% auto-detection rate, WCAG criteria mapping, severity classification

### 5.3 Custom Security & UX Checkers

**Why:** Security headers — simple HTTP response inspection. SSL — trivial via Node tls module. UX — Puppeteer DOM analysis combined with Lighthouse mobile metrics.

---

## 6. AI Layer Decisions

### 6.1 OpenAI GPT-4o

**Chosen over:** Claude 3.5 Sonnet, Gemini 1.5 Pro, Llama 3

**Why GPT-4o:**
- Best reasoning for technical recommendations and code generation
- Cached system prompts — 50% discount on input tokens
- JSON mode — native structured output
- Cost-effective — ~$0.008 per audit; ~$5-8/month at 1,000 audits with 65% cache hit
- Fallback to GPT-4o-mini (16× cheaper, same API)

### 6.2 Redis Caching

- Cache key: `ai:recommendations:{url_hash}:{audit_checksum}`
- TTL: 7 days
- Expected hit rate: 60-70%
- Cost impact: 60-70% reduction in OpenAI spend

---

## 7. Infrastructure Decisions

### 7.1 Vercel (Frontend)

**Why:** Next.js native, Edge Network CDN, Preview Deployments per PR, free tier sufficient for launch

### 7.2 Railway (Backend/Workers)

**Why:** Simple container deployment, supports long-running processes (workers need persistent Chrome), auto-scaling, GitHub integration

### 7.3 GitHub Actions (CI/CD)

**Why:** Free for public repos, native Vercel+Railway integration, vast ecosystem, YAML-based simplicity

---

## 8. Development Tooling

| Tool | Choice | Why |
|------|--------|-----|
| Monorepo | Turborepo | Incremental builds, shared caching, Vercel-maintained |
| Package manager | pnpm | Fast, disk-efficient, workspace support |
| Language | TypeScript 5.x | End-to-end type safety |
| Linting | ESLint + Prettier | Standard, editor integration |
| Git hooks | Husky + lint-staged | Pre-commit quality |
| PDF generation | @react-pdf/renderer | React-based, no headless browser |
| Email templates | React Email | React components, browser preview |
| Testing | Vitest | Fast, Vite-native, Jest-compatible |
| E2E Testing | Playwright | Cross-browser, reliable selectors (Phase 2+) |

---

## 9. Alternatives Considered

| Decision | Alternative | Why Rejected |
|----------|------------|-------------|
| Framework | Remix | Less ecosystem maturity; Vercel deployment not as seamless |
| UI Library | Material UI | Heavy, opinionated styling |
| API Framework | Express | Performance overhead, less TypeScript-friendly |
| ORM | Drizzle ORM | Excellent but newer; Prisma's ecosystem more mature |
| Queue | AWS SQS + Lambda | Cold starts incompatible with Lighthouse startup time |
| Hosting | All-in on Vercel | 60s timeout too tight for Lighthouse |
| AI Model | Claude 3.5 Sonnet | GPT-4o has superior structured output and automated caching |
| CSS | CSS-in-JS | Runtime overhead; Tailwind generates zero-runtime CSS |
| Charts | D3.js | Overkill for line/bar charts |
| Database | PlanetScale | Missing built-in Auth and Storage |
| Redis | AWS ElastiCache | Minimum ~$12/month at zero usage |

---

**Next:** See [ROADMAP.md](ROADMAP.md) for the development roadmap.
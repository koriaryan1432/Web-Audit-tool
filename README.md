# SiteGrade

> **Know your score. Fix what matters.**

SiteGrade audits any website in under 60 seconds — covering performance, SEO, accessibility, security, UX, and best practices — then uses AI to tell you exactly what to fix.

[![CI](https://github.com/koriaryan1432/Web-Audit-tool/actions/workflows/ci.yml/badge.svg)](https://github.com/koriaryan1432/Web-Audit-tool/actions/workflows/ci.yml)

---

## What is SiteGrade?

SiteGrade is the only website audit tool that combines **Lighthouse performance data**, **WCAG accessibility checks**, **SEO analysis**, **security scanning**, and **UX evaluation** — then uses AI to translate every finding into plain-language, prioritized fix recommendations with effort estimates.

### Key Features

| Feature | Description |
|---------|-------------|
| **6-Category Audits** | Performance, SEO, Accessibility, Security, UX, Best Practices — in one run |
| **AI Recommendations** | Plain-English fix instructions with effort estimates and code examples |
| **Score Rings** | Beautiful animated score visualization per category |
| **PDF Reports** | Downloadable, shareable professional audit reports |
| **White-Label** | Agency-branded reports (Agency plan) |
| **Shareable Links** | Public report links — no login required to view |
| **Score History** | Track improvements over time with trend charts |
| **API Access** | Programmatic audit triggering (Agency plan) |

### Target Audience

- **Freelance web designers/devs** — Audit client sites in 2 minutes instead of 2 hours
- **Web design agencies** — White-label reports, unified dashboard for all client sites
- **In-house dev teams** — Catch regressions, prove the value of performance work
- **SEO consultants** — Technical + SEO audit data in one report
- **Digital marketing agencies** — Branded reports to justify retainers

---

## Tech Stack

### Frontend: Next.js 14 (App Router), Tailwind CSS v3, shadcn/ui, Zustand + TanStack Query, Recharts, Framer Motion
### Backend: Hono.js (Node.js 20), BullMQ v5 + Redis, Prisma v7, Zod
### Database: PostgreSQL (Supabase), Redis (Upstash), Supabase Storage (S3)
### Audit Engine: Lighthouse (Node module), axe-core, Custom security/UX checkers
### AI Layer: OpenAI GPT-4o (primary), GPT-4o-mini (fallback), Redis caching
### Infrastructure: Vercel (web), Railway (api/workers), GitHub Actions (CI/CD), Sentry, PostHog, Stripe, Resend
### Development: Turborepo monorepo, pnpm, TypeScript 5.x, ESLint, Prettier, Vitest

---

## Getting Started

### Prerequisites: Node.js >= 20, pnpm >= 9, Supabase project, Upstash Redis, OpenAI API key, Stripe account

```bash
git clone https://github.com/koriaryan1432/Web-Audit-tool.git
cd Web-Audit-tool
pnpm install
cp .env.example .env  # Edit with your API keys
pnpm db:push
pnpm db:seed
pnpm dev
```

---

## Team

| Member | Role | Responsibilities |
|--------|------|-----------------|
| **Atlas** | Full-Stack Engineer | Architecture, all code, infra, CI/CD |
| **Atelier** | UI/UX Designer | Design system, Figma, visual polish |
| **Gwen** | Content Strategist | Landing page, blog, docs, SEO |
| **Vega** | Growth & Research | Customer interviews, pricing, pipeline |
| **Ben** | Project Manager | Linear, coordination, status reports |
| **Kori Aryan** | Founder / CEO | Product vision, final decisions |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Phase 2 Spec](docs/sitegarde_phase2_spec.md) | Full product specification and system design |
| [Architecture](docs/ARCHITECTURE.md) | System architecture, data flows, component breakdown |
| [Database Schema](docs/DATABASE_SCHEMA.md) | All tables, fields, types, constraints, indexes |
| [Tech Stack](docs/TECH_STACK.md) | Every technology decision with justification |
| [Roadmap](docs/ROADMAP.md) | All phases, epics, tasks, complexity, dependencies |
| [Design System](docs/DESIGN_SYSTEM.md) | Color tokens, typography, spacing, component inventory |
| [API Integrations](docs/API_INTEGRATIONS.md) | All integrations with usage, cost, fallbacks |
| [AI Strategy](docs/AI_STRATEGY.md) | Prompt design, token budget, caching, fallback |
| [Security](docs/SECURITY.md) | OWASP coverage, SSRF prevention, rate limiting, auth |

---

## License

Proprietary. All rights reserved.

---

**SiteGrade** — *Stop guessing. Start grading.*
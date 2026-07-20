# SiteGrade - Environment Variable Setup Guide

## Quick Start

```bash
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
cp apps/worker/.env.example apps/worker/.env.local
```

> Never commit `.env.local` or any file with real secrets.

---

## apps/api (Hono.js Backend)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase pooler URL (PgBouncer, port 6543). Used by Prisma at runtime. |
| `DIRECT_URL` | Yes | Direct Supabase connection (port 5432). Used by `prisma migrate`. |
| `SUPABASE_URL` | Yes | `https://[ref].supabase.co` |
| `SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key — server-side only, never expose to browser |
| `OPENAI_API_KEY` | Yes | GPT-4o-mini for recommendations, GPT-4o for complex analysis |
| `STRIPE_SECRET_KEY` | Yes | Use `sk_test_` for development |
| `STRIPE_WEBHOOK_SECRET` | Yes | From Stripe Dashboard > Webhooks |
| `RESEND_API_KEY` | Yes | Transactional email |
| `UPSTASH_REDIS_URL` | Yes | `rediss://default:[token]@[endpoint].upstash.io:6379` |
| `UPSTASH_REDIS_TOKEN` | Yes | REST API token for `@upstash/ratelimit` |
| `JWT_SECRET` | Yes | 32+ chars. Generate: `openssl rand -base64 32` |
| `NODE_ENV` | No | `development` / `production` / `test` |
| `PORT` | No | Default: `3001` |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |

**Where to find Supabase credentials:** Dashboard > Project > Settings > Database / API

**Stripe webhook events to subscribe to:**
- `customer.subscription.created/updated/deleted`
- `invoice.payment_succeeded/failed`

---

## apps/web (Next.js 14)

> `NEXT_PUBLIC_*` variables are bundled into client JS. Never put secrets here.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Same as `SUPABASE_URL` in apps/api |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Same as `SUPABASE_ANON_KEY` in apps/api |
| `NEXT_PUBLIC_API_URL` | Yes | URL of apps/api. Dev: `http://localhost:3001` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | `pk_test_` for dev |
| `NEXT_PUBLIC_APP_URL` | Yes | Dev: `http://localhost:3000` |

---

## apps/worker (BullMQ)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Direct connection (no pooler - worker uses long transactions) |
| `UPSTASH_REDIS_URL` | Yes | Same Redis instance as apps/api |
| `WORKER_CONCURRENCY` | No | Default: `2`. Each job needs ~512MB RAM for Chrome. |
| `LIGHTHOUSE_TIMEOUT_MS` | No | Default: `60000` (60 seconds) |

---

## Production Deployment

- **Vercel** (apps/web + apps/api): Dashboard > Project > Settings > Environment Variables
- **Railway** (apps/worker): Dashboard > Service > Variables

**Security rules:**
- Never hardcode secrets in code
- Use separate Stripe keys for test vs production
- Rotate `JWT_SECRET` and `STRIPE_WEBHOOK_SECRET` if compromised
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — treat like a root password

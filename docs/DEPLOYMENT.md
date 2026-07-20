# SiteGrade — Deployment Guide

> **Target stack:** Vercel (web) + Railway (api + worker) + Supabase (DB + Auth + Storage) + Upstash Redis

---

## Prerequisites

Before deploying, you need accounts on:

| Service | Purpose | Free tier |
|---------|---------|-----------|
| [Supabase](https://supabase.com) | PostgreSQL DB, Auth, Storage | ✅ 500MB DB |
| [Upstash](https://upstash.com) | Redis (BullMQ + caching) | ✅ 10K req/day |
| [Stripe](https://stripe.com) | Payments & subscriptions | ✅ Test mode |
| [Resend](https://resend.com) | Transactional email | ✅ 3K emails/mo |
| [Railway](https://railway.app) | API + Worker hosting | ✅ $5 credit |
| [Vercel](https://vercel.com) | Next.js web app hosting | ✅ Hobby plan |
| [OpenAI](https://platform.openai.com) | GPT-4o-mini recommendations | Pay-per-use |

---

## Step 1: Supabase Setup

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region close to your users (e.g., `us-east-1`)
3. Save the database password — you'll need it for `DATABASE_URL`

### 1.2 Get API Keys
Dashboard → Settings → API:
- Copy **Project URL** → `SUPABASE_URL`
- Copy **anon public** key → `SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
- Copy **JWT Secret** → `SUPABASE_JWT_SECRET`

### 1.3 Get Database URLs
Dashboard → Settings → Database → Connection string:
- **Transaction mode** (port 6543) → `DATABASE_URL` (add `?pgbouncer=true`)
- **Session mode** (port 5432) → `DIRECT_URL`

### 1.4 Run Prisma Migrations
```bash
# From repo root
cp .env.example .env.local
# Fill in DATABASE_URL and DIRECT_URL
pnpm --filter api prisma migrate deploy
pnpm --filter api prisma db seed  # optional: seed test data
```

### 1.5 Configure Auth Providers
Dashboard → Authentication → Providers:
- Enable **Email** (magic link + password)
- Enable **Google** (optional): add OAuth credentials from Google Cloud Console

### 1.6 Create Storage Bucket
Dashboard → Storage → New bucket:
- Name: `reports`
- Public: **Yes** (PDF reports need public read access)
- File size limit: `5MB`
- Allowed MIME types: `application/pdf`

---

## Step 2: Upstash Redis Setup

1. Go to [upstash.com](https://upstash.com) → Create Database
2. Choose **Redis**, region closest to Railway deployment
3. Copy **REST URL** → `UPSTASH_REDIS_REST_URL`
4. Copy **REST Token** → `UPSTASH_REDIS_REST_TOKEN`

---

## Step 3: Stripe Setup

### 3.1 Create Products
Dashboard → Products → Add product:

**SiteGrade Pro**
- Price: $29/month, recurring
- Copy Price ID → `STRIPE_PRO_PRICE_ID`

**SiteGrade Agency**
- Price: $99/month, recurring
- Copy Price ID → `STRIPE_AGENCY_PRICE_ID`

### 3.2 Get API Keys
Dashboard → Developers → API keys:
- **Secret key** → `STRIPE_SECRET_KEY`
- **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### 3.3 Configure Webhook (after Railway deploy)
Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://api.sitegade.app/api/v1/webhooks/stripe`
- Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## Step 4: Resend Setup

1. Go to [resend.com](https://resend.com) → API Keys → Create API Key
2. Copy key → `RESEND_API_KEY`
3. Add your domain → Domains → Add Domain
4. Add DNS records as instructed
5. Set `RESEND_FROM_EMAIL=noreply@yourdomain.com`

---

## Step 5: Railway Deployment (API + Worker)

### 5.1 Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### 5.2 Create Project
```bash
railway init
# Select "Empty project"
```

### 5.3 Deploy API Service
```bash
# In repo root
railway service create api
railway variables set \
  NODE_ENV=production \
  PORT=3001 \
  DATABASE_URL="postgresql://..." \
  DIRECT_URL="postgresql://..." \
  SUPABASE_URL="https://..." \
  SUPABASE_ANON_KEY="eyJ..." \
  SUPABASE_SERVICE_ROLE_KEY="eyJ..." \
  SUPABASE_JWT_SECRET="..." \
  UPSTASH_REDIS_REST_URL="https://..." \
  UPSTASH_REDIS_REST_TOKEN="AX..." \
  STRIPE_SECRET_KEY="sk_live_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  STRIPE_PRO_PRICE_ID="price_..." \
  STRIPE_AGENCY_PRICE_ID="price_..." \
  OPENAI_API_KEY="sk-..." \
  RESEND_API_KEY="re_..." \
  RESEND_FROM_EMAIL="noreply@sitegade.app" \
  APP_URL="https://sitegade.app"

railway up --service api
```

### 5.4 Deploy Worker Service
```bash
railway service create worker
railway variables set \
  NODE_ENV=production \
  WORKER_CONCURRENCY=3 \
  DATABASE_URL="postgresql://..." \
  SUPABASE_URL="https://..." \
  SUPABASE_SERVICE_ROLE_KEY="eyJ..." \
  UPSTASH_REDIS_REST_URL="https://..." \
  UPSTASH_REDIS_REST_TOKEN="AX..." \
  OPENAI_API_KEY="sk-..." \
  RESEND_API_KEY="re_..." \
  RESEND_FROM_EMAIL="noreply@sitegade.app" \
  APP_URL="https://sitegade.app"

railway up --service worker
```

### 5.5 Set Custom Domain (API)
Railway dashboard → api service → Settings → Custom Domain:
- Add `api.sitegade.app`
- Update DNS: CNAME `api` → Railway-provided domain

---

## Step 6: Vercel Deployment (Web App)

### 6.1 Connect Repository
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import `koriaryan1432/Web-Audit-tool`
3. Framework: **Next.js** (auto-detected)
4. Root directory: `.` (monorepo root)
5. Build command: `cd ../.. && pnpm turbo build --filter=web`
6. Output directory: `apps/web/.next`

### 6.2 Set Environment Variables
In Vercel dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL          = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = eyJ...
NEXT_PUBLIC_API_URL               = https://api.sitegade.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...
NEXT_PUBLIC_APP_URL               = https://sitegade.app
```

### 6.3 Set Custom Domain
Vercel dashboard → Domains → Add `sitegade.app`
Update DNS: A record → Vercel IP (shown in dashboard)

---

## Step 7: Post-Deployment Verification

Run through this checklist after deploying:

### API Health
```bash
curl https://api.sitegade.app/health
# Expected: {"status":"ok","timestamp":"...","version":"1.0.0"}
```

### Auth Flow
- [ ] Sign up with email → welcome email received
- [ ] Magic link login works
- [ ] JWT token returned and accepted by API

### Audit Pipeline
- [ ] POST `/api/v1/audits` with a valid URL → returns `{ auditId, status: "QUEUED" }`
- [ ] GET `/api/v1/audits/:id` → status transitions QUEUED → RUNNING → COMPLETE
- [ ] Audit complete email received
- [ ] AI recommendations generated

### Billing
- [ ] Stripe checkout session created
- [ ] Test payment completes (use Stripe test card `4242 4242 4242 4242`)
- [ ] Plan upgraded in DB
- [ ] Plan upgrade email received
- [ ] Stripe portal accessible

### PDF Generation
- [ ] POST `/api/v1/audits/:id/pdf` → returns `{ jobId, status: "generating" }`
- [ ] GET `/api/v1/audits/:id/pdf` → returns `{ status: "ready", pdfUrl: "..." }` after ~30s
- [ ] PDF URL is publicly accessible

### Stripe Webhook
```bash
# Test with Stripe CLI
stripe listen --forward-to https://api.sitegade.app/api/v1/webhooks/stripe
stripe trigger checkout.session.completed
```

---

## Troubleshooting

| Issue | Likely cause | Fix |
|-------|-------------|-----|
| `401 Unauthorized` on API | JWT secret mismatch | Verify `SUPABASE_JWT_SECRET` matches Supabase dashboard |
| Worker not processing jobs | Redis connection | Check `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` |
| PDF generation timeout | Puppeteer memory | Increase Railway worker memory to 1GB+ |
| Stripe webhook 400 | Wrong signing secret | Re-copy `STRIPE_WEBHOOK_SECRET` from Stripe dashboard |
| Email not sending | Resend domain not verified | Complete DNS verification in Resend dashboard |
| Prisma migration fails | Wrong `DIRECT_URL` | Use port 5432 (not 6543) for `DIRECT_URL` |

---

## Estimated Monthly Costs (Phase 0 — Launch)

| Service | Plan | Cost |
|---------|------|------|
| Supabase | Free | $0 |
| Upstash Redis | Free | $0 |
| Railway (api + worker) | Starter | ~$10 |
| Vercel | Hobby | $0 |
| Resend | Free | $0 |
| OpenAI (GPT-4o-mini) | Pay-per-use | ~$5 |
| Stripe | Pay-per-use | 2.9% + 30¢ per transaction |
| **Total** | | **~$15/mo** |

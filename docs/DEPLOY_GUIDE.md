# SiteGrade — Full Deployment Guide (M5)

> Last updated: 2026-07-26  
> Status: Supabase ✅ | Vercel ⏳ | Railway ⏳

---

## Prerequisites

- Node 20+, pnpm 9+
- Vercel account + CLI: `npm i -g vercel`
- Railway account + CLI: `npm i -g @railway/cli`
- Supabase project: `hiufunxsgtnyutiuhljp` ✅ (9 tables live)

---

## Step 1 — Vercel (Next.js web app)

### 1a. Login
```bash
vercel login
```

### 1b. Link & deploy from repo root
```bash
cd /path/to/Web-Audit-tool
vercel link   # select "Web-Audit-tool", framework: Next.js, root: apps/web
```

### 1c. Set env vars in Vercel dashboard
Go to: https://vercel.com/dashboard → your project → Settings → Environment Variables

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hiufunxsgtnyutiuhljp.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (anon key) |
| `NEXT_PUBLIC_API_URL` | Railway API URL (set after Step 2) |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL e.g. `https://sitegrade.vercel.app` |
| `NEXT_PUBLIC_APP_ENV` | `production` |

### 1d. Deploy
```bash
vercel --prod
```

Expected output: `✅ Production: https://web-audit-tool-xxx.vercel.app`

---

## Step 2 — Railway (API + Worker)

### 2a. Login
```bash
railway login
```

### 2b. Create project
```bash
railway init   # name: sitegrade
```

### 2c. Deploy API service
```bash
railway service create --name api
railway up --service api
```

Set env vars for the API service (Railway dashboard → api service → Variables):

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://postgres.hiufunxsgtnyutiuhljp:Webauditworkers@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | `postgresql://postgres:Webauditworkers@db.hiufunxsgtnyutiuhljp.supabase.co:5432/postgres` |
| `SUPABASE_URL` | `https://hiufunxsgtnyutiuhljp.supabase.co` |
| `SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key |
| `JWT_SECRET` | Run: `openssl rand -base64 32` |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `ALLOWED_ORIGINS` | Your Vercel URL |
| `APP_URL` | Your Vercel URL |
| `OPENAI_API_KEY` | _(add later)_ |
| `UPSTASH_REDIS_URL` | _(add later)_ |
| `UPSTASH_REDIS_TOKEN` | _(add later)_ |
| `STRIPE_SECRET_KEY` | _(add later — billing returns 503 without it)_ |

### 2d. Deploy Worker service
```bash
railway service create --name worker
railway up --service worker
```

Same env vars as API (minus PORT, ALLOWED_ORIGINS, APP_URL).  
Add: `WORKER_CONCURRENCY=3`

### 2e. Set start commands in Railway dashboard

**API service** → Settings → Start Command:
```
node apps/api/dist/index.js
```

**Worker service** → Settings → Start Command:
```
node apps/worker/dist/index.js
```

**Build command** (both services):
```
pnpm install --frozen-lockfile && pnpm turbo build --filter=api --filter=worker
```

### 2f. Get Railway API URL
Railway dashboard → api service → Settings → Networking → Generate Domain  
Copy the URL (e.g. `https://api-production-xxxx.up.railway.app`)

### 2g. Update Vercel env var
Go back to Vercel → set `NEXT_PUBLIC_API_URL` to the Railway API URL → redeploy.

---

## Step 3 — Verify

```bash
# Health check
curl https://your-railway-api.up.railway.app/api/v1/health

# Expected:
# {
#   "status": "ok",
#   "version": "0.0.1",
#   "timestamp": "...",
#   "features": { "stripe": false, "redis": false, "openai": false }
# }
```

---

## Env Vars Still Needed (add when ready)

| Variable | Service | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | Railway API | Billing routes return 503 without it |
| `STRIPE_WEBHOOK_SECRET` | Railway API | Webhook validation |
| `STRIPE_PRO_PRICE_ID` | Railway API | Stripe dashboard → Products |
| `STRIPE_AGENCY_PRICE_ID` | Railway API | Stripe dashboard → Products |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Vercel | Billing UI |
| `OPENAI_API_KEY` | Railway API + Worker | AI recommendations |
| `UPSTASH_REDIS_URL` | Railway API + Worker | Queue + rate limiting |
| `UPSTASH_REDIS_TOKEN` | Railway API + Worker | Queue + rate limiting |
| `RESEND_API_KEY` | Railway API | Transactional email |

All optional services degrade gracefully — the app boots and core audit flow works without them.

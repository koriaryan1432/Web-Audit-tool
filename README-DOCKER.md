# SiteGrade — Local Docker Setup

Run the entire SiteGrade stack locally with a single command.

## What's included

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| `web` | Custom (Next.js) | 3000 | Next.js frontend |
| `api` | Custom (Hono) | 3001 | REST API |
| `worker` | Custom (BullMQ + Chromium) | — | Audit job processor |
| `redis` | `redis:7-alpine` | 6379 | Local queue + cache |

Supabase is **external** (cloud) — no local Supabase container needed.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) >= 24 (or Docker Engine + Compose plugin)
- 8 GB RAM recommended (worker image includes Chromium)

---

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/koriaryan1432/Web-Audit-tool.git
cd Web-Audit-tool
```

### 2. Set up environment variables

```bash
cp .env.docker.example .env.docker
```

Open `.env.docker` and fill in the one required value:

```env
# Generate a strong JWT secret:
JWT_SECRET=$(openssl rand -base64 32)
```

Everything else is pre-filled (Supabase keys, Redis URL pointing to the local container).

### 3. Build and start

```bash
docker compose up --build
```

First build takes **5-10 minutes** (downloads Node, installs deps, installs Chromium for the worker).
Subsequent starts (no `--build`) take ~10 seconds.

### 4. Verify everything is running

```bash
# API health check
curl http://localhost:3001/api/v1/health
# -> { "status": "ok", "features": { "stripe": false, "redis": true, "openai": false } }

# Web app
open http://localhost:3000
```

---

## Common Commands

```bash
# Start in background (detached)
docker compose up --build -d

# View logs for a specific service
docker compose logs -f api
docker compose logs -f worker
docker compose logs -f web

# Stop all services
docker compose down

# Stop and remove volumes (wipes Redis data)
docker compose down -v

# Rebuild a single service after code changes
docker compose up --build api

# Open a shell in a running container
docker compose exec api sh
docker compose exec redis redis-cli
```

---

## Adding Optional Services

### Enable OpenAI (AI recommendations)

In `.env.docker`:
```env
OPENAI_API_KEY=sk-...
```
Then restart: `docker compose up -d api worker`

### Enable Stripe (billing)

In `.env.docker`:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_AGENCY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```
Then rebuild web + restart api: `docker compose up --build web api`

### Enable Email (Resend)

In `.env.docker`:
```env
RESEND_API_KEY=re_...
```
Then restart: `docker compose up -d api`

---

## Architecture Notes

### Redis
The local `redis` container is used for BullMQ job queuing. The `REDIS_URL=redis://redis:6379` env var points the API and worker to this container via Docker's internal network. When you deploy to production (Railway + Upstash), set `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` instead.

### Next.js Standalone Build
The web Dockerfile uses Next.js `output: 'standalone'` mode, which produces a minimal self-contained server. `NEXT_PUBLIC_*` vars are baked in at build time — if you change them, you must rebuild: `docker compose up --build web`.

### Worker + Chromium
The worker image is based on `node:20-bookworm-slim` (Debian) instead of Alpine because Playwright/Chromium requires glibc. The image is ~1.5 GB. Chromium runs in headless mode for Lighthouse audits.

### Supabase
The database (PostgreSQL) and auth are handled by Supabase cloud. The migration must be run once before starting the stack — see `docs/MIGRATION_GUIDE.md`.

---

## Troubleshooting

**`web` container exits immediately**
-> `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing in `.env.docker`. These are baked in at build time — check the build output.

**`api` container fails with `ECONNREFUSED redis:6379`**
-> Redis container isn't healthy yet. Wait 10 seconds and retry, or check `docker compose logs redis`.

**`worker` logs "no-op mode"**
-> `USE_LOCAL_REDIS=true` and `REDIS_URL=redis://redis:6379` should be set in `.env.docker`. Verify with `docker compose exec worker env | grep REDIS`.

**Port 3000 or 3001 already in use**
-> Change the host port in `docker-compose.yml`: `"3001:3001"` -> `"3002:3001"`.

**Chromium crashes in worker**
-> Increase Docker Desktop memory to 8 GB (Settings -> Resources -> Memory).

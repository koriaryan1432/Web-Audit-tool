# SiteGrade — Supabase Migration Guide (v2)

**Project:** `hiufunxsgtnyutiuhljp`  
**Migration file:** `apps/api/prisma/migrations/20260726_initial_schema/migration.sql`  
**Tables to create:** 9 (users, organizations, org_members, audits, audit_results, ai_recommendations, reports, subscriptions, api_keys)

---

## Why the sandbox can't run this automatically

The Supabase project's direct DB host (`db.hiufunxsgtnyutiuhljp.supabase.co`) resolves to an **IPv6-only address** (`2406:da1c:10e4:6401:...`). The AI sandbox has no IPv6 routing. The connection pooler (IPv4) returns `ENOTFOUND` because **pooler is not yet enabled** on this project.

The Management API (`api.supabase.com`) requires a **Personal Access Token (PAT)**, not the service role key.

---

## Option 1 — Supabase SQL Editor (Fastest, 30 seconds, no tools needed)

1. Go to: https://supabase.com/dashboard/project/hiufunxsgtnyutiuhljp/sql/new
2. Copy the entire contents of `apps/api/prisma/migrations/20260726_initial_schema/migration.sql`
3. Paste into the SQL editor
4. Click **Run**

Done. All 9 tables, 5 enums, 40+ indexes, and 13 foreign keys will be created.

---

## Option 2 — Enable Pooler + Run Prisma (Recommended for CI/CD)

### Step 1: Enable the connection pooler

1. Go to: https://supabase.com/dashboard/project/hiufunxsgtnyutiuhljp/settings/database
2. Scroll to **Connection Pooling**
3. Enable **Supavisor** (the pooler)
4. Note the pooler connection string

### Step 2: Run Prisma migrate deploy

```bash
cd apps/api
export DATABASE_URL="postgresql://postgres.hiufunxsgtnyutiuhljp:Webauditworkers@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
export DIRECT_URL="postgresql://postgres:Webauditworkers@db.hiufunxsgtnyutiuhljp.supabase.co:5432/postgres"
npx prisma migrate deploy
```

---

## Option 3 — psql from local machine

```bash
PGPASSWORD="Webauditworkers" psql \
  "postgresql://postgres@db.hiufunxsgtnyutiuhljp.supabase.co:5432/postgres?sslmode=require" \
  -f apps/api/prisma/migrations/20260726_initial_schema/migration.sql
```

> **Note:** Requires IPv6 on your local machine. Most home/office networks have it.

---

## Option 4 — Supabase CLI

```bash
brew install supabase/tap/supabase
supabase login
supabase db execute \
  --project-ref hiufunxsgtnyutiuhljp \
  --file apps/api/prisma/migrations/20260726_initial_schema/migration.sql
```

---

## Verification

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected: `ai_recommendations`, `api_keys`, `audit_results`, `audits`, `org_members`, `organizations`, `reports`, `subscriptions`, `users`

```sql
SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;
-- Expected: AuditStatus, IssueSeverity, OrgRole, Plan, SubscriptionStatus
```

---

## After Migration: Enable Pooler for Production

```env
# Railway (API service)
DATABASE_URL=postgresql://postgres.hiufunxsgtnyutiuhljp:Webauditworkers@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:Webauditworkers@db.hiufunxsgtnyutiuhljp.supabase.co:5432/postgres

# Vercel (web app)
NEXT_PUBLIC_SUPABASE_URL=https://hiufunxsgtnyutiuhljp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## What's in the migration

| Table | Purpose |
|---|---|
| `users` | Auth users (synced from Supabase Auth) |
| `organizations` | Team workspaces |
| `org_members` | User <-> org membership with roles |
| `audits` | Audit job records (URL, status, options) |
| `audit_results` | Lighthouse + axe scores and raw data |
| `ai_recommendations` | GPT-4o generated fix suggestions (cached) |
| `reports` | Shareable PDF reports with public tokens |
| `subscriptions` | Stripe subscription records |
| `api_keys` | API key hashes for programmatic access |

**Enums:** `Plan` (FREE/PRO/AGENCY), `OrgRole` (OWNER/ADMIN/MEMBER), `AuditStatus` (QUEUED/RUNNING/COMPLETE/FAILED), `IssueSeverity` (CRITICAL/HIGH/MEDIUM/LOW), `SubscriptionStatus` (ACTIVE/PAST_DUE/CANCELED/TRIALING/INCOMPLETE)

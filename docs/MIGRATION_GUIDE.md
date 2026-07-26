# SiteGrade — Database Migration Guide

## Running the Initial Migration

The Prisma migration SQL is committed at:
`apps/api/prisma/migrations/20260726_initial_schema/migration.sql`

### Option A: Supabase SQL Editor (Recommended for first-time setup)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/hiufunxsgtnyutiuhljp)
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the entire contents of `apps/api/prisma/migrations/20260726_initial_schema/migration.sql`
5. Paste and click **Run**

This creates all 9 tables: `users`, `organizations`, `org_members`, `audits`,
`audit_results`, `ai_recommendations`, `reports`, `subscriptions`, `api_keys`.

### Option B: `prisma migrate deploy` (from your local machine)

```bash
cd apps/api
cp .env.example .env.local
# Edit .env.local — set DATABASE_URL and DIRECT_URL
npx prisma migrate deploy
npx prisma generate
```

**Connection strings:**
```env
DATABASE_URL="postgresql://postgres.hiufunxsgtnyutiuhljp:Webauditworkers@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:Webauditworkers@db.hiufunxsgtnyutiuhljp.supabase.co:5432/postgres"
```

## Verifying Tables Were Created

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```

Expected: `ai_recommendations`, `api_keys`, `audit_results`, `audits`,
`org_members`, `organizations`, `reports`, `subscriptions`, `users`

## Schema Notes

- `stripe_customer_id` lives on `subscriptions`, NOT on `users`
- `cancel_at_period_end` not in schema yet — add when Stripe is configured

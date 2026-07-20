# SiteGrade — Database Schema

**Document Version:** 1.0
**Last Updated:** July 20, 2026
**Database:** PostgreSQL 15 (via Supabase)
**ORM:** Prisma v7

---

## Table of Contents

1. [Entity Relationship Diagram](#1-entity-relationship-diagram)
2. [Table Definitions](#2-table-definitions)
   - [users](#21-users)
   - [organizations](#22-organizations)
   - [org_members](#23-org_members)
   - [audits](#24-audits)
   - [audit_results](#25-audit_results)
   - [reports](#26-reports)
   - [subscriptions](#27-subscriptions)
   - [api_keys](#28-api_keys)
3. [Indexing Strategy](#3-indexing-strategy)
4. [Row-Level Security](#4-row-level-security)
5. [Migration Strategy](#5-migration-strategy)

---

## 1. Entity Relationship Diagram

```
┌──────────┐       ┌───────────────┐       ┌──────────────┐
│  users   │1────* │    audits     │1────1 │ audit_results│
└────┬─────┘       └───────┬───────┘       └──────────────┘
     │                     │
     │                     │*
     │                     │
     │1              ┌─────▼──────┐
     └───────────────│  reports   │
     │               └────────────┘
     │
     │*        ┌───────────────┐
     ├─────────│ org_members   │
     │         └───────┬───────┘
     │                 │*
     │                 │
     │1          ┌─────▼──────┐
     └───────────│organizations│
                 └─────┬──────┘
                       │
                       │1
                 ┌─────▼───────┐
                 │subscriptions│
                 └─────────────┘

┌──────────┐
│ api_keys │──── belongs to user OR organization
└──────────┘
```

---

## 2. Table Definitions

### 2.1 `users`

```sql
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT UNIQUE NOT NULL,
  email_verified    BOOLEAN DEFAULT false,
  name              TEXT,
  avatar_url        TEXT,
  provider          TEXT DEFAULT 'email',
  provider_id       TEXT,
  plan              TEXT DEFAULT 'free',
  audit_count_month INTEGER DEFAULT 0,
  audit_reset_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
```

**Indexes:**

| Name | Type | Columns | Purpose |
|------|------|---------|---------|
| `users_email_key` | UNIQUE | `email` | Login lookup |
| `idx_users_provider` | INDEX | `provider, provider_id` | OAuth lookup |
| `idx_users_plan` | INDEX | `plan` | Plan-based queries |

### 2.2 `organizations`

```sql
CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  owner_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  plan            TEXT DEFAULT 'agency',
  branding        JSONB DEFAULT '{}',
  audit_count_month INTEGER DEFAULT 0,
  audit_reset_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

**branding JSONB:**
```json
{
  "logo_url": "...",
  "primary_color": "#6366F1",
  "company_name": "Acme Web Design",
  "hide_sitegrade_branding": true
}
```

### 2.3 `org_members`

```sql
CREATE TABLE org_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT DEFAULT 'member',
  invited_by  UUID REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

**Indexes:**

| Name | Type | Columns | Purpose |
|------|------|---------|---------|
| `org_members_org_user_key` | UNIQUE | `org_id, user_id` | Prevent duplicates |
| `idx_org_members_user` | INDEX | `user_id` | User's orgs |
| `idx_org_members_org` | INDEX | `org_id` | Org members |

### 2.4 `audits`

```sql
CREATE TABLE audits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  org_id          UUID REFERENCES organizations(id) ON DELETE SET NULL,
  url             TEXT NOT NULL,
  url_normalized  TEXT NOT NULL,
  status          TEXT DEFAULT 'queued',
  error_message   TEXT,
  device          TEXT DEFAULT 'mobile',
  overall_score   INTEGER,
  queued_at       TIMESTAMPTZ DEFAULT now(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

**Indexes:**

| Name | Type | Columns | Purpose |
|------|------|---------|---------|
| `idx_audits_user_date` | INDEX | `user_id, created_at DESC` | Dashboard |
| `idx_audits_org_date` | INDEX | `org_id, created_at DESC` | Shared history |
| `idx_audits_url_date` | INDEX | `url_normalized, created_at DESC` | Trend chart |
| `idx_audits_status` | INDEX | `status` | Find running audits |

**RLS:**
```sql
CREATE POLICY "Users can read own audits" ON audits FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Org members can read shared audits" ON audits FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create audits" ON audits FOR INSERT WITH CHECK (user_id = auth.uid());
```

### 2.5 `audit_results`

```sql
CREATE TABLE audit_results (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id              UUID REFERENCES audits(id) ON DELETE CASCADE UNIQUE,
  performance_score     INTEGER,
  seo_score             INTEGER,
  accessibility_score   INTEGER,
  security_score        INTEGER,
  ux_score              INTEGER,
  best_practices_score  INTEGER,
  performance_data      JSONB,
  seo_data              JSONB,
  accessibility_data    JSONB,
  security_data         JSONB,
  ux_data               JSONB,
  best_practices_data   JSONB,
  issues                JSONB,
  ai_recommendations    JSONB,
  ai_summary            TEXT,
  lighthouse_version    TEXT,
  created_at            TIMESTAMPTZ DEFAULT now()
);
```

### 2.6 `reports`

```sql
CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id        UUID REFERENCES audits(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  org_id          UUID REFERENCES organizations(id) ON DELETE SET NULL,
  share_token     TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  pdf_url         TEXT,
  pdf_generated   BOOLEAN DEFAULT false,
  is_public       BOOLEAN DEFAULT true,
  expires_at      TIMESTAMPTZ,
  view_count      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 2.7 `subscriptions`

```sql
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  org_id                UUID REFERENCES organizations(id) ON DELETE SET NULL,
  stripe_customer_id    TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  plan                  TEXT NOT NULL,
  status                TEXT NOT NULL,
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN DEFAULT false,
  trial_end             TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);
```

### 2.8 `api_keys`

```sql
CREATE TABLE api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  key_hash    TEXT UNIQUE NOT NULL,
  key_prefix  TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. Indexing Strategy

### Principles
- Cover hot paths first — indexes on WHERE, JOIN, ORDER BY columns
- Composite indexes for multi-column queries
- Unique constraints for data integrity (email, share_token, stripe_customer_id)
- JSONB indexing deferred to Phase 2+

### Query Performance Targets
- User dashboard: < 50ms at p95
- Share token lookup: < 10ms
- API key validation: < 5ms
- Audit status poll: < 20ms
- Full audit result fetch: < 100ms

---

## 4. Row-Level Security

All user-data tables have RLS enabled:

| Table | RLS Policies |
|-------|-------------|
| `users` | Read own, Update own |
| `organizations` | Members read, Owner update |
| `org_members` | Members read their org |
| `audits` | Owner read/write, Org members read |
| `audit_results` | Inherits via audit ownership |
| `reports` | Owner read/write, Public read if `is_public=true` |
| `subscriptions` | Owner read only |
| `api_keys` | Owner read/write |

### Public Report Access
```sql
CREATE POLICY "Anyone can read public reports"
  ON reports FOR SELECT
  USING (is_public = true AND (expires_at IS NULL OR expires_at > now()));
```

---

## 5. Migration Strategy

All schema changes via Prisma Migrate:

```bash
# Dev
pnpm db:migrate:dev --name descriptive_name

# Production
pnpm db:migrate:deploy
```

### Rules
1. Never edit existing migrations — only add new ones
2. Migrations must be reversible
3. No data-loss migrations without backup
4. Run migrations in CI before deploy
5. Seed after migration: `pnpm db:seed`

---

**Next:** See [TECH_STACK.md](TECH_STACK.md) for technology decisions.
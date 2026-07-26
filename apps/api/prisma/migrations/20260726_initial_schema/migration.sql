-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'AGENCY');

-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "IssueSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'INCOMPLETE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "avatar_url" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "owner_id" UUID NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "seats" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_members" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "OrgRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "org_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audits" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "org_id" UUID,
    "status" "AuditStatus" NOT NULL DEFAULT 'QUEUED',
    "options" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_results" (
    "id" UUID NOT NULL,
    "audit_id" UUID NOT NULL,
    "performance_score" SMALLINT NOT NULL,
    "accessibility_score" SMALLINT NOT NULL,
    "seo_score" SMALLINT NOT NULL,
    "best_practices_score" SMALLINT NOT NULL,
    "raw_lighthouse" JSONB NOT NULL,
    "raw_axe" JSONB NOT NULL DEFAULT '[]',
    "issues" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_recommendations" (
    "id" UUID NOT NULL,
    "audit_result_id" UUID NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "severity" "IssueSeverity" NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT NOT NULL,
    "fix_suggestion" TEXT NOT NULL,
    "cache_key" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "audit_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "pdf_url" TEXT,
    "share_token" VARCHAR(64) NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "org_id" UUID,
    "stripe_customer_id" VARCHAR(255) NOT NULL,
    "stripe_subscription_id" VARCHAR(255) NOT NULL,
    "plan" "Plan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "current_period_start" TIMESTAMPTZ NOT NULL,
    "current_period_end" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "org_id" UUID,
    "key_hash" VARCHAR(64) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "last_used_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,
    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_plan_idx" ON "users"("plan");
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE INDEX "organizations_owner_id_idx" ON "organizations"("owner_id");
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");
CREATE INDEX "org_members_org_id_idx" ON "org_members"("org_id");
CREATE INDEX "org_members_user_id_idx" ON "org_members"("user_id");
CREATE UNIQUE INDEX "org_members_org_id_user_id_key" ON "org_members"("org_id", "user_id");
CREATE INDEX "audits_user_id_idx" ON "audits"("user_id");
CREATE INDEX "audits_org_id_idx" ON "audits"("org_id");
CREATE INDEX "audits_status_idx" ON "audits"("status");
CREATE INDEX "audits_url_idx" ON "audits"("url");
CREATE INDEX "audits_created_at_idx" ON "audits"("created_at" DESC);
CREATE UNIQUE INDEX "audit_results_audit_id_key" ON "audit_results"("audit_id");
CREATE INDEX "audit_results_audit_id_idx" ON "audit_results"("audit_id");
CREATE INDEX "audit_results_performance_score_idx" ON "audit_results"("performance_score");
CREATE INDEX "audit_results_created_at_idx" ON "audit_results"("created_at" DESC);
CREATE UNIQUE INDEX "ai_recommendations_cache_key_key" ON "ai_recommendations"("cache_key");
CREATE INDEX "ai_recommendations_audit_result_id_idx" ON "ai_recommendations"("audit_result_id");
CREATE INDEX "ai_recommendations_severity_idx" ON "ai_recommendations"("severity");
CREATE INDEX "ai_recommendations_cache_key_idx" ON "ai_recommendations"("cache_key");
CREATE UNIQUE INDEX "reports_share_token_key" ON "reports"("share_token");
CREATE INDEX "reports_audit_id_idx" ON "reports"("audit_id");
CREATE INDEX "reports_user_id_idx" ON "reports"("user_id");
CREATE INDEX "reports_share_token_idx" ON "reports"("share_token");
CREATE INDEX "reports_is_public_idx" ON "reports"("is_public");
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");
CREATE UNIQUE INDEX "subscriptions_org_id_key" ON "subscriptions"("org_id");
CREATE UNIQUE INDEX "subscriptions_stripe_customer_id_key" ON "subscriptions"("stripe_customer_id");
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");
CREATE INDEX "subscriptions_stripe_customer_id_idx" ON "subscriptions"("stripe_customer_id");
CREATE INDEX "subscriptions_stripe_subscription_id_idx" ON "subscriptions"("stripe_subscription_id");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");
CREATE INDEX "api_keys_user_id_idx" ON "api_keys"("user_id");
CREATE INDEX "api_keys_org_id_idx" ON "api_keys"("org_id");
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys"("key_hash");
CREATE INDEX "api_keys_revoked_at_idx" ON "api_keys"("revoked_at");

-- Foreign Keys
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audits" ADD CONSTRAINT "audits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audits" ADD CONSTRAINT "audits_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_results" ADD CONSTRAINT "audit_results_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_audit_result_id_fkey" FOREIGN KEY ("audit_result_id") REFERENCES "audit_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

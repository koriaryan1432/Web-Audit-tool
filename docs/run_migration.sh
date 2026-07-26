#!/usr/bin/env bash
# ============================================================
# SiteGrade — Supabase Migration Runner
# Run this from your LOCAL machine (not a sandbox/CI)
# Usage: bash run_migration.sh
# ============================================================
set -euo pipefail

PROJECT_REF="hiufunxsgtnyutiuhljp"
SUPABASE_URL="https://hiufunxsgtnyutiuhljp.supabase.co"
DB_PASSWORD="Webauditworkers"
MIGRATION_FILE="apps/api/prisma/migrations/20260726_initial_schema/migration.sql"

echo ""
echo "SiteGrade — Supabase Migration Runner"
echo "======================================"
echo ""

# Option A: psql direct (works if you have IPv6)
run_psql_direct() {
  echo "Attempting direct psql connection..."
  PGPASSWORD="$DB_PASSWORD" PGCONNECT_TIMEOUT=15 psql \
    "postgresql://postgres@db.${PROJECT_REF}.supabase.co:5432/postgres?sslmode=require" \
    -f "$MIGRATION_FILE" \
    && echo "Migration applied via direct psql" \
    && return 0
  return 1
}

# Option B: psql via pooler (works once pooler is enabled in Supabase dashboard)
run_psql_pooler() {
  echo "Attempting pooler psql connection..."
  PGPASSWORD="$DB_PASSWORD" PGCONNECT_TIMEOUT=15 psql \
    "postgresql://postgres.${PROJECT_REF}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require" \
    -f "$MIGRATION_FILE" \
    && echo "Migration applied via pooler psql" \
    && return 0
  return 1
}

# Option C: Supabase CLI
run_supabase_cli() {
  echo "Attempting Supabase CLI..."
  if ! command -v supabase &>/dev/null; then
    echo "supabase CLI not found — skipping"
    return 1
  fi
  supabase db execute --project-ref "$PROJECT_REF" --file "$MIGRATION_FILE" \
    && echo "Migration applied via Supabase CLI" \
    && return 0
  return 1
}

# Option D: Prisma migrate deploy
run_prisma() {
  echo "Attempting Prisma migrate deploy..."
  if ! command -v npx &>/dev/null; then
    echo "npx not found — skipping"
    return 1
  fi
  cd apps/api
  DIRECT_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres" \
  DATABASE_URL="postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true" \
  npx prisma migrate deploy \
    && echo "Migration applied via Prisma" \
    && return 0
  cd ../..
  return 1
}

# Try each option in order
if run_psql_direct 2>/dev/null; then
  :
elif run_psql_pooler 2>/dev/null; then
  :
elif run_supabase_cli 2>/dev/null; then
  :
elif run_prisma 2>/dev/null; then
  :
else
  echo ""
  echo "All automated methods failed."
  echo ""
  echo "MANUAL OPTION: Supabase SQL Editor (30 seconds)"
  echo "1. Open: https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new"
  echo "2. Paste the contents of: ${MIGRATION_FILE}"
  echo "3. Click Run"
  echo ""
  exit 1
fi

echo ""
echo "Verifying tables..."

PGPASSWORD="$DB_PASSWORD" PGCONNECT_TIMEOUT=10 psql \
  "postgresql://postgres@db.${PROJECT_REF}.supabase.co:5432/postgres?sslmode=require" \
  -t -c "
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  " 2>/dev/null | while read -r table; do
    table=$(echo "$table" | xargs)
    [ -z "$table" ] && continue
    echo "  OK: $table"
  done

echo ""
echo "Migration complete!"

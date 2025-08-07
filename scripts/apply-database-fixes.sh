#!/usr/bin/env bash
set -euo pipefail

# scripts/apply-database-fixes.sh
# Safe, idempotent database fixes for ClaimGuardian.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[db-fixes] Guarding against illegal role grants..."
"${ROOT_DIR}/scripts/guard-privileges.sh"

echo "[db-fixes] Applying core fixes migration..."
# Use your preferred invocation. Examples:

# Option A: psql with environment variables already set for production
# psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ROOT_DIR/supabase/migrations/20250807_fix_health_and_onboarding.sql"

# Option B: Supabase CLI for local dev
# supabase db reset --db-url "$LOCAL_DATABASE_URL" --no-seed
# supabase migration up

echo "[db-fixes] Done."

# Notes:
# - Removed any call to util.autofix_signup_privileges() since it does not exist
#   and is not needed with the onboarding trigger in place.
# - If you had a previous call like: CALL util.autofix_signup_privileges();
#   that is now intentionally gone.

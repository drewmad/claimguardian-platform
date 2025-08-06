#!/bin/bash

# Apply database fixes for missing tables and functions

echo "🔧 Applying database fixes..."

# Get the migration file path
MIGRATION_FILE="supabase/migrations/20250806_fix_missing_tables_and_functions.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Migration file not found: $MIGRATION_FILE"
  exit 1
fi

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI is not installed"
  echo "Please install it: https://supabase.com/docs/guides/cli"
  exit 1
fi

# Apply the migration
echo "📤 Applying migration: $MIGRATION_FILE"
supabase db push --include-migrations || {
  echo "❌ Failed to apply migration via Supabase CLI"
  echo ""
  echo "Alternative: Apply manually via Supabase Dashboard:"
  echo "1. Go to https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql"
  echo "2. Copy the contents of $MIGRATION_FILE"
  echo "3. Paste and run in the SQL Editor"
  exit 1
}

echo "✅ Database fixes applied successfully!"
echo ""
echo "The following issues have been resolved:"
echo "- Created policy_documents_extended view"
echo "- Created util.autofix_signup_privileges() function"
echo "- Created public.handle_new_user() trigger function"
echo "- Fixed pg_cron job syntax (CALL -> SELECT)"
echo "- Added necessary permissions and RLS policies"
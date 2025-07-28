#!/bin/bash

# Database validation script
# Runs comprehensive checks on database schema and migrations

set -e

echo "🔍 Starting database validation..."

# Check if Supabase is running
if ! supabase status 2>/dev/null | grep -q "API URL"; then
  echo "❌ Supabase is not running. Start it with 'supabase start'"
  exit 1
fi

# 1. Lint the schema
echo "📋 Linting database schema..."
supabase db lint --local --schema public,claims,properties

# 2. Check for schema drift
echo "🔄 Checking for schema drift..."
if ! supabase db diff --local; then
  echo "⚠️  Schema drift detected. Run 'supabase db pull' to sync."
fi

# 3. Validate migrations
echo "📁 Checking migration files..."
MIGRATION_DIR="supabase/migrations"
if [ -d "$MIGRATION_DIR" ]; then
  # Check for duplicate timestamps
  timestamps=$(ls -1 $MIGRATION_DIR/*.sql 2>/dev/null | sed 's/.*\///' | cut -d'_' -f1 | sort)
  duplicates=$(echo "$timestamps" | uniq -d)
  
  if [ -n "$duplicates" ]; then
    echo "❌ Duplicate migration timestamps found:"
    echo "$duplicates"
    exit 1
  fi
  
  # Check for migration file naming
  for file in $MIGRATION_DIR/*.sql; do
    filename=$(basename "$file")
    if ! [[ $filename =~ ^[0-9]{14}_[a-z_]+\.sql$ ]]; then
      echo "⚠️  Non-standard migration filename: $filename"
      echo "   Expected format: YYYYMMDDHHmmss_description.sql"
    fi
  done
fi

# 4. Test type generation
echo "🔤 Testing type generation..."
cd apps/web
if pnpm db:types:local; then
  echo "✅ Type generation successful"
else
  echo "❌ Type generation failed"
  exit 1
fi
cd ../..

# 5. Check for common issues
echo "🔎 Checking for common issues..."

# Check for missing indexes on foreign keys
supabase db lint --local --level warning | grep -i "index" || true

# Check for unused indexes
supabase db lint --local --level warning | grep -i "unused" || true

echo "✅ Database validation complete!"
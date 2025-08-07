#!/bin/bash

# Apply migration using Supabase CLI approach

echo "🚀 Applying property schema migration via Supabase..."
echo ""

# Set required environment variables
export SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN}"
export SUPABASE_URL="https://tmlrvecuwgppbaynesji.supabase.co"

# Since direct db push isn't working due to migration conflicts,
# we'll use the dashboard approach

echo "📋 Opening Supabase SQL Editor..."
open "https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/editor"

echo ""
echo "📄 Copying migration SQL to clipboard..."

# Copy the migration file to clipboard
cat supabase/migrations/20250724_property_schema_migration.sql | pbcopy

echo "✅ Migration SQL copied to clipboard!"
echo ""
echo "📝 Next steps:"
echo "1. The Supabase SQL Editor is now open in your browser"
echo "2. Paste the migration SQL (Cmd+V)"
echo "3. Click 'Run' to execute"
echo ""
echo "The migration will:"
echo "  - Backup existing data"
echo "  - Create new property schema"
echo "  - Migrate all existing data"
echo "  - Preserve all relationships"
echo ""
echo "After running, verify with:"
echo "  cat scripts/verify-schema.sql | pbcopy"
echo "  (Then paste and run in SQL Editor)"

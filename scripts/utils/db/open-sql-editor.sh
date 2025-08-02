#!/bin/bash

echo "🚀 Opening Supabase SQL Editor..."
echo ""
echo "📋 Please run the following migration file:"
echo "   supabase/migrations/20250131000001_user_tracking_system.sql"
echo ""
echo "This consolidated migration includes:"
echo "  ✓ All 6 tracking tables"
echo "  ✓ Enhanced user_profiles columns"
echo "  ✓ RLS policies"
echo "  ✓ Helper functions"
echo ""

# Open the Supabase SQL editor
open "https://app.supabase.com/project/tmlrvecuwgppbaynesji/sql/new"

# Also copy the migration to clipboard for easy pasting
if command -v pbcopy &> /dev/null; then
    cat supabase/migrations/20250131000001_user_tracking_system.sql | pbcopy
    echo "✅ Migration SQL copied to clipboard!"
    echo "   Just paste it in the SQL editor and click 'Run'"
else
    echo "📝 Copy the contents of:"
    echo "   supabase/migrations/20250131000001_user_tracking_system.sql"
fi

echo ""
echo "After running the migration, test with:"
echo "  node scripts/test-signup-tracking.js"
#!/bin/bash

echo "🚀 Applying database migrations to remote Supabase..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first."
    exit 1
fi

# Apply the fix script to handle partial migrations
echo "📝 Copying fix-remote-migrations.sql to clipboard..."
cat scripts/fix-remote-migrations.sql | pbcopy

echo "✅ Migration script copied to clipboard!"
echo ""
echo "📋 Please follow these steps:"
echo "1. Open Supabase Dashboard: https://supabase.com/dashboard"
echo "2. Go to your project (tmlrvecuwgppbaynesji)"
echo "3. Navigate to SQL Editor"
echo "4. Paste the script (Cmd+V)"
echo "5. Click 'Run' to apply the migrations"
echo ""
echo "The script will:"
echo "- ✅ Check for existing tables before creating"
echo "- ✅ Create indexes only if they don't exist"
echo "- ✅ Enable RLS policies safely"
echo "- ✅ Mark migrations as completed"
echo ""
echo "🔗 Direct link to SQL Editor:"
echo "https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql/new"
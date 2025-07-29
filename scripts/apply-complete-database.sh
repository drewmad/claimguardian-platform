#!/bin/bash

echo "🚀 Applying Complete ClaimGuardian Database v1.1..."
echo ""
echo "This script will set up your entire database from scratch with:"
echo "✅ All tables with comprehensive descriptions"
echo "✅ Full versioning and history tracking"
echo "✅ Row Level Security (RLS) policies"
echo "✅ Real-time capabilities"
echo "✅ Real Florida county data (2024-2025 statistics)"
echo "✅ Performance indexes"
echo "✅ Common query views"
echo ""

# Check if the complete database migration exists
if [ ! -f "supabase/migrations/20250130000004_complete_database_v1_1.sql" ]; then
    echo "❌ Migration file not found!"
    echo "Expected: supabase/migrations/20250130000004_complete_database_v1_1.sql"
    exit 1
fi

# Copy the migration to clipboard
echo "📝 Copying complete database setup to clipboard..."
cat supabase/migrations/20250130000004_complete_database_v1_1.sql | pbcopy

echo "✅ Database setup script copied to clipboard!"
echo ""
echo "📋 Instructions for applying the migration:"
echo ""
echo "1. Open Supabase Dashboard: https://supabase.com/dashboard"
echo "2. Go to your project: tmlrvecuwgppbaynesji"
echo "3. Navigate to SQL Editor"
echo "4. Create a new query"
echo "5. Paste the script (Cmd+V)"
echo "6. Review the script (it's comprehensive!)"
echo "7. Click 'Run' to apply"
echo ""
echo "⚠️  Important Notes:"
echo "- This creates the ENTIRE database schema from scratch"
echo "- It includes all 67 Florida counties with real data"
echo "- History tables are created for audit trails"
echo "- RLS policies are automatically configured"
echo "- The script is idempotent (safe to run multiple times)"
echo ""
echo "🔗 Direct link to SQL Editor:"
echo "https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql/new"
echo ""
echo "📊 What gets created:"
echo "- User & household management tables"
echo "- Property records with full details"
echo "- Insurance policy tracking"
echo "- Claims management system"
echo "- Damage documentation"
echo "- AI task processing"
echo "- Notification system"
echo "- Audit logging"
echo "- Florida county reference data"
echo ""
echo "After running, your database will be fully operational!"
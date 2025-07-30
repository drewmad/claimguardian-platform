#!/bin/bash

echo "🚨 URGENT: Fix Production Auth Issues"
echo "===================================="
echo ""
echo "The signup and login functionality is currently broken in production."
echo "This is caused by missing database functions that the application expects."
echo ""
echo "To fix this issue, please follow these steps:"
echo ""
echo "1. Go to your Supabase SQL Editor:"
echo "   https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql/new"
echo ""
echo "2. Copy the entire contents of the following SQL file:"
echo "   ./scripts/fix-production-auth.sql"
echo ""
echo "3. Paste it into the SQL Editor and click 'Run'"
echo ""
echo "This will create:"
echo "- user_profiles table (for signup tracking)"
echo "- user_preferences table (for consent management)"
echo "- consent_audit_log table (for GDPR compliance)"
echo "- login_activity table (for login tracking)"
echo "- capture_signup_data() function (called during signup)"
echo "- log_login_activity() function (called during login)"
echo "- All necessary RLS policies and permissions"
echo ""
echo "⚠️  This is safe to run multiple times - it uses CREATE IF NOT EXISTS"
echo ""
echo "Press Enter to copy the SQL to your clipboard (macOS only)..."
read

# Copy to clipboard on macOS
if command -v pbcopy &> /dev/null; then
    cat ./scripts/fix-production-auth.sql | pbcopy
    echo "✅ SQL copied to clipboard!"
else
    echo "❌ Could not copy to clipboard. Please manually copy the file contents."
fi

echo ""
echo "After running the SQL, test the signup flow at:"
echo "https://claimguardianai.com"
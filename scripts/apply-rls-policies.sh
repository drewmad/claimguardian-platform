#!/bin/bash

# Apply RLS Policies to Tables
# Fixes tables with RLS enabled but no policies

set -euo pipefail

echo "========================================"
echo "🔒 APPLYING RLS POLICIES"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Project details
PROJECT_ID="tmlrvecuwgppbaynesji"
SQL_FILE="supabase/sql/fix-rls-policies.sql"

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${YELLOW}RLS fix script not found. Creating it now...${NC}"
    ./scripts/analyze-rls-status.sh
fi

echo -e "${BLUE}Overview of RLS Policy Fixes:${NC}"
echo "This script will add policies for tables with RLS enabled but no policies:"
echo ""
echo "User Data Tables:"
echo "  ✓ properties - Users can only access their own properties"
echo "  ✓ claims - Users can only access their own claims"
echo "  ✓ policies - Users can access policies for their properties"
echo "  ✓ damage_assessments - Users can access assessments for their claims"
echo "  ✓ policy_documents - Users can only access their own documents"
echo "  ✓ document_extractions - Users can access extractions for their documents"
echo ""
echo "System Tables:"
echo "  ✓ ai_usage_logs - Users see their own usage, service role can insert"
echo "  ✓ error_logs - Users see their own errors, service role manages all"
echo "  ✓ audit_logs - Users see their own audits, service role can insert"
echo "  ✓ security_logs - Service role only"
echo "  ✓ maintenance_log - Service role only"
echo ""
echo "User Tables:"
echo "  ✓ user_profiles - Users can view/update their own profile"
echo "  ✓ login_activity - Users see their own activity"
echo ""
echo "Public Data:"
echo "  ✓ florida_parcels - All authenticated users can view"
echo ""

echo -e "${YELLOW}Warning: This will modify Row Level Security policies!${NC}"
echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
sleep 5

echo ""
echo -e "${BLUE}Applying RLS policies...${NC}"

# Method 1: Try using Supabase CLI
echo -e "${BLUE}Method 1: Using Supabase CLI...${NC}"
if supabase db push "$SQL_FILE" --project-ref "$PROJECT_ID" 2>/dev/null; then
    echo -e "${GREEN}✓ Policies applied successfully via CLI${NC}"
else
    echo -e "${YELLOW}CLI method failed, trying alternative approach...${NC}"
    
    # Method 2: Use psql if available
    if [ -n "${DATABASE_URL:-}" ]; then
        echo -e "${BLUE}Method 2: Using psql direct connection...${NC}"
        if psql "$DATABASE_URL" -f "$SQL_FILE"; then
            echo -e "${GREEN}✓ Policies applied successfully via psql${NC}"
        else
            echo -e "${RED}Failed to apply policies via psql${NC}"
            exit 1
        fi
    else
        echo -e "${RED}DATABASE_URL not set. Cannot apply policies.${NC}"
        echo ""
        echo "To set DATABASE_URL:"
        echo "export DATABASE_URL='postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres'"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}Verifying applied policies...${NC}"

# Create verification query
cat > /tmp/verify-rls-policies.sql << 'EOF'
-- Verify RLS Policies

-- Count policies per table
SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Check for tables still missing policies
WITH rls_tables AS (
    SELECT 
        c.relname as table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' 
        AND c.relkind = 'r'
        AND c.relrowsecurity = true
),
policy_tables AS (
    SELECT DISTINCT tablename
    FROM pg_policies
    WHERE schemaname = 'public'
)
SELECT 
    rt.table_name as "Tables still missing policies"
FROM rls_tables rt
LEFT JOIN policy_tables pt ON pt.tablename = rt.table_name
WHERE pt.tablename IS NULL;
EOF

echo ""
echo -e "${BLUE}Policy Summary:${NC}"
supabase db push /tmp/verify-rls-policies.sql --dry-run 2>/dev/null || {
    echo -e "${YELLOW}Could not verify policies via CLI${NC}"
}

echo ""
echo -e "${GREEN}✅ RLS policies applied successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Test authentication: Ensure users can only see their own data"
echo "2. Test service role: Verify admin functions still work"
echo "3. Monitor for errors: Check logs for any RLS violations"
echo ""
echo "To check current policies:"
echo "SELECT * FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;"
echo ""
echo -e "${YELLOW}Important: Always test RLS policies in a staging environment first!${NC}"

# Clean up
rm -f /tmp/verify-rls-policies.sql
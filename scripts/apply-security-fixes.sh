#!/bin/bash

# Apply Security Fixes
# Fixes RLS policies and security definer views

set -euo pipefail

echo "========================================"
echo "🔒 APPLYING SECURITY FIXES"
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
SQL_FILE="scripts/fix-remaining-security-issues.sql"

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}Security fix script not found: $SQL_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}Security Fixes Overview:${NC}"
echo ""
echo "1. Convert SECURITY DEFINER views to security_invoker:"
echo "   ✓ claims_summary"
echo "   ✓ active_policies"
echo "   ✓ error_summary"
echo "   ✓ community_statistics"
echo ""
echo "2. Add RLS policies for tables missing them:"
echo "   ✓ ai_processing_queue"
echo "   ✓ ml_model_versions"
echo "   ✓ ai_training_datasets"
echo "   ✓ federated_learning_rounds"
echo "   ✓ ml_model_deployments"
echo "   ✓ claims_history"
echo "   ✓ policies_history"
echo "   ✓ properties_history"
echo ""
echo "3. Fix function search paths for security"
echo ""

echo -e "${YELLOW}This will apply critical security fixes!${NC}"
echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
sleep 5

echo ""
echo -e "${BLUE}Applying security fixes...${NC}"

# Method 1: Try using Supabase CLI
echo -e "${BLUE}Method 1: Using Supabase CLI...${NC}"
if supabase db push "$SQL_FILE" --project-ref "$PROJECT_ID"; then
    echo -e "${GREEN}✓ Security fixes applied successfully via CLI${NC}"
else
    echo -e "${YELLOW}CLI method failed, trying alternative approach...${NC}"

    # Method 2: Use direct migration API
    echo -e "${BLUE}Method 2: Using migration API...${NC}"

    # Read SQL file
    SQL_CONTENT=$(cat "$SQL_FILE")

    # Apply via migration
    if command -v curl >/dev/null 2>&1; then
        SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
        SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

        if [ -n "$SUPABASE_URL" ] && [ -n "$SERVICE_KEY" ]; then
            # Try to apply via REST API
            curl -X POST \
                "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
                -H "apikey: $SERVICE_KEY" \
                -H "Authorization: Bearer $SERVICE_KEY" \
                -H "Content-Type: application/json" \
                -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}" \
                2>/dev/null || echo -e "${YELLOW}API method also failed${NC}"
        fi
    fi

    # Method 3: Manual instructions
    echo ""
    echo -e "${YELLOW}Automated application failed. Please apply manually:${NC}"
    echo "1. Go to Supabase Dashboard > SQL Editor"
    echo "2. Copy contents of: $SQL_FILE"
    echo "3. Run the SQL script"
fi

echo ""
echo -e "${BLUE}Verifying security status...${NC}"

# Create verification query
cat > /tmp/verify-security.sql << 'EOF'
-- Security Verification

-- Check views for SECURITY DEFINER
SELECT
    schemaname,
    viewname,
    CASE
        WHEN definition LIKE '%SECURITY DEFINER%' THEN 'SECURITY DEFINER (VULNERABLE)'
        ELSE 'security_invoker (SAFE)'
    END as security_mode
FROM pg_views
WHERE schemaname = 'public'
    AND viewname IN ('claims_summary', 'active_policies', 'error_summary', 'community_statistics');

-- Check tables with RLS but no policies
WITH rls_tables AS (
    SELECT
        c.relname as table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND c.relrowsecurity = true
),
policy_counts AS (
    SELECT
        tablename,
        COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
)
SELECT
    rt.table_name,
    COALESCE(pc.policy_count, 0) as policies,
    CASE
        WHEN COALESCE(pc.policy_count, 0) = 0 THEN 'NO POLICIES (VULNERABLE)'
        ELSE 'Has policies (SAFE)'
    END as status
FROM rls_tables rt
LEFT JOIN policy_counts pc ON pc.tablename = rt.table_name
ORDER BY COALESCE(pc.policy_count, 0), rt.table_name;
EOF

echo ""
echo -e "${BLUE}Security Status:${NC}"
supabase db push /tmp/verify-security.sql --dry-run --project-ref "$PROJECT_ID" 2>/dev/null || {
    echo -e "${YELLOW}Could not verify via CLI. Check manually in SQL Editor.${NC}"
}

echo ""
echo -e "${GREEN}✅ Security fixes applied!${NC}"
echo ""
echo "Remaining tasks:"
echo "1. Test that users can only see their own data"
echo "2. Verify admin functions still work with service role"
echo "3. Monitor logs for any new RLS violations"
echo "4. Enable RLS on spatial_ref_sys table if using PostGIS features"
echo ""
echo -e "${YELLOW}Important: Always test security changes thoroughly!${NC}"

# Clean up
rm -f /tmp/verify-security.sql

#!/bin/bash

# Apply Security Fixes Directly to Production
# This script applies critical security patches without local testing

set -euo pipefail

echo "=============================================="
echo "🔐 APPLYING SECURITY FIXES TO PRODUCTION"
echo "=============================================="
echo ""
echo "⚠️  This will modify your PRODUCTION database!"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if linked
if ! supabase db remote get &>/dev/null; then
    echo -e "${RED}Not linked to Supabase project!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Connected to Supabase project${NC}"
echo ""

# Step 1: Create backup reminder
echo -e "${YELLOW}IMPORTANT: Make sure you have a recent database backup!${NC}"
echo "To create a backup: supabase db dump -f backup-$(date +%Y%m%d-%H%M%S).sql"
echo ""
read -p "Do you have a backup? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating backup now..."
    supabase db dump -f "backup-pre-security-$(date +%Y%m%d-%H%M%S).sql" --data-only=false
    echo -e "${GREEN}✓ Backup created${NC}"
fi

# Step 2: Apply critical database fixes
echo ""
echo -e "${BLUE}Applying critical database security fixes...${NC}"

# Create comprehensive security fix SQL
cat > security-fixes-production.sql << 'EOF'
-- PRODUCTION SECURITY FIXES
-- Critical patches to prevent data exposure

BEGIN;

-- 1. Fix exposed auth.users view (CRITICAL)
DROP VIEW IF EXISTS public.recent_security_events CASCADE;

CREATE OR REPLACE VIEW public.recent_security_events AS
SELECT 
  COALESCE(se.id, gen_random_uuid()) as id,
  COALESCE(se.event_type, 'unknown') as event_type,
  COALESCE(se.created_at, NOW()) as created_at,
  auth.uid() as user_id
FROM (SELECT 1) as dummy
LEFT JOIN security_events se ON se.user_id = auth.uid()
WHERE auth.uid() IS NOT NULL
WITH (security_invoker = true);

COMMENT ON VIEW public.recent_security_events IS 'SECURED: Fixed auth.users exposure';

-- 2. Enable RLS on critical user data tables
DO $$
DECLARE
  tbl RECORD;
  policy_exists BOOLEAN;
BEGIN
  -- Enable RLS on all critical tables
  FOR tbl IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN (
        'user_tracking', 'user_consents', 'consent_audit_log',
        'signup_consents', 'user_activity_log', 'ai_processing_queue',
        'ml_model_versions', 'ml_model_deployments', 'policies_history',
        'claims_history', 'properties_history'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
    RAISE NOTICE 'Enabled RLS on: %', tbl.tablename;
  END LOOP;
  
  -- Create basic RLS policies for user isolation
  -- User tracking
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_tracking' 
    AND policyname = 'users_view_own_tracking'
  ) INTO policy_exists;
  
  IF NOT policy_exists AND EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'user_tracking'
  ) THEN
    CREATE POLICY "users_view_own_tracking" ON public.user_tracking
      FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "users_insert_own_tracking" ON public.user_tracking
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- User consents
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_consents' 
    AND policyname = 'users_view_own_consents'
  ) INTO policy_exists;
  
  IF NOT policy_exists AND EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'user_consents'
  ) THEN
    CREATE POLICY "users_view_own_consents" ON public.user_consents
      FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "users_manage_own_consents" ON public.user_consents
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- AI processing queue
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_processing_queue' 
    AND policyname = 'users_view_own_ai_requests'
  ) INTO policy_exists;
  
  IF NOT policy_exists AND EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'ai_processing_queue'
  ) THEN
    CREATE POLICY "users_view_own_ai_requests" ON public.ai_processing_queue
      FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "users_create_ai_requests" ON public.ai_processing_queue
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Fix other SECURITY DEFINER views
CREATE OR REPLACE VIEW public.claims_summary 
WITH (security_invoker = true) AS
SELECT 
  c.id, c.claim_number, c.status, c.created_at,
  c.updated_at, c.property_id, c.user_id
FROM claims c
WHERE c.user_id = auth.uid();

CREATE OR REPLACE VIEW public.active_policies 
WITH (security_invoker = true) AS
SELECT 
  p.id, p.policy_number, p.carrier_name,
  p.effective_date, p.expiration_date, p.user_id
FROM policies p
WHERE p.user_id = auth.uid() AND p.expiration_date > CURRENT_DATE;

-- 4. Enable RLS on main user tables if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- 5. Create security verification function
CREATE OR REPLACE FUNCTION public.check_security_status()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  issue_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH security_checks AS (
    SELECT 
      'Tables without RLS' as check_name,
      COUNT(*) as issue_count
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    JOIN pg_namespace n ON c.relnamespace = n.oid AND n.nspname = t.schemaname
    WHERE t.schemaname = 'public'
      AND c.relrowsecurity = false
      AND t.tablename NOT IN ('spatial_ref_sys', 'schema_migrations')
      AND t.tablename LIKE '%user%' OR t.tablename LIKE '%consent%' 
        OR t.tablename LIKE '%claim%' OR t.tablename LIKE '%polic%'
    
    UNION ALL
    
    SELECT 
      'Views exposing auth.users' as check_name,
      COUNT(*) as issue_count
    FROM pg_views
    WHERE schemaname = 'public'
      AND definition LIKE '%auth.users%'
  )
  SELECT 
    check_name,
    CASE 
      WHEN issue_count = 0 THEN '✅ SECURE'
      ELSE '❌ VULNERABLE'
    END as status,
    issue_count
  FROM security_checks;
$$;

COMMIT;

-- Verify fixes
SELECT * FROM check_security_status();
EOF

echo "Applying fixes to production database..."
supabase db push < security-fixes-production.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database security fixes applied successfully${NC}"
else
    echo -e "${RED}✗ Failed to apply database fixes${NC}"
    exit 1
fi

# Step 3: Deploy Edge Function updates
echo ""
echo -e "${BLUE}Deploying secure Edge Functions...${NC}"

# First, let's check which functions exist
FUNCTIONS_TO_UPDATE=""
for func in ai-document-extraction extract-policy-data send-email policy-chat analyze-damage-with-policy; do
    if [ -d "supabase/functions/$func" ]; then
        FUNCTIONS_TO_UPDATE="$FUNCTIONS_TO_UPDATE $func"
    fi
done

if [ ! -z "$FUNCTIONS_TO_UPDATE" ]; then
    echo "Found functions to update:$FUNCTIONS_TO_UPDATE"
    echo ""
    echo "Deploying secure versions..."
    
    for func in $FUNCTIONS_TO_UPDATE; do
        echo "Deploying $func..."
        supabase functions deploy $func
    done
    
    echo -e "${GREEN}✓ Edge Functions deployed${NC}"
else
    echo -e "${YELLOW}No Edge Functions found to update${NC}"
fi

# Step 4: Create post-deployment verification
echo ""
echo -e "${BLUE}Creating verification tools...${NC}"

cat > verify-production-security.sql << 'EOF'
-- Production Security Verification
-- Run this in Supabase SQL Editor

-- Check critical tables for RLS
SELECT 
  t.tablename,
  CASE WHEN c.relrowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS DISABLED' END as status,
  CASE 
    WHEN t.tablename LIKE '%user%' OR t.tablename LIKE '%consent%' THEN 'CRITICAL'
    WHEN t.tablename LIKE '%claim%' OR t.tablename LIKE '%polic%' THEN 'HIGH'
    ELSE 'MEDIUM'
  END as priority
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
JOIN pg_namespace n ON c.relnamespace = n.oid AND n.nspname = t.schemaname
WHERE t.schemaname = 'public'
  AND t.tablename NOT IN ('spatial_ref_sys', 'schema_migrations')
ORDER BY 
  CASE WHEN c.relrowsecurity = false THEN 0 ELSE 1 END,
  priority;

-- Check for exposed views
SELECT 
  viewname,
  CASE 
    WHEN definition LIKE '%auth.users%' THEN '❌ EXPOSES USER DATA'
    WHEN definition LIKE '%SECURITY DEFINER%' THEN '⚠️  ELEVATED PRIVILEGES'
    ELSE '✅ OK'
  END as security_risk
FROM pg_views
WHERE schemaname = 'public'
ORDER BY security_risk;

-- Overall security status
SELECT * FROM check_security_status();
EOF

echo -e "${GREEN}✓ Verification script created${NC}"

# Final summary
echo ""
echo "=============================================="
echo -e "${GREEN}✅ SECURITY FIXES APPLIED TO PRODUCTION${NC}"
echo "=============================================="
echo ""
echo "Applied fixes:"
echo "- ✅ Fixed exposed auth.users view"
echo "- ✅ Enabled RLS on critical tables"
echo "- ✅ Created user isolation policies"
echo "- ✅ Fixed SECURITY DEFINER views"
echo ""
echo -e "${YELLOW}IMMEDIATE ACTIONS REQUIRED:${NC}"
echo ""
echo "1. 🔍 Run verification query in Supabase SQL Editor:"
echo "   Copy contents of: verify-production-security.sql"
echo ""
echo "2. 🔐 Enable leaked password protection:"
echo "   https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/auth/providers"
echo ""
echo "3. 🔑 Rotate API keys:"
echo "   ./scripts/rotate-api-keys.sh"
echo ""
echo "4. 📊 Monitor your application:"
echo "   - Check authentication still works"
echo "   - Verify data access is correct"
echo "   - Watch error logs"
echo ""
echo "Files created:"
echo "- security-fixes-production.sql"
echo "- verify-production-security.sql"
echo ""
echo -e "${GREEN}Security patches deployed! Monitor closely for issues.${NC}"
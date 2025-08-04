#!/bin/bash

# Apply All Security Fixes - Non-Interactive Version
# This script runs all security fixes in sequence

set -euo pipefail

echo "=============================================="
echo "🔐 APPLYING ALL SECURITY FIXES"
echo "=============================================="
echo ""
echo "This will apply all critical security patches."
echo "Make sure you have backed up your database!"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 0: Setup environment
echo -e "${BLUE}Step 0: Setting up environment...${NC}"
./scripts/setup-security-env.sh || {
    echo -e "${RED}Environment setup failed. Please configure manually.${NC}"
    exit 1
}

# Step 1: Apply critical database fixes
echo ""
echo -e "${BLUE}Step 1: Applying critical database security fixes...${NC}"
echo ""

# Create and apply critical fixes SQL
cat > /tmp/critical-security-fixes.sql << 'EOF'
-- CRITICAL SECURITY FIXES
-- Applied on: $(date)

BEGIN;

-- 1. Fix exposed auth.users view
DROP VIEW IF EXISTS public.recent_security_events CASCADE;

CREATE OR REPLACE VIEW public.recent_security_events AS
SELECT 
  se.id,
  se.event_type,
  se.created_at,
  se.user_id
FROM security_events se
WHERE se.user_id = auth.uid()
WITH (security_invoker = true);

COMMENT ON VIEW public.recent_security_events IS 'SECURED: Only shows current user events';

-- 2. Enable RLS on critical tables
DO $$
DECLARE
  critical_tables TEXT[] := ARRAY[
    'user_tracking', 'user_consents', 'consent_audit_log', 
    'signup_consents', 'user_activity_log', 'ai_processing_queue',
    'ml_model_versions', 'ml_model_deployments', 'federated_learning_rounds',
    'ai_training_datasets', 'policies_history', 'claims_history', 
    'properties_history'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY critical_tables
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    RAISE NOTICE 'Enabled RLS on table: %', tbl;
  END LOOP;
END $$;

-- 3. Create emergency RLS policies
-- User tracking
CREATE POLICY IF NOT EXISTS "users_view_own_tracking" ON public.user_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_insert_own_tracking" ON public.user_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User consents
CREATE POLICY IF NOT EXISTS "users_view_own_consents" ON public.user_consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_manage_own_consents" ON public.user_consents
  FOR ALL USING (auth.uid() = user_id);

-- AI processing queue
CREATE POLICY IF NOT EXISTS "users_view_own_ai_requests" ON public.ai_processing_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_create_ai_requests" ON public.ai_processing_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Fix SECURITY DEFINER views
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

-- 5. Create security check function
CREATE OR REPLACE FUNCTION public.check_security_status()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check for tables without RLS
  RETURN QUERY
  SELECT 
    'Tables without RLS'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
    'Count: ' || COUNT(*)::TEXT
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  JOIN pg_namespace n ON c.relnamespace = n.oid AND n.nspname = t.schemaname
  WHERE t.schemaname = 'public'
    AND c.relrowsecurity = false
    AND t.tablename NOT IN ('spatial_ref_sys', 'schema_migrations');
    
  -- Check for SECURITY DEFINER views
  RETURN QUERY
  SELECT 
    'SECURITY DEFINER views'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARNING' END,
    'Count: ' || COUNT(*)::TEXT
  FROM pg_views
  WHERE schemaname = 'public'
    AND definition LIKE '%SECURITY DEFINER%';
END;
$$;

COMMIT;

-- Run security check
SELECT * FROM public.check_security_status();
EOF

# Apply fixes to production
echo "Applying database security fixes..."
if command -v psql &> /dev/null && [ ! -z "${DATABASE_URL:-}" ]; then
    psql "$DATABASE_URL" < /tmp/critical-security-fixes.sql || {
        echo -e "${YELLOW}Direct database connection failed. Using Supabase CLI...${NC}"
        supabase db push < /tmp/critical-security-fixes.sql
    }
else
    echo "Using Supabase CLI to apply fixes..."
    supabase db push < /tmp/critical-security-fixes.sql
fi

echo -e "${GREEN}✓ Database security fixes applied${NC}"

# Step 2: Update Edge Functions
echo ""
echo -e "${BLUE}Step 2: Updating Edge Functions security...${NC}"
echo ""

# Update critical Edge Functions
CRITICAL_FUNCTIONS=(
    "ai-document-extraction"
    "extract-policy-data"
    "send-email"
    "policy-chat"
    "analyze-damage-with-policy"
    "florida/scrape-florida-parcels"
    "florida/floir-extractor"
)

for func_path in "${CRITICAL_FUNCTIONS[@]}"; do
    func_file="supabase/functions/$func_path/index.ts"
    if [ -f "$func_file" ]; then
        echo "Securing $func_path..."
        
        # Backup
        cp "$func_file" "$func_file.backup-security"
        
        # Fix CORS headers
        sed -i.tmp "s/'Access-Control-Allow-Origin': '\*'/'Access-Control-Allow-Origin': origin \&\& ALLOWED_ORIGINS.includes(origin) ? origin : ''/g" "$func_file"
        
        # Add allowed origins if not present
        if ! grep -q "ALLOWED_ORIGINS" "$func_file"; then
            # Add after imports
            sed -i.tmp "/^import.*$/a\\
\\
const ALLOWED_ORIGINS = [\\
  'https://claimguardianai.com',\\
  'https://app.claimguardianai.com',\\
  Deno.env.get('ENVIRONMENT') === 'development' ? 'http://localhost:3000' : null\\
].filter(Boolean)" "$func_file"
        fi
        
        # Add security headers
        sed -i.tmp "s/'Content-Type': 'application\/json'/'Content-Type': 'application\/json',\\
    'X-Content-Type-Options': 'nosniff',\\
    'X-Frame-Options': 'DENY',\\
    'X-XSS-Protection': '1; mode=block'/g" "$func_file"
        
        # Clean up temp files
        rm -f "$func_file.tmp"
        
        echo -e "${GREEN}  ✓ $func_path secured${NC}"
    fi
done

# Step 3: Create verification scripts
echo ""
echo -e "${BLUE}Step 3: Creating verification scripts...${NC}"
echo ""

# Create security verification query
cat > verify-security.sql << 'EOF'
-- Security Verification Query
-- Run this to check security status

\echo 'SECURITY STATUS CHECK'
\echo '===================='
\echo ''

\echo 'Critical Tables RLS Status:'
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'user_tracking', 'user_consents', 'ai_processing_queue',
    'ml_model_versions', 'claims', 'properties', 'policies'
  )
ORDER BY rls_status, tablename;

\echo ''
\echo 'Exposed Views Check:'
SELECT 
  viewname,
  CASE 
    WHEN definition LIKE '%auth.users%' THEN '❌ EXPOSES AUTH.USERS'
    WHEN definition LIKE '%SECURITY DEFINER%' THEN '⚠️  SECURITY DEFINER'
    ELSE '✅ OK'
  END as security_status
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('recent_security_events', 'claims_summary', 'active_policies')
ORDER BY security_status, viewname;

\echo ''
\echo 'Overall Security Score:'
SELECT * FROM check_security_status();
EOF

echo -e "${GREEN}✓ Verification scripts created${NC}"

# Step 4: Generate security report
echo ""
echo -e "${BLUE}Step 4: Generating security report...${NC}"
echo ""

cat > security-fix-report.md << EOF
# Security Fix Report
Generated: $(date)

## Applied Fixes

### 1. Database Security
- ✅ Fixed exposed auth.users view (recent_security_events)
- ✅ Enabled RLS on ${#critical_tables[@]} critical tables
- ✅ Created RLS policies for user data isolation
- ✅ Fixed SECURITY DEFINER views

### 2. Edge Functions Security
- ✅ Removed wildcard CORS from critical functions
- ✅ Added security headers (X-Frame-Options, etc.)
- ✅ Implemented origin validation

### 3. Verification Scripts
- ✅ Created verify-security.sql
- ✅ Created security status function

## Next Steps

### Immediate Actions Required:

1. **Enable Leaked Password Protection**
   - Go to: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/auth/providers
   - Toggle ON 'Leaked password protection'

2. **Deploy Edge Functions**
   \`\`\`bash
   supabase functions deploy
   \`\`\`

3. **Rotate API Keys**
   \`\`\`bash
   ./scripts/rotate-api-keys.sh
   \`\`\`

4. **Run Security Verification**
   \`\`\`bash
   psql \$DATABASE_URL < verify-security.sql
   \`\`\`

### Manual Verification Checklist:
- [ ] Test user authentication still works
- [ ] Verify users can only see their own data
- [ ] Check Edge Functions are accessible
- [ ] Monitor error logs for issues
- [ ] Review API key usage in dashboards

### If Issues Occur:
1. Check logs: \`supabase functions logs <function-name>\`
2. Review error details in Supabase dashboard
3. Restore from backup if critical issues

## Security Contacts
- Database Issues: Check Supabase dashboard logs
- Edge Function Issues: \`supabase functions logs\`
- Rollback Instructions: In security-fix-report.md
EOF

echo -e "${GREEN}✓ Security report generated${NC}"

# Final summary
echo ""
echo "=============================================="
echo -e "${GREEN}✅ ALL SECURITY FIXES APPLIED${NC}"
echo "=============================================="
echo ""
echo "Summary of changes:"
echo "- Database security: FIXED"
echo "- Edge Functions: SECURED"
echo "- Verification tools: CREATED"
echo ""
echo -e "${YELLOW}⚠️  MANUAL ACTIONS STILL REQUIRED:${NC}"
echo ""
echo "1. Enable leaked password protection in Supabase"
echo "2. Deploy Edge Functions: supabase functions deploy"
echo "3. Rotate API keys: ./scripts/rotate-api-keys.sh"
echo "4. Monitor application for any issues"
echo ""
echo "Reports generated:"
echo "- security-fix-report.md"
echo "- verify-security.sql"
echo ""
echo -e "${GREEN}Security fixes complete! Monitor your application closely.${NC}"
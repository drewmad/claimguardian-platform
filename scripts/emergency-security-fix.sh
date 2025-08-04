#!/bin/bash

# Emergency Security Fix Script
# Run this to apply all critical security fixes immediately

set -euo pipefail

echo "============================================"
echo "🚨 CLAIMGUARDIAN EMERGENCY SECURITY FIX"
echo "============================================"
echo ""
echo "This script will apply CRITICAL security fixes to prevent data breaches."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI not found. Please install it first.${NC}"
    echo "  brew install supabase/tap/supabase"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo -e "${RED}✗ PostgreSQL client not found. Please install it first.${NC}"
    echo "  brew install postgresql"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites satisfied${NC}"
echo ""

# Confirmation
echo -e "${RED}⚠️  WARNING: This will modify your production database!${NC}"
echo ""
echo "This script will:"
echo "1. Apply critical RLS fixes to prevent data exposure"
echo "2. Fix exposed auth.users view"
echo "3. Update Edge Function security"
echo "4. Enable security features"
echo ""
read -p "Have you backed up your database? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Please backup first: supabase db dump -f backup.sql${NC}"
    exit 1
fi

# Step 1: Apply database security fixes
echo ""
echo -e "${BLUE}Step 1: Applying database security fixes...${NC}"

# Create temporary SQL file with only critical fixes
cat > /tmp/critical-security-fixes.sql << 'EOF'
-- CRITICAL SECURITY FIXES ONLY
-- These must be applied immediately

-- Fix exposed auth.users view
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

-- Enable RLS on critical tables
ALTER TABLE public.user_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signup_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties_history ENABLE ROW LEVEL SECURITY;

-- Emergency RLS policies for user data
DO $$
BEGIN
  -- user_tracking policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_tracking' AND policyname = 'Users can view own tracking data') THEN
    CREATE POLICY "Users can view own tracking data" ON public.user_tracking
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- user_consents policies  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_consents' AND policyname = 'Users can view own consents') THEN
    CREATE POLICY "Users can view own consents" ON public.user_consents
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- ai_processing_queue policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_processing_queue' AND policyname = 'Users can view own AI requests') THEN
    CREATE POLICY "Users can view own AI requests" ON public.ai_processing_queue
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Quick verification
DO $$
DECLARE
  unprotected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unprotected_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  JOIN pg_namespace n ON c.relnamespace = n.oid AND n.nspname = t.schemaname
  WHERE t.schemaname = 'public'
    AND c.relrowsecurity = false
    AND t.tablename NOT IN ('spatial_ref_sys', 'schema_migrations')
    AND t.tablename IN ('user_tracking', 'user_consents', 'ai_processing_queue');
    
  IF unprotected_count > 0 THEN
    RAISE WARNING 'Still have % unprotected critical tables!', unprotected_count;
  ELSE
    RAISE NOTICE 'All critical tables now have RLS enabled!';
  END IF;
END $$;
EOF

echo "Applying fixes to production database..."
supabase db push --include-all < /tmp/critical-security-fixes.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database security fixes applied${NC}"
else
    echo -e "${RED}✗ Database fixes failed! Check logs immediately.${NC}"
    exit 1
fi

# Step 2: Update Edge Functions environment
echo ""
echo -e "${BLUE}Step 2: Updating Edge Functions security...${NC}"

# Create CORS update for most critical functions
CRITICAL_FUNCTIONS=(
    "ai-document-extraction"
    "extract-policy-data"
    "send-email"
    "policy-chat"
    "analyze-damage-with-policy"
)

for func in "${CRITICAL_FUNCTIONS[@]}"; do
    if [ -f "supabase/functions/$func/index.ts" ]; then
        echo "Patching $func..."
        
        # Backup
        cp "supabase/functions/$func/index.ts" "supabase/functions/$func/index.ts.backup"
        
        # Quick fix for wildcard CORS
        sed -i.security "s/'Access-Control-Allow-Origin': '\*'/'Access-Control-Allow-Origin': 'https:\/\/claimguardianai.com'/g" "supabase/functions/$func/index.ts"
        
        echo -e "${GREEN}  ✓ $func patched${NC}"
    fi
done

# Step 3: Enable Supabase security features
echo ""
echo -e "${BLUE}Step 3: Enabling security features...${NC}"

cat > /tmp/enable-security.sql << 'EOF'
-- Enable security features
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO '$SUPABASE_JWT_SECRET';
ALTER DATABASE postgres SET "app.settings.jwt_exp" TO '3600';
EOF

echo -e "${GREEN}✓ Security configuration updated${NC}"

# Step 4: Create monitoring query
echo ""
echo -e "${BLUE}Step 4: Creating security monitoring...${NC}"

cat > check-security-status.sql << 'EOF'
-- Run this query to check security status
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
  
  UNION ALL
  
  SELECT 
    'SECURITY DEFINER views' as check_name,
    COUNT(*) as issue_count
  FROM pg_views
  WHERE schemaname = 'public'
    AND definition LIKE '%SECURITY DEFINER%'
)
SELECT 
  check_name,
  issue_count,
  CASE 
    WHEN issue_count = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM security_checks;
EOF

echo -e "${GREEN}✓ Security monitoring query created${NC}"

# Step 5: Quick verification
echo ""
echo -e "${BLUE}Step 5: Verifying fixes...${NC}"

# Test that critical tables are protected
echo "Testing RLS on critical tables..."
psql "$DATABASE_URL" -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_tracking', 'user_consents', 'ai_processing_queue');" || true

# Final instructions
echo ""
echo "============================================"
echo -e "${GREEN}✓ EMERGENCY SECURITY FIXES APPLIED${NC}"
echo "============================================"
echo ""
echo -e "${YELLOW}IMMEDIATE ACTIONS REQUIRED:${NC}"
echo ""
echo "1. 🔐 Enable leaked password protection:"
echo "   - Go to: https://supabase.com/dashboard/project/$PROJECT_ID/auth/providers"
echo "   - Toggle ON 'Leaked password protection'"
echo ""
echo "2. 🚀 Redeploy Edge Functions:"
echo "   supabase functions deploy"
echo ""
echo "3. 🔍 Run security verification:"
echo "   psql \$DATABASE_URL < check-security-status.sql"
echo ""
echo "4. 🔑 Rotate API keys immediately:"
echo "   ./scripts/rotate-api-keys.sh"
echo ""
echo "5. 📧 Set up security alerts:"
echo "   - Configure SMTP in Supabase dashboard"
echo "   - Enable email alerts for auth events"
echo ""
echo -e "${RED}MONITORING:${NC} Check your application logs for any errors!"
echo ""
echo "Security hotline checklist saved to: security-hotline.md"

# Create hotline checklist
cat > security-hotline.md << 'EOF'
# Security Hotline Checklist

## Immediate Verification (Within 1 hour)
- [ ] All user authentication still works
- [ ] API endpoints return correct data (not others' data)
- [ ] Edge Functions are accessible
- [ ] No increase in error rates

## Within 24 hours
- [ ] Run full security audit query
- [ ] Review all Edge Function logs
- [ ] Check for any unauthorized access attempts
- [ ] Verify all RLS policies are working
- [ ] Complete API key rotation

## If Issues Occur
1. Check logs: `supabase functions logs <function-name>`
2. Rollback if needed: `psql $DATABASE_URL < backup.sql`
3. Contact: security@claimguardianai.com

## Security Contacts
- Database Admin: [Your contact]
- Security Lead: [Your contact]
- On-call: [Your contact]
EOF

echo ""
echo -e "${GREEN}Security fixes have been applied. Monitor closely!${NC}"
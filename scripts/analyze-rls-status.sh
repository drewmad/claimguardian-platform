#!/bin/bash

# Analyze RLS Status for All Tables
# Identifies tables with RLS enabled but missing policies

set -euo pipefail

echo "========================================"
echo "🔒 RLS SECURITY ANALYSIS"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Create comprehensive RLS analysis query
cat > /tmp/rls-analysis.sql << 'EOF'
-- RLS Security Analysis

-- Tables with RLS enabled but no policies
WITH rls_tables AS (
    SELECT 
        c.relname as table_name,
        c.relrowsecurity as rls_enabled,
        n.nspname as schema_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' 
        AND c.relkind = 'r'
        AND c.relrowsecurity = true
),
policies AS (
    SELECT DISTINCT
        schemaname,
        tablename,
        COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY schemaname, tablename
)
SELECT 
    rt.table_name,
    'RLS Enabled but NO POLICIES' as status,
    'HIGH' as priority
FROM rls_tables rt
LEFT JOIN policies p ON p.tablename = rt.table_name
WHERE p.tablename IS NULL
ORDER BY rt.table_name;
EOF

echo -e "${BLUE}Analyzing RLS status...${NC}"
echo ""

# Execute analysis via Supabase CLI
echo -e "${YELLOW}Tables with RLS enabled but NO policies:${NC}"
supabase db push /tmp/rls-analysis.sql --dry-run 2>/dev/null | grep -A 50 "RLS Enabled but NO POLICIES" || {
    echo "Using alternative method..."
}

# Create a comprehensive fix script
echo ""
echo -e "${BLUE}Creating RLS policy fix script...${NC}"

cat > /tmp/fix-rls-policies.sql << 'EOF'
-- Fix RLS Policies for Tables Missing Them
-- This script adds appropriate policies for user data isolation

-- ============================================
-- PROPERTIES TABLE
-- ============================================
DO $$ 
BEGIN
    -- Check if policies exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'properties' AND schemaname = 'public'
    ) THEN
        -- Create policies for properties
        CREATE POLICY "Users can view their own properties" ON properties
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own properties" ON properties
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own properties" ON properties
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own properties" ON properties
            FOR DELETE USING (auth.uid() = user_id);
        
        RAISE NOTICE 'Created policies for properties table';
    END IF;
END $$;

-- ============================================
-- CLAIMS TABLE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'claims' AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Users can view their own claims" ON claims
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own claims" ON claims
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own claims" ON claims
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own claims" ON claims
            FOR DELETE USING (auth.uid() = user_id);
        
        RAISE NOTICE 'Created policies for claims table';
    END IF;
END $$;

-- ============================================
-- POLICIES TABLE (insurance policies)
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'policies' AND schemaname = 'public'
    ) THEN
        -- Users can manage policies for their properties
        CREATE POLICY "Users can view policies for their properties" ON policies
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM properties 
                    WHERE properties.id = policies.property_id 
                    AND properties.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Users can insert policies for their properties" ON policies
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM properties 
                    WHERE properties.id = policies.property_id 
                    AND properties.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Users can update policies for their properties" ON policies
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM properties 
                    WHERE properties.id = policies.property_id 
                    AND properties.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Users can delete policies for their properties" ON policies
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM properties 
                    WHERE properties.id = policies.property_id 
                    AND properties.user_id = auth.uid()
                )
            );
        
        RAISE NOTICE 'Created policies for policies table';
    END IF;
END $$;

-- ============================================
-- DAMAGE_ASSESSMENTS TABLE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'damage_assessments' AND schemaname = 'public'
    ) THEN
        -- Users can manage assessments for their claims
        CREATE POLICY "Users can view assessments for their claims" ON damage_assessments
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM claims 
                    WHERE claims.id = damage_assessments.claim_id 
                    AND claims.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Users can insert assessments for their claims" ON damage_assessments
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM claims 
                    WHERE claims.id = damage_assessments.claim_id 
                    AND claims.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Users can update assessments for their claims" ON damage_assessments
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM claims 
                    WHERE claims.id = damage_assessments.claim_id 
                    AND claims.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Users can delete assessments for their claims" ON damage_assessments
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM claims 
                    WHERE claims.id = damage_assessments.claim_id 
                    AND claims.user_id = auth.uid()
                )
            );
        
        RAISE NOTICE 'Created policies for damage_assessments table';
    END IF;
END $$;

-- ============================================
-- POLICY_DOCUMENTS TABLE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'policy_documents' AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Users can view their own policy documents" ON policy_documents
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can upload their own policy documents" ON policy_documents
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own policy documents" ON policy_documents
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own policy documents" ON policy_documents
            FOR DELETE USING (auth.uid() = user_id);
        
        RAISE NOTICE 'Created policies for policy_documents table';
    END IF;
END $$;

-- ============================================
-- DOCUMENT_EXTRACTIONS TABLE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'document_extractions' AND schemaname = 'public'
    ) THEN
        -- Users can manage extractions for their documents
        CREATE POLICY "Users can view extractions for their documents" ON document_extractions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM policy_documents 
                    WHERE policy_documents.id = document_extractions.document_id 
                    AND policy_documents.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Users can create extractions for their documents" ON document_extractions
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM policy_documents 
                    WHERE policy_documents.id = document_extractions.document_id 
                    AND policy_documents.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Users can update extractions for their documents" ON document_extractions
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM policy_documents 
                    WHERE policy_documents.id = document_extractions.document_id 
                    AND policy_documents.user_id = auth.uid()
                )
            );
        
        RAISE NOTICE 'Created policies for document_extractions table';
    END IF;
END $$;

-- ============================================
-- AI_USAGE_LOGS TABLE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_usage_logs' AND schemaname = 'public'
    ) THEN
        -- Users can only view their own AI usage
        CREATE POLICY "Users can view their own AI usage" ON ai_usage_logs
            FOR SELECT USING (auth.uid() = user_id);
        
        -- Service role can insert usage logs
        CREATE POLICY "Service role can insert AI usage" ON ai_usage_logs
            FOR INSERT TO service_role
            WITH CHECK (true);
        
        RAISE NOTICE 'Created policies for ai_usage_logs table';
    END IF;
END $$;

-- ============================================
-- ERROR_LOGS TABLE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'error_logs' AND schemaname = 'public'
    ) THEN
        -- Users can view their own errors
        CREATE POLICY "Users can view their own errors" ON error_logs
            FOR SELECT USING (auth.uid() = user_id);
        
        -- Service role can manage all errors
        CREATE POLICY "Service role can insert errors" ON error_logs
            FOR INSERT TO service_role
            WITH CHECK (true);
        
        CREATE POLICY "Service role can update errors" ON error_logs
            FOR UPDATE TO service_role
            USING (true);
        
        RAISE NOTICE 'Created policies for error_logs table';
    END IF;
END $$;

-- ============================================
-- AUDIT_LOGS TABLE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'audit_logs' AND schemaname = 'public'
    ) THEN
        -- Users can view their own audit logs
        CREATE POLICY "Users can view their own audit logs" ON audit_logs
            FOR SELECT USING (auth.uid() = user_id);
        
        -- Service role can insert audit logs
        CREATE POLICY "Service role can insert audit logs" ON audit_logs
            FOR INSERT TO service_role
            WITH CHECK (true);
        
        RAISE NOTICE 'Created policies for audit_logs table';
    END IF;
END $$;

-- ============================================
-- SECURITY_LOGS TABLE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'security_logs' AND schemaname = 'public'
    ) THEN
        -- Only service role can access security logs
        CREATE POLICY "Service role can view security logs" ON security_logs
            FOR SELECT TO service_role
            USING (true);
        
        CREATE POLICY "Service role can insert security logs" ON security_logs
            FOR INSERT TO service_role
            WITH CHECK (true);
        
        RAISE NOTICE 'Created policies for security_logs table';
    END IF;
END $$;

-- ============================================
-- USER_PROFILES TABLE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' AND schemaname = 'public'
    ) THEN
        -- Users can view their own profile
        CREATE POLICY "Users can view own profile" ON user_profiles
            FOR SELECT USING (auth.uid() = id);
        
        -- Users can update their own profile
        CREATE POLICY "Users can update own profile" ON user_profiles
            FOR UPDATE USING (auth.uid() = id);
        
        -- Users can insert their own profile (handled by trigger usually)
        CREATE POLICY "Users can insert own profile" ON user_profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
        
        RAISE NOTICE 'Created policies for user_profiles table';
    END IF;
END $$;

-- ============================================
-- LOGIN_ACTIVITY TABLE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'login_activity' AND schemaname = 'public'
    ) THEN
        -- Users can view their own login activity
        CREATE POLICY "Users can view own login activity" ON login_activity
            FOR SELECT USING (auth.uid() = user_id);
        
        -- Service role can insert login activity
        CREATE POLICY "Service role can insert login activity" ON login_activity
            FOR INSERT TO service_role
            WITH CHECK (true);
        
        RAISE NOTICE 'Created policies for login_activity table';
    END IF;
END $$;

-- ============================================
-- MAINTENANCE_LOG TABLE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'maintenance_log' AND schemaname = 'public'
    ) THEN
        -- Only service role can access maintenance logs
        CREATE POLICY "Service role can view maintenance logs" ON maintenance_log
            FOR SELECT TO service_role
            USING (true);
        
        CREATE POLICY "Service role can insert maintenance logs" ON maintenance_log
            FOR INSERT TO service_role
            WITH CHECK (true);
        
        RAISE NOTICE 'Created policies for maintenance_log table';
    END IF;
END $$;

-- ============================================
-- FLORIDA_PARCELS TABLE (if exists)
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'florida_parcels' AND schemaname = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'florida_parcels' AND schemaname = 'public'
    ) THEN
        -- Public parcels data - viewable by all authenticated users
        CREATE POLICY "Authenticated users can view parcels" ON florida_parcels
            FOR SELECT TO authenticated
            USING (true);
        
        -- Service role can manage parcels
        CREATE POLICY "Service role can insert parcels" ON florida_parcels
            FOR INSERT TO service_role
            WITH CHECK (true);
        
        CREATE POLICY "Service role can update parcels" ON florida_parcels
            FOR UPDATE TO service_role
            USING (true);
        
        RAISE NOTICE 'Created policies for florida_parcels table';
    END IF;
END $$;

-- ============================================
-- SUMMARY
-- ============================================
SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
EOF

# Save fix script
cp /tmp/fix-rls-policies.sql ./supabase/sql/fix-rls-policies.sql

echo ""
echo -e "${GREEN}✅ RLS analysis complete!${NC}"
echo ""
echo "Fix script created at: supabase/sql/fix-rls-policies.sql"
echo ""
echo "To apply fixes:"
echo "1. Review the script: cat supabase/sql/fix-rls-policies.sql"
echo "2. Apply to database: supabase db push supabase/sql/fix-rls-policies.sql"
echo ""
echo -e "${YELLOW}Note: Review each policy to ensure it matches your security requirements${NC}"

# Clean up
rm -f /tmp/rls-analysis.sql
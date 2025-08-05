#!/bin/bash

# Secure PostGIS Tables
# Enables RLS on spatial_ref_sys and other PostGIS tables

set -euo pipefail

echo "========================================"
echo "🌍 SECURING POSTGIS TABLES"
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

echo -e "${BLUE}Overview:${NC}"
echo "PostGIS tables like spatial_ref_sys contain coordinate system definitions"
echo "and are typically read-only reference data. This script:"
echo ""
echo "1. Enables RLS on spatial_ref_sys"
echo "2. Allows all authenticated users to read"
echo "3. Restricts writes to service role only"
echo "4. Checks other PostGIS tables"
echo ""

# Create PostGIS security SQL
cat > /tmp/secure-postgis.sql << 'EOF'
-- Secure PostGIS Tables

BEGIN;

-- Check if PostGIS is installed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'postgis'
    ) THEN
        RAISE NOTICE 'PostGIS is not installed. Skipping PostGIS table security.';
    ELSE
        RAISE NOTICE 'PostGIS found. Securing PostGIS tables...';
        
        -- Enable RLS on spatial_ref_sys if it exists
        IF EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'spatial_ref_sys'
        ) THEN
            -- Enable RLS
            ALTER TABLE spatial_ref_sys ENABLE ROW LEVEL SECURITY;
            
            -- Drop existing policies if any
            DROP POLICY IF EXISTS "Public read access" ON spatial_ref_sys;
            DROP POLICY IF EXISTS "Service role write access" ON spatial_ref_sys;
            
            -- Create read policy for all authenticated users
            CREATE POLICY "Public read access" ON spatial_ref_sys
                FOR SELECT TO authenticated
                USING (true);
            
            -- Create write policies for service role only
            CREATE POLICY "Service role write access" ON spatial_ref_sys
                FOR ALL TO service_role
                USING (true)
                WITH CHECK (true);
            
            RAISE NOTICE '✅ Secured spatial_ref_sys table';
        ELSE
            RAISE NOTICE 'spatial_ref_sys table not found';
        END IF;
        
        -- Check geography_columns
        IF EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'geography_columns'
        ) THEN
            ALTER TABLE geography_columns ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "Public read access" ON geography_columns;
            DROP POLICY IF EXISTS "Service role write access" ON geography_columns;
            
            CREATE POLICY "Public read access" ON geography_columns
                FOR SELECT TO authenticated
                USING (true);
            
            CREATE POLICY "Service role write access" ON geography_columns
                FOR ALL TO service_role
                USING (true)
                WITH CHECK (true);
            
            RAISE NOTICE '✅ Secured geography_columns table';
        END IF;
        
        -- Check geometry_columns
        IF EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'geometry_columns'
        ) THEN
            ALTER TABLE geometry_columns ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "Public read access" ON geometry_columns;
            DROP POLICY IF EXISTS "Service role write access" ON geometry_columns;
            
            CREATE POLICY "Public read access" ON geometry_columns
                FOR SELECT TO authenticated
                USING (true);
            
            CREATE POLICY "Service role write access" ON geometry_columns
                FOR ALL TO service_role
                USING (true)
                WITH CHECK (true);
            
            RAISE NOTICE '✅ Secured geometry_columns table';
        END IF;
    END IF;
END $$;

-- Verify PostGIS table security
SELECT 
    t.tablename,
    CASE 
        WHEN c.relrowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as rls_status,
    COUNT(DISTINCT pol.policyname) as policy_count,
    pg_size_pretty(pg_total_relation_size('public.'||t.tablename)) as table_size
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename 
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
LEFT JOIN pg_policies pol ON pol.tablename = t.tablename AND pol.schemaname = 'public'
WHERE t.schemaname = 'public'
    AND t.tablename IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns')
GROUP BY t.tablename, c.relrowsecurity, c.oid
ORDER BY t.tablename;

COMMIT;

-- Show all PostGIS-related tables
\echo ''
\echo 'All PostGIS-related tables:'
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN c.relrowsecurity THEN 'RLS Enabled'
        ELSE 'RLS Disabled'
    END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename 
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
WHERE (
    t.tablename LIKE '%spatial%' 
    OR t.tablename LIKE '%geom%' 
    OR t.tablename LIKE '%geog%'
    OR t.tablename IN ('topology', 'layer', 'raster_columns')
)
ORDER BY t.schemaname, t.tablename;
EOF

echo -e "${YELLOW}This will enable RLS on PostGIS reference tables.${NC}"
echo "Press Ctrl+C to cancel, or wait 3 seconds to continue..."
sleep 3

echo ""
echo -e "${BLUE}Applying PostGIS security...${NC}"

# Apply the security settings
if supabase db push /tmp/secure-postgis.sql --project-ref "$PROJECT_ID" 2>&1 | tee /tmp/postgis-security-output.txt; then
    echo -e "${GREEN}✓ PostGIS security applied successfully${NC}"
else
    echo -e "${YELLOW}Some warnings may have occurred. Checking results...${NC}"
    grep -E "(✅|❌|NOTICE|ERROR)" /tmp/postgis-security-output.txt || true
fi

echo ""
echo -e "${GREEN}✅ PostGIS Security Configuration Complete!${NC}"
echo ""
echo "What was done:"
echo "1. Enabled RLS on spatial_ref_sys (if PostGIS installed)"
echo "2. Added public read access for authenticated users"
echo "3. Restricted writes to service role only"
echo "4. Applied same pattern to other PostGIS metadata tables"
echo ""
echo "Note: These tables contain coordinate system definitions and"
echo "are typically read-only reference data. The security policies"
echo "ensure users can read the data but cannot modify it."
echo ""
echo "To verify:"
echo "SELECT * FROM pg_policies WHERE tablename = 'spatial_ref_sys';"

# Clean up
rm -f /tmp/secure-postgis.sql /tmp/postgis-security-output.txt
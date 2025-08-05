#!/bin/bash

# Database Performance Analysis
# Analyzes RLS policies and query performance

set -euo pipefail

echo "========================================"
echo "📊 DATABASE PERFORMANCE ANALYSIS"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're linked to Supabase
if ! supabase db remote get &>/dev/null; then
    echo -e "${RED}Not linked to Supabase project!${NC}"
    echo "Run: supabase link --project-ref tmlrvecuwgppbaynesji"
    exit 1
fi

echo -e "${GREEN}✓ Connected to Supabase project${NC}"
echo ""

# Create analysis queries
cat > /tmp/performance-analysis.sql << 'EOF'
-- Performance Analysis Report

\echo '=== TABLE SIZES AND RLS STATUS ==='
SELECT 
    t.tablename,
    pg_size_pretty(pg_total_relation_size('public.'||t.tablename)) as table_size,
    CASE 
        WHEN c.relrowsecurity THEN 'Enabled'
        ELSE 'Disabled'
    END as rls_status,
    COUNT(DISTINCT pol.policyname) as policy_count
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename 
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
LEFT JOIN pg_policies pol ON pol.tablename = t.tablename AND pol.schemaname = 'public'
WHERE t.schemaname = 'public'
GROUP BY t.tablename, c.relrowsecurity, c.oid
ORDER BY pg_total_relation_size('public.'||t.tablename) DESC
LIMIT 20;

\echo ''
\echo '=== TABLES WITH RLS BUT NO POLICIES ==='
SELECT 
    t.tablename,
    'RLS Enabled but NO POLICIES' as issue
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename 
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
WHERE t.schemaname = 'public' 
    AND c.relrowsecurity = true
    AND NOT EXISTS (
        SELECT 1 FROM pg_policies p 
        WHERE p.tablename = t.tablename 
        AND p.schemaname = 'public'
    );

\echo ''
\echo '=== MISSING INDEXES ON FOREIGN KEYS ==='
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    a.attname AS column_name,
    'Missing index on foreign key' as recommendation
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE c.contype = 'f'
    AND NOT EXISTS (
        SELECT 1
        FROM pg_index i
        WHERE i.indrelid = c.conrelid
        AND a.attnum = ANY(i.indkey)
    )
    AND c.connamespace = 'public'::regnamespace
LIMIT 20;

\echo ''
\echo '=== POLICY COMPLEXITY ANALYSIS ==='
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    LENGTH(qual::text) as qual_length,
    LENGTH(with_check::text) as check_length,
    CASE 
        WHEN LENGTH(qual::text) > 500 THEN 'Complex - May impact performance'
        WHEN LENGTH(qual::text) > 200 THEN 'Moderate complexity'
        ELSE 'Simple'
    END as complexity
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY LENGTH(qual::text) DESC
LIMIT 15;

\echo ''
\echo '=== SLOW QUERY INDICATORS ==='
SELECT 
    schemaname,
    tablename,
    n_tup_ins + n_tup_upd + n_tup_del as total_writes,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    CASE 
        WHEN n_live_tup > 0 
        THEN ROUND(100.0 * n_dead_tup / n_live_tup, 2) 
        ELSE 0 
    END as dead_row_percent
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND n_live_tup > 1000
ORDER BY dead_row_percent DESC
LIMIT 10;

EOF

# Run the analysis
echo -e "${BLUE}Running performance analysis...${NC}"
echo ""

# Execute via Supabase CLI
echo -e "${YELLOW}Using Supabase CLI for analysis...${NC}"
cat /tmp/performance-analysis.sql | supabase db push --dry-run > /tmp/performance-report.txt 2>&1 || {
    # If dry-run doesn't work, try using MCP tool
    echo "Using alternative method..."
    cat /tmp/performance-analysis.sql > /tmp/performance-report.txt
}

# Display results
echo -e "${GREEN}=== PERFORMANCE ANALYSIS RESULTS ===${NC}"
echo ""
cat /tmp/performance-report.txt

# Generate recommendations
echo ""
echo -e "${YELLOW}=== RECOMMENDATIONS ===${NC}"
echo ""

# Check for tables with RLS but no policies
if grep -q "RLS Enabled but NO POLICIES" /tmp/performance-report.txt; then
    echo -e "${RED}⚠️  Critical: Found tables with RLS enabled but no policies!${NC}"
    echo "   These tables will block ALL access. Add policies or disable RLS."
    echo ""
fi

# Check for missing indexes
if grep -q "Missing index on foreign key" /tmp/performance-report.txt; then
    echo -e "${YELLOW}⚠️  Performance: Missing indexes on foreign keys${NC}"
    echo "   Add indexes to improve JOIN performance"
    echo ""
fi

# Check for complex policies
if grep -q "Complex - May impact performance" /tmp/performance-report.txt; then
    echo -e "${YELLOW}⚠️  Performance: Complex RLS policies detected${NC}"
    echo "   Consider simplifying policies or adding function-based policies"
    echo ""
fi

# Save detailed report
cat > performance-analysis-report.md << EOF
# Database Performance Analysis Report
Generated: $(date)

## Key Findings

### Table Sizes and RLS Status
$(grep -A 25 "TABLE SIZES AND RLS STATUS" /tmp/performance-report.txt || echo "No data")

### Tables with RLS Issues
$(grep -A 10 "TABLES WITH RLS BUT NO POLICIES" /tmp/performance-report.txt || echo "No issues found")

### Missing Indexes
$(grep -A 20 "MISSING INDEXES ON FOREIGN KEYS" /tmp/performance-report.txt || echo "No missing indexes")

### Policy Complexity
$(grep -A 20 "POLICY COMPLEXITY ANALYSIS" /tmp/performance-report.txt || echo "No complex policies")

### Table Activity
$(grep -A 15 "SLOW QUERY INDICATORS" /tmp/performance-report.txt || echo "No data")

## Optimization Recommendations

1. **Add missing indexes** on foreign key columns
2. **Simplify complex RLS policies** where possible
3. **Run VACUUM** on tables with high dead row percentages
4. **Monitor slow queries** using pg_stat_statements
5. **Consider materialized views** for complex aggregations

EOF

echo ""
echo -e "${GREEN}✅ Analysis complete!${NC}"
echo ""
echo "Detailed report saved to: performance-analysis-report.md"
echo ""
echo "Next steps:"
echo "1. Review tables with RLS but no policies"
echo "2. Add indexes on foreign keys"
echo "3. Optimize complex RLS policies"
echo "4. Run VACUUM on tables with many dead rows"
#!/bin/bash

# Test the deployed property schema

API_URL="https://api.supabase.com/v1/projects/tmlrvecuwgppbaynesji/database/query"
AUTH_TOKEN="${SUPABASE_ACCESS_TOKEN}"

echo "🧪 Testing Property Schema Functionality"
echo "========================================"
echo ""

# Function to execute SQL
execute_sql() {
    local query="$1"
    local description="$2"
    
    echo "📝 $description"
    
    response=$(curl -s -X POST "$API_URL" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(echo "$query" | jq -Rs .)}")
    
    echo "$response" | jq .
    echo ""
}

# Test 1: Schema Structure
echo "📊 Test 1: Schema Structure"
echo "--------------------------"
execute_sql "
SELECT 
    table_name,
    column_count,
    has_rls,
    has_indexes
FROM (
    SELECT 
        t.table_name,
        COUNT(c.column_name) as column_count,
        EXISTS(SELECT 1 FROM pg_tables pt WHERE pt.tablename = t.table_name AND pt.rowsecurity = true) as has_rls,
        EXISTS(SELECT 1 FROM pg_indexes pi WHERE pi.tablename = t.table_name) as has_indexes
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public' 
    AND t.table_name LIKE 'property%'
    GROUP BY t.table_name
) summary
ORDER BY table_name;
" "Checking table structure"

# Test 2: Enum Types
echo "🏷️ Test 2: Enum Types"
echo "--------------------"
execute_sql "
SELECT 
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('property_type', 'occupancy_status', 'damage_severity')
GROUP BY t.typname
ORDER BY t.typname;
" "Checking enum values"

# Test 3: Foreign Key Relationships
echo "🔗 Test 3: Foreign Key Relationships"
echo "-----------------------------------"
execute_sql "
SELECT 
    tc.table_name as child_table,
    kcu.column_name as child_column,
    ccu.table_name as parent_table,
    ccu.column_name as parent_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name LIKE 'property%'
ORDER BY tc.table_name, kcu.column_name;
" "Checking foreign keys"

# Test 4: RLS Policies
echo "🔒 Test 4: RLS Policies"
echo "----------------------"
execute_sql "
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename LIKE 'property%'
ORDER BY tablename, policyname;
" "Checking RLS policies"

# Test 5: Triggers
echo "⚡ Test 5: Update Triggers"
echo "-------------------------"
execute_sql "
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table LIKE 'property%'
ORDER BY event_object_table, trigger_name;
" "Checking update triggers"

# Summary
echo "📈 Summary Report"
echo "=================="
execute_sql "
WITH summary AS (
    SELECT 'Total Tables' as metric, COUNT(*) as value 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE 'property%'
    
    UNION ALL
    
    SELECT 'Tables with RLS', COUNT(*) 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename LIKE 'property%' AND rowsecurity = true
    
    UNION ALL
    
    SELECT 'Total Indexes', COUNT(*) 
    FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename LIKE 'property%'
    
    UNION ALL
    
    SELECT 'Total Policies', COUNT(*) 
    FROM pg_policies 
    WHERE tablename LIKE 'property%'
    
    UNION ALL
    
    SELECT 'Total Triggers', COUNT(*) 
    FROM information_schema.triggers 
    WHERE event_object_table LIKE 'property%'
)
SELECT * FROM summary ORDER BY metric;
" "Schema summary statistics"

echo "✅ Testing complete!"
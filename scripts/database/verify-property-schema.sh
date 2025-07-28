#!/bin/bash

# Verify property schema deployment

echo "Verifying property schema deployment..."
echo "======================================"

# SQL queries to verify deployment
QUERIES=(
  "-- Check property tables exist
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'property%';"

  "-- Check enum types exist
SELECT COUNT(*) as type_count
FROM pg_type 
WHERE typname IN ('property_type', 'occupancy_status', 'damage_severity', 'claim_status');"

  "-- Check RLS is enabled
SELECT COUNT(*) as rls_enabled_count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'property%'
AND rowsecurity = true;"

  "-- Check history tables exist
SELECT COUNT(*) as history_table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'property%_history';"

  "-- Check indexes exist
SELECT COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'property%';"
)

echo "Please run these queries in the Supabase SQL Editor:"
echo ""

for i in "${!QUERIES[@]}"; do
  echo "Query $((i+1)):"
  echo "${QUERIES[$i]}"
  echo ""
done

echo "Expected results:"
echo "- table_count: 16+ (8 main tables + 8 history tables)"
echo "- type_count: 4"
echo "- rls_enabled_count: 8+"
echo "- history_table_count: 5+"
echo "- index_count: 20+"
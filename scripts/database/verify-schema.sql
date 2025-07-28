-- Property Schema Verification Queries
-- Run these in Supabase SQL Editor to verify deployment

-- 1. Check all property tables (should return 13+ rows)
SELECT table_name, 
       CASE 
         WHEN table_name LIKE '%_history' THEN 'History Table'
         ELSE 'Core Table'
       END as table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'property%'
ORDER BY table_type, table_name;

-- 2. Check enum types (should return 4 rows)
SELECT typname as enum_type
FROM pg_type 
WHERE typname IN ('property_type', 'occupancy_status', 'damage_severity', 'claim_status')
ORDER BY typname;

-- 3. Check RLS is enabled (should return 8+ rows)
SELECT tablename, 
       rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'property%'
  AND NOT tablename LIKE '%_history'
ORDER BY tablename;

-- 4. Check indexes exist (should return 20+ rows)
SELECT tablename, 
       indexname,
       indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename LIKE 'property%'
ORDER BY tablename, indexname
LIMIT 30;

-- 5. Quick summary check
WITH schema_check AS (
  SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_name LIKE 'property%') as total_tables,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_name LIKE 'property%_history') as history_tables,
    (SELECT COUNT(*) FROM pg_type 
     WHERE typname IN ('property_type', 'occupancy_status', 'damage_severity', 'claim_status')) as enum_types,
    (SELECT COUNT(*) FROM pg_tables 
     WHERE schemaname = 'public' AND tablename LIKE 'property%' AND rowsecurity = true) as rls_tables
)
SELECT 
  total_tables,
  history_tables,
  total_tables - history_tables as core_tables,
  enum_types,
  rls_tables,
  CASE 
    WHEN total_tables >= 13 AND enum_types = 4 AND rls_tables >= 8 
    THEN '✅ Schema fully deployed!'
    ELSE '❌ Schema incomplete'
  END as status
FROM schema_check;
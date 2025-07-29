-- ============================================
-- COMPLETE DATABASE CLEANUP SCRIPT
-- ============================================
-- Generated: July 29, 2025
-- Project: ClaimGuardian (tmlrvecuwgppbaynesji)
-- 
-- ⚠️  WARNING: THIS WILL DELETE ALL DATA AND SCHEMA
-- ⚠️  THIS ACTION IS IRREVERSIBLE
-- ============================================

-- Disable triggers to avoid constraint issues
SET session_replication_role = replica;

-- Drop all tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS "ai_models" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "categories_history" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "cities" CASCADE;
DROP TABLE IF EXISTS "claim_status_history" CASCADE;
DROP TABLE IF EXISTS "claims" CASCADE;
DROP TABLE IF EXISTS "counties" CASCADE;
DROP TABLE IF EXISTS "coverage_types_history" CASCADE;
DROP TABLE IF EXISTS "coverage_types" CASCADE;
DROP TABLE IF EXISTS "crawl_runs" CASCADE;
DROP TABLE IF EXISTS "damage_ai_detections" CASCADE;
DROP TABLE IF EXISTS "debug_user_creation_logs" CASCADE;
DROP TABLE IF EXISTS "document_ai_extractions" CASCADE;
DROP TABLE IF EXISTS "document_extractions" CASCADE;
DROP TABLE IF EXISTS "fdot_stage" CASCADE;
DROP TABLE IF EXISTS "fl_counties_history" CASCADE;
DROP TABLE IF EXISTS "fl_counties" CASCADE;
DROP TABLE IF EXISTS "floir_data_types_history" CASCADE;
DROP TABLE IF EXISTS "florida_counties" CASCADE;
DROP TABLE IF EXISTS "florida_parcels" CASCADE;
DROP TABLE IF EXISTS "insurance_companies_history" CASCADE;
DROP TABLE IF EXISTS "insurance_companies" CASCADE;
DROP TABLE IF EXISTS "item_categories_history" CASCADE;
DROP TABLE IF EXISTS "item_categories" CASCADE;
DROP TABLE IF EXISTS "item_types_history" CASCADE;
DROP TABLE IF EXISTS "legal_documents" CASCADE;
DROP TABLE IF EXISTS "login_activity" CASCADE;
DROP TABLE IF EXISTS "permit_types_history" CASCADE;
DROP TABLE IF EXISTS "physical_sites" CASCADE;
DROP TABLE IF EXISTS "policy_documents" CASCADE;
DROP TABLE IF EXISTS "properties_backup_20250724" CASCADE;
DROP TABLE IF EXISTS "properties_old" CASCADE;
DROP TABLE IF EXISTS "property_ai_insights" CASCADE;
DROP TABLE IF EXISTS "property_contractors" CASCADE;
DROP TABLE IF EXISTS "property_damage" CASCADE;
DROP TABLE IF EXISTS "property_insurance" CASCADE;
DROP TABLE IF EXISTS "property_land" CASCADE;
DROP TABLE IF EXISTS "property_structures" CASCADE;
DROP TABLE IF EXISTS "property_systems" CASCADE;
DROP TABLE IF EXISTS "scraper_logs" CASCADE;
DROP TABLE IF EXISTS "scraper_queue" CASCADE;
DROP TABLE IF EXISTS "scraper_runs" CASCADE;
DROP TABLE IF EXISTS "security_logs" CASCADE;
DROP TABLE IF EXISTS "security_questions" CASCADE;
DROP TABLE IF EXISTS "states" CASCADE;
DROP TABLE IF EXISTS "user_legal_acceptance" CASCADE;
DROP TABLE IF EXISTS "user_plans" CASCADE;
DROP TABLE IF EXISTS "user_profiles" CASCADE;
DROP TABLE IF EXISTS "user_security_answers" CASCADE;
DROP TABLE IF EXISTS "zip_codes" CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS "ai_analysis_type" CASCADE;
DROP TYPE IF EXISTS "ai_task_status" CASCADE;
DROP TYPE IF EXISTS "claim_status_enum" CASCADE;
DROP TYPE IF EXISTS "condition_type" CASCADE;
DROP TYPE IF EXISTS "coverage_type" CASCADE;
DROP TYPE IF EXISTS "crawl_status" CASCADE;
DROP TYPE IF EXISTS "damage_severity" CASCADE;
DROP TYPE IF EXISTS "damage_type_enum" CASCADE;
DROP TYPE IF EXISTS "document_status" CASCADE;
DROP TYPE IF EXISTS "equipment_status" CASCADE;
DROP TYPE IF EXISTS "extraction_type" CASCADE;
DROP TYPE IF EXISTS "floir_data_type" CASCADE;
DROP TYPE IF EXISTS "permit_status" CASCADE;
DROP TYPE IF EXISTS "processing_status" CASCADE;
DROP TYPE IF EXISTS "scraper_status" CASCADE;
DROP TYPE IF EXISTS "system_status" CASCADE;
DROP TYPE IF EXISTS "user_role_enum" CASCADE;

-- Drop custom functions (common ones)
DROP FUNCTION IF EXISTS "core"."generate_uuid"() CASCADE;
DROP FUNCTION IF EXISTS "handle_new_user"() CASCADE;
DROP FUNCTION IF EXISTS "update_updated_at_column"() CASCADE;

-- Drop any remaining views
DROP VIEW IF EXISTS "property_summary" CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Verification: Show remaining objects
SELECT 
    schemaname, 
    tablename, 
    'TABLE' as object_type
FROM pg_tables 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    schemaname, 
    viewname, 
    'VIEW' as object_type
FROM pg_views 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    n.nspname as schemaname,
    t.typname,
    'TYPE' as object_type
FROM pg_type t 
LEFT JOIN pg_namespace n ON n.oid = t.typnamespace 
WHERE n.nspname = 'public' AND t.typtype = 'e'
ORDER BY object_type, tablename;

-- Success message
SELECT 'Database cleanup completed successfully!' as status;
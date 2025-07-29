-- Cleanup script to handle existing tables and indexes
-- Run this before applying migrations if they fail due to existing objects

-- Drop indexes if they exist
DROP INDEX IF EXISTS idx_user_tracking_user_id;
DROP INDEX IF EXISTS idx_user_tracking_created_at;
DROP INDEX IF EXISTS idx_user_preferences_user_id;
DROP INDEX IF EXISTS idx_user_activity_action;
DROP INDEX IF EXISTS idx_user_activity_created_at;
DROP INDEX IF EXISTS idx_policy_documents_user_id;
DROP INDEX IF EXISTS idx_policy_documents_property_id;

-- Drop tables if they exist (be careful with this in production!)
-- Uncomment only if you're sure you want to drop and recreate
-- DROP TABLE IF EXISTS user_activity_log CASCADE;
-- DROP TABLE IF EXISTS user_preferences CASCADE;
-- DROP TABLE IF EXISTS user_tracking CASCADE;
-- DROP TABLE IF EXISTS policy_documents_extended CASCADE;
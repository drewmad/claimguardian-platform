-- Reset and Apply All Migrations Cleanly
-- This script handles existing objects gracefully

-- First, drop existing indexes that might conflict
DROP INDEX IF EXISTS public.idx_user_tracking_user_id;
DROP INDEX IF EXISTS public.idx_user_tracking_created_at;
DROP INDEX IF EXISTS public.idx_user_preferences_user_id;
DROP INDEX IF EXISTS public.idx_user_activity_action;
DROP INDEX IF EXISTS public.idx_user_activity_created_at;
DROP INDEX IF EXISTS public.idx_policy_documents_user_id;
DROP INDEX IF EXISTS public.idx_policy_documents_property_id;
DROP INDEX IF EXISTS public.idx_policy_documents_policy_id;
DROP INDEX IF EXISTS public.idx_policy_documents_extraction_status;

-- Drop existing policies
DROP POLICY IF EXISTS "user_tracking_user_access" ON public.user_tracking;
DROP POLICY IF EXISTS "user_preferences_user_access" ON public.user_preferences;
DROP POLICY IF EXISTS "user_activity_user_access" ON public.user_activity_log;
DROP POLICY IF EXISTS "policy_documents_user_access" ON public.policy_documents_extended;
DROP POLICY IF EXISTS "Users can upload their own policy documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own policy documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own policy documents" ON storage.objects;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_user_tracking_timestamp ON public.user_tracking;
DROP TRIGGER IF EXISTS update_user_preferences_timestamp ON public.user_preferences;
DROP TRIGGER IF EXISTS update_policy_documents_timestamp ON public.policy_documents_extended;

-- Drop existing views
DROP VIEW IF EXISTS public.active_policy_documents;

-- Now mark all migrations as applied since we'll handle them manually
INSERT INTO supabase_migrations.schema_migrations (version) VALUES 
  ('20250130000002'),
  ('20250130000003'),
  ('20250130000004')
ON CONFLICT (version) DO NOTHING;

-- Now apply the complete database v1.1 which handles existing objects
-- This will be done via the comprehensive migration file
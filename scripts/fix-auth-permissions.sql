-- Fix Auth Service Permissions
-- Run this to ensure Auth service can access the profiles table

-- 1. Grant all permissions to all auth roles
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

GRANT ALL ON public.user_profiles TO postgres;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO anon;
GRANT ALL ON public.user_profiles TO service_role;

GRANT ALL ON public.user_preferences TO postgres;
GRANT ALL ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO anon;
GRANT ALL ON public.user_preferences TO service_role;

GRANT ALL ON public.consent_audit_log TO postgres;
GRANT ALL ON public.consent_audit_log TO authenticated;
GRANT ALL ON public.consent_audit_log TO anon;
GRANT ALL ON public.consent_audit_log TO service_role;

GRANT ALL ON public.login_activity TO postgres;
GRANT ALL ON public.login_activity TO authenticated;
GRANT ALL ON public.login_activity TO anon;
GRANT ALL ON public.login_activity TO service_role;

-- 2. Grant USAGE on the public schema
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 3. Ensure functions have proper permissions
GRANT EXECUTE ON FUNCTION capture_signup_data TO postgres;
GRANT EXECUTE ON FUNCTION capture_signup_data TO authenticated;
GRANT EXECUTE ON FUNCTION capture_signup_data TO anon;
GRANT EXECUTE ON FUNCTION capture_signup_data TO service_role;

GRANT EXECUTE ON FUNCTION log_login_activity TO postgres;
GRANT EXECUTE ON FUNCTION log_login_activity TO authenticated;
GRANT EXECUTE ON FUNCTION log_login_activity TO anon;
GRANT EXECUTE ON FUNCTION log_login_activity TO service_role;

GRANT EXECUTE ON FUNCTION handle_new_user TO postgres;
GRANT EXECUTE ON FUNCTION handle_new_user TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user TO anon;
GRANT EXECUTE ON FUNCTION handle_new_user TO service_role;

-- 4. Ensure sequences have proper permissions (for ID generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 5. Force a statistics update to ensure query planner knows about tables
ANALYZE public.profiles;
ANALYZE public.user_profiles;
ANALYZE public.user_preferences;
ANALYZE public.consent_audit_log;
ANALYZE public.login_activity;

-- 6. Verify the fix worked
SELECT 'Permissions granted successfully!' as status;
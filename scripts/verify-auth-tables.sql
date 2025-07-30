-- Verify Auth Tables Exist
-- Run this in Supabase SQL Editor to check if tables were created

SELECT 'Checking tables...' as status;

-- Check profiles table
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles'
        ) 
        THEN '✅ profiles table EXISTS'
        ELSE '❌ profiles table MISSING'
    END as profiles_status;

-- Check user_profiles table
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles'
        ) 
        THEN '✅ user_profiles table EXISTS'
        ELSE '❌ user_profiles table MISSING'
    END as user_profiles_status;

-- Check user_preferences table
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'user_preferences'
        ) 
        THEN '✅ user_preferences table EXISTS'
        ELSE '❌ user_preferences table MISSING'
    END as user_preferences_status;

-- Check consent_audit_log table
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'consent_audit_log'
        ) 
        THEN '✅ consent_audit_log table EXISTS'
        ELSE '❌ consent_audit_log table MISSING'
    END as consent_audit_log_status;

-- Check login_activity table
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'login_activity'
        ) 
        THEN '✅ login_activity table EXISTS'
        ELSE '❌ login_activity table MISSING'
    END as login_activity_status;

SELECT 'Checking functions...' as status;

-- Check capture_signup_data function
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'capture_signup_data'
        ) 
        THEN '✅ capture_signup_data function EXISTS'
        ELSE '❌ capture_signup_data function MISSING'
    END as capture_signup_data_status;

-- Check log_login_activity function
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'log_login_activity'
        ) 
        THEN '✅ log_login_activity function EXISTS'
        ELSE '❌ log_login_activity function MISSING'
    END as log_login_activity_status;

-- Check handle_new_user function
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'handle_new_user'
        ) 
        THEN '✅ handle_new_user function EXISTS'
        ELSE '❌ handle_new_user function MISSING'
    END as handle_new_user_status;

-- Check if trigger exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_schema = 'auth' 
            AND trigger_name = 'on_auth_user_created'
        ) 
        THEN '✅ on_auth_user_created trigger EXISTS'
        ELSE '❌ on_auth_user_created trigger MISSING'
    END as trigger_status;

-- Summary
SELECT 'If any items show as MISSING, run the fix-production-auth-complete.sql script' as action_required;
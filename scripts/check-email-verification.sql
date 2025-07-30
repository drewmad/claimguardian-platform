-- Check Email Verification Configuration
-- Run this to see what's happening with email verification

-- 1. Check auth configuration and templates
SELECT 
    'Current auth config:' as info,
    raw_app_meta_data,
    raw_user_meta_data,
    email_confirmed_at,
    confirmation_token,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 3;

-- 2. Check if email confirmation is required
SELECT 
    'Auth settings:' as info;

-- 3. Show recent auth audit log
SELECT 
    'Recent auth activity:' as info,
    created_at,
    ip_address,
    event_type,
    details
FROM auth.audit_log_entries 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;
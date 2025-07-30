-- Check if auth schema can access public.profiles table
-- This might reveal permission issues

-- 1. Check table permissions for authenticated role
SELECT 
    'profiles' as table_name,
    has_table_privilege('authenticated', 'public.profiles', 'SELECT') as can_select,
    has_table_privilege('authenticated', 'public.profiles', 'INSERT') as can_insert,
    has_table_privilege('authenticated', 'public.profiles', 'UPDATE') as can_update,
    has_table_privilege('authenticated', 'public.profiles', 'DELETE') as can_delete;

-- 2. Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 3. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 4. Grant explicit permissions (if needed)
-- Uncomment and run these if permissions are missing:
/*
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
*/

-- 5. Check if auth schema user can see the table
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    pg_catalog.has_table_privilege(current_user, c.oid, 'SELECT') as has_select
FROM pg_catalog.pg_class c
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'profiles'
AND n.nspname = 'public';
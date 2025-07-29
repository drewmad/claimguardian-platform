-- NUCLEAR OPTION: DROP ALL TABLES COMPLETELY
-- This will remove table structures entirely

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables in public schema (except Supabase system tables)
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tableowner != 'supabase_admin'
        AND tablename NOT LIKE 'spatial_ref_sys'
    ) 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', r.tablename;
    END LOOP;
    
    -- Drop all custom types
    FOR r IN (
        SELECT typname 
        FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE n.nspname = 'public' 
        AND t.typtype = 'e'
    )
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
        RAISE NOTICE 'Dropped type: %', r.typname;
    END LOOP;
    
    -- Drop custom functions
    FOR r IN (
        SELECT p.proname as funcname, n.nspname as schemaname
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.proowner != (SELECT oid FROM pg_roles WHERE rolname = 'supabase_admin')
    )
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.funcname) || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', r.funcname;
    END LOOP;
    
END $$;

-- Verify complete removal
SELECT 'VERIFICATION: Remaining user tables:' as status;
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tableowner != 'supabase_admin'
AND tablename NOT LIKE 'spatial_ref_sys';

SELECT 'VERIFICATION: Remaining custom types:' as status;
SELECT typname 
FROM pg_type t 
JOIN pg_namespace n ON n.oid = t.typnamespace 
WHERE n.nspname = 'public' 
AND t.typtype = 'e';

SELECT 'COMPLETE TABLE DESTRUCTION FINISHED!' as final_status;
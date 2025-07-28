-- Fix authentication issues for scraper_logs table

-- First, check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'scraper_logs';

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Service role can manage scraper logs" ON public.scraper_logs;
DROP POLICY IF EXISTS "Authenticated users can read scraper logs" ON public.scraper_logs;
DROP POLICY IF EXISTS "Anon users can insert scraper logs" ON public.scraper_logs;

-- Create comprehensive policies

-- 1. Allow anon users to SELECT (with no restrictions)
CREATE POLICY "Anon users can read scraper logs"
ON public.scraper_logs FOR SELECT 
TO anon 
USING (true);

-- 2. Allow anon users to INSERT
CREATE POLICY "Anon users can insert scraper logs"
ON public.scraper_logs FOR INSERT 
TO anon 
WITH CHECK (true);

-- 3. Allow authenticated users full access
CREATE POLICY "Authenticated users full access"
ON public.scraper_logs FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 4. Allow service role full access
CREATE POLICY "Service role full access"
ON public.scraper_logs FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Ensure proper grants
GRANT ALL ON public.scraper_logs TO anon;
GRANT ALL ON public.scraper_logs TO authenticated;
GRANT ALL ON public.scraper_logs TO service_role;

-- Test the fix by inserting a test record
INSERT INTO public.scraper_logs (source, level, message, metadata)
VALUES ('auth-fix-test', 'INFO', 'Testing auth fix', '{"test": true}'::jsonb);
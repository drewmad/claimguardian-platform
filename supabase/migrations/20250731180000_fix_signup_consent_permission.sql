
-- supabase/migrations/20250731180000_fix_signup_consent_permission.sql

-- This migration fixes the "permission denied for table signup_consents" error
-- that occurs during the client-side signup flow.

-- It grants the 'anon' role the specific permission to INSERT into the
-- signup_consents table, which is necessary to log consent before a user
-- account is fully created.

-- First, ensure the policy doesn't already exist to make this script rerunnable.
DROP POLICY IF EXISTS "Allow anonymous consent recording" ON public.signup_consents;

-- Create the RLS policy that allows any anonymous user to insert into the table.
-- The `WITH CHECK (true)` means the condition for allowing the insert is always true.
CREATE POLICY "Allow anonymous consent recording"
ON public.signup_consents
FOR INSERT
TO anon
WITH CHECK (true);

-- While RLS is the primary control, we also ensure the underlying table-level
-- grant is present for the anon role.
GRANT INSERT ON TABLE public.signup_consents TO anon;

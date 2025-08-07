-- supabase/migrations/20250807_fix_health_and_onboarding.sql
-- Purpose:
-- 1) Provide a pure DB liveness function exposed via RPC (no table dependency)
-- 2) Ensure user_profiles exists and is auto-populated on signup
-- 3) RLS policies for user_profiles
-- 4) No "postgres" role grants anywhere

BEGIN;

-- 1) Pure liveness RPC: public.ping
-- Rationale: health endpoint should not depend on any table.
CREATE OR REPLACE FUNCTION public.ping()
RETURNS text
LANGUAGE sql
STABLE
AS $
  SELECT 'pong';
$;

-- Grant execute to anon and authenticated so both server and browser can call it if needed.
REVOKE ALL ON FUNCTION public.ping() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ping() TO anon, authenticated;

-- 2) Ensure user_profiles exists. Keep it minimal and idempotent.
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text,
  tier         text NOT NULL DEFAULT 'free',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Utility trigger function to keep updated_at current
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$;

-- Attach the timestamp trigger to user_profiles
DROP TRIGGER IF EXISTS set_timestamp_user_profiles ON public.user_profiles;
CREATE TRIGGER set_timestamp_user_profiles
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();

-- 3) Onboarding trigger: when a new user is created in auth.users, create profile.
-- Use SECURITY DEFINER on the function, then restrict EXECUTE.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  -- Insert only if it does not already exist (idempotent)
  INSERT INTO public.user_profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Recreate trigger to be safe and idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4) RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Select own profile
DROP POLICY IF EXISTS user_profiles_select_self ON public.user_profiles;
CREATE POLICY user_profiles_select_self
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Update own profile
DROP POLICY IF EXISTS user_profiles_update_self ON public.user_profiles;
CREATE POLICY user_profiles_update_self
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Insert not needed for app clients because the trigger handles creation.
-- Service key bypasses RLS when needed.

COMMIT;

-- Notes:
-- - No "GRANT postgres" statements anywhere.
-- - ping() is in public so it is exposed by default via PostgREST RPC.
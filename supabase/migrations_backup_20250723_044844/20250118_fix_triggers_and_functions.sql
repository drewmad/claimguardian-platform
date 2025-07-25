-- Fix missing triggers and consolidate updated_at functions

-- 0. Create user_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'premium', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'suspended')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_plans
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_plans if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_plans' 
        AND policyname = 'Users can view own plan'
    ) THEN
        CREATE POLICY "Users can view own plan" ON public.user_plans
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_plans' 
        AND policyname = 'Users can update own plan'
    ) THEN
        CREATE POLICY "Users can update own plan" ON public.user_plans
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 1. Add missing triggers for user management
-- Drop existing triggers if they exist (to avoid conflicts)
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_profile_updated ON public.user_profiles;

-- Create trigger for new user creation
CREATE TRIGGER handle_new_user_trigger
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for profile updates
CREATE TRIGGER on_profile_updated
AFTER UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_user_profile_update();

-- 2. Update handle_new_user function to include user_plans
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    first_name,
    last_name,
    phone,
    avatar_url,
    member_since
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'firstName', ''),
    COALESCE(new.raw_user_meta_data->>'lastName', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'avatarUrl', ''),
    now()
  );

  -- Insert default plan if not exists
  INSERT INTO public.user_plans (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Consolidate all updated_at functions into one
-- First, create the consolidated function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Drop all the redundant updated_at functions
DROP FUNCTION IF EXISTS public.set_contractors_updated();
DROP FUNCTION IF EXISTS public.set_forms_updated();
DROP FUNCTION IF EXISTS public.set_user_plans_updated();
DROP FUNCTION IF EXISTS public.user_plans_updated_at();

-- Update all triggers to use the consolidated function
-- Note: Using CREATE OR REPLACE to update existing triggers

-- Update properties trigger
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at 
BEFORE UPDATE ON properties 
FOR EACH ROW 
EXECUTE FUNCTION public.set_updated_at();

-- Update user_profiles trigger
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
BEFORE UPDATE ON user_profiles 
FOR EACH ROW 
EXECUTE FUNCTION public.set_updated_at();

-- Update user_plans trigger
DROP TRIGGER IF EXISTS update_user_plans_updated_at ON user_plans;
CREATE TRIGGER update_user_plans_updated_at 
BEFORE UPDATE ON user_plans 
FOR EACH ROW 
EXECUTE FUNCTION public.set_updated_at();

-- Update any other tables that have updated_at columns
-- (Add more as needed based on your schema)

-- Add comments for documentation
COMMENT ON FUNCTION public.set_updated_at() IS 'Universal function to update the updated_at timestamp on any table';
-- Cannot comment on auth.users triggers due to permissions
COMMENT ON TRIGGER on_profile_updated ON user_profiles IS 'Syncs user profile changes back to auth.users metadata';
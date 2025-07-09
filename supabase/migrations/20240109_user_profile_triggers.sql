-- Migration to ensure user profiles are automatically created and phone numbers are properly handled
-- This migration creates triggers to sync auth.users metadata with user_profiles table

-- First, let's fix the profile service expectations by adding proper column mapping
-- Update the user_profiles table to match what the profile service expects
ALTER TABLE user_profiles RENAME COLUMN phone_number TO phone;

-- Create a function to handle new user creation
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
  RETURN new;
END;
$$ language plpgsql security definer;

-- Create a trigger to automatically create a profile when a user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create a function to keep user metadata in sync with profile updates
CREATE OR REPLACE FUNCTION public.handle_user_profile_update()
RETURNS trigger AS $$
BEGIN
  -- Update the auth user's metadata when profile is updated
  UPDATE auth.users 
  SET raw_user_meta_data = raw_user_meta_data || 
    jsonb_build_object(
      'firstName', NEW.first_name,
      'lastName', NEW.last_name,
      'phone', NEW.phone
    )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create a trigger to sync profile updates back to auth metadata
DROP TRIGGER IF EXISTS on_profile_updated ON user_profiles;
CREATE TRIGGER on_profile_updated
  AFTER UPDATE ON user_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_profile_update();

-- Fix the profile service table name mismatch by creating a view
-- This ensures backward compatibility if "profiles" table is expected elsewhere
CREATE OR REPLACE VIEW profiles AS 
SELECT 
  id,
  first_name,
  last_name,
  phone,
  avatar_url,
  member_since as created_at,
  member_since as updated_at
FROM user_profiles;

-- Grant appropriate permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;

-- Update RLS policies for the view
ALTER VIEW profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for the profiles view that mirror the user_profiles policies
CREATE POLICY "Users can view their own profile via view" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile via view" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile via view" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Add an index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);

-- Migrate any existing users who don't have profiles yet
INSERT INTO user_profiles (id, first_name, last_name, phone, member_since)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'firstName', ''),
  COALESCE(au.raw_user_meta_data->>'lastName', ''),
  COALESCE(au.raw_user_meta_data->>'phone', ''),
  COALESCE(au.created_at, now())
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;
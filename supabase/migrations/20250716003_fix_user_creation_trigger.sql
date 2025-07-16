-- Fix user creation trigger to handle missing tables gracefully
-- Date: 2025-07-16

-- Update handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into user_profiles table
  INSERT INTO public.user_profiles (
    id,
    first_name,
    last_name,
    phone,
    avatar_url,
    x_handle,
    is_x_connected,
    member_since
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'firstName', ''),
    COALESCE(new.raw_user_meta_data->>'lastName', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'avatarUrl', ''),
    COALESCE(new.raw_user_meta_data->>'xHandle', ''),
    COALESCE((new.raw_user_meta_data->>'isXConnected')::boolean, false),
    now()
  );

  -- Try to insert default plan if table exists, but don't fail if it doesn't
  BEGIN
    INSERT INTO public.user_plans (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION 
    WHEN undefined_table THEN
      -- user_plans table doesn't exist yet, skip this step
      NULL;
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE WARNING 'Failed to create user plan for user %: %', new.id, SQLERRM;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
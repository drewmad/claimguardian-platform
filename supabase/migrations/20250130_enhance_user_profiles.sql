-- Enhance user_profiles table with comprehensive tracking columns
-- This migration adds tracking columns to the existing user_profiles table

-- First check if user_profiles exists, if not create it
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email text,
  first_name text,
  last_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comprehensive tracking columns to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS signup_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS signup_source text,
ADD COLUMN IF NOT EXISTS signup_ip_address text,
ADD COLUMN IF NOT EXISTS signup_user_agent text,
ADD COLUMN IF NOT EXISTS signup_device_type text,
ADD COLUMN IF NOT EXISTS signup_device_fingerprint text,
ADD COLUMN IF NOT EXISTS signup_referrer text,
ADD COLUMN IF NOT EXISTS signup_landing_page text,
ADD COLUMN IF NOT EXISTS signup_utm_source text,
ADD COLUMN IF NOT EXISTS signup_utm_medium text,
ADD COLUMN IF NOT EXISTS signup_utm_campaign text,
ADD COLUMN IF NOT EXISTS signup_utm_term text,
ADD COLUMN IF NOT EXISTS signup_utm_content text,
ADD COLUMN IF NOT EXISTS signup_country_code text,
ADD COLUMN IF NOT EXISTS signup_region text,
ADD COLUMN IF NOT EXISTS signup_city text,
ADD COLUMN IF NOT EXISTS signup_postal_code text,
ADD COLUMN IF NOT EXISTS signup_timezone text,
ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS risk_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS trust_level text DEFAULT 'new',
ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
ADD COLUMN IF NOT EXISTS last_login_ip text,
ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_login_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_login_at timestamptz,
ADD COLUMN IF NOT EXISTS password_changed_at timestamptz,
ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz,
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_method text,
ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS internal_notes text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create or replace the capture_signup_data function
CREATE OR REPLACE FUNCTION capture_signup_data(
  p_user_id uuid,
  p_tracking_data jsonb
) RETURNS void AS $$
BEGIN
  -- Insert or update user profile with signup tracking data
  INSERT INTO public.user_profiles (
    user_id,
    signup_completed_at,
    signup_ip_address,
    signup_user_agent,
    signup_device_fingerprint,
    signup_referrer,
    signup_landing_page,
    signup_utm_source,
    signup_utm_medium,
    signup_utm_campaign,
    signup_country_code,
    signup_region,
    signup_city,
    signup_postal_code,
    signup_timezone,
    email_verified_at,
    updated_at
  ) VALUES (
    p_user_id,
    now(),
    p_tracking_data->>'ip_address',
    p_tracking_data->>'user_agent',
    p_tracking_data->>'device_fingerprint',
    p_tracking_data->>'referrer',
    p_tracking_data->>'landing_page',
    p_tracking_data->>'utm_source',
    p_tracking_data->>'utm_medium',
    p_tracking_data->>'utm_campaign',
    p_tracking_data->>'country',
    p_tracking_data->>'region',
    p_tracking_data->>'city',
    p_tracking_data->>'postal_code',
    p_tracking_data->>'timezone',
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    signup_completed_at = COALESCE(user_profiles.signup_completed_at, now()),
    signup_ip_address = COALESCE(user_profiles.signup_ip_address, EXCLUDED.signup_ip_address),
    signup_user_agent = COALESCE(user_profiles.signup_user_agent, EXCLUDED.signup_user_agent),
    signup_device_fingerprint = COALESCE(user_profiles.signup_device_fingerprint, EXCLUDED.signup_device_fingerprint),
    signup_referrer = COALESCE(user_profiles.signup_referrer, EXCLUDED.signup_referrer),
    signup_landing_page = COALESCE(user_profiles.signup_landing_page, EXCLUDED.signup_landing_page),
    signup_utm_source = COALESCE(user_profiles.signup_utm_source, EXCLUDED.signup_utm_source),
    signup_utm_medium = COALESCE(user_profiles.signup_utm_medium, EXCLUDED.signup_utm_medium),
    signup_utm_campaign = COALESCE(user_profiles.signup_utm_campaign, EXCLUDED.signup_utm_campaign),
    signup_country_code = COALESCE(user_profiles.signup_country_code, EXCLUDED.signup_country_code),
    signup_region = COALESCE(user_profiles.signup_region, EXCLUDED.signup_region),
    signup_city = COALESCE(user_profiles.signup_city, EXCLUDED.signup_city),
    signup_postal_code = COALESCE(user_profiles.signup_postal_code, EXCLUDED.signup_postal_code),
    signup_timezone = COALESCE(user_profiles.signup_timezone, EXCLUDED.signup_timezone),
    email_verified_at = COALESCE(user_profiles.email_verified_at, now()),
    updated_at = now();
  
  -- Also create marketing attribution record if not exists
  INSERT INTO public.marketing_attribution (
    user_id,
    first_touch_source,
    first_touch_medium,
    first_touch_campaign,
    first_touch_date,
    first_touch_landing_page,
    conversion_source,
    conversion_medium,
    conversion_campaign,
    conversion_date,
    conversion_landing_page
  ) VALUES (
    p_user_id,
    p_tracking_data->>'utm_source',
    p_tracking_data->>'utm_medium',
    p_tracking_data->>'utm_campaign',
    now(),
    p_tracking_data->>'landing_page',
    p_tracking_data->>'utm_source',
    p_tracking_data->>'utm_medium',
    p_tracking_data->>'utm_campaign',
    now(),
    p_tracking_data->>'landing_page'
  )
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_signup_completed ON public.user_profiles(signup_completed_at);

-- Update the update_user_preference function to handle all consent types
CREATE OR REPLACE FUNCTION update_user_preference(
  p_user_id uuid,
  p_preference_name text,
  p_preference_value boolean,
  p_ip_address text
) RETURNS void AS $$
DECLARE
  v_old_value boolean;
  v_consent_type text;
BEGIN
  -- Map preference names to consent types
  CASE p_preference_name
    WHEN 'gdpr_consent' THEN v_consent_type := 'gdpr_consent';
    WHEN 'marketing_emails' THEN v_consent_type := 'marketing_consent';
    WHEN 'data_processing_consent' THEN v_consent_type := 'data_processing_consent';
    WHEN 'ai_processing_consent' THEN v_consent_type := 'ai_processing_consent';
    ELSE v_consent_type := p_preference_name;
  END CASE;
  
  -- Get old value
  EXECUTE format('SELECT %I FROM public.user_preferences WHERE user_id = $1', p_preference_name)
  INTO v_old_value
  USING p_user_id;
  
  -- Update preference
  EXECUTE format('UPDATE public.user_preferences SET %I = $1, %I = $2, updated_at = now() WHERE user_id = $3',
    p_preference_name,
    CASE 
      WHEN p_preference_name LIKE '%_consent' THEN p_preference_name || '_date'
      ELSE 'updated_at'
    END
  )
  USING p_preference_value, 
    CASE WHEN p_preference_value THEN now() ELSE NULL END,
    p_user_id;
  
  -- Log consent change if value changed
  IF v_old_value IS DISTINCT FROM p_preference_value THEN
    INSERT INTO public.consent_audit_log (
      user_id,
      consent_type,
      action,
      old_value,
      new_value,
      ip_address,
      method
    ) VALUES (
      p_user_id,
      v_consent_type,
      CASE 
        WHEN p_preference_value THEN 'granted'
        WHEN NOT p_preference_value AND v_old_value THEN 'withdrawn'
        ELSE 'updated'
      END,
      to_jsonb(v_old_value),
      to_jsonb(p_preference_value),
      p_ip_address,
      'user_settings'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
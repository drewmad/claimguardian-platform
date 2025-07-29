-- Apply only the missing tables and functions

-- Create marketing_attribution table
CREATE TABLE IF NOT EXISTS public.marketing_attribution (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  first_touch_source text,
  first_touch_medium text,
  first_touch_campaign text,
  first_touch_date timestamptz,
  first_touch_landing_page text,
  last_touch_source text,
  last_touch_medium text,
  last_touch_campaign text,
  last_touch_date timestamptz,
  last_touch_landing_page text,
  conversion_source text,
  conversion_medium text,
  conversion_campaign text,
  conversion_date timestamptz,
  conversion_landing_page text,
  multi_touch_points jsonb DEFAULT '[]',
  total_touches integer DEFAULT 0,
  days_to_conversion integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email text,
  first_name text,
  last_name text,
  phone text,
  signup_completed_at timestamptz,
  signup_source text,
  signup_ip_address text,
  signup_user_agent text,
  signup_device_type text,
  signup_device_fingerprint text,
  signup_referrer text,
  signup_landing_page text,
  signup_utm_source text,
  signup_utm_medium text,
  signup_utm_campaign text,
  signup_utm_term text,
  signup_utm_content text,
  signup_country_code text,
  signup_region text,
  signup_city text,
  signup_postal_code text,
  signup_timezone text,
  account_status text DEFAULT 'active',
  account_type text DEFAULT 'free',
  risk_score numeric DEFAULT 0,
  trust_level text DEFAULT 'new',
  last_login_at timestamptz,
  last_login_ip text,
  login_count integer DEFAULT 0,
  failed_login_count integer DEFAULT 0,
  last_failed_login_at timestamptz,
  password_changed_at timestamptz,
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  two_factor_enabled boolean DEFAULT false,
  two_factor_method text,
  preferences jsonb DEFAULT '{}',
  tags text[] DEFAULT '{}',
  notes text,
  internal_notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own attribution" ON public.marketing_attribution
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketing_attribution_user_id ON public.marketing_attribution(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Helper function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_marketing_attribution_updated_at
  BEFORE UPDATE ON public.marketing_attribution
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create the capture_signup_data function
CREATE OR REPLACE FUNCTION capture_signup_data(
  p_user_id uuid,
  p_tracking_data jsonb
) RETURNS void AS $$
BEGIN
  -- Insert or update user profile
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
    email_verified_at
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
  
  -- Create marketing attribution
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

-- Create the update_user_preference function
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
  
  -- Log consent change
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
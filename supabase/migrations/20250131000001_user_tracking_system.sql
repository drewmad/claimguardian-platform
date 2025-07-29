-- Comprehensive User Tracking System
-- This migration creates all tables and functions for user tracking and consent management

-- =====================================================
-- 1. USER TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_tracking (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  session_id text,
  ip_address text,
  user_agent text,
  device_type text,
  device_fingerprint text,
  browser_name text,
  browser_version text,
  os_name text,
  os_version text,
  screen_resolution text,
  viewport_size text,
  color_depth integer,
  timezone text,
  language text,
  platform text,
  memory integer,
  cores integer,
  country_code text,
  region text,
  city text,
  postal_code text,
  latitude numeric,
  longitude numeric,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  page_url text,
  referrer_url text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 2. USER PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme text DEFAULT 'system',
  language text DEFAULT 'en',
  timezone text DEFAULT 'America/New_York',
  date_format text DEFAULT 'MM/DD/YYYY',
  currency text DEFAULT 'USD',
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT false,
  sms_notifications boolean DEFAULT false,
  marketing_emails boolean DEFAULT false,
  weekly_digest boolean DEFAULT true,
  claim_updates boolean DEFAULT true,
  deadline_reminders boolean DEFAULT true,
  newsletter boolean DEFAULT false,
  gdpr_consent boolean DEFAULT false,
  gdpr_consent_date timestamptz,
  ccpa_consent boolean DEFAULT false,
  ccpa_consent_date timestamptz,
  data_processing_consent boolean DEFAULT false,
  data_processing_consent_date timestamptz,
  ai_processing_consent boolean DEFAULT false,
  ai_processing_consent_date timestamptz,
  consent_version text,
  onboarding_completed boolean DEFAULT false,
  onboarding_skipped_at timestamptz,
  feature_tips_enabled boolean DEFAULT true,
  accessibility_mode boolean DEFAULT false,
  high_contrast boolean DEFAULT false,
  reduce_motion boolean DEFAULT false,
  screen_reader_mode boolean DEFAULT false,
  font_size text DEFAULT 'medium',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 3. USER SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  ip_address text,
  user_agent text,
  device_fingerprint text,
  device_type text,
  browser text,
  os text,
  country_code text,
  region text,
  city text,
  created_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  logout_at timestamptz,
  logout_reason text,
  activity_count integer DEFAULT 0,
  pages_viewed text[] DEFAULT '{}',
  features_used text[] DEFAULT '{}',
  total_duration interval,
  metadata jsonb DEFAULT '{}'
);

-- =====================================================
-- 4. MARKETING ATTRIBUTION TABLE
-- =====================================================
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

-- =====================================================
-- 5. USER DEVICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_devices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  device_name text,
  device_type text,
  operating_system text,
  os_version text,
  browser text,
  browser_version text,
  screen_resolution text,
  hardware_info jsonb DEFAULT '{}',
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  last_ip_address text,
  last_location jsonb DEFAULT '{}',
  login_count integer DEFAULT 1,
  is_trusted boolean DEFAULT false,
  is_blocked boolean DEFAULT false,
  push_token text,
  metadata jsonb DEFAULT '{}'
);

-- =====================================================
-- 6. CONSENT AUDIT LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS public.consent_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  action text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  consent_version text,
  ip_address text,
  user_agent text,
  method text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 7. ENHANCE USER PROFILES TABLE
-- =====================================================
-- First ensure the table exists
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

-- Add comprehensive tracking columns
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

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_tracking_user_id ON public.user_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tracking_event_type ON public.user_tracking(event_type);
CREATE INDEX IF NOT EXISTS idx_user_tracking_created_at ON public.user_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_tracking_session_id ON public.user_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_marketing_attribution_user_id ON public.marketing_attribution(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint ON public.user_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_consent_audit_user_id ON public.consent_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_type ON public.consent_audit_log(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_signup_completed ON public.user_profiles(signup_completed_at);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.user_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================
-- User tracking policies
DROP POLICY IF EXISTS "Users can view own tracking data" ON public.user_tracking;
CREATE POLICY "Users can view own tracking data" ON public.user_tracking
  FOR SELECT USING (auth.uid() = user_id);

-- User preferences policies
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);
  
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);
  
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User sessions policies
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Marketing attribution policies
DROP POLICY IF EXISTS "Users can view own attribution" ON public.marketing_attribution;
CREATE POLICY "Users can view own attribution" ON public.marketing_attribution
  FOR SELECT USING (auth.uid() = user_id);

-- User devices policies
DROP POLICY IF EXISTS "Users can view own devices" ON public.user_devices;
CREATE POLICY "Users can view own devices" ON public.user_devices
  FOR SELECT USING (auth.uid() = user_id);
  
DROP POLICY IF EXISTS "Users can update own devices" ON public.user_devices;
CREATE POLICY "Users can update own devices" ON public.user_devices
  FOR UPDATE USING (auth.uid() = user_id);

-- Consent audit policies
DROP POLICY IF EXISTS "Users can view own consent history" ON public.consent_audit_log;
CREATE POLICY "Users can view own consent history" ON public.consent_audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- User profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================
-- Trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketing_attribution_updated_at ON public.marketing_attribution;
CREATE TRIGGER update_marketing_attribution_updated_at
  BEFORE UPDATE ON public.marketing_attribution
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CAPTURE SIGNUP DATA FUNCTION
-- =====================================================
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

-- =====================================================
-- UPDATE USER PREFERENCE FUNCTION
-- =====================================================
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
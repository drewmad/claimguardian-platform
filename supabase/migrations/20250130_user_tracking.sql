-- Create user tracking table for comprehensive user analytics
CREATE TABLE IF NOT EXISTS public.user_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session information
  session_id text NOT NULL,
  
  -- IP and location data
  ip_address inet,
  ip_country text,
  ip_region text,
  ip_city text,
  ip_timezone text,
  
  -- Device information
  user_agent text,
  device_type text,
  device_name text,
  browser_name text,
  browser_version text,
  os_name text,
  os_version text,
  
  -- Referral information
  referrer_url text,
  referrer_domain text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  
  -- User behavior
  landing_page text,
  login_method text, -- 'email', 'google', 'magic_link', etc.
  is_first_login boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_user_tracking_user_id ON public.user_tracking(user_id);
CREATE INDEX idx_user_tracking_session_id ON public.user_tracking(session_id);
CREATE INDEX idx_user_tracking_created_at ON public.user_tracking(created_at);
CREATE INDEX idx_user_tracking_ip_address ON public.user_tracking(ip_address);

-- Create user preferences table for onboarding state
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Onboarding state
  onboarding_completed boolean DEFAULT false,
  onboarding_current_step text,
  onboarding_skipped_at timestamptz,
  
  -- Property setup
  has_primary_property boolean DEFAULT false,
  property_setup_completed boolean DEFAULT false,
  
  -- Insurance setup
  has_insurance_policy boolean DEFAULT false,
  insurance_setup_completed boolean DEFAULT false,
  
  -- Feature preferences
  preferred_theme text DEFAULT 'dark',
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  push_notifications boolean DEFAULT true,
  
  -- AI preferences
  ai_features_enabled boolean DEFAULT true,
  preferred_ai_model text DEFAULT 'openai',
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for user preferences
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Create user activity log table
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  
  -- Activity details
  activity_type text NOT NULL, -- 'page_view', 'feature_use', 'button_click', etc.
  activity_name text NOT NULL,
  activity_category text,
  activity_value jsonb,
  
  -- Context
  page_url text,
  page_title text,
  
  -- Timestamp
  created_at timestamptz DEFAULT now()
);

-- Create indexes for activity log
CREATE INDEX idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_session_id ON public.user_activity_log(session_id);
CREATE INDEX idx_user_activity_log_activity_type ON public.user_activity_log(activity_type);
CREATE INDEX idx_user_activity_log_created_at ON public.user_activity_log(created_at);

-- RLS Policies
ALTER TABLE public.user_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- User tracking policies (users can only see their own data)
CREATE POLICY "Users can view their own tracking data"
  ON public.user_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User activity log policies
CREATE POLICY "Users can view their own activity"
  ON public.user_activity_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
  ON public.user_activity_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to track user login
CREATE OR REPLACE FUNCTION public.track_user_login(
  p_user_id uuid,
  p_session_id text,
  p_ip_address inet,
  p_user_agent text,
  p_referrer_url text DEFAULT NULL,
  p_utm_source text DEFAULT NULL,
  p_utm_medium text DEFAULT NULL,
  p_utm_campaign text DEFAULT NULL,
  p_login_method text DEFAULT 'email'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tracking_id uuid;
  v_is_first_login boolean;
BEGIN
  -- Check if this is user's first login
  SELECT NOT EXISTS(
    SELECT 1 FROM public.user_tracking 
    WHERE user_id = p_user_id
  ) INTO v_is_first_login;
  
  -- Insert tracking record
  INSERT INTO public.user_tracking (
    user_id,
    session_id,
    ip_address,
    user_agent,
    referrer_url,
    utm_source,
    utm_medium,
    utm_campaign,
    login_method,
    is_first_login
  ) VALUES (
    p_user_id,
    p_session_id,
    p_ip_address,
    p_user_agent,
    p_referrer_url,
    p_utm_source,
    p_utm_medium,
    p_utm_campaign,
    p_login_method,
    v_is_first_login
  )
  RETURNING id INTO v_tracking_id;
  
  -- Create user preferences if first login
  IF v_is_first_login THEN
    INSERT INTO public.user_preferences (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN v_tracking_id;
END;
$$;

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id uuid,
  p_session_id text,
  p_activity_type text,
  p_activity_name text,
  p_activity_category text DEFAULT NULL,
  p_activity_value jsonb DEFAULT NULL,
  p_page_url text DEFAULT NULL,
  p_page_title text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id uuid;
BEGIN
  INSERT INTO public.user_activity_log (
    user_id,
    session_id,
    activity_type,
    activity_name,
    activity_category,
    activity_value,
    page_url,
    page_title
  ) VALUES (
    p_user_id,
    p_session_id,
    p_activity_type,
    p_activity_name,
    p_activity_category,
    p_activity_value,
    p_page_url,
    p_page_title
  )
  RETURNING id INTO v_activity_id;
  
  -- Update last activity timestamp in tracking table
  UPDATE public.user_tracking
  SET last_activity_at = now()
  WHERE user_id = p_user_id AND session_id = p_session_id;
  
  RETURN v_activity_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.track_user_login TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_activity TO authenticated;

-- Grant table permissions
GRANT SELECT ON public.user_tracking TO authenticated;
GRANT ALL ON public.user_preferences TO authenticated;
GRANT INSERT, SELECT ON public.user_activity_log TO authenticated;
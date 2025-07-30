-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Signup tracking fields
    signup_ip_address TEXT,
    signup_user_agent TEXT,
    signup_device_fingerprint TEXT,
    signup_referrer TEXT,
    signup_landing_page TEXT,
    signup_utm_source TEXT,
    signup_utm_medium TEXT,
    signup_utm_campaign TEXT,
    signup_country TEXT,
    signup_region TEXT,
    signup_city TEXT,
    signup_postal_code TEXT,
    signup_timezone TEXT,
    signup_latitude FLOAT,
    signup_longitude FLOAT,
    signup_timestamp TIMESTAMPTZ
);

-- Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Consent fields
    gdpr_consent BOOLEAN DEFAULT FALSE,
    gdpr_consent_date TIMESTAMPTZ,
    marketing_emails BOOLEAN DEFAULT FALSE,
    data_processing_consent BOOLEAN DEFAULT FALSE,
    data_processing_consent_date TIMESTAMPTZ,
    ai_processing_consent BOOLEAN DEFAULT FALSE,
    ai_processing_consent_date TIMESTAMPTZ,
    
    -- Other preferences
    timezone TEXT
);

-- Create consent_audit_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS consent_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    action TEXT NOT NULL,
    old_value BOOLEAN,
    new_value BOOLEAN,
    ip_address TEXT,
    user_agent TEXT,
    method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the capture_signup_data function
CREATE OR REPLACE FUNCTION capture_signup_data(
    p_user_id UUID,
    p_tracking_data JSONB
) RETURNS VOID AS $$
BEGIN
    -- Insert or update user profile with signup tracking data
    INSERT INTO user_profiles (
        user_id,
        signup_ip_address,
        signup_user_agent,
        signup_device_fingerprint,
        signup_referrer,
        signup_landing_page,
        signup_utm_source,
        signup_utm_medium,
        signup_utm_campaign,
        signup_country,
        signup_region,
        signup_city,
        signup_postal_code,
        signup_timezone,
        signup_latitude,
        signup_longitude,
        signup_timestamp
    ) VALUES (
        p_user_id,
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
        (p_tracking_data->>'latitude')::FLOAT,
        (p_tracking_data->>'longitude')::FLOAT,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        signup_ip_address = EXCLUDED.signup_ip_address,
        signup_user_agent = EXCLUDED.signup_user_agent,
        signup_device_fingerprint = EXCLUDED.signup_device_fingerprint,
        signup_referrer = EXCLUDED.signup_referrer,
        signup_landing_page = EXCLUDED.signup_landing_page,
        signup_utm_source = EXCLUDED.signup_utm_source,
        signup_utm_medium = EXCLUDED.signup_utm_medium,
        signup_utm_campaign = EXCLUDED.signup_utm_campaign,
        signup_country = EXCLUDED.signup_country,
        signup_region = EXCLUDED.signup_region,
        signup_city = EXCLUDED.signup_city,
        signup_postal_code = EXCLUDED.signup_postal_code,
        signup_timezone = EXCLUDED.signup_timezone,
        signup_latitude = EXCLUDED.signup_latitude,
        signup_longitude = EXCLUDED.signup_longitude,
        signup_timestamp = EXCLUDED.signup_timestamp,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- User profiles: users can only see their own
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- User preferences: users can only see and update their own
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Consent audit log: users can only see their own
CREATE POLICY "Users can view own consent history" ON consent_audit_log
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert consent logs
CREATE POLICY "Service role can insert consent logs" ON consent_audit_log
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_preferences TO authenticated;
GRANT ALL ON consent_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION capture_signup_data TO authenticated;
GRANT EXECUTE ON FUNCTION capture_signup_data TO anon;
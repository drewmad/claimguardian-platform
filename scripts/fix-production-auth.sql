-- Fix Production Auth Issues - Apply Missing Functions and Tables
-- This script combines all necessary fixes for production

-- 1. Create user_profiles table if it doesn't exist
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

-- 2. Create user_preferences table if it doesn't exist
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

-- 3. Create consent_audit_log table if it doesn't exist
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

-- 4. Create login_activity table if it doesn't exist
CREATE TABLE IF NOT EXISTS login_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    login_timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    device_fingerprint TEXT,
    is_successful BOOLEAN DEFAULT TRUE,
    failure_reason TEXT,
    country TEXT,
    region TEXT,
    city TEXT,
    postal_code TEXT,
    timezone TEXT,
    latitude FLOAT,
    longitude FLOAT
);

-- 5. Create the capture_signup_data function
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

-- 6. Create the log_login_activity function
CREATE OR REPLACE FUNCTION log_login_activity(
    p_user_id UUID,
    p_tracking_data JSONB
) RETURNS VOID AS $$
BEGIN
    INSERT INTO login_activity (
        user_id,
        ip_address,
        user_agent,
        device_fingerprint,
        is_successful,
        failure_reason,
        country,
        region,
        city,
        postal_code,
        timezone,
        latitude,
        longitude
    ) VALUES (
        p_user_id,
        p_tracking_data->>'ip_address',
        p_tracking_data->>'user_agent',
        p_tracking_data->>'device_fingerprint',
        COALESCE((p_tracking_data->>'is_successful')::BOOLEAN, TRUE),
        p_tracking_data->>'failure_reason',
        p_tracking_data->>'country',
        p_tracking_data->>'region',
        p_tracking_data->>'city',
        p_tracking_data->>'postal_code',
        p_tracking_data->>'timezone',
        (p_tracking_data->>'latitude')::FLOAT,
        (p_tracking_data->>'longitude')::FLOAT
    );
END;
$$ LANGUAGE plpgsql;

-- 7. Enable Row Level Security (safe to run multiple times)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_activity ENABLE ROW LEVEL SECURITY;

-- 8. Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
    -- Drop existing policies for user_profiles
    DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
    
    -- Drop existing policies for user_preferences
    DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
    DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
    DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
    
    -- Drop existing policies for consent_audit_log
    DROP POLICY IF EXISTS "Users can view own consent history" ON consent_audit_log;
    DROP POLICY IF EXISTS "Service role can insert consent logs" ON consent_audit_log;
    
    -- Drop existing policies for login_activity
    DROP POLICY IF EXISTS "Users can view own login history" ON login_activity;
    DROP POLICY IF EXISTS "Service role can insert login activity" ON login_activity;
END $$;

-- 9. Create RLS policies
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

-- Login activity: users can only see their own
CREATE POLICY "Users can view own login history" ON login_activity
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert login activity
CREATE POLICY "Service role can insert login activity" ON login_activity
    FOR INSERT WITH CHECK (true);

-- 10. Grant permissions (safe to run multiple times)
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_preferences TO authenticated;
GRANT ALL ON consent_audit_log TO authenticated;
GRANT ALL ON login_activity TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION capture_signup_data TO authenticated;
GRANT EXECUTE ON FUNCTION capture_signup_data TO anon;
GRANT EXECUTE ON FUNCTION log_login_activity TO authenticated;
GRANT EXECUTE ON FUNCTION log_login_activity TO anon;

-- 11. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_log_user_id ON consent_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_login_activity_user_id ON login_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_login_activity_timestamp ON login_activity(login_timestamp DESC);
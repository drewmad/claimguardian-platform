-- Comprehensive User Tracking and Preferences Implementation
-- This migration adds all missing tables for complete user data capture

-- =====================================================
-- 1. USER TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Session Information
    session_id VARCHAR(255),
    session_start TIMESTAMPTZ,
    
    -- Event Data
    event_data JSONB DEFAULT '{}',
    page_url TEXT,
    referrer_url TEXT,
    
    -- Device Information
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(20), -- mobile, tablet, desktop
    device_fingerprint VARCHAR(255),
    browser_name VARCHAR(50),
    browser_version VARCHAR(20),
    os_name VARCHAR(50),
    os_version VARCHAR(20),
    screen_resolution VARCHAR(20),
    viewport_size VARCHAR(20),
    
    -- Geographic Information
    country_code CHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    timezone VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- UTM Parameters
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    
    -- Performance Metrics
    page_load_time INTEGER, -- milliseconds
    time_on_page INTEGER, -- seconds
    
    -- Indexes for performance
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user_tracking
CREATE INDEX idx_user_tracking_user_id ON user_tracking(user_id);
CREATE INDEX idx_user_tracking_event_type ON user_tracking(event_type);
CREATE INDEX idx_user_tracking_session_id ON user_tracking(session_id);
CREATE INDEX idx_user_tracking_created_at ON user_tracking(created_at DESC);
CREATE INDEX idx_user_tracking_device_fingerprint ON user_tracking(device_fingerprint);
CREATE INDEX idx_user_tracking_ip_address ON user_tracking(ip_address);

-- =====================================================
-- 2. USER PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Communication Preferences
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT false,
    marketing_emails BOOLEAN DEFAULT false,
    product_updates BOOLEAN DEFAULT true,
    newsletter BOOLEAN DEFAULT false,
    
    -- Privacy Preferences
    gdpr_consent BOOLEAN DEFAULT false,
    gdpr_consent_date TIMESTAMPTZ,
    ccpa_consent BOOLEAN DEFAULT false,
    ccpa_consent_date TIMESTAMPTZ,
    data_processing_consent BOOLEAN DEFAULT false,
    data_processing_consent_date TIMESTAMPTZ,
    ai_processing_consent BOOLEAN DEFAULT false,
    ai_processing_consent_date TIMESTAMPTZ,
    
    -- Display Preferences
    theme VARCHAR(20) DEFAULT 'system', -- light, dark, system
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50),
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Feature Preferences
    enable_ai_features BOOLEAN DEFAULT true,
    enable_automation BOOLEAN DEFAULT true,
    enable_notifications BOOLEAN DEFAULT true,
    enable_location_services BOOLEAN DEFAULT false,
    
    -- Consent History (array of consent changes)
    consent_history JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user_preferences
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_gdpr_consent ON user_preferences(gdpr_consent) WHERE gdpr_consent = true;
CREATE INDEX idx_user_preferences_marketing ON user_preferences(marketing_emails) WHERE marketing_emails = true;

-- =====================================================
-- 3. SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Session Details
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Session Context
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- Session Data
    data JSONB DEFAULT '{}',
    
    -- Security
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT
);

-- Create indexes for sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- =====================================================
-- 4. ENHANCE USER_PROFILES TABLE
-- =====================================================
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS signup_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS signup_completed_at TIMESTAMPTZ,

-- Signup tracking data
ADD COLUMN IF NOT EXISTS signup_ip_address INET,
ADD COLUMN IF NOT EXISTS signup_user_agent TEXT,
ADD COLUMN IF NOT EXISTS signup_device_fingerprint VARCHAR(255),
ADD COLUMN IF NOT EXISTS signup_referrer TEXT,
ADD COLUMN IF NOT EXISTS signup_landing_page TEXT,
ADD COLUMN IF NOT EXISTS signup_utm_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS signup_utm_medium VARCHAR(100),
ADD COLUMN IF NOT EXISTS signup_utm_campaign VARCHAR(100),

-- Geographic data
ADD COLUMN IF NOT EXISTS signup_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS signup_region VARCHAR(100),
ADD COLUMN IF NOT EXISTS signup_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS signup_postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS signup_timezone VARCHAR(50),
ADD COLUMN IF NOT EXISTS signup_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS signup_longitude DECIMAL(11, 8),

-- Risk and compliance
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS fraud_flags JSONB DEFAULT '[]',

-- Marketing attribution
ADD COLUMN IF NOT EXISTS acquisition_channel VARCHAR(50),
ADD COLUMN IF NOT EXISTS acquisition_date DATE,
ADD COLUMN IF NOT EXISTS conversion_date DATE,
ADD COLUMN IF NOT EXISTS ab_test_variants JSONB DEFAULT '{}',

-- Florida-specific
ADD COLUMN IF NOT EXISTS state VARCHAR(2) DEFAULT 'FL',
ADD COLUMN IF NOT EXISTS county VARCHAR(100),
ADD COLUMN IF NOT EXISTS hurricane_zone VARCHAR(10),
ADD COLUMN IF NOT EXISTS flood_zone VARCHAR(10),

-- Metadata
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_signup_ip ON user_profiles(signup_ip_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_device_fingerprint ON user_profiles(signup_device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_profiles_state_county ON user_profiles(state, county);

-- =====================================================
-- 5. MARKETING ATTRIBUTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS marketing_attribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Attribution Data
    first_touch_date TIMESTAMPTZ,
    first_touch_source VARCHAR(100),
    first_touch_medium VARCHAR(100),
    first_touch_campaign VARCHAR(100),
    
    last_touch_date TIMESTAMPTZ,
    last_touch_source VARCHAR(100),
    last_touch_medium VARCHAR(100),
    last_touch_campaign VARCHAR(100),
    
    -- Conversion Data
    conversion_date TIMESTAMPTZ,
    conversion_source VARCHAR(100),
    conversion_value DECIMAL(10, 2),
    
    -- Attribution Model Scores
    attribution_scores JSONB DEFAULT '{}',
    
    -- Journey Data
    touchpoints JSONB DEFAULT '[]',
    total_touchpoints INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketing_attribution_user_id ON marketing_attribution(user_id);
CREATE INDEX idx_marketing_attribution_conversion_date ON marketing_attribution(conversion_date);

-- =====================================================
-- 6. DEVICE REGISTRY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(255) NOT NULL,
    
    -- Device Info
    device_name VARCHAR(100),
    device_type VARCHAR(20),
    manufacturer VARCHAR(50),
    model VARCHAR(50),
    
    -- Software Info
    os_name VARCHAR(50),
    os_version VARCHAR(20),
    browser_name VARCHAR(50),
    browser_version VARCHAR(20),
    
    -- Usage Data
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    trust_score INTEGER DEFAULT 50,
    is_trusted BOOLEAN DEFAULT false,
    
    -- Security
    is_blocked BOOLEAN DEFAULT false,
    blocked_reason TEXT,
    
    UNIQUE(user_id, device_fingerprint)
);

CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_user_devices_fingerprint ON user_devices(device_fingerprint);

-- =====================================================
-- 7. CONSENT AUDIT LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS consent_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Consent Details
    consent_type VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL, -- granted, revoked, updated
    previous_value BOOLEAN,
    new_value BOOLEAN,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    page_url TEXT,
    method VARCHAR(50), -- checkbox, api, import, admin
    
    -- Legal Document Reference
    legal_document_id UUID REFERENCES legal_documents(id),
    legal_document_version VARCHAR(20),
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consent_audit_user_id ON consent_audit_log(user_id);
CREATE INDEX idx_consent_audit_created_at ON consent_audit_log(created_at DESC);
CREATE INDEX idx_consent_audit_type ON consent_audit_log(consent_type);

-- =====================================================
-- 8. CREATE FUNCTIONS FOR DATA CAPTURE
-- =====================================================

-- Function to track user events
CREATE OR REPLACE FUNCTION track_user_event(
    p_user_id UUID,
    p_event_type VARCHAR(50),
    p_event_data JSONB DEFAULT '{}',
    p_session_id VARCHAR(255) DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_tracking_id UUID;
BEGIN
    INSERT INTO user_tracking (
        user_id,
        event_type,
        event_data,
        session_id,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_event_type,
        p_event_data,
        p_session_id,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO v_tracking_id;
    
    RETURN v_tracking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user preferences
CREATE OR REPLACE FUNCTION update_user_preference(
    p_user_id UUID,
    p_preference_name TEXT,
    p_preference_value BOOLEAN,
    p_ip_address INET DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_old_value BOOLEAN;
BEGIN
    -- Get current value
    EXECUTE format('SELECT %I FROM user_preferences WHERE user_id = $1', p_preference_name)
    INTO v_old_value
    USING p_user_id;
    
    -- Update preference
    EXECUTE format('UPDATE user_preferences SET %I = $1, updated_at = NOW() WHERE user_id = $2', p_preference_name)
    USING p_preference_value, p_user_id;
    
    -- Log consent change if it's a consent field
    IF p_preference_name LIKE '%_consent' THEN
        INSERT INTO consent_audit_log (
            user_id,
            consent_type,
            action,
            previous_value,
            new_value,
            ip_address,
            method
        ) VALUES (
            p_user_id,
            p_preference_name,
            CASE WHEN p_preference_value THEN 'granted' ELSE 'revoked' END,
            v_old_value,
            p_preference_value,
            p_ip_address,
            'user_update'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to capture comprehensive signup data
CREATE OR REPLACE FUNCTION capture_signup_data(
    p_user_id UUID,
    p_tracking_data JSONB
) RETURNS VOID AS $$
BEGIN
    -- Update user profile with signup tracking data
    UPDATE user_profiles SET
        signup_ip_address = (p_tracking_data->>'ip_address')::INET,
        signup_user_agent = p_tracking_data->>'user_agent',
        signup_device_fingerprint = p_tracking_data->>'device_fingerprint',
        signup_referrer = p_tracking_data->>'referrer',
        signup_landing_page = p_tracking_data->>'landing_page',
        signup_utm_source = p_tracking_data->>'utm_source',
        signup_utm_medium = p_tracking_data->>'utm_medium',
        signup_utm_campaign = p_tracking_data->>'utm_campaign',
        signup_country = p_tracking_data->>'country',
        signup_region = p_tracking_data->>'region',
        signup_city = p_tracking_data->>'city',
        signup_postal_code = p_tracking_data->>'postal_code',
        signup_timezone = p_tracking_data->>'timezone',
        signup_latitude = (p_tracking_data->>'latitude')::DECIMAL,
        signup_longitude = (p_tracking_data->>'longitude')::DECIMAL,
        signup_completed = true,
        signup_completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Create initial preferences record
    INSERT INTO user_preferences (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Track signup event
    INSERT INTO user_tracking (
        user_id,
        event_type,
        event_data,
        ip_address,
        user_agent,
        device_fingerprint,
        utm_source,
        utm_medium,
        utm_campaign,
        referrer_url
    ) VALUES (
        p_user_id,
        'signup_completed',
        p_tracking_data,
        (p_tracking_data->>'ip_address')::INET,
        p_tracking_data->>'user_agent',
        p_tracking_data->>'device_fingerprint',
        p_tracking_data->>'utm_source',
        p_tracking_data->>'utm_medium',
        p_tracking_data->>'utm_campaign',
        p_tracking_data->>'referrer'
    );
    
    -- Create marketing attribution record
    INSERT INTO marketing_attribution (
        user_id,
        first_touch_date,
        first_touch_source,
        first_touch_medium,
        first_touch_campaign,
        conversion_date,
        conversion_source
    ) VALUES (
        p_user_id,
        NOW(),
        COALESCE(p_tracking_data->>'utm_source', 'direct'),
        p_tracking_data->>'utm_medium',
        p_tracking_data->>'utm_campaign',
        NOW(),
        COALESCE(p_tracking_data->>'utm_source', 'direct')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. CREATE TRIGGERS
-- =====================================================

-- Trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_marketing_attribution_updated_at
BEFORE UPDATE ON marketing_attribution
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 10. ROW LEVEL SECURITY
-- =====================================================

-- User tracking - users can only see their own data
ALTER TABLE user_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tracking data"
ON user_tracking FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert tracking data"
ON user_tracking FOR INSERT
WITH CHECK (true);

-- User preferences - users can view and update their own
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
ON user_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON user_preferences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Sessions - users can only see their own
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
ON user_sessions FOR SELECT
USING (auth.uid() = user_id);

-- Marketing attribution - users can see their own
ALTER TABLE marketing_attribution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attribution"
ON marketing_attribution FOR SELECT
USING (auth.uid() = user_id);

-- Device registry - users can see their own devices
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices"
ON user_devices FOR SELECT
USING (auth.uid() = user_id);

-- Consent audit log - users can see their own history
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent history"
ON consent_audit_log FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- 11. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to roles
GRANT ALL ON user_tracking TO authenticated;
GRANT ALL ON user_preferences TO authenticated;
GRANT ALL ON user_sessions TO authenticated;
GRANT ALL ON marketing_attribution TO authenticated;
GRANT ALL ON user_devices TO authenticated;
GRANT ALL ON consent_audit_log TO authenticated;

GRANT SELECT ON user_tracking TO anon;
GRANT SELECT ON user_preferences TO anon;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION track_user_event TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_preference TO authenticated;
GRANT EXECUTE ON FUNCTION capture_signup_data TO authenticated;

-- =====================================================
-- 12. CREATE HELPER VIEWS
-- =====================================================

-- View for user consent status
CREATE OR REPLACE VIEW user_consent_status AS
SELECT 
    up.user_id,
    up.gdpr_consent,
    up.gdpr_consent_date,
    up.ccpa_consent,
    up.ccpa_consent_date,
    up.marketing_emails,
    up.data_processing_consent,
    up.ai_processing_consent,
    COUNT(DISTINCT ula.legal_id) as accepted_documents,
    MAX(ula.accepted_at) as last_acceptance_date
FROM user_preferences up
LEFT JOIN user_legal_acceptance ula ON up.user_id = ula.user_id
GROUP BY up.user_id, up.gdpr_consent, up.gdpr_consent_date, 
         up.ccpa_consent, up.ccpa_consent_date, up.marketing_emails,
         up.data_processing_consent, up.ai_processing_consent;

-- View for user engagement metrics
CREATE OR REPLACE VIEW user_engagement_metrics AS
SELECT 
    ut.user_id,
    COUNT(DISTINCT DATE(ut.event_timestamp)) as active_days,
    COUNT(DISTINCT ut.session_id) as total_sessions,
    COUNT(*) as total_events,
    MIN(ut.event_timestamp) as first_activity,
    MAX(ut.event_timestamp) as last_activity,
    COUNT(DISTINCT ut.device_fingerprint) as unique_devices
FROM user_tracking ut
WHERE ut.event_timestamp > NOW() - INTERVAL '30 days'
GROUP BY ut.user_id;

GRANT SELECT ON user_consent_status TO authenticated;
GRANT SELECT ON user_engagement_metrics TO authenticated;
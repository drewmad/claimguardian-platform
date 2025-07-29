-- Complete Legal Compliance System with Cascading Rules
-- This migration ensures all tables are properly set up with foreign key constraints and cascading deletes

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geolocation if needed

-- Drop existing constraints to recreate with proper cascading
ALTER TABLE IF EXISTS user_consents DROP CONSTRAINT IF EXISTS user_consents_user_id_fkey;
ALTER TABLE IF EXISTS user_sessions DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;
ALTER TABLE IF EXISTS consent_audit_log DROP CONSTRAINT IF EXISTS consent_audit_log_user_id_fkey;
ALTER TABLE IF EXISTS user_devices DROP CONSTRAINT IF EXISTS user_devices_user_id_fkey;

-- Create enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE legal_document_type AS ENUM (
        'privacy_policy',
        'terms_of_service',
        'ai_use_agreement',
        'cookie_policy',
        'data_processing_agreement'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE consent_action_type AS ENUM (
        'accepted',
        'declined',
        'withdrawn',
        'updated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ensure profiles table exists with all compliance fields
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    
    -- Compliance tracking fields
    signup_ip_address INET,
    signup_user_agent TEXT,
    signup_device_fingerprint VARCHAR(255),
    signup_geolocation JSONB,
    signup_referrer TEXT,
    signup_utm_params JSONB,
    signup_timestamp TIMESTAMPTZ,
    
    -- Consent flags
    gdpr_consent BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,
    data_processing_consent BOOLEAN DEFAULT false,
    last_consent_update TIMESTAMPTZ,
    consent_ip_history JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_signup_ip ON profiles(signup_ip_address);
CREATE INDEX IF NOT EXISTS idx_profiles_device_fingerprint ON profiles(signup_device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active) WHERE is_active = true;

-- Legal documents table (versioned documents)
CREATE TABLE IF NOT EXISTS legal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type legal_document_type NOT NULL,
    version VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    effective_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    requires_acceptance BOOLEAN DEFAULT true,
    parent_version_id UUID REFERENCES legal_documents(id) ON DELETE SET NULL,
    change_summary TEXT,
    storage_url TEXT,
    sha256_hash VARCHAR(64) NOT NULL,
    metadata JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT unique_active_document_type EXCLUDE (type WITH =) WHERE (is_active = true),
    CONSTRAINT unique_document_version UNIQUE (type, version)
);

-- Create indexes for legal documents
CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON legal_documents(type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_active ON legal_documents(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_legal_documents_effective_date ON legal_documents(effective_date);
CREATE INDEX IF NOT EXISTS idx_legal_documents_slug ON legal_documents(slug);
CREATE INDEX IF NOT EXISTS idx_legal_documents_parent ON legal_documents(parent_version_id);

-- User consent records table with cascading delete
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    document_id UUID NOT NULL REFERENCES legal_documents(id) ON DELETE RESTRICT,
    action consent_action_type NOT NULL,
    consented_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    geolocation JSONB,
    session_id VARCHAR(255),
    consent_method VARCHAR(50) NOT NULL,
    is_current BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    
    -- Tracking context
    referrer_url TEXT,
    page_url TEXT,
    consent_flow VARCHAR(50),
    
    -- Foreign key with cascade
    CONSTRAINT user_consents_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE
);

-- Create indexes for user_consents
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_document_id ON user_consents(document_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_consented_at ON user_consents(consented_at);
CREATE INDEX IF NOT EXISTS idx_user_consents_current ON user_consents(user_id, is_current) WHERE is_current = true;

-- User sessions table with cascading delete
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    geolocation JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    logout_at TIMESTAMPTZ,
    logout_reason VARCHAR(50),
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    metadata JSONB DEFAULT '{}',
    
    -- Foreign key with cascade
    CONSTRAINT user_sessions_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE
);

-- Create indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip ON user_sessions(ip_address);

-- Consent audit log with cascading delete
CREATE TABLE IF NOT EXISTS consent_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    document_type legal_document_type,
    document_version VARCHAR(20),
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    
    -- Foreign key with cascade
    CONSTRAINT consent_audit_log_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE
);

-- Create indexes for consent_audit_log
CREATE INDEX IF NOT EXISTS idx_consent_audit_user ON consent_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_created ON consent_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_consent_audit_action ON consent_audit_log(action);

-- User devices table with cascading delete
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(100),
    device_type VARCHAR(50),
    operating_system VARCHAR(50),
    browser VARCHAR(50),
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    is_trusted BOOLEAN DEFAULT false,
    is_blocked BOOLEAN DEFAULT false,
    trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
    metadata JSONB DEFAULT '{}',
    
    -- Foreign key with cascade
    CONSTRAINT user_devices_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE,
    
    -- Unique constraint
    CONSTRAINT unique_user_device UNIQUE (user_id, device_fingerprint)
);

-- Create indexes for user_devices
CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint ON user_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_devices_trusted ON user_devices(is_trusted) WHERE is_trusted = true;
CREATE INDEX IF NOT EXISTS idx_user_devices_blocked ON user_devices(is_blocked) WHERE is_blocked = true;

-- Login activity table (enhanced)
CREATE TABLE IF NOT EXISTS login_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    success BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    geolocation JSONB,
    error_message TEXT,
    attempt_type VARCHAR(50), -- 'password', 'magic_link', 'oauth', etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for login_activity
CREATE INDEX IF NOT EXISTS idx_login_activity_user ON login_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_login_activity_email ON login_activity(email);
CREATE INDEX IF NOT EXISTS idx_login_activity_created ON login_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_login_activity_success ON login_activity(success);
CREATE INDEX IF NOT EXISTS idx_login_activity_ip ON login_activity(ip_address);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_documents_updated_at BEFORE UPDATE ON legal_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get user's current consent status
CREATE OR REPLACE FUNCTION get_user_consent_status(p_user_id UUID)
RETURNS TABLE (
    document_type legal_document_type,
    is_accepted BOOLEAN,
    accepted_version VARCHAR(20),
    accepted_at TIMESTAMPTZ,
    needs_update BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH active_docs AS (
        SELECT DISTINCT ON (type) 
            id, type, version
        FROM legal_documents
        WHERE is_active = true AND requires_acceptance = true
        ORDER BY type, effective_date DESC
    ),
    user_consents_latest AS (
        SELECT DISTINCT ON (ld.type)
            ld.type,
            uc.action = 'accepted' AS is_accepted,
            ld.version AS accepted_version,
            uc.consented_at,
            uc.document_id
        FROM user_consents uc
        JOIN legal_documents ld ON ld.id = uc.document_id
        WHERE uc.user_id = p_user_id
            AND uc.is_current = true
        ORDER BY ld.type, uc.consented_at DESC
    )
    SELECT 
        ad.type AS document_type,
        COALESCE(ucl.is_accepted, false) AS is_accepted,
        ucl.accepted_version,
        ucl.consented_at AS accepted_at,
        CASE 
            WHEN ucl.document_id IS NULL THEN true
            WHEN ucl.document_id != ad.id THEN true
            ELSE false
        END AS needs_update
    FROM active_docs ad
    LEFT JOIN user_consents_latest ucl ON ucl.type = ad.type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record consent with full audit trail
CREATE OR REPLACE FUNCTION record_user_consent(
    p_user_id UUID,
    p_document_id UUID,
    p_action consent_action_type,
    p_ip_address INET,
    p_user_agent TEXT DEFAULT NULL,
    p_device_fingerprint VARCHAR(255) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_consent_id UUID;
    v_document_type legal_document_type;
    v_document_version VARCHAR(20);
BEGIN
    -- Get document info
    SELECT type, version INTO v_document_type, v_document_version
    FROM legal_documents
    WHERE id = p_document_id;
    
    IF v_document_type IS NULL THEN
        RAISE EXCEPTION 'Document not found: %', p_document_id;
    END IF;
    
    -- Start transaction
    BEGIN
        -- Mark previous consents as not current
        UPDATE user_consents
        SET is_current = false
        WHERE user_id = p_user_id
            AND document_id IN (
                SELECT id FROM legal_documents WHERE type = v_document_type
            )
            AND is_current = true;
        
        -- Insert new consent record
        INSERT INTO user_consents (
            user_id, document_id, action, ip_address, 
            user_agent, device_fingerprint, metadata,
            consent_method
        ) VALUES (
            p_user_id, p_document_id, p_action, p_ip_address,
            p_user_agent, p_device_fingerprint, p_metadata,
            COALESCE(p_metadata->>'consent_method', 'manual')
        ) RETURNING id INTO v_consent_id;
        
        -- Update user profile
        UPDATE profiles
        SET 
            last_consent_update = NOW(),
            consent_ip_history = consent_ip_history || 
                jsonb_build_array(jsonb_build_object(
                    'ip', p_ip_address::text,
                    'timestamp', NOW(),
                    'action', p_action::text
                ))
        WHERE user_id = p_user_id;
        
        -- Log to audit
        INSERT INTO consent_audit_log (
            user_id, action, document_type, document_version,
            ip_address, user_agent, new_value
        ) VALUES (
            p_user_id, 
            'consent_' || p_action::text,
            v_document_type,
            v_document_version,
            p_ip_address,
            p_user_agent,
            jsonb_build_object(
                'document_id', p_document_id,
                'action', p_action,
                'metadata', p_metadata
            )
        );
        
        RETURN v_consent_id;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user signup with all compliance data
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile with compliance data from user metadata
    INSERT INTO profiles (
        user_id,
        email,
        first_name,
        last_name,
        phone,
        signup_ip_address,
        signup_user_agent,
        signup_device_fingerprint,
        signup_geolocation,
        signup_referrer,
        signup_utm_params,
        signup_timestamp,
        gdpr_consent,
        marketing_consent,
        data_processing_consent
    ) VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'firstName',
        NEW.raw_user_meta_data->>'lastName',
        NEW.raw_user_meta_data->>'phone',
        (NEW.raw_user_meta_data->>'signup_ip_address')::inet,
        NEW.raw_user_meta_data->>'signup_user_agent',
        NEW.raw_user_meta_data->>'signup_device_fingerprint',
        NEW.raw_user_meta_data->'signup_geolocation',
        NEW.raw_user_meta_data->>'signup_referrer',
        NEW.raw_user_meta_data->'signup_utm_params',
        NOW(),
        COALESCE((NEW.raw_user_meta_data->>'gdprConsent')::boolean, false),
        COALESCE((NEW.raw_user_meta_data->>'marketingConsent')::boolean, false),
        COALESCE((NEW.raw_user_meta_data->>'dataProcessingConsent')::boolean, false)
    );
    
    -- Log signup activity
    INSERT INTO login_activity (
        user_id,
        email,
        success,
        ip_address,
        user_agent,
        device_fingerprint,
        geolocation,
        attempt_type
    ) VALUES (
        NEW.id,
        NEW.email,
        true,
        (NEW.raw_user_meta_data->>'signup_ip_address')::inet,
        NEW.raw_user_meta_data->>'signup_user_agent',
        NEW.raw_user_meta_data->>'signup_device_fingerprint',
        NEW.raw_user_meta_data->'signup_geolocation',
        'signup'
    );
    
    -- Register device
    IF NEW.raw_user_meta_data->>'signup_device_fingerprint' IS NOT NULL THEN
        INSERT INTO user_devices (
            user_id,
            device_fingerprint,
            device_type,
            operating_system,
            browser
        ) VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'signup_device_fingerprint',
            CASE 
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%mobile%' THEN 'mobile'
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%tablet%' THEN 'tablet'
                ELSE 'desktop'
            END,
            CASE
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%windows%' THEN 'Windows'
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%mac%' THEN 'macOS'
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%linux%' THEN 'Linux'
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%android%' THEN 'Android'
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%ios%' THEN 'iOS'
                ELSE 'Unknown'
            END,
            CASE
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%chrome%' THEN 'Chrome'
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%firefox%' THEN 'Firefox'
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%safari%' THEN 'Safari'
                WHEN NEW.raw_user_meta_data->>'signup_user_agent' ILIKE '%edge%' THEN 'Edge'
                ELSE 'Unknown'
            END
        ) ON CONFLICT (user_id, device_fingerprint) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_activity ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Legal documents: Everyone can read active documents
CREATE POLICY "Anyone can view active legal documents"
    ON legal_documents FOR SELECT
    USING (is_active = true);

-- Only admins can manage legal documents
CREATE POLICY "Only admins can manage legal documents"
    ON legal_documents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_app_meta_data->>'role' = 'admin'
        )
    );

-- Users can view their own consent records
CREATE POLICY "Users can view own consent records"
    ON user_consents FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own consent records
CREATE POLICY "Users can create own consent records"
    ON user_consents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
    ON user_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
    ON consent_audit_log FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view and manage their own devices
CREATE POLICY "Users can view own devices"
    ON user_devices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
    ON user_devices FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can view their own login activity
CREATE POLICY "Users can view own login activity"
    ON login_activity FOR SELECT
    USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_consents_action ON user_consents(action);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_devices_last_seen ON user_devices(last_seen);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
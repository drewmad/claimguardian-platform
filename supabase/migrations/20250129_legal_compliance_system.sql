-- Legal Compliance System Migration
-- This migration creates a comprehensive legal consent tracking system
-- that captures all required data for Privacy Policy, Terms of Service, 
-- and AI Use Agreement compliance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Create enum for legal document types
CREATE TYPE legal_document_type AS ENUM (
  'privacy_policy',
  'terms_of_service',
  'ai_use_agreement',
  'cookie_policy',
  'data_processing_agreement'
);

-- Create enum for consent action types
CREATE TYPE consent_action_type AS ENUM (
  'accepted',
  'declined',
  'withdrawn',
  'updated'
);

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
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  requires_acceptance BOOLEAN DEFAULT true,
  parent_version_id UUID REFERENCES legal_documents(id),
  change_summary TEXT,
  storage_url TEXT, -- URL to PDF/HTML version
  sha256_hash VARCHAR(64) NOT NULL, -- Document integrity hash
  metadata JSONB DEFAULT '{}',
  
  -- Ensure unique active version per type
  CONSTRAINT unique_active_document_type UNIQUE (type, is_active) WHERE is_active = true,
  -- Ensure unique version per type
  CONSTRAINT unique_document_version UNIQUE (type, version)
);

-- Create indexes for legal documents
CREATE INDEX idx_legal_documents_type ON legal_documents(type);
CREATE INDEX idx_legal_documents_active ON legal_documents(is_active);
CREATE INDEX idx_legal_documents_effective_date ON legal_documents(effective_date);
CREATE INDEX idx_legal_documents_slug ON legal_documents(slug);

-- User consent records table
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES legal_documents(id),
  action consent_action_type NOT NULL,
  consented_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET NOT NULL,
  user_agent TEXT,
  device_fingerprint VARCHAR(255),
  geolocation JSONB, -- {country, region, city, lat, lon}
  session_id VARCHAR(255),
  consent_method VARCHAR(50) NOT NULL, -- 'signup', 'settings', 'prompted', 'auto_update'
  is_current BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  
  -- Track consent context
  referrer_url TEXT,
  page_url TEXT,
  consent_flow VARCHAR(50), -- 'standard', 'gdpr', 'ccpa'
  
);

-- Create indexes for user_consents
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_document_id ON user_consents(document_id);
CREATE INDEX idx_user_consents_consented_at ON user_consents(consented_at);
CREATE INDEX idx_user_consents_current ON user_consents(user_id, is_current) WHERE is_current = true;

-- Enhanced user profiles with compliance data
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signup_ip_address INET;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signup_user_agent TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signup_device_fingerprint VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signup_geolocation JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signup_referrer TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signup_utm_params JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gdpr_consent BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS data_processing_consent BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_consent_update TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consent_ip_history JSONB DEFAULT '[]'; -- Array of {ip, timestamp}

-- Login activity tracking (enhanced)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  logout_reason VARCHAR(50), -- 'user', 'timeout', 'admin', 'security'
  risk_score INTEGER DEFAULT 0, -- 0-100 security risk score
  metadata JSONB DEFAULT '{}',
  
);

-- Create indexes for user_sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active, expires_at);
CREATE INDEX idx_user_sessions_ip ON user_sessions(ip_address);

-- Audit log for all consent changes
CREATE TABLE IF NOT EXISTS consent_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  document_type legal_document_type,
  document_version VARCHAR(20),
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
);

-- Create indexes for consent_audit_log
CREATE INDEX idx_consent_audit_user ON consent_audit_log(user_id);
CREATE INDEX idx_consent_audit_created ON consent_audit_log(created_at);

-- Device tracking for security
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint VARCHAR(255) NOT NULL,
  device_name VARCHAR(100),
  device_type VARCHAR(50), -- 'mobile', 'tablet', 'desktop'
  operating_system VARCHAR(50),
  browser VARCHAR(50),
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_trusted BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  
  -- Unique device per user
  CONSTRAINT unique_user_device UNIQUE (user_id, device_fingerprint)
);

-- Create indexes for user_devices
CREATE INDEX idx_user_devices_user ON user_devices(user_id);
CREATE INDEX idx_user_devices_fingerprint ON user_devices(device_fingerprint);

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
$$ LANGUAGE plpgsql;

-- Function to record consent
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
BEGIN
  -- Get document type
  SELECT type INTO v_document_type
  FROM legal_documents
  WHERE id = p_document_id;
  
  -- Mark previous consents for this document type as not current
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
    user_agent, device_fingerprint, metadata
  ) VALUES (
    p_user_id, p_document_id, p_action, p_ip_address,
    p_user_agent, p_device_fingerprint, p_metadata
  ) RETURNING id INTO v_consent_id;
  
  -- Update user profile
  UPDATE profiles
  SET last_consent_update = NOW()
  WHERE user_id = p_user_id;
  
  -- Log to audit
  INSERT INTO consent_audit_log (
    user_id, action, document_type, ip_address, user_agent,
    new_value
  ) VALUES (
    p_user_id, 
    'consent_' || p_action::text,
    v_document_type,
    p_ip_address,
    p_user_agent,
    jsonb_build_object(
      'document_id', p_document_id,
      'action', p_action,
      'metadata', p_metadata
    )
  );
  
  RETURN v_consent_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Legal documents: everyone can read active documents
CREATE POLICY "Anyone can view active legal documents"
  ON legal_documents FOR SELECT
  USING (is_active = true);

-- Only admins can manage legal documents
CREATE POLICY "Only admins can manage legal documents"
  ON legal_documents FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

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

-- Users can view their own devices
CREATE POLICY "Users can view own devices"
  ON user_devices FOR SELECT
  USING (auth.uid() = user_id);

-- Insert default legal documents
INSERT INTO legal_documents (
  type, version, title, slug, content, summary,
  effective_date, sha256_hash
) VALUES 
(
  'privacy_policy',
  '1.0.0',
  'Privacy Policy',
  'privacy-policy',
  'Full privacy policy content here...',
  'We respect your privacy and protect your personal data.',
  NOW(),
  sha256('privacy_policy_v1.0.0')::varchar
),
(
  'terms_of_service',
  '1.0.0',
  'Terms of Service',
  'terms-of-service',
  'Full terms of service content here...',
  'Terms and conditions for using ClaimGuardian.',
  NOW(),
  sha256('terms_of_service_v1.0.0')::varchar
),
(
  'ai_use_agreement',
  '1.0.0',
  'AI Use Agreement',
  'ai-use-agreement',
  'Full AI use agreement content here...',
  'How we use AI to help with your insurance claims.',
  NOW(),
  sha256('ai_use_agreement_v1.0.0')::varchar
)
ON CONFLICT (type, version) DO NOTHING;
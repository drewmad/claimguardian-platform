-- RPC Functions for Legal Consent Management
-- These functions provide secure, controlled access to consent operations

-- Function to get active legal documents (used by legal service)
CREATE OR REPLACE FUNCTION get_active_legal_documents()
RETURNS SETOF legal_documents AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM legal_documents
    WHERE is_active = true
      AND requires_acceptance = true
    ORDER BY type, version DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user needs to re-accept any documents
CREATE OR REPLACE FUNCTION needs_reaccept(uid UUID)
RETURNS SETOF legal_documents AS $$
BEGIN
    RETURN QUERY
    WITH current_docs AS (
        SELECT DISTINCT ON (type) 
            id, type, version
        FROM legal_documents
        WHERE is_active = true 
          AND requires_acceptance = true
        ORDER BY type, effective_date DESC
    ),
    user_accepted AS (
        SELECT DISTINCT ON (ld.type)
            ld.type,
            ld.id as accepted_doc_id
        FROM user_consents uc
        JOIN legal_documents ld ON ld.id = uc.document_id
        WHERE uc.user_id = uid
          AND uc.is_current = true
          AND uc.action = 'accepted'
        ORDER BY ld.type, uc.consented_at DESC
    )
    SELECT cd.*
    FROM current_docs cd
    LEFT JOIN user_accepted ua ON ua.type = cd.type
    WHERE ua.accepted_doc_id IS NULL 
       OR ua.accepted_doc_id != cd.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record legal acceptance (simplified wrapper)
CREATE OR REPLACE FUNCTION record_legal_acceptance(
    p_user_id UUID,
    p_legal_id UUID,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_signature_data JSONB DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_ip INET;
BEGIN
    -- Convert text IP to INET type
    v_ip := COALESCE(p_ip_address::inet, '0.0.0.0'::inet);
    
    -- Call the main consent recording function
    PERFORM record_user_consent(
        p_user_id,
        p_legal_id,
        'accepted'::consent_action_type,
        v_ip,
        p_user_agent,
        NULL, -- device_fingerprint handled separately
        COALESCE(p_signature_data, '{}'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's acceptance history with document details
CREATE OR REPLACE FUNCTION get_user_acceptance_history(p_user_id UUID)
RETURNS TABLE (
    consent_id UUID,
    document_type legal_document_type,
    document_title VARCHAR(255),
    document_version VARCHAR(20),
    action consent_action_type,
    consented_at TIMESTAMPTZ,
    is_current BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.id as consent_id,
        ld.type as document_type,
        ld.title as document_title,
        ld.version as document_version,
        uc.action,
        uc.consented_at,
        uc.is_current
    FROM user_consents uc
    JOIN legal_documents ld ON ld.id = uc.document_id
    WHERE uc.user_id = p_user_id
    ORDER BY uc.consented_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has accepted all required documents
CREATE OR REPLACE FUNCTION has_accepted_all_required_documents(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_needs_acceptance INTEGER;
BEGIN
    -- Count documents needing acceptance
    SELECT COUNT(*)
    INTO v_needs_acceptance
    FROM needs_reaccept(p_user_id);
    
    RETURN v_needs_acceptance = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get document by slug
CREATE OR REPLACE FUNCTION get_legal_document_by_slug(p_slug VARCHAR(100))
RETURNS legal_documents AS $$
DECLARE
    v_document legal_documents;
BEGIN
    SELECT *
    INTO v_document
    FROM legal_documents
    WHERE slug = p_slug
      AND is_active = true
    LIMIT 1;
    
    RETURN v_document;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate document integrity
CREATE OR REPLACE FUNCTION validate_document_integrity(
    p_document_id UUID,
    p_expected_hash VARCHAR(64)
) RETURNS BOOLEAN AS $$
DECLARE
    v_actual_hash VARCHAR(64);
BEGIN
    SELECT sha256_hash
    INTO v_actual_hash
    FROM legal_documents
    WHERE id = p_document_id;
    
    RETURN v_actual_hash = p_expected_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get documents needing acceptance count
CREATE OR REPLACE FUNCTION get_pending_consent_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM needs_reaccept(p_user_id);
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to withdraw consent (GDPR compliance)
CREATE OR REPLACE FUNCTION withdraw_consent(
    p_user_id UUID,
    p_document_type legal_document_type,
    p_ip_address INET DEFAULT '0.0.0.0'::inet,
    p_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_current_consent_id UUID;
    v_document_id UUID;
BEGIN
    -- Find current consent
    SELECT uc.id, uc.document_id
    INTO v_current_consent_id, v_document_id
    FROM user_consents uc
    JOIN legal_documents ld ON ld.id = uc.document_id
    WHERE uc.user_id = p_user_id
      AND ld.type = p_document_type
      AND uc.is_current = true
      AND uc.action = 'accepted'
    ORDER BY uc.consented_at DESC
    LIMIT 1;
    
    IF v_current_consent_id IS NOT NULL THEN
        -- Record withdrawal
        PERFORM record_user_consent(
            p_user_id,
            v_document_id,
            'withdrawn'::consent_action_type,
            p_ip_address,
            NULL,
            NULL,
            jsonb_build_object('reason', p_reason)
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get compliance summary for user
CREATE OR REPLACE FUNCTION get_user_compliance_summary(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH consent_summary AS (
        SELECT 
            COUNT(*) FILTER (WHERE is_accepted AND NOT needs_update) as accepted_current,
            COUNT(*) FILTER (WHERE needs_update) as needs_update,
            COUNT(*) as total_required
        FROM get_user_consent_status(p_user_id)
    ),
    device_summary AS (
        SELECT 
            COUNT(*) as total_devices,
            COUNT(*) FILTER (WHERE is_trusted) as trusted_devices,
            COUNT(*) FILTER (WHERE is_blocked) as blocked_devices
        FROM user_devices
        WHERE user_id = p_user_id
    ),
    session_summary AS (
        SELECT 
            COUNT(*) FILTER (WHERE is_active) as active_sessions,
            MAX(created_at) as last_login
        FROM user_sessions
        WHERE user_id = p_user_id
    )
    SELECT jsonb_build_object(
        'consent_status', row_to_json(cs.*),
        'device_status', row_to_json(ds.*),
        'session_status', row_to_json(ss.*),
        'is_compliant', cs.accepted_current = cs.total_required,
        'last_updated', NOW()
    )
    INTO v_result
    FROM consent_summary cs, device_summary ds, session_summary ss;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_active_legal_documents() TO authenticated;
GRANT EXECUTE ON FUNCTION needs_reaccept(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_legal_acceptance(UUID, UUID, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_acceptance_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_accepted_all_required_documents(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_legal_document_by_slug(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_document_integrity(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_consent_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION withdraw_consent(UUID, legal_document_type, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_compliance_summary(UUID) TO authenticated;

-- Create indexes for better RPC performance
CREATE INDEX IF NOT EXISTS idx_legal_documents_slug_active 
    ON legal_documents(slug) 
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_consents_user_current 
    ON user_consents(user_id, is_current) 
    WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_user_consents_user_action 
    ON user_consents(user_id, action) 
    WHERE action = 'accepted';
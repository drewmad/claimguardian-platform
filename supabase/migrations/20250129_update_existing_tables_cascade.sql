-- Update existing tables with proper cascading rules
-- This ensures that when a user is deleted, their related data is properly cascaded

-- Update properties table to cascade on user delete
ALTER TABLE properties 
DROP CONSTRAINT IF EXISTS properties_user_id_fkey;

ALTER TABLE properties 
ADD CONSTRAINT properties_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Update claims table to cascade on user delete
ALTER TABLE claims 
DROP CONSTRAINT IF EXISTS claims_user_id_fkey;

ALTER TABLE claims 
ADD CONSTRAINT claims_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Update claims to cascade on property delete (optional - you might want RESTRICT instead)
ALTER TABLE claims 
DROP CONSTRAINT IF EXISTS claims_property_id_fkey;

ALTER TABLE claims 
ADD CONSTRAINT claims_property_id_fkey 
FOREIGN KEY (property_id) 
REFERENCES properties(id) 
ON DELETE CASCADE;

-- Update damage_assessments to cascade properly
ALTER TABLE damage_assessments 
DROP CONSTRAINT IF EXISTS damage_assessments_claim_id_fkey;

ALTER TABLE damage_assessments 
ADD CONSTRAINT damage_assessments_claim_id_fkey 
FOREIGN KEY (claim_id) 
REFERENCES claims(id) 
ON DELETE CASCADE;

ALTER TABLE damage_assessments 
DROP CONSTRAINT IF EXISTS damage_assessments_created_by_fkey;

ALTER TABLE damage_assessments 
ADD CONSTRAINT damage_assessments_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Update property_images to cascade
ALTER TABLE property_images 
DROP CONSTRAINT IF EXISTS property_images_property_id_fkey;

ALTER TABLE property_images 
ADD CONSTRAINT property_images_property_id_fkey 
FOREIGN KEY (property_id) 
REFERENCES properties(id) 
ON DELETE CASCADE;

ALTER TABLE property_images 
DROP CONSTRAINT IF EXISTS property_images_uploaded_by_fkey;

ALTER TABLE property_images 
ADD CONSTRAINT property_images_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Update claim_documents to cascade
ALTER TABLE claim_documents 
DROP CONSTRAINT IF EXISTS claim_documents_claim_id_fkey;

ALTER TABLE claim_documents 
ADD CONSTRAINT claim_documents_claim_id_fkey 
FOREIGN KEY (claim_id) 
REFERENCES claims(id) 
ON DELETE CASCADE;

ALTER TABLE claim_documents 
DROP CONSTRAINT IF EXISTS claim_documents_uploaded_by_fkey;

ALTER TABLE claim_documents 
ADD CONSTRAINT claim_documents_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Update claim_activities to cascade
ALTER TABLE claim_activities 
DROP CONSTRAINT IF EXISTS claim_activities_claim_id_fkey;

ALTER TABLE claim_activities 
ADD CONSTRAINT claim_activities_claim_id_fkey 
FOREIGN KEY (claim_id) 
REFERENCES claims(id) 
ON DELETE CASCADE;

ALTER TABLE claim_activities 
DROP CONSTRAINT IF EXISTS claim_activities_user_id_fkey;

ALTER TABLE claim_activities 
ADD CONSTRAINT claim_activities_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Update ai_analyses to cascade
ALTER TABLE ai_analyses 
DROP CONSTRAINT IF EXISTS ai_analyses_damage_assessment_id_fkey;

ALTER TABLE ai_analyses 
ADD CONSTRAINT ai_analyses_damage_assessment_id_fkey 
FOREIGN KEY (damage_assessment_id) 
REFERENCES damage_assessments(id) 
ON DELETE CASCADE;

-- Add audit columns to existing tables if they don't exist
DO $$ 
BEGIN
    -- Add deleted_at to properties if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'deleted_at') THEN
        ALTER TABLE properties ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
    
    -- Add deleted_at to claims if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'claims' AND column_name = 'deleted_at') THEN
        ALTER TABLE claims ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create function for soft delete if needed
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Instead of deleting, set deleted_at
    UPDATE properties SET deleted_at = NOW() WHERE id = OLD.id;
    RETURN NULL; -- Prevent actual deletion
END;
$$ LANGUAGE plpgsql;

-- Note: Soft delete triggers are commented out by default
-- Uncomment if you want soft deletes instead of hard deletes
-- CREATE TRIGGER soft_delete_properties
--     BEFORE DELETE ON properties
--     FOR EACH ROW EXECUTE FUNCTION soft_delete();

-- Create a function to handle user deletion cleanup
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the deletion
    INSERT INTO consent_audit_log (
        user_id,
        action,
        ip_address,
        metadata,
        created_at
    ) VALUES (
        OLD.id,
        'account_deleted',
        '0.0.0.0'::inet, -- System action
        jsonb_build_object(
            'deletion_time', NOW(),
            'email', OLD.email
        ),
        NOW()
    );
    
    -- Note: All cascading deletes happen automatically due to foreign key constraints
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user deletion
DROP TRIGGER IF EXISTS on_user_deleted ON auth.users;
CREATE TRIGGER on_user_deleted
    BEFORE DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_user_deletion();

-- Create comprehensive user data export function (for GDPR compliance)
CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'user_id', p_user_id,
        'export_date', NOW(),
        'profile', (SELECT row_to_json(p.*) FROM profiles p WHERE p.user_id = p_user_id),
        'properties', (SELECT jsonb_agg(row_to_json(p.*)) FROM properties p WHERE p.user_id = p_user_id),
        'claims', (SELECT jsonb_agg(row_to_json(c.*)) FROM claims c WHERE c.user_id = p_user_id),
        'consents', (SELECT jsonb_agg(row_to_json(uc.*)) FROM user_consents uc WHERE uc.user_id = p_user_id),
        'devices', (SELECT jsonb_agg(row_to_json(ud.*)) FROM user_devices ud WHERE ud.user_id = p_user_id),
        'sessions', (SELECT jsonb_agg(row_to_json(us.*)) FROM user_sessions us WHERE us.user_id = p_user_id),
        'login_activity', (SELECT jsonb_agg(row_to_json(la.*)) FROM login_activity la WHERE la.user_id = p_user_id)
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to anonymize user data (for right to be forgotten)
CREATE OR REPLACE FUNCTION anonymize_user_data(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_anonymous_id VARCHAR(50);
BEGIN
    -- Generate anonymous ID
    v_anonymous_id := 'ANON_' || encode(gen_random_bytes(16), 'hex');
    
    -- Anonymize profile
    UPDATE profiles 
    SET 
        email = v_anonymous_id || '@anonymous.local',
        full_name = 'Anonymous User',
        first_name = 'Anonymous',
        last_name = 'User',
        phone = NULL,
        avatar_url = NULL,
        signup_ip_address = '0.0.0.0'::inet,
        signup_user_agent = 'Anonymized',
        signup_device_fingerprint = v_anonymous_id,
        signup_geolocation = NULL,
        signup_referrer = NULL,
        signup_utm_params = NULL,
        metadata = jsonb_build_object('anonymized', true, 'anonymized_at', NOW())
    WHERE user_id = p_user_id;
    
    -- Anonymize other tables as needed
    UPDATE login_activity 
    SET 
        email = v_anonymous_id || '@anonymous.local',
        ip_address = '0.0.0.0'::inet,
        user_agent = 'Anonymized',
        device_fingerprint = v_anonymous_id,
        geolocation = NULL
    WHERE user_id = p_user_id;
    
    -- Log the anonymization
    INSERT INTO consent_audit_log (
        user_id,
        action,
        ip_address,
        metadata
    ) VALUES (
        p_user_id,
        'data_anonymized',
        '0.0.0.0'::inet,
        jsonb_build_object(
            'anonymized_at', NOW(),
            'anonymous_id', v_anonymous_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION export_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION anonymize_user_data(UUID) TO authenticated;
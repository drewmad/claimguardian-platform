-- Check if legal documents already exist and insert if not
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'legal_documents') THEN
        -- Insert documents if they don't exist
        INSERT INTO legal_documents (
            type, version, title, slug, content, summary,
            effective_date, sha256_hash, is_active, requires_acceptance
        ) 
        SELECT * FROM (VALUES
            (
                'privacy_policy'::legal_document_type,
                '1.0.0',
                'Privacy Policy',
                'privacy-policy',
                'Full privacy policy content available at /legal/privacy-policy',
                'We respect your privacy and protect your personal data. This policy explains how we collect, use, and safeguard your information.',
                CURRENT_DATE,
                encode(sha256('privacy_policy_v1.0.0'::bytea), 'hex'),
                true,
                true
            ),
            (
                'terms_of_service'::legal_document_type,
                '1.0.0',
                'Terms of Service',
                'terms-of-service',
                'Full terms of service content available at /legal/terms-of-service',
                'Terms and conditions for using ClaimGuardian. By using our service, you agree to these terms.',
                CURRENT_DATE,
                encode(sha256('terms_of_service_v1.0.0'::bytea), 'hex'),
                true,
                true
            ),
            (
                'ai_use_agreement'::legal_document_type,
                '1.0.0',
                'AI Use Agreement',
                'ai-use-agreement',
                'Full AI use agreement content available at /legal/ai-use-agreement',
                'How we use AI to help with your insurance claims. This agreement covers AI features, data processing, and limitations.',
                CURRENT_DATE,
                encode(sha256('ai_use_agreement_v1.0.0'::bytea), 'hex'),
                true,
                true
            )
        ) AS v(type, version, title, slug, content, summary, effective_date, sha256_hash, is_active, requires_acceptance)
        WHERE NOT EXISTS (
            SELECT 1 FROM legal_documents ld 
            WHERE ld.type = v.type AND ld.version = v.version
        );
        
        RAISE NOTICE 'Legal documents seed completed';
    ELSE
        RAISE NOTICE 'legal_documents table does not exist - skipping seed';
    END IF;
END $$;
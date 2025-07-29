-- Fix RLS for legal_documents table to allow anonymous access

-- First, drop any existing policies
DROP POLICY IF EXISTS "Legal documents are viewable by everyone" ON legal_documents;
DROP POLICY IF EXISTS "Anyone can view active legal documents" ON legal_documents;

-- Create a simple public read policy
CREATE POLICY "Public can read legal documents"
ON legal_documents
FOR SELECT
TO public
USING (true);

-- Also create policies for authenticated users
CREATE POLICY "Authenticated users can read legal documents"
ON legal_documents
FOR SELECT
TO authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON legal_documents TO anon;
GRANT SELECT ON legal_documents TO authenticated;

-- Verify the table exists and has data
DO $$
BEGIN
    -- Check if table has any data
    IF NOT EXISTS (SELECT 1 FROM legal_documents LIMIT 1) THEN
        RAISE NOTICE 'Legal documents table is empty. Inserting default documents...';
        
        -- Insert default legal documents
        INSERT INTO legal_documents (type, version, title, slug, content, summary, effective_date, sha256_hash, is_active, requires_acceptance)
        VALUES 
        (
            'privacy_policy',
            '1.0.0',
            'Privacy Policy',
            'privacy-policy',
            'Full privacy policy content available at /legal/privacy-policy',
            'We respect your privacy and protect your personal data. This policy explains how we collect, use, and safeguard your information.',
            CURRENT_DATE,
            encode(digest('privacy_policy_v1.0.0', 'sha256'), 'hex'),
            true,
            true
        ),
        (
            'terms_of_service',
            '1.0.0',
            'Terms of Service',
            'terms-of-service',
            'Full terms of service content available at /legal/terms-of-service',
            'Terms and conditions for using ClaimGuardian. By using our service, you agree to these terms.',
            CURRENT_DATE,
            encode(digest('terms_of_service_v1.0.0', 'sha256'), 'hex'),
            true,
            true
        ),
        (
            'ai_use_agreement',
            '1.0.0',
            'AI Use Agreement',
            'ai-use-agreement',
            'Full AI use agreement content available at /legal/ai-use-agreement',
            'How we use AI to help with your insurance claims. This agreement covers AI features, data processing, and limitations.',
            CURRENT_DATE,
            encode(digest('ai_use_agreement_v1.0.0', 'sha256'), 'hex'),
            true,
            true
        )
        ON CONFLICT (type, version) DO NOTHING;
    END IF;
END $$;
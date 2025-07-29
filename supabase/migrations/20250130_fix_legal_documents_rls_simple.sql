-- Fix RLS for legal_documents table - simple permissive approach
-- This migration removes all complex policies and creates a simple public read policy

-- First, disable RLS to clear any problematic policies
ALTER TABLE legal_documents DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure clean slate
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'legal_documents' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON legal_documents', pol.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

-- Create a single, simple SELECT policy that doesn't reference any other tables
CREATE POLICY "allow_public_read"
ON legal_documents
FOR SELECT
USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON legal_documents TO anon;
GRANT SELECT ON legal_documents TO authenticated;

-- Insert default documents if table is empty
INSERT INTO legal_documents (
    id,
    type, 
    version, 
    title, 
    slug, 
    content, 
    summary, 
    effective_date, 
    sha256_hash, 
    is_active, 
    requires_acceptance,
    storage_url
)
SELECT 
    gen_random_uuid(),
    type,
    version,
    title,
    slug,
    content,
    summary,
    effective_date,
    sha256_hash,
    is_active,
    requires_acceptance,
    storage_url
FROM (
    VALUES 
    (
        'privacy_policy'::legal_document_type,
        '1.0.0',
        'Privacy Policy',
        'privacy-policy',
        'Full privacy policy content here...',
        'We respect your privacy and protect your personal data.',
        CURRENT_DATE,
        encode(digest('privacy_policy_v1.0.0', 'sha256'), 'hex'),
        true,
        true,
        '/legal/privacy-policy'
    ),
    (
        'terms_of_service'::legal_document_type,
        '1.0.0',
        'Terms of Service',
        'terms-of-service',
        'Full terms of service content here...',
        'Terms and conditions for using ClaimGuardian.',
        CURRENT_DATE,
        encode(digest('terms_of_service_v1.0.0', 'sha256'), 'hex'),
        true,
        true,
        '/legal/terms-of-service'
    ),
    (
        'ai_use_agreement'::legal_document_type,
        '1.0.0',
        'AI Use Agreement',
        'ai-use-agreement',
        'Full AI use agreement content here...',
        'How we use AI to help with your insurance claims.',
        CURRENT_DATE,
        encode(digest('ai_use_agreement_v1.0.0', 'sha256'), 'hex'),
        true,
        true,
        '/legal/ai-use-agreement'
    )
) AS docs(type, version, title, slug, content, summary, effective_date, sha256_hash, is_active, requires_acceptance, storage_url)
WHERE NOT EXISTS (
    SELECT 1 FROM legal_documents WHERE type = docs.type AND version = docs.version
);
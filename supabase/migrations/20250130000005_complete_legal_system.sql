-- Complete Legal System Migration
-- Consolidates all legal document functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Legal Documents Table
CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL,
  version text NOT NULL DEFAULT '1.0.0',
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text,
  summary text,
  storage_url text,
  effective_date timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  sha256_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  requires_acceptance boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User Legal Acceptance Table
CREATE TABLE IF NOT EXISTS user_legal_acceptance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_id UUID NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
  accepted_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  signature_data jsonb,
  UNIQUE(user_id, legal_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_legal_documents_active ON legal_documents(is_active, requires_acceptance);
CREATE INDEX IF NOT EXISTS idx_legal_documents_slug ON legal_documents(slug);
CREATE INDEX IF NOT EXISTS idx_user_legal_acceptance_user_id ON user_legal_acceptance(user_id);
CREATE INDEX IF NOT EXISTS idx_user_legal_acceptance_legal_id ON user_legal_acceptance(legal_id);

-- RLS Policies
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_legal_acceptance ENABLE ROW LEVEL SECURITY;

-- Legal documents are readable by everyone (public content)
CREATE POLICY IF NOT EXISTS "Legal documents are publicly readable"
  ON legal_documents FOR SELECT
  USING (is_active = true);

-- Users can only read their own acceptance records
CREATE POLICY IF NOT EXISTS "Users can read own legal acceptances"
  ON user_legal_acceptance FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own acceptance records
CREATE POLICY IF NOT EXISTS "Users can insert own legal acceptances"
  ON user_legal_acceptance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to record legal acceptance
CREATE OR REPLACE FUNCTION record_legal_acceptance(
  p_user_id UUID,
  p_legal_id UUID,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_signature_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_legal_acceptance (user_id, legal_id, ip_address, user_agent, signature_data)
  VALUES (p_user_id, p_legal_id, p_ip_address::inet, p_user_agent, p_signature_data)
  ON CONFLICT (user_id, legal_id) DO UPDATE SET
    accepted_at = now(),
    ip_address = EXCLUDED.ip_address,
    user_agent = EXCLUDED.user_agent,
    signature_data = EXCLUDED.signature_data;
END;
$$;

-- Insert legal documents
INSERT INTO legal_documents (
  type, version, title, slug, content, summary, effective_date, sha256_hash, is_active, requires_acceptance
) VALUES (
  'privacy_policy',
  '1.0.0',
  'Privacy Policy',
  'privacy-policy',
  E'# Privacy Policy for ClaimGuardian

Last Updated: January 29, 2025

## 1. Introduction

Welcome to ClaimGuardian ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.

## 2. Information We Collect

### Personal Information You Provide
- **Account Information**: Name, email address, phone number, and password
- **Property Information**: Property addresses, ownership details, and insurance information
- **Claim Information**: Details about insurance claims, damage assessments, and related documentation
- **Payment Information**: Billing address and payment method details (processed securely by our payment providers)

### Information Automatically Collected
- **Device Information**: IP address, browser type, operating system, device identifiers
- **Usage Data**: Pages visited, features used, time spent on the platform
- **Location Data**: Approximate location based on IP address, property locations you provide
- **Cookies and Tracking**: We use cookies and similar technologies to enhance your experience

## 3. How We Use Your Information

We use your information to:
- Provide and maintain our services
- Process and manage insurance claims
- Communicate with you about your account and claims
- Improve our services and develop new features
- Comply with legal obligations

## 4. Information Sharing and Disclosure

We may share your information with:
- **Service Providers**: Third-party companies that help us provide our services
- **Insurance Companies**: When necessary for claim processing and advocacy
- **Legal Authorities**: When required by law or to protect our rights and users
- **Business Transfers**: In connection with mergers, acquisitions, or asset sales

## 5. Data Security

We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## 6. Your Rights and Choices

You have the right to:
- Access, update, or delete your personal information
- Opt-out of marketing communications
- Request data portability
- Lodge complaints with supervisory authorities

## 7. Contact Us

If you have questions about this Privacy Policy, please contact us at privacy@claimguardian.com.',
  'Our Privacy Policy explains how we collect, use, and protect your personal information when using ClaimGuardian services.',
  '2025-01-29'::timestamp with time zone,
  'privacy_policy_1_0_0_hash_placeholder',
  true,
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO legal_documents (
  type, version, title, slug, content, summary, effective_date, sha256_hash, is_active, requires_acceptance
) VALUES (
  'terms_of_service',
  '1.0.0',
  'Terms of Service',
  'terms-of-service',
  E'# Terms of Service for ClaimGuardian

Last Updated: January 29, 2025

## 1. Acceptance of Terms

By accessing and using ClaimGuardian ("Service"), you accept and agree to be bound by the terms and provision of this agreement.

## 2. Description of Service

ClaimGuardian is an AI-powered insurance claim advocacy platform that helps Florida property owners navigate the insurance claim process.

## 3. User Accounts

- You must create an account to use our services
- You are responsible for maintaining the confidentiality of your account
- You agree to provide accurate and complete information
- You must be at least 18 years old to use our services

## 4. Acceptable Use

You agree not to:
- Use the service for any unlawful purpose
- Interfere with or disrupt the service
- Attempt to gain unauthorized access to our systems
- Upload malicious code or content
- Violate any applicable laws or regulations

## 5. Intellectual Property

- ClaimGuardian retains all rights to its proprietary technology and content
- You retain rights to the content you provide to us
- You grant us a license to use your content to provide our services

## 6. Disclaimers and Limitations

- Our service is provided "as is" without warranties
- We are not liable for indirect, incidental, or consequential damages
- Our total liability is limited to the amount you paid for our services

## 7. Termination

We may terminate your account for violations of these terms or for any reason with notice.

## 8. Changes to Terms

We reserve the right to modify these terms at any time. Continued use constitutes acceptance of changes.

## 9. Governing Law

These terms are governed by the laws of Florida, United States.

## 10. Contact Information

For questions about these Terms of Service, contact us at legal@claimguardian.com.',
  'Terms of Service governing the use of ClaimGuardian platform and services.',
  '2025-01-29'::timestamp with time zone,
  'terms_of_service_1_0_0_hash_placeholder',
  true,
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO legal_documents (
  type, version, title, slug, content, summary, effective_date, sha256_hash, is_active, requires_acceptance
) VALUES (
  'ai_use_agreement',
  '1.0.0',
  'AI Use Agreement',
  'ai-use-agreement',
  E'# AI Use Agreement for ClaimGuardian

Last Updated: January 29, 2025

## 1. AI Services Overview

ClaimGuardian uses artificial intelligence (AI) and machine learning (ML) technologies to enhance our claim advocacy services.

## 2. AI Capabilities

Our AI systems:
- Analyze damage photos and documentation
- Generate claim-related documents and communications
- Provide recommendations for claim strategies
- Process and organize claim information
- Assist with property valuation estimates

## 3. AI Limitations and Disclaimers

- AI outputs are for informational purposes only
- All AI recommendations should be reviewed by qualified professionals
- AI systems may produce errors or inaccurate results
- Final decisions should always involve human judgment
- We do not guarantee the accuracy of AI-generated content

## 4. Your Data and AI Training

- We may use anonymized data to improve our AI systems
- Personal information is never used for training without consent
- You can opt-out of data usage for AI improvement
- All data usage complies with our Privacy Policy

## 5. Human Oversight

- All AI outputs are subject to human review when appropriate
- Critical decisions always involve human experts
- You can request human review of any AI-generated content

## 6. Intellectual Property

- AI-generated content is provided under our standard service terms
- You retain ownership of your input data and information
- We retain rights to our AI technology and methodologies

## 7. Responsible AI Use

We are committed to:
- Transparent AI operations
- Fair and unbiased AI systems
- Protecting user privacy and data rights
- Continuous improvement of AI accuracy and safety

## 8. Changes to AI Services

We may update our AI capabilities and this agreement as technology evolves.

## 9. Contact

For questions about our AI use, contact us at ai@claimguardian.com.',
  'Agreement governing the use of AI technologies in ClaimGuardian services.',
  '2025-01-29'::timestamp with time zone,
  'ai_use_agreement_1_0_0_hash_placeholder',
  true,
  true
) ON CONFLICT (slug) DO NOTHING;
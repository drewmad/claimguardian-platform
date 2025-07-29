-- Legal Documents Seed Data
-- This file contains the actual content for Privacy Policy, Terms of Service, and AI Use Agreement

-- Privacy Policy
INSERT INTO legal_documents (
  type,
  version,
  title,
  slug,
  content,
  summary,
  effective_date,
  sha256_hash,
  is_active,
  requires_acceptance
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
- Protect against fraud and abuse
- With your consent, send marketing communications

## 4. AI and Data Processing

### AI-Powered Features
We use artificial intelligence to:
- Analyze property damage from photos and documents
- Extract information from insurance policies
- Provide claim assistance and recommendations
- Generate documents and communications

### Data Processing
- AI processing is performed on secure servers
- Your data is not used to train general AI models
- You can opt-out of AI features at any time

## 5. Data Sharing and Disclosure

We may share your information with:
- **Service Providers**: Third parties who help us operate our business
- **Insurance Companies**: Only with your explicit consent for claim processing
- **Legal Requirements**: When required by law or to protect rights
- **Business Transfers**: In connection with mergers or acquisitions
- **Your Consent**: With other parties when you direct us to

We do NOT sell your personal information.

## 6. Data Security

We implement appropriate technical and organizational measures to protect your data, including:
- Encryption in transit and at rest
- Regular security assessments
- Access controls and authentication
- Secure data centers
- Incident response procedures

## 7. Your Rights and Choices

You have the right to:
- **Access**: Request a copy of your personal information
- **Correction**: Update or correct inaccurate information
- **Deletion**: Request deletion of your personal information
- **Portability**: Receive your data in a machine-readable format
- **Opt-out**: Unsubscribe from marketing communications
- **AI Processing**: Opt-out of AI-powered features

## 8. Data Retention

We retain your information for as long as necessary to:
- Provide our services
- Comply with legal obligations
- Resolve disputes
- Enforce our agreements

## 9. International Data Transfers

Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.

## 10. Children\'s Privacy

Our services are not intended for children under 18. We do not knowingly collect information from children.

## 11. California Privacy Rights (CCPA)

California residents have additional rights including:
- Right to know what personal information is collected
- Right to know if personal information is sold or disclosed
- Right to opt-out of the sale of personal information
- Right to non-discrimination

## 12. European Privacy Rights (GDPR)

European residents have additional rights including:
- Legal basis for processing
- Right to object to processing
- Right to lodge a complaint with supervisory authorities
- Right to withdraw consent

## 13. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes by:
- Posting the new policy on this page
- Updating the "Last Updated" date
- Sending you an email notification

## 14. Contact Us

If you have questions about this Privacy Policy, please contact us at:

Email: privacy@claimguardian.com
Address: ClaimGuardian, LLC
123 Main Street
Miami, FL 33101

Data Protection Officer: dpo@claimguardian.com',
  'We respect your privacy and protect your personal data. This policy explains how we collect, use, and safeguard your information, including how our AI features work with your data.',
  CURRENT_DATE,
  encode(sha256('privacy_policy_v1.0.0'::bytea), 'hex'),
  true,
  true
);

-- Terms of Service
INSERT INTO legal_documents (
  type,
  version,
  title,
  slug,
  content,
  summary,
  effective_date,
  sha256_hash,
  is_active,
  requires_acceptance
) VALUES (
  'terms_of_service',
  '1.0.0',
  'Terms of Service',
  'terms-of-service',
  E'# Terms of Service for ClaimGuardian

Last Updated: January 29, 2025

## 1. Agreement to Terms

By accessing or using ClaimGuardian ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.

## 2. Description of Service

ClaimGuardian is a platform that provides:
- Property claim management tools
- AI-powered damage assessment
- Document generation and management
- Insurance claim assistance
- Communication tools for claim processes

## 3. Eligibility

To use our Service, you must:
- Be at least 18 years old
- Have the legal capacity to enter into contracts
- Provide accurate and complete registration information
- Maintain the security of your account credentials

## 4. User Accounts

### Account Creation
- You must provide accurate, current, and complete information
- You are responsible for maintaining account security
- You must notify us immediately of any unauthorized access
- One person or entity may not maintain multiple accounts

### Account Termination
We may suspend or terminate accounts that:
- Violate these Terms
- Engage in fraudulent or illegal activities
- Remain inactive for extended periods
- Provide false information

## 5. Acceptable Use

You agree NOT to:
- Use the Service for illegal purposes
- Submit false or misleading information
- Interfere with or disrupt the Service
- Attempt to gain unauthorized access
- Reverse engineer or copy our technology
- Use automated systems without permission
- Harass, abuse, or harm others
- Violate intellectual property rights

## 6. Property and Claim Information

### Your Responsibilities
- Ensure you have rights to properties you add
- Provide accurate claim information
- Maintain current insurance information
- Update information as needed

### Our Rights
We may:
- Verify information you provide
- Remove inaccurate or fraudulent content
- Cooperate with insurance companies and authorities
- Use aggregated, anonymized data for improvements

## 7. AI Services and Limitations

### AI Features
Our AI-powered features are provided "as-is" and:
- Are tools to assist, not replace professional judgment
- May not be 100% accurate
- Should be verified by qualified professionals
- Are not substitutes for legal or insurance advice

### Limitations
You acknowledge that:
- AI recommendations are not guaranteed
- Results may vary based on input quality
- We are not liable for AI-generated content
- Professional review is recommended

## 8. Intellectual Property

### Our Property
The Service, including all content, features, and functionality is owned by ClaimGuardian and protected by intellectual property laws.

### Your License to Us
You grant us a license to use, modify, and display content you submit for:
- Providing the Service
- Improving our offerings
- Complying with legal obligations

### Your License from Us
We grant you a limited, non-exclusive, non-transferable license to access and use the Service for personal, non-commercial purposes.

## 9. Privacy and Data Protection

Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to our collection and use of information as detailed in the Privacy Policy.

## 10. Third-Party Services

The Service may contain links to or integrate with third-party services. We are not responsible for:
- Third-party content or services
- Privacy practices of third parties
- Any damages from third-party services

## 11. Disclaimers

THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING:
- MERCHANTABILITY
- FITNESS FOR A PARTICULAR PURPOSE
- NON-INFRINGEMENT
- ACCURACY OR COMPLETENESS

We do not warrant that:
- The Service will be uninterrupted or error-free
- Defects will be corrected
- The Service is free of viruses or harmful components

## 12. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLAIMGUARDIAN SHALL NOT BE LIABLE FOR:
- INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES
- LOSS OF PROFITS, DATA, USE, OR GOODWILL
- DAMAGES EXCEEDING $100 OR AMOUNTS PAID TO US IN THE PAST 12 MONTHS

## 13. Indemnification

You agree to indemnify and hold harmless ClaimGuardian from any claims, damages, or expenses arising from:
- Your use of the Service
- Your violation of these Terms
- Your violation of any rights of another
- Content you submit to the Service

## 14. Fees and Payment

### Subscription Fees
- Fees are specified in your subscription plan
- Payments are processed securely
- Fees are non-refundable except as required by law
- We may change fees with 30 days notice

### Free Tier
- Free features may be limited
- We may modify or discontinue free features
- No guarantee of continued free access

## 15. Modifications to Service

We reserve the right to:
- Modify or discontinue the Service
- Change features or functionality
- Update these Terms
- Alter pricing or plans

## 16. Governing Law and Disputes

### Governing Law
These Terms are governed by the laws of Florida, United States, without regard to conflict of law principles.

### Dispute Resolution
- First, try to resolve disputes informally
- If needed, binding arbitration in Miami, Florida
- No class actions or representative proceedings
- Small claims court is available

## 17. General Provisions

### Entire Agreement
These Terms constitute the entire agreement between you and ClaimGuardian.

### Severability
If any provision is found unenforceable, the remaining provisions continue in effect.

### Waiver
Our failure to enforce any right or provision is not a waiver.

### Assignment
You may not assign these Terms. We may assign our rights to any successor.

## 18. Contact Information

For questions about these Terms, contact us at:

Email: legal@claimguardian.com
Address: ClaimGuardian, LLC
123 Main Street
Miami, FL 33101

## 19. Special Terms for Florida Residents

As a Florida-based service, we comply with all applicable Florida laws regarding:
- Insurance claim assistance
- Property documentation
- Consumer protection
- Data privacy

By using ClaimGuardian, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.',
  'Terms and conditions for using ClaimGuardian. By using our service, you agree to these terms including acceptable use, AI limitations, and account responsibilities.',
  CURRENT_DATE,
  encode(sha256('terms_of_service_v1.0.0'::bytea), 'hex'),
  true,
  true
);

-- AI Use Agreement
INSERT INTO legal_documents (
  type,
  version,
  title,
  slug,
  content,
  summary,
  effective_date,
  sha256_hash,
  is_active,
  requires_acceptance
) VALUES (
  'ai_use_agreement',
  '1.0.0',
  'AI Use Agreement',
  'ai-use-agreement',
  E'# AI Use Agreement for ClaimGuardian

Last Updated: January 29, 2025

## 1. Introduction

This AI Use Agreement ("Agreement") governs your use of artificial intelligence features within ClaimGuardian. By using our AI features, you agree to these terms.

## 2. AI Features Overview

ClaimGuardian uses AI technology to provide:

### Damage Analysis
- Photo analysis for property damage assessment
- Severity estimation and categorization
- Damage pattern recognition
- Repair cost estimation

### Document Processing
- Insurance policy analysis and extraction
- Claim form auto-population
- Document summarization
- Key information highlighting

### Communication Assistance
- Email and letter drafting
- Insurance company correspondence
- Tone and clarity optimization
- Multi-language support

### Claim Intelligence
- Claim strategy recommendations
- Settlement analysis
- Timeline predictions
- Similar case insights

## 3. How AI Works with Your Data

### Data Processing
- Your data is processed securely on our servers
- We use industry-leading AI models from providers like OpenAI and Google
- Data is encrypted during transmission and processing
- Processing occurs in real-time when you use features

### Data Usage
- Your individual data is NOT used to train AI models
- Aggregated, anonymized insights may improve our service
- You maintain ownership of all your data
- We do not sell or share your data with AI providers

### Data Retention
- AI processing results are stored with your account
- Temporary processing data is deleted after use
- You can request deletion of AI-generated content
- Historical analyses are kept for your reference

## 4. Accuracy and Limitations

### Important Disclaimers
YOU ACKNOWLEDGE AND AGREE THAT:
- AI analyses are estimates and may contain errors
- AI cannot replace professional judgment
- Results should be verified by qualified professionals
- AI recommendations are not guaranteed

### Specific Limitations
- Damage assessments are preliminary estimates only
- Document extraction may miss or misinterpret information
- Generated content should be reviewed and edited
- AI cannot provide legal or insurance advice

## 5. Your Responsibilities

When using AI features, you agree to:
- Provide accurate input data and images
- Review and verify all AI-generated content
- Not rely solely on AI for critical decisions
- Report any significant errors or issues
- Use AI features ethically and legally

## 6. Prohibited Uses

You may NOT use AI features to:
- Generate false or fraudulent claims
- Misrepresent property damage
- Create misleading documentation
- Impersonate others
- Violate any laws or regulations
- Harm or deceive insurance companies
- Process data you don\'t have rights to

## 7. AI Provider Terms

Our AI features use third-party providers. By using these features, you also agree to:
- OpenAI\'s Usage Policies
- Google\'s AI Principles
- Other providers\' terms as applicable

We are not responsible for third-party AI services\' actions or policies.

## 8. Data Security and Privacy

### Security Measures
- End-to-end encryption for AI processing
- Secure API connections to AI providers
- Regular security audits
- Access controls and monitoring

### Privacy Protections
- No personal data in AI training
- Minimal data sent to AI providers
- Right to opt-out of AI features
- Transparent data handling

## 9. Intellectual Property

### Your Content
- You retain ownership of your input data
- You own the rights to use AI-generated content
- We have a license to process your data

### Our Technology
- Our AI integration and features are proprietary
- You may not reverse engineer our AI systems
- AI outputs are provided for your use only

## 10. Consent and Control

### Your Consent
By using AI features, you consent to:
- Automated processing of your data
- Use of third-party AI services
- Storage of AI-generated results

### Your Control
You can:
- Enable or disable AI features
- Choose which features to use
- Delete AI-generated content
- Export your data

## 11. Liability and Indemnification

### Our Liability
WE ARE NOT LIABLE FOR:
- Inaccurate AI analyses or recommendations
- Decisions based on AI output
- Third-party AI service issues
- Consequential damages from AI use

### Your Indemnification
You agree to indemnify us against claims arising from:
- Your misuse of AI features
- False or fraudulent content you create
- Violation of these terms
- Harm to third parties

## 12. Updates and Changes

We may update AI features by:
- Adding new capabilities
- Improving accuracy
- Changing AI providers
- Modifying these terms

Continued use after changes constitutes acceptance.

## 13. Termination

### Your Rights
You can stop using AI features at any time by:
- Disabling them in settings
- Requesting account deletion
- Contacting support

### Our Rights
We may restrict AI access for:
- Violation of terms
- Suspicious activity
- Technical issues
- Legal requirements

## 14. Support and Feedback

### Getting Help
- In-app help documentation
- Email: ai-support@claimguardian.com
- Report issues immediately

### Providing Feedback
We welcome feedback to improve AI features:
- Accuracy reports
- Feature suggestions
- Usability improvements

## 15. Compliance

Our AI use complies with:
- Florida insurance regulations
- Federal AI guidelines
- Industry best practices
- Ethical AI principles

## 16. Contact Information

For AI-related questions:

Email: ai-team@claimguardian.com
AI Ethics Officer: ethics@claimguardian.com
Address: ClaimGuardian, LLC
123 Main Street
Miami, FL 33101

By using ClaimGuardian\'s AI features, you acknowledge that you have read, understood, and agree to this AI Use Agreement.',
  'How we use AI to help with your insurance claims. This agreement covers AI features, data processing, accuracy limitations, and your rights regarding AI-powered assistance.',
  CURRENT_DATE,
  encode(sha256('ai_use_agreement_v1.0.0'::bytea), 'hex'),
  true,
  true
)
ON CONFLICT (type, version) DO UPDATE SET
  content = EXCLUDED.content,
  summary = EXCLUDED.summary,
  sha256_hash = EXCLUDED.sha256_hash,
  updated_at = NOW();
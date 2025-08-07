# Complete Florida Insurance Compliance & Data Capture Plan

## Overview

This document outlines all compliance requirements, data capture needs, and regulatory obligations for ClaimGuardian operating in Florida. It serves as the authoritative guide for implementing compliant user onboarding and data management.

## CRITICAL BLOCKERS (Must Have Before Launch)

### 1. Database Functions Required

These RPC functions are essential for consent management and compliance:

#### validate_signup_consent

- **Purpose**: Validates that all required consents are provided during signup
- **When Called**: During signup form submission, before user creation
- **Parameters**:
  - `terms_accepted: boolean`
  - `privacy_accepted: boolean`
  - `ai_disclaimer_accepted: boolean`
  - `age_verified: boolean`
  - `florida_resident: boolean`
- **Returns**: `{ valid: boolean, missing_consents: string[] }`
- **Critical**: Blocks user creation if any required consent is missing

#### link_consent_to_user

- **Purpose**: Associates consent records with newly created user
- **When Called**: Immediately after successful user creation
- **Parameters**:
  - `user_id: uuid`
  - `consent_data: ConsentRecord`
- **Returns**: `{ success: boolean, consent_id: uuid }`
- **Critical**: Creates audit trail for regulatory compliance

#### update_user_consent_preferences

- **Purpose**: Updates user consent preferences post-signup
- **When Called**: From user settings/preferences page
- **Parameters**:
  - `user_id: uuid`
  - `consent_type: string`
  - `granted: boolean`
  - `ip_address: string`
- **Returns**: `{ success: boolean, updated_at: timestamp }`

#### track_user_consent

- **Purpose**: Records all consent changes for audit trail
- **When Called**: Every time any consent status changes
- **Parameters**:
  - `user_id: uuid`
  - `consent_type: string`
  - `action: 'granted' | 'revoked'
  - `metadata: jsonb`
- **Returns**: `{ log_id: uuid, timestamp: timestamp }`

### 2. Legal Consent Requirements

#### AI Disclaimer (Florida-Specific)

- **Requirement**: Explicit acknowledgment that AI tools are assistive only
- **Text**: "I understand that ClaimGuardian's AI tools provide guidance and assistance but do not replace professional legal advice or licensed public adjusters."
- **Storage**: Must be timestamped and stored permanently
- **Display**: Must be prominent, not buried in terms

#### Age Verification (COPPA Compliance)

- **Method**: Simple checkbox declaration
- **Text**: "I confirm that I am 18 years of age or older"
- **Implementation**: Boolean check, blocks signup if false
- **Storage**: Timestamp of verification

#### Florida Residency

- **Method**: Checkbox + ZIP code validation
- **Text**: "I am a Florida resident with property in Florida"
- **Validation**: ZIP must match Florida patterns (32xxx-34xxx)
- **Why Required**: Service is Florida-specific due to insurance regulations

### 3. Cookie Consent (GDPR/CCPA)

- **Implementation**: Banner on first visit
- **Categories**:
  - Essential (always on)
  - Analytics (optional)
  - Marketing (optional)
- **Storage**: Local storage + database
- **Display**: Bottom of screen, dismissible

## COMPREHENSIVE DATA CAPTURE FLOW

### Phase 1: Launch Requirements (MUST HAVE)

```typescript
interface RequiredSignupData {
  // Personal Information
  email: string; // Primary identifier
  password: string; // Min 8 chars, complexity requirements
  firstName: string; // Legal first name
  lastName: string; // Legal last name
  phone: string; // For account recovery & 2FA

  // Legal Consents (Every Signup)
  termsAccepted: boolean; // Terms of Service
  privacyAccepted: boolean; // Privacy Policy
  aiDisclaimerAccepted: boolean; // AI tools disclaimer
  dataProcessingConsent: boolean; // GDPR requirement
  ageVerified: boolean; // 18+ confirmation

  // Florida-Specific
  floridaResident: boolean; // Residency confirmation
  propertyInFlorida: boolean; // Property location
  zipCode: string; // Validated FL ZIP

  // Security/Tracking
  signupIp: string; // For fraud detection
  signupTimestamp: timestamp; // Audit trail
  signupSource: string; // Marketing attribution
}
```

### Phase 2: Progressive Enhancement (Post-Signup)

```typescript
interface ProfileCompletionData {
  // Property Details (Collected after signup)
  properties: Array<{
    address: string;
    zipCode: string;
    county: string; // Auto-populated from ZIP
    ownershipType: "owned" | "rented" | "managed";
    isPrimary: boolean;
  }>;

  // Insurance Information
  insuranceCarrier?: string;
  policyNumber?: string;
  policyExpirationDate?: date;

  // Communication Preferences
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;

  // Emergency Contact (Optional but recommended)
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}
```

## FLORIDA INSURANCE REGULATIONS

### Required Legal Disclosures

#### 1. Public Adjuster Notice (FL Statute 626.854)

**When**: Before providing any claim assistance
**Required Text**:

```
IMPORTANT NOTICE: ClaimGuardian is not a licensed public adjuster.
Under Florida law, only licensed public adjusters can negotiate with
insurance companies on your behalf for a fee. Our AI tools provide
information and document organization only.
```

**Display**: Modal on first claim creation
**Acknowledgment**: Required checkbox

#### 2. Attorney Representation Disclosure

**When**: Before claim assistance
**Required Text**:

```
You have the right to hire an attorney at your own expense.
ClaimGuardian does not provide legal advice or representation.
For legal matters, please consult with a licensed Florida attorney.
```

**Display**: Same modal as above
**Acknowledgment**: Required checkbox

#### 3. Insurance Company Cooperation Notice

**When**: During claim process
**Required Text**:

```
Florida law requires you to cooperate with your insurance company's
investigation. Using ClaimGuardian does not change your obligations
under your insurance policy.
```

**Display**: Claim creation flow
**Acknowledgment**: Auto-acknowledged

#### 4. Data Retention Disclosure

**When**: During signup
**Required Text**:

```
Your claim data will be retained for 7 years per Florida insurance
regulations. You may request deletion of non-claim data per our
Privacy Policy.
```

**Display**: Privacy policy section
**Acknowledgment**: Part of privacy policy acceptance

### Regulatory Compliance Requirements

#### Eligibility Verification

- Must verify user has active insurance policy
- Cannot assist with fraudulent claims
- Must maintain audit trail of all actions

#### Waiting Periods

- No waiting periods required for information services
- If adding claim negotiation features: 48-hour cooling period

#### Audit Trail Requirements

- All user actions must be logged
- Consent changes tracked with timestamps
- Data access logs for regulatory reviews

## MOBILE-OPTIMIZED ONBOARDING FLOW

### Step 1: Welcome Screen

- Service overview
- "Get Started" button
- "Already have account? Sign In" link

### Step 2: Account Creation

```
Email: [___________]
Password: [___________]
Confirm Password: [___________]

[→] Password requirements displayed
[→] Real-time validation
```

### Step 3: Personal Information

```
First Name: [___________]
Last Name: [___________]
Phone: [___________]

[→] Phone format: (XXX) XXX-XXXX
[→] All fields required
```

### Step 4: Age & Residency Verification

```
□ I confirm that I am 18 years of age or older

□ I am a Florida resident

ZIP Code: [___________]
[→] Must be Florida ZIP (32xxx-34xxx)
```

### Step 5: Legal Consents

```
□ I accept the Terms of Service
□ I accept the Privacy Policy
□ I understand the AI Tools Disclaimer
□ I consent to data processing per GDPR

[View Terms] [View Privacy] [View AI Disclaimer]
```

### Step 6: Florida Insurance Disclosures

```
Please acknowledge the following:

□ I understand ClaimGuardian is not a public adjuster
□ I understand this is not legal advice
□ I will cooperate with my insurance company

[View Full Disclosures]
```

### Step 7: Account Verification

```
We've sent a verification code to:
(XXX) XXX-XXXX

Enter Code: [_] [_] [_] [_] [_] [_]

[Resend Code] [Use Email Instead]
```

### Step 8: Success & Next Steps

```
✓ Account Created Successfully!

Next Steps:
1. Add your property information
2. Upload your insurance policy
3. Start documenting your property

[Go to Dashboard] [Add Property Now]
```

## SECURITY & FRAUD PREVENTION

### Risk Scoring System

```typescript
interface RiskAssessment {
  score: number; // 0-100 (0 = low risk)
  factors: {
    emailDomainRisk: number; // Disposable email check
    phoneCarrierRisk: number; // VOIP detection
    geoLocationRisk: number; // VPN/Proxy detection
    behavioralRisk: number; // Speed, patterns
    deviceRisk: number; // New device, spoofing
  };

  actions: {
    requirePhoneVerification: boolean;
    requireEmailVerification: boolean;
    flagForReview: boolean;
    blockSignup: boolean;
  };
}
```

### Fraud Detection Signals

- Multiple accounts from same device
- Rapid form completion (< 30 seconds)
- Copy-paste patterns in text fields
- IP/ZIP code mismatch
- Known VPN/Proxy usage
- Disposable email addresses

## IMPLEMENTATION PRIORITIES

### Week 1: Critical Blockers

1. Create database functions (4 RPC functions)
2. Implement age verification checkbox
3. Add Florida residency validation
4. Create legal consent checkboxes
5. Build cookie consent banner

### Week 2: Enhanced Compliance

1. Add phone verification
2. Implement risk scoring
3. Create audit logging
4. Build disclosure modals
5. Add progressive profiling

### Week 3: Optimization

1. A/B test onboarding flow
2. Optimize for mobile
3. Add accessibility features
4. Implement analytics
5. Create admin dashboard

## TESTING CHECKLIST

### Compliance Testing

- [ ] All consents properly recorded
- [ ] Age verification blocks under-18
- [ ] Florida ZIP validation works
- [ ] Disclosures shown and acknowledged
- [ ] Audit trail complete

### Security Testing

- [ ] VPN detection functional
- [ ] Rate limiting in place
- [ ] SQL injection prevented
- [ ] XSS protection active
- [ ] CORS properly configured

### User Experience Testing

- [ ] Mobile responsive
- [ ] Form validation clear
- [ ] Error messages helpful
- [ ] Loading states smooth
- [ ] Success feedback clear

## REGULATORY CONTACTS

### Florida Department of Financial Services

- Insurance Consumer Helpline: 1-877-MY-FL-CFO
- Website: myfloridacfo.com

### Florida Office of Insurance Regulation

- Consumer Services: 1-877-MY-FL-CFO
- Website: floir.com

### Legal Counsel

- Maintain relationship with Florida insurance attorney
- Review all disclosures quarterly
- Update for regulatory changes

## MAINTENANCE & UPDATES

### Quarterly Reviews

- Regulatory changes
- Disclosure updates
- Consent flow optimization
- Security assessment

### Annual Audits

- Full compliance audit
- Penetration testing
- Legal review
- User feedback incorporation

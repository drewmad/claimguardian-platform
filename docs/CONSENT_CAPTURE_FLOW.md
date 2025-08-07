# Consent & Compliance Data Capture Flow

## Overview

This document details exactly what data is captured, when it's captured, and how often users need to provide consent.

## CONSENT CAPTURE TIMELINE

### 1. Initial Signup (Required Immediately)

These consents are captured during the signup process:

#### Terms of Service & Privacy Policy

- **When**: During signup form
- **Frequency**: Once at signup, re-consent if terms change
- **Storage**: Timestamped acceptance in user_consents table
- **Display**: Links to full documents, checkbox required

#### AI Disclaimer

- **When**: During signup form
- **Text**: "I understand that ClaimGuardian's AI tools provide guidance only and may contain errors. AI-generated content should be reviewed and verified. This is not a replacement for professional legal or insurance advice."
- **Frequency**: Once at signup, re-consent if AI capabilities significantly change
- **Legal Coverage**: Protects against reliance on AI errors, hallucinations, or misinterpretations

#### Age Verification

- **When**: During signup form
- **Method**: Simple checkbox "I confirm I am 18 years of age or older"
- **Why**: COPPA compliance, insurance regulations require adult consent
- **Frequency**: Once at signup
- **Note**: We do NOT collect date of birth to minimize PII

#### Data Processing Consent (GDPR)

- **When**: During signup form
- **Text**: "I consent to ClaimGuardian processing my personal data as described in the Privacy Policy"
- **Frequency**: Once at signup

### 2. Post-Signup Profile Completion

#### Florida Residency Verification

- **When**: After signup, when adding first property
- **Method**:
  1. User enters property address
  2. System validates ZIP code is in Florida (32xxx-34xxx)
  3. Optional: Geolocation verification when on property
- **Storage**: Address stored in properties table, FL resident flag in user profile
- **Frequency**: Once per property added
- **Alternative**: Billing address with "I am a Florida resident" toggle

### 3. Before First Claim Creation (Florida-Specific Disclosures)

These are shown in a modal before user can create their first claim:

#### Public Adjuster Notice (FL Statute 626.854)

- **When**: First claim creation attempt
- **Text**: "IMPORTANT: ClaimGuardian is NOT a licensed public adjuster. We cannot negotiate with insurance companies on your behalf for a fee. We provide information and document organization tools only."
- **Legal Requirement**: Florida law requires this disclosure

#### Legal Advice Disclaimer

- **When**: First claim creation attempt
- **Text**: "ClaimGuardian does not provide legal advice. For legal matters regarding your insurance claim, consult a licensed Florida attorney."
- **Legal Requirement**: Prevents unauthorized practice of law

#### Insurance Cooperation Notice

- **When**: First claim creation attempt
- **Text**: "You must continue to cooperate with your insurance company as required by your policy. Using ClaimGuardian does not change your policy obligations."
- **Legal Requirement**: Ensures policyholder compliance

### 4. Optional Consents (Can be set anytime)

#### Marketing Communications

- **When**: Profile settings page
- **Types**: Email marketing, SMS notifications
- **Default**: Opted out
- **Frequency**: Can change anytime

#### Analytics Cookies

- **When**: First site visit (cookie banner)
- **Default**: Essential only
- **Frequency**: Re-ask if policy changes

## DATA CAPTURE FREQUENCY

### One-Time Captures

- Age verification (signup)
- Initial terms acceptance (signup)
- AI disclaimer (signup)
- Florida insurance disclosures (first claim)

### Updated When Changed

- Privacy policy (if we update it)
- Terms of service (if we update it)
- Cookie preferences (user controlled)

### Per-Property Captures

- Property address (validates Florida location)
- Ownership verification

### Never Captured

- Date of birth (only 18+ verification)
- Social Security Number
- Driver's License (unless required for specific claim)

## DATABASE STRUCTURE EXPLANATION

### validate_signup_consent Function

This function checks that all required consents are provided before allowing signup:

- Returns `valid: true` only if ALL required consents are checked
- Lists any missing consents for the UI to highlight
- Florida-specific consents (adjuster notice, etc.) are DEFAULT false because they're shown AFTER signup

### link_consent_to_user Function

After successful user creation, this function:

1. Takes the user ID and consent choices
2. Creates records in user_consents table for each consent type
3. Logs the acceptance with timestamp and IP for audit trail
4. This creates a permanent record of what the user agreed to and when

### Consent Change Handling

When terms/policies update:

1. System detects user's consent version is outdated
2. User prompted to review and accept new terms on next login
3. Cannot use system until re-consent
4. Old consent kept in audit log, new consent recorded

## IMPLEMENTATION NOTES

### No Duplicate Tables

- Single `consent_types` table defines all consent types
- Single `user_consents` table tracks user acceptances
- Single `consent_audit_log` table for compliance history
- No duplication with existing schema

### Florida Residency Approach

```typescript
// Method 1: Property-based (Recommended)
When user adds property:
- Validate address is in Florida
- Set florida_resident flag
- Store in properties table

// Method 2: Billing address
In user profile:
- Billing address field
- "I am a Florida resident" checkbox
- Validate ZIP if checked

// Method 3: Geolocation (Supplementary)
When on mobile at property:
- Optional location verification
- Confirms user is in Florida
- Adds trust score
```

### Progressive Disclosure

Not all consents shown at once:

1. **Signup**: Only essential consents (terms, privacy, AI, age)
2. **Profile**: Add property/residency info
3. **First Claim**: Florida insurance disclosures
4. **Settings**: Optional marketing preferences

This reduces signup friction while maintaining compliance.

## LEGAL CONSIDERATIONS

### AI Disclaimer Importance

Given AI hallucination risks, the disclaimer must be:

- Prominent (not buried in terms)
- Specific about AI limitations
- Clear that human review is needed
- Repeated in AI tool interfaces

### Florida-Specific Requirements

Florida insurance law requires:

- Clear non-adjuster disclosure
- No appearance of legal advice
- Maintain policyholder obligations
- These shown before claim assistance begins

### Audit Trail

Every consent action logged with:

- Timestamp
- IP address
- User agent
- Previous/new value
- Required for regulatory compliance

## USER EXPERIENCE FLOW

```
SIGNUP PAGE:
✓ Email/Password
✓ I accept Terms of Service
✓ I accept Privacy Policy
✓ I understand AI limitations
✓ I am 18 or older
[Create Account]

PROFILE COMPLETION:
→ Add Your Property
  - Street Address [________]
  - City [________]
  - ZIP [_____] ← Validates Florida

FIRST CLAIM:
→ Important Notices (Modal)
  ✓ Not a public adjuster
  ✓ Not legal advice
  ✓ Must cooperate with insurer
  [I Understand]
```

This approach balances legal compliance with user experience, capturing only what's necessary when it's needed.

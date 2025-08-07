# Legal Compliance System Documentation

## Overview

ClaimGuardian implements a comprehensive legal compliance system that ensures every user's consent is tied to an immutable version of each legal document they saw at sign-up and whenever updates are published. This system is designed for GDPR, CCPA, and E-SIGN compliance.

## Key Features

### 1. **Immutable Document Versioning**
- Every legal document version is hashed with SHA-256
- Documents are stored with tamper-evident integrity checking
- Version-controlled with effective dates
- Automatic processing pipeline via GitHub Actions

### 2. **Consent Tracking with Audit Trail**
- Immutable consent records with full audit trail
- IP address and user agent logging for legal evidence
- Timestamp and signature data for each acceptance
- Unique request IDs for tracking

### 3. **Automated Document Processing**
- GitHub Actions workflow processes legal documents automatically
- Markdown to HTML conversion with minification
- SHA-256 hash generation for document integrity
- Automatic upload to Supabase Storage
- Database record creation with metadata

### 4. **Force Re-consent on Updates**
- System automatically detects when new document versions are published
- Users are required to accept updated terms before accessing protected features
- Legal guard components protect routes until consent is obtained

## Architecture

### Database Schema

#### Legal Documents Table
```sql
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL,
  title            TEXT NOT NULL,
  version          TEXT NOT NULL,
  effective_date   DATE NOT NULL,
  sha256_hash      TEXT NOT NULL,
  storage_url      TEXT NOT NULL,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),

  UNIQUE(slug, version),
  UNIQUE(sha256_hash)
);
```

#### User Consent Table
```sql
CREATE TABLE IF NOT EXISTS public.user_legal_acceptance (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_document_id UUID NOT NULL REFERENCES public.legal_documents(id),
  accepted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address        INET,
  user_agent        TEXT,
  signature_data    JSONB,

  UNIQUE(user_id, legal_document_id)
);
```

### Core Services

#### Legal Service (`/lib/legal/legal-service.ts`)
```typescript
class LegalService {
  // Get all active legal documents
  async getActiveLegalDocuments(): Promise<LegalDocument[]>

  // Get documents that need user acceptance
  async getDocumentsNeedingAcceptance(userId: string): Promise<LegalDocument[]>

  // Record user acceptance of documents
  async recordAcceptances(userId: string, acceptances: AcceptanceRequest[]): Promise<void>

  // Verify document integrity
  async verifyDocumentIntegrity(documentId: string): Promise<boolean>

  // Get client metadata for audit trail
  getClientMetadata(request: NextRequest): ClientMetadata
}
```

#### Legal Guard (`/lib/auth/legal-guard.tsx`)
```typescript
// Hook for checking legal consent
export function useLegalGuard(options: UseLegalGuardOptions) {
  const { hasConsent, checking } = useLegalGuard({
    redirectTo: '/legal/update',
    onConsentNeeded: (documentCount) => {
      console.log(`${documentCount} documents need acceptance`)
    }
  })
}

// Component for protecting routes
export function LegalGuard({ children, redirectTo, fallback }: LegalGuardProps) {
  // Automatically redirects to consent page if needed
}
```

### API Endpoints

#### GET `/api/legal/documents`
- **Purpose**: Fetch active legal documents or documents needing acceptance
- **Parameters**:
  - `userId` (optional): Filter to documents needing user acceptance
  - `mode`: 'all' for all documents, 'needed' for user-specific needs
- **Response**: Array of legal documents with metadata

#### POST `/api/legal/accept`
- **Purpose**: Record user acceptance of legal documents
- **Authentication**: Required (Bearer token)
- **Body**: Array of document acceptances with audit metadata
- **Response**: Success confirmation with acceptance count

### Frontend Components

#### Legal Consent Form (`/components/legal/legal-consent-form.tsx`)
```typescript
interface LegalConsentFormProps {
  documents: LegalDocument[]
  onAccept: (acceptances: AcceptanceRequest[]) => void
  loading?: boolean
}

// Displays legal documents with checkbox consent interface
// Handles user acceptance and submission
```

### GitHub Actions Workflow

#### Automated Processing (`.github/workflows/legal-docs.yml`)
1. **Validation**: Validates markdown syntax for all legal documents
2. **Diff Generation**: Shows changes in pull requests
3. **Processing**: Converts markdown to minified HTML
4. **Hashing**: Generates SHA-256 hashes for integrity
5. **Storage**: Uploads to Supabase Storage with hash-based naming
6. **Database**: Creates database records with metadata
7. **Activation**: Sets latest versions as active

### Document Format

Legal documents must be stored in `/legal/` directory with frontmatter:

```markdown
---
title: Privacy Policy
version: v2025-01-09
effective_date: 2025-01-09
slug: privacy-policy
---

# Privacy Policy Content...
```

## Implementation Guide

### 1. Setup Database Schema
```bash
# Run the legal documents migration
supabase migration up --file 20240109_legal_documents.sql
```

### 2. Configure GitHub Actions
Add these secrets to your GitHub repository:
- `SUPABASE_ACCESS_TOKEN`: Supabase service role key
- `SUPABASE_PROJECT_REF`: Your Supabase project reference
- `SUPABASE_DB_PASSWORD`: Database password

### 3. Add Legal Documents
1. Create legal documents in `/legal/` directory
2. Include required frontmatter metadata
3. Commit and push to trigger automated processing

### 4. Integrate Legal Guards
```typescript
// Protect routes requiring legal consent
import { LegalGuard } from '@/lib/auth/legal-guard'

export default function ProtectedPage() {
  return (
    <LegalGuard redirectTo="/legal/consent">
      <YourProtectedContent />
    </LegalGuard>
  )
}
```

### 5. Handle Consent in User Flows
```typescript
// Check if user needs to accept documents
import { useLegalGuard } from '@/lib/auth/legal-guard'

const { hasConsent, checking } = useLegalGuard({
  onConsentNeeded: (count) => {
    // Redirect to consent page or show modal
  }
})
```

## Compliance Features

### GDPR Compliance
- ✅ Explicit consent tracking
- ✅ Right to withdraw consent
- ✅ Data processing transparency
- ✅ Audit trail for regulatory requirements
- ✅ Document version control

### CCPA Compliance
- ✅ Clear disclosure of data practices
- ✅ Consent tracking for data collection
- ✅ Audit trail for compliance verification
- ✅ User rights documentation

### E-SIGN Compliance
- ✅ Electronic signature capture (checkbox consent)
- ✅ Intent to sign verification
- ✅ Document integrity with SHA-256 hashing
- ✅ Complete audit trail with timestamps
- ✅ Signer identification (user authentication)

## Security Features

### Document Integrity
- **SHA-256 Hashing**: Every document version is hashed for tamper detection
- **Immutable Storage**: Documents are stored with content-based naming
- **Version Control**: Full history of document changes
- **Automated Verification**: Integrity checking on document retrieval

### Audit Trail
- **IP Address Logging**: Legal evidence of consent location
- **User Agent Tracking**: Device/browser information for context
- **Timestamp Recording**: Precise consent timing
- **Request Tracking**: Unique IDs for each consent action
- **Signature Data**: Additional metadata for legal validity

### Access Control
- **Authenticated Consent**: Only authenticated users can provide consent
- **Route Protection**: Legal guards prevent access until consent obtained
- **Session Integration**: Consent checking integrated with authentication

## Testing Guide

### 1. Document Processing
```bash
# Test document validation
git add legal/test-document.md
git commit -m "Add test legal document"
git push

# Verify GitHub Actions processes correctly
# Check Supabase Storage for uploaded document
# Verify database record creation
```

### 2. Consent Flow
```typescript
// Test consent checking
const documents = await legalService.getDocumentsNeedingAcceptance(userId)
console.log('Documents needing consent:', documents.length)

// Test consent recording
await legalService.recordAcceptances(userId, acceptances)

// Verify consent was recorded
const remainingDocs = await legalService.getDocumentsNeedingAcceptance(userId)
console.log('Remaining documents:', remainingDocs.length)
```

### 3. Legal Guard Protection
```typescript
// Test route protection
// 1. Access protected route without consent (should redirect)
// 2. Accept documents and access route (should allow)
// 3. Update document and access route (should require re-consent)
```

## Monitoring and Analytics

### Consent Metrics
- Track consent completion rates
- Monitor document access patterns
- Analyze user consent behavior
- Report on compliance metrics

### Document Analytics
- Document view/acceptance ratios
- Time to consent completion
- Document version adoption rates
- User consent journey mapping

### Compliance Reporting
```sql
-- Consent completion rate
SELECT
  COUNT(DISTINCT ua.user_id) as users_consented,
  COUNT(DISTINCT u.id) as total_users,
  (COUNT(DISTINCT ua.user_id)::float / COUNT(DISTINCT u.id) * 100) as consent_rate
FROM auth.users u
LEFT JOIN user_legal_acceptance ua ON u.id = ua.user_id;

-- Document version adoption
SELECT
  ld.slug,
  ld.version,
  COUNT(ua.id) as acceptances,
  ld.effective_date
FROM legal_documents ld
LEFT JOIN user_legal_acceptance ua ON ld.id = ua.legal_document_id
WHERE ld.is_active = true
GROUP BY ld.slug, ld.version, ld.effective_date
ORDER BY ld.slug, ld.effective_date DESC;
```

## Deployment Checklist

### Pre-Deployment
- [ ] Database migrations applied
- [ ] Supabase Storage bucket configured
- [ ] GitHub Actions secrets configured
- [ ] Legal documents created with proper frontmatter
- [ ] RLS policies tested

### Post-Deployment
- [ ] Document processing workflow tested
- [ ] Consent flow tested end-to-end
- [ ] Legal guard protection verified
- [ ] Audit trail data verified
- [ ] Compliance reporting tested

### Ongoing Maintenance
- [ ] Regular document integrity verification
- [ ] Compliance metrics monitoring
- [ ] Legal document updates processed
- [ ] User consent data backed up
- [ ] Audit trail data retention managed

## Troubleshooting

### Common Issues

#### Document Processing Fails
- Check GitHub Actions logs for errors
- Verify markdown syntax is valid
- Ensure frontmatter metadata is complete
- Check Supabase Storage permissions

#### Consent Not Recording
- Verify API authentication is working
- Check database connectivity
- Ensure RLS policies allow user operations
- Validate request payload format

#### Legal Guard Not Protecting Routes
- Verify legal guard is properly wrapped around components
- Check authentication state is available
- Ensure legal service is functioning
- Validate redirect paths are correct

### Debug Queries
```sql
-- Check document processing status
SELECT slug, version, sha256_hash, storage_url, is_active
FROM legal_documents
ORDER BY slug, effective_date DESC;

-- Check user consent status
SELECT u.email, ld.slug, ld.version, ua.accepted_at
FROM auth.users u
LEFT JOIN user_legal_acceptance ua ON u.id = ua.user_id
LEFT JOIN legal_documents ld ON ua.legal_document_id = ld.id
WHERE u.id = 'user-id-here';

-- Find users needing consent
SELECT DISTINCT u.id, u.email
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_legal_acceptance ua
  JOIN legal_documents ld ON ua.legal_document_id = ld.id
  WHERE ua.user_id = u.id AND ld.is_active = true
);
```

## Legal Considerations

### Data Retention
- Consent records must be retained per legal requirements
- Document versions must be preserved for audit purposes
- IP addresses may have privacy implications in some jurisdictions
- User agent data should be handled according to privacy policies

### Jurisdictional Compliance
- Review local laws for electronic consent requirements
- Ensure document retention periods meet regulatory needs
- Consider cross-border data transfer implications
- Validate signature requirements for your jurisdiction

### Audit Readiness
- Maintain complete audit trails for regulatory inspections
- Ensure data integrity can be cryptographically verified
- Document consent processes for legal review
- Prepare compliance reports for regulatory authorities

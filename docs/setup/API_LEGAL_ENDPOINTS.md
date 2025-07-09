# Legal Compliance API Documentation

## Overview

The Legal Compliance API provides endpoints for managing legal document consent and compliance tracking. These endpoints support the immutable consent tracking system with full audit trail capabilities.

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### GET `/api/legal/documents`

Retrieve legal documents that are active or need user acceptance.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | No | Filter to documents needing this user's acceptance |
| `mode` | string | No | 'all' for all active documents, 'needed' for user-specific |

#### Request Examples

```bash
# Get all active legal documents
curl -X GET "https://your-app.com/api/legal/documents"

# Get documents needing user acceptance
curl -X GET "https://your-app.com/api/legal/documents?userId=123&mode=needed"
```

#### Response Format

```typescript
{
  documents: LegalDocument[],
  count: number,
  timestamp: string
}

interface LegalDocument {
  id: string
  slug: string
  title: string
  version: string
  effective_date: string
  sha256_hash: string
  storage_url: string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

#### Response Examples

```json
{
  "documents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "slug": "terms-of-service",
      "title": "Terms of Service",
      "version": "v2025-01-09",
      "effective_date": "2025-01-09",
      "sha256_hash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
      "storage_url": "https://project.supabase.co/storage/v1/object/public/legal/a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3.html",
      "is_active": true,
      "created_at": "2025-01-09T10:00:00Z",
      "updated_at": "2025-01-09T10:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "slug": "privacy-policy",
      "title": "Privacy Policy", 
      "version": "v2025-01-09",
      "effective_date": "2025-01-09",
      "sha256_hash": "b775a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae4",
      "storage_url": "https://project.supabase.co/storage/v1/object/public/legal/b775a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae4.html",
      "is_active": true,
      "created_at": "2025-01-09T10:00:00Z",
      "updated_at": "2025-01-09T10:00:00Z"
    }
  ],
  "count": 2,
  "timestamp": "2025-01-09T14:30:00Z"
}
```

#### Status Codes

| Code | Description |
|------|-------------|
| 200 | Success - Documents retrieved |
| 400 | Bad Request - Invalid parameters |
| 500 | Internal Server Error |

#### Caching

- Response is cached for 5 minutes (`Cache-Control: public, max-age=300, stale-while-revalidate=60`)
- Stale responses may be served while revalidating

---

### POST `/api/legal/accept`

Record user acceptance of legal documents with full audit trail.

#### Authentication

**Required**: Bearer token in Authorization header

#### Request Format

```typescript
{
  acceptances: AcceptanceRequest[]
}

interface AcceptanceRequest {
  legal_id: string  // Legal document ID
}
```

#### Request Example

```bash
curl -X POST "https://your-app.com/api/legal/accept" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "acceptances": [
      { "legal_id": "550e8400-e29b-41d4-a716-446655440000" },
      { "legal_id": "550e8400-e29b-41d4-a716-446655440001" }
    ]
  }'
```

#### Audit Trail Data (Automatically Captured)

The system automatically captures the following audit trail data:

| Field | Source | Description |
|-------|--------|-------------|
| `ip_address` | Request headers | Client IP address for legal evidence |
| `user_agent` | Request headers | Browser/device information |
| `timestamp` | Server | Precise acceptance time (ISO 8601) |
| `request_id` | Generated | Unique identifier for tracking |
| `user_agent_hash` | Computed | SHA-256 hash of user agent for privacy |

#### Response Format

```typescript
{
  success: boolean,
  accepted_count: number,
  timestamp: string
}
```

#### Response Example

```json
{
  "success": true,
  "accepted_count": 2,
  "timestamp": "2025-01-09T14:35:00Z"
}
```

#### Status Codes

| Code | Description |
|------|-------------|
| 200 | Success - Acceptances recorded |
| 400 | Bad Request - Invalid request body |
| 401 | Unauthorized - Authentication required |
| 500 | Internal Server Error |

#### Error Responses

```json
{
  "error": "Authentication required"
}
```

```json
{
  "error": "Invalid request body. Expected acceptances array."
}
```

```json
{
  "error": "No acceptances provided"
}
```

## Integration Examples

### Frontend Integration

#### React Hook Usage

```typescript
import { useState } from 'react'

function useLegalDocuments() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchDocuments = async (userId?: string, mode = 'all') => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (userId) params.set('userId', userId)
      if (mode) params.set('mode', mode)
      
      const response = await fetch(`/api/legal/documents?${params}`)
      const data = await response.json()
      setDocuments(data.documents)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const acceptDocuments = async (documentIds: string[]) => {
    const response = await fetch('/api/legal/accept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        acceptances: documentIds.map(id => ({ legal_id: id }))
      })
    })

    if (!response.ok) {
      throw new Error('Failed to record acceptances')
    }

    return response.json()
  }

  return { documents, loading, fetchDocuments, acceptDocuments }
}
```

#### Complete Consent Flow

```typescript
import { useAuth } from '@/components/auth/auth-provider'
import { useLegalDocuments } from '@/hooks/use-legal-documents'

function ConsentPage() {
  const { user } = useAuth()
  const { documents, loading, fetchDocuments, acceptDocuments } = useLegalDocuments()
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchDocuments(user.id, 'needed')
    }
  }, [user?.id])

  const handleAcceptAll = async () => {
    setAccepting(true)
    try {
      await acceptDocuments(documents.map(doc => doc.id))
      // Redirect to protected content
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to accept documents:', error)
    } finally {
      setAccepting(false)
    }
  }

  if (loading) return <div>Loading legal documents...</div>
  if (documents.length === 0) return <div>No documents require acceptance</div>

  return (
    <div>
      <h1>Legal Documents Require Your Acceptance</h1>
      {documents.map(doc => (
        <div key={doc.id}>
          <h2>{doc.title} ({doc.version})</h2>
          <iframe src={doc.storage_url} />
        </div>
      ))}
      <button onClick={handleAcceptAll} disabled={accepting}>
        {accepting ? 'Recording Acceptance...' : 'Accept All Documents'}
      </button>
    </div>
  )
}
```

### Backend Integration

#### Service Integration

```typescript
import { legalService } from '@/lib/legal/legal-service'

// Check if user needs to accept documents
export async function checkUserCompliance(userId: string) {
  const outstandingDocs = await legalService.getDocumentsNeedingAcceptance(userId)
  
  return {
    isCompliant: outstandingDocs.length === 0,
    outstandingDocuments: outstandingDocs,
    requiresAction: outstandingDocs.length > 0
  }
}

// Middleware to enforce legal compliance
export function requireLegalCompliance(handler: NextApiHandler) {
  return async (req: NextRequest, res: NextResponse) => {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.redirect('/login')
    }

    const compliance = await checkUserCompliance(user.id)
    if (!compliance.isCompliant) {
      return NextResponse.redirect('/legal/consent')
    }

    return handler(req, res)
  }
}
```

#### Database Queries

```typescript
// Get user acceptance status
export async function getUserAcceptanceStatus(userId: string) {
  const { data, error } = await supabase
    .from('user_legal_acceptance')
    .select(`
      *,
      legal_documents (
        slug,
        title,
        version,
        effective_date
      )
    `)
    .eq('user_id', userId)

  return { data, error }
}

// Get compliance report
export async function getComplianceReport() {
  const { data, error } = await supabase.rpc('get_compliance_report')
  return { data, error }
}
```

## Rate Limiting

### Current Limits

| Endpoint | Rate Limit | Window |
|----------|------------|---------|
| GET `/api/legal/documents` | 100 requests | 1 minute |
| POST `/api/legal/accept` | 10 requests | 1 minute |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641024000
```

## Security Considerations

### Input Validation

- All document IDs are validated as UUIDs
- Request payloads are sanitized
- SQL injection protection via parameterized queries

### Audit Trail Integrity

- IP addresses are logged for legal evidence
- User agents are hashed for privacy compliance
- Timestamps use server time to prevent manipulation
- Request IDs enable tracking and debugging

### Data Privacy

- User agent strings are hashed with SHA-256
- IP addresses may be anonymized based on configuration
- Personal data handling follows GDPR guidelines

## Error Handling

### Error Response Format

```typescript
{
  error: string,
  code?: string,
  details?: object
}
```

### Common Error Scenarios

| Scenario | Status | Error Message |
|----------|--------|---------------|
| Missing auth token | 401 | "Authentication required" |
| Invalid token | 401 | "Invalid authentication token" |
| Invalid document ID | 400 | "Invalid document ID format" |
| Document not found | 404 | "Legal document not found" |
| Database error | 500 | "Internal server error" |
| Network timeout | 500 | "Request timeout" |

## Testing Guide

### Unit Tests

```typescript
// Test document retrieval
describe('GET /api/legal/documents', () => {
  test('returns active documents', async () => {
    const response = await request(app)
      .get('/api/legal/documents')
      .expect(200)
    
    expect(response.body.documents).toBeInstanceOf(Array)
    expect(response.body.count).toBeGreaterThan(0)
  })

  test('filters documents by user', async () => {
    const response = await request(app)
      .get('/api/legal/documents?userId=123&mode=needed')
      .expect(200)
    
    expect(response.body.documents).toBeInstanceOf(Array)
  })
})

// Test consent recording
describe('POST /api/legal/accept', () => {
  test('records acceptances with auth', async () => {
    const response = await request(app)
      .post('/api/legal/accept')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        acceptances: [{ legal_id: 'valid-uuid' }]
      })
      .expect(200)
    
    expect(response.body.success).toBe(true)
    expect(response.body.accepted_count).toBe(1)
  })

  test('rejects without auth', async () => {
    await request(app)
      .post('/api/legal/accept')
      .send({
        acceptances: [{ legal_id: 'valid-uuid' }]
      })
      .expect(401)
  })
})
```

### Integration Tests

```typescript
// Test complete consent flow
test('complete consent flow', async () => {
  // 1. Get documents needing acceptance
  const documentsResponse = await fetch('/api/legal/documents?userId=123&mode=needed')
  const { documents } = await documentsResponse.json()
  
  // 2. Record acceptance
  const acceptResponse = await fetch('/api/legal/accept', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      acceptances: documents.map(doc => ({ legal_id: doc.id }))
    })
  })
  
  const acceptResult = await acceptResponse.json()
  expect(acceptResult.success).toBe(true)
  
  // 3. Verify no documents need acceptance
  const verifyResponse = await fetch('/api/legal/documents?userId=123&mode=needed')
  const { documents: remainingDocs } = await verifyResponse.json()
  expect(remainingDocs).toHaveLength(0)
})
```

## Performance Considerations

### Caching Strategy

- Document list responses cached for 5 minutes
- Individual document content cached at CDN level
- Database queries optimized with proper indexes

### Database Optimization

```sql
-- Indexes for performance
CREATE INDEX idx_legal_documents_active ON legal_documents(is_active, effective_date);
CREATE INDEX idx_user_acceptance_user ON user_legal_acceptance(user_id);
CREATE INDEX idx_user_acceptance_doc ON user_legal_acceptance(legal_document_id);
```

### Monitoring

- API response times tracked
- Database query performance monitored
- Error rates and patterns analyzed
- User consent completion metrics

## Compliance Features

### GDPR Compliance

- ✅ Explicit consent tracking
- ✅ Consent withdrawal support
- ✅ Data subject access rights
- ✅ Audit trail maintenance

### CCPA Compliance

- ✅ Clear consent disclosure
- ✅ Opt-out mechanisms
- ✅ Data usage transparency
- ✅ Consumer rights support

### E-SIGN Compliance

- ✅ Electronic signature validity
- ✅ Document integrity verification
- ✅ Audit trail completeness
- ✅ Intent verification
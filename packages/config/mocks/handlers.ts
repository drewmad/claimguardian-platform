/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
import { http, HttpResponse } from 'msw'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmlrvecuwgppbaynesji.supabase.co'

export const handlers = [
  // Auth endpoints
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        role: 'authenticated'
      }
    })
  }),

  // Properties endpoints
  http.get(`${SUPABASE_URL}/rest/v1/properties`, () => {
    return HttpResponse.json([
      {
        id: '1',
        user_id: 'mock-user-id',
        address: '123 Test St, Miami, FL 33101',
        property_type: 'single_family',
        year_built: 2000,
        square_footage: 2000,
        created_at: new Date().toISOString()
      }
    ])
  }),

  // Claims endpoints
  http.get(`${SUPABASE_URL}/rest/v1/claims`, () => {
    return HttpResponse.json([
      {
        id: '1',
        property_id: '1',
        claim_number: 'CLM-2024-001',
        status: 'submitted',
        damage_type: 'hurricane',
        created_at: new Date().toISOString()
      }
    ])
  }),

  // AI endpoints
  http.post(`${SUPABASE_URL}/functions/v1/ai-document-extraction`, async ({ request }) => {
    const body = await request.json()
    
    return HttpResponse.json({
      success: true,
      data: {
        policyNumber: 'POL-123456',
        carrierName: 'Test Insurance Co',
        coverageAmount: 500000,
        confidence: 0.95
      },
      processingTime: 1500
    })
  }),

  // Storage endpoints
  http.post(`${SUPABASE_URL}/storage/v1/object/documents/*`, () => {
    return HttpResponse.json({
      Key: 'documents/test-file.pdf',
      path: 'documents/test-file.pdf'
    })
  }),

  // Generic error handler for unhandled requests
  http.all('*', ({ request }) => {
    console.error(`Unhandled ${request.method} request to ${request.url}`)
    return new HttpResponse(null, { status: 404 })
  })
]
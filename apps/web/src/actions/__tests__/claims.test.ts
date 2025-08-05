/**
 * @fileMetadata
 * @purpose "Tests for claims management server actions"
 * @owner claims-team
 * @dependencies ["vitest", "@claimguardian/db", "@claimguardian/utils"]
 * @exports []
 * @complexity high
 * @tags ["test", "claims", "server-actions", "database"]
 * @status stable
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T22:40:00Z
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { 
  createClaim, 
  updateClaim, 
  deleteClaim, 
  getClaim, 
  getUserClaims,
  uploadClaimDocument,
  generateClaimReport
} from '../claims'
import { createSupabaseMock, type MockSupabaseClient } from '../../../__tests__/utils/supabase-mocks'

// Mock dependencies
jest.mock('@claimguardian/db', () => ({
  createClient: jest.fn(),
  createServerSupabaseClient: jest.fn()
}))

jest.mock('@claimguardian/utils', () => ({
  toError: jest.fn((error) => error instanceof Error ? error : new Error(String(error)))
}))

// Create mock user
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated'
}

// Create properly typed mock with backward compatibility
let mockSupabase: MockSupabaseClient & { _mockQuery: unknown }

describe('Claims Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = createSupabaseMock()
  })

  describe('createClaim', () => {
    const validClaimData = {
      propertyId: 'prop-123',
      claimType: 'water_damage',
      description: 'Burst pipe caused flooding in basement',
      incidentDate: '2024-03-15T10:00:00Z'
    }

    it('should create a claim successfully', async () => {
      const mockClaimResponse = {
        id: 'claim-456',
        user_id: 'user-123',
        property_id: 'prop-123',
        claim_type: 'water_damage',
        description: 'Burst pipe caused flooding in basement',
        incident_date: '2024-03-15T10:00:00Z',
        status: 'draft',
        created_at: '2024-03-15T10:00:00Z'
      }

      mockSupabase._mockQuery.single.mockResolvedValue({ 
        data: mockClaimResponse, 
        error: null 
      })

      const result = await createClaim(validClaimData)

      expect(result.success).toBe(true)
      expect(result.data?.id).toBe('claim-456')
      expect(result.data?.status).toBe('draft')
      expect(mockSupabase.from).toHaveBeenCalledWith('claims')
    })

    it('should handle database errors', async () => {
      mockSupabase._mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Property not found' }
      })

      const result = await createClaim(validClaimData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Property not found')
    })

    it('should handle unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      } as any)

      const result = await createClaim(validClaimData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required')
    })
  })

  describe('updateClaim', () => {
    const updateData = {
      claimId: 'claim-456',
      updates: {
        description: 'Updated description',
        status: 'investigating' as const
      }
    }

    it('should update claim successfully', async () => {
      const mockUpdatedClaim = {
        id: 'claim-456',
        description: 'Updated description',
        status: 'investigating',
        updated_at: '2024-03-15T12:00:00Z'
      }

      mockSupabase._mockQuery.single.mockResolvedValue({
        data: mockUpdatedClaim,
        error: null
      })

      const result = await updateClaim(updateData)

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('investigating')
      expect(mockSupabase._mockQuery.eq).toHaveBeenCalledWith('id', 'claim-456')
      expect(mockSupabase._mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })

    it('should validate claim ownership', async () => {
      mockSupabase._mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Claim not found or access denied' }
      })

      const result = await updateClaim(updateData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Claim not found or access denied')
    })
  })

  describe('getClaim', () => {
    it('should retrieve claim with full details', async () => {
      const mockClaimWithProperty = {
        id: 'claim-456',
        description: 'Test claim',
        properties: {
          id: 'prop-123',
          name: 'Test Property',
          address: '123 Main St'
        }
      }

      mockSupabase._mockQuery.single.mockResolvedValue({
        data: mockClaimWithProperty,
        error: null
      })

      const result = await getClaim({ claimId: 'claim-456' })

      expect(result.success).toBe(true)
      expect(result.data?.id).toBe('claim-456')
      expect(result.data?.properties).toBeDefined()
      expect(mockSupabase._mockQuery.select).toHaveBeenCalledWith(expect.stringContaining('properties'))
    })

    it('should handle claim not found', async () => {
      mockSupabase._mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Claim not found' }
      })

      const result = await getClaim({ claimId: 'nonexistent' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Claim not found')
    })
  })

  describe('getUserClaims', () => {
    it('should retrieve user claims with pagination', async () => {
      const mockClaims = [
        { id: 'claim-1', description: 'Claim 1' },
        { id: 'claim-2', description: 'Claim 2' }
      ]

      mockSupabase._mockQuery.order.mockResolvedValue({
        data: mockClaims,
        error: null
      })

      const result = await getUserClaims()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(mockSupabase._mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })
  })

  describe('uploadClaimDocument', () => {
    // Create a proper File mock for Node.js environment
    const mockFile = {
      name: 'test.pdf',
      size: 1024,
      type: 'application/pdf'
    } as File

    const uploadData = {
      claimId: 'claim-456',
      file: mockFile,
      documentType: 'repair_estimate'
    }

    it('should upload document successfully', async () => {
      const mockDocResponse = {
        id: 'doc-789',
        claim_id: 'claim-456',
        file_name: 'test.pdf',
        file_url: 'https://example.com/file.pdf'
      }

      // Mock storage upload
      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'claim-456/repair_estimate/123-test.pdf' },
        error: null
      })

      const mockStorageFrom = jest.fn().mockReturnValue({
        upload: mockUpload,
        getPublicUrl: jest.fn().mockReturnValue({ 
          data: { publicUrl: 'https://example.com/file.pdf' } 
        })
      })

      ;(mockSupabase.storage.from as jest.Mock) = mockStorageFrom

      // Mock database insert for document record
      mockSupabase._mockQuery.single.mockResolvedValue({
        data: mockDocResponse,
        error: null
      })

      const result = await uploadClaimDocument(uploadData)

      expect(result.success).toBe(true)
      expect(result.data?.id).toBe('doc-789')
      expect(mockStorageFrom).toHaveBeenCalledWith('claim-documents')
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining('claim-456/repair_estimate'),
        mockFile
      )
    })
  })

  describe('generateClaimReport', () => {
    it('should generate comprehensive claim report', async () => {
      const mockClaimWithDetails = {
        id: 'claim-456',
        description: 'Test claim',
        estimated_amount: 15000,
        status: 'submitted',
        properties: { id: 'prop-123', name: 'Test Property' },
        claim_documents: [
          { id: 'doc-1', document_type: 'photo' },
          { id: 'doc-2', document_type: 'estimate' }
        ]
      }

      mockSupabase._mockQuery.single.mockResolvedValue({
        data: mockClaimWithDetails,
        error: null
      })

      const result = await generateClaimReport({ claimId: 'claim-456' })

      expect(result.success).toBe(true)
      expect(result.data?.summary).toBeDefined()
      expect(result.data?.recommendations).toBeInstanceOf(Array)
    })

    it('should handle claims without documents', async () => {
      const mockClaimNoDocuments = {
        id: 'claim-456',
        description: 'Test claim',
        estimated_amount: 15000,
        status: 'draft',
        properties: { id: 'prop-123', name: 'Test Property' },
        claim_documents: []
      }

      mockSupabase._mockQuery.single.mockResolvedValue({
        data: mockClaimNoDocuments,
        error: null
      })

      const result = await generateClaimReport({ claimId: 'claim-456' })

      expect(result.success).toBe(true)
      expect((result.data as any)?.summary?.totalDocuments).toBe(0)
      expect(result.data?.recommendations).toBeInstanceOf(Array)
    })
  })

  describe('deleteClaim', () => {
    it('should delete claim successfully', async () => {
      // Create a separate chainable object
      const chainableEq = { eq: jest.fn().mockResolvedValue({ error: null }) }
      const mockEq = jest.fn().mockReturnValue(chainableEq)
      
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq })
      ;(mockSupabase._mockQuery.delete as jest.Mock) = mockDelete

      const result = await deleteClaim({ claimId: 'claim-456' })

      expect(result.success).toBe(true)
      expect(result.data?.message).toBe('Claim deleted successfully')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', 'claim-456')
      expect(chainableEq.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })
  })
})
/**
 * @fileMetadata
 * @purpose Tests for claims management server actions
 * @owner claims-team
 * @dependencies ["vitest", "@claimguardian/db", "@claimguardian/utils"]
 * @exports []
 * @complexity high
 * @tags ["test", "claims", "server-actions", "database"]
 * @status active
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T20:45:00Z
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  createClaim, 
  updateClaim, 
  deleteClaim, 
  getClaim, 
  getUserClaims,
  uploadClaimDocument,
  generateClaimReport
} from '../claims'
import { createServerSupabaseClient } from '@claimguardian/db'

// Mock Supabase client
vi.mock('@claimguardian/db', () => ({
  createServerSupabaseClient: vi.fn()
}))

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis()
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn()
    }))
  },
  auth: {
    getUser: vi.fn()
  }
}

describe('Claims Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createServerSupabaseClient as any).mockReturnValue(mockSupabase)
  })

  describe('createClaim', () => {
    const validClaimData = {
      property_id: 'prop-123',
      incident_date: '2024-03-15',
      damage_type: 'water_damage',
      description: 'Burst pipe caused flooding in basement',
      estimated_damages: 15000,
      policy_number: 'POL-789012'
    }

    it('should create a claim successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockClaimResponse = {
        id: 'claim-456',
        ...validClaimData,
        user_id: 'user-123',
        status: 'submitted',
        created_at: '2024-03-15T10:00:00Z'
      }

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.from().insert().single.mockResolvedValue({ 
        data: mockClaimResponse, 
        error: null 
      })

      const result = await createClaim(validClaimData)

      expect(result.success).toBe(true)
      expect(result.data?.id).toBe('claim-456')
      expect(result.data?.status).toBe('submitted')
      expect(mockSupabase.from).toHaveBeenCalledWith('claims')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        ...validClaimData,
        user_id: 'user-123',
        status: 'submitted'
      })
    })

    it('should validate required fields', async () => {
      const invalidClaimData = {
        property_id: '',
        incident_date: '',
        damage_type: '',
        description: ''
      }

      const result = await createClaim(invalidClaimData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('property_id is required')
    })

    it('should validate damage type enum', async () => {
      const invalidClaimData = {
        ...validClaimData,
        damage_type: 'invalid_damage_type'
      }

      const result = await createClaim(invalidClaimData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid damage type')
    })

    it('should validate estimated damages range', async () => {
      const invalidClaimData = {
        ...validClaimData,
        estimated_damages: -1000
      }

      const result = await createClaim(invalidClaimData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Estimated damages must be positive')
    })

    it('should handle database errors', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.from().insert().single.mockResolvedValue({ 
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
        error: { message: 'User not authenticated' }
      })

      const result = await createClaim(validClaimData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('authenticated')
    })
  })

  describe('updateClaim', () => {
    const updateData = {
      id: 'claim-456',
      status: 'under_review',
      adjuster_notes: 'Initial review completed',
      estimated_damages: 18000
    }

    it('should update claim successfully', async () => {
      const mockUser = { id: 'user-123' }
      const mockUpdatedClaim = {
        ...updateData,
        user_id: 'user-123',
        updated_at: '2024-03-16T10:00:00Z'
      }

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.from().update().eq().single.mockResolvedValue({ 
        data: mockUpdatedClaim, 
        error: null 
      })

      const result = await updateClaim(updateData)

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('under_review')
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        status: 'under_review',
        adjuster_notes: 'Initial review completed',
        estimated_damages: 18000,
        updated_at: expect.any(String)
      })
    })

    it('should prevent updating restricted fields', async () => {
      const restrictedUpdate = {
        id: 'claim-456',
        user_id: 'different-user',
        created_at: '2024-01-01T00:00:00Z'
      }

      const result = await updateClaim(restrictedUpdate)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Cannot update restricted fields')
    })

    it('should validate claim ownership', async () => {
      const mockUser = { id: 'user-456' }
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.from().update().eq().single.mockResolvedValue({ 
        data: null, 
        error: { message: 'No rows updated' }
      })

      const result = await updateClaim(updateData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Claim not found or access denied')
    })
  })

  describe('getClaim', () => {
    it('should retrieve claim with full details', async () => {
      const mockUser = { id: 'user-123' }
      const mockClaim = {
        id: 'claim-456',
        property_id: 'prop-123',
        incident_date: '2024-03-15',
        damage_type: 'water_damage',
        status: 'submitted',
        user_id: 'user-123',
        property: {
          address: '123 Main St',
          city: 'Miami',
          state: 'FL'
        },
        documents: [
          { id: 'doc-1', name: 'photo1.jpg', type: 'damage_photo' },
          { id: 'doc-2', name: 'estimate.pdf', type: 'contractor_estimate' }
        ]
      }

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.from().select().eq().single.mockResolvedValue({ 
        data: mockClaim, 
        error: null 
      })

      const result = await getClaim('claim-456')

      expect(result.success).toBe(true)
      expect(result.data?.id).toBe('claim-456')
      expect(result.data?.property).toBeDefined()
      expect(result.data?.documents).toHaveLength(2)
      expect(mockSupabase.from().select).toHaveBeenCalledWith(`
        *,
        property:properties(*),
        documents:claim_documents(*)
      `)
    })

    it('should handle claim not found', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.from().select().eq().single.mockResolvedValue({ 
        data: null, 
        error: { message: 'No rows returned' }
      })

      const result = await getClaim('non-existent-claim')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Claim not found')
    })
  })

  describe('getUserClaims', () => {
    it('should retrieve user claims with pagination', async () => {
      const mockUser = { id: 'user-123' }
      const mockClaims = [
        { id: 'claim-1', status: 'submitted', created_at: '2024-03-15T10:00:00Z' },
        { id: 'claim-2', status: 'approved', created_at: '2024-03-10T10:00:00Z' }
      ]

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.from().select().eq().order.mockResolvedValue({ 
        data: mockClaims, 
        error: null 
      })

      const result = await getUserClaims({ 
        page: 1, 
        limit: 10, 
        status: 'all' 
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(mockSupabase.from().order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should filter claims by status', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.from().select().eq().order.mockResolvedValue({ 
        data: [], 
        error: null 
      })

      await getUserClaims({ 
        page: 1, 
        limit: 10, 
        status: 'submitted' 
      })

      expect(mockSupabase.from().eq).toHaveBeenCalledWith('status', 'submitted')
    })

    it('should search claims by keyword', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.from().select().eq().order.mockResolvedValue({ 
        data: [], 
        error: null 
      })

      await getUserClaims({ 
        page: 1, 
        limit: 10, 
        search: 'water damage' 
      })

      // Should use text search functionality
      expect(mockSupabase.from().select).toHaveBeenCalledWith(
        expect.stringContaining('textsearch')
      )
    })
  })

  describe('uploadClaimDocument', () => {
    it('should upload document successfully', async () => {
      const mockUser = { id: 'user-123' }
      const mockFile = new File(['test content'], 'damage-photo.jpg', { type: 'image/jpeg' })
      const uploadData = {
        claim_id: 'claim-456',
        file: mockFile,
        document_type: 'damage_photo',
        description: 'Basement water damage'
      }

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'claims/claim-456/damage-photo.jpg' },
        error: null
      })
      mockSupabase.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/damage-photo.jpg' }
      })
      mockSupabase.from().insert().single.mockResolvedValue({
        data: { 
          id: 'doc-789',
          file_name: 'damage-photo.jpg',
          file_url: 'https://storage.example.com/damage-photo.jpg'
        },
        error: null
      })

      const result = await uploadClaimDocument(uploadData)

      expect(result.success).toBe(true)
      expect(result.data?.id).toBe('doc-789')
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('claim-documents')
    })

    it('should validate file types', async () => {
      const mockFile = new File(['test'], 'malicious.exe', { type: 'application/exe' })
      const uploadData = {
        claim_id: 'claim-456',
        file: mockFile,
        document_type: 'damage_photo'
      }

      const result = await uploadClaimDocument(uploadData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid file type')
    })

    it('should validate file size', async () => {
      // Mock large file (>10MB)
      const mockFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      const uploadData = {
        claim_id: 'claim-456',
        file: mockFile,
        document_type: 'damage_photo'
      }

      const result = await uploadClaimDocument(uploadData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('File too large')
    })
  })

  describe('generateClaimReport', () => {
    it('should generate comprehensive claim report', async () => {
      const mockUser = { id: 'user-123' }
      const mockClaim = {
        id: 'claim-456',
        status: 'approved',
        settlement_amount: 15000,
        created_at: '2024-03-15T10:00:00Z',
        property: { address: '123 Main St' },
        documents: [{ type: 'damage_photo' }]
      }

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.from().select().eq().single.mockResolvedValue({ 
        data: mockClaim, 
        error: null 
      })

      const result = await generateClaimReport('claim-456')

      expect(result.success).toBe(true)
      expect(result.data?.claim_summary).toBeDefined()
      expect(result.data?.timeline).toBeInstanceOf(Array)
      expect(result.data?.document_summary).toBeDefined()
      expect(result.data?.financial_summary).toBeDefined()
    })

    it('should handle claims without documents', async () => {
      const mockUser = { id: 'user-123' }
      const mockClaim = {
        id: 'claim-456',
        status: 'submitted',
        created_at: '2024-03-15T10:00:00Z',
        property: { address: '123 Main St' },
        documents: []
      }

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.from().select().eq().single.mockResolvedValue({ 
        data: mockClaim, 
        error: null 
      })

      const result = await generateClaimReport('claim-456')

      expect(result.success).toBe(true)
      expect(result.data?.document_summary.total_documents).toBe(0)
      expect(result.data?.recommendations).toContain('Upload supporting documents')
    })
  })

  describe('deleteClaim', () => {
    it('should delete claim and associated documents', async () => {
      const mockUser = { id: 'user-123' }
      
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.from().delete().eq().mockResolvedValue({ 
        data: [{ id: 'claim-456' }], 
        error: null 
      })

      const result = await deleteClaim('claim-456')

      expect(result.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('claims')
      expect(mockSupabase.from().delete().eq).toHaveBeenCalledWith('id', 'claim-456')
    })

    it('should prevent deletion of approved claims', async () => {
      const mockUser = { id: 'user-123' }
      
      // Mock claim retrieval to check status
      mockSupabase.from().select().eq().single.mockResolvedValue({ 
        data: { id: 'claim-456', status: 'approved', user_id: 'user-123' }, 
        error: null 
      })

      const result = await deleteClaim('claim-456')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Cannot delete approved claims')
    })
  })
})
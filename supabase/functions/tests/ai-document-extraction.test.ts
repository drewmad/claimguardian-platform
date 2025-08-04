/**
 * @fileMetadata
 * @purpose Tests for AI document extraction Edge Function
 * @owner ai-team
 * @dependencies ["vitest", "@supabase/functions-js"]
 * @exports []
 * @complexity high
 * @tags ["test", "edge-function", "ai", "document-extraction"]
 * @status active
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T20:40:00Z
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Deno global for testing
global.Deno = {
  serve: vi.fn(),
  env: {
    get: vi.fn()
  }
} as any

// Mock fetch for external API calls
global.fetch = vi.fn()

describe('AI Document Extraction Edge Function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup environment variables mock
    ;(global.Deno.env.get as any).mockImplementation((key: string) => {
      const envVars = {
        'OPENAI_API_KEY': 'test-openai-key',
        'GEMINI_API_KEY': 'test-gemini-key',
        'SUPABASE_SERVICE_ROLE_KEY': 'test-service-role-key'
      }
      return envVars[key]
    })
  })

  describe('Request Validation', () => {
    it('should reject requests without required fields', async () => {
      const mockRequest = new Request('https://test.com', {
        method: 'POST',
        body: JSON.stringify({})
      })

      // Import and test the function
      const { default: handler } = await import('../../ai-document-extraction/index.ts')
      const response = await handler(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('document_url is required')
    })

    it('should reject invalid document URLs', async () => {
      const mockRequest = new Request('https://test.com', {
        method: 'POST',
        body: JSON.stringify({
          document_url: 'invalid-url',
          extraction_type: 'insurance_policy'
        })
      })

      const { default: handler } = await import('../../ai-document-extraction/index.ts')
      const response = await handler(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('Invalid document URL')
    })

    it('should accept valid extraction requests', async () => {
      const mockRequest = new Request('https://test.com', {
        method: 'POST',
        body: JSON.stringify({
          document_url: 'https://example.com/policy.pdf',
          extraction_type: 'insurance_policy',
          claim_id: 'claim-123'
        })
      })

      // Mock successful AI response
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                policy_number: 'POL-123456',
                coverage_amount: '$500,000',
                deductible: '$2,500',
                policy_holder: 'John Doe'
              })
            }
          }],
          usage: { total_tokens: 1500 }
        })
      })

      const { default: handler } = await import('../../ai-document-extraction/index.ts')
      const response = await handler(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data.policy_number).toBe('POL-123456')
    })
  })

  describe('Document Type Processing', () => {
    it('should extract insurance policy data correctly', async () => {
      const mockRequest = new Request('https://test.com', {
        method: 'POST',
        body: JSON.stringify({
          document_url: 'https://example.com/policy.pdf',
          extraction_type: 'insurance_policy'
        })
      })

      const mockPolicyData = {
        policy_number: 'POL-789012',
        coverage_types: ['dwelling', 'personal_property', 'liability'],
        effective_date: '2024-01-01',
        expiration_date: '2024-12-31',
        premium: '$2,400',
        carrier: 'Example Insurance Co.'
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: { content: JSON.stringify(mockPolicyData) }
          }],
          usage: { total_tokens: 2000 }
        })
      })

      const { default: handler } = await import('../../ai-document-extraction/index.ts')
      const response = await handler(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.data.policy_number).toBe('POL-789012')
      expect(result.data.coverage_types).toContain('dwelling')
      expect(result.data.carrier).toBe('Example Insurance Co.')
    })

    it('should extract claim documents correctly', async () => {
      const mockRequest = new Request('https://test.com', {
        method: 'POST',
        body: JSON.stringify({
          document_url: 'https://example.com/claim.pdf',
          extraction_type: 'claim_document'
        })
      })

      const mockClaimData = {
        claim_number: 'CLM-456789',
        incident_date: '2024-03-15',
        damage_type: 'water_damage',
        estimated_damages: '$25,000',
        adjuster_name: 'Jane Smith',
        status: 'under_review'
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: { content: JSON.stringify(mockClaimData) }
          }],
          usage: { total_tokens: 1800 }
        })
      })

      const { default: handler } = await import('../../ai-document-extraction/index.ts')
      const response = await handler(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.data.claim_number).toBe('CLM-456789')
      expect(result.data.damage_type).toBe('water_damage')
      expect(result.data.adjuster_name).toBe('Jane Smith')
    })

    it('should extract contractor estimates correctly', async () => {
      const mockRequest = new Request('https://test.com', {
        method: 'POST',
        body: JSON.stringify({
          document_url: 'https://example.com/estimate.pdf',
          extraction_type: 'contractor_estimate'
        })
      })

      const mockEstimateData = {
        contractor_name: 'ABC Roofing Co.',
        estimate_date: '2024-03-20',
        total_estimate: '$15,500',
        line_items: [
          { description: 'Roof replacement', quantity: 1, unit_price: '$12,000' },
          { description: 'Gutter repair', quantity: 50, unit_price: '$70' }
        ],
        labor_cost: '$8,000',
        materials_cost: '$7,500'
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: { content: JSON.stringify(mockEstimateData) }
          }],
          usage: { total_tokens: 2200 }
        })
      })

      const { default: handler } = await import('../../ai-document-extraction/index.ts')
      const response = await handler(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.data.contractor_name).toBe('ABC Roofing Co.')
      expect(result.data.total_estimate).toBe('$15,500')
      expect(result.data.line_items).toHaveLength(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle AI API failures gracefully', async () => {
      const mockRequest = new Request('https://test.com', {
        method: 'POST',
        body: JSON.stringify({
          document_url: 'https://example.com/policy.pdf',
          extraction_type: 'insurance_policy'
        })
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Rate Limited'
      })

      const { default: handler } = await import('../../ai-document-extraction/index.ts')
      const response = await handler(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toContain('AI service temporarily unavailable')
    })

    it('should handle malformed AI responses', async () => {
      const mockRequest = new Request('https://test.com', {
        method: 'POST',
        body: JSON.stringify({
          document_url: 'https://example.com/policy.pdf',
          extraction_type: 'insurance_policy'
        })
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: { content: 'Invalid JSON response' }
          }]
        })
      })

      const { default: handler } = await import('../../ai-document-extraction/index.ts')
      const response = await handler(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to parse AI response')
    })

    it('should handle network timeouts', async () => {
      const mockRequest = new Request('https://test.com', {
        method: 'POST',
        body: JSON.stringify({
          document_url: 'https://example.com/policy.pdf',
          extraction_type: 'insurance_policy'
        })
      })

      ;(global.fetch as any).mockRejectedValue(new Error('Network timeout'))

      const { default: handler } = await import('../../ai-document-extraction/index.ts')
      const response = await handler(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })
  })

  describe('Security & Validation', () => {
    it('should validate document URL schemes', async () => {
      const mockRequest = new Request('https://test.com', {
        method: 'POST',
        body: JSON.stringify({
          document_url: 'file:///etc/passwd',
          extraction_type: 'insurance_policy'
        })
      })

      const { default: handler } = await import('../../ai-document-extraction/index.ts')
      const response = await handler(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('Invalid document URL scheme')
    })

    it('should sanitize extracted data', async () => {
      const mockRequest = new Request('https://test.com', {
        method: 'POST',
        body: JSON.stringify({
          document_url: 'https://example.com/policy.pdf',
          extraction_type: 'insurance_policy'
        })
      })

      const maliciousData = {
        policy_number: '<script>alert("xss")</script>POL-123',
        coverage_amount: '$500,000',
        notes: 'Valid policy <!-- malicious comment -->'
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: { content: JSON.stringify(maliciousData) }
          }],
          usage: { total_tokens: 1000 }
        })
      })

      const { default: handler } = await import('../../ai-document-extraction/index.ts')
      const response = await handler(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      // Should sanitize HTML/script tags
      expect(result.data.policy_number).not.toContain('<script>')
      expect(result.data.notes).not.toContain('<!--')
    })

    it('should rate limit requests per IP', async () => {
      const clientIP = '192.168.1.1'
      
      // Simulate multiple rapid requests from same IP
      for (let i = 0; i < 10; i++) {
        const mockRequest = new Request('https://test.com', {
          method: 'POST',
          headers: { 'x-forwarded-for': clientIP },
          body: JSON.stringify({
            document_url: 'https://example.com/policy.pdf',
            extraction_type: 'insurance_policy'
          })
        })

        const { default: handler } = await import('../../ai-document-extraction/index.ts')
        const response = await handler(mockRequest)
        
        if (i >= 5) { // Assuming rate limit of 5 requests
          expect(response.status).toBe(429)
          const result = await response.json()
          expect(result.error).toContain('Rate limit exceeded')
          break
        }
      }
    })
  })

  describe('Performance & Monitoring', () => {
    it('should track processing metrics', async () => {
      const mockRequest = new Request('https://test.com', {
        method: 'POST',
        body: JSON.stringify({
          document_url: 'https://example.com/policy.pdf',
          extraction_type: 'insurance_policy'
        })
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: { content: JSON.stringify({ policy_number: 'POL-123' }) }
          }],
          usage: { total_tokens: 1500, prompt_tokens: 800, completion_tokens: 700 }
        })
      })

      const { default: handler } = await import('../../ai-document-extraction/index.ts')
      const response = await handler(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.metadata).toBeDefined()
      expect(result.metadata.processing_time_ms).toBeGreaterThan(0)
      expect(result.metadata.token_usage).toEqual({
        total: 1500,
        prompt: 800,
        completion: 700
      })
    })

    it('should log successful extractions', async () => {
      const consoleSpy = vi.spyOn(console, 'info')
      
      const mockRequest = new Request('https://test.com', {
        method: 'POST',
        body: JSON.stringify({
          document_url: 'https://example.com/policy.pdf',
          extraction_type: 'insurance_policy',
          user_id: 'user-123'
        })
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify({ policy_number: 'POL-123' }) } }],
          usage: { total_tokens: 1000 }
        })
      })

      const { default: handler } = await import('../../ai-document-extraction/index.ts')
      await handler(mockRequest)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Document extraction completed'),
        expect.objectContaining({
          user_id: 'user-123',
          extraction_type: 'insurance_policy',
          success: true
        })
      )
    })
  })
})
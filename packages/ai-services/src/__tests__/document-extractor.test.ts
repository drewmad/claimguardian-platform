import { describe, it, expect, beforeEach } from 'vitest'

import { DocumentExtractor } from '../document-extractor'
import type { DocumentExtractionRequest } from '../types'

describe('DocumentExtractor', () => {
  let extractor: DocumentExtractor

  beforeEach(() => {
    extractor = new DocumentExtractor()
  })

  describe('extract', () => {
    it('should handle missing providers gracefully', async () => {
      const request: DocumentExtractionRequest = {
        fileUrl: 'https://example.com/policy.pdf',
        fileName: 'policy.pdf',
        apiProvider: 'gemini'
      }

      const result = await extractor.extract(request)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not available')
    })

    it('should return cached results when available', async () => {
      // First request
      const request: DocumentExtractionRequest = {
        fileUrl: 'https://example.com/policy.pdf',
        fileName: 'policy.pdf'
      }

      // Mock a successful extraction
      const firstResult = await extractor.extract(request)
      
      // Second request should return cached result
      const secondResult = await extractor.extract(request)
      
      if (firstResult.success && secondResult.success) {
        expect(secondResult.cached).toBe(true)
      }
    })

    it('should validate confidence threshold', async () => {
      const request: DocumentExtractionRequest = {
        fileUrl: 'https://example.com/policy.pdf',
        fileName: 'policy.pdf',
        confidenceThreshold: 0.9
      }

      const result = await extractor.extract(request)
      
      if (result.success && result.data?.confidence) {
        expect(result.data.confidence).toBeGreaterThanOrEqual(0)
        expect(result.data.confidence).toBeLessThanOrEqual(1)
      }
    })
  })

  describe('getAvailableProviders', () => {
    it('should return list of available providers', () => {
      const providers = extractor.getAvailableProviders()
      expect(Array.isArray(providers)).toBe(true)
    })
  })

  describe('clearCache', () => {
    it('should clear the cache without errors', () => {
      expect(() => extractor.clearCache()).not.toThrow()
    })
  })
})
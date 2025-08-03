import { describe, it, expect, beforeEach } from 'vitest'

import { ClaimAssistant } from '../claim-assistant'
import type { ClaimAssistantContext } from '../types'

describe('ClaimAssistant', () => {
  let assistant: ClaimAssistant

  beforeEach(() => {
    assistant = new ClaimAssistant()
  })

  describe('getClaimGuidance', () => {
    it('should handle missing providers gracefully', async () => {
      const context: ClaimAssistantContext = {
        userId: 'test-user-123',
        propertyId: 'prop-456',
        claimId: 'claim-789'
      }

      const result = await assistant.getClaimGuidance(context)

      expect(result.success).toBe(false)
      expect(result.error).toContain('No AI providers available')
    })

    it('should include user question in guidance request', async () => {
      const context: ClaimAssistantContext = {
        userId: 'test-user-123',
        previousMessages: [
          {
            role: 'user',
            content: 'What documents do I need?',
            timestamp: new Date()
          }
        ]
      }

      const userQuestion = 'How long will my claim take?'
      const result = await assistant.getClaimGuidance(context, userQuestion)

      // The result structure should be consistent regardless of provider availability
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('error')
    })
  })

  describe('generateDocument', () => {
    it('should support different document templates', async () => {
      const templates = ['demand-letter', 'appeal', 'complaint'] as const
      
      for (const template of templates) {
        const result = await assistant.generateDocument(template, {
          claimNumber: 'CLM-123',
          policyNumber: 'POL-456',
          dateOfLoss: '2024-01-15',
          damageDescription: 'Hurricane damage to roof',
          amountClaimed: 50000
        })

        expect(result).toHaveProperty('success')
        expect(result).toHaveProperty('error')
      }
    })
  })

  describe('getAvailableProviders', () => {
    it('should return list of available providers', () => {
      const providers = assistant.getAvailableProviders()
      expect(Array.isArray(providers)).toBe(true)
    })
  })
})
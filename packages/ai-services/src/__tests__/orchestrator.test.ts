/**
 * @fileMetadata
 * @purpose Tests for AI services orchestrator and provider management
 * @owner ai-team
 * @dependencies ["vitest", "@claimguardian/utils"]
 * @exports []
 * @complexity high
 * @tags ["test", "ai", "orchestrator", "providers"]
 * @status active
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T20:35:00Z
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AIOrchestrator } from '../orchestrator/orchestrator'
import { OpenAIProvider } from '../providers/openai.provider'
import { GeminiProvider } from '../providers/gemini.provider'

// Mock providers
vi.mock('../providers/openai.provider')
vi.mock('../providers/gemini.provider')

const mockOpenAIProvider = {
  name: 'openai',
  isConfigured: vi.fn(),
  generateText: vi.fn(),
  analyzeImage: vi.fn(),
  extractText: vi.fn(),
  getCostEstimate: vi.fn()
}

const mockGeminiProvider = {
  name: 'gemini',
  isConfigured: vi.fn(),
  generateText: vi.fn(),
  analyzeImage: vi.fn(),
  extractText: vi.fn(),
  getCostEstimate: vi.fn()
}

describe('AIOrchestrator', () => {
  let orchestrator: AIOrchestrator

  beforeEach(() => {
    vi.clearAllMocks()
    ;(OpenAIProvider as any).mockImplementation(() => mockOpenAIProvider)
    ;(GeminiProvider as any).mockImplementation(() => mockGeminiProvider)
    
    orchestrator = new AIOrchestrator()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Provider Management', () => {
    it('should initialize with configured providers', () => {
      mockOpenAIProvider.isConfigured.mockReturnValue(true)
      mockGeminiProvider.isConfigured.mockReturnValue(false)

      const providers = orchestrator.getAvailableProviders()
      
      expect(providers).toContain('openai')
      expect(providers).not.toContain('gemini')
    })

    it('should set default provider to first available', () => {
      mockOpenAIProvider.isConfigured.mockReturnValue(true)
      mockGeminiProvider.isConfigured.mockReturnValue(true)

      orchestrator = new AIOrchestrator()
      
      expect(orchestrator.getCurrentProvider()).toBe('openai')
    })

    it('should switch providers successfully', () => {
      mockOpenAIProvider.isConfigured.mockReturnValue(true)
      mockGeminiProvider.isConfigured.mockReturnValue(true)

      const result = orchestrator.switchProvider('gemini')
      
      expect(result.success).toBe(true)
      expect(orchestrator.getCurrentProvider()).toBe('gemini')
    })

    it('should fail to switch to unconfigured provider', () => {
      mockGeminiProvider.isConfigured.mockReturnValue(false)

      const result = orchestrator.switchProvider('gemini')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('not configured')
    })
  })

  describe('Text Generation', () => {
    beforeEach(() => {
      mockOpenAIProvider.isConfigured.mockReturnValue(true)
      orchestrator = new AIOrchestrator()
    })

    it('should generate text successfully', async () => {
      const mockResponse = {
        text: 'Generated response',
        usage: { tokens: 100, cost: 0.002 },
        provider: 'openai'
      }
      mockOpenAIProvider.generateText.mockResolvedValue(mockResponse)

      const result = await orchestrator.generateText({
        prompt: 'Test prompt',
        maxTokens: 100
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
      expect(mockOpenAIProvider.generateText).toHaveBeenCalledWith({
        prompt: 'Test prompt',
        maxTokens: 100
      })
    })

    it('should handle generation errors', async () => {
      const error = new Error('API rate limit exceeded')
      mockOpenAIProvider.generateText.mockRejectedValue(error)

      const result = await orchestrator.generateText({
        prompt: 'Test prompt'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('API rate limit exceeded')
    })

    it('should fallback to secondary provider on failure', async () => {
      mockGeminiProvider.isConfigured.mockReturnValue(true)
      mockOpenAIProvider.generateText.mockRejectedValue(new Error('OpenAI failed'))
      mockGeminiProvider.generateText.mockResolvedValue({
        text: 'Fallback response',
        usage: { tokens: 80, cost: 0.001 },
        provider: 'gemini'
      })

      orchestrator.enableFallback(['gemini'])
      
      const result = await orchestrator.generateText({
        prompt: 'Test prompt',
        enableFallback: true
      })

      expect(result.success).toBe(true)
      expect(result.data?.provider).toBe('gemini')
      expect(mockGeminiProvider.generateText).toHaveBeenCalled()
    })
  })

  describe('Image Analysis', () => {
    beforeEach(() => {
      mockOpenAIProvider.isConfigured.mockReturnValue(true)
      orchestrator = new AIOrchestrator()
    })

    it('should analyze images successfully', async () => {
      const mockResponse = {
        analysis: 'Property damage detected in roof area',
        confidence: 0.95,
        categories: ['damage', 'roof'],
        usage: { tokens: 150, cost: 0.003 },
        provider: 'openai'
      }
      mockOpenAIProvider.analyzeImage.mockResolvedValue(mockResponse)

      const result = await orchestrator.analyzeImage({
        imageUrl: 'https://example.com/damage.jpg',
        prompt: 'Analyze this property damage'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
      expect(mockOpenAIProvider.analyzeImage).toHaveBeenCalledWith({
        imageUrl: 'https://example.com/damage.jpg',
        prompt: 'Analyze this property damage'
      })
    })

    it('should handle unsupported image formats', async () => {
      const error = new Error('Unsupported image format')
      mockOpenAIProvider.analyzeImage.mockRejectedValue(error)

      const result = await orchestrator.analyzeImage({
        imageUrl: 'https://example.com/document.pdf'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unsupported image format')
    })
  })

  describe('Cost Tracking', () => {
    beforeEach(() => {
      mockOpenAIProvider.isConfigured.mockReturnValue(true)
      orchestrator = new AIOrchestrator()
    })

    it('should track usage costs', async () => {
      mockOpenAIProvider.generateText.mockResolvedValue({
        text: 'Response',
        usage: { tokens: 100, cost: 0.002 },
        provider: 'openai'
      })

      await orchestrator.generateText({ prompt: 'Test' })
      
      const stats = orchestrator.getUsageStats()
      
      expect(stats.totalCost).toBe(0.002)
      expect(stats.totalTokens).toBe(100)
      expect(stats.requestCount).toBe(1)
      expect(stats.providerBreakdown.openai).toBeDefined()
    })

    it('should provide cost estimates', async () => {
      mockOpenAIProvider.getCostEstimate.mockReturnValue({
        estimatedTokens: 150,
        estimatedCost: 0.003,
        provider: 'openai'
      })

      const estimate = await orchestrator.getCostEstimate({
        prompt: 'Long prompt for estimation',
        operation: 'text-generation'
      })

      expect(estimate.estimatedCost).toBe(0.003)
      expect(estimate.estimatedTokens).toBe(150)
    })

    it('should reset usage stats', () => {
      orchestrator.resetUsageStats()
      
      const stats = orchestrator.getUsageStats()
      
      expect(stats.totalCost).toBe(0)
      expect(stats.totalTokens).toBe(0)
      expect(stats.requestCount).toBe(0)
    })
  })

  describe('Caching', () => {
    beforeEach(() => {
      mockOpenAIProvider.isConfigured.mockReturnValue(true)
      orchestrator = new AIOrchestrator({ enableCache: true })
    })

    it('should cache successful responses', async () => {
      const mockResponse = {
        text: 'Cached response',
        usage: { tokens: 50, cost: 0.001 },
        provider: 'openai'
      }
      mockOpenAIProvider.generateText.mockResolvedValue(mockResponse)

      // First call
      const result1 = await orchestrator.generateText({
        prompt: 'Cacheable prompt'
      })

      // Second call should use cache
      const result2 = await orchestrator.generateText({
        prompt: 'Cacheable prompt'
      })

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result2.data?.cached).toBe(true)
      expect(mockOpenAIProvider.generateText).toHaveBeenCalledTimes(1)
    })

    it('should bypass cache when disabled', async () => {
      orchestrator = new AIOrchestrator({ enableCache: false })
      mockOpenAIProvider.generateText.mockResolvedValue({
        text: 'Non-cached response',
        usage: { tokens: 50, cost: 0.001 },
        provider: 'openai'
      })

      await orchestrator.generateText({ prompt: 'Test prompt' })
      await orchestrator.generateText({ prompt: 'Test prompt' })

      expect(mockOpenAIProvider.generateText).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockOpenAIProvider.isConfigured.mockReturnValue(true)
      orchestrator = new AIOrchestrator()
    })

    it('should handle provider timeout errors', async () => {
      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'TimeoutError'
      mockOpenAIProvider.generateText.mockRejectedValue(timeoutError)

      const result = await orchestrator.generateText({
        prompt: 'Test prompt',
        timeout: 5000
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('timeout')
    })

    it('should handle quota exceeded errors', async () => {
      const quotaError = new Error('Quota exceeded')
      quotaError.name = 'QuotaExceededError'
      mockOpenAIProvider.generateText.mockRejectedValue(quotaError)

      const result = await orchestrator.generateText({
        prompt: 'Test prompt'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('quota')
    })

    it('should retry on transient errors', async () => {
      mockOpenAIProvider.generateText
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          text: 'Success after retry',
          usage: { tokens: 75, cost: 0.0015 },
          provider: 'openai'
        })

      const result = await orchestrator.generateText({
        prompt: 'Test prompt',
        retryAttempts: 2
      })

      expect(result.success).toBe(true)
      expect(mockOpenAIProvider.generateText).toHaveBeenCalledTimes(2)
    })
  })

  describe('Configuration Validation', () => {
    it('should validate provider configurations on startup', () => {
      mockOpenAIProvider.isConfigured.mockReturnValue(false)
      mockGeminiProvider.isConfigured.mockReturnValue(false)

      expect(() => new AIOrchestrator()).toThrow('No AI providers configured')
    })

    it('should provide configuration guidance', () => {
      mockOpenAIProvider.isConfigured.mockReturnValue(false)
      mockGeminiProvider.isConfigured.mockReturnValue(false)

      try {
        new AIOrchestrator()
      } catch (error) {
        expect(error.message).toContain('OPENAI_API_KEY')
        expect(error.message).toContain('GEMINI_API_KEY')
      }
    })
  })
})
/**
 * @fileMetadata
 * @purpose "Tests for AI orchestrator service"
 * @owner ai-services-team
 * @dependencies ["vitest", "../orchestrator/orchestrator", "../providers/base.provider"]
 * @exports []
 * @complexity low
 * @tags ["test", "ai", "orchestrator"]
 * @status stable
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T22:30:00Z
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIOrchestrator } from '../orchestrator/orchestrator'
import { BaseAIProvider } from '../providers/base.provider'

// Mock the base provider
const mockProvider = {
  constructor: { name: 'MockProvider' },
  generateText: vi.fn(),
  chat: vi.fn(),
  analyzeImage: vi.fn(),
  isConfigured: () => true
} as unknown as BaseAIProvider

// Mock dependencies
vi.mock('../cache/cache.manager', () => ({
  CacheManager: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined)
  }))
}))

vi.mock('../cache/semantic-cache', () => ({
  SemanticCache: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined)
  }))
}))

vi.mock('../monitoring/cost-tracker', () => ({
  CostTracker: vi.fn().mockImplementation(() => ({
    track: vi.fn().mockResolvedValue(undefined)
  }))
}))

describe('AIOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should initialize with providers', () => {
      const orchestrator = new AIOrchestrator({
        providers: {
          mock: mockProvider
        }
      })

      expect(orchestrator).toBeInstanceOf(AIOrchestrator)
    })

    it('should throw error when no providers configured', () => {
      expect(() => new AIOrchestrator({ providers: {} }))
        .toThrow('At least one AI provider must be configured')
    })
  })

  describe('Basic Functionality', () => {
    it('should have process method', () => {
      const orchestrator = new AIOrchestrator({
        providers: {
          mock: mockProvider
        }
      })

      expect(typeof orchestrator.process).toBe('function')
    })

    it('should have chat method', () => {
      const orchestrator = new AIOrchestrator({
        providers: {
          mock: mockProvider
        }
      })

      expect(typeof orchestrator.chat).toBe('function')
    })
  })
})
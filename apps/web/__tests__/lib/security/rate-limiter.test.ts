/**
 * @fileMetadata
 * @purpose Tests for rate limiting service and API protection
 * @owner platform-team
 * @complexity high
 * @tags ["testing", "security", "rate-limiting", "api-protection"]
 * @status active
 */

import { RateLimiter } from '@/lib/security/rate-limiter'
import { mockConsole, delay } from '../../utils/test-utils'

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}))

describe('RateLimiter', () => {
  let console: ReturnType<typeof mockConsole>

  beforeEach(() => {
    console = mockConsole()
    jest.clearAllTimers()
    jest.useFakeTimers()
    RateLimiter.clearAll() // Clear rate limiter state between tests
  })

  afterEach(() => {
    console.restore()
    jest.useRealTimers()
  })

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const identifier = 'user123'
      const config = { maxRequests: 5, windowMs: 60000 }

      // Should allow 5 requests
      for (let i = 0; i < 5; i++) {
        const result = RateLimiter.checkLimit(identifier, config)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(4 - i)
      }
    })

    it('should block requests exceeding limit', () => {
      const identifier = 'user123'
      const config = { maxRequests: 3, windowMs: 60000 }

      // Use up the limit
      for (let i = 0; i < 3; i++) {
        RateLimiter.checkLimit(identifier, config)
      }

      // Next request should be blocked
      const result = RateLimiter.checkLimit(identifier, config)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it('should reset limit after window expires', () => {
      const identifier = 'user123'
      const config = { maxRequests: 2, windowMs: 1000 }

      // Use up the limit
      RateLimiter.checkLimit(identifier, config)
      RateLimiter.checkLimit(identifier, config)

      // Should be blocked
      expect(RateLimiter.checkLimit(identifier, config).allowed).toBe(false)

      // Advance time past window
      jest.advanceTimersByTime(1100)

      // Should be allowed again
      const result = RateLimiter.checkLimit(identifier, config)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(1)
    })

    it('should track separate limits for different identifiers', () => {
      const config = { maxRequests: 2, windowMs: 60000 }

      // User1 uses up limit
      RateLimiter.checkLimit('user1', config)
      RateLimiter.checkLimit('user1', config)
      expect(RateLimiter.checkLimit('user1', config).allowed).toBe(false)

      // User2 should still have full limit
      const result = RateLimiter.checkLimit('user2', config)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(1)
    })
  })

  describe('Predefined Configurations', () => {
    it('should apply strict configuration correctly', () => {
      const identifier = 'test-user'
      
      // Strict config: 5 requests per 15 minutes
      const result = RateLimiter.applyLimit(identifier, 'strict')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('should apply moderate configuration correctly', () => {
      const identifier = 'test-user'
      
      // Moderate config: 50 requests per 15 minutes
      const result = RateLimiter.applyLimit(identifier, 'moderate')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(49)
    })

    it('should apply permissive configuration correctly', () => {
      const identifier = 'test-user'
      
      // Permissive config: 200 requests per 15 minutes
      const result = RateLimiter.applyLimit(identifier, 'permissive')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(199)
    })

    it('should apply authentication configuration correctly', () => {
      const identifier = 'test-user'
      
      // Auth config: 10 requests per hour
      const result = RateLimiter.applyLimit(identifier, 'auth')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9)
    })
  })

  describe('API Integration', () => {
    it('should create middleware-compatible function', () => {
      const middleware = RateLimiter.createMiddleware('moderate')
      expect(typeof middleware).toBe('function')
    })

    it('should check rate limit for IP addresses', () => {
      const ip = '192.168.1.1'
      const result = RateLimiter.checkByIP(ip, 'strict')
      
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('should check rate limit for user IDs', () => {
      const userId = 'user-123'
      const result = RateLimiter.checkByUser(userId, 'moderate')
      
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(49)
    })

    it('should check rate limit for API keys', () => {
      const apiKey = 'api-key-456'
      const result = RateLimiter.checkByApiKey(apiKey, 'permissive')
      
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(199)
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined/null identifiers', () => {
      const config = { maxRequests: 5, windowMs: 60000 }
      
      const result1 = RateLimiter.checkLimit(null as any, config)
      expect(result1.allowed).toBe(false)
      
      const result2 = RateLimiter.checkLimit(undefined as any, config)
      expect(result2.allowed).toBe(false)
    })

    it('should handle empty string identifiers', () => {
      const config = { maxRequests: 5, windowMs: 60000 }
      
      const result = RateLimiter.checkLimit('', config)
      expect(result.allowed).toBe(false)
    })

    it('should handle invalid configurations', () => {
      const identifier = 'test-user'
      
      // Negative max requests
      const result1 = RateLimiter.checkLimit(identifier, { maxRequests: -1, windowMs: 60000 })
      expect(result1.allowed).toBe(false)
      
      // Zero window
      const result2 = RateLimiter.checkLimit(identifier, { maxRequests: 5, windowMs: 0 })
      expect(result2.allowed).toBe(false)
    })

    it('should handle very large numbers', () => {
      const identifier = 'test-user'
      const config = { maxRequests: Number.MAX_SAFE_INTEGER, windowMs: Number.MAX_SAFE_INTEGER }
      
      const result = RateLimiter.checkLimit(identifier, config)
      expect(result.allowed).toBe(true)
    })
  })

  describe('Memory Management', () => {
    it('should clean up expired entries', () => {
      const identifier = 'test-user'
      const config = { maxRequests: 1, windowMs: 1000 }
      
      // Create an entry
      RateLimiter.checkLimit(identifier, config)
      
      // Advance time to expire the entry
      jest.advanceTimersByTime(2000)
      
      // Clean up should remove expired entries
      RateLimiter.cleanup()
      
      // New request should have full limit available
      const result = RateLimiter.checkLimit(identifier, config)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(0)
    })

    it('should not affect non-expired entries during cleanup', () => {
      const config = { maxRequests: 5, windowMs: 60000 }
      
      // Create entries for different users
      RateLimiter.checkLimit('user1', config)
      RateLimiter.checkLimit('user2', config)
      
      // Advance time but not enough to expire
      jest.advanceTimersByTime(30000)
      
      RateLimiter.cleanup()
      
      // Both users should still have their counts
      const result1 = RateLimiter.checkLimit('user1', config)
      const result2 = RateLimiter.checkLimit('user2', config)
      
      expect(result1.remaining).toBe(3) // Second request for user1
      expect(result2.remaining).toBe(3) // Second request for user2
    })

    it('should clear all entries when requested', () => {
      const config = { maxRequests: 5, windowMs: 60000 }
      
      // Create multiple entries
      RateLimiter.checkLimit('user1', config)
      RateLimiter.checkLimit('user2', config)
      RateLimiter.checkLimit('user3', config)
      
      RateLimiter.clearAll()
      
      // All users should have fresh limits
      expect(RateLimiter.checkLimit('user1', config).remaining).toBe(4)
      expect(RateLimiter.checkLimit('user2', config).remaining).toBe(4)
      expect(RateLimiter.checkLimit('user3', config).remaining).toBe(4)
    })
  })

  describe('Logging and Monitoring', () => {
    it('should log rate limit violations', async () => {
      const { logger } = await import('@/lib/logger')
      const identifier = 'abusive-user'
      const config = { maxRequests: 1, windowMs: 60000 }
      
      // Use up the limit
      RateLimiter.checkLimit(identifier, config)
      
      // Trigger rate limit violation
      RateLimiter.checkLimit(identifier, config)
      
      expect(logger.warn).toHaveBeenCalledWith(
        'Rate limit exceeded',
        expect.objectContaining({
          identifier,
          config,
          violationTime: expect.any(Number),
        })
      )
    })

    it('should provide rate limit statistics', () => {
      const config = { maxRequests: 5, windowMs: 60000 }
      
      // Generate some traffic
      RateLimiter.checkLimit('user1', config)
      RateLimiter.checkLimit('user1', config)
      RateLimiter.checkLimit('user2', config)
      
      const stats = RateLimiter.getStats()
      
      expect(stats.totalIdentifiers).toBe(2)
      expect(stats.totalRequests).toBe(3)
      expect(stats.activeWindows).toBe(2)
    })

    it('should track violations over time', () => {
      const config = { maxRequests: 1, windowMs: 60000 }
      
      // Create violations
      RateLimiter.checkLimit('user1', config)
      RateLimiter.checkLimit('user1', config) // Violation
      RateLimiter.checkLimit('user1', config) // Violation
      
      const stats = RateLimiter.getStats()
      expect(stats.totalViolations).toBe(2)
    })
  })

  describe('Performance', () => {
    it('should handle high-frequency requests efficiently', () => {
      const config = { maxRequests: 1000, windowMs: 60000 }
      const startTime = Date.now()
      
      // Make many requests
      for (let i = 0; i < 100; i++) {
        RateLimiter.checkLimit(`user${i}`, config)
      }
      
      const endTime = Date.now()
      
      // Should complete quickly (less than 100ms for 100 requests)
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should maintain performance with many identifiers', () => {
      const config = { maxRequests: 10, windowMs: 60000 }
      
      // Create many different identifiers
      for (let i = 0; i < 1000; i++) {
        RateLimiter.checkLimit(`user${i}`, config)
      }
      
      // Should still respond quickly to new requests
      const startTime = Date.now()
      const result = RateLimiter.checkLimit('new-user', config)
      const endTime = Date.now()
      
      expect(result.allowed).toBe(true)
      expect(endTime - startTime).toBeLessThan(10)
    })
  })
})
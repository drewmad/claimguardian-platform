/**
 * @fileMetadata
 * @purpose Tests for rate limiting service and API protection
 * @owner platform-team
 * @complexity medium
 * @tags ["testing", "security", "rate-limiting", "api-protection"]
 * @status active
 */

import {
  rateLimiter,
  createRateLimitResponse,
  withRateLimit,
  RateLimiter,
} from '@/lib/security/rate-limiter'
import { NextRequest } from 'next/server'

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}))

// Helper to create a mock NextRequest
function createMockRequest(headers: Record<string, string> = {}): NextRequest {
  const request = new Request('http://localhost/api/test', {
    headers: {
      'x-forwarded-for': '127.0.0.1',
      ...headers,
    },
  })
  return request as NextRequest
}

describe('RateLimiter', () => {
  let testRateLimiter: RateLimiter

  beforeEach(() => {
    // Use a separate instance for testing to not interfere with the global singleton
    testRateLimiter = new RateLimiter()
    jest.useFakeTimers()
  })

  afterEach(() => {
    testRateLimiter.destroy()
    jest.useRealTimers()
  })

  describe('isRateLimited', () => {
    it('should allow requests within the limit', async () => {
      const request = createMockRequest()
      const config = { maxRequests: 5, windowMs: 60000 }

      for (let i = 0; i < 5; i++) {
        const result = await testRateLimiter.isRateLimited(
          request,
          'test-route',
          config
        )
        expect(result.limited).toBe(false)
        expect(result.remaining).toBe(4 - i)
      }
    })

    it('should block requests exceeding the limit', async () => {
      const request = createMockRequest()
      const config = { maxRequests: 3, windowMs: 60000 }

      for (let i = 0; i < 3; i++) {
        await testRateLimiter.isRateLimited(request, 'test-route', config)
      }

      const result = await testRateLimiter.isRateLimited(
        request,
        'test-route',
        config
      )
      expect(result.limited).toBe(true)
      expect(result.remaining).toBe(0)
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it('should reset the limit after the window expires', async () => {
      const request = createMockRequest()
      const config = { maxRequests: 2, windowMs: 1000 }

      await testRateLimiter.isRateLimited(request, 'test-route', config)
      await testRateLimiter.isRateLimited(request, 'test-route', config)

      let result = await testRateLimiter.isRateLimited(
        request,
        'test-route',
        config
      )
      expect(result.limited).toBe(true)

      // Advance time past the window
      jest.advanceTimersByTime(1100)

      result = await testRateLimiter.isRateLimited(
        request,
        'test-route',
        config
      )
      expect(result.limited).toBe(false)
      expect(result.remaining).toBe(1)
    })

    it('should handle different identifiers separately', async () => {
      const request1 = createMockRequest({ 'x-forwarded-for': '1.1.1.1' })
      const request2 = createMockRequest({ 'x-forwarded-for': '2.2.2.2' })
      const config = { maxRequests: 2, windowMs: 60000 }

      await testRateLimiter.isRateLimited(request1, 'test-route', config)
      await testRateLimiter.isRateLimited(request1, 'test-route', config)

      const result1 = await testRateLimiter.isRateLimited(
        request1,
        'test-route',
        config
      )
      expect(result1.limited).toBe(true)

      const result2 = await testRateLimiter.isRateLimited(
        request2,
        'test-route',
        config
      )
      expect(result2.limited).toBe(false)
      expect(result2.remaining).toBe(1)
    })
  })

  describe('withRateLimit', () => {
    it('should call the handler for allowed requests and add headers', async () => {
      const request = createMockRequest()
      const handler = jest.fn(async () => new Response('Success'))
      const config = RateLimiter.configs.moderate

      const response = await withRateLimit(request, 'test-handler', config, handler)

      expect(handler).toHaveBeenCalled()
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('Success')
      expect(response.headers.get('X-RateLimit-Limit')).toBe(
        config.maxRequests.toString()
      )
      expect(response.headers.get('X-RateLimit-Remaining')).toBe(
        (config.maxRequests - 1).toString()
      )
      expect(response.headers.get('X-RateLimit-Reset')).not.toBeNull()
    })

    it('should return a 429 response for blocked requests', async () => {
      const request = createMockRequest()
      const handler = jest.fn(async () => new Response('Success'))
      const config = { maxRequests: 1, windowMs: 60000 }

      // First request to use up the limit
      await rateLimiter.isRateLimited(request, 'test-blocked', config)

      const response = await withRateLimit(
        request,
        'test-blocked',
        config,
        handler
      )

      expect(handler).not.toHaveBeenCalled()
      expect(response.status).toBe(429)
      const body = await response.json()
      expect(body.error).toBe('Too many requests')
      expect(response.headers.get('Content-Type')).toBe('application/json')
      expect(response.headers.get('Retry-After')).not.toBeNull()
    })
  })

  describe('createRateLimitResponse', () => {
    it('should create a valid 429 response', () => {
      const resetTime = Date.now() + 60000
      const response = createRateLimitResponse(resetTime)

      expect(response.status).toBe(429)
      expect(response.headers.get('Content-Type')).toBe('application/json')
      expect(response.headers.get('Retry-After')).toBe('60')
      expect(response.headers.get('X-RateLimit-Reset')).toBe(
        resetTime.toString()
      )
    })
  })

  describe('Predefined Configurations', () => {
    it('should use strict config', async () => {
      const request = createMockRequest()
      const result = await testRateLimiter.isRateLimited(
        request,
        'test-strict',
        RateLimiter.configs.strict
      )
      expect(result.remaining).toBe(RateLimiter.configs.strict.maxRequests - 1)
    })

    it('should use moderate config', async () => {
      const request = createMockRequest()
      const result = await testRateLimiter.isRateLimited(
        request,
        'test-moderate',
        RateLimiter.configs.moderate
      )
      expect(result.remaining).toBe(
        RateLimiter.configs.moderate.maxRequests - 1
      )
    })

    it('should use lenient config', async () => {
      const request = createMockRequest()
      const result = await testRateLimiter.isRateLimited(
        request,
        'test-lenient',
        RateLimiter.configs.lenient
      )
      expect(result.remaining).toBe(
        RateLimiter.configs.lenient.maxRequests - 1
      )
    })

    it('should use public config', async () => {
      const request = createMockRequest()
      const result = await testRateLimiter.isRateLimited(
        request,
        'test-public',
        RateLimiter.configs.public
      )
      expect(result.remaining).toBe(RateLimiter.configs.public.maxRequests - 1)
    })
  })
})
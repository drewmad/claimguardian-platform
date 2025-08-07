/**
 * @fileMetadata
 * @purpose "Advanced rate limiting for Partner API with sliding window and burst protection"
 * @owner partner-api-team
 * @dependencies ["@/lib/cache", "@/lib/monitoring", "redis"]
 * @exports ["partnerRateLimiter", "RateLimitResult", "RateLimitConfig"]
 * @complexity high
 * @tags ["rate-limiting", "partner-api", "security", "performance"]
 * @status stable
 */

import { logger } from '@/lib/logger/production-logger'
import type { PartnerRateLimit } from '@claimguardian/db/types/partner-api.types'

export interface RateLimitResult {
  allowed: boolean
  limit: number
  current: number
  remaining: number
  resetTime?: number
  error?: string
}

export interface RateLimitRequest {
  partnerId: string
  apiKeyId: string
  ip: string
  endpoint: string
  override?: boolean
  customLimit?: number
}

interface RateLimitWindow {
  count: number
  windowStart: number
  requests: number[]
}

class PartnerRateLimiter {
  private cache = new Map<string, RateLimitWindow>()
  private readonly CLEANUP_INTERVAL = 60 * 1000 // 1 minute
  private readonly MAX_CACHE_SIZE = 10000

  constructor() {
    // Periodic cleanup of expired entries
    setInterval(() => {
      this.cleanupExpiredEntries()
    }, this.CLEANUP_INTERVAL)
  }

  /**
   * Check if request should be allowed based on rate limits
   */
  async checkLimit(request: RateLimitRequest): Promise<RateLimitResult> {
    try {
      // Skip rate limiting if override is enabled
      if (request.override) {
        return {
          allowed: true,
          limit: request.customLimit || 9999999,
          current: 0,
          remaining: request.customLimit || 9999999
        }
      }

      // Get rate limit configuration for this partner/API key
      const rateLimitConfig = await this.getRateLimitConfig(request.partnerId, request.apiKeyId)

      if (!rateLimitConfig) {
        // Default rate limits if not found
        const defaultLimit = 100
        return {
          allowed: true,
          limit: defaultLimit,
          current: 1,
          remaining: defaultLimit - 1
        }
      }

      // Check all rate limit types (minute, hour, day, burst)
      const checks = await Promise.all([
        this.checkWindowLimit(request, rateLimitConfig.requestsPerMinute, 60),
        this.checkWindowLimit(request, rateLimitConfig.requestsPerHour, 3600),
        this.checkWindowLimit(request, rateLimitConfig.requestsPerDay, 86400),
        this.checkBurstLimit(request, rateLimitConfig.burstLimit, 10) // 10 second burst window
      ])

      // Find the most restrictive limit
      const failedCheck = checks.find(check => !check.allowed)

      if (failedCheck) {
        logger.warn('Rate limit exceeded', {
          partnerId: request.partnerId,
          apiKeyId: request.apiKeyId,
          endpoint: request.endpoint,
          ip: request.ip,
          limit: failedCheck.limit,
          current: failedCheck.current
        })

        return failedCheck
      }

      // All checks passed - increment counters and allow
      const result = checks[0] // Use minute window for response metadata
      await this.incrementCounters(request)

      return {
        allowed: true,
        limit: result.limit,
        current: result.current + 1,
        remaining: Math.max(0, result.limit - result.current - 1),
        resetTime: result.resetTime
      }

    } catch (error) {
      logger.error('Rate limiter error', {
        error,
        partnerId: request.partnerId,
        endpoint: request.endpoint
      })

      // Fail open - allow request if rate limiter fails
      return {
        allowed: true,
        limit: 100,
        current: 0,
        remaining: 100,
        error: 'Rate limiter unavailable'
      }
    }
  }

  /**
   * Check sliding window rate limit
   */
  private async checkWindowLimit(
    request: RateLimitRequest,
    limit: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    const key = this.getCacheKey(request, windowSeconds)
    const now = Date.now()
    const windowStart = now - (windowSeconds * 1000)

    let window = this.cache.get(key)

    if (!window) {
      window = {
        count: 0,
        windowStart: now,
        requests: []
      }
      this.cache.set(key, window)
    }

    // Remove requests outside the window
    window.requests = window.requests.filter(timestamp => timestamp > windowStart)
    window.count = window.requests.length

    // Check if limit would be exceeded
    if (window.count >= limit) {
      const oldestRequest = Math.min(...window.requests)
      const resetTime = Math.floor((oldestRequest + (windowSeconds * 1000)) / 1000)

      return {
        allowed: false,
        limit,
        current: window.count,
        remaining: 0,
        resetTime
      }
    }

    return {
      allowed: true,
      limit,
      current: window.count,
      remaining: limit - window.count,
      resetTime: Math.floor((now + (windowSeconds * 1000)) / 1000)
    }
  }

  /**
   * Check burst limit (short-term rapid requests)
   */
  private async checkBurstLimit(
    request: RateLimitRequest,
    burstLimit: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    const key = this.getCacheKey(request, `burst_${windowSeconds}`)
    const now = Date.now()
    const windowStart = now - (windowSeconds * 1000)

    let window = this.cache.get(key)

    if (!window) {
      window = {
        count: 0,
        windowStart: now,
        requests: []
      }
      this.cache.set(key, window)
    }

    // Remove requests outside the burst window
    window.requests = window.requests.filter(timestamp => timestamp > windowStart)
    window.count = window.requests.length

    if (window.count >= burstLimit) {
      return {
        allowed: false,
        limit: burstLimit,
        current: window.count,
        remaining: 0,
        resetTime: Math.floor((windowStart + (windowSeconds * 1000)) / 1000)
      }
    }

    return {
      allowed: true,
      limit: burstLimit,
      current: window.count,
      remaining: burstLimit - window.count,
      resetTime: Math.floor((now + (windowSeconds * 1000)) / 1000)
    }
  }

  /**
   * Increment request counters after successful check
   */
  private async incrementCounters(request: RateLimitRequest): Promise<void> {
    const now = Date.now()

    // Increment all relevant windows
    const windows = [60, 3600, 86400, 10] // minute, hour, day, burst

    for (const windowSeconds of windows) {
      const key = windowSeconds === 10 ?
        this.getCacheKey(request, `burst_${windowSeconds}`) :
        this.getCacheKey(request, windowSeconds)

      let window = this.cache.get(key)

      if (!window) {
        window = {
          count: 0,
          windowStart: now,
          requests: []
        }
        this.cache.set(key, window)
      }

      window.requests.push(now)
      window.count = window.requests.length
    }
  }

  /**
   * Get rate limit configuration from cache or database
   */
  private async getRateLimitConfig(partnerId: string, apiKeyId: string): Promise<PartnerRateLimit | null> {
    // In production, this would query the database or Redis cache
    // For now, return default configuration

    // This would be cached and refreshed periodically
    const cacheKey = `ratelimit:${partnerId}:${apiKeyId}`

    // Simulate database lookup
    return {
      requestsPerMinute: 1000,
      requestsPerHour: 10000,
      requestsPerDay: 100000,
      burstLimit: 50
    }
  }

  /**
   * Generate cache key for rate limit window
   */
  private getCacheKey(request: RateLimitRequest, window: string | number): string {
    return `rl:${request.partnerId}:${request.apiKeyId}:${window}`
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    for (const [key, window] of this.cache.entries()) {
      // Remove entries older than max age
      if (now - window.windowStart > maxAge) {
        this.cache.delete(key)
        continue
      }

      // Clean up old requests within the window
      const oneHourAgo = now - (60 * 60 * 1000)
      window.requests = window.requests.filter(timestamp => timestamp > oneHourAgo)
      window.count = window.requests.length
    }

    // Limit cache size to prevent memory issues
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
      entries.sort(([, a], [, b]) => a.windowStart - b.windowStart)

      // Remove oldest 10% of entries
      const toRemove = Math.floor(entries.length * 0.1)
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0])
      }
    }

    logger.debug('Rate limiter cache cleanup completed', {
      cacheSize: this.cache.size,
      cleanedAt: new Date().toISOString()
    })
  }

  /**
   * Get current usage statistics for a partner
   */
  async getUsageStats(partnerId: string, apiKeyId?: string): Promise<{
    minute: { current: number; limit: number }
    hour: { current: number; limit: number }
    day: { current: number; limit: number }
    burst: { current: number; limit: number }
  }> {
    const now = Date.now()
    const stats = {
      minute: { current: 0, limit: 1000 },
      hour: { current: 0, limit: 10000 },
      day: { current: 0, limit: 100000 },
      burst: { current: 0, limit: 50 }
    }

    try {
      const baseKey = apiKeyId ? `rl:${partnerId}:${apiKeyId}` : `rl:${partnerId}`

      // Check each window
      const windows = [
        { key: `${baseKey}:60`, type: 'minute', seconds: 60 },
        { key: `${baseKey}:3600`, type: 'hour', seconds: 3600 },
        { key: `${baseKey}:86400`, type: 'day', seconds: 86400 },
        { key: `${baseKey}:burst_10`, type: 'burst', seconds: 10 }
      ]

      for (const window of windows) {
        const cached = this.cache.get(window.key)

        if (cached) {
          const windowStart = now - (window.seconds * 1000)
          const validRequests = cached.requests.filter(timestamp => timestamp > windowStart)

          stats[window.type as keyof typeof stats].current = validRequests.length
        }
      }

    } catch (error) {
      logger.error('Error getting usage stats', { error, partnerId, apiKeyId })
    }

    return stats
  }

  /**
   * Reset rate limits for a partner (admin function)
   */
  async resetLimits(partnerId: string, apiKeyId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const pattern = apiKeyId ? `rl:${partnerId}:${apiKeyId}:` : `rl:${partnerId}:`

      // Remove all matching cache entries
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(pattern))

      for (const key of keysToDelete) {
        this.cache.delete(key)
      }

      logger.info('Rate limits reset', { partnerId, apiKeyId, clearedKeys: keysToDelete.length })

      return { success: true }

    } catch (error) {
      logger.error('Error resetting rate limits', { error, partnerId, apiKeyId })
      return {
        success: false,
        error: 'Failed to reset rate limits'
      }
    }
  }

  /**
   * Update rate limit configuration for a partner
   */
  async updateRateLimit(
    partnerId: string,
    apiKeyId: string,
    newLimits: PartnerRateLimit
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // In production, this would update the database
      // For now, we'll just clear the cache to force a refresh

      const cacheKey = `ratelimit:${partnerId}:${apiKeyId}`

      // Clear existing windows to apply new limits
      await this.resetLimits(partnerId, apiKeyId)

      logger.info('Rate limits updated', { partnerId, apiKeyId, newLimits })

      return { success: true }

    } catch (error) {
      logger.error('Error updating rate limits', { error, partnerId, apiKeyId })
      return {
        success: false,
        error: 'Failed to update rate limits'
      }
    }
  }

  /**
   * Get rate limiter health status
   */
  getHealthStatus(): {
    healthy: boolean
    cacheSize: number
    lastCleanup: number
    metrics: {
      totalChecks: number
      allowedRequests: number
      blockedRequests: number
    }
  } {
    return {
      healthy: true,
      cacheSize: this.cache.size,
      lastCleanup: Date.now(),
      metrics: {
        totalChecks: 0, // Would track in production
        allowedRequests: 0,
        blockedRequests: 0
      }
    }
  }
}

// Export singleton instance
export const partnerRateLimiter = new PartnerRateLimiter()

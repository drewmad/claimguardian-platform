/**
 * @fileMetadata
 * @purpose "Middleware to add intelligent caching to API routes"
 * @dependencies ["@/lib/cache", "@/lib/api"]
 * @owner performance-team
 * @status stable
 */

import { NextRequest, NextResponse } from 'next/server'
import { cacheManager, CACHE_CONFIGS, generateAPIKey } from './redis-cache'

interface CacheMiddlewareOptions {
  endpoint: keyof typeof CACHE_CONFIGS
  skipCache?: boolean
  customKey?: string
  customTTL?: number
  invalidateOnMutate?: boolean
}

/**
 * Cache middleware for API routes
 */
export function withCacheMiddleware(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  options: CacheMiddlewareOptions
) {
  return async function(request: NextRequest, context: any): Promise<NextResponse> {
    const { method } = request
    const { endpoint, skipCache, customKey, customTTL, invalidateOnMutate } = options

    // Skip caching for non-GET requests unless specifically configured
    if (method !== 'GET' || skipCache) {
      const response = await handler(request, context)
      
      // Invalidate cache on mutations if configured
      if (invalidateOnMutate && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        const config = CACHE_CONFIGS[endpoint]
        if (config?.tags) {
          await Promise.all(
            config.tags.map(tag => cacheManager.invalidateByTag(tag))
          )
        }
      }
      
      return response
    }

    try {
      // Generate cache key
      const url = new URL(request.url)
      const params = Object.fromEntries(url.searchParams.entries())
      const userId = context?.userId
      
      const cacheKey = customKey || generateAPIKey(
        `${endpoint}_${method}`,
        params,
        userId
      )

      // Get cache configuration
      const cacheConfig = CACHE_CONFIGS[endpoint]
      const ttl = customTTL || cacheConfig?.ttl

      // Try to get cached response
      const startTime = Date.now()
      const cachedResponse = await cacheManager.get(cacheKey)
      
      if (cachedResponse) {
        const responseTime = Date.now() - startTime
        
        // Add cache headers
        const response = NextResponse.json(cachedResponse)
        response.headers.set('X-Cache', 'HIT')
        response.headers.set('X-Cache-Time', `${responseTime}ms`)
        response.headers.set('X-Cache-Key', cacheKey.substring(0, 16))
        
        return response
      }

      // Cache miss - execute handler
      const response = await handler(request, context)
      
      // Only cache successful responses
      if (response.status >= 200 && response.status < 300) {
        try {
          // Clone response to read body
          const responseClone = response.clone()
          const responseData = await responseClone.json()
          
          // Cache the response data
          await cacheManager.set(cacheKey, responseData, {
            ttl,
            tags: cacheConfig?.tags,
            compress: true
          })
          
          // Add cache headers to original response
          response.headers.set('X-Cache', 'MISS')
          response.headers.set('X-Cache-Key', cacheKey.substring(0, 16))
          
        } catch (error) {
          // If response is not JSON, just return without caching
          console.warn(`[Cache] Could not cache response for ${endpoint}:`, error)
        }
      }

      return response

    } catch (error) {
      console.error(`[Cache] Error in cache middleware for ${endpoint}:`, error)
      // Fall back to original handler on cache errors
      return handler(request, context)
    }
  }
}

/**
 * Higher-order function to wrap API handlers with caching
 */
export function cacheable(options: CacheMiddlewareOptions) {
  return function<T extends (request: NextRequest, context: any) => Promise<NextResponse>>(
    handler: T
  ): T {
    return withCacheMiddleware(handler, options) as T
  }
}

/**
 * Cache invalidation utilities
 */
export class CacheInvalidator {
  /**
   * Invalidate user-specific cache entries
   */
  static async invalidateUserCache(userId: string): Promise<void> {
    await cacheManager.invalidateByPattern(`*${userId}*`)
  }

  /**
   * Invalidate cache by endpoint type
   */
  static async invalidateEndpoint(endpoint: keyof typeof CACHE_CONFIGS): Promise<void> {
    const config = CACHE_CONFIGS[endpoint]
    if (config?.tags) {
      await Promise.all(
        config.tags.map(tag => cacheManager.invalidateByTag(tag))
      )
    }
  }

  /**
   * Invalidate properties cache for user
   */
  static async invalidateUserProperties(userId: string): Promise<void> {
    await cacheManager.invalidateByPattern(`*properties*${userId}*`)
    await cacheManager.invalidateByTag('properties')
  }

  /**
   * Invalidate claims cache for user
   */
  static async invalidateUserClaims(userId: string): Promise<void> {
    await cacheManager.invalidateByPattern(`*claims*${userId}*`)
    await cacheManager.invalidateByTag('claims')
  }

  /**
   * Invalidate AI usage analytics
   */
  static async invalidateAIAnalytics(): Promise<void> {
    await cacheManager.invalidateByTag('analytics')
    await cacheManager.invalidateByTag('ai')
  }

  /**
   * Scheduled cache cleanup
   */
  static async scheduledCleanup(): Promise<void> {
    // This would typically be called by a cron job
    const metrics = cacheManager.getMetrics()
    
    console.log('[Cache] Scheduled cleanup:', {
      entries: metrics.entryCount,
      hitRate: `${(metrics.hitRate * 100).toFixed(2)}%`,
      memoryUsage: `${(metrics.totalSize / 1024 / 1024).toFixed(2)}MB`
    })

    // Force cleanup if memory usage is high
    const status = cacheManager.getStatus()
    if (status.memoryUsage.percentage > 80) {
      console.log('[Cache] High memory usage, forcing cleanup')
      await cacheManager.clear()
    }
  }
}

/**
 * Cache monitoring endpoint data
 */
export function getCacheHealth() {
  const status = cacheManager.getStatus()
  const metrics = cacheManager.getMetrics()

  return {
    status: status.memoryUsage.percentage < 90 ? 'healthy' : 'warning',
    metrics: {
      hitRate: `${(metrics.hitRate * 100).toFixed(2)}%`,
      entries: metrics.entryCount,
      memoryUsage: `${(status.memoryUsage.used / 1024 / 1024).toFixed(2)}MB`,
      memoryLimit: `${(status.memoryUsage.limit / 1024 / 1024).toFixed(2)}MB`,
      costSaved: `$${metrics.costSaved.toFixed(4)}`
    },
    performance: {
      avgResponseTime: `${metrics.avgResponseTime.toFixed(2)}ms`,
      totalRequests: metrics.hits + metrics.misses,
      cacheEfficiency: metrics.hits > 0 ? 'optimal' : 'warming'
    }
  }
}

export default {
  withCacheMiddleware,
  cacheable,
  CacheInvalidator,
  getCacheHealth
}
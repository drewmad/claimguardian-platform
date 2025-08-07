/**
 * @fileMetadata
 * @purpose "Advanced caching strategies and patterns for different data types and access patterns"
 * @owner backend-team
 * @dependencies ["@/lib/database/cache-manager", "@/lib/logger"]
 * @exports ["CacheStrategyFactory", "DataCacheStrategy", "QueryCacheStrategy", "SessionCacheStrategy"]
 * @complexity high
 * @tags ["database", "caching", "strategies", "patterns", "optimization"]
 * @status stable
 */

import { getCacheManager, type CacheLevel, type CacheStrategy } from './cache-manager'
import { logger } from '@/lib/logger'

export type DataPattern =
  | 'frequently-accessed'    // High read frequency, low write frequency
  | 'session-based'         // User session data
  | 'real-time'             // Time-sensitive data with short TTL
  | 'reference-data'        // Static reference data with long TTL
  | 'user-specific'         // User-specific data with medium TTL
  | 'computational'         // Expensive computation results
  | 'temporary'             // Short-lived temporary data

export type AccessPattern =
  | 'read-heavy'            // Mostly read operations
  | 'write-heavy'           // Mostly write operations
  | 'balanced'              // Equal read/write operations
  | 'burst'                 // Periodic high activity bursts
  | 'streaming'             // Continuous data flow

export interface CacheStrategyConfig {
  pattern: DataPattern
  accessPattern: AccessPattern
  levels: CacheLevel[]
  strategy: CacheStrategy
  ttl: number
  maxSize?: number
  compression: boolean
  encryption: boolean
  invalidationStrategy: 'time-based' | 'event-based' | 'manual'
  warmupStrategy?: 'eager' | 'lazy' | 'scheduled'
}

export interface CacheKey {
  namespace: string
  identifier: string | number
  version?: string | number
  userId?: string
  metadata?: Record<string, any>
}

export interface CacheOptions {
  ttl?: number
  levels?: CacheLevel[]
  skipCache?: boolean
  forceRefresh?: boolean
  warmup?: boolean
  tags?: string[]
}

export abstract class BaseCacheStrategy {
  protected cacheManager = getCacheManager()
  protected config: CacheStrategyConfig

  constructor(config: CacheStrategyConfig) {
    this.config = config
  }

  /**
   * Generate cache key from components
   */
  protected generateCacheKey(key: CacheKey): string {
    const parts = [key.namespace, key.identifier]

    if (key.version) parts.push(`v${key.version}`)
    if (key.userId) parts.push(`u${key.userId}`)

    let cacheKey = parts.join(':')

    if (key.metadata) {
      const metadataHash = this.hashObject(key.metadata)
      cacheKey += `:${metadataHash}`
    }

    return cacheKey
  }

  /**
   * Abstract methods to be implemented by specific strategies
   */
  abstract get<T>(key: CacheKey, options?: CacheOptions): Promise<T | null>
  abstract set<T>(key: CacheKey, value: T, options?: CacheOptions): Promise<void>
  abstract invalidate(key: CacheKey, options?: { pattern?: boolean }): Promise<void>
  abstract warmup(keys?: CacheKey[]): Promise<void>

  /**
   * Utility methods
   */
  protected hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort())
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  protected shouldSkipCache(options?: CacheOptions): boolean {
    return options?.skipCache === true || options?.forceRefresh === true
  }

  protected getTTL(options?: CacheOptions): number {
    return options?.ttl ?? this.config.ttl
  }

  protected getLevels(options?: CacheOptions): CacheLevel[] {
    return options?.levels ?? this.config.levels
  }
}

/**
 * Strategy for frequently accessed data with high read/write ratio
 */
export class FrequentlyAccessedStrategy extends BaseCacheStrategy {
  constructor() {
    super({
      pattern: 'frequently-accessed',
      accessPattern: 'read-heavy',
      levels: ['memory', 'browser'],
      strategy: 'write-through',
      ttl: 15 * 60 * 1000, // 15 minutes
      compression: true,
      encryption: false,
      invalidationStrategy: 'time-based',
      warmupStrategy: 'eager'
    })
  }

  async get<T>(key: CacheKey, options?: CacheOptions): Promise<T | null> {
    if (this.shouldSkipCache(options)) return null

    const cacheKey = this.generateCacheKey(key)

    try {
      const result = await this.cacheManager.get<T>(cacheKey, {
        levels: this.getLevels(options)
      })

      if (result) {
        logger.debug('Cache hit for frequently accessed data', { key: cacheKey })
      }

      return result
    } catch (error) {
      logger.warn('Cache get failed for frequently accessed data', { key: cacheKey }, error as Error)
      return null
    }
  }

  async set<T>(key: CacheKey, value: T, options?: CacheOptions): Promise<void> {
    const cacheKey = this.generateCacheKey(key)

    try {
      await this.cacheManager.set(cacheKey, value, {
        ttl: this.getTTL(options),
        levels: this.getLevels(options)
      })

      logger.debug('Cached frequently accessed data', { key: cacheKey })
    } catch (error) {
      logger.error('Cache set failed for frequently accessed data', { key: cacheKey }, error as Error)
    }
  }

  async invalidate(key: CacheKey, options?: { pattern?: boolean }): Promise<void> {
    const cacheKey = this.generateCacheKey(key)

    try {
      await this.cacheManager.delete(cacheKey)
      logger.debug('Invalidated frequently accessed data', { key: cacheKey })
    } catch (error) {
      logger.error('Cache invalidation failed', { key: cacheKey }, error as Error)
    }
  }

  async warmup(keys: CacheKey[] = []): Promise<void> {
    // Implement warmup logic for frequently accessed data
    logger.info('Warming up frequently accessed data cache', { keyCount: keys.length })
  }
}

/**
 * Strategy for session-based data with user-specific TTL
 */
export class SessionBasedStrategy extends BaseCacheStrategy {
  constructor() {
    super({
      pattern: 'session-based',
      accessPattern: 'balanced',
      levels: ['memory', 'browser'],
      strategy: 'cache-aside',
      ttl: 30 * 60 * 1000, // 30 minutes
      compression: false,
      encryption: true, // Session data should be encrypted
      invalidationStrategy: 'event-based',
      warmupStrategy: 'lazy'
    })
  }

  async get<T>(key: CacheKey, options?: CacheOptions): Promise<T | null> {
    if (this.shouldSkipCache(options)) return null
    if (!key.userId) {
      logger.warn('Session cache requires userId', { key })
      return null
    }

    const cacheKey = this.generateCacheKey(key)

    try {
      const result = await this.cacheManager.get<T>(cacheKey, {
        levels: ['memory', 'browser'] // Keep session data close to user
      })

      return result
    } catch (error) {
      logger.warn('Session cache get failed', { key: cacheKey }, error as Error)
      return null
    }
  }

  async set<T>(key: CacheKey, value: T, options?: CacheOptions): Promise<void> {
    if (!key.userId) {
      logger.warn('Session cache requires userId', { key })
      return
    }

    const cacheKey = this.generateCacheKey(key)

    try {
      await this.cacheManager.set(cacheKey, value, {
        ttl: this.getTTL(options),
        levels: ['memory', 'browser']
      })
    } catch (error) {
      logger.error('Session cache set failed', { key: cacheKey }, error as Error)
    }
  }

  async invalidate(key: CacheKey, options?: { pattern?: boolean }): Promise<void> {
    const cacheKey = this.generateCacheKey(key)

    try {
      if (options?.pattern && key.userId) {
        // Invalidate all session data for user
        const pattern = `${key.namespace}:*:u${key.userId}:*`
        await this.invalidatePattern(pattern)
      } else {
        await this.cacheManager.delete(cacheKey)
      }
    } catch (error) {
      logger.error('Session cache invalidation failed', { key: cacheKey }, error as Error)
    }
  }

  async warmup(keys: CacheKey[] = []): Promise<void> {
    // Session data is typically warmed up lazily
    logger.debug('Session cache uses lazy warmup strategy')
  }

  private async invalidatePattern(pattern: string): Promise<void> {
    // Implement pattern-based invalidation
    logger.info('Invalidating session cache pattern', { pattern })
  }
}

/**
 * Strategy for real-time data with short TTL and high refresh rate
 */
export class RealTimeStrategy extends BaseCacheStrategy {
  constructor() {
    super({
      pattern: 'real-time',
      accessPattern: 'burst',
      levels: ['memory'], // Only memory for real-time data
      strategy: 'write-around',
      ttl: 30 * 1000, // 30 seconds
      compression: false,
      encryption: false,
      invalidationStrategy: 'time-based',
      warmupStrategy: 'scheduled'
    })
  }

  async get<T>(key: CacheKey, options?: CacheOptions): Promise<T | null> {
    if (this.shouldSkipCache(options)) return null

    const cacheKey = this.generateCacheKey(key)

    try {
      return await this.cacheManager.get<T>(cacheKey, {
        levels: ['memory']
      })
    } catch (error) {
      logger.warn('Real-time cache get failed', { key: cacheKey }, error as Error)
      return null
    }
  }

  async set<T>(key: CacheKey, value: T, options?: CacheOptions): Promise<void> {
    const cacheKey = this.generateCacheKey(key)

    try {
      await this.cacheManager.set(cacheKey, value, {
        ttl: this.getTTL(options),
        levels: ['memory'],
        skipLowerLevels: true // Only cache in memory for real-time data
      })
    } catch (error) {
      logger.error('Real-time cache set failed', { key: cacheKey }, error as Error)
    }
  }

  async invalidate(key: CacheKey): Promise<void> {
    const cacheKey = this.generateCacheKey(key)

    try {
      await this.cacheManager.delete(cacheKey, { levels: ['memory'] })
    } catch (error) {
      logger.error('Real-time cache invalidation failed', { key: cacheKey }, error as Error)
    }
  }

  async warmup(keys: CacheKey[] = []): Promise<void> {
    // Real-time data is refreshed on schedule
    logger.info('Scheduling real-time data refresh', { keyCount: keys.length })
  }
}

/**
 * Strategy for reference data with very long TTL
 */
export class ReferenceDataStrategy extends BaseCacheStrategy {
  constructor() {
    super({
      pattern: 'reference-data',
      accessPattern: 'read-heavy',
      levels: ['memory', 'browser'],
      strategy: 'cache-aside',
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      compression: true,
      encryption: false,
      invalidationStrategy: 'manual',
      warmupStrategy: 'eager'
    })
  }

  async get<T>(key: CacheKey, options?: CacheOptions): Promise<T | null> {
    if (this.shouldSkipCache(options)) return null

    const cacheKey = this.generateCacheKey(key)

    try {
      const result = await this.cacheManager.get<T>(cacheKey, {
        levels: this.getLevels(options)
      })

      // For reference data, we can be more aggressive about caching
      if (result) {
        logger.debug('Reference data cache hit', { key: cacheKey })
      }

      return result
    } catch (error) {
      logger.warn('Reference data cache get failed', { key: cacheKey }, error as Error)
      return null
    }
  }

  async set<T>(key: CacheKey, value: T, options?: CacheOptions): Promise<void> {
    const cacheKey = this.generateCacheKey(key)

    try {
      await this.cacheManager.set(cacheKey, value, {
        ttl: this.getTTL(options),
        levels: this.getLevels(options)
      })

      logger.debug('Cached reference data', { key: cacheKey })
    } catch (error) {
      logger.error('Reference data cache set failed', { key: cacheKey }, error as Error)
    }
  }

  async invalidate(key: CacheKey, options?: { pattern?: boolean }): Promise<void> {
    const cacheKey = this.generateCacheKey(key)

    try {
      if (options?.pattern) {
        // Invalidate all reference data in namespace
        const pattern = `${key.namespace}:*`
        await this.invalidateNamespace(pattern)
      } else {
        await this.cacheManager.delete(cacheKey)
      }
    } catch (error) {
      logger.error('Reference data invalidation failed', { key: cacheKey }, error as Error)
    }
  }

  async warmup(keys: CacheKey[] = []): Promise<void> {
    logger.info('Warming up reference data cache', { keyCount: keys.length })

    // Implement aggressive warmup for reference data
    for (const key of keys) {
      try {
        // This would typically fetch from database and cache
        await this.get(key, { warmup: true })
      } catch (error) {
        logger.warn('Reference data warmup failed for key', { key }, error as Error)
      }
    }
  }

  private async invalidateNamespace(pattern: string): Promise<void> {
    logger.info('Invalidating reference data namespace', { pattern })
    // Implement namespace invalidation
  }
}

/**
 * Strategy for expensive computational results
 */
export class ComputationalStrategy extends BaseCacheStrategy {
  constructor() {
    super({
      pattern: 'computational',
      accessPattern: 'read-heavy',
      levels: ['memory', 'browser'],
      strategy: 'cache-aside',
      ttl: 60 * 60 * 1000, // 1 hour
      compression: true,
      encryption: false,
      invalidationStrategy: 'time-based',
      warmupStrategy: 'lazy'
    })
  }

  async get<T>(key: CacheKey, options?: CacheOptions): Promise<T | null> {
    if (this.shouldSkipCache(options)) return null

    const cacheKey = this.generateCacheKey(key)

    try {
      const result = await this.cacheManager.get<T>(cacheKey)

      if (result) {
        logger.debug('Computational cache hit - saved expensive operation', { key: cacheKey })
      }

      return result
    } catch (error) {
      logger.warn('Computational cache get failed', { key: cacheKey }, error as Error)
      return null
    }
  }

  async set<T>(key: CacheKey, value: T, options?: CacheOptions): Promise<void> {
    const cacheKey = this.generateCacheKey(key)

    try {
      // Use longer TTL for expensive computations
      const ttl = options?.ttl ?? this.config.ttl

      await this.cacheManager.set(cacheKey, value, {
        ttl,
        levels: this.getLevels(options)
      })

      logger.info('Cached expensive computation result', { key: cacheKey, ttl })
    } catch (error) {
      logger.error('Computational cache set failed', { key: cacheKey }, error as Error)
    }
  }

  async invalidate(key: CacheKey): Promise<void> {
    const cacheKey = this.generateCacheKey(key)

    try {
      await this.cacheManager.delete(cacheKey)
      logger.debug('Invalidated computational cache', { key: cacheKey })
    } catch (error) {
      logger.error('Computational cache invalidation failed', { key: cacheKey }, error as Error)
    }
  }

  async warmup(keys: CacheKey[] = []): Promise<void> {
    // Computational cache uses lazy loading to avoid expensive operations on startup
    logger.debug('Computational cache uses lazy warmup strategy')
  }
}

/**
 * Factory for creating appropriate cache strategies
 */
export class CacheStrategyFactory {
  private static strategies: Map<DataPattern, BaseCacheStrategy> = new Map()

  static getStrategy(pattern: DataPattern): BaseCacheStrategy {
    if (!this.strategies.has(pattern)) {
      this.strategies.set(pattern, this.createStrategy(pattern))
    }

    return this.strategies.get(pattern)!
  }

  private static createStrategy(pattern: DataPattern): BaseCacheStrategy {
    switch (pattern) {
      case 'frequently-accessed':
        return new FrequentlyAccessedStrategy()

      case 'session-based':
        return new SessionBasedStrategy()

      case 'real-time':
        return new RealTimeStrategy()

      case 'reference-data':
        return new ReferenceDataStrategy()

      case 'computational':
        return new ComputationalStrategy()

      case 'user-specific':
        return new SessionBasedStrategy() // Similar to session-based

      case 'temporary':
        return new RealTimeStrategy() // Similar to real-time but shorter TTL

      default:
        return new FrequentlyAccessedStrategy() // Default fallback
    }
  }

  /**
   * Get strategy recommendations based on access patterns
   */
  static getRecommendedStrategy(accessPattern: AccessPattern, dataSize: 'small' | 'medium' | 'large'): DataPattern {
    switch (accessPattern) {
      case 'read-heavy':
        return dataSize === 'large' ? 'computational' : 'frequently-accessed'

      case 'write-heavy':
        return 'real-time'

      case 'balanced':
        return 'session-based'

      case 'burst':
        return 'real-time'

      case 'streaming':
        return 'temporary'

      default:
        return 'frequently-accessed'
    }
  }

  /**
   * Clear all cached strategies (useful for testing)
   */
  static clearStrategies(): void {
    this.strategies.clear()
  }
}

// Convenience functions for common caching patterns
export const cacheStrategies = {
  frequentlyAccessed: () => CacheStrategyFactory.getStrategy('frequently-accessed'),
  sessionBased: () => CacheStrategyFactory.getStrategy('session-based'),
  realTime: () => CacheStrategyFactory.getStrategy('real-time'),
  referenceData: () => CacheStrategyFactory.getStrategy('reference-data'),
  computational: () => CacheStrategyFactory.getStrategy('computational')
}

// Export types
export type {
  BaseCacheStrategy as DataCacheStrategy,
  SessionBasedStrategy as SessionCacheStrategy,
  ComputationalStrategy as QueryCacheStrategy
}

/**
 * @fileMetadata
 * @purpose "Redis-based AI response caching system for persistent and scalable caching"
 * @dependencies []
 * @owner ai-team
 * @status stable
 */

interface RedisCacheOptions {
  ttl?: number // Time to live in seconds
  prefix?: string // Key prefix for namespacing
  compression?: boolean // Enable response compression
  serialization?: 'json' | 'msgpack' // Serialization format
}

interface CachedAIResponse {
  response: string
  metadata: {
    model: string
    featureId: string
    timestamp: number
    cost: number
    tokensUsed: number
    responseTime: number
    cacheHit: boolean
    version: string
  }
  hash: string
  expiresAt: number
}

interface CacheStats {
  hits: number
  misses: number
  totalRequests: number
  hitRate: number
  totalSize: number
  avgResponseTime: number
  costSaved: number
  topFeatures: Array<{ featureId: string, hits: number, savings: number }>
}

class RedisAICacheService {
  private isEnabled: boolean = false
  private options: Required<RedisCacheOptions>
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    hitRate: 0,
    totalSize: 0,
    avgResponseTime: 0,
    costSaved: 0,
    topFeatures: []
  }

  constructor(options: RedisCacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 3600, // 1 hour default
      prefix: options.prefix || 'ai_cache:',
      compression: options.compression ?? true,
      serialization: options.serialization || 'json'
    }

    this.initializeRedis()
  }

  /**
   * Initialize Redis connection (mock implementation for development)
   */
  private async initializeRedis(): Promise<void> {
    try {
      // In a real implementation, this would connect to Redis
      // For now, we'll use a mock implementation that stores in memory
      console.log('🔧 Redis AI Cache Service initialized (mock mode)')
      this.isEnabled = true
    } catch (error) {
      console.warn('Redis not available, falling back to in-memory cache:', error)
      this.isEnabled = false
    }
  }

  /**
   * Generate cache key from request parameters
   */
  private generateCacheKey(
    messages: unknown[], 
    featureId: string, 
    model: string,
    userId?: string
  ): string {
    const content = JSON.stringify({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      featureId,
      model,
      userId: userId || 'anonymous'
    })
    
    // Simple hash function for demo (in production, use crypto.createHash)
    const hash = this.simpleHash(content)
    return `${this.options.prefix}${hash}`
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Get cached response
   */
  async get(
    messages: unknown[], 
    featureId: string, 
    model: string,
    userId?: string
  ): Promise<CachedAIResponse | null> {
    if (!this.isEnabled) return null

    this.stats.totalRequests++
    const key = this.generateCacheKey(messages, featureId, model, userId)

    try {
      // Mock Redis GET operation
      const cached = this.mockRedisStorage.get(key)
      
      if (cached) {
        const parsed = JSON.parse(cached) as CachedAIResponse
        
        // Check if expired
        if (Date.now() > parsed.expiresAt) {
          this.mockRedisStorage.delete(key)
          this.stats.misses++
          return null
        }

        // Update stats
        this.stats.hits++
        this.stats.hitRate = (this.stats.hits / this.stats.totalRequests) * 100
        this.stats.costSaved += parsed.metadata.cost
        this.updateFeatureStats(featureId, parsed.metadata.cost)

        console.log(`🎯 Redis Cache HIT: ${featureId} (${model})`)
        return parsed
      }

      this.stats.misses++
      return null
    } catch (error) {
      console.error('Redis cache get error:', error)
      this.stats.misses++
      return null
    }
  }

  /**
   * Cache AI response
   */
  async set(
    messages: unknown[],
    featureId: string,
    model: string,
    response: string,
    metadata: {
      cost: number
      tokensUsed: number
      responseTime: number
    },
    userId?: string
  ): Promise<boolean> {
    if (!this.isEnabled) return false

    const key = this.generateCacheKey(messages, featureId, model, userId)
    const cachedResponse: CachedAIResponse = {
      response,
      metadata: {
        ...metadata,
        model,
        featureId,
        timestamp: Date.now(),
        cacheHit: false,
        version: '1.0'
      },
      hash: key,
      expiresAt: Date.now() + (this.options.ttl * 1000)
    }

    try {
      // Mock Redis SET operation with TTL
      const serialized = JSON.stringify(cachedResponse)
      this.mockRedisStorage.set(key, serialized)
      
      // Update size stats
      this.stats.totalSize += serialized.length

      console.log(`💾 Redis Cache SET: ${featureId} (${model}) - ${serialized.length} bytes`)
      return true
    } catch (error) {
      console.error('Redis cache set error:', error)
      return false
    }
  }

  /**
   * Semantic similarity search for related cached responses
   */
  async findSimilar(
    messages: unknown[], 
    featureId: string, 
    model: string,
    similarityThreshold = 0.85
  ): Promise<CachedAIResponse | null> {
    if (!this.isEnabled) return null

    try {
      // Get all keys with our prefix
      const keys = Array.from(this.mockRedisStorage.keys()).filter(
        key => key.startsWith(this.options.prefix)
      )

      const userQuery = messages[messages.length - 1]?.content || ''
      
      for (const key of keys) {
        const cached = this.mockRedisStorage.get(key)
        if (!cached) continue

        const parsed = JSON.parse(cached) as CachedAIResponse
        
        // Check if expired
        if (Date.now() > parsed.expiresAt) {
          this.mockRedisStorage.delete(key)
          continue
        }

        // Only check same feature and model
        if (parsed.metadata.featureId !== featureId || parsed.metadata.model !== model) {
          continue
        }

        // Calculate similarity (simplified implementation)
        const similarity = this.calculateSimilarity(userQuery, parsed.response)
        
        if (similarity >= similarityThreshold) {
          this.stats.hits++
          this.stats.hitRate = (this.stats.hits / this.stats.totalRequests) * 100
          this.stats.costSaved += parsed.metadata.cost
          this.updateFeatureStats(featureId, parsed.metadata.cost)

          console.log(`🎯 Redis Semantic Cache HIT: ${featureId} (similarity: ${similarity.toFixed(2)})`)
          return parsed
        }
      }

      return null
    } catch (error) {
      console.error('Redis similarity search error:', error)
      return null
    }
  }

  /**
   * Calculate simple text similarity
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/)
    const words2 = text2.toLowerCase().split(/\s+/)
    
    const commonWords = words1.filter(word => words2.includes(word))
    const totalWords = new Set([...words1, ...words2]).size
    
    return commonWords.length / totalWords
  }

  /**
   * Update feature-specific stats
   */
  private updateFeatureStats(featureId: string, cost: number): void {
    const existing = this.stats.topFeatures.find(f => f.featureId === featureId)
    
    if (existing) {
      existing.hits++
      existing.savings += cost
    } else {
      this.stats.topFeatures.push({
        featureId,
        hits: 1,
        savings: cost
      })
    }

    // Keep top 10 features
    this.stats.topFeatures.sort((a, b) => b.savings - a.savings)
    this.stats.topFeatures = this.stats.topFeatures.slice(0, 10)
  }

  /**
   * Clear cache for specific feature
   */
  async clearFeatureCache(featureId: string): Promise<number> {
    if (!this.isEnabled) return 0

    let cleared = 0
    
    try {
      const keys = Array.from(this.mockRedisStorage.keys()).filter(
        key => key.startsWith(this.options.prefix)
      )

      for (const key of keys) {
        const cached = this.mockRedisStorage.get(key)
        if (cached) {
          const parsed = JSON.parse(cached) as CachedAIResponse
          if (parsed.metadata.featureId === featureId) {
            this.mockRedisStorage.delete(key)
            cleared++
          }
        }
      }

      console.log(`🗑️ Cleared ${cleared} cache entries for feature: ${featureId}`)
      return cleared
    } catch (error) {
      console.error('Error clearing feature cache:', error)
      return 0
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<number> {
    if (!this.isEnabled) return 0

    try {
      const keys = Array.from(this.mockRedisStorage.keys()).filter(
        key => key.startsWith(this.options.prefix)
      )

      keys.forEach(key => this.mockRedisStorage.delete(key))
      
      console.log(`🗑️ Cleared all ${keys.length} cache entries`)
      return keys.length
    } catch (error) {
      console.error('Error clearing all cache:', error)
      return 0
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Get cache size info
   */
  async getCacheInfo(): Promise<{
    totalKeys: number
    totalSize: number
    avgEntrySize: number
    oldestEntry: number | null
    newestEntry: number | null
  }> {
    if (!this.isEnabled) {
      return {
        totalKeys: 0,
        totalSize: 0,
        avgEntrySize: 0,
        oldestEntry: null,
        newestEntry: null
      }
    }

    try {
      const keys = Array.from(this.mockRedisStorage.keys()).filter(
        key => key.startsWith(this.options.prefix)
      )

      let totalSize = 0
      let oldestEntry: number | null = null
      let newestEntry: number | null = null

      for (const key of keys) {
        const cached = this.mockRedisStorage.get(key)
        if (cached) {
          const parsed = JSON.parse(cached) as CachedAIResponse
          totalSize += cached.length

          if (!oldestEntry || parsed.metadata.timestamp < oldestEntry) {
            oldestEntry = parsed.metadata.timestamp
          }
          if (!newestEntry || parsed.metadata.timestamp > newestEntry) {
            newestEntry = parsed.metadata.timestamp
          }
        }
      }

      return {
        totalKeys: keys.length,
        totalSize,
        avgEntrySize: keys.length > 0 ? Math.round(totalSize / keys.length) : 0,
        oldestEntry,
        newestEntry
      }
    } catch (error) {
      console.error('Error getting cache info:', error)
      return {
        totalKeys: 0,
        totalSize: 0,
        avgEntrySize: 0,
        oldestEntry: null,
        newestEntry: null
      }
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    latency: number
    error?: string
  }> {
    const startTime = Date.now()
    
    try {
      if (!this.isEnabled) {
        return {
          status: 'unhealthy',
          latency: 0,
          error: 'Redis not available'
        }
      }

      // Test write/read operation
      const testKey = `${this.options.prefix}health_check`
      const testValue = JSON.stringify({ timestamp: Date.now() })
      
      this.mockRedisStorage.set(testKey, testValue)
      const retrieved = this.mockRedisStorage.get(testKey)
      this.mockRedisStorage.delete(testKey)

      const latency = Date.now() - startTime

      if (retrieved === testValue) {
        return {
          status: latency < 100 ? 'healthy' : 'degraded',
          latency
        }
      } else {
        return {
          status: 'unhealthy',
          latency,
          error: 'Read/write test failed'
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Export cache data for analysis
   */
  async exportData(): Promise<{
    metadata: {
      exportTime: number
      totalEntries: number
      totalSize: number
    }
    entries: CachedAIResponse[]
  }> {
    const keys = Array.from(this.mockRedisStorage.keys()).filter(
      key => key.startsWith(this.options.prefix)
    )

    const entries: CachedAIResponse[] = []
    let totalSize = 0

    for (const key of keys) {
      const cached = this.mockRedisStorage.get(key)
      if (cached) {
        const parsed = JSON.parse(cached) as CachedAIResponse
        entries.push(parsed)
        totalSize += cached.length
      }
    }

    return {
      metadata: {
        exportTime: Date.now(),
        totalEntries: entries.length,
        totalSize
      },
      entries
    }
  }

  // Mock Redis storage for development (replace with real Redis in production)
  private mockRedisStorage = new Map<string, string>()
}

// Export singleton instance
export const redisAICacheService = new RedisAICacheService({
  ttl: 3600, // 1 hour
  prefix: 'claimguardian:ai:',
  compression: true,
  serialization: 'json'
})

export type { RedisCacheOptions, CachedAIResponse, CacheStats }
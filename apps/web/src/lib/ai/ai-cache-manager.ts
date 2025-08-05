/**
 * @fileMetadata
 * @purpose AI Response Caching Manager with intelligent cache strategies for cost optimization
 * @owner ai-team  
 * @status active
 */

import { createHash } from 'crypto'

interface CachedResponse {
  response: string
  timestamp: number
  cost: number
  model: string
  featureId: string
  ttl: number
  accessCount: number
  lastAccessed: number
}

interface CacheMetrics {
  hits: number
  misses: number
  totalRequests: number
  costSaved: number
  cacheSize: number
  avgResponseTime: number
}

interface CacheConfig {
  defaultTTL: number
  maxCacheSize: number
  enableCompression: boolean
  enableSemanticSimilarity: boolean
  similarityThreshold: number
}

class AICacheManager {
  private cache = new Map<string, CachedResponse>()
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    costSaved: 0,
    cacheSize: 0,
    avgResponseTime: 0
  }

  private config: CacheConfig = {
    defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
    maxCacheSize: 1000,
    enableCompression: true,
    enableSemanticSimilarity: true,
    similarityThreshold: 0.85
  }

  /**
   * Generate cache key from request parameters
   */
  private generateCacheKey(
    messages: any[],
    featureId: string,
    model: string,
    additionalParams?: Record<string, any>
  ): string {
    const content = JSON.stringify({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      featureId,
      model,
      ...additionalParams
    })

    return createHash('sha256').update(content).digest('hex')
  }

  /**
   * Get cached response if available and valid
   */
  async getCachedResponse(
    messages: any[],
    featureId: string,
    model: string,
    additionalParams?: Record<string, any>
  ): Promise<CachedResponse | null> {
    this.metrics.totalRequests++

    // Try exact match first
    const exactKey = this.generateCacheKey(messages, featureId, model, additionalParams)
    const exactMatch = this.cache.get(exactKey)

    if (exactMatch && this.isCacheValid(exactMatch)) {
      this.updateCacheAccess(exactKey, exactMatch)
      this.metrics.hits++
      this.metrics.costSaved += exactMatch.cost
      return exactMatch
    }

    // Try semantic similarity if enabled
    if (this.config.enableSemanticSimilarity) {
      const similarResponse = await this.findSimilarCachedResponse(
        messages,
        featureId,
        model
      )
      
      if (similarResponse) {
        this.metrics.hits++
        this.metrics.costSaved += similarResponse.cost
        return similarResponse
      }
    }

    this.metrics.misses++
    return null
  }

  /**
   * Cache AI response with intelligent TTL and compression
   */
  async cacheResponse(
    messages: any[],
    featureId: string,
    model: string,
    response: string,
    cost: number,
    responseTime: number,
    additionalParams?: Record<string, any>
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(messages, featureId, model, additionalParams)
    
    // Calculate intelligent TTL based on content type and cost
    const ttl = this.calculateIntelligentTTL(featureId, cost, response.length)
    
    // Compress response if enabled
    const compressedResponse = this.config.enableCompression 
      ? await this.compressResponse(response)
      : response

    const cachedItem: CachedResponse = {
      response: compressedResponse,
      timestamp: Date.now(),
      cost,
      model,
      featureId,
      ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    }

    // Ensure cache size limit
    await this.ensureCacheLimit()
    
    this.cache.set(cacheKey, cachedItem)
    this.metrics.cacheSize = this.cache.size
    this.updateAverageResponseTime(responseTime)
  }

  /**
   * Calculate intelligent TTL based on content characteristics
   */
  private calculateIntelligentTTL(featureId: string, cost: number, responseLength: number): number {
    let ttl = this.config.defaultTTL

    // Feature-specific TTL adjustments
    const featureTTLMultipliers: Record<string, number> = {
      'damage-analyzer': 0.5,    // Image analysis changes with damage progression
      'policy-chat': 2.0,        // Policy documents are more stable
      'settlement-analyzer': 1.5, // Settlement data has medium stability
      'claim-assistant': 1.0,    // General guidance has standard TTL
      'document-generator': 2.0,  // Generated documents are stable
      'communication-helper': 1.5 // Templates are fairly stable
    }

    ttl *= featureTTLMultipliers[featureId] || 1.0

    // Cost-based adjustments - expensive responses cached longer
    if (cost > 0.05) ttl *= 1.5
    if (cost > 0.10) ttl *= 2.0

    // Length-based adjustments - longer responses cached longer
    if (responseLength > 2000) ttl *= 1.2
    if (responseLength > 5000) ttl *= 1.5

    return ttl
  }

  /**
   * Find semantically similar cached responses
   */
  private async findSimilarCachedResponse(
    messages: any[],
    featureId: string,
    model: string
  ): Promise<CachedResponse | null> {
    const currentPrompt = messages.map(m => m.content).join(' ')
    
    for (const [key, cachedItem] of this.cache.entries()) {
      if (cachedItem.featureId !== featureId || !this.isCacheValid(cachedItem)) {
        continue
      }

      // Simple similarity check - in production this would use embeddings
      const similarity = this.calculateTextSimilarity(
        currentPrompt,
        key // Using key as proxy for original prompt
      )

      if (similarity >= this.config.similarityThreshold) {
        this.updateCacheAccess(key, cachedItem)
        return cachedItem
      }
    }

    return null
  }

  /**
   * Simple text similarity calculation (placeholder for embeddings)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }

  /**
   * Check if cached response is still valid
   */
  private isCacheValid(cachedItem: CachedResponse): boolean {
    return Date.now() - cachedItem.timestamp < cachedItem.ttl
  }

  /**
   * Update cache access statistics
   */
  private updateCacheAccess(key: string, cachedItem: CachedResponse): void {
    cachedItem.accessCount++
    cachedItem.lastAccessed = Date.now()
    this.cache.set(key, cachedItem)
  }

  /**
   * Ensure cache doesn't exceed size limit
   */
  private async ensureCacheLimit(): Promise<void> {
    if (this.cache.size >= this.config.maxCacheSize) {
      // Remove LRU items (least recently used)
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
      
      const itemsToRemove = Math.floor(this.config.maxCacheSize * 0.1) // Remove 10%
      for (let i = 0; i < itemsToRemove; i++) {
        this.cache.delete(entries[i][0])
      }
    }
  }

  /**
   * Compress response string (simple implementation)
   */
  private async compressResponse(response: string): Promise<string> {
    // In production, this would use actual compression like gzip
    // For now, just trim whitespace and remove extra spaces
    return response.replace(/\s+/g, ' ').trim()
  }

  /**
   * Update average response time metric
   */
  private updateAverageResponseTime(responseTime: number): void {
    const totalTime = this.metrics.avgResponseTime * (this.metrics.totalRequests - 1)
    this.metrics.avgResponseTime = (totalTime + responseTime) / this.metrics.totalRequests
  }

  /**
   * Get cache metrics for monitoring
   */
  getCacheMetrics(): CacheMetrics & { hitRate: number } {
    const hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.hits / this.metrics.totalRequests) * 100 
      : 0

    return {
      ...this.metrics,
      hitRate
    }
  }

  /**
   * Get cache statistics by feature
   */
  getFeatureStats(): Record<string, { count: number, totalCost: number, avgAge: number }> {
    const stats: Record<string, { count: number, totalCost: number, avgAge: number }> = {}
    const now = Date.now()

    for (const cachedItem of this.cache.values()) {
      if (!stats[cachedItem.featureId]) {
        stats[cachedItem.featureId] = { count: 0, totalCost: 0, avgAge: 0 }
      }

      stats[cachedItem.featureId].count++
      stats[cachedItem.featureId].totalCost += cachedItem.cost
      stats[cachedItem.featureId].avgAge += (now - cachedItem.timestamp)
    }

    // Calculate average ages
    for (const feature in stats) {
      if (stats[feature].count > 0) {
        stats[feature].avgAge = stats[feature].avgAge / stats[feature].count
      }
    }

    return stats
  }

  /**
   * Clear cache for specific feature
   */
  clearFeatureCache(featureId: string): number {
    let removedCount = 0
    for (const [key, cachedItem] of this.cache.entries()) {
      if (cachedItem.featureId === featureId) {
        this.cache.delete(key)
        removedCount++
      }
    }
    this.metrics.cacheSize = this.cache.size
    return removedCount
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): number {
    let removedCount = 0
    for (const [key, cachedItem] of this.cache.entries()) {
      if (!this.isCacheValid(cachedItem)) {
        this.cache.delete(key)
        removedCount++
      }
    }
    this.metrics.cacheSize = this.cache.size
    return removedCount
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config }
  }

  /**
   * Export cache data for analysis
   */
  exportCacheData(): Array<{
    featureId: string
    model: string
    cost: number
    timestamp: number
    accessCount: number
    age: number
  }> {
    const now = Date.now()
    return Array.from(this.cache.values()).map(item => ({
      featureId: item.featureId,
      model: item.model,
      cost: item.cost,
      timestamp: item.timestamp,
      accessCount: item.accessCount,
      age: now - item.timestamp
    }))
  }
}

// Export singleton instance
export const aiCacheManager = new AICacheManager()
export type { CacheMetrics, CacheConfig }
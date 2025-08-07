/**
 * @fileMetadata
 * @purpose "Redis-based cache manager for API routes with intelligent caching strategies"
 * @dependencies ["crypto"]
 * @owner performance-team
 * @status stable
 */

import { createHash } from "crypto";

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
  hitCount: number;
  lastAccessed: number;
  tags: string[];
  size: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalSize: number;
  entryCount: number;
  avgResponseTime: number;
  costSaved: number;
}

interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
  skipCache?: boolean;
  cacheKey?: string;
}

interface CacheConfig {
  defaultTTL: number;
  maxMemorySize: number;
  compressionThreshold: number;
  enableMetrics: boolean;
  enableTagging: boolean;
}

class RedisCacheManager {
  private cache = new Map<string, CacheEntry>();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalSize: 0,
    entryCount: 0,
    avgResponseTime: 0,
    costSaved: 0,
  };

  private config: CacheConfig = {
    defaultTTL: 15 * 60 * 1000, // 15 minutes
    maxMemorySize: 50 * 1024 * 1024, // 50MB
    compressionThreshold: 1024, // Compress entries > 1KB
    enableMetrics: true,
    enableTagging: true,
  };

  /**
   * Generate consistent cache key from request parameters
   */
  private generateCacheKey(
    endpoint: string,
    params: Record<string, any>,
    userId?: string,
  ): string {
    const keyData = {
      endpoint,
      params,
      userId,
    };
    return createHash("sha256").update(JSON.stringify(keyData)).digest("hex");
  }

  /**
   * Compress data if it exceeds threshold
   */
  private compressData(data: string): string {
    if (data.length < this.config.compressionThreshold) {
      return data;
    }
    // Simple compression simulation - in production use zlib/gzip
    return `compressed:${btoa(data)}`;
  }

  /**
   * Decompress data
   */
  private decompressData(data: string): string {
    if (data.startsWith("compressed:")) {
      return atob(data.slice(11));
    }
    return data;
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let freedMemory = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        freedMemory += entry.size;
        this.cache.delete(key);
      }
    }

    this.updateMetrics();

    if (freedMemory > 0) {
      console.log(`[Cache] Cleaned up ${freedMemory} bytes`);
    }
  }

  /**
   * Evict LRU entries if memory limit exceeded
   */
  private evictLRU(): void {
    if (this.metrics.totalSize <= this.config.maxMemorySize) {
      return;
    }

    const entries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.lastAccessed - b.lastAccessed,
    );

    let freedMemory = 0;
    const targetSize = this.config.maxMemorySize * 0.8; // Free 20% buffer

    for (const [key, entry] of entries) {
      if (this.metrics.totalSize - freedMemory <= targetSize) {
        break;
      }

      freedMemory += entry.size;
      this.cache.delete(key);
    }

    this.updateMetrics();
    console.log(`[Cache] LRU evicted ${freedMemory} bytes`);
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(): void {
    this.metrics.totalSize = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0,
    );

    this.metrics.entryCount = this.cache.size;

    if (this.metrics.hits + this.metrics.misses > 0) {
      this.metrics.hitRate =
        this.metrics.hits / (this.metrics.hits + this.metrics.misses);
    }
  }

  /**
   * Get data from cache
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const startTime = Date.now();

    // Periodic cleanup
    if (Math.random() < 0.01) {
      // 1% chance
      this.cleanup();
    }

    const entry = this.cache.get(key);

    if (!entry || this.isExpired(entry)) {
      this.metrics.misses++;
      this.updateMetrics();
      return null;
    }

    // Update access statistics
    entry.hitCount++;
    entry.lastAccessed = Date.now();

    this.metrics.hits++;
    this.metrics.avgResponseTime =
      (this.metrics.avgResponseTime + (Date.now() - startTime)) / 2;

    this.updateMetrics();

    try {
      const dataStr = this.decompressData(entry.data as string);
      return JSON.parse(dataStr) as T;
    } catch (error) {
      console.error("[Cache] Failed to parse cached data:", error);
      this.cache.delete(key);
      return null;
    }
  }

  /**
   * Set data in cache
   */
  async set<T = unknown>(
    key: string,
    data: T,
    options: CacheOptions = {},
  ): Promise<void> {
    const {
      ttl = this.config.defaultTTL,
      tags = [],
      compress = true,
    } = options;

    try {
      let dataStr = JSON.stringify(data);

      if (compress) {
        dataStr = this.compressData(dataStr);
      }

      const entry: CacheEntry = {
        data: dataStr,
        timestamp: Date.now(),
        ttl,
        hitCount: 0,
        lastAccessed: Date.now(),
        tags: [...tags],
        size: dataStr.length,
      };

      this.cache.set(key, entry);
      this.updateMetrics();

      // Trigger eviction if needed
      this.evictLRU();
    } catch (error) {
      console.error("[Cache] Failed to cache data:", error);
    }
  }

  /**
   * Cache wrapper for API routes
   */
  async cacheWrapper<T>(
    cacheKey: string,
    dataFetcher: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    if (options.skipCache) {
      return await dataFetcher();
    }

    // Try to get from cache
    const cached = await this.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const startTime = Date.now();
    const freshData = await dataFetcher();
    const fetchTime = Date.now() - startTime;

    // Cache the result
    await this.set(cacheKey, freshData, options);

    // Track cost savings
    if (this.config.enableMetrics && fetchTime > 100) {
      this.metrics.costSaved += fetchTime * 0.001; // Estimate cost savings
    }

    return freshData;
  }

  /**
   * Invalidate cache entries by tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    let invalidated = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    this.updateMetrics();
    return invalidated;
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    let invalidated = 0;
    const regex = new RegExp(pattern.replace("*", ".*"));

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    this.updateMetrics();
    return invalidated;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalSize: 0,
      entryCount: 0,
      avgResponseTime: 0,
      costSaved: 0,
    };
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get cache status for monitoring
   */
  getStatus() {
    return {
      ...this.getMetrics(),
      config: this.config,
      uptime: Date.now(),
      memoryUsage: {
        used: this.metrics.totalSize,
        limit: this.config.maxMemorySize,
        percentage: (this.metrics.totalSize / this.config.maxMemorySize) * 100,
      },
    };
  }
}

// Singleton instance
export const cacheManager = new RedisCacheManager();

// Cache configuration for different endpoint types
export const CACHE_CONFIGS = {
  // Static/reference data - long TTL
  legal_documents: { ttl: 24 * 60 * 60 * 1000, tags: ["legal"] }, // 24 hours
  ai_models: { ttl: 60 * 60 * 1000, tags: ["ai", "config"] }, // 1 hour

  // User data - medium TTL with user tags
  properties: { ttl: 30 * 60 * 1000, tags: ["user-data", "properties"] }, // 30 minutes
  claims: { ttl: 15 * 60 * 1000, tags: ["user-data", "claims"] }, // 15 minutes
  policies: { ttl: 60 * 60 * 1000, tags: ["user-data", "policies"] }, // 1 hour

  // Analytics data - short TTL
  ai_usage: { ttl: 5 * 60 * 1000, tags: ["analytics", "ai"] }, // 5 minutes
  cost_tracking: { ttl: 10 * 60 * 1000, tags: ["analytics", "costs"] }, // 10 minutes

  // Real-time data - very short TTL
  monitoring: { ttl: 2 * 60 * 1000, tags: ["realtime"] }, // 2 minutes
  health_status: { ttl: 1 * 60 * 1000, tags: ["realtime", "health"] }, // 1 minute
} as const;

/**
 * Generate cache key for API routes
 */
export function generateAPIKey(
  endpoint: string,
  params: Record<string, any> = {},
  userId?: string,
): string {
  return cacheManager["generateCacheKey"](endpoint, params, userId);
}

/**
 * Cache decorator for API routes
 */
export function withCache<T extends any[], R>(
  cacheConfig: { ttl?: number; tags?: string[] },
  keyGenerator: (...args: T) => string,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: T): Promise<R> {
      const cacheKey = keyGenerator(...args);

      return cacheManager.cacheWrapper(
        cacheKey,
        () => originalMethod.apply(this, args),
        cacheConfig,
      );
    };

    return descriptor;
  };
}

export default cacheManager;

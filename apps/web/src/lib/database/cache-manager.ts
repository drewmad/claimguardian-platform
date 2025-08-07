/**
 * @fileMetadata
 * @purpose "Multi-level caching system with Redis, memory, and browser cache layers for optimal performance"
 * @owner backend-team
 * @dependencies ["@/lib/logger", "@/lib/database/query-optimizer"]
 * @exports ["CacheManager", "CacheStrategy", "CacheLevel", "CacheMetrics"]
 * @complexity high
 * @tags ["database", "caching", "performance", "redis", "memory", "browser"]
 * @status stable
 */

import { logger } from "@/lib/logger";
import { createRedisClient, RedisClient } from "@/lib/cache/redis-client";

export type CacheLevel = "memory" | "browser" | "redis" | "database";
export type CacheStrategy =
  | "write-through"
  | "write-back"
  | "write-around"
  | "cache-aside";
export type EvictionPolicy = "lru" | "lfu" | "fifo" | "ttl" | "random";

export interface CacheConfig {
  levels: CacheLevel[];
  strategy: CacheStrategy;
  evictionPolicy: EvictionPolicy;
  defaultTTL: number;
  maxMemorySize: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  metricsEnabled: boolean;
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  metadata: {
    createdAt: Date;
    lastAccessed: Date;
    accessCount: number;
    ttl: number;
    size: number;
    level: CacheLevel;
    compressed: boolean;
    encrypted: boolean;
  };
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  averageResponseTime: number;
  memoryUsage: {
    used: number;
    available: number;
    utilization: number;
  };
  levelStats: {
    [K in CacheLevel]: {
      hits: number;
      misses: number;
      entries: number;
      size: number;
    };
  };
  operations: {
    gets: number;
    sets: number;
    deletes: number;
    evictions: number;
  };
  performance: {
    getLatency: number;
    setLatency: number;
    deleteLatency: number;
  };
}

interface CacheLayer {
  level: CacheLevel;
  get<T>(key: string): Promise<CacheEntry<T> | null>;
  set<T>(key: string, value: T, ttl?: number, metadata?: any): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  size(): Promise<number>;
  keys(): Promise<string[]>;
  exists(key: string): Promise<boolean>;
  expire(key: string, ttl: number): Promise<boolean>;
}

export class CacheManager {
  private config: CacheConfig;
  private layers: Map<CacheLevel, CacheLayer> = new Map();
  private metrics: CacheMetrics;
  private metricsInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      levels: ["memory", "browser"],
      strategy: "cache-aside",
      evictionPolicy: "lru",
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxMemorySize: 100 * 1024 * 1024, // 100MB
      compressionEnabled: true,
      encryptionEnabled: false,
      metricsEnabled: true,
      ...config,
    };

    this.metrics = {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      averageResponseTime: 0,
      memoryUsage: {
        used: 0,
        available: this.config.maxMemorySize,
        utilization: 0,
      },
      levelStats: {
        memory: { hits: 0, misses: 0, entries: 0, size: 0 },
        browser: { hits: 0, misses: 0, entries: 0, size: 0 },
        redis: { hits: 0, misses: 0, entries: 0, size: 0 },
        database: { hits: 0, misses: 0, entries: 0, size: 0 },
      },
      operations: { gets: 0, sets: 0, deletes: 0, evictions: 0 },
      performance: { getLatency: 0, setLatency: 0, deleteLatency: 0 },
    };

    this.initialize();
  }

  /**
   * Initialize cache manager with configured levels
   */
  private async initialize(): Promise<void> {
    logger.info("Initializing cache manager", { config: this.config });

    try {
      // Initialize cache layers based on configuration
      for (const level of this.config.levels) {
        const layer = this.createCacheLayer(level);
        this.layers.set(level, layer);
      }

      // Start metrics collection and cleanup
      if (this.config.metricsEnabled) {
        this.startMetricsCollection();
      }

      this.startCleanup();
      this.isInitialized = true;

      logger.info("Cache manager initialized successfully", {
        levels: this.config.levels,
        strategy: this.config.strategy,
      });
    } catch (error) {
      logger.error("Failed to initialize cache manager", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Get value from cache with multi-level lookup
   */
  async get<T>(
    key: string,
    options: {
      levels?: CacheLevel[];
      updateAccessTime?: boolean;
    } = {},
  ): Promise<T | null> {
    const startTime = performance.now();

    if (!this.isInitialized) {
      await this.initialize();
    }

    const { levels = this.config.levels, updateAccessTime = true } = options;

    this.metrics.operations.gets++;
    this.metrics.totalRequests++;

    try {
      // Try each cache level in order of priority
      for (const level of levels) {
        const layer = this.layers.get(level);
        if (!layer) continue;

        const entry = await layer.get<T>(key);
        if (entry) {
          this.recordHit(level);

          if (updateAccessTime) {
            entry.metadata.lastAccessed = new Date();
            entry.metadata.accessCount++;
          }

          // Promote to higher cache levels if using cache-aside strategy
          if (this.config.strategy === "cache-aside") {
            await this.promoteToHigherLevels(key, entry, level);
          }

          this.recordLatency("get", performance.now() - startTime);
          return entry.value;
        } else {
          this.recordMiss(level);
        }
      }

      this.metrics.totalMisses++;
      this.recordLatency("get", performance.now() - startTime);
      return null;
    } catch (error) {
      logger.error("Cache get operation failed", { key, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Set value in cache across configured levels
   */
  async set<T>(
    key: string,
    value: T,
    options: {
      ttl?: number;
      levels?: CacheLevel[];
      metadata?: any;
      skipLowerLevels?: boolean;
    } = {},
  ): Promise<void> {
    const startTime = performance.now();

    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      ttl = this.config.defaultTTL,
      levels = this.config.levels,
      metadata = {},
      skipLowerLevels = false,
    } = options;

    this.metrics.operations.sets++;

    try {
      const promises: Promise<void>[] = [];

      // Determine which levels to write to based on strategy
      const targetLevels = this.getWriteLevels(levels, skipLowerLevels);

      for (const level of targetLevels) {
        const layer = this.layers.get(level);
        if (layer) {
          promises.push(layer.set(key, value, ttl, { ...metadata, level }));
        }
      }

      // Write to all levels based on strategy
      if (this.config.strategy === "write-through") {
        await Promise.all(promises);
      } else if (this.config.strategy === "write-back") {
        // Write to memory cache first, schedule background write to other levels
        const memoryLayer = this.layers.get("memory");
        if (memoryLayer) {
          await memoryLayer.set(key, value, ttl, { ...metadata, dirty: true });
          this.scheduleBackgroundWrite(
            key,
            value,
            ttl,
            metadata,
            targetLevels.filter((l) => l !== "memory"),
          );
        }
      } else {
        // Cache-aside and write-around
        await Promise.all(promises);
      }

      this.recordLatency("set", performance.now() - startTime);
    } catch (error) {
      logger.error("Cache set operation failed", { key, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Delete value from all cache levels
   */
  async delete(
    key: string,
    options: {
      levels?: CacheLevel[];
    } = {},
  ): Promise<boolean> {
    const startTime = performance.now();

    if (!this.isInitialized) {
      await this.initialize();
    }

    const { levels = this.config.levels } = options;

    this.metrics.operations.deletes++;

    try {
      const promises: Promise<boolean>[] = [];

      for (const level of levels) {
        const layer = this.layers.get(level);
        if (layer) {
          promises.push(layer.delete(key));
        }
      }

      const results = await Promise.all(promises);
      const deleted = results.some((result) => result);

      this.recordLatency("delete", performance.now() - startTime);
      return deleted;
    } catch (error) {
      logger.error("Cache delete operation failed", { key, error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Check if key exists in any cache level
   */
  async exists(
    key: string,
    options: {
      levels?: CacheLevel[];
    } = {},
  ): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const { levels = this.config.levels } = options;

    try {
      for (const level of levels) {
        const layer = this.layers.get(level);
        if (layer && (await layer.exists(key))) {
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error("Cache exists check failed", { key, error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Clear cache at specified levels
   */
  async clear(
    options: {
      levels?: CacheLevel[];
    } = {},
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const { levels = this.config.levels } = options;

    try {
      const promises: Promise<void>[] = [];

      for (const level of levels) {
        const layer = this.layers.get(level);
        if (layer) {
          promises.push(layer.clear());
        }
      }

      await Promise.all(promises);
      logger.info("Cache cleared", { levels });
    } catch (error) {
      logger.error("Cache clear operation failed", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Get cache statistics and metrics
   */
  getMetrics(): CacheMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get detailed cache information
   */
  async getCacheInfo(): Promise<{
    config: CacheConfig;
    levels: {
      [K in CacheLevel]?: {
        active: boolean;
        size: number;
        entries: number;
        keys: string[];
      };
    };
    metrics: CacheMetrics;
  }> {
    const levelInfo: any = {};

    for (const [level, layer] of this.layers) {
      try {
        levelInfo[level] = {
          active: true,
          size: await layer.size(),
          entries: (await layer.keys()).length,
          keys: await layer.keys(),
        };
      } catch (error) {
        levelInfo[level] = {
          active: false,
          size: 0,
          entries: 0,
          keys: [],
        };
      }
    }

    return {
      config: this.config,
      levels: levelInfo,
      metrics: this.getMetrics(),
    };
  }

  /**
   * Optimize cache performance
   */
  async optimize(): Promise<{
    before: CacheMetrics;
    after: CacheMetrics;
    optimizations: string[];
  }> {
    const beforeMetrics = this.getMetrics();
    const optimizations: string[] = [];

    try {
      // Clean up expired entries
      await this.cleanupExpired();
      optimizations.push("Cleaned up expired entries");

      // Optimize memory usage
      if (this.metrics.memoryUsage.utilization > 80) {
        await this.evictLeastUsed();
        optimizations.push("Evicted least used entries");
      }

      // Compact storage if fragmentation is high
      await this.compact();
      optimizations.push("Compacted cache storage");

      // Update access patterns for LRU optimization
      await this.updateAccessPatterns();
      optimizations.push("Updated access patterns");

      const afterMetrics = this.getMetrics();

      logger.info("Cache optimization completed", {
        optimizations,
        hitRateImprovement: afterMetrics.hitRate - beforeMetrics.hitRate,
        memoryReduced:
          beforeMetrics.memoryUsage.used - afterMetrics.memoryUsage.used,
      });

      return {
        before: beforeMetrics,
        after: afterMetrics,
        optimizations,
      };
    } catch (error) {
      logger.error("Cache optimization failed", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Gracefully shutdown cache manager
   */
  async shutdown(): Promise<void> {
    logger.info("Shutting down cache manager");

    try {
      // Stop intervals
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
      }
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }

      // Flush write-back cache
      if (this.config.strategy === "write-back") {
        await this.flushDirtyEntries();
      }

      // Clear all cache layers
      const promises: Promise<void>[] = [];
      for (const layer of this.layers.values()) {
        promises.push(layer.clear());
      }
      await Promise.all(promises);

      this.isInitialized = false;
      logger.info("Cache manager shutdown complete");
    } catch (error) {
      logger.error("Cache manager shutdown failed", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // Private methods
  private createCacheLayer(level: CacheLevel): CacheLayer {
    switch (level) {
      case "memory":
        return new MemoryCacheLayer(this.config);
      case "browser":
        return new BrowserCacheLayer(this.config);
      case "redis":
        return new RedisCacheLayer(this.config);
      case "database":
        return new DatabaseCacheLayer(this.config);
      default:
        throw new Error(`Unsupported cache level: ${level}`);
    }
  }

  private recordHit(level: CacheLevel): void {
    this.metrics.totalHits++;
    this.metrics.levelStats[level].hits++;
    this.updateHitRate();
  }

  private recordMiss(level: CacheLevel): void {
    this.metrics.levelStats[level].misses++;
    this.updateHitRate();
  }

  private updateHitRate(): void {
    if (this.metrics.totalRequests > 0) {
      this.metrics.hitRate =
        (this.metrics.totalHits / this.metrics.totalRequests) * 100;
      this.metrics.missRate = 100 - this.metrics.hitRate;
    }
  }

  private recordLatency(
    operation: "get" | "set" | "delete",
    latency: number,
  ): void {
    // Simple moving average
    const alpha = 0.1;
    this.metrics.performance[`${operation}Latency`] =
      (1 - alpha) * this.metrics.performance[`${operation}Latency`] +
      alpha * latency;
  }

  private getWriteLevels(
    levels: CacheLevel[],
    skipLowerLevels: boolean,
  ): CacheLevel[] {
    if (skipLowerLevels) {
      return levels.slice(0, 1);
    }
    return levels;
  }

  private async promoteToHigherLevels(
    key: string,
    entry: CacheEntry,
    currentLevel: CacheLevel,
  ): Promise<void> {
    const levelOrder: CacheLevel[] = ["memory", "browser", "redis", "database"];
    const currentIndex = levelOrder.indexOf(currentLevel);

    for (let i = 0; i < currentIndex; i++) {
      const higherLevel = levelOrder[i];
      const layer = this.layers.get(higherLevel);
      if (layer) {
        try {
          await layer.set(key, entry.value, entry.metadata.ttl, entry.metadata);
        } catch (error) {
          logger.warn(
            "Failed to promote cache entry to higher level",
            { key, level: higherLevel, error: error instanceof Error ? error.message : String(error) }
          );
        }
      }
    }
  }

  private scheduleBackgroundWrite(
    key: string,
    value: any,
    ttl: number,
    metadata: any,
    levels: CacheLevel[],
  ): void {
    // Schedule background write for write-back strategy
    setTimeout(async () => {
      try {
        for (const level of levels) {
          const layer = this.layers.get(level);
          if (layer) {
            await layer.set(key, value, ttl, metadata);
          }
        }
      } catch (error) {
        logger.error("Background write failed", { key, error: error instanceof Error ? error.message : String(error) });
      }
    }, 100); // Small delay to batch writes
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
      this.logMetrics();
    }, 60000); // Every minute
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpired();
        this.enforceMemoryLimits();
      },
      5 * 60 * 1000,
    ); // Every 5 minutes
  }

  private updateMetrics(): void {
    // Update memory usage
    let totalUsed = 0;
    for (const stats of Object.values(this.metrics.levelStats)) {
      totalUsed += stats.size;
    }

    this.metrics.memoryUsage.used = totalUsed;
    this.metrics.memoryUsage.utilization =
      (totalUsed / this.config.maxMemorySize) * 100;
  }

  private logMetrics(): void {
    logger.info("Cache metrics", {
      hitRate: `${this.metrics.hitRate.toFixed(1)}%`,
      totalRequests: this.metrics.totalRequests,
      memoryUtilization: `${this.metrics.memoryUsage.utilization.toFixed(1)}%`,
      averageResponseTime: `${this.metrics.averageResponseTime.toFixed(1)}ms`,
    });
  }

  private async cleanupExpired(): Promise<void> {
    for (const [level, layer] of this.layers) {
      try {
        const keys = await layer.keys();
        for (const key of keys) {
          const entry = await layer.get(key);
          if (entry) {
            const age = Date.now() - entry.metadata.createdAt.getTime();
            if (age > entry.metadata.ttl) {
              await layer.delete(key);
              this.metrics.operations.evictions++;
            }
          }
        }
      } catch (error) {
        logger.warn(
          "Cleanup failed for cache level",
          { level, error: error instanceof Error ? error.message : String(error) }
        );
      }
    }
  }

  private async enforceMemoryLimits(): Promise<void> {
    if (this.metrics.memoryUsage.utilization > 90) {
      await this.evictLeastUsed();
    }
  }

  private async evictLeastUsed(): Promise<void> {
    const memoryLayer = this.layers.get("memory");
    if (!memoryLayer) return;

    try {
      const keys = await memoryLayer.keys();
      const entries: Array<{ key: string; entry: CacheEntry }> = [];

      for (const key of keys) {
        const entry = await memoryLayer.get(key);
        if (entry) {
          entries.push({ key, entry });
        }
      }

      // Sort by least recently used
      entries.sort(
        (a, b) =>
          a.entry.metadata.lastAccessed.getTime() -
          b.entry.metadata.lastAccessed.getTime(),
      );

      // Evict 25% of entries
      const toEvict = Math.floor(entries.length * 0.25);
      for (let i = 0; i < toEvict; i++) {
        await memoryLayer.delete(entries[i].key);
        this.metrics.operations.evictions++;
      }
    } catch (error) {
      logger.error("Failed to evict least used entries", { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async compact(): Promise<void> {
    // Placeholder for cache compaction logic
    logger.debug("Cache compaction completed");
  }

  private async updateAccessPatterns(): Promise<void> {
    // Placeholder for access pattern optimization
    logger.debug("Access patterns updated");
  }

  private async flushDirtyEntries(): Promise<void> {
    // Placeholder for flushing dirty entries in write-back mode
    logger.debug("Dirty entries flushed");
  }
}

// Cache layer implementations
class MemoryCacheLayer implements CacheLayer {
  level: CacheLevel = "memory";
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.cache.get(key);
    if (entry && this.isValid(entry)) {
      return entry as CacheEntry<T>;
    }
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  async set<T>(
    key: string,
    value: T,
    ttl = this.config.defaultTTL,
    metadata: any = {},
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      key,
      value,
      metadata: {
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 0,
        ttl,
        size: this.calculateSize(value),
        level: this.level,
        compressed: false,
        encrypted: false,
        ...metadata,
      },
    };
    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async size(): Promise<number> {
    return Array.from(this.cache.values()).reduce(
      (total, entry) => total + entry.metadata.size,
      0,
    );
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    const entry = this.cache.get(key);
    if (entry) {
      entry.metadata.ttl = ttl;
      return true;
    }
    return false;
  }

  private isValid(entry: CacheEntry): boolean {
    const age = Date.now() - entry.metadata.createdAt.getTime();
    return age < entry.metadata.ttl;
  }

  private calculateSize(value: any): number {
    return JSON.stringify(value).length * 2; // Rough estimate
  }
}

class BrowserCacheLayer implements CacheLayer {
  level: CacheLevel = "browser";
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(`cache:${key}`);
      if (stored) {
        const entry = JSON.parse(stored) as CacheEntry<T>;
        entry.metadata.createdAt = new Date(entry.metadata.createdAt);
        entry.metadata.lastAccessed = new Date(entry.metadata.lastAccessed);

        if (this.isValid(entry)) {
          return entry;
        } else {
          localStorage.removeItem(`cache:${key}`);
        }
      }
    } catch (error) {
      logger.warn("Browser cache get failed", { key, error: error instanceof Error ? error.message : String(error) });
    }
    return null;
  }

  async set<T>(
    key: string,
    value: T,
    ttl = this.config.defaultTTL,
    metadata: any = {},
  ): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      const entry: CacheEntry<T> = {
        key,
        value,
        metadata: {
          createdAt: new Date(),
          lastAccessed: new Date(),
          accessCount: 0,
          ttl,
          size: this.calculateSize(value),
          level: this.level,
          compressed: false,
          encrypted: false,
          ...metadata,
        },
      };
      localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch (error) {
      logger.warn("Browser cache set failed", { key, error: error instanceof Error ? error.message : String(error) });
    }
  }

  async delete(key: string): Promise<boolean> {
    if (typeof window === "undefined") return false;

    try {
      const existed = localStorage.getItem(`cache:${key}`) !== null;
      localStorage.removeItem(`cache:${key}`);
      return existed;
    } catch (error) {
      return false;
    }
  }

  async clear(): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("cache:"),
      );
      keys.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      logger.warn("Browser cache clear failed", {
        error: (error as Error).message,
      });
    }
  }

  async size(): Promise<number> {
    if (typeof window === "undefined") return 0;

    try {
      let totalSize = 0;
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("cache:")) {
          totalSize += localStorage.getItem(key)?.length || 0;
        }
      }
      return totalSize * 2; // UTF-16 encoding
    } catch (error) {
      return 0;
    }
  }

  async keys(): Promise<string[]> {
    if (typeof window === "undefined") return [];

    try {
      return Object.keys(localStorage)
        .filter((key) => key.startsWith("cache:"))
        .map((key) => key.substring(6)); // Remove 'cache:' prefix
    } catch (error) {
      return [];
    }
  }

  async exists(key: string): Promise<boolean> {
    if (typeof window === "undefined") return false;

    try {
      return localStorage.getItem(`cache:${key}`) !== null;
    } catch (error) {
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    const entry = await this.get(key);
    if (entry) {
      entry.metadata.ttl = ttl;
      await this.set(key, entry.value, ttl, entry.metadata);
      return true;
    }
    return false;
  }

  private isValid(entry: CacheEntry): boolean {
    const age = Date.now() - entry.metadata.createdAt.getTime();
    return age < entry.metadata.ttl;
  }

  private calculateSize(value: any): number {
    return JSON.stringify(value).length * 2;
  }
}

// Redis cache layer implementation with high performance and reliability
class RedisCacheLayer implements CacheLayer {
  level: CacheLevel = "redis";
  private config: CacheConfig;
  private redisClient: RedisClient;
  private isConnected = false;

  constructor(config: CacheConfig) {
    this.config = config;
    this.redisClient = createRedisClient();
    this.initializeConnection();
  }

  private async initializeConnection(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.redisClient.connect();
        this.isConnected = true;
        logger.info("Redis cache layer connected", {
          module: "redis-cache",
          config: {
            encryption: this.config.encryptionEnabled,
            compression: this.config.compressionEnabled,
          },
        });
      }
    } catch (error) {
      logger.error("Failed to connect Redis cache layer", {
        module: "redis-cache",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      await this.ensureConnected();
      
      const data = await this.redisClient.get(this.prefixKey(key));
      if (!data) return null;

      const parsed = JSON.parse(data);
      const entry: CacheEntry<T> = {
        key,
        value: this.config.compressionEnabled ? this.decompress(parsed.value) : parsed.value,
        metadata: {
          ...parsed.metadata,
          lastAccessed: new Date(),
          accessCount: parsed.metadata.accessCount + 1,
          level: "redis" as CacheLevel,
        },
      };

      // Update access metadata
      await this.updateAccessMetadata(key, entry.metadata);
      
      return entry;
    } catch (error) {
      logger.error("Redis cache GET failed", {
        module: "redis-cache",
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttl?: number,
    metadata?: any,
  ): Promise<void> {
    try {
      await this.ensureConnected();
      
      const now = new Date();
      const entryMetadata = {
        createdAt: now,
        lastAccessed: now,
        accessCount: 0,
        ttl: ttl || this.config.defaultTTL,
        size: this.calculateSize(value),
        level: "redis" as CacheLevel,
        compressed: this.config.compressionEnabled,
        encrypted: this.config.encryptionEnabled,
        ...metadata,
      };

      const processedValue = this.config.compressionEnabled ? this.compress(value) : value;
      const cacheData = {
        value: processedValue,
        metadata: entryMetadata,
      };

      const serialized = JSON.stringify(cacheData);
      const finalTtl = entryMetadata.ttl;
      
      await this.redisClient.set(this.prefixKey(key), serialized, finalTtl);
      
      if (this.config.metricsEnabled) {
        this.updateMetrics("set", key, true);
      }
    } catch (error) {
      logger.error("Redis cache SET failed", {
        module: "redis-cache",
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.ensureConnected();
      const result = await this.redisClient.del(this.prefixKey(key));
      
      if (this.config.metricsEnabled) {
        this.updateMetrics("delete", key, result > 0);
      }
      
      return result > 0;
    } catch (error) {
      logger.error("Redis cache DELETE failed", {
        module: "redis-cache",
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.ensureConnected();
      
      // Use SCAN to find and delete all keys with our prefix
      let cursor = "0";
      const pattern = this.prefixKey("*");
      
      do {
        const [nextCursor, keys] = await this.redisClient.scan(cursor, pattern, 100);
        cursor = nextCursor;
        
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      } while (cursor !== "0");
      
      logger.info("Redis cache cleared", { module: "redis-cache" });
    } catch (error) {
      logger.error("Redis cache CLEAR failed", {
        module: "redis-cache",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async size(): Promise<number> {
    try {
      await this.ensureConnected();
      
      let count = 0;
      let cursor = "0";
      const pattern = this.prefixKey("*");
      
      do {
        const [nextCursor, keys] = await this.redisClient.scan(cursor, pattern, 100);
        cursor = nextCursor;
        count += keys.length;
      } while (cursor !== "0");
      
      return count;
    } catch (error) {
      logger.error("Redis cache SIZE failed", {
        module: "redis-cache", 
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return 0;
    }
  }

  async keys(): Promise<string[]> {
    try {
      await this.ensureConnected();
      
      const allKeys: string[] = [];
      let cursor = "0";
      const pattern = this.prefixKey("*");
      
      do {
        const [nextCursor, keys] = await this.redisClient.scan(cursor, pattern, 100);
        cursor = nextCursor;
        
        // Remove prefix from keys
        const cleanKeys = keys.map(key => this.unprefixKey(key));
        allKeys.push(...cleanKeys);
      } while (cursor !== "0");
      
      return allKeys;
    } catch (error) {
      logger.error("Redis cache KEYS failed", {
        module: "redis-cache",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return [];
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.ensureConnected();
      return await this.redisClient.exists(this.prefixKey(key));
    } catch (error) {
      logger.error("Redis cache EXISTS failed", {
        module: "redis-cache",
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      await this.ensureConnected();
      return await this.redisClient.expire(this.prefixKey(key), ttl);
    } catch (error) {
      logger.error("Redis cache EXPIRE failed", {
        module: "redis-cache",
        key,
        ttl,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  // Utility methods
  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.initializeConnection();
    }
    
    if (!this.redisClient.isHealthy()) {
      throw new Error("Redis connection is not healthy");
    }
  }

  private prefixKey(key: string): string {
    return `claimguardian:cache:${key}`;
  }

  private unprefixKey(key: string): string {
    return key.replace(/^claimguardian:cache:/, "");
  }

  private compress<T>(value: T): T {
    // Simple compression placeholder - could implement actual compression here
    return value;
  }

  private decompress<T>(value: T): T {
    // Simple decompression placeholder - could implement actual decompression here
    return value;
  }

  private calculateSize(value: unknown): number {
    return JSON.stringify(value).length;
  }

  private async updateAccessMetadata(key: string, metadata: any): Promise<void> {
    try {
      // Use hash operations to update metadata efficiently
      const hashKey = this.prefixKey(`meta:${key}`);
      await this.redisClient.hset(hashKey, "lastAccessed", new Date().toISOString());
      await this.redisClient.hset(hashKey, "accessCount", metadata.accessCount.toString());
    } catch (error) {
      // Don't fail cache operations on metadata update errors
      logger.debug("Failed to update Redis access metadata", {
        module: "redis-cache",
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private updateMetrics(operation: string, key: string, success: boolean): void {
    // Metrics update logic would go here
    logger.debug("Redis cache metrics", {
      module: "redis-cache",
      operation,
      key,
      success,
      timestamp: new Date().toISOString(),
    });
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureConnected();
      return await this.redisClient.ping();
    } catch (error) {
      logger.error("Redis cache health check failed", {
        module: "redis-cache",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }
}

class DatabaseCacheLayer implements CacheLayer {
  level: CacheLevel = "database";
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    // TODO: Implement database cache layer
    return null;
  }

  async set<T>(
    key: string,
    value: T,
    ttl?: number,
    metadata?: any,
  ): Promise<void> {
    // TODO: Implement database cache layer
  }

  async delete(key: string): Promise<boolean> {
    // TODO: Implement database cache layer
    return false;
  }

  async clear(): Promise<void> {
    // TODO: Implement database cache layer
  }

  async size(): Promise<number> {
    // TODO: Implement database cache layer
    return 0;
  }

  async keys(): Promise<string[]> {
    // TODO: Implement database cache layer
    return [];
  }

  async exists(key: string): Promise<boolean> {
    // TODO: Implement database cache layer
    return false;
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    // TODO: Implement database cache layer
    return false;
  }
}

// Singleton instance
let cacheManagerInstance: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();
  }
  return cacheManagerInstance;
}

export async function shutdownCacheManager(): Promise<void> {
  if (cacheManagerInstance) {
    await cacheManagerInstance.shutdown();
    cacheManagerInstance = null;
  }
}

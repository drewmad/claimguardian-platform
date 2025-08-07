/**
 * @fileMetadata
 * @purpose "Production-grade Redis caching layer with fallback and performance optimization"
 * @dependencies ["ioredis"]
 * @owner platform-team
 * @complexity high
 * @tags ["caching", "redis", "performance", "fallback"]
 * @status stable
 */

import { logger } from "@/lib/logger/production-logger";
import {
  asyncErrorHandler,
  withRetry,
  Result,
} from "@/lib/error-handling/async-error-handler";

// Redis client interface - will be implemented based on available Redis client
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    mode?: string,
    duration?: number,
  ): Promise<string | null>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flushall(): Promise<string>;
  ping(): Promise<string>;
  quit(): Promise<string>;
}

interface CacheConfig {
  defaultTTL: number; // seconds
  keyPrefix: string;
  maxRetries: number;
  retryDelay: number;
  enableFallback: boolean;
  fallbackTTL: number;
  compression: boolean;
  serialization: "json" | "string";
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  totalOperations: number;
  hitRate: number;
}

interface CacheItem<T = unknown> {
  data: T;
  createdAt: number;
  expiresAt: number;
  version?: string;
}

export class RedisCacheManager {
  private client: RedisClient | null = null;
  private fallbackCache = new Map<string, CacheItem>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    totalOperations: 0,
    hitRate: 0,
  };

  private cleanupInterval: NodeJS.Timeout | null = null;
  private isConnected = false;

  constructor(private config: CacheConfig) {
    this.initializeRedisClient();
    this.startFallbackCleanup();
  }

  private async initializeRedisClient(): Promise<void> {
    if (!process.env.REDIS_URL) {
      logger.warn("Redis URL not configured, using fallback cache only");
      return;
    }

    try {
      // Dynamic import to handle Redis client based on environment
      if (typeof window === "undefined") {
        // Server-side - use ioredis if available
        let Redis: any = null;
        try {
          // Dynamically import ioredis as optional dependency
          Redis = await import("ioredis" as string);
        } catch (error) {
          logger.warn("ioredis not available, using fallback cache only");
          return;
        }

        if (Redis?.default) {
          const client = new Redis.default(process.env.REDIS_URL, {
            retryDelayOnFailover: 100,
            enableReadyCheck: false,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            connectTimeout: 10000,
            commandTimeout: 5000,
            family: 4,
            keepAlive: 30000,
          });

          client.on("connect", () => {
            logger.info("Redis client connected");
            this.isConnected = true;
          });

          client.on("error", (error) => {
            logger.error("Redis client error", {}, error instanceof Error ? error : new Error(String(error)));
            this.stats.errors++;
            this.isConnected = false;
          });

          client.on("close", () => {
            logger.warn("Redis client disconnected");
            this.isConnected = false;
          });

          // Adapt ioredis interface
          this.client = {
            get: (key: string) => client.get(key),
            set: (
              key: string,
              value: string,
              mode?: string,
              duration?: number,
            ) => {
              if (mode === "EX" && duration) {
                return client.set(key, value, "EX", duration);
              }
              return client.set(key, value);
            },
            del: (key: string) => client.del(key),
            exists: (key: string) => client.exists(key),
            expire: (key: string, seconds: number) =>
              client.expire(key, seconds),
            ttl: (key: string) => client.ttl(key),
            keys: (pattern: string) => client.keys(pattern),
            flushall: () => client.flushall(),
            ping: () => client.ping(),
            quit: () => client.quit(),
          };

          // Test connection
          await this.client.ping();
          logger.info("Redis cache manager initialized successfully");
        } else {
          throw new Error("ioredis not available");
        }
      }
    } catch (error) {
      logger.error(
        "Failed to initialize Redis client, using fallback cache",
        error,
      );
      this.client = null;
    }
  }

  private startFallbackCleanup(): void {
    // Clean expired items from fallback cache every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupFallbackCache();
      },
      5 * 60 * 1000,
    );
  }

  private cleanupFallbackCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.fallbackCache.entries()) {
      if (item.expiresAt < now) {
        this.fallbackCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned ${cleanedCount} expired items from fallback cache`);
    }
  }

  private generateKey(key: string): string {
    return `${this.config.keyPrefix}:${key}`;
  }

  private serialize<T>(data: T): string {
    if (this.config.serialization === "json") {
      return JSON.stringify({
        data,
        createdAt: Date.now(),
        version: process.env.VERCEL_GIT_COMMIT_SHA || "1.0.0",
      } as CacheItem<T>);
    }
    return String(data);
  }

  private deserialize<T>(value: string): T {
    if (this.config.serialization === "json") {
      try {
        const parsed = JSON.parse(value) as CacheItem<T>;
        return parsed.data;
      } catch {
        // Fallback to raw value if JSON parsing fails
        return value as unknown as T;
      }
    }
    return value as unknown as T;
  }

  private updateStats(
    operation: "hit" | "miss" | "set" | "delete" | "error",
  ): void {
    this.stats[
      operation === "hit"
        ? "hits"
        : operation === "miss"
          ? "misses"
          : operation === "set"
            ? "sets"
            : operation === "delete"
              ? "deletes"
              : "errors"
    ]++;

    this.stats.totalOperations++;
    this.stats.hitRate =
      this.stats.hits / Math.max(1, this.stats.hits + this.stats.misses);
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const fullKey = this.generateKey(key);

    try {
      // Try Redis first if available
      if (this.client && this.isConnected) {
        const result = await withRetry(
          async () => {
            const value = await this.client!.get(fullKey);
            return value ? this.deserialize<T>(value) : null;
          },
          this.config.maxRetries,
          `cache-get-${key}`,
        );

        if (result.success) {
          if (result.data !== null) {
            this.updateStats("hit");
            logger.debug(`Cache HIT (Redis): ${key}`);
            return result.data;
          }
        } else {
          logger.warn(`Redis get failed for key ${key}`, result.error);
        }
      }

      // Fallback to in-memory cache
      const fallbackItem = this.fallbackCache.get(fullKey);
      if (fallbackItem && fallbackItem.expiresAt > Date.now()) {
        this.updateStats("hit");
        logger.debug(`Cache HIT (Fallback): ${key}`);
        return fallbackItem.data as T;
      }

      this.updateStats("miss");
      logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      this.updateStats("error");
      logger.error(`Cache get error for key ${key}`, error);
      return null;
    }
  }

  async set<T = unknown>(
    key: string,
    value: T,
    ttl?: number,
  ): Promise<boolean> {
    const fullKey = this.generateKey(key);
    const effectiveTTL = ttl || this.config.defaultTTL;
    const serializedValue = this.serialize(value);

    try {
      let redisSuccess = false;

      // Try Redis first if available
      if (this.client && this.isConnected) {
        const result = await withRetry(
          async () => {
            await this.client!.set(
              fullKey,
              serializedValue,
              "EX",
              effectiveTTL,
            );
            return true;
          },
          this.config.maxRetries,
          `cache-set-${key}`,
        );

        if (result.success) {
          redisSuccess = true;
          logger.debug(`Cache SET (Redis): ${key}, TTL: ${effectiveTTL}s`);
        } else {
          logger.warn(`Redis set failed for key ${key}`, result.error);
        }
      }

      // Always update fallback cache if enabled
      if (this.config.enableFallback) {
        this.fallbackCache.set(fullKey, {
          data: value,
          createdAt: Date.now(),
          expiresAt: Date.now() + effectiveTTL * 1000,
        });

        if (!redisSuccess) {
          logger.debug(`Cache SET (Fallback): ${key}, TTL: ${effectiveTTL}s`);
        }
      }

      this.updateStats("set");
      return true;
    } catch (error) {
      this.updateStats("error");
      logger.error(`Cache set error for key ${key}`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    const fullKey = this.generateKey(key);

    try {
      let redisSuccess = false;

      // Try Redis first if available
      if (this.client && this.isConnected) {
        const result = await withRetry(
          async () => {
            await this.client!.del(fullKey);
            return true;
          },
          this.config.maxRetries,
          `cache-delete-${key}`,
        );

        if (result.success) {
          redisSuccess = true;
          logger.debug(`Cache DELETE (Redis): ${key}`);
        }
      }

      // Remove from fallback cache
      const fallbackDeleted = this.fallbackCache.delete(fullKey);

      if (!redisSuccess && fallbackDeleted) {
        logger.debug(`Cache DELETE (Fallback): ${key}`);
      }

      this.updateStats("delete");
      return true;
    } catch (error) {
      this.updateStats("error");
      logger.error(`Cache delete error for key ${key}`, error);
      return false;
    }
  }

  async clear(pattern?: string): Promise<boolean> {
    try {
      if (this.client && this.isConnected && pattern) {
        // Clear Redis keys matching pattern
        const keys = await this.client.keys(this.generateKey(pattern));
        if (keys.length > 0) {
          await Promise.all(keys.map((key) => this.client!.del(key)));
          logger.info(
            `Cleared ${keys.length} Redis keys matching pattern: ${pattern}`,
          );
        }
      }

      if (pattern) {
        // Clear matching fallback cache items
        const regex = new RegExp(pattern.replace("*", ".*"));
        const keysToDelete: string[] = [];

        for (const key of this.fallbackCache.keys()) {
          if (regex.test(key)) {
            keysToDelete.push(key);
          }
        }

        keysToDelete.forEach((key) => this.fallbackCache.delete(key));
        logger.info(
          `Cleared ${keysToDelete.length} fallback cache keys matching pattern: ${pattern}`,
        );
      } else {
        // Clear all caches
        if (this.client && this.isConnected) {
          await this.client.flushall();
        }
        this.fallbackCache.clear();
        logger.info("Cleared all caches");
      }

      return true;
    } catch (error) {
      logger.error("Cache clear error", {}, error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullKey = this.generateKey(key);

    try {
      // Check Redis first
      if (this.client && this.isConnected) {
        const exists = await this.client.exists(fullKey);
        if (exists) return true;
      }

      // Check fallback cache
      const fallbackItem = this.fallbackCache.get(fullKey);
      return fallbackItem !== undefined && fallbackItem.expiresAt > Date.now();
    } catch (error) {
      logger.error(`Cache exists error for key ${key}`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    const fullKey = this.generateKey(key);

    try {
      // Check Redis first
      if (this.client && this.isConnected) {
        return await this.client.ttl(fullKey);
      }

      // Check fallback cache
      const fallbackItem = this.fallbackCache.get(fullKey);
      if (fallbackItem) {
        return Math.max(
          0,
          Math.floor((fallbackItem.expiresAt - Date.now()) / 1000),
        );
      }

      return -1;
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}`, error);
      return -1;
    }
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    details: Record<string, unknown>;
  }> {
    try {
      const redisHealthy =
        this.client && this.isConnected
          ? await this.client
              .ping()
              .then(() => true)
              .catch(() => false)
          : false;

      const stats = this.getStats();

      return {
        healthy: redisHealthy || this.config.enableFallback,
        details: {
          redis: {
            connected: this.isConnected,
            healthy: redisHealthy,
          },
          fallback: {
            enabled: this.config.enableFallback,
            itemCount: this.fallbackCache.size,
          },
          stats,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
          stats: this.getStats(),
        },
      };
    }
  }

  async shutdown(): Promise<void> {
    logger.info("Shutting down cache manager");

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.client) {
      try {
        await this.client.quit();
      } catch (error) {
        logger.error("Error closing Redis connection", {}, error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.fallbackCache.clear();
    logger.info("Cache manager shutdown complete");
  }

  // High-level caching patterns

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const fresh = await fetcher();

    // Cache the result
    await this.set(key, fresh, ttl);

    return fresh;
  }

  async mget<T>(keys: string[]): Promise<Record<string, T | null>> {
    const results: Record<string, T | null> = {};

    // Batch get operations for better performance
    const promises = keys.map(async (key) => ({
      key,
      value: await this.get<T>(key),
    }));

    const resolved = await Promise.allSettled(promises);

    resolved.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results[keys[index]] = result.value.value;
      } else {
        results[keys[index]] = null;
      }
    });

    return results;
  }

  async mset<T>(items: Record<string, T>, ttl?: number): Promise<boolean> {
    const promises = Object.entries(items).map(([key, value]) =>
      this.set(key, value, ttl),
    );

    const results = await Promise.allSettled(promises);
    return results.every(
      (result) => result.status === "fulfilled" && result.value,
    );
  }
}

// Production cache configuration
const PRODUCTION_CONFIG: CacheConfig = {
  defaultTTL: 3600, // 1 hour
  keyPrefix: "cg_prod",
  maxRetries: 3,
  retryDelay: 1000,
  enableFallback: true,
  fallbackTTL: 300, // 5 minutes
  compression: false,
  serialization: "json",
};

// Development cache configuration
const DEVELOPMENT_CONFIG: CacheConfig = {
  defaultTTL: 1800, // 30 minutes
  keyPrefix: "cg_dev",
  maxRetries: 2,
  retryDelay: 500,
  enableFallback: true,
  fallbackTTL: 300,
  compression: false,
  serialization: "json",
};

// Global cache manager instance
export const cacheManager = new RedisCacheManager(
  process.env.NODE_ENV === "production"
    ? PRODUCTION_CONFIG
    : DEVELOPMENT_CONFIG,
);

// Common cache patterns and utilities
export class CachePatterns {
  // User-specific caching
  static userKey(userId: string, resource: string): string {
    return `user:${userId}:${resource}`;
  }

  // API response caching
  static apiKey(endpoint: string, params?: Record<string, unknown>): string {
    const paramString = params ? ":" + JSON.stringify(params) : "";
    return `api:${endpoint}${paramString}`;
  }

  // AI processing results caching
  static aiKey(operation: string, hash: string): string {
    return `ai:${operation}:${hash}`;
  }

  // Geographic data caching
  static geoKey(
    type: "property" | "weather" | "risk",
    identifier: string,
  ): string {
    return `geo:${type}:${identifier}`;
  }

  // Session data caching
  static sessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }
}

// Graceful shutdown
process.on("SIGTERM", () => cacheManager.shutdown());
process.on("SIGINT", () => cacheManager.shutdown());

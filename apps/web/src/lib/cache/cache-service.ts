/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "High-level caching service for ClaimGuardian application data"
 * @dependencies ["@/lib/cache/redis-client", "@/lib/cache/cache-config"]
 * @status stable
 */

import { createRedisClient } from "./redis-client";
import { getCacheConfig, CacheKeys, CACHE_TTL } from "./cache-config";
import { logger } from "@/lib/logger/production-logger";

export interface CachedResponse<T> {
  data: T;
  cached: boolean;
  timestamp: Date;
  ttl?: number;
}

export class CacheService {
  private redisClient = createRedisClient();
  private config = getCacheConfig();
  private memoryCache = new Map<string, { data: any; expires: number }>();
  private readonly module = "cache-service";

  constructor() {
    // Initialize Redis connection in background
    this.initializeAsync();
    
    // Setup memory cache cleanup
    this.setupMemoryCacheCleanup();
  }

  private async initializeAsync(): Promise<void> {
    if (this.config.redis.enabled) {
      try {
        await this.redisClient.connect();
        logger.info("Cache service initialized with Redis", { module: this.module });
      } catch (error) {
        logger.warn("Redis connection failed, using memory cache only", {
          module: this.module,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } else {
      logger.info("Cache service initialized with memory cache only", { module: this.module });
    }
  }

  private setupMemoryCacheCleanup(): void {
    // Clean expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.expires < now) {
          this.memoryCache.delete(key);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        logger.debug("Memory cache cleanup completed", {
          module: this.module,
          cleanedEntries: cleaned,
          remainingEntries: this.memoryCache.size,
        });
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Generic get method with fallback to memory cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first if enabled
      if (this.config.redis.enabled && this.redisClient.isHealthy()) {
        const data = await this.redisClient.get(key);
        if (data) {
          const parsed = JSON.parse(data);
          logger.debug("Cache hit (Redis)", { module: this.module, key });
          return parsed;
        }
      }

      // Fallback to memory cache
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && memoryEntry.expires > Date.now()) {
        logger.debug("Cache hit (Memory)", { module: this.module, key });
        return memoryEntry.data;
      }

      logger.debug("Cache miss", { module: this.module, key });
      return null;
    } catch (error) {
      logger.error("Cache get failed", {
        module: this.module,
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  /**
   * Generic set method with dual storage
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || this.config.strategy.defaultTTL;
    
    try {
      const serialized = JSON.stringify(value);

      // Store in Redis if enabled
      if (this.config.redis.enabled && this.redisClient.isHealthy()) {
        await this.redisClient.set(key, serialized, ttl);
        logger.debug("Cache set (Redis)", { module: this.module, key, ttl });
      }

      // Always store in memory cache as backup
      this.memoryCache.set(key, {
        data: value,
        expires: Date.now() + (ttl * 1000),
      });
      
      logger.debug("Cache set (Memory)", { module: this.module, key, ttl });
    } catch (error) {
      logger.error("Cache set failed", {
        module: this.module,
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Delete from both Redis and memory
   */
  async delete(key: string): Promise<void> {
    try {
      // Delete from Redis
      if (this.config.redis.enabled && this.redisClient.isHealthy()) {
        await this.redisClient.del(key);
      }

      // Delete from memory
      this.memoryCache.delete(key);
      
      logger.debug("Cache delete", { module: this.module, key });
    } catch (error) {
      logger.error("Cache delete failed", {
        module: this.module,
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      // Clear Redis
      if (this.config.redis.enabled && this.redisClient.isHealthy()) {
        await this.redisClient.flushdb();
      }

      // Clear memory
      this.memoryCache.clear();
      
      logger.info("Cache cleared", { module: this.module });
    } catch (error) {
      logger.error("Cache clear failed", {
        module: this.module,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get or set pattern - fetch from cache or compute and store
   */
  async getOrSet<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<CachedResponse<T>> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return {
        data: cached,
        cached: true,
        timestamp: new Date(),
      };
    }

    // Compute the value
    try {
      const computed = await computeFn();
      
      // Store in cache
      await this.set(key, computed, ttlSeconds);
      
      return {
        data: computed,
        cached: false,
        timestamp: new Date(),
        ttl: ttlSeconds,
      };
    } catch (error) {
      logger.error("Cache compute function failed", {
        module: this.module,
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  // User-related cache methods
  async getUserSession(userId: string): Promise<any> {
    return this.get(CacheKeys.userSession(userId));
  }

  async setUserSession(userId: string, sessionData: any): Promise<void> {
    return this.set(CacheKeys.userSession(userId), sessionData, CACHE_TTL.USER_SESSION);
  }

  async getUserProfile(userId: string): Promise<any> {
    return this.get(CacheKeys.userProfile(userId));
  }

  async setUserProfile(userId: string, profile: any): Promise<void> {
    return this.set(CacheKeys.userProfile(userId), profile, CACHE_TTL.USER_PROFILE);
  }

  // Property-related cache methods
  async getProperty(propertyId: string): Promise<any> {
    return this.get(CacheKeys.property(propertyId));
  }

  async setProperty(propertyId: string, property: any): Promise<void> {
    return this.set(CacheKeys.property(propertyId), property, CACHE_TTL.PROPERTY_DETAILED);
  }

  async getPropertyList(userId: string): Promise<any> {
    return this.get(CacheKeys.propertyList(userId));
  }

  async setPropertyList(userId: string, properties: any[]): Promise<void> {
    return this.set(CacheKeys.propertyList(userId), properties, CACHE_TTL.PROPERTY_BASIC);
  }

  // Claims-related cache methods
  async getClaim(claimId: string): Promise<any> {
    return this.get(CacheKeys.claim(claimId));
  }

  async setClaim(claimId: string, claim: any): Promise<void> {
    return this.set(CacheKeys.claim(claimId), claim, CACHE_TTL.CLAIM_ANALYSIS);
  }

  async getClaimStatus(claimId: string): Promise<any> {
    return this.get(CacheKeys.claimStatus(claimId));
  }

  async setClaimStatus(claimId: string, status: any): Promise<void> {
    return this.set(CacheKeys.claimStatus(claimId), status, CACHE_TTL.CLAIM_STATUS);
  }

  // AI analysis cache methods
  async getAiAnalysis(documentId: string): Promise<any> {
    return this.get(CacheKeys.aiAnalysis(documentId));
  }

  async setAiAnalysis(documentId: string, analysis: any): Promise<void> {
    return this.set(CacheKeys.aiAnalysis(documentId), analysis, CACHE_TTL.AI_DOCUMENT_ANALYSIS);
  }

  async getDamageAssessment(imageId: string): Promise<any> {
    return this.get(CacheKeys.damageAssessment(imageId));
  }

  async setDamageAssessment(imageId: string, assessment: any): Promise<void> {
    return this.set(CacheKeys.damageAssessment(imageId), assessment, CACHE_TTL.AI_DAMAGE_ASSESSMENT);
  }

  async getConsensusResult(analysisId: string): Promise<any> {
    return this.get(CacheKeys.consensusResult(analysisId));
  }

  async setConsensusResult(analysisId: string, result: any): Promise<void> {
    return this.set(CacheKeys.consensusResult(analysisId), result, CACHE_TTL.AI_CONSENSUS_RESULT);
  }

  // Florida data cache methods
  async getFloodZone(address: string): Promise<any> {
    return this.get(CacheKeys.floodZone(address));
  }

  async setFloodZone(address: string, floodZone: any): Promise<void> {
    return this.set(CacheKeys.floodZone(address), floodZone, CACHE_TTL.FLOOD_ZONES);
  }

  async getHurricaneAlerts(county: string): Promise<any> {
    return this.get(CacheKeys.hurricaneAlerts(county));
  }

  async setHurricaneAlerts(county: string, alerts: any): Promise<void> {
    return this.set(CacheKeys.hurricaneAlerts(county), alerts, CACHE_TTL.HURRICANE_ALERTS);
  }

  async getCountyData(countyCode: string): Promise<any> {
    return this.get(CacheKeys.countyData(countyCode));
  }

  async setCountyData(countyCode: string, data: any): Promise<void> {
    return this.set(CacheKeys.countyData(countyCode), data, CACHE_TTL.COUNTY_DATA);
  }

  async getWeatherData(zipCode: string): Promise<any> {
    return this.get(CacheKeys.weatherData(zipCode));
  }

  async setWeatherData(zipCode: string, weather: any): Promise<void> {
    return this.set(CacheKeys.weatherData(zipCode), weather, CACHE_TTL.WEATHER_DATA);
  }

  // Rate limiting methods
  async checkRateLimit(identifier: string, action: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = CacheKeys.rateLimit(identifier, action);
    
    try {
      const current = await this.get<{ count: number; resetTime: number }>(key);
      const now = Date.now();
      
      if (!current || current.resetTime < now) {
        // First request or window expired
        const resetTime = now + (windowSeconds * 1000);
        await this.set(key, { count: 1, resetTime }, windowSeconds);
        
        return {
          allowed: true,
          remaining: limit - 1,
          resetTime,
        };
      }
      
      if (current.count >= limit) {
        // Rate limit exceeded
        return {
          allowed: false,
          remaining: 0,
          resetTime: current.resetTime,
        };
      }
      
      // Increment counter
      const newCount = current.count + 1;
      await this.set(key, { count: newCount, resetTime: current.resetTime }, windowSeconds);
      
      return {
        allowed: true,
        remaining: limit - newCount,
        resetTime: current.resetTime,
      };
    } catch (error) {
      logger.error("Rate limit check failed", {
        module: this.module,
        identifier,
        action,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      
      // Fail open - allow request if cache fails
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: Date.now() + (windowSeconds * 1000),
      };
    }
  }

  // Health and monitoring methods
  async healthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    redis: boolean;
    memory: boolean;
    latency?: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Test Redis health
      let redisHealthy = false;
      if (this.config.redis.enabled) {
        redisHealthy = await this.redisClient.ping();
      }

      // Test memory cache
      const testKey = "health:test:" + Date.now();
      this.memoryCache.set(testKey, { data: "test", expires: Date.now() + 1000 });
      const memoryHealthy = this.memoryCache.has(testKey);
      this.memoryCache.delete(testKey);

      const latency = Date.now() - startTime;
      
      let status: "healthy" | "degraded" | "unhealthy" = "healthy";
      if (!memoryHealthy) {
        status = "unhealthy";
      } else if (this.config.redis.enabled && !redisHealthy) {
        status = "degraded";
      }

      return {
        status,
        redis: redisHealthy,
        memory: memoryHealthy,
        latency,
      };
    } catch (error) {
      logger.error("Cache health check failed", {
        module: this.module,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      
      return {
        status: "unhealthy",
        redis: false,
        memory: false,
        latency: Date.now() - startTime,
      };
    }
  }

  async getStats(): Promise<{
    memorySize: number;
    memoryEntries: number;
    redisConnected: boolean;
  }> {
    return {
      memorySize: this.memoryCache.size,
      memoryEntries: this.memoryCache.size,
      redisConnected: this.redisClient.isHealthy(),
    };
  }
}

// Export singleton instance
export const cacheService = new CacheService();
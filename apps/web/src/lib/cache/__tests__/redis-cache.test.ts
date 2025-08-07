/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Redis caching integration tests"
 * @dependencies ["ioredis", "jest"]
 * @status stable
 */

import { CacheService } from "../cache-service";
import { createRedisClient } from "../redis-client";
import { getCacheConfig } from "../cache-config";

// Mock Redis for testing
jest.mock("ioredis", () => {
  return class MockRedis {
    private store: Map<string, string> = new Map();

    async get(key: string): Promise<string | null> {
      return this.store.get(key) || null;
    }

    async set(key: string, value: string, mode?: string, ttl?: number): Promise<string> {
      this.store.set(key, value);
      return "OK";
    }

    async del(key: string | string[]): Promise<number> {
      if (Array.isArray(key)) {
        let deleted = 0;
        key.forEach(k => {
          if (this.store.delete(k)) deleted++;
        });
        return deleted;
      } else {
        return this.store.delete(key) ? 1 : 0;
      }
    }

    async exists(key: string): Promise<number> {
      return this.store.has(key) ? 1 : 0;
    }

    async expire(key: string, seconds: number): Promise<number> {
      return this.store.has(key) ? 1 : 0;
    }

    async ping(): Promise<string> {
      return "PONG";
    }

    async mget(...keys: string[]): Promise<(string | null)[]> {
      return keys.map(key => this.store.get(key) || null);
    }

    async mset(keyValuePairs: Record<string, string>): Promise<string> {
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        this.store.set(key, value);
      });
      return "OK";
    }

    async hget(key: string, field: string): Promise<string | null> {
      return null;
    }

    async hset(key: string, field: string, value: string): Promise<number> {
      return 1;
    }

    async hgetall(key: string): Promise<Record<string, string>> {
      return {};
    }

    async keys(pattern: string): Promise<string[]> {
      const keys = Array.from(this.store.keys());
      if (pattern === "*") return keys;
      // Simple pattern matching
      const regex = new RegExp(pattern.replace("*", ".*"));
      return keys.filter(key => regex.test(key));
    }

    async scan(cursor: string, ...args: (string | number)[]): Promise<[string, string[]]> {
      const keys = Array.from(this.store.keys());
      return ["0", keys];
    }

    async flushdb(): Promise<string> {
      this.store.clear();
      return "OK";
    }

    async connect(): Promise<void> {
      // Mock connection
    }

    async disconnect(): Promise<void> {
      // Mock disconnect
    }

    on(event: string, callback: Function): void {
      // Mock event handling
      if (event === "connect") {
        setTimeout(() => callback(), 10);
      }
    }
  };
});

describe("Redis Cache Integration", () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
  });

  afterEach(async () => {
    await cacheService.clear();
  });

  describe("Basic Cache Operations", () => {
    test("should set and get cached values", async () => {
      const testKey = "test:user:123";
      const testValue = { id: "123", name: "Test User", email: "test@example.com" };

      await cacheService.set(testKey, testValue, 3600);
      const retrieved = await cacheService.get(testKey);

      expect(retrieved).toEqual(testValue);
    });

    test("should return null for non-existent keys", async () => {
      const result = await cacheService.get("non-existent-key");
      expect(result).toBeNull();
    });

    test("should delete cached values", async () => {
      const testKey = "test:delete:key";
      const testValue = { message: "will be deleted" };

      await cacheService.set(testKey, testValue);
      await cacheService.delete(testKey);
      
      const result = await cacheService.get(testKey);
      expect(result).toBeNull();
    });
  });

  describe("Cache Service Methods", () => {
    test("should cache user session data", async () => {
      const userId = "user-456";
      const sessionData = { 
        token: "abc123", 
        expiresAt: new Date().toISOString(),
        permissions: ["read", "write"]
      };

      await cacheService.setUserSession(userId, sessionData);
      const retrieved = await cacheService.getUserSession(userId);

      expect(retrieved).toEqual(sessionData);
    });

    test("should cache property data", async () => {
      const propertyId = "prop-789";
      const propertyData = {
        id: propertyId,
        address: "123 Test St",
        county: "Orange",
        floodZone: "AE"
      };

      await cacheService.setProperty(propertyId, propertyData);
      const retrieved = await cacheService.getProperty(propertyId);

      expect(retrieved).toEqual(propertyData);
    });

    test("should cache AI analysis results", async () => {
      const documentId = "doc-123";
      const analysisResult = {
        extractedData: { policyNumber: "FL123456", carrier: "State Farm" },
        confidence: 0.95,
        processedAt: new Date().toISOString()
      };

      await cacheService.setAiAnalysis(documentId, analysisResult);
      const retrieved = await cacheService.getAiAnalysis(documentId);

      expect(retrieved).toEqual(analysisResult);
    });

    test("should cache Florida-specific data", async () => {
      const address = "123 Main St, Orlando, FL";
      const floodZoneData = {
        zone: "AE",
        elevation: "15 ft",
        riskLevel: "moderate"
      };

      await cacheService.setFloodZone(address, floodZoneData);
      const retrieved = await cacheService.getFloodZone(address);

      expect(retrieved).toEqual(floodZoneData);
    });
  });

  describe("GetOrSet Pattern", () => {
    test("should compute and cache value on first call", async () => {
      const key = "compute:test";
      let computeCallCount = 0;
      
      const computeFunction = async () => {
        computeCallCount++;
        return { message: "computed value", timestamp: Date.now() };
      };

      // First call - should compute
      const result1 = await cacheService.getOrSet(key, computeFunction, 3600);
      expect(result1.cached).toBe(false);
      expect(computeCallCount).toBe(1);

      // Second call - should use cache
      const result2 = await cacheService.getOrSet(key, computeFunction, 3600);
      expect(result2.cached).toBe(true);
      expect(result2.data).toEqual(result1.data);
      expect(computeCallCount).toBe(1); // Should not increment
    });
  });

  describe("Rate Limiting", () => {
    test("should enforce rate limits", async () => {
      const identifier = "user-rate-test";
      const action = "api-call";
      const limit = 3;
      const windowSeconds = 60;

      // First 3 requests should be allowed
      for (let i = 0; i < limit; i++) {
        const result = await cacheService.checkRateLimit(identifier, action, limit, windowSeconds);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(limit - i - 1);
      }

      // 4th request should be denied
      const denied = await cacheService.checkRateLimit(identifier, action, limit, windowSeconds);
      expect(denied.allowed).toBe(false);
      expect(denied.remaining).toBe(0);
    });
  });

  describe("Health Monitoring", () => {
    test("should perform health checks", async () => {
      const health = await cacheService.healthCheck();
      
      expect(health).toHaveProperty("status");
      expect(health).toHaveProperty("memory");
      expect(health).toHaveProperty("latency");
      expect(health.memory).toBe(true);
    });

    test("should return cache statistics", async () => {
      // Add some test data
      await cacheService.set("stats:test1", { data: "value1" });
      await cacheService.set("stats:test2", { data: "value2" });

      const stats = await cacheService.getStats();
      
      expect(stats).toHaveProperty("memorySize");
      expect(stats).toHaveProperty("memoryEntries");
      expect(stats.memoryEntries).toBeGreaterThan(0);
    });
  });

  describe("Cache Configuration", () => {
    test("should load cache configuration", () => {
      const config = getCacheConfig("development");
      
      expect(config).toHaveProperty("redis");
      expect(config).toHaveProperty("strategy");
      expect(config).toHaveProperty("performance");
      expect(config.redis.enabled).toBe(false); // Should be false in development
    });

    test("should enable Redis in production", () => {
      const config = getCacheConfig("production");
      
      expect(config.redis.enabled).toBe(true);
      expect(config.strategy.encryptionEnabled).toBe(true);
      expect(config.performance.enableEncryption).toBe(true);
    });
  });

  describe("Error Handling", () => {
    test("should handle cache errors gracefully", async () => {
      // Test with invalid JSON-like data that might cause issues
      const invalidData = { 
        circular: {} as any,
        bigInt: BigInt(123),
        func: () => "test"
      };
      invalidData.circular.ref = invalidData;

      // Should not throw, but handle gracefully
      await expect(cacheService.set("error:test", invalidData)).rejects.toThrow();
      
      // Should return null for failed get operations
      const result = await cacheService.get("non-existent");
      expect(result).toBeNull();
    });
  });
});
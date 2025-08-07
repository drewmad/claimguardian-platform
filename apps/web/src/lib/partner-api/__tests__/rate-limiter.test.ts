/**
 * @fileMetadata
 * @purpose "Unit tests for Partner API rate limiter module"
 * @owner partner-api-team
 * @complexity high
 * @tags ["test", "rate-limiting", "partner-api", "performance"]
 * @status stable
 * @jest-environment node
 */

import { partnerRateLimiter, RateLimitResult, RateLimitRequest } from "../rate-limiter";

// Mock logger to avoid actual logging in tests
jest.mock("@/lib/logger/production-logger", () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Partner Rate Limiter", () => {
  const mockRequest: RateLimitRequest = {
    partnerId: "test-partner-1",
    apiKeyId: "test-key-1",
    ip: "192.168.1.1",
    endpoint: "/api/v1/claims",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any cached data
    partnerRateLimiter["cache"].clear();
    // Use fake timers to control intervals
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers after each test
    jest.useRealTimers();
  });

  afterAll(() => {
    // Clear cache to prevent memory leaks
    partnerRateLimiter["cache"].clear();
  });

  describe("Basic Rate Limiting", () => {
    it("should allow requests within limits", async () => {
      const result = await partnerRateLimiter.checkLimit(mockRequest);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(1000); // Default per-minute limit
      expect(result.current).toBe(1);
      expect(result.remaining).toBe(999);
      expect(result.resetTime).toBeDefined();
    });

    it("should increment counters for subsequent requests", async () => {
      // First request
      await partnerRateLimiter.checkLimit(mockRequest);

      // Second request
      const result = await partnerRateLimiter.checkLimit(mockRequest);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(2);
      expect(result.remaining).toBe(998);
    });

    it("should respect override flag", async () => {
      const overrideRequest: RateLimitRequest = {
        ...mockRequest,
        override: true,
        customLimit: 5000,
      };

      const result = await partnerRateLimiter.checkLimit(overrideRequest);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(5000);
      expect(result.current).toBe(0);
      expect(result.remaining).toBe(5000);
    });

    it("should apply default limits when no configuration found", async () => {
      const result = await partnerRateLimiter.checkLimit(mockRequest);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(1000); // Default per-minute limit from mock config
    });
  });

  describe("Sliding Window Rate Limiting", () => {
    it("should block requests when minute limit exceeded", async () => {
      // Mock the getRateLimitConfig to return lower limits for testing
      const originalMethod = partnerRateLimiter["getRateLimitConfig"];
      partnerRateLimiter["getRateLimitConfig"] = jest.fn().mockResolvedValue({
        requestsPerMinute: 2,
        requestsPerHour: 10,
        requestsPerDay: 100,
        burstLimit: 5,
      });

      // Make requests up to the limit
      await partnerRateLimiter.checkLimit(mockRequest);
      await partnerRateLimiter.checkLimit(mockRequest);

      // Third request should be blocked
      const result = await partnerRateLimiter.checkLimit(mockRequest);

      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(2);
      expect(result.current).toBe(2);
      expect(result.remaining).toBe(0);

      // Restore original method
      partnerRateLimiter["getRateLimitConfig"] = originalMethod;
    });

    it("should handle multiple time windows correctly", async () => {
      const originalMethod = partnerRateLimiter["getRateLimitConfig"];
      
      // Mock different limits for different windows
      partnerRateLimiter["getRateLimitConfig"] = jest.fn().mockResolvedValue({
        requestsPerMinute: 10,
        requestsPerHour: 5, // Lower hour limit to test
        requestsPerDay: 100,
        burstLimit: 20,
      });

      // Make 6 requests (should exceed hour limit but not minute limit)
      for (let i = 0; i < 6; i++) {
        await partnerRateLimiter.checkLimit(mockRequest);
      }

      const result = await partnerRateLimiter.checkLimit(mockRequest);

      expect(result.allowed).toBe(false);
      expect(result.current).toBeGreaterThanOrEqual(5);
      
      // Restore original method
      partnerRateLimiter["getRateLimitConfig"] = originalMethod;
    });

    it("should handle burst limits correctly", async () => {
      partnerRateLimiter["getRateLimitConfig"] = jest.fn().mockResolvedValue({
        requestsPerMinute: 100,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        burstLimit: 3, // Low burst limit
      });

      // Make burst requests
      await partnerRateLimiter.checkLimit(mockRequest);
      await partnerRateLimiter.checkLimit(mockRequest);
      await partnerRateLimiter.checkLimit(mockRequest);

      // Fourth request should be blocked by burst limit
      const result = await partnerRateLimiter.checkLimit(mockRequest);

      expect(result.allowed).toBe(false);
    });
  });

  describe("Cache Management", () => {
    it("should clean up expired entries", () => {
      // Add some mock entries to cache
      const cache = partnerRateLimiter["cache"];
      const now = Date.now();
      const oldTimestamp = now - 25 * 60 * 60 * 1000; // 25 hours ago

      cache.set("old-key", {
        count: 5,
        windowStart: oldTimestamp,
        requests: [oldTimestamp],
      });

      cache.set("recent-key", {
        count: 3,
        windowStart: now,
        requests: [now],
      });

      // Call cleanup
      partnerRateLimiter["cleanupExpiredEntries"]();

      expect(cache.has("old-key")).toBe(false);
      expect(cache.has("recent-key")).toBe(true);
    });

    it("should limit cache size", () => {
      const cache = partnerRateLimiter["cache"];
      const maxCacheSize = partnerRateLimiter["MAX_CACHE_SIZE"];
      
      // Fill cache beyond max size
      for (let i = 0; i < maxCacheSize + 100; i++) {
        cache.set(`key-${i}`, {
          count: 1,
          windowStart: Date.now() - i * 1000,
          requests: [Date.now() - i * 1000],
        });
      }

      // Call cleanup
      partnerRateLimiter["cleanupExpiredEntries"]();

      expect(cache.size).toBeLessThanOrEqual(maxCacheSize);
    });
  });

  describe("Usage Statistics", () => {
    it("should return usage statistics for a partner", async () => {
      // Make some requests first
      await partnerRateLimiter.checkLimit(mockRequest);
      await partnerRateLimiter.checkLimit(mockRequest);

      const stats = await partnerRateLimiter.getUsageStats(
        mockRequest.partnerId,
        mockRequest.apiKeyId,
      );

      expect(stats).toHaveProperty("minute");
      expect(stats).toHaveProperty("hour");
      expect(stats).toHaveProperty("day");
      expect(stats).toHaveProperty("burst");
      expect(stats.minute.current).toBeGreaterThan(0);
    });

    it("should return zero usage for new partner", async () => {
      const stats = await partnerRateLimiter.getUsageStats(
        "new-partner",
        "new-key",
      );

      expect(stats.minute.current).toBe(0);
      expect(stats.hour.current).toBe(0);
      expect(stats.day.current).toBe(0);
      expect(stats.burst.current).toBe(0);
    });

    it("should handle errors in getting usage stats gracefully", async () => {
      // Mock an error
      const originalGet = partnerRateLimiter["cache"].get;
      partnerRateLimiter["cache"].get = jest.fn(() => {
        throw new Error("Cache error");
      });

      const stats = await partnerRateLimiter.getUsageStats(
        mockRequest.partnerId,
        mockRequest.apiKeyId,
      );

      // Should return zero stats on error
      expect(stats.minute.current).toBe(0);

      // Restore original method
      partnerRateLimiter["cache"].get = originalGet;
    });
  });

  describe("Rate Limit Management", () => {
    it("should reset rate limits for a partner", async () => {
      // Make some requests first
      await partnerRateLimiter.checkLimit(mockRequest);
      await partnerRateLimiter.checkLimit(mockRequest);

      const resetResult = await partnerRateLimiter.resetLimits(
        mockRequest.partnerId,
        mockRequest.apiKeyId,
      );

      expect(resetResult.success).toBe(true);

      // Usage should be reset
      const stats = await partnerRateLimiter.getUsageStats(
        mockRequest.partnerId,
        mockRequest.apiKeyId,
      );
      expect(stats.minute.current).toBe(0);
    });

    it("should reset limits for entire partner when no API key specified", async () => {
      // Make requests with different API keys
      await partnerRateLimiter.checkLimit(mockRequest);
      await partnerRateLimiter.checkLimit({
        ...mockRequest,
        apiKeyId: "different-key",
      });

      const resetResult = await partnerRateLimiter.resetLimits(
        mockRequest.partnerId,
      );

      expect(resetResult.success).toBe(true);
    });

    it("should update rate limits for a partner", async () => {
      const newLimits = {
        requestsPerMinute: 500,
        requestsPerHour: 5000,
        requestsPerDay: 50000,
        burstLimit: 25,
      };

      const updateResult = await partnerRateLimiter.updateRateLimit(
        mockRequest.partnerId,
        mockRequest.apiKeyId,
        newLimits,
      );

      expect(updateResult.success).toBe(true);
    });

    it("should handle errors in rate limit operations gracefully", async () => {
      // Mock an error in the cache operations
      const originalKeys = partnerRateLimiter["cache"].keys;
      partnerRateLimiter["cache"].keys = jest.fn(() => {
        throw new Error("Cache error");
      });

      const resetResult = await partnerRateLimiter.resetLimits(
        mockRequest.partnerId,
      );

      expect(resetResult.success).toBe(false);
      expect(resetResult.error).toBe("Failed to reset rate limits");

      // Restore original method
      partnerRateLimiter["cache"].keys = originalKeys;
    });
  });

  describe("Health Status", () => {
    it("should return health status", () => {
      const health = partnerRateLimiter.getHealthStatus();

      expect(health).toHaveProperty("healthy");
      expect(health).toHaveProperty("cacheSize");
      expect(health).toHaveProperty("lastCleanup");
      expect(health).toHaveProperty("metrics");
      expect(health.healthy).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle rate limiter service errors gracefully", async () => {
      // Mock getRateLimitConfig to throw an error
      partnerRateLimiter["getRateLimitConfig"] = jest.fn().mockRejectedValue(
        new Error("Database error"),
      );

      const result = await partnerRateLimiter.checkLimit(mockRequest);

      // Should fail open (allow request)
      expect(result.allowed).toBe(true);
      expect(result.error).toBe("Rate limiter unavailable");
    });

    it("should handle requests with same partner but different IP addresses", async () => {
      const request1 = { ...mockRequest, ip: "192.168.1.1" };
      const request2 = { ...mockRequest, ip: "192.168.1.2" };

      const result1 = await partnerRateLimiter.checkLimit(request1);
      const result2 = await partnerRateLimiter.checkLimit(request2);

      // Both should be allowed as they're counted together by partner/API key
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result2.current).toBe(2);
    });

    it("should handle concurrent requests correctly", async () => {
      // Set low limits for testing
      partnerRateLimiter["getRateLimitConfig"] = jest.fn().mockResolvedValue({
        requestsPerMinute: 5,
        requestsPerHour: 50,
        requestsPerDay: 500,
        burstLimit: 10,
      });

      // Make concurrent requests
      const promises = Array(3)
        .fill(null)
        .map(() => partnerRateLimiter.checkLimit(mockRequest));

      const results = await Promise.all(promises);

      // All should be processed
      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toHaveProperty("allowed");
        expect(result).toHaveProperty("current");
      });
    });

    it("should handle very high traffic scenarios", async () => {
      // Set reasonable limits
      partnerRateLimiter["getRateLimitConfig"] = jest.fn().mockResolvedValue({
        requestsPerMinute: 1000,
        requestsPerHour: 10000,
        requestsPerDay: 100000,
        burstLimit: 100,
      });

      // Make many sequential requests
      let lastResult: RateLimitResult | null = null;
      for (let i = 0; i < 50; i++) {
        lastResult = await partnerRateLimiter.checkLimit(mockRequest);
      }

      expect(lastResult?.allowed).toBe(true);
      expect(lastResult?.current).toBe(50);
    });

    it("should clean up old requests from windows", async () => {
      // Manually add old requests to cache
      const cache = partnerRateLimiter["cache"];
      const key = "rl:test-partner-1:test-key-1:60";
      const oldTime = Date.now() - 120000; // 2 minutes ago
      
      cache.set(key, {
        count: 5,
        windowStart: oldTime,
        requests: [oldTime, oldTime + 1000, Date.now()],
      });

      // Make a new request
      const result = await partnerRateLimiter.checkLimit(mockRequest);

      expect(result.allowed).toBe(true);
      // Should only count recent requests
      expect(result.current).toBeLessThan(5);
    });
  });

  describe("Different Partners", () => {
    it("should isolate rate limits between different partners", async () => {
      const partner1Request = { ...mockRequest, partnerId: "partner-1" };
      const partner2Request = { ...mockRequest, partnerId: "partner-2" };

      // Set low limits
      partnerRateLimiter["getRateLimitConfig"] = jest.fn().mockResolvedValue({
        requestsPerMinute: 2,
        requestsPerHour: 10,
        requestsPerDay: 100,
        burstLimit: 5,
      });

      // Exhaust partner-1's limit
      await partnerRateLimiter.checkLimit(partner1Request);
      await partnerRateLimiter.checkLimit(partner1Request);
      const partner1Result = await partnerRateLimiter.checkLimit(partner1Request);

      expect(partner1Result.allowed).toBe(false);

      // Partner-2 should still have full limits
      const partner2Result = await partnerRateLimiter.checkLimit(partner2Request);
      expect(partner2Result.allowed).toBe(true);
      expect(partner2Result.current).toBe(1);
    });

    it("should isolate rate limits between different API keys", async () => {
      const key1Request = { ...mockRequest, apiKeyId: "key-1" };
      const key2Request = { ...mockRequest, apiKeyId: "key-2" };

      // Set low limits
      partnerRateLimiter["getRateLimitConfig"] = jest.fn().mockResolvedValue({
        requestsPerMinute: 2,
        requestsPerHour: 10,
        requestsPerDay: 100,
        burstLimit: 5,
      });

      // Exhaust key-1's limit
      await partnerRateLimiter.checkLimit(key1Request);
      await partnerRateLimiter.checkLimit(key1Request);
      const key1Result = await partnerRateLimiter.checkLimit(key1Request);

      expect(key1Result.allowed).toBe(false);

      // Key-2 should still have full limits
      const key2Result = await partnerRateLimiter.checkLimit(key2Request);
      expect(key2Result.allowed).toBe(true);
      expect(key2Result.current).toBe(1);
    });
  });
});
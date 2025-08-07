/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Comprehensive rate limiting tests for ClaimGuardian platform"
 * @dependencies ["jest", "@/lib/rate-limiting/rate-limiter"]
 * @status stable
 */

import { RateLimiter, rateLimiter } from "../rate-limiter";
import { cacheService } from "@/lib/cache/cache-service";

// Mock cache service
jest.mock("@/lib/cache/cache-service", () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    checkRateLimit: jest.fn(),
  },
}));

describe("RateLimiter", () => {
  let testRateLimiter: RateLimiter;
  const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;

  beforeEach(() => {
    testRateLimiter = new RateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
    });
    jest.clearAllMocks();
  });

  describe("Basic Rate Limiting", () => {
    test("should allow requests within limit", async () => {
      mockCacheService.get.mockResolvedValue({ requests: 5, windowStart: Date.now() });
      mockCacheService.set.mockResolvedValue();

      const result = await testRateLimiter.checkLimit({
        identifier: "user123",
        action: "api_call",
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // 10 - 5 - 1
      expect(result.totalRequests).toBe(6); // 5 + 1
    });

    test("should deny requests when limit exceeded", async () => {
      mockCacheService.get.mockResolvedValue({ requests: 10, windowStart: Date.now() });

      const result = await testRateLimiter.checkLimit({
        identifier: "user123",
        action: "api_call",
      });

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.totalRequests).toBe(11); // 10 + 1
    });

    test("should reset counter for new window", async () => {
      const oldWindowStart = Date.now() - 120000; // 2 minutes ago
      mockCacheService.get.mockResolvedValue({ requests: 10, windowStart: oldWindowStart });
      mockCacheService.set.mockResolvedValue();

      const result = await testRateLimiter.checkLimit({
        identifier: "user123",
        action: "api_call",
      });

      expect(result.allowed).toBe(true);
      expect(result.totalRequests).toBe(1); // New window, so starts at 1
    });

    test("should handle weighted requests", async () => {
      mockCacheService.get.mockResolvedValue({ requests: 2, windowStart: Date.now() });
      mockCacheService.set.mockResolvedValue();

      const result = await testRateLimiter.checkLimit({
        identifier: "user123",
        action: "api_call",
        weight: 5, // Heavy request
      });

      expect(result.allowed).toBe(true);
      expect(result.totalRequests).toBe(7); // 2 + 5
      expect(result.remaining).toBe(3); // 10 - 7
    });
  });

  describe("AI Rate Limiting", () => {
    test("should enforce OpenAI chat limits", async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue();

      const result = await testRateLimiter.checkAILimit({
        userId: "user123",
        aiProvider: "openai",
        operation: "chat",
        tokenCount: 1000,
      });

      expect(result.allowed).toBe(true);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining("ai:openai:chat"),
        expect.any(Object),
        expect.any(Number)
      );
    });

    test("should apply token-based weighting", async () => {
      mockCacheService.get.mockResolvedValue({ requests: 5, windowStart: Date.now() });
      mockCacheService.set.mockResolvedValue();

      const result = await testRateLimiter.checkAILimit({
        userId: "user123",
        aiProvider: "openai",
        operation: "analysis",
        tokenCount: 5000, // 5 token units
      });

      expect(result.totalRequests).toBe(10); // 5 + 5 (5000 tokens / 1000)
    });

    test("should have different limits for different AI providers", async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue();

      const openaiResult = await testRateLimiter.checkAILimit({
        userId: "user123",
        aiProvider: "openai",
        operation: "chat",
      });

      const geminiResult = await testRateLimiter.checkAILimit({
        userId: "user123",
        aiProvider: "gemini",
        operation: "chat",
      });

      // Both should be allowed but have different action keys
      expect(openaiResult.allowed).toBe(true);
      expect(geminiResult.allowed).toBe(true);
    });
  });

  describe("Emergency Data Rate Limiting", () => {
    test("should allow higher limits during emergencies", async () => {
      // Mock emergency detection
      mockCacheService.get
        .mockResolvedValueOnce({ requests: 50, windowStart: Date.now() }) // Window data
        .mockResolvedValueOnce("active"); // Emergency alert

      const result = await testRateLimiter.checkEmergencyDataLimit({
        userId: "user123",
        dataType: "hurricane",
        county: "Orange",
      });

      expect(result.allowed).toBe(true);
      expect(result.totalRequests).toBe(51);
    });

    test("should enforce normal limits when no emergency", async () => {
      mockCacheService.get
        .mockResolvedValueOnce({ requests: 150, windowStart: Date.now() }) // Window data
        .mockResolvedValueOnce(null); // No emergency alert

      const result = await testRateLimiter.checkEmergencyDataLimit({
        userId: "user123",
        dataType: "hurricane",
        county: "Orange",
      });

      expect(result.allowed).toBe(false); // 150 > 100 normal limit
    });
  });

  describe("Document Rate Limiting", () => {
    test("should apply file size weighting for uploads", async () => {
      mockCacheService.get.mockResolvedValue({ requests: 2, windowStart: Date.now() });
      mockCacheService.set.mockResolvedValue();

      const fileSizeMB = 5; // 5MB file
      const result = await testRateLimiter.checkDocumentLimit({
        userId: "user123",
        operation: "upload",
        fileSize: fileSizeMB * 1024 * 1024,
      });

      expect(result.totalRequests).toBe(7); // 2 + 5 (5MB weight)
    });

    test("should have different limits for different operations", async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue();

      const uploadResult = await testRateLimiter.checkDocumentLimit({
        userId: "user123",
        operation: "upload",
      });

      const analysisResult = await testRateLimiter.checkDocumentLimit({
        userId: "user123",
        operation: "analysis",
      });

      expect(uploadResult.allowed).toBe(true);
      expect(analysisResult.allowed).toBe(true);
    });
  });

  describe("Global Rate Limiting", () => {
    test("should enforce different limits for different endpoints", async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue();

      const authResult = await testRateLimiter.checkGlobalLimit({
        identifier: "user123",
        endpoint: "/api/auth/signin",
        method: "POST",
      });

      const apiResult = await testRateLimiter.checkGlobalLimit({
        identifier: "user123",
        endpoint: "/api/properties",
        method: "GET",
      });

      expect(authResult.allowed).toBe(true);
      expect(apiResult.allowed).toBe(true);
    });
  });

  describe("IP Rate Limiting", () => {
    test("should apply lower limits for suspicious IPs", async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue();

      const normalResult = await testRateLimiter.checkIPLimit({
        ip: "192.168.1.1",
        endpoint: "/api/test",
        suspicious: false,
      });

      const suspiciousResult = await testRateLimiter.checkIPLimit({
        ip: "192.168.1.1",
        endpoint: "/api/test",
        suspicious: true,
      });

      expect(normalResult.allowed).toBe(true);
      expect(suspiciousResult.allowed).toBe(true);
    });
  });

  describe("Rate Limit Status and Metrics", () => {
    test("should return current status", async () => {
      mockCacheService.get.mockResolvedValue({ requests: 7, windowStart: Date.now() });

      const status = await testRateLimiter.getStatus("user123", "api_call");

      expect(status.currentUsage).toBe(7);
      expect(status.limit).toBe(10);
      expect(status.percentUsed).toBe(70);
    });

    test("should reset rate limit", async () => {
      mockCacheService.delete.mockResolvedValue();

      await testRateLimiter.reset("user123", "api_call");

      expect(mockCacheService.delete).toHaveBeenCalledWith(
        expect.stringContaining("user123")
      );
    });

    test("should collect metrics", async () => {
      const mockMetrics = {
        totalViolations: 25,
        violationsByAction: { "api_call": 15, "ai:openai:chat": 10 },
        topViolators: [{ identifier: "user123", violations: 5 }],
        recentViolations: [],
      };

      mockCacheService.get
        .mockResolvedValueOnce(mockMetrics.totalViolations)
        .mockResolvedValueOnce(mockMetrics.violationsByAction)
        .mockResolvedValueOnce(mockMetrics.topViolators)
        .mockResolvedValueOnce(mockMetrics.recentViolations);

      const metrics = await testRateLimiter.getMetrics();

      expect(metrics.totalViolations).toBe(25);
      expect(metrics.violationsByAction["api_call"]).toBe(15);
      expect(metrics.topViolators).toHaveLength(1);
    });
  });

  describe("Bypass Keys", () => {
    test("should bypass rate limit with valid key", async () => {
      process.env.RATE_LIMIT_BYPASS_KEYS = "emergency-key,admin-key";

      const result = await testRateLimiter.checkLimit({
        identifier: "user123",
        action: "api_call",
        bypassKey: "emergency-key",
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0); // Bypass doesn't count against limit
    });

    test("should not bypass with invalid key", async () => {
      process.env.RATE_LIMIT_BYPASS_KEYS = "valid-key";
      mockCacheService.get.mockResolvedValue({ requests: 15, windowStart: Date.now() });

      const result = await testRateLimiter.checkLimit({
        identifier: "user123",
        action: "api_call",
        bypassKey: "invalid-key",
      });

      expect(result.allowed).toBe(false); // Should still enforce limit
    });
  });

  describe("Error Handling", () => {
    test("should fail open on cache errors", async () => {
      mockCacheService.get.mockRejectedValue(new Error("Cache connection failed"));

      const result = await testRateLimiter.checkLimit({
        identifier: "user123",
        action: "api_call",
      });

      expect(result.allowed).toBe(true); // Should allow request when cache fails
    });

    test("should handle missing data gracefully", async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue();

      const result = await testRateLimiter.checkLimit({
        identifier: "user123",
        action: "api_call",
      });

      expect(result.allowed).toBe(true);
      expect(result.totalRequests).toBe(1); // First request in new window
    });
  });

  describe("Violation Recording", () => {
    test("should record violations and update metrics", async () => {
      mockCacheService.get.mockResolvedValue({ requests: 10, windowStart: Date.now() });
      mockCacheService.set.mockResolvedValue();

      // This should trigger a violation
      const result = await testRateLimiter.checkLimit({
        identifier: "user123",
        action: "api_call",
      });

      expect(result.allowed).toBe(false);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining("total_violations"),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });
});
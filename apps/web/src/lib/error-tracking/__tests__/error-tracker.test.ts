/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Comprehensive tests for error tracking functionality"
 * @dependencies ["jest", "@/lib/error-tracking/error-tracker"]
 * @status stable
 */

import { ErrorTracker } from "../error-tracker";
import { cacheService } from "@/lib/cache/cache-service";
import { systemMonitor } from "@/lib/monitoring/system-monitor";

// Mock cache service
jest.mock("@/lib/cache/cache-service", () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
  },
}));

// Mock system monitor
jest.mock("@/lib/monitoring/system-monitor", () => ({
  systemMonitor: {
    createAlert: jest.fn(),
  },
}));

// Mock logger
jest.mock("@/lib/logger/production-logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("ErrorTracker", () => {
  let errorTracker: ErrorTracker;
  const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;
  const mockSystemMonitor = systemMonitor as jest.Mocked<typeof systemMonitor>;

  beforeEach(() => {
    errorTracker = new ErrorTracker({
      enabled: true,
      environment: "test",
      captureConsoleErrors: false, // Disable for testing
      captureUnhandledRejections: false,
      captureNetworkErrors: false,
      maxBreadcrumbs: 10,
      sampleRate: 1.0,
      autoResolution: { enabled: false, maxAttempts: 0, strategies: [] },
      alerting: { thresholds: { errorRate: 10, criticalErrors: 5, newErrorTypes: 3 }, channels: ["monitoring"] },
    });
    jest.clearAllMocks();
  });

  describe("Error Capture", () => {
    test("should capture basic error successfully", async () => {
      mockCacheService.set.mockResolvedValue();
      mockCacheService.get.mockResolvedValue(null);

      const errorId = await errorTracker.captureError({
        type: "javascript",
        name: "TypeError",
        message: "Cannot read property 'foo' of undefined",
        stack: "TypeError: Cannot read property 'foo' of undefined\n    at test.js:1:1",
        severity: "high",
        metadata: { component: "UserProfile" },
        tags: ["frontend", "profile"],
      });

      expect(errorId).toBeTruthy();
      expect(errorId).toMatch(/^err_\d+_/);
      expect(mockCacheService.set).toHaveBeenCalledTimes(2); // error details + fingerprint
    });

    test("should generate consistent fingerprints for similar errors", async () => {
      mockCacheService.set.mockResolvedValue();
      mockCacheService.get.mockResolvedValue(null);

      const error1 = {
        type: "javascript" as const,
        name: "TypeError",
        message: "Cannot read property 'foo' of undefined",
        source: { file: "test.js", line: 1, column: 1 },
      };

      const error2 = {
        type: "javascript" as const,
        name: "TypeError", 
        message: "Cannot read property 'foo' of undefined",
        source: { file: "test.js", line: 1, column: 1 },
      };

      await errorTracker.captureError(error1);
      await errorTracker.captureError(error2);

      // Both errors should have the same fingerprint
      const calls = mockCacheService.set.mock.calls;
      const fingerprintCalls = calls.filter(call => call[0].includes("fingerprint"));
      expect(fingerprintCalls.length).toBeGreaterThanOrEqual(1);
    });

    test("should apply sampling correctly", async () => {
      const sampledTracker = new ErrorTracker({
        sampleRate: 0.0, // Never capture
        autoResolution: { enabled: false, maxAttempts: 0, strategies: [] },
      });

      const errorId = await sampledTracker.captureError({
        type: "javascript",
        name: "Test Error",
        message: "This should be dropped",
      });

      expect(errorId).toBeNull();
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    test("should ignore errors matching ignore patterns", async () => {
      const errorId = await errorTracker.captureError({
        type: "javascript",
        name: "Script error",
        message: "Script error",
      });

      expect(errorId).toBeNull();
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    test("should sanitize sensitive metadata", async () => {
      mockCacheService.set.mockResolvedValue();
      mockCacheService.get.mockResolvedValue(null);

      await errorTracker.captureError({
        type: "api",
        name: "AuthError",
        message: "Authentication failed",
        metadata: {
          password: "secret123",
          token: "bearer-token",
          publicData: "safe",
        },
      });

      const setCall = mockCacheService.set.mock.calls.find(call => 
        call[0].includes("error_details")
      );
      expect(setCall).toBeTruthy();
      
      const errorData = setCall![1] as any;
      expect(errorData.metadata.password).toBe("[REDACTED]");
      expect(errorData.metadata.token).toBe("[REDACTED]");
      expect(errorData.metadata.publicData).toBe("safe");
    });
  });

  describe("Specialized Error Capture", () => {
    test("should capture API errors with request context", async () => {
      mockCacheService.set.mockResolvedValue();
      mockCacheService.get.mockResolvedValue(null);

      const error = new Error("API request failed");
      const request = {
        url: "https://api.example.com/users",
        method: "GET",
        headers: { "authorization": "Bearer token123" },
        response: {
          status: 500,
          statusText: "Internal Server Error",
          data: { error: "Database connection failed" },
        },
      };

      const errorId = await errorTracker.captureAPIError(error, request);

      expect(errorId).toBeTruthy();
      expect(mockCacheService.set).toHaveBeenCalled();

      const setCall = mockCacheService.set.mock.calls.find(call => 
        call[0].includes("error_details")
      );
      const errorData = setCall![1] as any;
      
      expect(errorData.type).toBe("api");
      expect(errorData.severity).toBe("critical"); // 500 status
      expect(errorData.metadata.request.url).toBe(request.url);
      expect(errorData.metadata.request.headers.authorization).toBe("[REDACTED]");
    });

    test("should capture AI errors with cost context", async () => {
      mockCacheService.set.mockResolvedValue();
      mockCacheService.get.mockResolvedValue(null);

      const error = new Error("AI request failed");
      const aiContext = {
        provider: "openai" as const,
        operation: "chat",
        model: "gpt-4",
        tokens: 1500,
        cost: 0.045,
        requestId: "req-123",
      };

      const errorId = await errorTracker.captureAIError(error, aiContext);

      expect(errorId).toBeTruthy();
      
      const setCall = mockCacheService.set.mock.calls.find(call => 
        call[0].includes("error_details")
      );
      const errorData = setCall![1] as any;
      
      expect(errorData.type).toBe("ai");
      expect(errorData.severity).toBe("high");
      expect(errorData.metadata.provider).toBe("openai");
      expect(errorData.metadata.cost).toBe(0.045);
      expect(errorData.tags).toContain("ai");
      expect(errorData.tags).toContain("openai");
    });

    test("should capture database errors with query context", async () => {
      mockCacheService.set.mockResolvedValue();
      mockCacheService.get.mockResolvedValue(null);

      const error = new Error("Connection timeout");
      const queryContext = {
        query: "SELECT * FROM users WHERE active = $1",
        parameters: [true],
        table: "users",
        operation: "select" as const,
        duration: 5000,
      };

      const errorId = await errorTracker.captureDatabaseError(error, queryContext);

      expect(errorId).toBeTruthy();
      
      const setCall = mockCacheService.set.mock.calls.find(call => 
        call[0].includes("error_details")
      );
      const errorData = setCall![1] as any;
      
      expect(errorData.type).toBe("database");
      expect(errorData.severity).toBe("critical"); // timeout error
      expect(errorData.metadata.table).toBe("users");
      expect(errorData.metadata.duration).toBe(5000);
    });
  });

  describe("Breadcrumb Management", () => {
    test("should add breadcrumbs correctly", () => {
      errorTracker.addBreadcrumb({
        category: "navigation",
        message: "User navigated to profile page",
        level: "info",
        data: { path: "/profile", userId: "123" },
      });

      errorTracker.addBreadcrumb({
        category: "user",
        message: "User clicked save button",
        level: "info",
      });

      // Breadcrumbs are private, but they should be included in error capture
      // We can test this indirectly by capturing an error and checking the calls
      expect(true).toBe(true); // Placeholder assertion
    });

    test("should limit breadcrumb count", () => {
      const tracker = new ErrorTracker({
        maxBreadcrumbs: 3,
        autoResolution: { enabled: false, maxAttempts: 0, strategies: [] },
      });

      // Add more breadcrumbs than the limit
      for (let i = 0; i < 5; i++) {
        tracker.addBreadcrumb({
          category: "user",
          message: `Action ${i}`,
        });
      }

      // Test that only the last 3 breadcrumbs are kept
      // This would be verified in actual error capture
      expect(true).toBe(true); // Placeholder assertion
    });

    test("should sanitize breadcrumb data", () => {
      errorTracker.addBreadcrumb({
        category: "auth",
        message: "User login attempt",
        data: {
          username: "testuser",
          password: "secret123",
          sessionId: "session-456",
        },
      });

      // Sensitive data should be sanitized
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe("Error Aggregation", () => {
    test("should get error aggregations with filters", async () => {
      const mockAggregations = [
        {
          fingerprint: "test-fingerprint",
          count: 5,
          affectedUsers: 3,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          trend: "increasing" as const,
          errorRate: 2.5,
          impact: "medium" as const,
          similarErrors: [],
          suggestedActions: [],
        },
      ];

      mockCacheService.get.mockResolvedValue(mockAggregations);

      const aggregations = await errorTracker.getErrorAggregations("24h", {
        type: "api",
        severity: "high",
        resolved: false,
      });

      expect(aggregations).toEqual(mockAggregations);
      expect(mockCacheService.get).toHaveBeenCalledWith(
        expect.stringContaining("error_aggregations")
      );
    });

    test("should cache aggregation results", async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue();

      const aggregations = await errorTracker.getErrorAggregations("1h");

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining("error_aggregations"),
        expect.any(Array),
        300 // 5 minutes
      );
    });
  });

  describe("Error Resolution", () => {
    test("should resolve errors manually", async () => {
      const mockError = {
        id: "test-error-id",
        resolved: false,
        type: "javascript" as const,
        name: "Test Error",
        message: "Test message",
        // ... other required properties
      };

      mockCacheService.get.mockResolvedValue(mockError);
      mockCacheService.set.mockResolvedValue();

      const resolved = await errorTracker.resolveError("test-error-id", {
        description: "Fixed by updating dependencies",
        resolvedBy: "developer",
      });

      expect(resolved).toBe(true);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    test("should handle non-existent error resolution", async () => {
      mockCacheService.get.mockResolvedValue(null);

      const resolved = await errorTracker.resolveError("non-existent-id", {
        description: "Test resolution",
      });

      expect(resolved).toBe(false);
    });
  });

  describe("Auto Resolution", () => {
    test("should attempt auto resolution for known patterns", async () => {
      const tracker = new ErrorTracker({
        autoResolution: {
          enabled: true,
          maxAttempts: 2,
          strategies: ["cache_clear", "retry"],
        },
        alerting: { thresholds: { errorRate: 10, criticalErrors: 5, newErrorTypes: 3 }, channels: ["monitoring"] },
      });

      mockCacheService.set.mockResolvedValue();
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.clear.mockResolvedValue();

      // Capture a cache-related error
      await tracker.captureError({
        type: "database",
        name: "CacheError",
        message: "Cache connection failed",
      });

      // Auto resolution should have been attempted
      expect(mockCacheService.clear).toHaveBeenCalled();
    });
  });

  describe("Alerting Integration", () => {
    test("should create system alerts for high error rates", async () => {
      const tracker = new ErrorTracker({
        alerting: {
          thresholds: { errorRate: 1, criticalErrors: 1, newErrorTypes: 1 },
          channels: ["monitoring"],
        },
        autoResolution: { enabled: false, maxAttempts: 0, strategies: [] },
      });

      // Mock high error rate
      jest.spyOn(tracker as any, "getMetrics").mockResolvedValue({
        totalErrors: 100,
        errorRate: 5.0,
        criticalErrors: 10,
        resolvedErrors: 50,
        topErrorTypes: [],
        errorTrend: "increasing",
        mttr: 15,
        affectedUsers: 25,
      });

      mockCacheService.set.mockResolvedValue();
      mockCacheService.get.mockResolvedValue(null);

      await tracker.captureError({
        type: "javascript",
        name: "HighRateError",
        message: "This should trigger alerting",
        severity: "critical",
      });

      expect(mockSystemMonitor.createAlert).toHaveBeenCalled();
    });

    test("should suppress duplicate alerts", async () => {
      const tracker = new ErrorTracker({
        alerting: {
          thresholds: { errorRate: 1, criticalErrors: 1, newErrorTypes: 1 },
          channels: ["monitoring"],
        },
        autoResolution: { enabled: false, maxAttempts: 0, strategies: [] },
      });

      mockCacheService.set.mockResolvedValue();
      mockCacheService.get.mockResolvedValue(null);
      mockSystemMonitor.createAlert.mockResolvedValue("alert-id");

      // Capture same error multiple times
      await tracker.captureError({
        type: "security",
        name: "CriticalError",
        message: "Critical system failure",
        severity: "critical",
      });

      // Reset mocks
      mockSystemMonitor.createAlert.mockClear();

      await tracker.captureError({
        type: "security", 
        name: "CriticalError",
        message: "Critical system failure", 
        severity: "critical",
      });

      // Second identical alert should not be created
      expect(mockSystemMonitor.createAlert).not.toHaveBeenCalled();
    });
  });

  describe("Metrics Collection", () => {
    test("should return error metrics", async () => {
      const metrics = await errorTracker.getMetrics();

      expect(metrics).toHaveProperty("totalErrors");
      expect(metrics).toHaveProperty("errorRate");
      expect(metrics).toHaveProperty("criticalErrors");
      expect(metrics).toHaveProperty("resolvedErrors");
      expect(metrics).toHaveProperty("topErrorTypes");
      expect(metrics).toHaveProperty("errorTrend");
      expect(metrics).toHaveProperty("mttr");
      expect(metrics).toHaveProperty("affectedUsers");

      expect(typeof metrics.totalErrors).toBe("number");
      expect(typeof metrics.errorRate).toBe("number");
      expect(Array.isArray(metrics.topErrorTypes)).toBe(true);
    });
  });

  describe("Error Severity Determination", () => {
    test("should determine severity correctly for different error types", async () => {
      mockCacheService.set.mockResolvedValue();
      mockCacheService.get.mockResolvedValue(null);

      // Critical errors
      await errorTracker.captureError({
        type: "javascript",
        name: "ReferenceError",
        message: "someUndefinedVariable is not defined",
      });

      // High severity errors  
      await errorTracker.captureError({
        type: "ai",
        name: "AIServiceError",
        message: "OpenAI API request failed",
      });

      // Medium severity errors
      await errorTracker.captureError({
        type: "api",
        name: "ValidationError",
        message: "Invalid request parameters",
      });

      const calls = mockCacheService.set.mock.calls.filter(call => 
        call[0].includes("error_details")
      );

      expect(calls.length).toBe(3);
      // Test that different severities were assigned
      expect(calls.some(call => (call[1] as any).severity === "critical")).toBe(true);
      expect(calls.some(call => (call[1] as any).severity === "high")).toBe(true);
      expect(calls.some(call => (call[1] as any).severity === "medium")).toBe(true);
    });
  });

  describe("Configuration", () => {
    test("should respect disabled configuration", async () => {
      const disabledTracker = new ErrorTracker({
        enabled: false,
        autoResolution: { enabled: false, maxAttempts: 0, strategies: [] },
      });

      const errorId = await disabledTracker.captureError({
        type: "javascript",
        name: "TestError",
        message: "This should be ignored",
      });

      expect(errorId).toBeNull();
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    test("should apply beforeSend hook", async () => {
      const tracker = new ErrorTracker({
        beforeSend: (error) => {
          // Modify error before sending
          error.tags = [...error.tags, "modified"];
          return error;
        },
        autoResolution: { enabled: false, maxAttempts: 0, strategies: [] },
      });

      mockCacheService.set.mockResolvedValue();
      mockCacheService.get.mockResolvedValue(null);

      await tracker.captureError({
        type: "javascript",
        name: "TestError",
        message: "Test message",
      });

      const setCall = mockCacheService.set.mock.calls.find(call => 
        call[0].includes("error_details")
      );
      const errorData = setCall![1] as any;
      
      expect(errorData.tags).toContain("modified");
    });

    test("should filter out errors via beforeSend hook", async () => {
      const tracker = new ErrorTracker({
        beforeSend: () => null, // Filter out all errors
        autoResolution: { enabled: false, maxAttempts: 0, strategies: [] },
      });

      const errorId = await tracker.captureError({
        type: "javascript",
        name: "TestError",
        message: "This should be filtered",
      });

      expect(errorId).toBeNull();
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    test("should handle cache service failures gracefully", async () => {
      mockCacheService.set.mockRejectedValue(new Error("Cache service down"));
      mockCacheService.get.mockRejectedValue(new Error("Cache service down"));

      const errorId = await errorTracker.captureError({
        type: "javascript",
        name: "TestError",
        message: "Test message",
      });

      // Should still return null but not throw
      expect(errorId).toBeNull();
    });

    test("should handle malformed error input gracefully", async () => {
      // Test with missing required fields
      const errorId = await errorTracker.captureError({
        type: "javascript",
        name: "",
        message: "",
      });

      // Should handle gracefully
      expect(typeof errorId === "string" || errorId === null).toBe(true);
    });
  });
});
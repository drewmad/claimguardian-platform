/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Integration tests for error tracking API endpoints"
 * @dependencies ["jest", "@/app/api/errors/route"]
 * @status stable
 */

import { NextRequest } from "next/server";
import { GET, POST, DELETE } from "../route";
import { errorTracker } from "@/lib/error-tracking/error-tracker";
import { rateLimiter } from "@/lib/rate-limiting/rate-limiter";

// Mock dependencies
jest.mock("@/lib/error-tracking/error-tracker", () => ({
  errorTracker: {
    getErrorDetails: jest.fn(),
    getErrorAggregations: jest.fn(),
    getMetrics: jest.fn(),
    captureError: jest.fn(),
    captureAPIError: jest.fn(),
    captureAIError: jest.fn(),
    captureDatabaseError: jest.fn(),
    resolveError: jest.fn(),
    addBreadcrumb: jest.fn(),
  },
}));

jest.mock("@/lib/rate-limiting/rate-limiter", () => ({
  rateLimiter: {
    checkLimit: jest.fn(),
  },
}));

const mockErrorTracker = errorTracker as jest.Mocked<typeof errorTracker>;
const mockRateLimiter = rateLimiter as jest.Mocked<typeof rateLimiter>;

// Helper function to create mock NextRequest
function createMockRequest(url: string, options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
} = {}): NextRequest {
  const { method = "GET", headers = {}, body } = options;
  
  const request = new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  return request;
}

describe("/api/errors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default rate limit success
    mockRateLimiter.checkLimit.mockResolvedValue({
      success: true,
      remaining: 99,
      resetTime: Date.now() + 60000,
      retryAfter: 0,
    });
  });

  describe("GET /api/errors", () => {
    test("should return error aggregations and metrics", async () => {
      const mockAggregations = [
        {
          fingerprint: "test-fp-1",
          count: 10,
          affectedUsers: 5,
          firstSeen: "2024-01-01T00:00:00Z",
          lastSeen: "2024-01-02T00:00:00Z",
          trend: "increasing" as const,
          errorRate: 2.5,
          impact: "medium" as const,
          similarErrors: [],
          suggestedActions: [],
        },
      ];

      const mockMetrics = {
        totalErrors: 150,
        errorRate: 3.2,
        criticalErrors: 12,
        resolvedErrors: 120,
        topErrorTypes: [
          { type: "javascript", count: 50 },
          { type: "api", count: 30 },
        ],
        errorTrend: "decreasing" as const,
        mttr: 18.5,
        affectedUsers: 45,
      };

      mockErrorTracker.getErrorAggregations.mockResolvedValue(mockAggregations);
      mockErrorTracker.getMetrics.mockResolvedValue(mockMetrics);

      const request = createMockRequest("/api/errors?scope=all");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.aggregations).toEqual(mockAggregations);
      expect(data.metrics).toEqual(mockMetrics);
      expect(data.meta).toHaveProperty("timestamp");
      expect(data.meta.scope).toBe("all");
    });

    test("should return specific error details", async () => {
      const mockErrorDetails = {
        id: "err-123",
        type: "javascript" as const,
        severity: "high" as const,
        name: "TypeError",
        message: "Cannot read property 'foo' of undefined",
        context: {
          timestamp: "2024-01-01T00:00:00Z",
          environment: "production",
        },
        metadata: {},
        fingerprint: "fp-123",
        firstOccurrence: "2024-01-01T00:00:00Z",
        lastOccurrence: "2024-01-02T00:00:00Z",
        occurrenceCount: 5,
        resolved: false,
        tags: ["frontend"],
        breadcrumbs: [],
      };

      mockErrorTracker.getErrorDetails.mockResolvedValue(mockErrorDetails);

      const request = createMockRequest("/api/errors?errorId=err-123");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.error).toEqual(mockErrorDetails);
      expect(data.meta.scope).toBe("details");
      expect(data.meta.errorId).toBe("err-123");
    });

    test("should return 404 for non-existent error", async () => {
      mockErrorTracker.getErrorDetails.mockResolvedValue(null);

      const request = createMockRequest("/api/errors?errorId=non-existent");
      const response = await GET(request);

      expect(response.status).toBe(404);
    });

    test("should apply filters correctly", async () => {
      mockErrorTracker.getErrorAggregations.mockResolvedValue([]);

      const request = createMockRequest(
        "/api/errors?timeRange=7d&type=api&severity=critical&resolved=false"
      );
      await GET(request);

      expect(mockErrorTracker.getErrorAggregations).toHaveBeenCalledWith(
        "7d",
        { type: "api", severity: "critical", resolved: false }
      );
    });

    test("should enforce rate limits", async () => {
      mockRateLimiter.checkLimit.mockResolvedValue({
        success: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      });

      const request = createMockRequest("/api/errors");
      const response = await GET(request);

      expect(response.status).toBe(429);
      
      const data = await response.json();
      expect(data.error).toBe("Rate limit exceeded");
      expect(data.retryAfter).toBe(60);
    });

    test("should handle server errors gracefully", async () => {
      mockErrorTracker.getMetrics.mockRejectedValue(new Error("Database connection failed"));

      const request = createMockRequest("/api/errors");
      const response = await GET(request);

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.error).toBe("Failed to fetch error data");
      expect(data.details).toBe("Database connection failed");
    });
  });

  describe("POST /api/errors", () => {
    test("should capture basic error", async () => {
      mockErrorTracker.captureError.mockResolvedValue("err-456");

      const request = createMockRequest("/api/errors", {
        method: "POST",
        body: {
          action: "capture_error",
          type: "javascript",
          name: "TypeError",
          message: "Test error message",
          stack: "TypeError: Test error\n    at test.js:1:1",
          severity: "medium",
          metadata: { component: "TestComponent" },
          tags: ["test", "frontend"],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.errorId).toBe("err-456");
      expect(mockErrorTracker.captureError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "javascript",
          name: "TypeError",
          message: "Test error message",
          context: expect.objectContaining({
            userAgent: null, // No user agent in test
          }),
        })
      );
    });

    test("should capture API error with request data", async () => {
      mockErrorTracker.captureAPIError.mockResolvedValue("err-api-123");

      const request = createMockRequest("/api/errors", {
        method: "POST",
        body: {
          action: "capture_api_error",
          error: { message: "API request failed" },
          requestData: {
            url: "https://api.example.com/users",
            method: "GET",
            response: { status: 500, statusText: "Internal Server Error" },
          },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.errorId).toBe("err-api-123");
      expect(mockErrorTracker.captureAPIError).toHaveBeenCalled();
    });

    test("should capture AI error with context", async () => {
      mockErrorTracker.captureAIError.mockResolvedValue("err-ai-789");

      const request = createMockRequest("/api/errors", {
        method: "POST",
        body: {
          action: "capture_ai_error",
          error: { message: "OpenAI API timeout" },
          aiContext: {
            provider: "openai",
            operation: "chat",
            model: "gpt-4",
            tokens: 1500,
            cost: 0.045,
          },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.errorId).toBe("err-ai-789");
      expect(mockErrorTracker.captureAIError).toHaveBeenCalled();
    });

    test("should capture database error with query context", async () => {
      mockErrorTracker.captureDatabaseError.mockResolvedValue("err-db-101");

      const request = createMockRequest("/api/errors", {
        method: "POST",
        body: {
          action: "capture_database_error",
          error: { message: "Connection timeout" },
          queryContext: {
            query: "SELECT * FROM users",
            table: "users",
            operation: "select",
            duration: 30000,
          },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.errorId).toBe("err-db-101");
      expect(mockErrorTracker.captureDatabaseError).toHaveBeenCalled();
    });

    test("should resolve error", async () => {
      mockErrorTracker.resolveError.mockResolvedValue(true);

      const request = createMockRequest("/api/errors", {
        method: "POST",
        body: {
          action: "resolve_error",
          errorId: "err-123",
          resolution: "Fixed by updating dependencies",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockErrorTracker.resolveError).toHaveBeenCalledWith(
        "err-123",
        {
          description: "Fixed by updating dependencies",
          resolvedBy: "api-user",
        }
      );
    });

    test("should add breadcrumb", async () => {
      const request = createMockRequest("/api/errors", {
        method: "POST",
        body: {
          action: "add_breadcrumb",
          category: "navigation",
          breadcrumbMessage: "User navigated to profile",
          level: "info",
          breadcrumbData: { path: "/profile" },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockErrorTracker.addBreadcrumb).toHaveBeenCalledWith({
        category: "navigation",
        message: "User navigated to profile",
        level: "info",
        data: { path: "/profile" },
      });
    });

    test("should validate required fields", async () => {
      const request = createMockRequest("/api/errors", {
        method: "POST",
        body: {
          action: "capture_error",
          // Missing required fields
          name: "TypeError",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe("Missing required fields: type, name, message");
    });

    test("should handle unknown actions", async () => {
      const request = createMockRequest("/api/errors", {
        method: "POST",
        body: {
          action: "unknown_action",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe("Unknown action: unknown_action");
    });

    test("should enforce rate limits for error reporting", async () => {
      mockRateLimiter.checkLimit.mockResolvedValue({
        success: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 30,
      });

      const request = createMockRequest("/api/errors", {
        method: "POST",
        body: {
          action: "capture_error",
          type: "javascript",
          name: "Test",
          message: "Test",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(429);
      
      const data = await response.json();
      expect(data.retryAfter).toBe(30);
    });

    test("should handle POST request parsing errors", async () => {
      // Create a request with invalid JSON
      const request = new NextRequest("http://localhost:3000/api/errors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "invalid json{",
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });

  describe("DELETE /api/errors", () => {
    test("should delete (resolve) error", async () => {
      mockErrorTracker.resolveError.mockResolvedValue(true);

      const request = createMockRequest("/api/errors?errorId=err-456", {
        method: "DELETE",
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockErrorTracker.resolveError).toHaveBeenCalledWith(
        "err-456",
        {
          description: "Deleted via API",
          resolvedBy: "api-user",
        }
      );
    });

    test("should require errorId parameter", async () => {
      const request = createMockRequest("/api/errors", {
        method: "DELETE",
      });

      const response = await DELETE(request);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe("Missing errorId parameter");
    });

    test("should enforce rate limits for deletions", async () => {
      mockRateLimiter.checkLimit.mockResolvedValue({
        success: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 15,
      });

      const request = createMockRequest("/api/errors?errorId=err-123", {
        method: "DELETE",
      });

      const response = await DELETE(request);

      expect(response.status).toBe(429);
      
      const data = await response.json();
      expect(data.retryAfter).toBe(15);
    });

    test("should handle deletion errors gracefully", async () => {
      mockErrorTracker.resolveError.mockRejectedValue(new Error("Database error"));

      const request = createMockRequest("/api/errors?errorId=err-456", {
        method: "DELETE",
      });

      const response = await DELETE(request);

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.error).toBe("Failed to delete error");
      expect(data.details).toBe("Database error");
    });
  });

  describe("Headers and CORS", () => {
    test("should set appropriate cache headers for GET requests", async () => {
      mockErrorTracker.getMetrics.mockResolvedValue({
        totalErrors: 0,
        errorRate: 0,
        criticalErrors: 0,
        resolvedErrors: 0,
        topErrorTypes: [],
        errorTrend: "stable" as const,
        mttr: 0,
        affectedUsers: 0,
      });

      const request = createMockRequest("/api/errors");
      const response = await GET(request);

      expect(response.headers.get("Cache-Control")).toBe("no-cache, no-store, must-revalidate");
      expect(response.headers.get("Pragma")).toBe("no-cache");
      expect(response.headers.get("Expires")).toBe("0");
    });

    test("should handle request headers correctly", async () => {
      mockErrorTracker.captureError.mockResolvedValue("err-123");

      const request = createMockRequest("/api/errors", {
        method: "POST",
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "x-request-id": "req-123",
          "user-agent": "Mozilla/5.0 Test Browser",
        },
        body: {
          action: "capture_error",
          type: "javascript",
          name: "Test",
          message: "Test message",
        },
      });

      await POST(request);

      expect(mockErrorTracker.captureError).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            userAgent: "Mozilla/5.0 Test Browser",
            ipAddress: "192.168.1.1",
            requestId: "req-123",
          }),
        })
      );
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty response bodies gracefully", async () => {
      const request = createMockRequest("/api/errors", {
        method: "POST",
        body: {},
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    test("should handle null values in request body", async () => {
      mockErrorTracker.captureError.mockResolvedValue("err-null");

      const request = createMockRequest("/api/errors", {
        method: "POST",
        body: {
          action: "capture_error",
          type: "javascript",
          name: "NullTest",
          message: "Test with null values",
          stack: null,
          metadata: null,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    test("should handle very large error payloads", async () => {
      mockErrorTracker.captureError.mockResolvedValue("err-large");

      const largeMetadata = {
        largeField: "x".repeat(10000),
        nestedData: {
          level1: { level2: { level3: "deep data" } },
        },
      };

      const request = createMockRequest("/api/errors", {
        method: "POST",
        body: {
          action: "capture_error",
          type: "javascript",
          name: "LargeError",
          message: "Error with large metadata",
          metadata: largeMetadata,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });
});
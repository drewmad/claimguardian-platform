/**
 * @fileMetadata
 * @purpose "Unit tests for Partner API middleware module"
 * @owner partner-api-team
 * @complexity high
 * @tags ["test", "middleware", "partner-api", "authentication", "rate-limiting"]
 * @status stable
 * @jest-environment node
 */

import { NextRequest, NextResponse } from "next/server";
import { withPartnerAuth, createPartnerResponse, PartnerApiContext } from "../middleware";

// Polyfill for Node.js environment
if (typeof globalThis.Request === 'undefined') {
  const { Request, Response, Headers, fetch } = require('undici');
  Object.assign(globalThis, { Request, Response, Headers, fetch });
}

// Mock dependencies
jest.mock("../auth", () => ({
  partnerApiAuth: {
    authenticate: jest.fn(),
    validatePermissions: jest.fn(),
  },
}));

jest.mock("../rate-limiter", () => ({
  partnerRateLimiter: {
    checkLimit: jest.fn(),
  },
}));

jest.mock("../validation", () => ({
  validatePartnerRequest: jest.fn(),
}));

jest.mock("@/lib/logger/production-logger", () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Partner API Middleware", () => {
  const mockPartner = {
    id: "partner-123",
    name: "Test Partner",
    status: "active" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockApiKey = {
    id: "key-123",
    partnerId: "partner-123",
    name: "Test API Key",
    keyHash: "mock-hash",
    status: "active" as const,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    lastUsedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockHandler = jest.fn().mockResolvedValue(
    NextResponse.json({ success: true }),
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("withPartnerAuth", () => {
    it("should authenticate and call handler for valid requests", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-api-key",
          "User-Agent": "Test Client",
        },
      });

      // Mock successful authentication
      const { partnerApiAuth } = require("../auth");
      partnerApiAuth.authenticate.mockResolvedValue({
        success: true,
        partner: mockPartner,
        apiKey: mockApiKey,
      });

      // Mock successful rate limiting
      const { partnerRateLimiter } = require("../rate-limiter");
      partnerRateLimiter.checkLimit.mockResolvedValue({
        allowed: true,
        limit: 1000,
        current: 1,
        remaining: 999,
        resetTime: Date.now() + 60000,
      });

      // Mock successful validation
      const { validatePartnerRequest } = require("../validation");
      validatePartnerRequest.mockResolvedValue({
        valid: true,
        data: { query: {} },
      });

      const middleware = withPartnerAuth(mockHandler);
      const response = await middleware(request);

      expect(partnerApiAuth.authenticate).toHaveBeenCalledWith(request);
      expect(partnerRateLimiter.checkLimit).toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalled();

      // Check that context was passed to handler
      const [receivedRequest, context] = mockHandler.mock.calls[0];
      expect(receivedRequest).toBe(request);
      expect(context).toMatchObject({
        partner: mockPartner,
        apiKey: mockApiKey,
        requestId: expect.any(String),
        startTime: expect.any(Number),
        metadata: expect.objectContaining({
          ip: expect.any(String),
          userAgent: "Test Client",
          requestSize: expect.any(Number),
          rateLimit: {
            limit: 1000,
            remaining: 999,
            reset: expect.any(Number),
          },
        }),
      });
    });

    it("should return 401 for authentication failure", async () => {
      const request = new NextRequest("https://api.example.com/test");

      const { partnerApiAuth } = require("../auth");
      partnerApiAuth.authenticate.mockResolvedValue({
        success: false,
        error: "API key is required",
        errorCode: "INVALID_API_KEY",
      });

      const middleware = withPartnerAuth(mockHandler);
      const response = await middleware(request);

      expect(response.status).toBe(401);
      expect(mockHandler).not.toHaveBeenCalled();

      const responseData = await response.json();
      expect(responseData).toMatchObject({
        success: false,
        error: "Authentication failed",
        code: "INVALID_API_KEY",
      });
    });

    it("should return 429 for rate limit exceeded", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer valid-api-key",
        },
      });

      const { partnerApiAuth } = require("../auth");
      partnerApiAuth.authenticate.mockResolvedValue({
        success: true,
        partner: mockPartner,
        apiKey: mockApiKey,
      });

      const { partnerRateLimiter } = require("../rate-limiter");
      partnerRateLimiter.checkLimit.mockResolvedValue({
        allowed: false,
        limit: 1000,
        current: 1000,
        remaining: 0,
        resetTime: Date.now() + 60000,
      });

      const middleware = withPartnerAuth(mockHandler);
      const response = await middleware(request);

      expect(response.status).toBe(429);
      expect(mockHandler).not.toHaveBeenCalled();

      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Rate limit exceeded");
    });

    it("should return 400 for validation failure", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer valid-api-key",
        },
      });

      const { partnerApiAuth } = require("../auth");
      partnerApiAuth.authenticate.mockResolvedValue({
        success: true,
        partner: mockPartner,
        apiKey: mockApiKey,
      });

      const { partnerRateLimiter } = require("../rate-limiter");
      partnerRateLimiter.checkLimit.mockResolvedValue({
        allowed: true,
        limit: 1000,
        current: 1,
        remaining: 999,
      });

      const { validatePartnerRequest } = require("../validation");
      validatePartnerRequest.mockResolvedValue({
        valid: false,
        error: "Invalid request format",
        details: { field: "required" },
      });

      const middleware = withPartnerAuth(mockHandler);
      const response = await middleware(request);

      expect(response.status).toBe(400);
      expect(mockHandler).not.toHaveBeenCalled();

      const responseData = await response.json();
      expect(responseData).toMatchObject({
        success: false,
        error: "Invalid request format",
        code: "INVALID_REQUEST",
      });
    });

    it("should validate permissions when required", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer valid-api-key",
        },
      });

      const { partnerApiAuth } = require("../auth");
      partnerApiAuth.authenticate.mockResolvedValue({
        success: true,
        partner: mockPartner,
        apiKey: mockApiKey,
      });
      partnerApiAuth.validatePermissions.mockResolvedValue(false);

      const { partnerRateLimiter } = require("../rate-limiter");
      partnerRateLimiter.checkLimit.mockResolvedValue({
        allowed: true,
        limit: 1000,
        current: 1,
        remaining: 999,
      });

      const middleware = withPartnerAuth(mockHandler, {
        permissions: ["admin:users"],
      });
      const response = await middleware(request);

      expect(response.status).toBe(403);
      expect(partnerApiAuth.validatePermissions).toHaveBeenCalledWith(
        mockPartner.id,
        ["admin:users"],
      );
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should skip authentication when requireAuth is false", async () => {
      const request = new NextRequest("https://api.example.com/test");

      const middleware = withPartnerAuth(mockHandler, {
        requireAuth: false,
      });
      const response = await middleware(request);

      const { partnerApiAuth } = require("../auth");
      expect(partnerApiAuth.authenticate).not.toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalled();
    });

    it("should apply custom rate limits", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer valid-api-key",
        },
      });

      const { partnerApiAuth } = require("../auth");
      partnerApiAuth.authenticate.mockResolvedValue({
        success: true,
        partner: mockPartner,
        apiKey: mockApiKey,
      });

      const { partnerRateLimiter } = require("../rate-limiter");
      partnerRateLimiter.checkLimit.mockResolvedValue({
        allowed: true,
        limit: 500,
        current: 1,
        remaining: 499,
      });

      const middleware = withPartnerAuth(mockHandler, {
        rateLimit: {
          override: true,
          customLimit: 500,
        },
      });

      await middleware(request);

      expect(partnerRateLimiter.checkLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          override: true,
          customLimit: 500,
        }),
      );
    });

    it("should handle handler errors gracefully", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer valid-api-key",
        },
      });

      const { partnerApiAuth } = require("../auth");
      partnerApiAuth.authenticate.mockResolvedValue({
        success: true,
        partner: mockPartner,
        apiKey: mockApiKey,
      });

      const { partnerRateLimiter } = require("../rate-limiter");
      partnerRateLimiter.checkLimit.mockResolvedValue({
        allowed: true,
        limit: 1000,
        current: 1,
        remaining: 999,
      });

      const { validatePartnerRequest } = require("../validation");
      validatePartnerRequest.mockResolvedValue({
        valid: true,
        data: {},
      });

      const errorHandler = jest.fn().mockRejectedValue(new Error("Handler error"));
      const middleware = withPartnerAuth(errorHandler);
      const response = await middleware(request);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    });

    it("should extract client IP correctly", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer valid-api-key",
          "X-Forwarded-For": "203.0.113.1, 198.51.100.1",
          "X-Real-IP": "203.0.113.1",
        },
      });

      const { partnerApiAuth } = require("../auth");
      partnerApiAuth.authenticate.mockResolvedValue({
        success: true,
        partner: mockPartner,
        apiKey: mockApiKey,
      });

      const { partnerRateLimiter } = require("../rate-limiter");
      partnerRateLimiter.checkLimit.mockResolvedValue({
        allowed: true,
        limit: 1000,
        current: 1,
        remaining: 999,
      });

      const { validatePartnerRequest } = require("../validation");
      validatePartnerRequest.mockResolvedValue({
        valid: true,
        data: {},
      });

      const middleware = withPartnerAuth(mockHandler);
      await middleware(request);

      const [, context] = mockHandler.mock.calls[0];
      expect(context.metadata.ip).toBe("203.0.113.1");
    });

    it("should handle missing User-Agent header", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer valid-api-key",
        },
      });

      const { partnerApiAuth } = require("../auth");
      partnerApiAuth.authenticate.mockResolvedValue({
        success: true,
        partner: mockPartner,
        apiKey: mockApiKey,
      });

      const { partnerRateLimiter } = require("../rate-limiter");
      partnerRateLimiter.checkLimit.mockResolvedValue({
        allowed: true,
        limit: 1000,
        current: 1,
        remaining: 999,
      });

      const { validatePartnerRequest } = require("../validation");
      validatePartnerRequest.mockResolvedValue({
        valid: true,
        data: {},
      });

      const middleware = withPartnerAuth(mockHandler);
      await middleware(request);

      const [, context] = mockHandler.mock.calls[0];
      expect(context.metadata.userAgent).toBe("unknown");
    });

    it("should generate unique request IDs", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer valid-api-key",
        },
      });

      const { partnerApiAuth } = require("../auth");
      partnerApiAuth.authenticate.mockResolvedValue({
        success: true,
        partner: mockPartner,
        apiKey: mockApiKey,
      });

      const { partnerRateLimiter } = require("../rate-limiter");
      partnerRateLimiter.checkLimit.mockResolvedValue({
        allowed: true,
        limit: 1000,
        current: 1,
        remaining: 999,
      });

      const { validatePartnerRequest } = require("../validation");
      validatePartnerRequest.mockResolvedValue({
        valid: true,
        data: {},
      });

      const middleware = withPartnerAuth(mockHandler);
      
      // Make two requests
      await middleware(request);
      await middleware(request);

      const [, context1] = mockHandler.mock.calls[0];
      const [, context2] = mockHandler.mock.calls[1];
      
      expect(context1.requestId).not.toBe(context2.requestId);
      expect(context1.requestId).toMatch(/^req_[a-f0-9]+$/);
    });
  });

  describe("createPartnerResponse", () => {
    it("should create success response with data", () => {
      const data = { message: "Success", items: [1, 2, 3] };
      const response = createPartnerResponse(data, 200);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should create error response", () => {
      const response = createPartnerResponse(
        {
          success: false,
          error: "Not found",
          code: "NOT_FOUND",
        },
        404,
      );

      expect(response.status).toBe(404);
    });

    it("should include rate limit headers when provided", () => {
      const response = createPartnerResponse(
        { success: true },
        200,
        undefined,
        {
          limit: 1000,
          remaining: 999,
          reset: 1640995200,
        },
      );

      expect(response.headers.get("X-RateLimit-Limit")).toBe("1000");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("999");
      expect(response.headers.get("X-RateLimit-Reset")).toBe("1640995200");
    });

    it("should include request ID header when provided", () => {
      const requestId = "req_123456789";
      const response = createPartnerResponse(
        { success: true },
        200,
        requestId,
      );

      expect(response.headers.get("X-Request-ID")).toBe(requestId);
    });

    it("should set CORS headers correctly", () => {
      const response = createPartnerResponse({ success: true }, 200);

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
        "Authorization, Content-Type, X-API-Key",
      );
    });
  });

  describe("Request Context Building", () => {
    it("should build complete request context", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-api-key",
          "User-Agent": "TestClient/1.0",
          "X-Forwarded-For": "203.0.113.1",
          Origin: "https://partner.example.com",
        },
        body: JSON.stringify({ test: "data" }),
      });

      const { partnerApiAuth } = require("../auth");
      partnerApiAuth.authenticate.mockResolvedValue({
        success: true,
        partner: mockPartner,
        apiKey: mockApiKey,
      });

      const { partnerRateLimiter } = require("../rate-limiter");
      partnerRateLimiter.checkLimit.mockResolvedValue({
        allowed: true,
        limit: 1000,
        current: 5,
        remaining: 995,
        resetTime: 1640995200,
      });

      const { validatePartnerRequest } = require("../validation");
      validatePartnerRequest.mockResolvedValue({
        valid: true,
        data: { body: { test: "data" } },
      });

      const middleware = withPartnerAuth(mockHandler);
      await middleware(request);

      const [, context] = mockHandler.mock.calls[0];
      
      expect(context).toMatchObject({
        partner: mockPartner,
        apiKey: mockApiKey,
        requestId: expect.stringMatching(/^req_[a-f0-9]+$/),
        startTime: expect.any(Number),
        metadata: {
          ip: "203.0.113.1",
          userAgent: "TestClient/1.0",
          origin: "https://partner.example.com",
          requestSize: expect.any(Number),
          rateLimit: {
            limit: 1000,
            remaining: 995,
            reset: 1640995200,
          },
        },
      });

      expect(context.startTime).toBeLessThanOrEqual(Date.now());
    });

    it("should calculate request size correctly", async () => {
      const requestBody = JSON.stringify({ large: "data".repeat(100) });
      const request = new NextRequest("https://api.example.com/test", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-api-key",
          "Content-Type": "application/json",
        },
        body: requestBody,
      });

      const { partnerApiAuth } = require("../auth");
      partnerApiAuth.authenticate.mockResolvedValue({
        success: true,
        partner: mockPartner,
        apiKey: mockApiKey,
      });

      const { partnerRateLimiter } = require("../rate-limiter");
      partnerRateLimiter.checkLimit.mockResolvedValue({
        allowed: true,
        limit: 1000,
        current: 1,
        remaining: 999,
      });

      const { validatePartnerRequest } = require("../validation");
      validatePartnerRequest.mockResolvedValue({
        valid: true,
        data: {},
      });

      const middleware = withPartnerAuth(mockHandler);
      await middleware(request);

      const [, context] = mockHandler.mock.calls[0];
      expect(context.metadata.requestSize).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle authentication service errors", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer valid-api-key",
        },
      });

      const { partnerApiAuth } = require("../auth");
      partnerApiAuth.authenticate.mockRejectedValue(new Error("Auth service down"));

      const middleware = withPartnerAuth(mockHandler);
      const response = await middleware(request);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.code).toBe("INTERNAL_ERROR");
    });

    it("should handle rate limiter service errors", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer valid-api-key",
        },
      });

      const { partnerApiAuth } = require("../auth");
      partnerApiAuth.authenticate.mockResolvedValue({
        success: true,
        partner: mockPartner,
        apiKey: mockApiKey,
      });

      const { partnerRateLimiter } = require("../rate-limiter");
      partnerRateLimiter.checkLimit.mockRejectedValue(new Error("Rate limiter down"));

      const middleware = withPartnerAuth(mockHandler);
      const response = await middleware(request);

      expect(response.status).toBe(500);
    });

    it("should handle validation service errors", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer valid-api-key",
        },
      });

      const { partnerApiAuth } = require("../auth");
      partnerApiAuth.authenticate.mockResolvedValue({
        success: true,
        partner: mockPartner,
        apiKey: mockApiKey,
      });

      const { partnerRateLimiter } = require("../rate-limiter");
      partnerRateLimiter.checkLimit.mockResolvedValue({
        allowed: true,
        limit: 1000,
        current: 1,
        remaining: 999,
      });

      const { validatePartnerRequest } = require("../validation");
      validatePartnerRequest.mockRejectedValue(new Error("Validation service down"));

      const middleware = withPartnerAuth(mockHandler);
      const response = await middleware(request);

      expect(response.status).toBe(500);
    });
  });

  describe("OPTIONS Handling", () => {
    it("should handle OPTIONS requests for CORS preflight", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        method: "OPTIONS",
      });

      const middleware = withPartnerAuth(mockHandler);
      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });
});
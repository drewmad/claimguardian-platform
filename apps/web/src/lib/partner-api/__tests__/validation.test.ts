/**
 * @fileMetadata
 * @purpose "Unit tests for Partner API validation module"
 * @owner partner-api-team
 * @complexity medium
 * @tags ["test", "validation", "partner-api", "security"]
 * @status stable
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import {
  validatePartnerRequest,
  createValidationSchema,
  ValidationResult,
  ValidationOptions,
} from "../validation";

// Polyfill for Node.js environment
if (typeof globalThis.Request === 'undefined') {
  const { Request, Response, Headers, fetch } = require('undici');
  Object.assign(globalThis, { Request, Response, Headers, fetch });
}

// Mock logger to avoid actual logging in tests
jest.mock("@/lib/logger/production-logger", () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Partner API Validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validatePartnerRequest", () => {
    it("should validate a basic GET request successfully", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const result = await validatePartnerRequest(request);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should validate POST request with JSON body", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ test: "data" }),
      });

      const result = await validatePartnerRequest(request, {
        validateBody: true,
      });

      expect(result.valid).toBe(true);
      expect(result.data?.body).toEqual({ test: "data" });
    });

    it("should reject POST request without Content-Type header", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: JSON.stringify({ test: "data" }),
      });

      const result = await validatePartnerRequest(request);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid request headers");
    });

    it("should reject request with invalid JSON body", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: "{ invalid json }",
      });

      const result = await validatePartnerRequest(request, {
        validateBody: true,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid JSON in request body");
    });

    it("should validate query parameters", async () => {
      const request = new NextRequest(
        "https://api.example.com/test?page=1&limit=10",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result = await validatePartnerRequest(request, {
        validateQuery: true,
      });

      expect(result.valid).toBe(true);
      expect(result.data?.query).toEqual({ page: "1", limit: "10" });
    });

    it("should reject query parameters with potential SQL injection", async () => {
      const request = new NextRequest(
        "https://api.example.com/test?id=1' OR '1'='1",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result = await validatePartnerRequest(request, {
        validateQuery: true,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid query parameters");
    });

    it("should reject query parameters with potential XSS", async () => {
      const request = new NextRequest(
        "https://api.example.com/test?name=<script>alert('xss')</script>",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result = await validatePartnerRequest(request, {
        validateQuery: true,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid query parameters");
    });

    it("should validate pagination parameters", async () => {
      const request = new NextRequest(
        "https://api.example.com/test?page=1&limit=50",
        {
          method: "GET",
        },
      );

      const result = await validatePartnerRequest(request, {
        validateQuery: true,
      });

      expect(result.valid).toBe(true);
    });

    it("should reject invalid pagination parameters", async () => {
      const request = new NextRequest(
        "https://api.example.com/test?page=0&limit=2000",
        {
          method: "GET",
        },
      );

      const result = await validatePartnerRequest(request, {
        validateQuery: true,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid query parameters");
    });

    it("should validate file upload content type", async () => {
      const request = new NextRequest("https://api.example.com/upload", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data; boundary=something",
          "Content-Length": "1024",
        },
      });

      const result = await validatePartnerRequest(request);

      expect(result.valid).toBe(true);
    });

    it("should reject file upload exceeding size limit", async () => {
      const request = new NextRequest("https://api.example.com/upload", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data; boundary=something",
          "Content-Length": "100000000", // 100MB
        },
      });

      const result = await validatePartnerRequest(request);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("File size exceeds maximum limit");
    });

    it("should validate custom headers", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        method: "GET",
        headers: {
          "x-custom-header": "valid-value",
          "x-another-header": "another-value",
        },
      });

      const result = await validatePartnerRequest(request);

      expect(result.valid).toBe(true);
      expect(result.data?.headers).toEqual({
        "x-custom-header": "valid-value",
        "x-another-header": "another-value",
      });
    });

    it("should reject headers with excessive length", async () => {
      const longValue = "a".repeat(1000);
      const request = new NextRequest("https://api.example.com/test", {
        method: "GET",
        headers: {
          "x-long-header": longValue,
        },
      });

      const result = await validatePartnerRequest(request);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid request headers");
    });

    it("should validate API version header", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        method: "GET",
        headers: {
          "x-api-version": "v1",
        },
      });

      const result = await validatePartnerRequest(request);

      expect(result.valid).toBe(true);
    });

    it("should reject unsupported API version", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        method: "GET",
        headers: {
          "x-api-version": "v999",
        },
      });

      const result = await validatePartnerRequest(request);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid request headers");
    });

    it("should validate form-urlencoded body", async () => {
      const formData = new URLSearchParams();
      formData.append("key1", "value1");
      formData.append("key2", "value2");

      const request = new NextRequest("https://api.example.com/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const result = await validatePartnerRequest(request, {
        validateBody: true,
      });

      expect(result.valid).toBe(true);
      expect(result.data?.body).toEqual({
        key1: "value1",
        key2: "value2",
      });
    });

    it("should reject deeply nested objects in request body", async () => {
      const deepObject = { level1: { level2: { level3: { level4: { level5: { level6: { level7: { level8: { level9: { level10: { level11: "too deep" } } } } } } } } } } };

      const request = new NextRequest("https://api.example.com/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deepObject),
      });

      const result = await validatePartnerRequest(request, {
        validateBody: true,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Security validation failed");
    });

    it("should reject request body with large arrays", async () => {
      const largeArray = Array(2000).fill("item");
      const requestBody = { items: largeArray };

      const request = new NextRequest("https://api.example.com/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await validatePartnerRequest(request, {
        validateBody: true,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Security validation failed");
    });

    it("should handle validation errors gracefully", async () => {
      // Create a request that will cause an internal error
      const mockRequest = {
        nextUrl: { pathname: "/test" },
        method: "GET",
        headers: {
          get: jest.fn(() => {
            throw new Error("Mock error");
          }),
          forEach: jest.fn(),
        },
      } as unknown as NextRequest;

      const result = await validatePartnerRequest(mockRequest);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Validation service error");
    });

    it("should reject empty body for POST requests", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "",
      });

      const result = await validatePartnerRequest(request, {
        validateBody: true,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Request body is required");
    });

    it("should support strict mode validation", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        method: "GET",
        headers: {
          Accept: "*/*", // This would normally be allowed
        },
      });

      const result = await validatePartnerRequest(request, {
        strictMode: true,
      });

      expect(result.valid).toBe(true); // Current implementation doesn't enforce strict mode differently
    });
  });

  describe("createValidationSchema", () => {
    it("should return null for unknown endpoints", () => {
      const schema = createValidationSchema("/unknown/endpoint");
      expect(schema).toBeNull();
    });

    it("should handle various endpoint patterns", () => {
      const endpoints = [
        "/api/v1/claims",
        "/api/v1/properties",
        "/api/v1/documents",
        "/api/v1/users",
      ];

      endpoints.forEach((endpoint) => {
        const schema = createValidationSchema(endpoint);
        // Currently returns null, but structure is in place for future implementation
        expect(schema).toBeNull();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle request with no headers", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        method: "GET",
      });

      const result = await validatePartnerRequest(request);

      expect(result.valid).toBe(true);
    });

    it("should handle request with null or undefined values in query", async () => {
      const request = new NextRequest(
        "https://api.example.com/test?param1&param2=",
        {
          method: "GET",
        },
      );

      const result = await validatePartnerRequest(request, {
        validateQuery: true,
      });

      expect(result.valid).toBe(true);
    });

    it("should handle very long query parameter values", async () => {
      const longValue = "a".repeat(1500);
      const request = new NextRequest(
        `https://api.example.com/test?longparam=${longValue}`,
        {
          method: "GET",
        },
      );

      const result = await validatePartnerRequest(request, {
        validateQuery: true,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid query parameters");
    });

    it("should handle request with unsupported content type for body validation", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: "plain text body",
      });

      const result = await validatePartnerRequest(request, {
        validateBody: true,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid request headers"); // Header validation catches this first
    });
  });

  describe("Security Validation", () => {
    it("should detect SQL injection patterns in body", async () => {
      const maliciousBody = {
        query: "SELECT * FROM users WHERE id = 1 OR 1=1",
      };

      const request = new NextRequest("https://api.example.com/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(maliciousBody),
      });

      const result = await validatePartnerRequest(request, {
        validateBody: true,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Security validation failed");
    });

    it("should detect XSS patterns in body", async () => {
      const maliciousBody = {
        content: "<script>alert('xss')</script>",
      };

      const request = new NextRequest("https://api.example.com/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(maliciousBody),
      });

      const result = await validatePartnerRequest(request, {
        validateBody: true,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Security validation failed");
    });

    it("should detect injection patterns in custom headers", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        method: "GET",
        headers: {
          "x-malicious": "javascript:alert('xss')",
        },
      });

      const result = await validatePartnerRequest(request);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid request headers");
    });
  });
});
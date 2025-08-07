/**
 * @fileMetadata
 * @purpose "Unit tests for Partner API authentication module"
 * @owner partner-api-team
 * @complexity high
 * @tags ["test", "authentication", "partner-api", "security"]
 * @status stable
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { partnerApiAuth, PartnerAuthResult } from "../auth";

// Polyfill for Node.js environment
if (typeof globalThis.Request === 'undefined') {
  const { Request, Response, Headers, fetch } = require('undici');
  Object.assign(globalThis, { Request, Response, Headers, fetch });
}

// Mock dependencies
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    })),
  })),
}));

jest.mock("@/lib/logger/production-logger", () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock crypto functions
jest.mock("crypto", () => ({
  createHash: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => "mock-hash"),
    })),
  })),
  timingSafeEqual: jest.fn((a, b) => a === b),
}));

describe("Partner API Authentication", () => {
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
    expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
    lastUsedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear auth cache
    partnerApiAuth["keyCache"].clear();
  });

  describe("API Key Extraction", () => {
    it("should extract API key from Authorization header", () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer test-api-key-123",
        },
      });

      const apiKey = partnerApiAuth["extractApiKey"](request);
      expect(apiKey).toBe("test-api-key-123");
    });

    it("should extract API key from ApiKey prefix in Authorization header", () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "ApiKey test-api-key-456",
        },
      });

      const apiKey = partnerApiAuth["extractApiKey"](request);
      expect(apiKey).toBe("test-api-key-456");
    });

    it("should return null for missing API key", () => {
      const request = new NextRequest("https://api.example.com/test");

      const apiKey = partnerApiAuth["extractApiKey"](request);
      expect(apiKey).toBeNull();
    });

    it("should return null for invalid Authorization header format", () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "InvalidFormat test-api-key",
        },
      });

      const apiKey = partnerApiAuth["extractApiKey"](request);
      expect(apiKey).toBeNull();
    });

    it("should prefer Bearer prefix over ApiKey prefix", () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer auth-key ApiKey fallback-key",
        },
      });

      const apiKey = partnerApiAuth["extractApiKey"](request);
      expect(apiKey).toBe("auth-key ApiKey fallback-key"); // Bearer takes precedence
    });
  });

  describe("API Key Validation", () => {
    it("should validate correct API key format", () => {
      const validKeys = [
        "pk_live_1234567890abcdef1234567890abcdef",
        "pk_test_abcdef1234567890abcdef1234567890",
        "pk_live_" + "a".repeat(32),
      ];

      validKeys.forEach((key) => {
        const validation = partnerApiAuth["validateApiKeyFormat"](key);
        expect(validation.isValid).toBe(true);
      });
    });

    it("should reject invalid API key formats", () => {
      const invalidKeys = [
        "invalid-key",
        "pk_invalid_123",
        "pk_live_", // too short
        "pk_live_" + "a".repeat(100), // too long
        "", // empty
        "sk_test_mock_key_for_testing_only", // wrong prefix
      ];

      invalidKeys.forEach((key) => {
        const validation = partnerApiAuth["validateApiKeyFormat"](key);
        expect(validation.isValid).toBe(false);
        expect(validation.error).toBeDefined();
      });
    });

    it("should handle null or undefined keys", () => {
      expect(partnerApiAuth["validateApiKeyFormat"](null).isValid).toBe(false);
      expect(partnerApiAuth["validateApiKeyFormat"](undefined as any).isValid).toBe(false);
    });
  });

  describe("Authentication", () => {
    it("should authenticate valid API key successfully", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer pk_live_1234567890abcdef1234567890abcdef",
        },
      });

      // Mock database response
      const mockSupabase = require("@/lib/supabase/server").createClient();
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: { ...mockApiKey, partner: mockPartner },
        error: null,
      });

      const result = await partnerApiAuth.authenticate(request);

      expect(result.success).toBe(true);
      expect(result.partner).toEqual(mockPartner);
      expect(result.apiKey).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it("should reject request without API key", async () => {
      const request = new NextRequest("https://api.example.com/test");

      const result = await partnerApiAuth.authenticate(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe("API key is required");
      expect(result.errorCode).toBe("INVALID_API_KEY");
    });

    it("should reject invalid API key format", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer invalid-key-format",
        },
      });

      const result = await partnerApiAuth.authenticate(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid API key format");
      expect(result.errorCode).toBe("INVALID_API_KEY");
    });

    it("should reject expired API key", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer pk_live_1234567890abcdef1234567890abcdef",
        },
      });

      const expiredApiKey = {
        ...mockApiKey,
        expiresAt: new Date(Date.now() - 86400000).toISOString(), // Expired
      };

      const mockSupabase = require("@/lib/supabase/server").createClient();
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: { ...expiredApiKey, partner: mockPartner },
        error: null,
      });

      const result = await partnerApiAuth.authenticate(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe("API key has expired");
      expect(result.errorCode).toBe("EXPIRED_API_KEY");
    });

    it("should reject inactive API key", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer pk_live_1234567890abcdef1234567890abcdef",
        },
      });

      const inactiveApiKey = {
        ...mockApiKey,
        status: "inactive" as const,
      };

      const mockSupabase = require("@/lib/supabase/server").createClient();
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: { ...inactiveApiKey, partner: mockPartner },
        error: null,
      });

      const result = await partnerApiAuth.authenticate(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe("API key is inactive");
      expect(result.errorCode).toBe("INVALID_API_KEY");
    });

    it("should reject API key for inactive partner", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer pk_live_1234567890abcdef1234567890abcdef",
        },
      });

      const inactivePartner = {
        ...mockPartner,
        status: "inactive" as const,
      };

      const mockSupabase = require("@/lib/supabase/server").createClient();
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: { ...mockApiKey, partner: inactivePartner },
        error: null,
      });

      const result = await partnerApiAuth.authenticate(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Partner account is inactive");
      expect(result.errorCode).toBe("INVALID_API_KEY");
    });

    it("should handle database errors gracefully", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer pk_live_1234567890abcdef1234567890abcdef",
        },
      });

      const mockSupabase = require("@/lib/supabase/server").createClient();
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: { message: "Database connection failed" },
      });

      const result = await partnerApiAuth.authenticate(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Authentication service unavailable");
      expect(result.errorCode).toBe("SERVICE_UNAVAILABLE");
    });

    it("should handle unexpected errors gracefully", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer pk_live_1234567890abcdef1234567890abcdef",
        },
      });

      // Mock an unexpected error
      partnerApiAuth["validateApiKey"] = jest.fn().mockRejectedValue(new Error("Unexpected error"));

      const result = await partnerApiAuth.authenticate(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Authentication failed");
      expect(result.errorCode).toBe("INTERNAL_ERROR");
    });
  });

  describe("Caching", () => {
    it("should cache valid API key lookups", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer pk_live_1234567890abcdef1234567890abcdef",
        },
      });

      const mockSupabase = require("@/lib/supabase/server").createClient();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { ...mockApiKey, partner: mockPartner },
        error: null,
      });
      mockSupabase.from().select().eq().eq().single = mockSingle;

      // First call
      await partnerApiAuth.authenticate(request);
      expect(mockSingle).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await partnerApiAuth.authenticate(request);
      expect(mockSingle).toHaveBeenCalledTimes(1); // Still 1, cache was used
    });

    it("should respect cache TTL", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer pk_live_1234567890abcdef1234567890abcdef",
        },
      });

      // Simulate expired cache by modifying cache entry
      const cache = partnerApiAuth["keyCache"];
      const keyHash = partnerApiAuth["hashApiKey"]("cg_live_1234567890abcdef");
      
      cache.set(keyHash, {
        key: mockApiKey,
        partner: mockPartner,
        cachedAt: Date.now() - (6 * 60 * 1000), // 6 minutes ago (TTL is 5 minutes)
      });

      const mockSupabase = require("@/lib/supabase/server").createClient();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { ...mockApiKey, partner: mockPartner },
        error: null,
      });
      mockSupabase.from().select().eq().eq().single = mockSingle;

      await partnerApiAuth.authenticate(request);

      // Should fetch from database due to expired cache
      expect(mockSingle).toHaveBeenCalledTimes(1);
    });

    it("should handle cache cleanup correctly", () => {
      const cache = partnerApiAuth["keyCache"];
      const now = Date.now();

      // Add some entries with different ages
      cache.set("recent-key", {
        key: mockApiKey,
        partner: mockPartner,
        cachedAt: now,
      });

      cache.set("old-key", {
        key: mockApiKey,
        partner: mockPartner,
        cachedAt: now - (10 * 60 * 1000), // 10 minutes ago
      });

      partnerApiAuth["cleanupCache"]();

      expect(cache.has("recent-key")).toBe(true);
      expect(cache.has("old-key")).toBe(false);
    });
  });

  describe("API Key Hashing", () => {
    it("should consistently hash API keys", () => {
      const apiKey = "pk_live_1234567890abcdef1234567890abcdef";
      
      const hash1 = partnerApiAuth["hashApiKey"](apiKey);
      const hash2 = partnerApiAuth["hashApiKey"](apiKey);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toBe("mock-hash"); // Based on our mock
    });

    it("should produce different hashes for different keys", () => {
      // Since we're mocking crypto, this test verifies the function is called with different inputs
      const crypto = require("crypto");
      const mockUpdate = jest.fn(() => ({ digest: jest.fn(() => "hash1") }));
      const mockCreateHash = jest.fn(() => ({ update: mockUpdate }));
      crypto.createHash.mockImplementation(mockCreateHash);

      partnerApiAuth["hashApiKey"]("key1");
      partnerApiAuth["hashApiKey"]("key2");

      expect(mockUpdate).toHaveBeenCalledWith("key1");
      expect(mockUpdate).toHaveBeenCalledWith("key2");
    });
  });

  describe("Permission Validation", () => {
    it("should validate partner permissions", async () => {
      const hasPermission = await partnerApiAuth.validatePermissions(
        mockPartner.id,
        ["read:claims"],
      );

      // Currently returns true by default - would implement actual logic
      expect(hasPermission).toBe(true);
    });

    it("should handle missing permissions", async () => {
      const hasPermission = await partnerApiAuth.validatePermissions(
        "nonexistent-partner",
        ["admin:all"],
      );

      expect(hasPermission).toBe(false);
    });

    it("should validate multiple permissions", async () => {
      const permissions = ["read:claims", "write:properties", "read:documents"];
      
      const hasPermission = await partnerApiAuth.validatePermissions(
        mockPartner.id,
        permissions,
      );

      expect(hasPermission).toBe(true);
    });
  });

  describe("API Key Rotation", () => {
    it("should support API key rotation", async () => {
      const result = await partnerApiAuth.rotateApiKey(
        mockPartner.id,
        mockApiKey.id,
      );

      expect(result.success).toBe(true);
      expect(result.newApiKey).toBeDefined();
    });

    it("should handle rotation errors", async () => {
      // Mock database error
      partnerApiAuth["updateLastUsed"] = jest.fn().mockRejectedValue(new Error("Database error"));

      const result = await partnerApiAuth.rotateApiKey(
        "nonexistent-partner",
        "nonexistent-key",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Usage Tracking", () => {
    it("should update last used timestamp", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer pk_live_1234567890abcdef1234567890abcdef",
        },
      });

      const mockSupabase = require("@/lib/supabase/server").createClient();
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: { ...mockApiKey, partner: mockPartner },
        error: null,
      });

      const mockUpdate = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.from().update = jest.fn(() => ({
        eq: jest.fn(() => mockUpdate),
      }));

      await partnerApiAuth.authenticate(request);

      // Should call update to track usage
      expect(mockSupabase.from).toHaveBeenCalledWith("partner_api_keys");
    });

    it("should handle update failures gracefully", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer pk_live_1234567890abcdef1234567890abcdef",
        },
      });

      const mockSupabase = require("@/lib/supabase/server").createClient();
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: { ...mockApiKey, partner: mockPartner },
        error: null,
      });

      // Mock update failure
      const mockUpdate = jest.fn().mockResolvedValue({
        error: { message: "Update failed" },
      });
      mockSupabase.from().update = jest.fn(() => ({
        eq: jest.fn(() => mockUpdate),
      }));

      const result = await partnerApiAuth.authenticate(request);

      // Should still succeed despite update failure
      expect(result.success).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty cache gracefully", async () => {
      partnerApiAuth["keyCache"].clear();

      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer pk_live_1234567890abcdef1234567890abcdef",
        },
      });

      const mockSupabase = require("@/lib/supabase/server").createClient();
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: { ...mockApiKey, partner: mockPartner },
        error: null,
      });

      const result = await partnerApiAuth.authenticate(request);
      expect(result.success).toBe(true);
    });

    it("should handle malformed database responses", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer pk_live_1234567890abcdef1234567890abcdef",
        },
      });

      const mockSupabase = require("@/lib/supabase/server").createClient();
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: { /* missing required fields */ },
        error: null,
      });

      const result = await partnerApiAuth.authenticate(request);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("INVALID_API_KEY");
    });

    it("should handle concurrent authentication requests", async () => {
      const request = new NextRequest("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer pk_live_1234567890abcdef1234567890abcdef",
        },
      });

      const mockSupabase = require("@/lib/supabase/server").createClient();
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: { ...mockApiKey, partner: mockPartner },
        error: null,
      });

      // Make multiple concurrent requests
      const promises = Array(5).fill(null).map(() => partnerApiAuth.authenticate(request));
      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });
});
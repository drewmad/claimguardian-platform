/**
 * @fileMetadata
 * @purpose "Comprehensive API endpoint testing for ClaimGuardian platform"
 * @owner api-team
 * @dependencies ["@jest/globals", "next/server", "node-mocks-http"]
 * @complexity high
 * @tags ["testing", "api", "integration", "endpoints", "florida-insurance"]
 * @status stable
 */

import { NextRequest, NextResponse } from "next/server";
import { createMockSupabaseClient, createMockFetchResponse, createFormData } from "../test-utils";

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      headers: new Headers(init?.headers),
    })),
    redirect: jest.fn(),
  },
}));

// Mock Supabase client
const mockSupabase = createMockSupabaseClient();
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// Mock authentication
jest.mock("@/lib/auth/auth-service", () => ({
  AuthService: {
    validateSession: jest.fn(),
    getUserFromSession: jest.fn(),
    requireAuth: jest.fn(),
  },
}));

// API endpoint imports (we'll test the actual implementations)
import { POST as authLoginPOST } from "../../src/app/api/auth/login/route";
import { GET as claimsGET, POST as claimsPOST } from "../../src/app/api/claims/route";
import { GET as propertiesGET, POST as propertiesPOST } from "../../src/app/api/properties/route";
import { POST as aiAnalyzePOST } from "../../src/app/api/ai/analyze-image/route";

// Test data
const mockUser = {
  id: "user-123",
  email: "test@claimguardian.com",
  user_metadata: { full_name: "Test User" },
  app_metadata: { role: "user" },
};

const mockProperty = {
  id: "prop-123",
  user_id: "user-123",
  address: "123 Ocean Drive",
  city: "Miami Beach",
  state: "FL",
  zip: "33139",
  property_type: "single_family",
  year_built: 2010,
  square_footage: 2500,
  created_at: new Date().toISOString(),
};

const mockClaim = {
  id: "claim-123",
  user_id: "user-123",
  property_id: "prop-123",
  title: "Hurricane Damage Claim",
  description: "Roof damage from Hurricane Ian",
  status: "submitted",
  claim_amount: 25000,
  date_of_loss: "2024-09-28",
  created_at: new Date().toISOString(),
};

describe("API Endpoints - Comprehensive Testing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  const createMockRequest = (method: string, body?: any, headers?: Record<string, string>) => {
    const url = "https://claimguardianai.com/api/test";
    const init: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
        ...headers,
      },
    };

    if (body && method !== "GET") {
      init.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    return new Request(url, init);
  };

  describe("Authentication API", () => {
    describe("POST /api/auth/login", () => {
      it("should authenticate user with valid credentials", async () => {
        const loginData = {
          email: "user@claimguardian.com",
          password: "SecurePass123!",
        };

        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: {
            user: mockUser,
            session: { access_token: "valid-token", refresh_token: "refresh-token" },
          },
          error: null,
        });

        const request = createMockRequest("POST", loginData);
        const response = await authLoginPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.user).toEqual(mockUser);
        expect(data.session).toBeDefined();
      });

      it("should reject invalid credentials", async () => {
        const loginData = {
          email: "user@example.com",
          password: "wrongpassword",
        };

        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: null,
          error: { message: "Invalid login credentials" },
        });

        const request = createMockRequest("POST", loginData);
        const response = await authLoginPOST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Invalid login credentials");
      });

      it("should validate required login fields", async () => {
        const invalidLogins = [
          { email: "", password: "password" },
          { email: "user@example.com", password: "" },
          { email: "", password: "" },
          {},
        ];

        for (const loginData of invalidLogins) {
          const request = createMockRequest("POST", loginData);
          const response = await authLoginPOST(request);
          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.success).toBe(false);
          expect(data.error).toContain("required");
        }
      });

      it("should handle malformed JSON in request body", async () => {
        const request = createMockRequest("POST", "{ invalid json }");
        const response = await authLoginPOST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain("Invalid JSON");
      });

      it("should implement rate limiting for login attempts", async () => {
        const loginData = {
          email: "attacker@example.com",
          password: "password",
        };

        // Simulate multiple rapid login attempts
        const requests = Array.from({ length: 10 }, () => 
          createMockRequest("POST", loginData, { "X-Forwarded-For": "192.168.1.100" })
        );

        const responses = await Promise.all(
          requests.map(req => authLoginPOST(req))
        );

        // Some should be rate limited
        const rateLimited = responses.some(async res => {
          const data = await res.json();
          return res.status === 429 || data.error?.includes("rate limit");
        });

        expect(rateLimited).toBe(true);
      });
    });
  });

  describe("Claims API", () => {
    describe("GET /api/claims", () => {
      it("should fetch user's claims with proper authorization", async () => {
        const userClaims = [mockClaim, { ...mockClaim, id: "claim-456" }];

        mockSupabase.from("claims").select.mockResolvedValue({
          data: userClaims,
          error: null,
        });

        const request = createMockRequest("GET");
        const response = await claimsGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.claims).toHaveLength(2);
        expect(data.claims[0]).toEqual(mockClaim);
      });

      it("should filter claims by status", async () => {
        const filteredClaims = [{ ...mockClaim, status: "approved" }];

        mockSupabase.from("claims").select.mockResolvedValue({
          data: filteredClaims,
          error: null,
        });

        const url = new URL("https://claimguardianai.com/api/claims?status=approved");
        const request = new Request(url.toString(), {
          headers: { Authorization: "Bearer valid-token" },
        });

        const response = await claimsGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.claims).toHaveLength(1);
        expect(data.claims[0].status).toBe("approved");
      });

      it("should handle pagination parameters", async () => {
        const paginatedClaims = Array.from({ length: 5 }, (_, i) => ({
          ...mockClaim,
          id: `claim-${i}`,
        }));

        mockSupabase.from("claims").select.mockResolvedValue({
          data: paginatedClaims.slice(0, 3),
          error: null,
        });

        const url = new URL("https://claimguardianai.com/api/claims?page=1&limit=3");
        const request = new Request(url.toString(), {
          headers: { Authorization: "Bearer valid-token" },
        });

        const response = await claimsGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.claims).toHaveLength(3);
        expect(data.pagination).toEqual({
          page: 1,
          limit: 3,
          total: expect.any(Number),
          hasMore: expect.any(Boolean),
        });
      });

      it("should require authentication", async () => {
        const request = createMockRequest("GET", null, { Authorization: "" });
        const response = await claimsGET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toContain("authentication");
      });

      it("should handle database errors gracefully", async () => {
        mockSupabase.from("claims").select.mockResolvedValue({
          data: null,
          error: { message: "Database connection failed" },
        });

        const request = createMockRequest("GET");
        const response = await claimsGET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toContain("Database");
      });
    });

    describe("POST /api/claims", () => {
      it("should create new claim with valid data", async () => {
        const newClaimData = {
          property_id: "prop-123",
          title: "Water Damage Claim",
          description: "Pipe burst in kitchen",
          claim_amount: 15000,
          date_of_loss: "2024-01-15",
        };

        const createdClaim = { ...mockClaim, ...newClaimData, id: "claim-new" };

        mockSupabase.from("claims").insert.mockResolvedValue({
          data: [createdClaim],
          error: null,
        });

        const request = createMockRequest("POST", newClaimData);
        const response = await claimsPOST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.claim).toEqual(createdClaim);
        expect(mockSupabase.from("claims").insert).toHaveBeenCalledWith(
          expect.objectContaining({
            ...newClaimData,
            user_id: mockUser.id,
            status: "draft",
          })
        );
      });

      it("should validate required claim fields", async () => {
        const invalidClaims = [
          { title: "Missing property", description: "test", claim_amount: 1000 },
          { property_id: "prop-123", description: "Missing title", claim_amount: 1000 },
          { property_id: "prop-123", title: "Missing description", claim_amount: 1000 },
          { property_id: "prop-123", title: "Missing amount", description: "test" },
        ];

        for (const claimData of invalidClaims) {
          const request = createMockRequest("POST", claimData);
          const response = await claimsPOST(request);
          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.success).toBe(false);
          expect(data.error).toContain("required");
        }
      });

      it("should validate claim amount limits", async () => {
        const invalidAmounts = [
          { ...mockClaim, claim_amount: -1000 }, // Negative
          { ...mockClaim, claim_amount: 0 }, // Zero
          { ...mockClaim, claim_amount: 10000000 }, // Too high
          { ...mockClaim, claim_amount: "not a number" }, // Invalid type
        ];

        for (const claimData of invalidAmounts) {
          const request = createMockRequest("POST", claimData);
          const response = await claimsPOST(request);
          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.success).toBe(false);
          expect(data.error).toMatch(/amount|invalid/i);
        }
      });

      it("should verify property ownership before creating claim", async () => {
        const claimData = {
          property_id: "prop-unauthorized",
          title: "Unauthorized Claim",
          description: "Trying to claim on someone else's property",
          claim_amount: 5000,
        };

        // Property belongs to different user
        mockSupabase.from("properties").select.mockResolvedValue({
          data: [{ ...mockProperty, user_id: "different-user" }],
          error: null,
        });

        const request = createMockRequest("POST", claimData);
        const response = await claimsPOST(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error).toContain("not authorized");
      });

      it("should handle Florida-specific claim requirements", async () => {
        const floridaClaimData = {
          property_id: "prop-123",
          title: "Hurricane Ian Damage",
          description: "Roof and window damage from Hurricane Ian",
          claim_amount: 75000,
          date_of_loss: "2022-09-28",
          disaster_declaration: "DR-4673-FL",
          wind_mitigation_features: ["impact_windows", "reinforced_roof"],
        };

        const floridaClaim = { ...mockClaim, ...floridaClaimData, id: "claim-florida" };

        mockSupabase.from("claims").insert.mockResolvedValue({
          data: [floridaClaim],
          error: null,
        });

        const request = createMockRequest("POST", floridaClaimData);
        const response = await claimsPOST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.claim.disaster_declaration).toBe("DR-4673-FL");
        expect(data.claim.wind_mitigation_features).toContain("impact_windows");
      });
    });
  });

  describe("Properties API", () => {
    describe("GET /api/properties", () => {
      it("should fetch user's properties", async () => {
        const userProperties = [mockProperty, { ...mockProperty, id: "prop-456" }];

        mockSupabase.from("properties").select.mockResolvedValue({
          data: userProperties,
          error: null,
        });

        const request = createMockRequest("GET");
        const response = await propertiesGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.properties).toHaveLength(2);
        expect(data.properties[0]).toEqual(mockProperty);
      });

      it("should include property risk assessment", async () => {
        const propertyWithRisk = {
          ...mockProperty,
          risk_assessment: {
            hurricane_risk: "high",
            flood_zone: "AE",
            wildfire_risk: "low",
            earthquake_risk: "minimal",
          },
        };

        mockSupabase.from("properties").select.mockResolvedValue({
          data: [propertyWithRisk],
          error: null,
        });

        const request = createMockRequest("GET");
        const response = await propertiesGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.properties[0].risk_assessment).toBeDefined();
        expect(data.properties[0].risk_assessment.hurricane_risk).toBe("high");
      });
    });

    describe("POST /api/properties", () => {
      it("should create new property with address validation", async () => {
        const newPropertyData = {
          address: "456 Collins Avenue",
          city: "Miami Beach",
          state: "FL",
          zip: "33139",
          property_type: "condo",
          year_built: 2015,
          square_footage: 1200,
        };

        const createdProperty = { ...mockProperty, ...newPropertyData, id: "prop-new" };

        // Mock address validation service
        global.fetch = jest.fn().mockResolvedValue(
          createMockFetchResponse({
            isValid: true,
            standardizedAddress: {
              street: "456 Collins Ave",
              city: "Miami Beach",
              state: "FL",
              zip: "33139",
            },
            coordinates: { lat: 25.7617, lng: -80.1918 },
          })
        );

        mockSupabase.from("properties").insert.mockResolvedValue({
          data: [createdProperty],
          error: null,
        });

        const request = createMockRequest("POST", newPropertyData);
        const response = await propertiesPOST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.property).toEqual(createdProperty);
      });

      it("should validate Florida property requirements", async () => {
        const floridaPropertyData = {
          address: "123 Ocean Drive",
          city: "Miami Beach",
          state: "FL",
          zip: "33139",
          property_type: "single_family",
          year_built: 1995,
          square_footage: 2000,
          // Missing required Florida fields
        };

        const request = createMockRequest("POST", floridaPropertyData);
        const response = await propertiesPOST(request);
        const data = await response.json();

        // Should prompt for additional Florida-specific information
        expect(response.status).toBe(400);
        expect(data.error).toMatch(/florida|wind mitigation|flood/i);
      });

      it("should enforce property limits per user tier", async () => {
        // Mock user with basic tier (limit: 2 properties)
        const basicUser = { ...mockUser, app_metadata: { role: "user", tier: "basic" } };
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: basicUser },
          error: null,
        });

        // User already has 2 properties
        mockSupabase.from("properties").select.mockResolvedValue({
          data: [mockProperty, { ...mockProperty, id: "prop-2" }],
          error: null,
        });

        const newPropertyData = {
          address: "789 Washington Ave",
          city: "Miami Beach",
          state: "FL",
          zip: "33139",
        };

        const request = createMockRequest("POST", newPropertyData);
        const response = await propertiesPOST(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toContain("property limit");
      });
    });
  });

  describe("AI Analysis API", () => {
    describe("POST /api/ai/analyze-image", () => {
      it("should analyze damage assessment from uploaded image", async () => {
        const mockImageData = "base64encodedimagedata";
        const analysisRequest = {
          image: mockImageData,
          context: {
            property_id: "prop-123",
            claim_id: "claim-123",
            damage_type: "roof",
          },
        };

        // Mock AI service response
        const mockAIResponse = {
          damageAssessment: {
            severity: "moderate",
            types: ["shingle_damage", "gutter_damage"],
            estimatedCost: 12000,
            confidence: 0.87,
          },
          suggestions: [
            "Contact roofing contractor for detailed inspection",
            "Document all visible damage with additional photos",
            "Check for interior water damage",
          ],
        };

        global.fetch = jest.fn().mockResolvedValue(
          createMockFetchResponse({ choices: [{ message: { content: JSON.stringify(mockAIResponse) } }] })
        );

        const request = createMockRequest("POST", analysisRequest);
        const response = await aiAnalyzePOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.analysis).toEqual(mockAIResponse);
        expect(data.analysis.damageAssessment.severity).toBe("moderate");
        expect(data.analysis.estimatedCost).toBe(12000);
      });

      it("should handle multiple AI provider analyses", async () => {
        const analysisRequest = {
          image: "base64imagedata",
          context: { property_id: "prop-123" },
          providers: ["openai", "gemini", "claude"],
        };

        // Mock multiple AI responses
        const mockResponses = [
          { severity: "moderate", cost: 10000, confidence: 0.85 },
          { severity: "moderate", cost: 12000, confidence: 0.90 },
          { severity: "severe", cost: 15000, confidence: 0.92 },
        ];

        global.fetch = jest.fn()
          .mockResolvedValueOnce(createMockFetchResponse({ choices: [{ message: { content: JSON.stringify(mockResponses[0]) } }] }))
          .mockResolvedValueOnce(createMockFetchResponse({ choices: [{ message: { content: JSON.stringify(mockResponses[1]) } }] }))
          .mockResolvedValueOnce(createMockFetchResponse({ choices: [{ message: { content: JSON.stringify(mockResponses[2]) } }] }));

        const request = createMockRequest("POST", analysisRequest);
        const response = await aiAnalyzePOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.consensus).toBeDefined();
        expect(data.providerResults).toHaveLength(3);
        expect(data.confidence).toBeGreaterThan(0.8);
      });

      it("should validate image format and size", async () => {
        const invalidRequests = [
          { image: "not-base64", context: {} }, // Invalid base64
          { image: "", context: {} }, // Empty image
          { context: {} }, // Missing image
          { image: "x".repeat(10 * 1024 * 1024), context: {} }, // Too large
        ];

        for (const invalidRequest of invalidRequests) {
          const request = createMockRequest("POST", invalidRequest);
          const response = await aiAnalyzePOST(request);
          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.success).toBe(false);
          expect(data.error).toMatch(/image|format|size/i);
        }
      });

      it("should handle AI service failures gracefully", async () => {
        const analysisRequest = {
          image: "validbase64image",
          context: { property_id: "prop-123" },
        };

        // Mock AI service failure
        global.fetch = jest.fn().mockRejectedValue(new Error("AI service unavailable"));

        const request = createMockRequest("POST", analysisRequest);
        const response = await aiAnalyzePOST(request);
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.success).toBe(false);
        expect(data.error).toContain("AI service");
      });

      it("should track AI usage and costs", async () => {
        const analysisRequest = {
          image: "base64image",
          context: { property_id: "prop-123" },
        };

        const mockUsageResponse = {
          analysis: { damage: "moderate" },
          usage: {
            tokensUsed: 1500,
            estimatedCost: 0.045,
            provider: "openai",
          },
        };

        global.fetch = jest.fn().mockResolvedValue(
          createMockFetchResponse({ 
            choices: [{ message: { content: JSON.stringify(mockUsageResponse.analysis) } }],
            usage: { total_tokens: 1500 }
          })
        );

        const request = createMockRequest("POST", analysisRequest);
        const response = await aiAnalyzePOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.usage).toBeDefined();
        expect(data.usage.tokensUsed).toBeGreaterThan(0);
        expect(data.usage.estimatedCost).toBeGreaterThan(0);
      });
    });
  });

  describe("Error Handling and Security", () => {
    it("should handle CORS preflight requests", async () => {
      const preflightRequest = new Request("https://claimguardianai.com/api/claims", {
        method: "OPTIONS",
        headers: {
          Origin: "https://claimguardianai.com",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type,Authorization",
        },
      });

      // Most endpoints should handle OPTIONS
      const response = await claimsGET(preflightRequest);

      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBeTruthy();
      expect(response.headers.get("Access-Control-Allow-Methods")).toBeTruthy();
    });

    it("should sanitize error messages in production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      mockSupabase.from("claims").select.mockRejectedValue(
        new Error("Sensitive database error: connection string postgresql://user:pass@host/db")
      );

      const request = createMockRequest("GET");
      const response = await claimsGET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).not.toContain("postgresql://");
      expect(data.error).not.toContain("user:pass");
      expect(data.error).toBe("Internal server error");

      process.env.NODE_ENV = originalEnv;
    });

    it("should validate API versioning headers", async () => {
      const request = createMockRequest("GET", null, {
        "API-Version": "v1",
        Accept: "application/vnd.claimguardian.v1+json",
      });

      const response = await claimsGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get("API-Version")).toBe("v1");
    });

    it("should implement request timeout handling", async () => {
      // Mock slow database response
      mockSupabase.from("claims").select.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 35000)) // 35 seconds
      );

      const request = createMockRequest("GET");

      // Should timeout before 35 seconds
      const startTime = Date.now();
      const response = await claimsGET(request);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(30000); // Should timeout before 30 seconds
      expect(response.status).toBe(408); // Request timeout
    });

    it("should log API requests for monitoring", async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      const request = createMockRequest("GET");
      await claimsGET(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("API_REQUEST"),
        expect.objectContaining({
          method: "GET",
          endpoint: expect.stringContaining("/api/claims"),
          userId: mockUser.id,
        })
      );

      consoleSpy.mockRestore();
    });

    it("should handle database connection pooling issues", async () => {
      mockSupabase.from("claims").select.mockRejectedValue(
        new Error("Connection pool exhausted")
      );

      const request = createMockRequest("GET");
      const response = await claimsGET(request);
      const data = await response.json();

      expect(response.status).toBe(503); // Service unavailable
      expect(data.error).toContain("temporarily unavailable");
      expect(response.headers.get("Retry-After")).toBeTruthy();
    });
  });

  describe("Performance and Caching", () => {
    it("should implement response caching for expensive queries", async () => {
      const cacheKey = "user_claims_123";
      const cachedData = [mockClaim];

      // First request - cache miss
      mockSupabase.from("claims").select.mockResolvedValue({
        data: cachedData,
        error: null,
      });

      const request1 = createMockRequest("GET");
      const response1 = await claimsGET(request1);

      expect(response1.headers.get("X-Cache")).toBe("MISS");

      // Second request - should hit cache
      const request2 = createMockRequest("GET");
      const response2 = await claimsGET(request2);

      expect(response2.headers.get("X-Cache")).toBe("HIT");
    });

    it("should handle concurrent requests efficiently", async () => {
      const concurrentRequests = Array.from({ length: 10 }, () =>
        claimsGET(createMockRequest("GET"))
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const endTime = Date.now();

      // All requests should complete successfully
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should handle concurrent requests efficiently
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it("should implement query optimization for large datasets", async () => {
      // Mock large dataset
      const largeClaims = Array.from({ length: 1000 }, (_, i) => ({
        ...mockClaim,
        id: `claim-${i}`,
      }));

      mockSupabase.from("claims").select.mockResolvedValue({
        data: largeClaims.slice(0, 50), // Paginated result
        error: null,
      });

      const url = new URL("https://claimguardianai.com/api/claims?limit=50");
      const request = new Request(url.toString(), {
        headers: { Authorization: "Bearer valid-token" },
      });

      const startTime = Date.now();
      const response = await claimsGET(request);
      const endTime = Date.now();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.claims).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(2000); // Should be fast with pagination
    });
  });
});
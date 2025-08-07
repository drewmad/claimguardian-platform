/**
 * @fileMetadata
 * @purpose "Critical feature tests for core ClaimGuardian functionality"
 * @dependencies ["@testing-library/jest-dom"]
 * @owner platform-team
 * @complexity high
 * @tags ["testing", "critical", "integration"]
 * @status stable
 */

import { z } from "zod";
import { validatePartnerRequest, createValidationSchema } from "@/lib/partner-api/validation";

// Mock NextRequest since it requires Node.js environment
const mockNextRequest = (url: string, options: any = {}) => ({
  nextUrl: new URL(url),
  method: options.method || "GET",
  headers: new Map(Object.entries(options.headers || {})),
  json: async () => JSON.parse(options.body || "{}"),
  text: async () => options.body || "",
  formData: async () => new FormData(),
});

// Mock logger to prevent test output noise
jest.mock("@/lib/logger/production-logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("Critical ClaimGuardian Features", () => {
  describe("Input Validation Security", () => {
    test("should block SQL injection attempts", async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      const request = mockNextRequest("https://test.com/api/test", {
        method: "POST",
        body: JSON.stringify({ query: maliciousInput }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await validatePartnerRequest(request as any, {
        validateBody: true,
        validateQuery: true,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("validation failed");
    });

    test("should block XSS attempts", async () => {
      const xssInput = "<script>alert('xss')</script>";
      const request = mockNextRequest(`https://test.com/api/test?search=${encodeURIComponent(xssInput)}`);

      const result = await validatePartnerRequest(request as any, {
        validateQuery: true,
      });

      expect(result.valid).toBe(false);
      expect(result.details?.errors).toContain("Potential XSS detected in parameter: search");
    });

    test("should validate file upload sizes", async () => {
      const request = mockNextRequest("https://test.com/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
          "Content-Length": "52428800", // 50MB + 1
        },
      });

      const result = await validatePartnerRequest(request as any, {
        validateBody: true,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("File size exceeds maximum limit");
    });
  });

  describe("Zod Schema Validation", () => {
    test("should validate claim creation schema", () => {
      const schema = createValidationSchema("/api/claims");
      expect(schema).toBeTruthy();
      expect(schema.body).toBeDefined();

      // Valid claim data
      const validClaim = {
        property_id: "123e4567-e89b-12d3-a456-426614174000",
        claim_number: "CG-2024-0001",
        incident_date: "2024-01-15T10:30:00.000Z",
        description: "Hurricane damage to roof and windows causing water infiltration",
        estimated_damage_cost: 15000,
        claim_type: "hurricane" as const,
        status: "draft" as const,
        priority: "high" as const,
      };

      const result = schema.body.safeParse(validClaim);
      expect(result.success).toBe(true);
    });

    test("should reject invalid claim data", () => {
      const schema = createValidationSchema("/api/claims");
      
      // Invalid claim data
      const invalidClaim = {
        property_id: "invalid-uuid",
        claim_number: "", // Required field empty
        incident_date: "invalid-date",
        description: "Too short", // Less than 10 characters
        estimated_damage_cost: -100, // Negative value
        claim_type: "invalid_type",
        status: "invalid_status",
      };

      const result = schema.body.safeParse(invalidClaim);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.issues.map(i => i.message);
        expect(errors).toContain("Invalid property ID format");
        expect(errors).toContain("Claim number is required");
        expect(errors).toContain("Description must be at least 10 characters");
        expect(errors).toContain("Estimated cost must be positive");
      }
    });

    test("should validate property address schema", () => {
      const schema = createValidationSchema("/api/properties");
      
      const validProperty = {
        address: {
          street: "123 Hurricane Ave",
          city: "Miami",
          state: "FL",
          zip: "33101",
          county: "Miami-Dade"
        },
        property_type: "single_family" as const,
        year_built: 2010,
        square_footage: 2500,
        value: 450000,
        flood_zone: "AE",
        hurricane_deductible: 5000
      };

      const result = schema.body.safeParse(validProperty);
      expect(result.success).toBe(true);
    });

    test("should validate authentication schema", () => {
      const schema = createValidationSchema("/api/auth/login");
      
      const validAuth = {
        email: "test@claimguardian.com",
        password: "SecurePass123!",
        remember_me: true
      };

      const result = schema.body.safeParse(validAuth);
      expect(result.success).toBe(true);
    });
  });

  describe("Florida-Specific Business Logic", () => {
    test("should handle Florida ZIP codes correctly", () => {
      const schema = createValidationSchema("/api/properties");
      
      // Florida ZIP codes
      const floridaZips = ["33101", "32801", "33548-1234"];
      
      floridaZips.forEach(zip => {
        const property = {
          address: {
            street: "123 Test St",
            city: "Orlando",
            state: "FL",
            zip: zip
          },
          property_type: "single_family" as const,
          year_built: 2000,
          square_footage: 2000,
          value: 300000
        };

        const result = schema.body.safeParse(property);
        expect(result.success).toBe(true);
      });
    });

    test("should validate hurricane-related claim types", () => {
      const schema = createValidationSchema("/api/claims");
      
      const hurricaneTypes = ["hurricane", "flood", "property_damage"];
      
      hurricaneTypes.forEach(type => {
        const claim = {
          property_id: "123e4567-e89b-12d3-a456-426614174000",
          claim_number: "CG-2024-001",
          incident_date: "2024-01-15T10:30:00.000Z",
          description: "Storm damage from Hurricane Ian affecting roof structure",
          estimated_damage_cost: 25000,
          claim_type: type
        };

        const result = schema.body.safeParse(claim);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("AI Analysis Data Structures", () => {
    test("should validate AI analysis request", () => {
      const schema = createValidationSchema("/api/ai/analyze-image");
      
      const validRequest = {
        image_data: "data:image/jpeg;base64," + "x".repeat(1000), // Mock base64 data
        analysis_type: "damage_assessment" as const,
        context: {
          property_id: "123e4567-e89b-12d3-a456-426614174000",
          claim_id: "987fcdeb-51a2-43d7-8f9e-123456789abc",
          location: "Living room, north wall"
        }
      };

      const result = schema.body.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    test("should require minimum image data", () => {
      const schema = createValidationSchema("/api/ai/analyze-image");
      
      const invalidRequest = {
        image_data: "short", // Too short
        analysis_type: "damage_assessment" as const
      };

      const result = schema.body.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe("Security Patterns", () => {
    test("should detect multiple injection patterns", async () => {
      const injectionPatterns = [
        "1=1 OR 1=1",
        "UNION SELECT * FROM users",
        "<iframe src=\"javascript:alert(1)\"></iframe>",
        "javascript:void(0)",
        "eval(String.fromCharCode(97,108,101,114,116,40,49,41))"
      ];

      for (const pattern of injectionPatterns) {
        const request = mockNextRequest("https://test.com/api/test", {
          method: "POST", 
          body: JSON.stringify({ data: pattern }),
          headers: { "Content-Type": "application/json" }
        });

        const result = await validatePartnerRequest(request as any, {
          validateBody: true
        });

        expect(result.valid).toBe(false);
      }
    });

    test("should validate request depth limits", async () => {
      // Create deeply nested object (over 10 levels)
      let deepObject: any = { value: "test" };
      for (let i = 0; i < 15; i++) {
        deepObject = { nested: deepObject };
      }

      const request = mockNextRequest("https://test.com/api/test", {
        method: "POST",
        body: JSON.stringify(deepObject),
        headers: { "Content-Type": "application/json" }
      });

      const result = await validatePartnerRequest(request as any, {
        validateBody: true
      });

      expect(result.valid).toBe(false);
      expect(result.details?.errors).toContain("Request body too deeply nested");
    });

    test("should validate array size limits", async () => {
      const largeArray = new Array(1001).fill("item"); // Over 1000 items
      
      const request = mockNextRequest("https://test.com/api/test", {
        method: "POST",
        body: JSON.stringify({ items: largeArray }),
        headers: { "Content-Type": "application/json" }
      });

      const result = await validatePartnerRequest(request as any, {
        validateBody: true
      });

      expect(result.valid).toBe(false);
      expect(result.details?.errors).toContain("Request body contains arrays that are too large");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    test("should handle malformed JSON gracefully", async () => {
      const request = mockNextRequest("https://test.com/api/test", {
        method: "POST",
        body: '{"invalid": json}', // Malformed JSON
        headers: { "Content-Type": "application/json" },
        json: async () => { throw new SyntaxError("Unexpected token j in JSON"); }
      });

      const result = await validatePartnerRequest(request as any, {
        validateBody: true
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid JSON");
    });

    test("should handle empty request body", async () => {
      const request = mockNextRequest("https://test.com/api/test", {
        method: "POST",
        body: "",
        headers: { "Content-Type": "application/json" }
      });

      const result = await validatePartnerRequest(request as any, {
        validateBody: true
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Request body is required");
    });

    test("should validate pagination parameters", async () => {
      const request = mockNextRequest("https://test.com/api/test?page=999999&limit=999999");

      const result = await validatePartnerRequest(request as any, {
        validateQuery: true
      });

      expect(result.valid).toBe(false);
      expect(result.details?.errors).toContain("Invalid page number");
    });
  });
});
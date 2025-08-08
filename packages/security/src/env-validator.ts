/**
 * @fileMetadata
 * @purpose "Secure environment variable validation and management system"
 * @owner security-team
 * @dependencies ["zod", "@t3-oss/env-nextjs"]
 * @exports ["validateEnvironment", "getSecureEnv", "EnvironmentConfig"]
 * @complexity high
 * @tags ["security", "environment", "validation"]
 * @status production-ready
 */

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Security levels for environment variables
 */
export enum EnvSecurityLevel {
  PUBLIC = "public",         // Can be exposed to client
  INTERNAL = "internal",     // Server-side only, low sensitivity
  SENSITIVE = "sensitive",   // Server-side only, medium sensitivity  
  SECRET = "secret",         // Server-side only, high sensitivity (API keys, tokens)
  CRITICAL = "critical"      // Server-side only, critical security (encryption keys)
}

/**
 * Environment variable metadata for security tracking
 */
interface EnvVarMetadata {
  name: string;
  securityLevel: EnvSecurityLevel;
  required: boolean;
  description: string;
  rotationDays?: number;
  restrictedDomains?: string[];
  validationPattern?: RegExp;
  exampleValue?: string;
}

/**
 * Registry of all environment variables with their security metadata
 */
const ENV_REGISTRY: EnvVarMetadata[] = [
  // ============ SUPABASE CORE ============
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    securityLevel: EnvSecurityLevel.PUBLIC,
    required: true,
    description: "Supabase project URL",
    validationPattern: /^https:\/\/[a-z0-9]+\.supabase\.co$/,
    exampleValue: "https://xxxxxx.supabase.co"
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", 
    securityLevel: EnvSecurityLevel.PUBLIC,
    required: true,
    description: "Supabase anonymous/public key",
    validationPattern: /^eyJ[A-Za-z0-9_-]{40,}$/,
    exampleValue: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    securityLevel: EnvSecurityLevel.SECRET,
    required: true,
    description: "Supabase service role key for server-side operations",
    rotationDays: 90,
    validationPattern: /^eyJ[A-Za-z0-9_-]{40,}$/
  },
  {
    name: "SUPABASE_JWT_SECRET",
    securityLevel: EnvSecurityLevel.CRITICAL,
    required: true,
    description: "Supabase JWT signing secret",
    rotationDays: 30
  },

  // ============ AI SERVICES ============
  {
    name: "OPENAI_API_KEY",
    securityLevel: EnvSecurityLevel.SECRET,
    required: true,
    description: "OpenAI API key for AI features",
    rotationDays: 30,
    validationPattern: /^sk-[a-zA-Z0-9]{48,}$/
  },
  {
    name: "GEMINI_API_KEY", 
    securityLevel: EnvSecurityLevel.SECRET,
    required: true,
    description: "Google Gemini API key for AI features",
    rotationDays: 30,
    validationPattern: /^[A-Za-z0-9_-]{39}$/
  },

  // ============ EXTERNAL APIs ============
  {
    name: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    securityLevel: EnvSecurityLevel.PUBLIC,
    required: false,
    description: "Google Maps API key for address verification",
    rotationDays: 180,
    restrictedDomains: ["claimguardianai.com", "*.vercel.app", "localhost:3000"],
    validationPattern: /^[A-Za-z0-9_-]{39}$/
  },
  {
    name: "RESEND_API_KEY",
    securityLevel: EnvSecurityLevel.SECRET,
    required: true,
    description: "Resend email service API key",
    rotationDays: 90,
    validationPattern: /^re_[a-zA-Z0-9]{24,}$/
  },

  // ============ MONITORING & SECURITY ============
  {
    name: "SENTRY_AUTH_TOKEN",
    securityLevel: EnvSecurityLevel.SECRET,
    required: false,
    description: "Sentry authentication token for error tracking",
    rotationDays: 90
  },
  {
    name: "NEXT_PUBLIC_SENTRY_DSN",
    securityLevel: EnvSecurityLevel.PUBLIC,
    required: false,
    description: "Sentry DSN for error reporting"
  },

  // ============ SECURITY CONFIGURATION ============
  {
    name: "SESSION_SECRET",
    securityLevel: EnvSecurityLevel.CRITICAL,
    required: true,
    description: "Session signing secret",
    rotationDays: 30,
    validationPattern: /^[A-Za-z0-9+/]{32,}={0,2}$/
  },
  {
    name: "ENCRYPTION_KEY",
    securityLevel: EnvSecurityLevel.CRITICAL,
    required: true,
    description: "Primary encryption key for sensitive data",
    rotationDays: 90,
    validationPattern: /^[A-Za-z0-9+/]{44}$/
  },
  {
    name: "ENCRYPTION_KEY_PREVIOUS",
    securityLevel: EnvSecurityLevel.CRITICAL,
    required: false,
    description: "Previous encryption key for rotation support",
    rotationDays: 90
  }
];

/**
 * Create validated environment configuration using t3-env
 */
export const env = createEnv({
  // ============ SERVER-SIDE VARIABLES ============
  server: {
    // Supabase
    SUPABASE_SERVICE_ROLE_KEY: z.string().regex(/^eyJ[A-Za-z0-9_-]{40,}$/, "Invalid Supabase service role key format"),
    SUPABASE_JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
    
    // AI Services
    OPENAI_API_KEY: z.string().regex(/^sk-[a-zA-Z0-9]{48,}$/, "Invalid OpenAI API key format"),
    GEMINI_API_KEY: z.string().regex(/^[A-Za-z0-9_-]{39}$/, "Invalid Gemini API key format"),
    
    // Email
    RESEND_API_KEY: z.string().regex(/^re_[a-zA-Z0-9]{24,}$/, "Invalid Resend API key format"),
    RESEND_FROM_EMAIL: z.string().email("Invalid from email address"),
    
    // Security
    SESSION_SECRET: z.string().regex(/^[A-Za-z0-9+/]{32,}={0,2}$/, "Invalid session secret format"),
    ENCRYPTION_KEY: z.string().regex(/^[A-Za-z0-9+/]{44}$/, "Invalid encryption key format"),
    ENCRYPTION_KEY_PREVIOUS: z.string().regex(/^[A-Za-z0-9+/]{44}$/, "Invalid previous encryption key format").optional(),
    
    // Monitoring
    SENTRY_AUTH_TOKEN: z.string().optional(),
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),
    
    // Configuration
    DATABASE_POOL_MIN: z.coerce.number().min(1).max(20).default(2),
    DATABASE_POOL_MAX: z.coerce.number().min(5).max(100).default(10),
    DATABASE_STATEMENT_TIMEOUT: z.coerce.number().min(1000).max(300000).default(30000),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().min(1000).max(3600000).default(60000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().min(1).max(1000).default(30),
    SESSION_MAX_AGE: z.coerce.number().min(300).max(86400).default(3600),
    
    // Node environment
    NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  },

  // ============ CLIENT-SIDE VARIABLES ============
  client: {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL").regex(
      /^https:\/\/[a-z0-9]+\.supabase\.co$/,
      "Must be a valid Supabase URL"
    ),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().regex(
      /^eyJ[A-Za-z0-9_-]{40,}$/,
      "Invalid Supabase anon key format"
    ),
    
    // External APIs
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().regex(
      /^[A-Za-z0-9_-]{39}$/,
      "Invalid Google Maps API key format"
    ).optional(),
    
    // Monitoring
    NEXT_PUBLIC_SENTRY_DSN: z.string().url("Invalid Sentry DSN").optional(),
    
    // Feature flags
    NEXT_PUBLIC_DEBUG_MODE: z.enum(["true", "false"]).default("false"),
    NEXT_PUBLIC_ENABLE_ANALYTICS: z.enum(["true", "false"]).default("true"),
    
    // Site configuration
    NEXT_PUBLIC_SITE_URL: z.string().url("Invalid site URL").default("https://claimguardianai.com"),
    NEXT_PUBLIC_APP_NAME: z.string().default("ClaimGuardian"),
    NEXT_PUBLIC_APP_VERSION: z.string().default("1.0.0"),
  },

  // ============ ENVIRONMENT VARIABLE MAPPING ============
  runtimeEnv: {
    // Server
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    ENCRYPTION_KEY_PREVIOUS: process.env.ENCRYPTION_KEY_PREVIOUS,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    DATABASE_POOL_MIN: process.env.DATABASE_POOL_MIN,
    DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX,
    DATABASE_STATEMENT_TIMEOUT: process.env.DATABASE_STATEMENT_TIMEOUT,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
    SESSION_MAX_AGE: process.env.SESSION_MAX_AGE,
    NODE_ENV: process.env.NODE_ENV,

    // Client
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  },

  // Skip validation during build
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  // Empty string means the variable is required but not provided
  emptyStringAsUndefined: true,
});

/**
 * Security utilities for environment variable management
 */
export class EnvSecurityManager {
  /**
   * Get environment variable metadata by name
   */
  static getMetadata(name: string): EnvVarMetadata | undefined {
    return ENV_REGISTRY.find(env => env.name === name);
  }

  /**
   * Check if an environment variable is properly configured
   */
  static isSecurelyConfigured(name: string, value?: string): boolean {
    const metadata = this.getMetadata(name);
    if (!metadata) return false;

    // Check if required variable is present
    if (metadata.required && !value) {
      return false;
    }

    // Validate format if pattern is specified
    if (value && metadata.validationPattern) {
      return metadata.validationPattern.test(value);
    }

    return true;
  }

  /**
   * Get all environment variables by security level
   */
  static getBySecurityLevel(level: EnvSecurityLevel): EnvVarMetadata[] {
    return ENV_REGISTRY.filter(env => env.securityLevel === level);
  }

  /**
   * Check which environment variables need rotation
   */
  static getVariablesNeedingRotation(daysThreshold: number = 7): EnvVarMetadata[] {
    return ENV_REGISTRY.filter(env => 
      env.rotationDays && env.rotationDays <= daysThreshold
    );
  }

  /**
   * Validate all environment variables and return security report
   */
  static generateSecurityReport(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    for (const metadata of ENV_REGISTRY) {
      const value = process.env[metadata.name];
      
      // Check required variables
      if (metadata.required && !value) {
        errors.push(`Missing required environment variable: ${metadata.name}`);
        continue;
      }

      // Check format validation
      if (value && metadata.validationPattern && !metadata.validationPattern.test(value)) {
        errors.push(`Invalid format for ${metadata.name}: ${metadata.description}`);
      }

      // Check security level warnings
      if (metadata.securityLevel === EnvSecurityLevel.SECRET && process.env.NODE_ENV === 'production') {
        if (!value || value.length < 32) {
          warnings.push(`${metadata.name} should be at least 32 characters in production`);
        }
      }

      // Rotation recommendations
      if (metadata.rotationDays && metadata.rotationDays <= 30) {
        recommendations.push(`Consider rotating ${metadata.name} every ${metadata.rotationDays} days`);
      }

      // Domain restriction recommendations
      if (metadata.restrictedDomains && metadata.name.includes('GOOGLE_MAPS')) {
        recommendations.push(`Ensure ${metadata.name} is restricted to: ${metadata.restrictedDomains.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };
  }

  /**
   * Redact sensitive values for logging
   */
  static redactValue(name: string, value: string): string {
    const metadata = this.getMetadata(name);
    if (!metadata) return "[UNKNOWN]";

    switch (metadata.securityLevel) {
      case EnvSecurityLevel.PUBLIC:
        return value;
      case EnvSecurityLevel.INTERNAL:
        return value.substring(0, 8) + "...";
      case EnvSecurityLevel.SENSITIVE:
        return value.substring(0, 4) + "***";
      case EnvSecurityLevel.SECRET:
        return "***" + value.substring(value.length - 4);
      case EnvSecurityLevel.CRITICAL:
        return "[REDACTED]";
      default:
        return "[REDACTED]";
    }
  }
}

/**
 * Type-safe environment variable access
 */
export type EnvironmentConfig = typeof env;

/**
 * Get validated and type-safe environment configuration
 */
export function getSecureEnv(): EnvironmentConfig {
  return env;
}

/**
 * Runtime environment validation with detailed error reporting
 */
export function validateEnvironment(): void {
  const report = EnvSecurityManager.generateSecurityReport();
  
  if (!report.valid) {
    console.error("❌ Environment Variable Validation Failed:");
    report.errors.forEach(error => console.error(`   • ${error}`));
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error("Critical environment variables are missing or invalid");
    }
  }

  if (report.warnings.length > 0) {
    console.warn("⚠️ Environment Variable Warnings:");
    report.warnings.forEach(warning => console.warn(`   • ${warning}`));
  }

  if (report.recommendations.length > 0 && process.env.NODE_ENV === 'development') {
    console.info("💡 Environment Variable Recommendations:");
    report.recommendations.forEach(rec => console.info(`   • ${rec}`));
  }

  console.log("✅ Environment variables validated successfully");
}

// Export the registry for documentation/tooling
export { ENV_REGISTRY, type EnvVarMetadata, EnvSecurityLevel };
/**
 * @fileMetadata
 * @purpose "Runtime environment variable validation with security enforcement"
 * @owner security-team
 * @dependencies ["@claimguardian/security"]
 * @exports ["validateRuntimeEnvironment", "EnvRuntimeValidator"]
 * @complexity medium
 * @tags ["security", "runtime", "validation"]
 * @status production-ready
 */

import { EnvSecurityManager, EnvSecurityLevel, getSecureEnv } from '@claimguardian/security/env-validator';

/**
 * Runtime environment validator with security checks
 */
export class EnvRuntimeValidator {
  private static instance: EnvRuntimeValidator;
  private validationCache = new Map<string, boolean>();
  private lastValidation: Date | null = null;
  private validationInterval = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // Singleton pattern
  }

  static getInstance(): EnvRuntimeValidator {
    if (!EnvRuntimeValidator.instance) {
      EnvRuntimeValidator.instance = new EnvRuntimeValidator();
    }
    return EnvRuntimeValidator.instance;
  }

  /**
   * Validate environment at application startup
   */
  static async validateAtStartup(): Promise<void> {
    const validator = EnvRuntimeValidator.getInstance();
    
    console.log('🔐 ClaimGuardian Environment Validation');
    console.log('======================================');
    
    try {
      // Get validated environment
      const env = getSecureEnv();
      
      // Perform security checks
      const securityReport = EnvSecurityManager.generateSecurityReport();
      
      if (!securityReport.valid) {
        console.error('❌ Environment validation failed:');
        securityReport.errors.forEach(error => console.error(`   • ${error}`));
        
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Critical environment variables are missing or invalid in production');
        }
      }
      
      // Log warnings and recommendations
      if (securityReport.warnings.length > 0) {
        console.warn('⚠️ Environment warnings:');
        securityReport.warnings.forEach(warning => console.warn(`   • ${warning}`));
      }
      
      if (securityReport.recommendations.length > 0 && process.env.NODE_ENV === 'development') {
        console.info('💡 Recommendations:');
        securityReport.recommendations.forEach(rec => console.info(`   • ${rec}`));
      }
      
      // Validate critical API connections
      await validator.validateCriticalConnections();
      
      validator.lastValidation = new Date();
      
      console.log('✅ Environment validation completed successfully');
      console.log('');
      
    } catch (error) {
      console.error('❌ Environment validation failed:', error);
      
      if (process.env.NODE_ENV === 'production') {
        // Log to monitoring service
        if (typeof window !== 'undefined' && window.Sentry) {
          window.Sentry.captureException(error, {
            tags: { component: 'env-validation' },
            level: 'fatal'
          });
        }
        
        throw error;
      } else {
        console.warn('⚠️ Continuing in development mode with validation errors');
      }
    }
  }

  /**
   * Validate specific environment variable at runtime
   */
  validateVariable(name: string, value?: string): boolean {
    // Check cache first
    const cacheKey = `${name}:${value ? 'set' : 'empty'}`;
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }
    
    const isValid = EnvSecurityManager.isSecurelyConfigured(name, value);
    
    // Cache the result
    this.validationCache.set(cacheKey, isValid);
    
    return isValid;
  }

  /**
   * Get redacted environment variable for logging
   */
  getRedactedValue(name: string, value: string): string {
    return EnvSecurityManager.redactValue(name, value);
  }

  /**
   * Check if revalidation is needed
   */
  needsRevalidation(): boolean {
    if (!this.lastValidation) return true;
    
    const timeSinceLastValidation = Date.now() - this.lastValidation.getTime();
    return timeSinceLastValidation > this.validationInterval;
  }

  /**
   * Validate critical API connections
   */
  private async validateCriticalConnections(): Promise<void> {
    const env = getSecureEnv();
    const connectionTests: Promise<void>[] = [];
    
    // Test Supabase connection
    if (env.NEXT_PUBLIC_SUPABASE_URL) {
      connectionTests.push(this.testSupabaseConnection(env.NEXT_PUBLIC_SUPABASE_URL));
    }
    
    // Test OpenAI connection (server-side only)
    if (typeof window === 'undefined' && env.OPENAI_API_KEY) {
      connectionTests.push(this.testOpenAIConnection(env.OPENAI_API_KEY));
    }
    
    // Run connection tests with timeout
    const timeoutPromise = new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('Connection tests timed out')), 10000)
    );
    
    try {
      await Promise.race([
        Promise.allSettled(connectionTests),
        timeoutPromise
      ]);
      
      console.log('✅ Critical API connections validated');
    } catch (error) {
      console.warn('⚠️ Some API connection tests failed:', error);
      
      if (process.env.NODE_ENV === 'production') {
        // Log but don't fail - might be network issues
        console.warn('   Continuing despite connection test failures in production');
      }
    }
  }

  /**
   * Test Supabase connection
   */
  private async testSupabaseConnection(url: string): Promise<void> {
    try {
      const response = await fetch(`${url}/rest/v1/`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok && response.status !== 401) {
        throw new Error(`Supabase connection failed: HTTP ${response.status}`);
      }
      
      console.log('   ✅ Supabase connection OK');
    } catch (error) {
      console.error('   ❌ Supabase connection failed:', error);
      throw error;
    }
  }

  /**
   * Test OpenAI API connection (server-side only)
   */
  private async testOpenAIConnection(apiKey: string): Promise<void> {
    if (typeof window !== 'undefined') {
      return; // Skip client-side
    }
    
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API connection failed: HTTP ${response.status}`);
      }
      
      console.log('   ✅ OpenAI API connection OK');
    } catch (error) {
      console.error('   ❌ OpenAI API connection failed:', error);
      throw error;
    }
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear();
    this.lastValidation = null;
  }

  /**
   * Get validation statistics
   */
  getStats(): {
    cacheSize: number;
    lastValidation: Date | null;
    needsRevalidation: boolean;
  } {
    return {
      cacheSize: this.validationCache.size,
      lastValidation: this.lastValidation,
      needsRevalidation: this.needsRevalidation()
    };
  }
}

/**
 * Convenience function for runtime environment validation
 */
export async function validateRuntimeEnvironment(): Promise<void> {
  await EnvRuntimeValidator.validateAtStartup();
}

/**
 * React hook for environment variable validation
 */
export function useEnvironmentValidation() {
  const validator = EnvRuntimeValidator.getInstance();
  
  return {
    validateVariable: (name: string, value?: string) => validator.validateVariable(name, value),
    getRedactedValue: (name: string, value: string) => validator.getRedactedValue(name, value),
    needsRevalidation: () => validator.needsRevalidation(),
    clearCache: () => validator.clearCache(),
    stats: validator.getStats()
  };
}

/**
 * Environment variable security middleware for API routes
 */
export function createEnvSecurityMiddleware() {
  return async (req: Request, res: Response, next: () => void) => {
    const validator = EnvRuntimeValidator.getInstance();
    
    // Check if revalidation is needed
    if (validator.needsRevalidation()) {
      try {
        await validateRuntimeEnvironment();
      } catch (error) {
        console.error('Environment revalidation failed:', error);
        
        if (process.env.NODE_ENV === 'production') {
          return res.status(500).json({
            error: 'Service temporarily unavailable',
            code: 'ENV_VALIDATION_FAILED'
          });
        }
      }
    }
    
    next();
  };
}

/**
 * Environment variable logger with automatic redaction
 */
export class SecureEnvLogger {
  static log(message: string, envVars: Record<string, string | undefined> = {}) {
    const validator = EnvRuntimeValidator.getInstance();
    const redactedVars: Record<string, string> = {};
    
    for (const [name, value] of Object.entries(envVars)) {
      if (value) {
        redactedVars[name] = validator.getRedactedValue(name, value);
      } else {
        redactedVars[name] = '[NOT_SET]';
      }
    }
    
    console.log(message, redactedVars);
  }
  
  static error(message: string, error: unknown, envContext: Record<string, string | undefined> = {}) {
    const validator = EnvRuntimeValidator.getInstance();
    const redactedVars: Record<string, string> = {};
    
    for (const [name, value] of Object.entries(envContext)) {
      if (value) {
        redactedVars[name] = validator.getRedactedValue(name, value);
      } else {
        redactedVars[name] = '[NOT_SET]';
      }
    }
    
    console.error(message, { error, env: redactedVars });
  }
}
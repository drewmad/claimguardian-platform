/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Advanced rate limiting system for API protection and fair usage enforcement"
 * @dependencies ["@/lib/cache/cache-service", "@/lib/logger/production-logger"]
 * @status stable
 */

import { cacheService } from "@/lib/cache/cache-service";
import { logger } from "@/lib/logger/production-logger";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (identifier: string, action: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (identifier: string, action: string) => void;
  customHeaders?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalRequests: number;
  windowStart: number;
}

export interface RateLimitOptions {
  identifier: string;
  action: string;
  config?: Partial<RateLimitConfig>;
  weight?: number; // For weighted rate limiting
  bypassKey?: string; // For bypassing rate limits
}

export class RateLimiter {
  private defaultConfig: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (identifier: string, action: string) => `rate_limit:${action}:${identifier}`,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    customHeaders: true,
  };

  private readonly module = "rate-limiter";

  constructor(private globalConfig: Partial<RateLimitConfig> = {}) {
    this.defaultConfig = { ...this.defaultConfig, ...globalConfig };
  }

  /**
   * Check if request is within rate limit
   */
  async checkLimit(options: RateLimitOptions): Promise<RateLimitResult> {
    const config = { ...this.defaultConfig, ...options.config };
    const { identifier, action, weight = 1, bypassKey } = options;

    // Check bypass key first
    if (bypassKey && await this.isValidBypassKey(bypassKey)) {
      return this.createAllowedResult(0, Date.now() + config.windowMs);
    }

    const key = config.keyGenerator!(identifier, action);
    const now = Date.now();
    const windowStart = now - (now % config.windowMs);
    const windowEnd = windowStart + config.windowMs;

    try {
      // Get current window data
      const windowData = await this.getWindowData(key, windowStart);
      const currentRequests = windowData.requests + weight;

      // Check if limit exceeded
      if (currentRequests > config.maxRequests) {
        await this.recordViolation(identifier, action, currentRequests, config.maxRequests);
        
        if (config.onLimitReached) {
          config.onLimitReached(identifier, action);
        }

        return {
          allowed: false,
          remaining: 0,
          resetTime: windowEnd,
          totalRequests: currentRequests,
          windowStart,
        };
      }

      // Update window data
      await this.updateWindowData(key, windowStart, currentRequests, config.windowMs / 1000);

      return {
        allowed: true,
        remaining: config.maxRequests - currentRequests,
        resetTime: windowEnd,
        totalRequests: currentRequests,
        windowStart,
      };
    } catch (error) {
      logger.error("Rate limit check failed", {
        module: this.module,
        identifier,
        action,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Fail open - allow request if rate limiting fails
      return this.createAllowedResult(config.maxRequests - 1, windowEnd);
    }
  }

  /**
   * Specialized rate limiting for AI API calls
   */
  async checkAILimit(options: {
    userId: string;
    aiProvider: "openai" | "gemini";
    operation: "chat" | "analysis" | "generation";
    tokenCount?: number;
  }): Promise<RateLimitResult> {
    const { userId, aiProvider, operation, tokenCount = 1 } = options;

    // Different limits for different AI operations
    const aiLimits = {
      openai: {
        chat: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 per minute
        analysis: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
        generation: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 per minute
      },
      gemini: {
        chat: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 per minute
        analysis: { windowMs: 60 * 1000, maxRequests: 15 }, // 15 per minute
        generation: { windowMs: 60 * 1000, maxRequests: 8 }, // 8 per minute
      },
    };

    const config = aiLimits[aiProvider][operation];
    
    return this.checkLimit({
      identifier: userId,
      action: `ai:${aiProvider}:${operation}`,
      config,
      weight: Math.ceil(tokenCount / 1000), // Weight by token usage
    });
  }

  /**
   * Rate limiting for Florida emergency data API calls
   */
  async checkEmergencyDataLimit(options: {
    userId: string;
    dataType: "hurricane" | "flood" | "weather" | "fema";
    county?: string;
  }): Promise<RateLimitResult> {
    const { userId, dataType, county } = options;

    // Higher limits during emergency situations
    const isEmergencyActive = await this.isEmergencyActive(county);
    const baseLimit = isEmergencyActive ? 200 : 100;

    return this.checkLimit({
      identifier: userId,
      action: `emergency:${dataType}`,
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: baseLimit,
      },
    });
  }

  /**
   * Rate limiting for document upload and processing
   */
  async checkDocumentLimit(options: {
    userId: string;
    operation: "upload" | "analysis" | "extraction";
    fileSize?: number;
  }): Promise<RateLimitResult> {
    const { userId, operation, fileSize = 0 } = options;

    const documentLimits = {
      upload: { windowMs: 5 * 60 * 1000, maxRequests: 20 }, // 20 uploads per 5 minutes
      analysis: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 analyses per minute
      extraction: { windowMs: 60 * 1000, maxRequests: 15 }, // 15 extractions per minute
    };

    const config = documentLimits[operation];
    const weight = operation === "upload" ? Math.ceil(fileSize / (1024 * 1024)) : 1; // Weight by MB

    return this.checkLimit({
      identifier: userId,
      action: `document:${operation}`,
      config,
      weight,
    });
  }

  /**
   * Global API rate limiting for all endpoints
   */
  async checkGlobalLimit(options: {
    identifier: string;
    endpoint: string;
    method: string;
  }): Promise<RateLimitResult> {
    const { identifier, endpoint, method } = options;

    // Different limits for different endpoint types
    const globalLimits = {
      "/api/auth": { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // Auth: 10 per 15 minutes
      "/api/ai": { windowMs: 60 * 1000, maxRequests: 30 }, // AI: 30 per minute
      "/api/properties": { windowMs: 60 * 1000, maxRequests: 100 }, // Properties: 100 per minute
      "/api/claims": { windowMs: 60 * 1000, maxRequests: 50 }, // Claims: 50 per minute
      default: { windowMs: 60 * 1000, maxRequests: 200 }, // Default: 200 per minute
    };

    const endpointPattern = Object.keys(globalLimits).find(pattern => 
      endpoint.startsWith(pattern)
    ) || "default";

    const config = globalLimits[endpointPattern as keyof typeof globalLimits];

    return this.checkLimit({
      identifier,
      action: `global:${method}:${endpointPattern}`,
      config,
    });
  }

  /**
   * IP-based rate limiting for abuse prevention
   */
  async checkIPLimit(options: {
    ip: string;
    endpoint: string;
    suspicious?: boolean;
  }): Promise<RateLimitResult> {
    const { ip, endpoint, suspicious = false } = options;

    const ipLimit = suspicious ? 10 : 500; // Lower limit for suspicious IPs
    
    return this.checkLimit({
      identifier: ip,
      action: `ip:${endpoint}`,
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: ipLimit,
      },
    });
  }

  /**
   * Get rate limit status for monitoring
   */
  async getStatus(identifier: string, action: string): Promise<{
    currentUsage: number;
    limit: number;
    resetTime: number;
    percentUsed: number;
  }> {
    const key = this.defaultConfig.keyGenerator!(identifier, action);
    const now = Date.now();
    const windowStart = now - (now % this.defaultConfig.windowMs);

    try {
      const windowData = await this.getWindowData(key, windowStart);
      const percentUsed = (windowData.requests / this.defaultConfig.maxRequests) * 100;

      return {
        currentUsage: windowData.requests,
        limit: this.defaultConfig.maxRequests,
        resetTime: windowStart + this.defaultConfig.windowMs,
        percentUsed: Math.round(percentUsed * 100) / 100,
      };
    } catch (error) {
      logger.error("Failed to get rate limit status", {
        module: this.module,
        identifier,
        action,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        currentUsage: 0,
        limit: this.defaultConfig.maxRequests,
        resetTime: windowStart + this.defaultConfig.windowMs,
        percentUsed: 0,
      };
    }
  }

  /**
   * Reset rate limit for a specific identifier/action
   */
  async reset(identifier: string, action: string): Promise<void> {
    const key = this.defaultConfig.keyGenerator!(identifier, action);
    await cacheService.delete(key);
    
    logger.info("Rate limit reset", {
      module: this.module,
      identifier,
      action,
    });
  }

  /**
   * Get comprehensive rate limit metrics
   */
  async getMetrics(): Promise<{
    totalViolations: number;
    violationsByAction: Record<string, number>;
    topViolators: Array<{ identifier: string; violations: number }>;
    recentViolations: Array<{
      identifier: string;
      action: string;
      timestamp: string;
      requests: number;
      limit: number;
    }>;
  }> {
    try {
      const [totalViolations, violationsByAction, topViolators, recentViolations] = await Promise.all([
        cacheService.get<number>("rate_limit:metrics:total_violations").then(result => result || 0),
        cacheService.get<Record<string, number>>("rate_limit:metrics:violations_by_action").then(result => result || {}),
        cacheService.get<Array<{ identifier: string; violations: number }>>("rate_limit:metrics:top_violators").then(result => result || []),
        cacheService.get<Array<{ identifier: string; action: string; timestamp: string; requests: number; limit: number }>>("rate_limit:metrics:recent_violations").then(result => result || []),
      ]);

      return {
        totalViolations,
        violationsByAction,
        topViolators,
        recentViolations,
      };
    } catch (error) {
      logger.error("Failed to get rate limit metrics", {
        module: this.module,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        totalViolations: 0,
        violationsByAction: {},
        topViolators: [],
        recentViolations: [],
      };
    }
  }

  // Private methods
  private async getWindowData(key: string, windowStart: number): Promise<{
    requests: number;
    windowStart: number;
  }> {
    const cached = await cacheService.get<{ requests: number; windowStart: number }>(key);
    
    if (cached && cached.windowStart === windowStart) {
      return cached;
    }

    // New window or no cached data
    return { requests: 0, windowStart };
  }

  private async updateWindowData(
    key: string, 
    windowStart: number, 
    requests: number, 
    ttlSeconds: number
  ): Promise<void> {
    const windowData = { requests, windowStart };
    await cacheService.set(key, windowData, ttlSeconds);
  }

  private async recordViolation(
    identifier: string, 
    action: string, 
    requests: number, 
    limit: number
  ): Promise<void> {
    try {
      // Update total violations
      const totalKey = "rate_limit:metrics:total_violations";
      const currentTotal = await cacheService.get<number>(totalKey) || 0;
      await cacheService.set(totalKey, currentTotal + 1, 24 * 60 * 60); // 24 hours

      // Update violations by action
      const actionKey = "rate_limit:metrics:violations_by_action";
      const actionStats = await cacheService.get<Record<string, number>>(actionKey) || {};
      actionStats[action] = (actionStats[action] || 0) + 1;
      await cacheService.set(actionKey, actionStats, 24 * 60 * 60);

      // Update top violators
      const violatorsKey = "rate_limit:metrics:top_violators";
      const violators = await cacheService.get<Array<{ identifier: string; violations: number }>>(violatorsKey) || [];
      const existingViolator = violators.find(v => v.identifier === identifier);
      
      if (existingViolator) {
        existingViolator.violations++;
      } else {
        violators.push({ identifier, violations: 1 });
      }

      // Keep only top 10 violators
      violators.sort((a, b) => b.violations - a.violations);
      await cacheService.set(violatorsKey, violators.slice(0, 10), 24 * 60 * 60);

      // Record recent violation
      const recentKey = "rate_limit:metrics:recent_violations";
      const recent = await cacheService.get<Array<any>>(recentKey) || [];
      recent.unshift({
        identifier,
        action,
        timestamp: new Date().toISOString(),
        requests,
        limit,
      });
      
      // Keep only last 100 violations
      await cacheService.set(recentKey, recent.slice(0, 100), 24 * 60 * 60);

      logger.warn("Rate limit violation recorded", {
        module: this.module,
        identifier,
        action,
        requests,
        limit,
        overage: requests - limit,
      });
    } catch (error) {
      logger.error("Failed to record rate limit violation", {
        module: this.module,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private async isValidBypassKey(bypassKey: string): Promise<boolean> {
    // In production, this would check against a secure key store
    const validKeys = process.env.RATE_LIMIT_BYPASS_KEYS?.split(",") || [];
    return validKeys.includes(bypassKey);
  }

  private async isEmergencyActive(county?: string): Promise<boolean> {
    if (!county) return false;
    
    // Check for active hurricane or emergency alerts for the county
    const alertKey = `emergency:active:${county}`;
    const activeAlert = await cacheService.get(alertKey);
    return activeAlert !== null;
  }

  private createAllowedResult(remaining: number, resetTime: number): RateLimitResult {
    return {
      allowed: true,
      remaining,
      resetTime,
      totalRequests: 1,
      windowStart: Date.now(),
    };
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
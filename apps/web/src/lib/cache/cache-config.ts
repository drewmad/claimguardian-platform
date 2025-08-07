/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Cache configuration and optimization for high-performance caching strategies"
 * @dependencies []
 * @status stable
 */

import { logger } from "@/lib/logger/production-logger";

export interface CacheStrategyConfig {
  // Redis configuration
  redis: {
    enabled: boolean;
    host: string;
    port: number;
    password?: string;
    db: number;
    maxRetries: number;
    commandTimeout: number;
    enableAutoPipelining: boolean;
  };
  
  // Cache behavior
  strategy: {
    defaultTTL: number;
    maxMemorySize: number;
    compressionThreshold: number;
    encryptionEnabled: boolean;
    metricsEnabled: boolean;
  };

  // Performance optimization
  performance: {
    enableCompression: boolean;
    enableEncryption: boolean;
    batchSize: number;
    pipelineThreshold: number;
    healthCheckInterval: number;
  };

  // ClaimGuardian-specific cache keys
  keys: {
    userSession: string;
    propertyData: string;
    claimData: string;
    aiAnalysis: string;
    documentCache: string;
    floridaData: string;
  };
}

export const DEFAULT_CACHE_CONFIG: CacheStrategyConfig = {
  redis: {
    enabled: process.env.NODE_ENV === "production" && !!process.env.REDIS_HOST,
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || "0", 10),
    maxRetries: 3,
    commandTimeout: 5000,
    enableAutoPipelining: true,
  },

  strategy: {
    defaultTTL: 3600, // 1 hour
    maxMemorySize: 100 * 1024 * 1024, // 100MB
    compressionThreshold: 1024, // Compress data > 1KB
    encryptionEnabled: process.env.NODE_ENV === "production",
    metricsEnabled: true,
  },

  performance: {
    enableCompression: true,
    enableEncryption: process.env.NODE_ENV === "production",
    batchSize: 100,
    pipelineThreshold: 10,
    healthCheckInterval: 30000, // 30 seconds
  },

  keys: {
    userSession: "user:session:",
    propertyData: "property:data:",
    claimData: "claim:data:",
    aiAnalysis: "ai:analysis:",
    documentCache: "doc:cache:",
    floridaData: "florida:data:",
  },
};

/**
 * Cache TTL configurations for different data types
 */
export const CACHE_TTL = {
  // User data
  USER_SESSION: 24 * 60 * 60, // 24 hours
  USER_PROFILE: 6 * 60 * 60,  // 6 hours
  USER_PREFERENCES: 24 * 60 * 60, // 24 hours

  // Property data
  PROPERTY_BASIC: 2 * 60 * 60, // 2 hours
  PROPERTY_DETAILED: 1 * 60 * 60, // 1 hour
  PROPERTY_IMAGES: 24 * 60 * 60, // 24 hours
  PROPERTY_VALUATION: 30 * 60, // 30 minutes

  // Claims data
  CLAIM_STATUS: 5 * 60, // 5 minutes
  CLAIM_DOCUMENTS: 30 * 60, // 30 minutes
  CLAIM_ANALYSIS: 1 * 60 * 60, // 1 hour
  CLAIM_TIMELINE: 10 * 60, // 10 minutes

  // AI analysis
  AI_DOCUMENT_ANALYSIS: 4 * 60 * 60, // 4 hours
  AI_DAMAGE_ASSESSMENT: 2 * 60 * 60, // 2 hours
  AI_POLICY_ANALYSIS: 6 * 60 * 60, // 6 hours
  AI_CONSENSUS_RESULT: 24 * 60 * 60, // 24 hours

  // Florida-specific data
  HURRICANE_ALERTS: 5 * 60, // 5 minutes
  FLOOD_ZONES: 7 * 24 * 60 * 60, // 7 days
  COUNTY_DATA: 24 * 60 * 60, // 24 hours
  WEATHER_DATA: 10 * 60, // 10 minutes
  FEMA_DATA: 1 * 60 * 60, // 1 hour

  // Temporary/short-term
  RATE_LIMIT: 1 * 60 * 60, // 1 hour
  OTP_CODE: 10 * 60, // 10 minutes
  EMAIL_VERIFICATION: 24 * 60 * 60, // 24 hours
  PASSWORD_RESET: 1 * 60 * 60, // 1 hour

  // Long-term/static data
  STATIC_CONTENT: 7 * 24 * 60 * 60, // 7 days
  CONFIGURATION: 12 * 60 * 60, // 12 hours
  GEO_DATA: 30 * 24 * 60 * 60, // 30 days
} as const;

/**
 * Cache key generators for consistent naming
 */
export const CacheKeys = {
  // User keys
  userSession: (userId: string) => `${DEFAULT_CACHE_CONFIG.keys.userSession}${userId}`,
  userProfile: (userId: string) => `user:profile:${userId}`,
  userPreferences: (userId: string) => `user:prefs:${userId}`,

  // Property keys
  property: (propertyId: string) => `${DEFAULT_CACHE_CONFIG.keys.propertyData}${propertyId}`,
  propertyList: (userId: string) => `property:list:${userId}`,
  propertyImages: (propertyId: string) => `property:images:${propertyId}`,
  propertyValuation: (propertyId: string) => `property:value:${propertyId}`,

  // Claim keys
  claim: (claimId: string) => `${DEFAULT_CACHE_CONFIG.keys.claimData}${claimId}`,
  claimsByProperty: (propertyId: string) => `claim:byprop:${propertyId}`,
  claimsByUser: (userId: string) => `claim:byuser:${userId}`,
  claimStatus: (claimId: string) => `claim:status:${claimId}`,

  // AI analysis keys
  aiAnalysis: (documentId: string) => `${DEFAULT_CACHE_CONFIG.keys.aiAnalysis}${documentId}`,
  damageAssessment: (imageId: string) => `ai:damage:${imageId}`,
  policyAnalysis: (policyId: string) => `ai:policy:${policyId}`,
  consensusResult: (analysisId: string) => `ai:consensus:${analysisId}`,

  // Florida data keys
  floodZone: (address: string) => `${DEFAULT_CACHE_CONFIG.keys.floridaData}flood:${address}`,
  hurricaneAlerts: (county: string) => `florida:hurricane:${county}`,
  countyData: (countyCode: string) => `florida:county:${countyCode}`,
  weatherData: (zipCode: string) => `florida:weather:${zipCode}`,

  // Document cache keys
  document: (docId: string) => `${DEFAULT_CACHE_CONFIG.keys.documentCache}${docId}`,
  documentAnalysis: (docId: string) => `doc:analysis:${docId}`,
  documentThumbnail: (docId: string) => `doc:thumb:${docId}`,

  // Rate limiting keys
  rateLimit: (identifier: string, action: string) => `rate:${action}:${identifier}`,
  apiQuota: (apiKey: string) => `quota:${apiKey}`,
} as const;

/**
 * Cache health monitoring configuration
 */
export const CacheHealth = {
  // Health check thresholds
  thresholds: {
    maxLatency: 100, // milliseconds
    minHitRate: 0.7, // 70%
    maxMemoryUsage: 0.8, // 80%
    maxConnectionErrors: 5,
  },

  // Monitoring intervals
  intervals: {
    healthCheck: 30000, // 30 seconds
    metricsCollection: 60000, // 1 minute
    alertCheck: 300000, // 5 minutes
  },

  // Alert conditions
  alerts: {
    highLatency: 200, // milliseconds
    lowHitRate: 0.5, // 50%
    highMemoryUsage: 0.9, // 90%
    connectionFailure: true,
  },
} as const;

/**
 * Initialize cache configuration with environment validation
 */
export function initializeCacheConfig(): CacheStrategyConfig {
  const config = { ...DEFAULT_CACHE_CONFIG };

  // Validate Redis configuration
  if (config.redis.enabled) {
    if (!config.redis.host) {
      logger.warn("Redis enabled but no host configured, falling back to memory cache", {
        module: "cache-config",
      });
      config.redis.enabled = false;
    }

    if (config.redis.port < 1 || config.redis.port > 65535) {
      logger.warn("Invalid Redis port, using default 6379", {
        module: "cache-config",
        port: config.redis.port,
      });
      config.redis.port = 6379;
    }
  }

  // Validate memory limits
  if (config.strategy.maxMemorySize < 10 * 1024 * 1024) { // 10MB minimum
    logger.warn("Memory cache size too small, setting to 50MB", {
      module: "cache-config",
      size: config.strategy.maxMemorySize,
    });
    config.strategy.maxMemorySize = 50 * 1024 * 1024;
  }

  // Log configuration
  logger.info("Cache configuration initialized", {
    module: "cache-config",
    redisEnabled: config.redis.enabled,
    compressionEnabled: config.performance.enableCompression,
    encryptionEnabled: config.performance.enableEncryption,
    metricsEnabled: config.strategy.metricsEnabled,
  });

  return config;
}

/**
 * Get cache configuration for specific environment
 */
export function getCacheConfig(environment?: string): CacheStrategyConfig {
  const env = environment || process.env.NODE_ENV || "development";
  const baseConfig = initializeCacheConfig();

  switch (env) {
    case "production":
      return {
        ...baseConfig,
        redis: {
          ...baseConfig.redis,
          enabled: true,
          maxRetries: 5,
        },
        strategy: {
          ...baseConfig.strategy,
          encryptionEnabled: true,
          metricsEnabled: true,
        },
        performance: {
          ...baseConfig.performance,
          enableEncryption: true,
          batchSize: 200,
        },
      };

    case "staging":
      return {
        ...baseConfig,
        redis: {
          ...baseConfig.redis,
          enabled: true,
          maxRetries: 3,
        },
        strategy: {
          ...baseConfig.strategy,
          encryptionEnabled: false,
          metricsEnabled: true,
        },
      };

    case "development":
    default:
      return {
        ...baseConfig,
        redis: {
          ...baseConfig.redis,
          enabled: false, // Use memory cache in development
        },
        strategy: {
          ...baseConfig.strategy,
          encryptionEnabled: false,
          metricsEnabled: false,
        },
        performance: {
          ...baseConfig.performance,
          enableEncryption: false,
          enableCompression: false,
        },
      };
  }
}
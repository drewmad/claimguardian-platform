/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Comprehensive rate limiting configuration for ClaimGuardian platform"
 * @dependencies []
 * @status stable
 */

export interface EndpointRateLimit {
  windowMs: number;
  maxRequests: number;
  description: string;
  tier?: "free" | "premium" | "enterprise";
  emergencyMultiplier?: number; // Multiplier during emergency situations
}

export interface UserTierLimits {
  free: {
    ai: EndpointRateLimit;
    documents: EndpointRateLimit;
    api: EndpointRateLimit;
    emergencyData: EndpointRateLimit;
  };
  premium: {
    ai: EndpointRateLimit;
    documents: EndpointRateLimit;
    api: EndpointRateLimit;
    emergencyData: EndpointRateLimit;
  };
  enterprise: {
    ai: EndpointRateLimit;
    documents: EndpointRateLimit;
    api: EndpointRateLimit;
    emergencyData: EndpointRateLimit;
  };
}

export const RATE_LIMIT_CONFIG: UserTierLimits = {
  free: {
    ai: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
      description: "AI operations for free tier users",
      emergencyMultiplier: 1.5,
    },
    documents: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 5,
      description: "Document uploads/processing for free tier",
      emergencyMultiplier: 2,
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 50,
      description: "General API calls for free tier",
      emergencyMultiplier: 2,
    },
    emergencyData: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 25,
      description: "Emergency data access for free tier",
      emergencyMultiplier: 3,
    },
  },
  premium: {
    ai: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 50,
      description: "AI operations for premium users",
      emergencyMultiplier: 1.5,
    },
    documents: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 25,
      description: "Document uploads/processing for premium tier",
      emergencyMultiplier: 2,
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 200,
      description: "General API calls for premium tier",
      emergencyMultiplier: 1.5,
    },
    emergencyData: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      description: "Emergency data access for premium tier",
      emergencyMultiplier: 2,
    },
  },
  enterprise: {
    ai: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 200,
      description: "AI operations for enterprise users",
      emergencyMultiplier: 1.2,
    },
    documents: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 100,
      description: "Document uploads/processing for enterprise tier",
      emergencyMultiplier: 1.5,
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 1000,
      description: "General API calls for enterprise tier",
      emergencyMultiplier: 1.2,
    },
    emergencyData: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 500,
      description: "Emergency data access for enterprise tier",
      emergencyMultiplier: 1.5,
    },
  },
};

export const AI_SPECIFIC_LIMITS = {
  openai: {
    chat: {
      free: { windowMs: 60 * 1000, maxRequests: 5, tokenLimit: 2000 },
      premium: { windowMs: 60 * 1000, maxRequests: 25, tokenLimit: 10000 },
      enterprise: { windowMs: 60 * 1000, maxRequests: 100, tokenLimit: 50000 },
    },
    analysis: {
      free: { windowMs: 60 * 1000, maxRequests: 3, tokenLimit: 5000 },
      premium: { windowMs: 60 * 1000, maxRequests: 15, tokenLimit: 25000 },
      enterprise: { windowMs: 60 * 1000, maxRequests: 75, tokenLimit: 100000 },
    },
    generation: {
      free: { windowMs: 60 * 1000, maxRequests: 2, tokenLimit: 1000 },
      premium: { windowMs: 60 * 1000, maxRequests: 10, tokenLimit: 5000 },
      enterprise: { windowMs: 60 * 1000, maxRequests: 50, tokenLimit: 25000 },
    },
  },
  gemini: {
    chat: {
      free: { windowMs: 60 * 1000, maxRequests: 8, tokenLimit: 3000 },
      premium: { windowMs: 60 * 1000, maxRequests: 40, tokenLimit: 15000 },
      enterprise: { windowMs: 60 * 1000, maxRequests: 150, tokenLimit: 75000 },
    },
    analysis: {
      free: { windowMs: 60 * 1000, maxRequests: 5, tokenLimit: 7500 },
      premium: { windowMs: 60 * 1000, maxRequests: 25, tokenLimit: 37500 },
      enterprise: { windowMs: 60 * 1000, maxRequests: 100, tokenLimit: 150000 },
    },
    generation: {
      free: { windowMs: 60 * 1000, maxRequests: 3, tokenLimit: 1500 },
      premium: { windowMs: 60 * 1000, maxRequests: 15, tokenLimit: 7500 },
      enterprise: { windowMs: 60 * 1000, maxRequests: 75, tokenLimit: 37500 },
    },
  },
};

export const FLORIDA_EMERGENCY_LIMITS = {
  hurricane: {
    normal: { windowMs: 60 * 1000, maxRequests: 30 },
    warning: { windowMs: 60 * 1000, maxRequests: 100 },
    active: { windowMs: 60 * 1000, maxRequests: 200 },
  },
  flood: {
    normal: { windowMs: 60 * 1000, maxRequests: 20 },
    warning: { windowMs: 60 * 1000, maxRequests: 60 },
    active: { windowMs: 60 * 1000, maxRequests: 120 },
  },
  weather: {
    normal: { windowMs: 60 * 1000, maxRequests: 50 },
    warning: { windowMs: 60 * 1000, maxRequests: 100 },
    active: { windowMs: 60 * 1000, maxRequests: 150 },
  },
  fema: {
    normal: { windowMs: 60 * 1000, maxRequests: 15 },
    warning: { windowMs: 60 * 1000, maxRequests: 40 },
    active: { windowMs: 60 * 1000, maxRequests: 80 },
  },
};

export const DOCUMENT_SIZE_LIMITS = {
  free: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFilesPerHour: 20,
    maxTotalSizePerHour: 100 * 1024 * 1024, // 100MB
  },
  premium: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFilesPerHour: 100,
    maxTotalSizePerHour: 500 * 1024 * 1024, // 500MB
  },
  enterprise: {
    maxFileSize: 200 * 1024 * 1024, // 200MB
    maxFilesPerHour: 500,
    maxTotalSizePerHour: 2 * 1024 * 1024 * 1024, // 2GB
  },
};

export const IP_RATE_LIMITS = {
  global: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000,
    description: "Global IP-based rate limit",
  },
  suspicious: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    description: "Rate limit for suspicious IPs",
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    description: "Authentication attempts per IP",
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    description: "Password reset attempts per IP",
  },
};

export const ENDPOINT_SPECIFIC_LIMITS = {
  "/api/auth/signin": {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    description: "Sign-in attempts",
  },
  "/api/auth/signup": {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    description: "Sign-up attempts",
  },
  "/api/auth/forgot-password": {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    description: "Forgot password attempts",
  },
  "/api/ai/damage-analyzer": {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    description: "Damage analysis requests",
  },
  "/api/ai/policy-advisor": {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 15,
    description: "Policy advisor chat requests",
  },
  "/api/ai/inventory-scanner": {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    description: "Inventory scanning requests",
  },
  "/api/documents/upload": {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20,
    description: "Document upload requests",
  },
  "/api/documents/analyze": {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    description: "Document analysis requests",
  },
  "/api/emergency-data/hurricane": {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    description: "Hurricane data requests",
  },
  "/api/emergency-data/flood": {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    description: "Flood data requests",
  },
  "/api/emergency-data/weather": {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    description: "Weather data requests",
  },
  "/api/properties": {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    description: "Property data requests",
  },
  "/api/claims": {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    description: "Claims data requests",
  },
};

export const BYPASS_KEYS = {
  emergency: process.env.EMERGENCY_BYPASS_KEY,
  admin: process.env.ADMIN_BYPASS_KEY,
  monitoring: process.env.MONITORING_BYPASS_KEY,
  testing: process.env.NODE_ENV === "test" ? "test-bypass-key" : undefined,
};

export const RATE_LIMIT_HEADERS = {
  limit: "X-RateLimit-Limit",
  remaining: "X-RateLimit-Remaining",
  reset: "X-RateLimit-Reset",
  used: "X-RateLimit-Used",
  retryAfter: "Retry-After",
  window: "X-RateLimit-Window",
};

export const VIOLATION_THRESHOLDS = {
  warning: 5, // Log warning after 5 violations per hour
  alert: 25, // Send alert after 25 violations per hour
  block: 100, // Temporary block after 100 violations per hour
  blockDurationMs: 60 * 60 * 1000, // 1 hour block
};

/**
 * Get rate limit configuration for specific user tier and service
 */
export function getRateLimitConfig(
  tier: "free" | "premium" | "enterprise",
  service: "ai" | "documents" | "api" | "emergencyData"
): EndpointRateLimit {
  return RATE_LIMIT_CONFIG[tier][service];
}

/**
 * Get AI-specific limits based on provider, operation, and tier
 */
export function getAILimit(
  provider: "openai" | "gemini",
  operation: "chat" | "analysis" | "generation",
  tier: "free" | "premium" | "enterprise"
) {
  return AI_SPECIFIC_LIMITS[provider][operation][tier];
}

/**
 * Get emergency-specific limits based on data type and alert level
 */
export function getEmergencyLimit(
  dataType: "hurricane" | "flood" | "weather" | "fema",
  alertLevel: "normal" | "warning" | "active" = "normal"
) {
  return FLORIDA_EMERGENCY_LIMITS[dataType][alertLevel];
}

/**
 * Check if rate limiting should be bypassed
 */
export function shouldBypassRateLimit(
  bypassKey?: string,
  context: "emergency" | "admin" | "monitoring" | "testing" = "emergency"
): boolean {
  if (!bypassKey) return false;
  
  const validKey = BYPASS_KEYS[context];
  return validKey ? bypassKey === validKey : false;
}

/**
 * Calculate dynamic rate limit based on system load
 */
export function calculateDynamicLimit(
  baseLimit: number,
  systemLoad: number, // 0-1 where 1 is max load
  emergencyActive: boolean = false
): number {
  let adjustedLimit = baseLimit;

  // Reduce limits under high system load
  if (systemLoad > 0.8) {
    adjustedLimit = Math.floor(baseLimit * 0.5);
  } else if (systemLoad > 0.6) {
    adjustedLimit = Math.floor(baseLimit * 0.7);
  }

  // Increase limits during emergencies
  if (emergencyActive) {
    adjustedLimit = Math.floor(adjustedLimit * 2);
  }

  return Math.max(adjustedLimit, 1); // Ensure at least 1 request is allowed
}
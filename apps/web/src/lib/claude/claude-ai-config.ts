/**
 * @fileMetadata
 * @purpose "Configuration and Setup for AI-Powered Learning Features"
 * @dependencies []
 * @owner ai-team
 * @status stable
 * @description Central configuration for LLM synthesis, semantic search, and AI features
 */

import {
  LLMSynthesisConfig,
  AIModelConfig,
  AIFeatureFlags,
} from "./claude-ai-interfaces";

/**
 * DEFAULT AI CONFIGURATIONS
 */
export const DEFAULT_LLM_CONFIG: LLMSynthesisConfig = {
  enabled: process.env.CLAUDE_AI_FEATURES_ENABLED === "true",
  provider: "openai",
  model: "gpt-4-turbo-preview",
  temperature: 0.7,
  maxTokens: 2000,
  apiKey: process.env.OPENAI_API_KEY,
  endpoint: process.env.OPENAI_ENDPOINT || "https://api.openai.com/v1",
};

export const ANTHROPIC_CONFIG: LLMSynthesisConfig = {
  enabled: process.env.CLAUDE_AI_FEATURES_ENABLED === "true",
  provider: "anthropic",
  model: "claude-3-opus-20240229",
  temperature: 0.7,
  maxTokens: 4000,
  apiKey: process.env.ANTHROPIC_API_KEY,
  endpoint: "https://api.anthropic.com/v1",
};

/**
 * MODEL CONFIGURATIONS
 */
export const AI_MODELS: Record<string, AIModelConfig> = {
  "gpt-4-turbo": {
    provider: "openai",
    model: "gpt-4-turbo-preview",
    version: "2024-01",
    capabilities: ["synthesis", "analysis", "generation", "embedding"],
    rateLimit: {
      requestsPerMinute: 500,
      tokensPerMinute: 90000,
    },
    costPerToken: 0.00003,
  },
  "claude-3-opus": {
    provider: "anthropic",
    model: "claude-3-opus-20240229",
    version: "2024-02",
    capabilities: ["synthesis", "analysis", "generation", "reasoning"],
    rateLimit: {
      requestsPerMinute: 50,
      tokensPerMinute: 100000,
    },
    costPerToken: 0.00002,
  },
  "text-embedding-3-large": {
    provider: "openai",
    model: "text-embedding-3-large",
    version: "2024-01",
    capabilities: ["embedding"],
    rateLimit: {
      requestsPerMinute: 3000,
      tokensPerMinute: 1000000,
    },
    costPerToken: 0.0000001,
  },
};

/**
 * FEATURE FLAGS
 */
export const AI_FEATURE_FLAGS: AIFeatureFlags = {
  llmSynthesisEnabled: process.env.CLAUDE_LLM_SYNTHESIS === "true",
  semanticSearchEnabled: process.env.CLAUDE_SEMANTIC_SEARCH === "true",
  nlGenerationEnabled: process.env.CLAUDE_NL_GENERATION === "true",
  bottleneckAnalysisEnabled: process.env.CLAUDE_BOTTLENECK_ANALYSIS === "true",
  autoFixEnabled: process.env.CLAUDE_AUTO_FIX === "true",
  proactiveSuggestionsEnabled:
    process.env.CLAUDE_PROACTIVE_SUGGESTIONS === "true",
};

/**
 * EMBEDDING CONFIGURATIONS
 */
export const EMBEDDING_CONFIG = {
  model: "text-embedding-3-large",
  dimensions: 3072,
  batchSize: 100,
  cacheEnabled: true,
  cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
  indexUpdateInterval: 24 * 60 * 60 * 1000, // Daily
};

/**
 * SEMANTIC SEARCH CONFIGURATIONS
 */
export const SEMANTIC_SEARCH_CONFIG = {
  defaultThreshold: 0.7,
  maxResults: 20,
  minConfidence: 0.6,
  boostFactors: {
    recentItems: 1.2,
    highConfidence: 1.5,
    frequentlyUsed: 1.3,
  },
  indexStrategies: ["cosine", "euclidean", "dot_product"],
};

/**
 * NL GENERATION CONFIGURATIONS
 */
export const NL_GENERATION_CONFIG = {
  styles: {
    technical: {
      temperature: 0.3,
      maxTokens: 1500,
      systemPrompt:
        "Generate technical documentation for experienced developers.",
    },
    simple: {
      temperature: 0.5,
      maxTokens: 1000,
      systemPrompt:
        "Explain in simple terms for junior developers or non-technical stakeholders.",
    },
    executive: {
      temperature: 0.4,
      maxTokens: 800,
      systemPrompt:
        "Provide executive summary focusing on business impact and high-level benefits.",
    },
  },
  languages: ["en", "es", "fr", "de", "ja", "zh"],
  readabilityTargets: {
    technical: 12, // Grade level
    simple: 8,
    executive: 10,
  },
};

/**
 * BOTTLENECK ANALYSIS CONFIGURATIONS
 */
export const BOTTLENECK_CONFIG = {
  analysisInterval: 24 * 60 * 60 * 1000, // Daily
  detectionThresholds: {
    performance: {
      responseTime: 3000, // ms
      degradation: 0.2, // 20% slower
    },
    errorRate: {
      threshold: 0.05, // 5% error rate
      spike: 2.0, // 2x increase
    },
    velocity: {
      reduction: 0.3, // 30% reduction
      stagnation: 7, // Days without improvement
    },
  },
  resolutionPriorities: {
    critical: { weight: 4, automate: true },
    high: { weight: 3, automate: true },
    medium: { weight: 2, automate: false },
    low: { weight: 1, automate: false },
  },
};

/**
 * PROMPT TEMPLATES
 */
export const AI_PROMPTS = {
  synthesis: {
    metaPattern: `Analyze these learnings and identify meta-patterns:
{learnings}

Focus on:
1. Common underlying principles
2. Recurring problem-solution pairs
3. Abstract concepts that apply broadly
4. Cross-cutting concerns

Output format:
- Pattern Name
- Abstract Description
- Concrete Examples
- Applicability Score (0-1)`,

    insight: `Based on these patterns, generate actionable insights:
{patterns}

Consider:
- Team productivity improvements
- Code quality enhancements
- Process optimizations
- Knowledge gaps to address`,
  },

  naturalLanguage: {
    simplify: `Rewrite this technical pattern in {style} style:
{pattern}

Requirements:
- Target audience: {audience}
- Max length: {maxLength} words
- Include: {includeElements}
- Readability level: {readabilityTarget}`,

    translate: `Translate this learning description to {targetLanguage}:
{description}

Maintain:
- Technical accuracy
- Context appropriateness
- Cultural sensitivity`,
  },

  bottleneck: {
    analyze: `Analyze system performance data for bottlenecks:
{metrics}

Identify:
1. Performance degradations
2. Error rate increases
3. Development velocity issues
4. Recurring problems

For each bottleneck provide:
- Severity assessment
- Root cause analysis
- Impact quantification`,

    resolve: `Generate resolution steps for this bottleneck:
{bottleneck}

Include:
1. Immediate mitigation steps
2. Long-term solutions
3. Automation opportunities
4. Success metrics
5. Resource requirements`,
  },
};

/**
 * RATE LIMITING AND QUOTAS
 */
export const AI_QUOTAS = {
  daily: {
    synthesis: 100,
    embeddings: 10000,
    nlGeneration: 500,
    bottleneckAnalysis: 50,
  },
  monthly: {
    synthesis: 2000,
    embeddings: 200000,
    nlGeneration: 10000,
    bottleneckAnalysis: 1000,
  },
  costLimits: {
    daily: 50, // USD
    monthly: 1000, // USD
  },
};

/**
 * ERROR HANDLING CONFIGURATIONS
 */
export const AI_ERROR_CONFIG = {
  retryAttempts: 3,
  retryDelay: 1000, // ms
  backoffMultiplier: 2,
  fallbackStrategies: {
    synthesis: "use-cached-patterns",
    embedding: "use-keyword-search",
    nlGeneration: "use-template",
    bottleneck: "use-rule-based",
  },
  errorThresholds: {
    criticalRate: 0.1, // 10% error rate triggers alert
    degradedMode: 0.05, // 5% error rate triggers degraded mode
  },
};

/**
 * MONITORING AND METRICS
 */
export const AI_METRICS_CONFIG = {
  tracking: {
    operations: true,
    latency: true,
    tokens: true,
    costs: true,
    accuracy: true,
  },
  reporting: {
    interval: 60 * 60 * 1000, // Hourly
    aggregations: ["sum", "avg", "p95", "p99"],
    dimensions: ["operation", "model", "status"],
  },
  alerts: {
    costOverrun: 0.8, // Alert at 80% of budget
    latencyThreshold: 5000, // ms
    errorRateThreshold: 0.05,
  },
};

/**
 * SECURITY CONFIGURATIONS
 */
export const AI_SECURITY_CONFIG = {
  dataPrivacy: {
    sanitizePII: true,
    encryptAtRest: true,
    retentionDays: 90,
  },
  apiSecurity: {
    useHttps: true,
    validateCertificates: true,
    rotateKeys: 30, // days
  },
  contentFiltering: {
    enabled: true,
    blockPatterns: ["password", "secret", "key", "token"],
    sanitizePatterns: ["email", "phone", "ssn"],
  },
};

/**
 * HELPER FUNCTIONS
 */
export function getActiveModel(capability: string): AIModelConfig | null {
  return (
    Object.values(AI_MODELS).find((model) =>
      model.capabilities.includes(capability),
    ) || null
  );
}

export function isFeatureEnabled(feature: keyof AIFeatureFlags): boolean {
  return AI_FEATURE_FLAGS[feature] && !!process.env.OPENAI_API_KEY;
}

export function getPromptTemplate(category: string, type: string): string {
  const templates = AI_PROMPTS as Record<string, Record<string, string>>;
  return templates[category]?.[type] || "";
}

export function calculateTokenCost(tokens: number, model: string): number {
  const config = AI_MODELS[model];
  return config ? tokens * config.costPerToken : 0;
}

// All configurations are already exported above with 'export const'

// Response types
export interface AIResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalCost: number;
  };
  model: string;
  provider: string;
  cached: boolean;
  latency: number;
  requestId: string;
}

// Request types
export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  userId: string;
  feature: 'clara' | 'clarity' | 'max' | 'sentinel' | 'generic';
  responseFormat?: 'text' | 'json';
  examples?: Array<{ input: string; output: string }>;
  metadata?: Record<string, any>;
}

// Provider configuration
export interface AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  maxRetries?: number;
  timeout?: number;
}

// Chat types for conversational AI
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest extends Omit<AIRequest, 'prompt'> {
  messages: ChatMessage[];
}

export interface ChatResponse extends AIResponse {
  role: 'assistant';
}

// Image analysis types
export interface ImageAnalysisRequest {
  imageUrl?: string;
  imageBase64?: string;
  prompt: string;
  userId: string;
  feature: string;
}

export interface ImageAnalysisResponse extends AIResponse {
  analysis: {
    labels?: string[];
    text?: string[];
    objects?: Array<{ name: string; confidence: number }>;
    [key: string]: any;
  };
}

// Cost tracking types
export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  provider: string;
  model: string;
}

export interface CostEntry {
  userId: string;
  feature: string;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  provider: string;
  model: string;
  timestamp: Date;
}

export interface UserCosts {
  period: 'day' | 'week' | 'month';
  total: number;
  byFeature: Record<string, {
    cost: number;
    requests: number;
  }>;
}

// Cache types
export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  hitRate: number;
}

export interface CachedResponse extends AIResponse {
  cachedAt: Date;
  expiresAt: Date;
  cacheKey: string;
}

// Monitoring types
export interface PerformanceMetrics {
  requestsPerMinute: number;
  averageLatency: number;
  p95Latency: number;
  errorRate: number;
  activeRequests: number;
}

export interface CostMetrics {
  todayTotal: number;
  projectedMonthly: number;
  byProvider: Record<string, number>;
  byFeature: Record<string, number>;
  costPerUser: number;
}

export interface HealthMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  providers: Record<string, {
    status: 'up' | 'down';
    lastCheck: Date;
    latency: number;
  }>;
  cache: {
    connected: boolean;
    memoryUsage: number;
  };
}

export interface DashboardData {
  performance: PerformanceMetrics;
  costs: CostMetrics;
  cache: CacheStats;
  health: HealthMetrics;
  timestamp: Date;
}

// Feature-specific types
export interface ClaraResponse {
  message: string;
  sentiment: number;
  suggestedActions?: string[];
  emotionalTone: 'supportive' | 'encouraging' | 'calming' | 'celebratory';
  requiresHumanReview: boolean;
}

export interface ClarityCalculation {
  totalValue: number;
  steps: Array<{
    description: string;
    value: number;
    explanation: string;
    sources: string[];
  }>;
  summary: string;
  confidence: number;
  lastUpdated: Date;
}

export interface MaxAnalysis {
  fairnessScore: number;
  marketComparison: {
    low: number;
    median: number;
    high: number;
  };
  redFlags: string[];
  opportunities: string[];
  suggestedCounterOffer?: number;
  negotiationTips: string[];
}

// Error types
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class RateLimitError extends AIServiceError {
  constructor(provider: string, retryAfter?: number) {
    super(
      `Rate limit exceeded for ${provider}`,
      'RATE_LIMIT',
      provider,
      true
    );
  }
}

export class InvalidResponseError extends AIServiceError {
  constructor(provider: string, details: string) {
    super(
      `Invalid response from ${provider}: ${details}`,
      'INVALID_RESPONSE',
      provider,
      false
    );
  }
}

// Note: Legacy types are in ../types.ts file
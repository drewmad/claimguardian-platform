# Phase 0: AI Foundation Layer - Detailed Implementation Plan
*Building the core infrastructure for all AI features*

## Overview
**Duration**: 2 weeks (10 working days)  
**Goal**: Establish robust AI infrastructure that enables rapid feature development  
**Key Outcome**: 40% cost reduction, unified AI interface, production-ready monitoring

---

## Day-by-Day Implementation Plan

### Day 1-2: Package Structure & Base Interfaces

#### Morning Day 1: Project Setup
```bash
# 1. Create package structure
mkdir -p packages/ai-services/src/{providers,orchestrator,cache,monitoring,features,utils,types}
mkdir -p packages/ai-services/tests/{unit,integration}

# 2. Initialize package with TypeScript
cd packages/ai-services
pnpm init
pnpm add -D typescript @types/node vitest @vitest/ui
pnpm add zod dotenv
```

#### Afternoon Day 1: Core Type Definitions
Create `packages/ai-services/src/types/index.ts`:
```typescript
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
```

#### Day 2: Base Provider Interface
Create `packages/ai-services/src/providers/base.provider.ts`:
```typescript
export abstract class BaseAIProvider {
  protected config: AIProviderConfig;
  protected modelMapping: Record<string, string>;
  
  constructor(config: AIProviderConfig) {
    this.config = config;
    this.validateConfig();
  }
  
  abstract generateText(request: AIRequest): Promise<AIResponse>;
  abstract estimateCost(tokens: number, model: string): number;
  abstract validateResponse(response: any): boolean;
  
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
        }
      }
    }
    
    throw lastError!;
  }
  
  protected trackMetrics(start: number, request: AIRequest, response: any): void {
    const latency = Date.now() - start;
    // Emit metrics for monitoring
    console.log(`[${this.constructor.name}] Latency: ${latency}ms`);
  }
}
```

### Day 3-4: Gemini Provider Implementation

#### Day 3: Migrate Existing Gemini Code
Create `packages/ai-services/src/providers/gemini.provider.ts`:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider } from './base.provider';

export class GeminiProvider extends BaseAIProvider {
  private client: GoogleGenerativeAI;
  
  constructor(config: AIProviderConfig) {
    super(config);
    this.client = new GoogleGenerativeAI(config.apiKey);
    
    this.modelMapping = {
      'fast': 'gemini-1.5-flash',
      'balanced': 'gemini-1.5-pro',
      'powerful': 'gemini-1.5-pro'
    };
  }
  
  async generateText(request: AIRequest): Promise<AIResponse> {
    const start = Date.now();
    const model = this.selectModel(request);
    
    try {
      const genAI = this.client.getGenerativeModel({ model });
      
      const prompt = this.buildPrompt(request);
      const result = await this.withRetry(async () => {
        return await genAI.generateContent({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: request.maxTokens || 2048,
            temperature: request.temperature || 0.7,
          }
        });
      });
      
      const response = await result.response;
      const text = response.text();
      const usage = this.extractUsage(result);
      
      this.trackMetrics(start, request, response);
      
      return {
        text,
        usage: {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalCost: this.estimateCost(
            usage.promptTokens + usage.completionTokens,
            model
          )
        },
        model,
        provider: 'gemini',
        cached: false,
        latency: Date.now() - start,
        requestId: crypto.randomUUID()
      };
    } catch (error) {
      this.handleError(error, request);
      throw error;
    }
  }
  
  private selectModel(request: AIRequest): string {
    // Smart model selection based on use case
    if (request.feature === 'clara') {
      return this.modelMapping.balanced; // Good for conversations
    } else if (request.feature === 'clarity') {
      return this.modelMapping.fast; // Fast for calculations
    }
    return this.modelMapping.balanced;
  }
  
  estimateCost(tokens: number, model: string): number {
    // Gemini pricing as of 2024
    const pricing = {
      'gemini-1.5-flash': { input: 0.00001, output: 0.00003 },
      'gemini-1.5-pro': { input: 0.00005, output: 0.00015 }
    };
    
    const modelPricing = pricing[model] || pricing['gemini-1.5-pro'];
    return tokens * modelPricing.input; // Simplified
  }
}
```

#### Day 4: Integration with Existing Code
1. Update existing AI calls to use new provider
2. Create migration guide for existing features
3. Test with current damage-analyzer and policy-chat

### Day 5-6: Caching Layer Implementation

#### Day 5: Cache Infrastructure
Create `packages/ai-services/src/cache/cache.manager.ts`:
```typescript
import { createHash } from 'crypto';
import Redis from 'ioredis';

export class CacheManager {
  private redis: Redis;
  private ttlSeconds: number = 3600; // 1 hour default
  
  constructor(redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL);
  }
  
  async get(request: AIRequest): Promise<AIResponse | null> {
    const key = this.generateCacheKey(request);
    const cached = await this.redis.get(key);
    
    if (cached) {
      const response = JSON.parse(cached) as AIResponse;
      return {
        ...response,
        cached: true
      };
    }
    
    return null;
  }
  
  async set(request: AIRequest, response: AIResponse): Promise<void> {
    const key = this.generateCacheKey(request);
    const ttl = this.calculateTTL(request);
    
    await this.redis.set(
      key,
      JSON.stringify(response),
      'EX',
      ttl
    );
    
    // Track cache metrics
    await this.redis.hincrby('cache:stats', 'sets', 1);
  }
  
  private generateCacheKey(request: AIRequest): string {
    // Create deterministic cache key
    const normalized = {
      prompt: request.prompt.trim().toLowerCase(),
      systemPrompt: request.systemPrompt?.trim().toLowerCase(),
      feature: request.feature,
      temperature: Math.round((request.temperature || 0.7) * 10) / 10,
      maxTokens: request.maxTokens || 2048
    };
    
    const hash = createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex');
      
    return `ai:cache:${request.feature}:${hash}`;
  }
  
  private calculateTTL(request: AIRequest): number {
    // Dynamic TTL based on feature
    const ttlMap = {
      'clarity': 7 * 24 * 60 * 60,  // 7 days - calculations rarely change
      'clara': 60 * 60,              // 1 hour - emotional responses need freshness
      'max': 24 * 60 * 60,           // 24 hours - market data changes daily
      'sentinel': 60 * 60,           // 1 hour - deadlines are time-sensitive
      'generic': 3 * 60 * 60         // 3 hours default
    };
    
    return ttlMap[request.feature] || ttlMap.generic;
  }
  
  async getStats(): Promise<CacheStats> {
    const stats = await this.redis.hgetall('cache:stats');
    return {
      hits: parseInt(stats.hits || '0'),
      misses: parseInt(stats.misses || '0'),
      sets: parseInt(stats.sets || '0'),
      hitRate: this.calculateHitRate(stats)
    };
  }
}
```

#### Day 6: Semantic Caching
Create `packages/ai-services/src/cache/semantic-cache.ts`:
```typescript
export class SemanticCache {
  private embeddings: Map<string, Float32Array> = new Map();
  private similarityThreshold = 0.85;
  
  async findSimilar(
    request: AIRequest,
    threshold: number = this.similarityThreshold
  ): Promise<CachedResponse | null> {
    const embedding = await this.generateEmbedding(request.prompt);
    
    let bestMatch: { key: string; score: number } | null = null;
    
    for (const [key, cached] of this.embeddings) {
      const similarity = this.cosineSimilarity(embedding, cached);
      
      if (similarity > threshold && (!bestMatch || similarity > bestMatch.score)) {
        bestMatch = { key, score: similarity };
      }
    }
    
    if (bestMatch) {
      return await this.redis.get(bestMatch.key);
    }
    
    return null;
  }
  
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
```

### Day 7-8: Cost Tracking & Monitoring

#### Day 7: Cost Tracking System
Create `packages/ai-services/src/monitoring/cost-tracker.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

export class CostTracker {
  private supabase: SupabaseClient;
  private costBuffer: CostEntry[] = [];
  private flushInterval: number = 5000; // 5 seconds
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Start periodic flush
    setInterval(() => this.flush(), this.flushInterval);
  }
  
  async track(userId: string, usage: Usage, feature: string): Promise<void> {
    this.costBuffer.push({
      userId,
      feature,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalCost: usage.totalCost,
      provider: usage.provider,
      model: usage.model,
      timestamp: new Date()
    });
    
    // Flush if buffer is large
    if (this.costBuffer.length > 100) {
      await this.flush();
    }
  }
  
  private async flush(): Promise<void> {
    if (this.costBuffer.length === 0) return;
    
    const entries = [...this.costBuffer];
    this.costBuffer = [];
    
    try {
      // Batch insert to Supabase
      const { error } = await this.supabase
        .from('ai_usage_costs')
        .insert(entries);
        
      if (error) {
        console.error('Failed to track costs:', error);
        // Re-add to buffer for retry
        this.costBuffer.unshift(...entries);
      }
    } catch (error) {
      console.error('Cost tracking error:', error);
      this.costBuffer.unshift(...entries);
    }
  }
  
  async getUserCosts(userId: string, period: 'day' | 'week' | 'month'): Promise<UserCosts> {
    const startDate = this.getPeriodStart(period);
    
    const { data, error } = await this.supabase
      .from('ai_usage_costs')
      .select('feature, sum(total_cost), count(*)')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .group('feature');
      
    if (error) throw error;
    
    return {
      period,
      total: data.reduce((sum, row) => sum + row.sum, 0),
      byFeature: data.reduce((acc, row) => ({
        ...acc,
        [row.feature]: {
          cost: row.sum,
          requests: row.count
        }
      }), {})
    };
  }
}
```

#### Day 8: Monitoring Dashboard
Create `packages/ai-services/src/monitoring/dashboard.ts`:
```typescript
export class AIMonitoring {
  private metrics: MetricsCollector;
  private costTracker: CostTracker;
  private cache: CacheManager;
  
  async getDashboardData(): Promise<DashboardData> {
    const [performance, costs, cache, health] = await Promise.all([
      this.getPerformanceMetrics(),
      this.getCostMetrics(),
      this.getCacheMetrics(),
      this.getHealthMetrics()
    ]);
    
    return {
      performance,
      costs,
      cache,
      health,
      timestamp: new Date()
    };
  }
  
  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return {
      requestsPerMinute: await this.metrics.getRate('ai.requests', '1m'),
      averageLatency: await this.metrics.getAverage('ai.latency', '5m'),
      p95Latency: await this.metrics.getPercentile('ai.latency', 95, '5m'),
      errorRate: await this.metrics.getErrorRate('5m'),
      activeRequests: await this.metrics.getGauge('ai.active_requests')
    };
  }
  
  private async getCostMetrics(): Promise<CostMetrics> {
    const now = new Date();
    const dayStart = new Date(now.setHours(0, 0, 0, 0));
    
    return {
      todayTotal: await this.costTracker.getTotalCost(dayStart, now),
      projectedMonthly: await this.costTracker.getProjectedMonthlyCost(),
      byProvider: await this.costTracker.getCostByProvider('day'),
      byFeature: await this.costTracker.getCostByFeature('day'),
      costPerUser: await this.costTracker.getAverageCostPerUser('day')
    };
  }
}
```

### Day 9-10: Testing & Integration

#### Day 9: Comprehensive Testing
Create `packages/ai-services/tests/unit/orchestrator.test.ts`:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIOrchestrator } from '../../src/orchestrator';

describe('AIOrchestrator', () => {
  let orchestrator: AIOrchestrator;
  
  beforeEach(() => {
    orchestrator = new AIOrchestrator({
      providers: {
        gemini: new MockGeminiProvider(),
      },
      cache: new MockCache(),
      costTracker: new MockCostTracker()
    });
  });
  
  describe('request processing', () => {
    it('should return cached response when available', async () => {
      const request = {
        prompt: 'Calculate claim value',
        feature: 'clarity',
        userId: 'test-user'
      };
      
      const cachedResponse = {
        text: 'Cached calculation',
        cached: true
      };
      
      vi.spyOn(orchestrator.cache, 'get').mockResolvedValue(cachedResponse);
      
      const response = await orchestrator.process(request);
      
      expect(response.cached).toBe(true);
      expect(response.text).toBe('Cached calculation');
    });
    
    it('should handle provider failures with fallback', async () => {
      // Test fallback logic
    });
    
    it('should track costs correctly', async () => {
      // Test cost tracking
    });
  });
});
```

#### Day 10: Integration & Migration
1. **Update Existing Features**:
   - Migrate damage-analyzer to use new AI service
   - Update policy-chat to use orchestrator
   - Ensure backward compatibility

2. **Create Migration Guide**:
```typescript
// Before (old way)
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const result = await model.generateContent(prompt);

// After (new way)
import { aiService } from '@claimguardian/ai-services';

const response = await aiService.process({
  prompt: prompt,
  feature: 'damage-analyzer',
  userId: user.id
});
```

3. **Performance Testing**:
   - Load test with 100 concurrent requests
   - Verify cache hit rates > 30%
   - Ensure latency < 2 seconds

---

## Implementation Checklist

### Week 1 Deliverables
- [ ] AI service package structure created
- [ ] Base provider interface implemented
- [ ] Gemini provider migrated and tested
- [ ] Basic caching layer operational
- [ ] Cost tracking recording all requests

### Week 2 Deliverables
- [ ] Semantic caching improving hit rates
- [ ] Monitoring dashboard showing real-time metrics
- [ ] All tests passing with >80% coverage
- [ ] Existing features migrated to new system
- [ ] Documentation and migration guide complete

### Success Criteria
- [ ] 40% reduction in AI API costs via caching
- [ ] <2 second response time for 95% of requests
- [ ] Zero downtime migration from old system
- [ ] All existing features working with new architecture
- [ ] Cost tracking accurate to $0.001

---

## Daily Standup Questions

1. **What did you complete yesterday?**
2. **What will you work on today?**
3. **Any blockers or concerns?**
4. **Current cache hit rate?**
5. **Yesterday's AI costs?**

---

## Risk Mitigation

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Redis connection issues | High | Fallback to in-memory cache |
| API key exposure | Critical | Use environment variables, never commit |
| Cost overruns | Medium | Set hard limits per user per day |
| Cache poisoning | Medium | Validate all cached responses |

### Rollback Plan
If issues arise:
1. Feature flag to disable new AI service
2. Fallback to direct API calls
3. Clear cache if corrupted
4. Restore from previous git commit

---

## Next Steps After Phase 0

Once foundation is complete:
1. Begin Phase 1 Quick Wins (Clarity Lite, Deadline Guardian)
2. Set up A/B testing for new features
3. Create user feedback collection system
4. Plan Clara emotional support architecture

This detailed plan ensures we build a solid foundation that will support all future AI features while immediately delivering value through cost savings and performance improvements.
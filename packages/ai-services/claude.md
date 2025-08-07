# AI Services Package - Claude.md

## Overview

The `@claimguardian/ai-services` package provides unified AI orchestration with multi-provider support, cost tracking, semantic caching, and monitoring capabilities.

## Architecture

- **Multi-Provider Support**: OpenAI GPT-4, Google Gemini Pro 1.5
- **AI Orchestrator**: Smart routing based on task complexity and cost
- **Semantic Caching**: Vector similarity matching for 40% cost reduction
- **Cost Tracking**: Token usage and expense monitoring per user/feature
- **Monitoring Dashboard**: Real-time AI operation visibility

## Key Components

### AI Orchestrator

```typescript
import { AIOrchestrator } from "@claimguardian/ai-services";

const orchestrator = new AIOrchestrator({
  providers: {
    openai: new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }),
    gemini: new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY }),
  },
  cache: new SemanticCache(),
  costTracker: new CostTracker(),
});

// Smart provider selection
const result = await orchestrator.processTask({
  type: "damage-analysis",
  input: { images: imageFiles },
  preferences: { cost: "optimize", speed: "fast" },
});
```

### Provider Pattern

```typescript
// All providers implement BaseProvider
export abstract class BaseProvider {
  abstract processText(
    prompt: string,
    options?: ProcessOptions,
  ): Promise<AIResult>;
  abstract processVision(
    prompt: string,
    images: string[],
    options?: ProcessOptions,
  ): Promise<AIResult>;
  abstract estimateCost(input: AIInput): Promise<CostEstimate>;
}

// OpenAI implementation
export class OpenAIProvider extends BaseProvider {
  async processVision(prompt: string, images: string[]) {
    const response = await this.client.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...images.map((img) => ({
              type: "image_url",
              image_url: { url: img },
            })),
          ],
        },
      ],
    });
    return this.formatResponse(response);
  }
}
```

### Semantic Cache

```typescript
// Vector-based similarity matching
export class SemanticCache {
  async get(
    key: string,
    threshold: number = 0.85,
  ): Promise<CacheResult | null> {
    const embedding = await this.generateEmbedding(key);
    const similar = await this.findSimilar(embedding, threshold);
    return similar;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    const embedding = await this.generateEmbedding(key);
    await this.store({
      key,
      value,
      embedding,
      expires: Date.now() + ttl * 1000,
    });
  }
}
```

## Service Features

### Claim Assistant

```typescript
import { ClaimAssistant } from "@claimguardian/ai-services";

const assistant = new ClaimAssistant({
  provider: "openai",
  model: "gpt-4",
});

const guidance = await assistant.getStepByStepGuidance({
  damageType: "water",
  propertyType: "residential",
  policyDetails: userPolicy,
});
```

### Document Extractor

```typescript
import { DocumentExtractor } from "@claimguardian/ai-services";

const extractor = new DocumentExtractor();

const extractedData = await extractor.extractInsuranceData({
  document: policyPDF,
  type: "policy",
  schema: "florida-homeowners",
});
```

### Cost Tracking

```typescript
// Automatic cost tracking across all operations
const costTracker = new CostTracker({
  trackingLevel: "detailed",
  alertThresholds: {
    daily: 100,
    monthly: 1000,
  },
});

// View costs by user, feature, or time period
const costs = await costTracker.getCosts({
  userId: "user-123",
  period: "last-30-days",
  groupBy: "feature",
});
```

## Specialized Services

### Clarity Service

Transparent claim calculation and explanation service.

```typescript
const clarity = new ClarityService();

const calculation = await clarity.calculateClaimValue({
  damageAssessment: aiAnalysis,
  policyTerms: userPolicy,
  marketData: propertyComps,
});
// Returns detailed breakdown with explanations
```

### Sentinel Service

Deadline monitoring and alert system.

```typescript
const sentinel = new SentinelService();

await sentinel.monitorDeadlines({
  claimId: "claim-123",
  deadlines: policyDeadlines,
  notificationPreferences: userPrefs,
});
```

### Document Categorizer

Automatic document classification and organization.

```typescript
const categorizer = new DocumentCategorizerService();

const categories = await categorizer.categorizeDocuments({
  documents: uploadedFiles,
  claimType: "property-damage",
});
// Returns organized document structure
```

## Performance Optimization

### Caching Strategy

- **Semantic Similarity**: 85% threshold for cache hits
- **TTL Configuration**: 1 hour for analysis, 24 hours for static data
- **Cache Invalidation**: Based on document updates or policy changes

### Provider Selection

```typescript
// Automatic provider selection based on:
const selection = await orchestrator.selectProvider({
  taskType: "vision-analysis",
  factors: {
    cost: 0.3, // Cost optimization weight
    speed: 0.4, // Response time weight
    accuracy: 0.3, // Quality weight
  },
});
```

### Parallel Processing

```typescript
// Process multiple tasks concurrently
const results = await orchestrator.processBatch([
  { type: "damage-analysis", input: images1 },
  { type: "document-extraction", input: policy },
  { type: "market-comparison", input: propertyData },
]);
```

## Testing

### Unit Tests

```typescript
// packages/ai-services/src/__tests__/
describe("AIOrchestrator", () => {
  it("should initialize with providers", () => {
    const orchestrator = new AIOrchestrator({
      providers: { mock: mockProvider },
    });
    expect(orchestrator).toBeInstanceOf(AIOrchestrator);
  });
});
```

### Integration Tests

- Simplified to avoid timeout issues
- Focus on provider initialization and basic functionality
- Full integration tests run in dedicated CI environment

## Error Handling

### Provider Fallbacks

```typescript
const orchestrator = new AIOrchestrator({
  providers: {
    primary: openaiProvider,
    fallback: geminiProvider,
  },
  fallbackStrategy: "cascade",
});

// Automatically falls back if primary provider fails
const result = await orchestrator.processTask(task);
```

### Rate Limiting

- Built-in rate limiting per provider
- Queue management for burst requests
- Automatic retry with exponential backoff

## Monitoring & Analytics

### Dashboard Metrics

- Token usage by provider, user, feature
- Response times and success rates
- Cost trends and budget alerts
- Cache hit rates and performance

### Logging

```typescript
// Structured logging for all AI operations
logger.info("AI task completed", {
  taskType: "damage-analysis",
  provider: "openai",
  duration: 2300,
  tokens: 1500,
  cost: 0.023,
  cacheHit: false,
});
```

## Configuration

### Environment Variables

```bash
# AI Provider Keys
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# Cache Configuration
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# Cost Limits
DAILY_COST_LIMIT=100
MONTHLY_COST_LIMIT=1000
```

### Feature Flags

```typescript
const features = {
  semanticCache: true,
  costTracking: true,
  providerFallback: true,
  batchProcessing: false,
};
```

## Dependencies

- `openai ^4.73.0` - OpenAI API client
- `@google/generative-ai ^0.24.1` - Gemini API client
- `redis` - Semantic caching backend
- `vitest ^3.2.4` - Testing framework

## Build Configuration

```json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "test": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts"
  }
}
```

## Usage Examples

### Basic AI Processing

```typescript
import { AIOrchestrator } from "@claimguardian/ai-services";

// Initialize with providers
const ai = new AIOrchestrator(config);

// Process damage analysis
const analysis = await ai.analyzeDamage({
  images: [image1, image2],
  policyContext: userPolicy,
});

// Extract document data
const extracted = await ai.extractDocument({
  document: policyPDF,
  type: "homeowners-policy",
});
```

### Advanced Features

```typescript
// With cost optimization
const result = await ai.processWithBudget({
  task: damageAnalysisTask,
  maxCost: 0.5,
  fallbackStrategy: "reduce-quality",
});

// Batch processing
const results = await ai.processBatch(tasks, {
  concurrency: 3,
  failFast: false,
});
```

## Migration Guide

See `MIGRATION_GUIDE.md` for upgrading from previous versions and adapting to the new unified architecture.

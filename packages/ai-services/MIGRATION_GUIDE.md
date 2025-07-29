# AI Services Migration Guide

This guide helps you migrate from the existing AI implementation to the new unified AI service architecture.

## Quick Start

### Before (Old Implementation)
```typescript
import { GeminiProvider } from '@claimguardian/ai-services/providers/gemini';

const provider = new GeminiProvider(process.env.GEMINI_API_KEY);
const response = await provider.generateText(prompt, context);

if (response.success) {
  console.log(response.data);
}
```

### After (New Implementation)
```typescript
import { GeminiProvider, AIRequest } from '@claimguardian/ai-services';

const provider = new GeminiProvider({
  apiKey: process.env.GEMINI_API_KEY!
});

const request: AIRequest = {
  prompt: prompt,
  userId: user.id,
  feature: 'damage-analyzer', // Specify which feature is using AI
  metadata: context
};

const response = await provider.generateText(request);
console.log(response.text);
```

## Key Changes

### 1. Structured Request Objects
All AI requests now use typed request objects instead of loose parameters:

```typescript
// Old
await provider.generateText(prompt, context);

// New
await provider.generateText({
  prompt,
  userId: user.id,
  feature: 'clara',
  systemPrompt: 'You are a helpful assistant',
  temperature: 0.7,
  maxTokens: 2048
});
```

### 2. Consistent Response Format
Responses now include usage metrics and cost tracking:

```typescript
interface AIResponse {
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
```

### 3. Error Handling
Errors are now typed and include retry information:

```typescript
try {
  const response = await provider.generateText(request);
} catch (error) {
  if (error instanceof AIServiceError) {
    console.log('Provider:', error.provider);
    console.log('Retryable:', error.retryable);
    
    if (error.code === 'RATE_LIMIT') {
      // Wait and retry
    }
  }
}
```

## Migrating Existing Features

### Damage Analyzer
```typescript
// Before
const result = await provider.analyzeImage(imageUrl, prompt);

// After
const result = await provider.analyzeImage({
  imageUrl,
  prompt,
  userId: user.id,
  feature: 'damage-analyzer'
});

// Access structured analysis
console.log(result.analysis.labels);
console.log(result.usage.totalCost);
```

### Policy Chat
```typescript
// Before
const result = await provider.extractDocument(fileUrl, prompt);

// After (using chat for conversations)
const result = await provider.chat({
  messages: [
    { role: 'system', content: 'You are a policy expert' },
    { role: 'user', content: prompt }
  ],
  userId: user.id,
  feature: 'policy-chat'
});
```

## Using the AI Orchestrator (Coming Soon)

Once the orchestrator is implemented, you won't need to manage providers directly:

```typescript
import { aiService } from '@claimguardian/ai-services';

// The orchestrator handles:
// - Provider selection
// - Caching
// - Cost tracking
// - Fallbacks
const response = await aiService.process({
  prompt: 'Analyze this claim',
  feature: 'clara',
  userId: user.id
});
```

## Environment Variables

Update your `.env` file:
```bash
# Required
GEMINI_API_KEY=your-key-here

# Optional (for future providers)
OPENAI_API_KEY=your-key-here
ANTHROPIC_API_KEY=your-key-here

# Redis for caching (optional)
REDIS_URL=redis://localhost:6379
```

## Testing

The new architecture includes comprehensive testing:

```bash
# Run tests
cd packages/ai-services
pnpm test

# Run with coverage
pnpm test:coverage
```

## Next Steps

1. Update imports in your existing code
2. Add user IDs to all AI requests
3. Specify the feature for each request
4. Handle the new error types
5. Monitor costs using the usage data

## Support

If you encounter issues during migration:
1. Check the type definitions in `src/types/index.ts`
2. Review test examples in `tests/unit/`
3. Look at the base provider for available methods
# AI Services Usage Examples

## Quick Start

### Basic Text Generation
```typescript
import { aiService } from '@claimguardian/ai-services';

// Simple text generation
const response = await aiService.process({
  prompt: 'Explain hurricane deductibles in simple terms',
  userId: user.id,
  feature: 'clarity'
});

console.log(response.text);
console.log(`Cost: $${response.usage.totalCost.toFixed(4)}`);
console.log(`Cached: ${response.cached}`);
```

### Clara - Emotional Support
```typescript
// Emotional support conversation
const claraResponse = await aiService.process({
  prompt: userMessage,
  systemPrompt: `You are Clara, an empathetic AI companion helping homeowners through insurance claims.
    Be supportive, understanding, and provide actionable next steps.`,
  userId: user.id,
  feature: 'clara',
  temperature: 0.8, // More creative/empathetic
  responseFormat: 'json'
});

const { message, suggestedActions, emotionalTone } = JSON.parse(claraResponse.text);
```

### Max - Settlement Analysis
```typescript
// Analyze settlement offer
const maxResponse = await aiService.process({
  prompt: `Analyze this settlement offer: ${offerDetails}
    Property damage: ${damageAmount}
    Offer amount: ${settlementOffer}
    Location: ${propertyLocation}`,
  userId: user.id,
  feature: 'max',
  temperature: 0.3, // More analytical/consistent
});

console.log(maxResponse.text);
```

### Chat Conversations
```typescript
// Multi-turn conversation
const chatResponse = await aiService.chat({
  messages: [
    { role: 'system', content: 'You are a helpful insurance claim assistant' },
    { role: 'user', content: 'My roof was damaged in the hurricane' },
    { role: 'assistant', content: 'I understand your roof was damaged...' },
    { role: 'user', content: 'What should I do first?' }
  ],
  userId: user.id,
  feature: 'clara'
});

console.log(chatResponse.text);
```

### Image Analysis
```typescript
// Analyze damage photo
const analysisResponse = await aiService.analyzeImage({
  imageUrl: damagePhotoUrl,
  prompt: 'Identify and describe the visible damage in this photo',
  userId: user.id,
  feature: 'damage-analyzer'
});

console.log(analysisResponse.analysis);
```

## Monitoring & Cost Management

### Check User Costs
```typescript
// Get user's AI usage costs
const costs = await aiService.getUserCosts(user.id, 'month');

console.log(`Total this month: $${costs.total.toFixed(2)}`);
console.log('By feature:', costs.byFeature);
```

### View Dashboard
```typescript
// Get monitoring dashboard
const dashboard = await aiService.getDashboard();

console.log(`Cache hit rate: ${(dashboard.cache.hitRate * 100).toFixed(1)}%`);
console.log(`Today's cost: $${dashboard.costs.todayTotal.toFixed(2)}`);
console.log(`Avg latency: ${dashboard.performance.averageLatency}ms`);
```

### Cache Management
```typescript
// Check cache performance
const cacheStats = await aiService.getCacheStats();
console.log(`Cache hits: ${cacheStats.hits}`);
console.log(`Hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);

// Clear cache if needed
await aiService.clearCache();
```

## Advanced Usage

### Custom Temperature and Tokens
```typescript
const response = await aiService.process({
  prompt: 'Generate a detailed claim summary',
  userId: user.id,
  feature: 'generic',
  temperature: 0.5,      // 0-1, higher = more creative
  maxTokens: 4096,       // Maximum response length
  examples: [            // Few-shot examples
    {
      input: 'Roof damage from wind',
      output: 'Wind-related roof damage typically includes...'
    }
  ]
});
```

### Error Handling
```typescript
try {
  const response = await aiService.process(request);
} catch (error) {
  if (error.code === 'RATE_LIMIT') {
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, 5000));
    const response = await aiService.process(request);
  } else if (error.code === 'NO_PROVIDER') {
    // All providers are down
    console.error('AI services unavailable');
  }
}
```

### Provider Status Check
```typescript
// Check which providers are available
const status = await aiService.getProviderStatus();
console.log('Provider status:', status);
// { gemini: true, openai: false, claude: false }
```

## Environment Variables

```bash
# Required
GEMINI_API_KEY=your-gemini-api-key

# Optional
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-claude-key

# Redis for caching (optional but recommended)
REDIS_URL=redis://localhost:6379

# Supabase for cost tracking
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Configuration
AI_CACHE_ENABLED=true          # Enable/disable caching
AI_SEMANTIC_CACHE=true         # Use semantic similarity caching
AI_DEFAULT_PROVIDER=gemini     # Default provider
```

## Performance Tips

1. **Use appropriate features** - Each feature has optimized settings
   - `clara`: Empathetic responses, higher temperature
   - `clarity`: Factual calculations, lower temperature
   - `max`: Analytical reasoning, balanced settings

2. **Leverage caching** - Responses are cached based on:
   - Exact prompt match (standard cache)
   - Semantic similarity (if enabled)
   - Feature-specific TTLs

3. **Monitor costs** - Track usage to optimize:
   ```typescript
   // Add to your middleware
   app.use(async (req, res, next) => {
     const costs = await aiService.getUserCosts(req.user.id, 'day');
     if (costs.total > 10) { // $10 daily limit
       return res.status(429).json({ error: 'Daily AI limit reached' });
     }
     next();
   });
   ```

4. **Batch when possible** - Process multiple requests together
5. **Use appropriate models** - The orchestrator automatically selects optimal models

## Troubleshooting

### Cache not working
```bash
# Check Redis connection
redis-cli ping
# Should return: PONG

# Check cache stats
const stats = await aiService.getCacheStats();
console.log(stats);
```

### High costs
- Enable caching: `AI_CACHE_ENABLED=true`
- Use semantic cache: `AI_SEMANTIC_CACHE=true`
- Monitor feature usage
- Set user limits

### Slow responses
- Check provider status
- Monitor latency metrics
- Consider using faster models for time-sensitive features
- Ensure Redis is running for caching
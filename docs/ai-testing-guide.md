# ClaimGuardian AI Features Testing Guide

## Overview

ClaimGuardian uses multiple AI providers to power its property intelligence features. This guide covers testing and validating all AI integrations.

## Features & AI Models

### 🤖 AI Features by Provider

| Feature | Primary Model | Fallback | Status |
|---------|---------------|----------|---------|
| **Damage Analyzer** | OpenAI GPT-4 Vision | Gemini Vision | ✅ Ready |
| **Policy Advisor** | OpenAI GPT-4 | Gemini Pro | ✅ Ready |
| **Inventory Scanner** | OpenAI GPT-4 | Gemini Pro | ✅ Ready |
| **Document Processor** | OpenAI GPT-4 | Gemini Pro | ✅ Ready |
| **3D Model Generator** | OpenAI GPT-4 | Gemini Pro | 🚧 Dev |

### 🔑 Required API Keys

Set these environment variables:

```bash
# Required for core features
export OPENAI_API_KEY="sk-your-openai-key"
export GEMINI_API_KEY="your-gemini-key"

# Optional for advanced features
export ANTHROPIC_API_KEY="your-claude-key"
export XAI_API_KEY="your-grok-key"
```

## Testing Methods

### 1. Automated Test Suite

Run the comprehensive test suite:

```bash
# Basic functionality test
node scripts/test-ai-features.js

# Full feature test (requires TypeScript setup)
pnpm test:ai
```

### 2. Manual Feature Testing

#### Damage Analyzer Testing
1. Navigate to `/ai-tools/damage-analyzer`
2. Upload a test image (roof damage, water damage, etc.)
3. Verify AI analysis includes:
   - Damage type identification
   - Severity scoring (1-10)
   - Repair cost estimates
   - Priority recommendations

#### Policy Advisor Testing
1. Go to `/ai-tools/policy-chat`
2. Upload a sample policy document (PDF)
3. Ask questions like:
   - "What's my hurricane deductible?"
   - "Am I adequately covered for flooding?"
   - "What additional coverage should I consider?"

#### Inventory Scanner Testing
1. Visit `/ai-tools/inventory-scanner`
2. Use barcode scanner or manual entry
3. Test with various item types:
   - Electronics (TVs, computers)
   - Jewelry (rings, watches)
   - Appliances (refrigerator, washer)
4. Verify value estimation accuracy

## Test Results Interpretation

### ✅ Success Criteria
- Response time < 5 seconds for chat
- Response time < 15 seconds for vision analysis
- Accurate damage identification (>80%)
- Reasonable cost estimates (within 20% of manual estimates)
- Proper JSON formatting for structured responses

### ⚠️ Warning Signs
- Response time > 10 seconds consistently
- Generic or irrelevant responses
- API rate limiting errors
- Cost per request > $0.10

### ❌ Failure Indicators
- API authentication errors
- No response or timeout errors
- Completely inaccurate damage assessment
- Inappropriate or harmful content

## Production Monitoring

### Key Metrics to Track

1. **Response Time**: Average AI response time per feature
2. **Success Rate**: % of successful AI requests
3. **Cost Management**: Daily AI spend per feature
4. **User Satisfaction**: Ratings and feedback on AI responses

### Alert Thresholds

```javascript
const AI_MONITORING_THRESHOLDS = {
  responseTime: 8000, // 8 seconds max
  successRate: 95,    // 95% minimum success rate
  dailyCost: 50,      // $50 daily budget per feature
  errorRate: 5        // 5% maximum error rate
};
```

## Troubleshooting

### Common Issues

1. **"API key not configured"**
   - Verify environment variables are set
   - Check key format (starts with correct prefix)
   - Ensure keys have appropriate permissions

2. **"Rate limit exceeded"**
   - Implement exponential backoff (already included)
   - Consider upgrading API plan
   - Add request queuing for high traffic

3. **"Invalid response format"**
   - Check provider API changes
   - Update response parsing logic
   - Add fallback error handling

4. **Vision analysis fails**
   - Verify image format (JPEG, PNG supported)
   - Check image size limits (< 20MB)
   - Ensure base64 encoding is correct

### Debug Mode

Enable debug logging:

```bash
export NEXT_PUBLIC_DEBUG_AI=true
pnpm dev
```

This will show detailed AI request/response logs in the browser console.

## Cost Optimization

### Best Practices

1. **Prompt Engineering**: Shorter prompts = lower costs
2. **Response Limits**: Set appropriate max_tokens
3. **Caching**: Cache common responses when possible
4. **Fallback Strategy**: Use cheaper models for simple tasks

### Estimated Costs (Per Request)

| Feature | OpenAI Cost | Gemini Cost | Notes |
|---------|-------------|-------------|-------|
| Damage Analysis | $0.08 | $0.02 | Vision processing |
| Policy Chat | $0.03 | $0.01 | Text analysis |
| Inventory Scan | $0.02 | $0.01 | Product recognition |
| Document Processing | $0.05 | $0.015 | Text extraction |

## Feature-Specific Testing

### Damage Analyzer Deep Test

```bash
# Test with various damage types
curl -X POST /api/ai/analyze-image \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64_image_data",
    "prompt": "Analyze roof damage severity",
    "model": "openai"
  }'
```

### Policy Advisor Integration Test

```bash
# Test policy document processing
curl -X POST /api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a Florida insurance expert"},
      {"role": "user", "content": "Analyze this policy for hurricane coverage gaps"}
    ],
    "model": "openai"
  }'
```

## Performance Benchmarks

### Response Time Targets
- **Chat Features**: < 3 seconds average
- **Vision Analysis**: < 10 seconds average
- **Document Processing**: < 15 seconds average

### Accuracy Targets
- **Damage Detection**: > 85% accuracy
- **Cost Estimation**: Within 25% of professional estimate
- **Policy Analysis**: > 90% relevant responses

## Security Considerations

1. **API Key Security**
   - Never commit keys to repository
   - Use environment variables only
   - Rotate keys quarterly

2. **Data Privacy**
   - No sensitive data in prompts
   - Audit AI provider data retention
   - Implement data scrubbing for logs

3. **Input Validation**
   - Sanitize all user inputs
   - Validate image formats and sizes
   - Check for prompt injection attempts

## Continuous Improvement

### A/B Testing Framework

1. Test different models for same feature
2. Compare response quality metrics
3. Monitor user satisfaction scores
4. Optimize based on cost/performance ratio

### Model Updates

- Monitor for new model releases
- Test beta models in development environment
- Gradual rollout of model updates
- Fallback to stable models if issues arise

---

**Last Updated**: August 7, 2025  
**Next Review**: September 7, 2025  
**Maintainer**: AI Team (@ai-team)
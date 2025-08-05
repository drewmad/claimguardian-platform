# Claude Learning System - LLM Integration

## Overview

This directory contains the LLM-powered features for the Claude Learning System. All structural components are complete and ready for implementation when Claude 3 Opus becomes available.

## Architecture

### Core Services

1. **LLM Learning Synthesis** (`llm-learning-synthesis.ts`)
   - Automatically identifies meta-patterns from multiple learnings
   - Analyzes learning clusters for pattern emergence
   - Generates pattern hierarchies
   - Predicts pattern evolution

2. **Semantic Similarity** (`semantic-similarity.ts`)
   - Intelligent pattern matching using embeddings
   - Finds semantically similar learnings
   - Detects duplicates and suggests merges
   - Clusters related learnings

3. **Natural Language Generator** (`natural-language-generator.ts`)
   - Creates human-readable descriptions
   - Generates executive summaries
   - Produces documentation from patterns
   - Translates technical content

4. **AI Bottleneck Resolver** (`bottleneck-resolver.ts`)
   - Identifies performance bottlenecks
   - Analyzes root causes
   - Generates resolution roadmaps
   - Predicts impact of changes

5. **Auto-Fix Service** (`auto-fix-service.ts`)
   - Scans for auto-fixable issues
   - Applies fixes with safety checks
   - Supports batch operations
   - Includes rollback capability

## Implementation Status

All services follow this pattern:

```typescript
class ServiceName {
  // Full interface implementation
  async methodName(params: TypedParams): Promise<TypedResult> {
    // TODO: Implement with Opus
    throw new Error('Feature requires Opus model. Implementation pending.')
  }
  
  // Statistics and monitoring ready
  getStats(): ServiceStats {
    // Working implementation
  }
}

// Singleton instance ready
export const serviceName = new ServiceName(config)
```

## Usage (When Activated)

```typescript
import { 
  llmLearningSynthesis,
  semanticSimilarityService,
  naturalLanguageGenerator,
  aiBottleneckResolver,
  autoFixService 
} from '@claimguardian/claude/llm-integration'

// Synthesize patterns
const patterns = await llmLearningSynthesis.synthesizeMetaPatterns({
  learnings: recentLearnings,
  minConfidence: 0.8
})

// Find similar patterns
const matches = await semanticSimilarityService.findSimilar({
  query: currentTask,
  candidates: availablePatterns,
  threshold: 0.7
})

// Generate documentation
const docs = await naturalLanguageGenerator.generateDocumentation(
  patterns,
  'markdown'
)

// Analyze bottlenecks
const analysis = await aiBottleneckResolver.analyzeBottlenecks({
  metrics: performanceMetrics,
  learnings: allLearnings,
  patterns: allPatterns,
  timeframe: 'week'
})

// Apply auto-fixes
const fixes = await autoFixService.scanForFixCandidates(
  files,
  highConfidencePatterns
)
```

## Configuration

### Environment Variables

```bash
# Required when Opus is available
ANTHROPIC_API_KEY=your-api-key
CLAUDE_MODEL=claude-3-opus
CLAUDE_MAX_TOKENS=4096
CLAUDE_TEMPERATURE=0.7

# Feature flags
ENABLE_LLM_SYNTHESIS=true
ENABLE_SEMANTIC_MATCHING=true
ENABLE_AUTO_FIX=false  # Requires explicit enablement
```

### Service Configuration

Each service can be configured independently:

```typescript
// Custom LLM provider
const customSynthesis = new LLMLearningynthesis({
  name: 'anthropic',
  model: 'claude-3-opus',
  maxTokens: 8192,
  temperature: 0.5
})

// Auto-fix with strict settings
const strictAutoFix = new AutoFixService({
  enableAutoFix: true,
  confidenceThreshold: 0.98,
  requireApproval: true,
  allowedCategories: ['security'],
  maxChangesPerRun: 5,
  testBeforeFix: true
})
```

## Integration Points

### With Core Learning System

```typescript
// In claude-complete-learning-system.ts
async applyLearning(task: string) {
  // Find similar learnings using LLM
  const similar = await semanticSimilarityService.findSimilar({
    query: task,
    candidates: this.learnings
  })
  
  // Apply the most relevant
  return this.applyBestMatch(similar[0])
}
```

### With Production Monitor

```typescript
// In claude-production-monitor.ts
async generateInsights() {
  // Analyze bottlenecks
  const bottlenecks = await aiBottleneckResolver.analyzeBottlenecks({
    metrics: this.currentMetrics,
    learnings: this.recentLearnings,
    patterns: this.activePatterns,
    timeframe: 'day'
  })
  
  // Generate natural language summary
  return naturalLanguageGenerator.generateExecutiveSummary(
    bottlenecks.recommendations,
    { audience: 'manager' }
  )
}
```

## Testing

### Unit Tests (Ready)

```typescript
// When Opus is available
describe('LLM Integration', () => {
  it('should synthesize meta-patterns', async () => {
    const patterns = await llmLearningSynthesis.synthesizeMetaPatterns({
      learnings: testLearnings
    })
    expect(patterns).toHaveLength(greaterThan(0))
    expect(patterns[0].confidence).toBeGreaterThan(0.7)
  })
})
```

### Integration Tests (Prepared)

```bash
# Run when Opus is available
npm run claude:test-llm

# Specific service tests
npm run claude:test-llm:synthesis
npm run claude:test-llm:similarity
npm run claude:test-llm:nlg
npm run claude:test-llm:bottleneck
npm run claude:test-llm:autofix
```

## Monitoring

Each service includes built-in monitoring:

```typescript
// Get synthesis statistics
const synthStats = llmLearningSynthesis.getSynthesisStats()
console.log(`Synthesized ${synthStats.totalSynthesized} patterns`)
console.log(`Average confidence: ${synthStats.averageConfidence}`)

// Get similarity cache performance
const simStats = semanticSimilarityService.getSimilarityStats()
console.log(`Cache hit rate: ${simStats.cacheHitRate}`)

// Get auto-fix success rate
const fixStats = autoFixService.getFixStats()
console.log(`Success rate: ${fixStats.successRate}`)
```

## Security Considerations

1. **API Key Management**
   - Store in environment variables only
   - Never commit to version control
   - Rotate regularly

2. **Auto-Fix Safety**
   - High confidence threshold (0.95+)
   - Mandatory test runs
   - Approval workflow for production
   - Comprehensive rollback

3. **Data Privacy**
   - No sensitive data in prompts
   - Local embedding cache
   - Audit trail for all operations

## Performance Optimization

1. **Caching Strategy**
   - Embedding cache for similarity
   - Template cache for NLG
   - Analysis cache for bottlenecks

2. **Batch Operations**
   - Group similar requests
   - Parallel processing where safe
   - Rate limiting compliance

3. **Token Management**
   - Optimize prompt length
   - Stream responses when possible
   - Monitor usage and costs

## Roadmap

### Phase 1: Core Implementation (Opus Required)
- [ ] Implement all service methods
- [ ] Add comprehensive error handling
- [ ] Create integration tests
- [ ] Deploy to staging

### Phase 2: Advanced Features
- [ ] Multi-model support (GPT-4, Gemini)
- [ ] Custom fine-tuning
- [ ] Real-time learning updates
- [ ] Distributed processing

### Phase 3: Enterprise Features
- [ ] Team-specific models
- [ ] Compliance controls
- [ ] Advanced analytics
- [ ] API access for external tools

## Troubleshooting

### Common Issues

1. **"Opus model required" errors**
   - Ensure ANTHROPIC_API_KEY is set
   - Verify Opus access is enabled
   - Check API quota limits

2. **Performance issues**
   - Review token usage
   - Check cache hit rates
   - Consider batch operations

3. **Unexpected results**
   - Verify input data quality
   - Check confidence thresholds
   - Review prompt templates

## Contributing

When implementing LLM features:

1. Follow existing patterns
2. Include comprehensive types
3. Add monitoring/stats methods
4. Write integration tests
5. Document token usage
6. Consider failure modes

## Support

- Internal: AI Team (#ai-team on Slack)
- Documentation: This README + inline JSDoc
- Monitoring: claude:monitor command
- Issues: GitHub issues with 'llm-integration' label
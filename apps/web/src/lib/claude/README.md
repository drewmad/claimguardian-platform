# Claude Learning System

This system enables Claude to log errors, learn from mistakes, and improve performance over time through intelligent context analysis and pattern recognition.

## Overview

The Claude Learning System consists of four main components:

1. **Error Logging** (`claude-error-logger.ts`) - Captures and categorizes Claude errors
2. **Database Schema** (`supabase/schema.sql`) - Stores errors and learnings persistently
3. **Learning Context** (`claude-learning-context.ts`) - Provides pre-task analysis and recommendations
4. **Dashboard** (`claude-learning-dashboard.tsx`) - Visualizes learning progress and patterns

## Quick Start

### 1. Log an Error

```typescript
import { claudeErrorHelpers } from '@/lib/claude/claude-error-logger'

// Log a code generation error
try {
  // Code that might fail
} catch (error) {
  await claudeErrorHelpers.codeGeneration.syntaxError(
    error,
    'src/components/MyComponent.tsx',
    'typescript',
    'Generate React component with props validation'
  )
}
```

### 2. Get Learning Context Before Tasks

```typescript
import { claudeLearningContext } from '@/lib/claude/claude-learning-context'

const analysis = await claudeLearningContext.analyzeTask({
  taskType: 'code-generation',
  description: 'Create TypeScript interface',
  codeLanguage: 'typescript',
  framework: 'react',
  tools: ['Write', 'Edit'],
  userIntent: 'Type-safe component props'
})

console.log(`Risk Level: ${analysis.riskLevel}`)
console.log(`Estimated Success: ${analysis.estimatedSuccessRate * 100}%`)
```

### 3. Resolve Errors with Learnings

```typescript
import { claudeErrorLogger } from '@/lib/claude/claude-error-logger'

// Mark error as resolved and record what we learned
await claudeErrorLogger.resolveError(
  errorId,
  'Added proper null checking before array operations',
  'Always validate data exists before using array methods like .map()'
)
```

## Features

### 🎯 Intelligent Error Categorization
- **Task Types**: code-generation, file-modification, debugging, analysis, planning
- **Error Types**: syntax, logic, type, runtime, build, deployment, integration
- **Severity Levels**: low, medium, high, critical

### 🧠 Learning Pattern Recognition
- Automatically identifies recurring mistake patterns
- Builds confidence scores based on solution success rates
- Context-aware learning retrieval using tags

### 📊 Performance Analytics
- Error resolution rates over time
- Most common mistake patterns
- Learning effectiveness metrics
- Success rate predictions

### 🔍 Pre-Task Context Analysis
- Risk assessment based on historical patterns
- Actionable recommendations from past learnings
- Common mistakes to avoid
- Suggested approaches for similar tasks

## Database Schema

The system uses two main tables:

### `claude_errors`
```sql
- id: Unique error identifier
- error_message: The error message
- context: JSON context (task type, tools used, etc.)
- severity: Error severity level
- resolved: Whether error has been resolved
- resolution_method: How the error was fixed
```

### `claude_learnings`
```sql
- pattern_name: Unique learning pattern identifier
- mistake_pattern: What went wrong
- solution_pattern: Correct approach
- context_tags: Tags for matching similar contexts
- confidence_score: How confident we are in this learning
- success_rate: Success rate when applied
```

## API Functions

### Error Logging Functions

```typescript
// Basic error logging
await claudeErrorLogger.logError(error, context, severity)

// Specialized helpers
await claudeErrorHelpers.codeGeneration.syntaxError(error, filePath, language, description)
await claudeErrorHelpers.fileModification.editError(error, filePath, description, tools)
await claudeErrorHelpers.analysis.misunderstanding(description, userIntent, category)
```

### Learning Functions

```typescript
// Get relevant learnings
const learnings = await claudeErrorLogger.getRelevantLearnings(context)

// Record new learning
await claudeErrorLogger.recordLearning(patternName, mistake, solution, tags, confidence)

// Analyze error patterns
const patterns = await claudeErrorLogger.getErrorPatterns('week')
```

### Context Analysis Functions

```typescript
// Analyze task before execution
const analysis = await claudeLearningContext.analyzeTask(taskContext)

// Wrap functions with learning context
const smartFunction = withLearningContext(taskContext, originalFunction)
```

## Integration Examples

### 1. Wrap Critical Functions

```typescript
import { withLearningContext } from '@/lib/claude/claude-learning-context'

const generateComponent = withLearningContext({
  taskType: 'code-generation',
  description: 'Generate React component',
  codeLanguage: 'typescript',
  framework: 'react',
  tools: ['Write'],
  userIntent: 'Create reusable UI component'
}, async (componentName: string) => {
  // Component generation logic
})
```

### 2. React Hook Integration

```typescript
import { useLearningContext } from '@/lib/claude/claude-learning-context'

function MyComponent() {
  const { analysis, loading } = useLearningContext({
    taskType: 'code-generation',
    description: 'Render component with learning context',
    // ... other context
  })

  if (analysis?.riskLevel === 'high') {
    // Show warnings or additional validation
  }
}
```

### 3. Development Workflow

```typescript
import { checkClaudeLearningsBeforeTask } from '@/lib/claude/claude-integration-example'

// Before starting any coding task
const learnings = await checkClaudeLearningsBeforeTask('code-generation', {
  language: 'typescript',
  framework: 'react'
})

// Apply the learnings to avoid previous mistakes
```

## Dashboard Usage

Add the dashboard to your admin interface:

```typescript
import { ClaudeLearningDashboard } from '@/components/admin/claude-learning-dashboard'

function AdminPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <ClaudeLearningDashboard />
    </div>
  )
}
```

## Best Practices

### 1. Log All Significant Errors
- Always log errors that require manual intervention
- Include full context about what you were trying to accomplish
- Use appropriate severity levels

### 2. Resolve Errors with Learning
- When you fix an error, always call `resolveError()` with the solution
- Include lessons learned for future reference
- Be specific about what went wrong and how to avoid it

### 3. Check Context Before Complex Tasks
- Use `claudeLearningContext.analyzeTask()` before risky operations
- Pay attention to risk levels and warnings
- Apply actionable recommendations

### 4. Monitor Learning Progress
- Regularly review the dashboard for patterns
- Focus on improving low-resolution-rate patterns
- Update learning confidence based on real-world results

## Advanced Features

### Custom Learning Patterns

```typescript
// Create domain-specific learning patterns
await claudeErrorLogger.recordLearning(
  'supabase-rls-policy-creation',
  'Creating RLS policies without proper user context checks',
  'Always include auth.uid() checks and test with different user roles',
  ['task:database', 'framework:supabase', 'security:rls'],
  0.95
)
```

### Batch Error Analysis

```typescript
// Analyze patterns across time ranges
const weeklyPatterns = await claudeErrorLogger.getErrorPatterns('week')
const monthlyPatterns = await claudeErrorLogger.getErrorPatterns('month')

// Compare trends
const improving = weeklyPatterns.filter(p =>
  monthlyPatterns.find(m => m.pattern === p.pattern)?.resolved < p.resolved
)
```

### Learning Validation

```typescript
// Update learning success rates based on real usage
await updateClaudeLearningSuccess(learningId, wasSuccessful)
```

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure Supabase is properly configured
2. **Missing Context**: Always provide full task context for better learning
3. **Cache Issues**: Learning cache automatically expires after 5 minutes

### Debug Mode

Enable debug logging to see learning context in action:

```typescript
// This will log analysis results to console
const analysis = await claudeLearningContext.analyzeTask(context)
```

## Contributing

When adding new error types or learning patterns:

1. Update the type definitions in `claude-error-logger.ts`
2. Add appropriate helper functions
3. Update the database schema if needed
4. Add tests for new functionality

## Performance Considerations

- Learning cache automatically expires to prevent memory leaks
- Database queries are optimized with indexes on key fields
- Context history is limited to last 50 tasks per session
- Recommendations are limited to top 10 most relevant

The system is designed to have minimal performance impact while providing maximum learning benefit for Claude's continuous improvement.

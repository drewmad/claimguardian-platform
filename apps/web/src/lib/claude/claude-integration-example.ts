/**
 * @fileMetadata
 * @purpose Example integration of Claude error logging for learning and improvement
 * @owner ai-team
 * @dependencies ["@/lib/claude/claude-error-logger"]
 * @exports ["integrateClaudeErrorLogging", "example usage patterns"]
 * @complexity medium
 * @tags ["claude", "integration", "example", "learning"]
 * @status active
 */

import { claudeErrorLogger, claudeErrorHelpers } from './claude-error-logger'

/**
 * Example: How to integrate Claude error logging into development workflow
 * 
 * This file demonstrates best practices for using the Claude error logging system
 * to help Claude learn from mistakes and improve over time.
 */

// ================================================================
// USAGE EXAMPLES
// ================================================================

/**
 * Example 1: Logging a code generation error
 */
export async function exampleCodeGenerationError() {
  try {
    // Simulate a code generation task that fails
    throw new Error("TypeError: Cannot read property 'map' of undefined")
  } catch (error) {
    // Log the error with full context
    const errorId = await claudeErrorHelpers.codeGeneration.syntaxError(
      error as Error,
      'src/components/ClaimsList.tsx',
      'typescript',
      'Generate claims list component with filtering'
    )
    
    console.log('Claude error logged:', errorId)
    
    // Later, when we fix the error, mark it as resolved
    await claudeErrorLogger.resolveError(
      errorId!,
      'Added proper null check: claims?.map() instead of claims.map()',
      'Always check for null/undefined before calling array methods'
    )
  }
}

/**
 * Example 2: Learning from file modification errors
 */
export async function exampleFileModificationError() {
  try {
    // Simulate editing a file incorrectly
    throw new Error("Edit failed: old_string not found in file")
  } catch (error) {
    const errorId = await claudeErrorHelpers.fileModification.editError(
      error as Error,
      'src/actions/claims.ts',
      'Fix createClaim function signature',
      ['Edit', 'Read']
    )
    
    // Mark as resolved with the correct approach
    await claudeErrorLogger.resolveError(
      errorId!,
      'Read the file first to see exact whitespace and formatting before editing',
      'Always use Read tool before Edit to understand file structure'
    )
  }
}

/**
 * Example 3: Analysis misunderstanding
 */
export async function exampleAnalysisError() {
  const errorId = await claudeErrorHelpers.analysis.misunderstanding(
    'Analyze user requirements for claim processing',
    'Build automated claim approval system',
    'assumed-automation-needed'
  )
  
  await claudeErrorLogger.resolveError(
    errorId!,
    'Ask clarifying questions about automation scope and human oversight requirements',
    'Never assume automation level - always clarify with user first'
  )
}

/**
 * Example 4: Checking for relevant learnings before starting a task
 */
export async function exampleLearningRetrieval() {
  // Before starting a React component generation task
  const learnings = await claudeErrorLogger.getRelevantLearnings({
    taskType: 'code-generation',
    errorType: 'syntax',
    codeLanguage: 'typescript',
    framework: 'react'
  })
  
  console.log('Relevant learnings for React TypeScript component generation:')
  learnings.forEach(learning => {
    console.log(`- ${learning.pattern_name}: ${learning.solution_pattern}`)
  })
  
  // Use these learnings to avoid previous mistakes
  if (learnings.length > 0) {
    console.log('Applying previous learnings to avoid common mistakes...')
  }
}

/**
 * Example 5: Comprehensive error logging with full context
 */
export async function exampleComprehensiveError() {
  try {
    // Simulate a complex task failure
    throw new Error("Build failed: Type 'unknown' is not assignable to type 'string'")
  } catch (error) {
    const errorId = await claudeErrorLogger.logError(
      error as Error,
      {
        taskType: 'code-generation',
        taskDescription: 'Create TypeScript interface for Claims API response',
        userIntent: 'Type-safe API integration',
        filePath: 'src/types/claims.ts',
        fileType: 'typescript',
        codeLanguage: 'typescript',
        framework: 'next.js',
        errorType: 'type',
        toolsUsed: ['Write', 'Edit', 'Read'],
        mistakeCategory: 'type-assumption',
        previousAttempts: 2,
        codebaseContext: {
          framework: 'next.js',
          languages: ['typescript', 'javascript'],
          packages: ['@supabase/supabase-js', 'zod'],
          patterns: ['server-actions', 'type-safe-apis']
        }
      },
      'high'
    )
    
    // Record the learning when resolved
    await claudeErrorLogger.resolveError(
      errorId!,
      'Use proper type assertions and check API response structure with Read tool first',
      'Always validate API response types before creating interfaces'
    )
  }
}

/**
 * Example 6: Pattern analysis and insights
 */
export async function examplePatternAnalysis() {
  // Get error patterns for the last week
  const patterns = await claudeErrorLogger.getErrorPatterns('week')
  
  console.log('Most common Claude error patterns:')
  patterns.forEach(pattern => {
    console.log(`
      Pattern: ${pattern.pattern}
      Occurrences: ${pattern.count}
      Resolution Rate: ${pattern.resolved}/${pattern.count}
      Severity Distribution: ${JSON.stringify(pattern.severity)}
    `)
  })
}

/**
 * Example 7: Recording a successful application of learning
 */
export async function exampleSuccessfulLearningApplication() {
  // When we successfully apply a learning, record it
  await claudeErrorLogger.recordLearning(
    'react-component-props-validation',
    'Creating React components without proper prop type validation',
    'Always define interfaces for props and use TypeScript for validation',
    ['task:code-generation', 'lang:typescript', 'framework:react'],
    0.9 // High confidence
  )
}

// ================================================================
// INTEGRATION HELPERS
// ================================================================

/**
 * Wrapper function to catch and log Claude errors automatically
 */
export function withClaudeErrorLogging<T extends (...args: any[]) => Promise<any>>(
  taskType: string,
  taskDescription: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      // Auto-log the error
      await claudeErrorLogger.logError(
        error as Error,
        {
          taskType: taskType as any,
          taskDescription,
          userIntent: 'Complete task successfully',
          errorType: 'runtime',
          toolsUsed: ['unknown'],
          mistakeCategory: 'uncaught-error'
        },
        'medium'
      )
      throw error // Re-throw to maintain original behavior
    }
  }) as T
}

/**
 * Hook for React components to track Claude-generated code issues
 */
export function useClaudeErrorTracking(componentName: string, codeContext: any) {
  const logComponentError = async (error: Error, action: string) => {
    await claudeErrorLogger.logError(error, {
      taskType: 'code-generation',
      taskDescription: `${componentName} component ${action}`,
      userIntent: 'Create working React component',
      filePath: `src/components/${componentName}.tsx`,
      fileType: 'typescript',
      codeLanguage: 'typescript',
      framework: 'react',
      errorType: 'runtime',
      toolsUsed: ['Write', 'Edit'],
      mistakeCategory: 'component-error',
      codebaseContext: codeContext
    })
  }
  
  return { logComponentError }
}

// ================================================================
// DEVELOPMENT WORKFLOW INTEGRATION
// ================================================================

/**
 * Function to check for learnings before starting any task
 */
export async function checkClaudeLearningsBeforeTask(
  taskType: string,
  context: {
    language?: string
    framework?: string
    errorType?: string
  }
) {
  const learnings = await claudeErrorLogger.getRelevantLearnings({
    taskType: taskType as any,
    errorType: context.errorType as any,
    framework: context.framework,
    codeLanguage: context.language
  })
  
  if (learnings.length > 0) {
    console.log(`🧠 Found ${learnings.length} relevant Claude learnings for this task:`)
    learnings.forEach(learning => {
      console.log(`  • ${learning.pattern_name}: ${learning.solution_pattern}`)
    })
    return learnings
  }
  
  return []
}

/**
 * Development helper to show Claude's learning progress
 */
export async function showClaudeLearningStats() {
  const patterns = await claudeErrorLogger.getErrorPatterns('month')
  const totalErrors = patterns.reduce((sum, p) => sum + p.count, 0)
  const totalResolved = patterns.reduce((sum, p) => sum + p.resolved, 0)
  
  console.log(`
🤖 Claude Learning Statistics (Last 30 days):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Errors: ${totalErrors}
Resolved: ${totalResolved}
Resolution Rate: ${((totalResolved / totalErrors) * 100).toFixed(1)}%

Top Error Patterns:
${patterns.slice(0, 5).map(p => 
  `  • ${p.pattern}: ${p.count} occurrences (${p.resolved} resolved)`
).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `)
}
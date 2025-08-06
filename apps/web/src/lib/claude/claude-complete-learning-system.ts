/**
 * @fileMetadata
 * @purpose "Complete Claude learning system integration - errors, learning, and self-reflection"
 * @owner ai-team
 * @dependencies ["claude-error-logger", "claude-learning-context", "claude-self-reflection", "claude-reflection-triggers"]
 * @exports ["ClaudeCompleteLearningSystem", "withCompleteLearning", "completeLearningSystem"]
 * @complexity high
 * @tags ["claude", "complete-system", "integration", "meta-learning", "continuous-improvement"]
 * @status stable
 */

import { claudeErrorLogger, ClaudeErrorContext } from './claude-error-logger'
import { claudeLearningContext } from './claude-learning-context'
import { claudeSelfReflection } from './claude-self-reflection'
import { reflectionTriggers, autoReflect } from './claude-reflection-triggers'
import { logger } from '@/lib/logger'

export interface CompleteLearningContext {
  // Task identification
  taskId: string
  taskType: ClaudeErrorContext['taskType']
  description: string
  userIntent: string
  originalRequest: string
  
  // Learning context
  filePath?: string
  codeLanguage?: string
  framework?: string
  complexity: 'simple' | 'medium' | 'complex'
  
  // Execution tracking
  startTime: number
  tools: string[]
  constraints: string[]
  
  // Reflection settings
  enableAutoReflection: boolean
  reflectionSensitivity: 'low' | 'medium' | 'high'
}

export interface LearningSystemResult {
  taskId: string
  success: boolean
  result?: unknown
  error?: Error
  
  // Learning insights
  preTaskLearnings: unknown[]
  errorsLogged: string[]
  reflectionTriggered: boolean
  improvementInsights: string[]
  
  // Performance metrics
  executionTime: number
  efficiencyScore: number
  learningApplicationScore: number
}

class ClaudeCompleteLearningSystem {
  private activeLearningContexts: Map<string, CompleteLearningContext> = new Map()
  
  /**
   * Initialize complete learning system for a task
   */
  async initializeLearning(
    taskType: ClaudeErrorContext['taskType'],
    description: string,
    userIntent: string,
    originalRequest: string,
    options: {
      filePath?: string
      codeLanguage?: string
      framework?: string
      complexity?: 'simple' | 'medium' | 'complex'
      tools?: string[]
      constraints?: string[]
      enableAutoReflection?: boolean
      reflectionSensitivity?: 'low' | 'medium' | 'high'
    } = {}
  ): Promise<CompleteLearningContext> {
    const taskId = `complete-learning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const context: CompleteLearningContext = {
      taskId,
      taskType,
      description,
      userIntent,
      originalRequest,
      filePath: options.filePath,
      codeLanguage: options.codeLanguage,
      framework: options.framework,
      complexity: options.complexity || this.determineComplexity(description, taskType),
      startTime: Date.now(),
      tools: options.tools || [],
      constraints: options.constraints || [],
      enableAutoReflection: options.enableAutoReflection ?? true,
      reflectionSensitivity: options.reflectionSensitivity || 'medium'
    }
    
    // Store active context
    this.activeLearningContexts.set(taskId, context)
    
    // Get pre-task learnings
    const learningAnalysis = await claudeLearningContext.analyzeTask({
      taskType,
      description,
      userIntent,
      filePath: context.filePath,
      codeLanguage: context.codeLanguage,
      framework: context.framework,
      tools: context.tools
    })
    
    // Start reflection tracking if enabled
    if (context.enableAutoReflection) {
      const validTaskType = taskType === 'other' ? 'analysis' : taskType
      reflectionTriggers.startTaskTracking(validTaskType as any, context.complexity)
    }
    
    // Display learning insights
    this.displayLearningInsights(learningAnalysis, context)
    
    logger.info('Complete learning system initialized', {
      taskId,
      taskType,
      riskLevel: learningAnalysis.riskLevel,
      recommendationCount: learningAnalysis.recommendations.length
    })
    
    return context
  }
  
  /**
   * Execute a function with complete learning system integration
   */
  async executeWithLearning<T>(
    context: CompleteLearningContext,
    fn: () => Promise<T>
  ): Promise<LearningSystemResult> {
    let result: T | undefined
    let error: Error | undefined
    const errorsLogged: string[] = []
    let reflectionTriggered = false
    
    try {
      // Execute the function with comprehensive monitoring
      if (context.enableAutoReflection) {
        // Use auto-reflection wrapper
        const validTaskType = context.taskType === 'other' ? 'analysis' : context.taskType
        const wrappedFn = autoReflect(validTaskType as any, context.complexity, fn)
        result = await wrappedFn()
      } else {
        // Execute without reflection
        result = await fn()
      }
      
      // Complete successful execution
      await this.completeSuccessfulExecution(context)
      
    } catch (executionError) {
      error = executionError instanceof Error ? executionError : new Error(String(executionError))
      
      // Log error to learning system
      const errorId = await this.logExecutionError(context, error)
      if (errorId) {
        errorsLogged.push(errorId)
      }
      
      // Trigger reflection on error
      if (context.enableAutoReflection) {
        reflectionTriggered = await reflectionTriggers.completeTaskTracking(false)
      }
    }
    
    // Calculate final metrics
    const executionTime = Date.now() - context.startTime
    const metrics = await this.calculateFinalMetrics(context, !!error, executionTime)
    
    // Clean up context
    this.activeLearningContexts.delete(context.taskId)
    
    const learningResult: LearningSystemResult = {
      taskId: context.taskId,
      success: !error,
      result,
      error,
      preTaskLearnings: [], // Would store from pre-task analysis
      errorsLogged,
      reflectionTriggered,
      improvementInsights: [], // Would populate from reflection results
      executionTime,
      efficiencyScore: metrics.efficiencyScore,
      learningApplicationScore: metrics.learningApplicationScore
    }
    
    logger.info('Complete learning system execution finished', {
      taskId: context.taskId,
      success: !error,
      executionTime,
      efficiencyScore: metrics.efficiencyScore
    })
    
    return learningResult
  }
  
  /**
   * Log tool usage during execution
   */
  logToolUsage(taskId: string, tool: string, purpose: string) {
    const context = this.activeLearningContexts.get(taskId)
    if (!context) return
    
    if (!context.tools.includes(tool)) {
      context.tools.push(tool)
    }
    
    // Log to reflection triggers
    reflectionTriggers.logToolUsage(tool)
    
    logger.debug('Tool usage logged', { taskId, tool, purpose })
  }
  
  /**
   * Log a step taken during execution
   */
  logStep(taskId: string, step: string, reasoning: string) {
    const context = this.activeLearningContexts.get(taskId)
    if (!context) return
    
    // Log to reflection system
    if (context.enableAutoReflection) {
      claudeSelfReflection.logStep(step, reasoning)
      reflectionTriggers.logStep()
    }
    
    logger.debug('Step logged', { taskId, step })
  }
  
  /**
   * Log an error during execution
   */
  async logError(
    taskId: string, 
    error: Error, 
    errorType: ClaudeErrorContext['errorType'],
    mistakeCategory: string
  ): Promise<string | null> {
    const context = this.activeLearningContexts.get(taskId)
    if (!context) return null
    
    // Log to error logger
    const errorId = await claudeErrorLogger.logError(error, {
      taskType: context.taskType,
      taskDescription: context.description,
      userIntent: context.userIntent,
      filePath: context.filePath,
      codeLanguage: context.codeLanguage,
      framework: context.framework,
      errorType,
      toolsUsed: context.tools,
      mistakeCategory
    })
    
    // Log to reflection system
    if (context.enableAutoReflection) {
      claudeSelfReflection.logError(error.message)
      reflectionTriggers.logError()
    }
    
    logger.warn('Error logged to learning system', { taskId, errorId, errorType })
    return errorId
  }
  
  /**
   * Resolve an error with learning
   */
  async resolveError(
    errorId: string,
    resolutionMethod: string,
    lessonLearned: string
  ): Promise<void> {
    await claudeErrorLogger.resolveError(errorId, resolutionMethod, lessonLearned)
    logger.info('Error resolved with learning', { errorId, resolutionMethod })
  }
  
  /**
   * Get learning recommendations for active task
   */
  async getLearningRecommendations(taskId: string): Promise<any[]> {
    const context = this.activeLearningContexts.get(taskId)
    if (!context) return []
    
    return await claudeErrorLogger.getRelevantLearnings({
      taskType: context.taskType,
      codeLanguage: context.codeLanguage,
      framework: context.framework
    })
  }
  
  /**
   * Get comprehensive learning statistics
   */
  async getLearningStats(): Promise<{
    totalErrors: number
    resolutionRate: number
    learningPatterns: number
    reflectionsStoday: number
    efficiencyTrend: 'improving' | 'stable' | 'declining'
    topImprovementAreas: string[]
  }> {
    const errorPatterns = await claudeErrorLogger.getErrorPatterns('week')
    const reflectionStats = claudeSelfReflection.getReflectionStats()
    const triggerStats = reflectionTriggers.getTriggerStats()
    
    const totalErrors = errorPatterns.reduce((sum, p) => sum + p.count, 0)
    const totalResolved = errorPatterns.reduce((sum, p) => sum + p.resolved, 0)
    const resolutionRate = totalErrors > 0 ? (totalResolved / totalErrors) * 100 : 0
    
    return {
      totalErrors,
      resolutionRate,
      learningPatterns: reflectionStats.totalReflections,
      reflectionsStoday: 0, // Would need daily tracking
      efficiencyTrend: reflectionStats.averageEfficiency > 75 ? 'improving' : 'stable',
      topImprovementAreas: reflectionStats.topInsightCategories
    }
  }
  
  // Private helper methods
  private determineComplexity(
    description: string,
    taskType: ClaudeErrorContext['taskType']
  ): 'simple' | 'medium' | 'complex' {
    const complexKeywords = ['integration', 'migration', 'architecture', 'refactor', 'multiple systems']
    const mediumKeywords = ['modify', 'enhance', 'update', 'fix bug', 'add feature']
    
    const lowerDesc = description.toLowerCase()
    
    if (taskType === 'planning' || complexKeywords.some(k => lowerDesc.includes(k))) {
      return 'complex'
    }
    
    if (mediumKeywords.some(k => lowerDesc.includes(k))) {
      return 'medium'
    }
    
    return 'simple'
  }
  
  private displayLearningInsights(analysis: any, context: CompleteLearningContext) {
    console.log(`\n🧠 Claude Learning Analysis for ${context.taskType}:`)
    console.log(`   Risk Level: ${analysis.riskLevel || 'unknown'}`)
    console.log(`   Success Estimate: ${((analysis.estimatedSuccessRate || 0) * 100).toFixed(1)}%`)
    
    if (analysis.recommendations?.length > 0) {
      console.log('   📋 Key Recommendations:')
      analysis.recommendations.slice(0, 3).forEach((rec: any) => {
        console.log(`     • ${rec.category?.toUpperCase() || 'GENERAL'}: ${rec.summary?.substring(0, 100) || 'No summary'}...`)
      })
    }
    
    if (analysis.warnings?.length > 0) {
      console.log('   ⚠️  Warnings:')
      analysis.warnings.slice(0, 2).forEach((warning: string) => {
        console.log(`     • ${warning}`)
      })
    }
    
    console.log(`   💡 Suggested Approach: ${analysis.suggestedApproach?.substring(0, 100)}...`)
    console.log('')
  }
  
  private async completeSuccessfulExecution(context: CompleteLearningContext) {
    if (context.enableAutoReflection) {
      await reflectionTriggers.completeTaskTracking(true)
    }
  }
  
  private async logExecutionError(context: CompleteLearningContext, error: Error): Promise<string | null> {
    return await claudeErrorLogger.logError(error, {
      taskType: context.taskType,
      taskDescription: context.description,
      userIntent: context.userIntent,
      filePath: context.filePath,
      codeLanguage: context.codeLanguage,
      framework: context.framework,
      errorType: 'runtime',
      toolsUsed: context.tools,
      mistakeCategory: 'execution-failure'
    })
  }
  
  private async calculateFinalMetrics(
    context: CompleteLearningContext,
    hadError: boolean,
    executionTime: number
  ): Promise<{
    efficiencyScore: number
    learningApplicationScore: number
  }> {
    // Simple efficiency calculation based on time and complexity
    const expectedTime = this.getExpectedTimeForComplexity(context.complexity)
    const timeEfficiency = Math.max(0, Math.min(1, expectedTime / executionTime))
    
    // Tool efficiency
    const expectedTools = this.getExpectedToolsForTask(context.taskType)
    const toolEfficiency = Math.max(0, Math.min(1, expectedTools / context.tools.length))
    
    // Error penalty
    const errorPenalty = hadError ? 0.3 : 0
    
    const efficiencyScore = Math.round(((timeEfficiency + toolEfficiency) / 2 - errorPenalty) * 100)
    
    // Learning application score (placeholder)
    const learningApplicationScore = Math.round((1 - errorPenalty) * 80) // Would be more sophisticated
    
    return {
      efficiencyScore: Math.max(0, efficiencyScore),
      learningApplicationScore: Math.max(0, learningApplicationScore)
    }
  }
  
  private getExpectedTimeForComplexity(complexity: 'simple' | 'medium' | 'complex'): number {
    switch (complexity) {
      case 'simple': return 1 * 60 * 1000 // 1 minute
      case 'medium': return 3 * 60 * 1000 // 3 minutes
      case 'complex': return 10 * 60 * 1000 // 10 minutes
    }
  }
  
  private getExpectedToolsForTask(taskType: ClaudeErrorContext['taskType']): number {
    switch (taskType) {
      case 'code-generation': return 2 // Write, maybe Read
      case 'file-modification': return 3 // Read, Edit, maybe Grep
      case 'debugging': return 4 // Read, Grep, Edit, maybe Bash
      case 'analysis': return 3 // Read, Grep, maybe Glob
      case 'planning': return 2 // Read, maybe Write
      default: return 3
    }
  }
}

// Export singleton instance
export const completeLearningSystem = new ClaudeCompleteLearningSystem()

/**
 * Higher-order function for complete learning integration
 */
export function withCompleteLearning<T extends (...args: unknown[]) => Promise<any>>(
  taskType: ClaudeErrorContext['taskType'],
  description: string,
  userIntent: string,
  originalRequest: string,
  options: {
    filePath?: string
    codeLanguage?: string
    framework?: string
    complexity?: 'simple' | 'medium' | 'complex'
    tools?: string[]
    enableAutoReflection?: boolean
  } = {},
  fn: T
): T {
  return (async (...args: unknown[]) => {
    // Initialize complete learning system
    const context = await completeLearningSystem.initializeLearning(
      taskType,
      description,
      userIntent,
      originalRequest,
      options
    )
    
    // Execute with learning integration
    const result = await completeLearningSystem.executeWithLearning(context, async () => {
      return await fn(...args)
    })
    
    if (result.error) {
      throw result.error
    }
    
    return result.result
  }) as T
}

/**
 * Quick learning wrapper for common tasks
 */
export const quickLearn = {
  codeGeneration: <T extends (...args: unknown[]) => Promise<any>>(
    description: string,
    filePath: string,
    language: string,
    fn: T
  ) => withCompleteLearning(
    'code-generation',
    description,
    'Generate working code',
    description,
    { filePath, codeLanguage: language, complexity: 'medium' },
    fn
  ),
  
  fileModification: <T extends (...args: unknown[]) => Promise<any>>(
    description: string,
    filePath: string,
    fn: T
  ) => withCompleteLearning(
    'file-modification',
    description,
    'Modify file correctly',
    description,
    { filePath, complexity: 'simple', tools: ['Read', 'Edit'] },
    fn
  ),
  
  debugging: <T extends (...args: unknown[]) => Promise<any>>(
    description: string,
    filePath: string,
    fn: T
  ) => withCompleteLearning(
    'debugging',
    description,
    'Fix the issue',
    description,
    { filePath, complexity: 'medium', tools: ['Read', 'Grep', 'Edit'] },
    fn
  ),
  
  analysis: <T extends (...args: unknown[]) => Promise<any>>(
    description: string,
    fn: T
  ) => withCompleteLearning(
    'analysis',
    description,
    'Understand and analyze',
    description,
    { complexity: 'simple', tools: ['Read', 'Grep'] },
    fn
  )
}
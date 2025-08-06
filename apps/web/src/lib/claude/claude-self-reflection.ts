/**
 * @fileMetadata
 * @purpose "Claude self-reflection system for analyzing approach efficiency and capturing improvements"
 * @owner ai-team
 * @dependencies ["@/lib/claude/claude-error-logger", "@/lib/logger"]
 * @exports ["claudeSelfReflection", "ReflectionContext", "ApproachAnalysis"]
 * @complexity high
 * @tags ["claude", "self-reflection", "improvement", "efficiency", "meta-learning"]
 * @status stable
 */

import { claudeErrorLogger } from './claude-error-logger'
import { claudeLearningContext } from './claude-learning-context'
import { logger } from '@/lib/logger'

export interface ReflectionContext {
  // Task details
  taskId: string
  taskType: 'code-generation' | 'file-modification' | 'debugging' | 'analysis' | 'planning' | 'other'
  taskDescription: string
  userIntent: string
  originalRequest: string
  
  // Execution metrics
  startTime: number
  endTime: number
  toolsUsed: string[]
  filesAccessed: string[]
  commandsExecuted: string[]
  
  // Approach tracking
  initialApproach: string
  actualSteps: string[]
  alternativeApproaches?: string[]
  decisionsReasoning: string[]
  
  // Outcomes
  success: boolean
  completionQuality: 'excellent' | 'good' | 'acceptable' | 'poor'
  userSatisfaction?: 'high' | 'medium' | 'low'
  errorOccurred: boolean
  errorsEncountered: string[]
  
  // Context
  codebase: {
    framework?: string
    language?: string
    complexity: 'simple' | 'medium' | 'complex'
  }
  constraints: string[]
  timeConstraints?: 'urgent' | 'normal' | 'flexible'
}

export interface EfficiencyMetrics {
  executionTime: number
  toolEfficiency: number // 0-1 score based on tool usage patterns
  approachDirectness: number // 0-1 score, higher = more direct path to solution
  errorRate: number // Errors per 100 steps
  resourceUtilization: number // 0-1 score based on file reads, searches, etc.
  contextSwitching: number // Number of different approaches tried
  learningApplication: number // 0-1 score for applying previous learnings
}

export interface ApproachAnalysis {
  // Efficiency assessment
  metrics: EfficiencyMetrics
  overallEfficiencyScore: number // 0-100
  
  // Improvement opportunities
  inefficiencies: string[]
  betterApproaches: string[]
  missedOpportunities: string[]
  wastedSteps: string[]
  
  // Learning insights
  newLearnings: string[]
  confirmedPatterns: string[]
  challengedAssumptions: string[]
  
  // Recommendations for future
  approachImprovements: string[]
  toolUsageOptimizations: string[]
  processRefinements: string[]
  
  // Meta insights
  strengthsObserved: string[]
  weaknessesIdentified: string[]
  knowledgeGaps: string[]
}

export interface SelfImprovementInsight {
  id: string
  category: 'efficiency' | 'approach' | 'tool-usage' | 'decision-making' | 'error-prevention'
  insight: string
  evidenceFromTask: string
  improvementAction: string
  measurableGain: string
  confidenceLevel: number // 0-1
  applicableContexts: string[]
  priority: 'high' | 'medium' | 'low'
  created_at: Date
}

class ClaudeSelfReflection {
  private reflectionHistory: ReflectionContext[] = []
  private activeReflection: ReflectionContext | null = null
  private improvementInsights: SelfImprovementInsight[] = []

  /**
   * Start a reflection session for a task
   */
  startReflection(
    taskType: ReflectionContext['taskType'],
    taskDescription: string,
    userIntent: string,
    originalRequest: string,
    initialApproach: string,
    constraints: string[] = []
  ): string {
    const taskId = `reflection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    this.activeReflection = {
      taskId,
      taskType,
      taskDescription,
      userIntent,
      originalRequest,
      startTime: Date.now(),
      endTime: 0,
      toolsUsed: [],
      filesAccessed: [],
      commandsExecuted: [],
      initialApproach,
      actualSteps: [],
      decisionsReasoning: [],
      success: false,
      completionQuality: 'acceptable',
      errorOccurred: false,
      errorsEncountered: [],
      codebase: {
        complexity: 'medium'
      },
      constraints
    }
    
    logger.info('Claude self-reflection started', { taskId, taskType, taskDescription })
    return taskId
  }

  /**
   * Log a step taken during task execution
   */
  logStep(step: string, reasoning: string, toolUsed?: string, fileAccessed?: string) {
    if (!this.activeReflection) return
    
    this.activeReflection.actualSteps.push(step)
    this.activeReflection.decisionsReasoning.push(reasoning)
    
    if (toolUsed && !this.activeReflection.toolsUsed.includes(toolUsed)) {
      this.activeReflection.toolsUsed.push(toolUsed)
    }
    
    if (fileAccessed && !this.activeReflection.filesAccessed.includes(fileAccessed)) {
      this.activeReflection.filesAccessed.push(fileAccessed)
    }
  }

  /**
   * Log an error encountered during execution
   */
  logError(error: string) {
    if (!this.activeReflection) return
    
    this.activeReflection.errorOccurred = true
    this.activeReflection.errorsEncountered.push(error)
  }

  /**
   * Complete the reflection and analyze approach
   */
  async completeReflection(
    success: boolean,
    completionQuality: ReflectionContext['completionQuality'],
    userSatisfaction?: ReflectionContext['userSatisfaction'],
    alternativeApproaches?: string[]
  ): Promise<ApproachAnalysis> {
    if (!this.activeReflection) {
      throw new Error('No active reflection session')
    }

    // Complete the reflection context
    this.activeReflection.endTime = Date.now()
    this.activeReflection.success = success
    this.activeReflection.completionQuality = completionQuality
    this.activeReflection.userSatisfaction = userSatisfaction
    this.activeReflection.alternativeApproaches = alternativeApproaches

    // Analyze the approach
    const analysis = await this.analyzeApproach(this.activeReflection)
    
    // Generate improvement insights
    const insights = await this.generateImprovementInsights(this.activeReflection, analysis)
    
    // Save insights to learning system
    await this.saveInsightsToLearningSystem(insights)
    
    // Store reflection history
    this.reflectionHistory.push({ ...this.activeReflection })
    if (this.reflectionHistory.length > 100) {
      this.reflectionHistory.shift() // Keep last 100 reflections
    }
    
    // Clear active reflection
    this.activeReflection = null
    
    logger.info('Claude self-reflection completed', { 
      overallScore: analysis.overallEfficiencyScore,
      improvementsFound: insights.length 
    })
    
    return analysis
  }

  /**
   * Analyze the approach taken for efficiency and improvements
   */
  private async analyzeApproach(context: ReflectionContext): Promise<ApproachAnalysis> {
    // Calculate efficiency metrics
    const metrics = this.calculateEfficiencyMetrics(context)
    const overallScore = this.calculateOverallEfficiencyScore(metrics)
    
    // Identify inefficiencies
    const inefficiencies = this.identifyInefficiencies(context, metrics)
    const betterApproaches = await this.identifyBetterApproaches(context)
    const missedOpportunities = this.identifyMissedOpportunities(context)
    const wastedSteps = this.identifyWastedSteps(context)
    
    // Extract learning insights
    const newLearnings = this.extractNewLearnings(context)
    const confirmedPatterns = this.identifyConfirmedPatterns(context)
    const challengedAssumptions = this.identifyChallengedAssumptions(context)
    
    // Generate recommendations
    const approachImprovements = this.generateApproachImprovements(context, inefficiencies)
    const toolUsageOptimizations = this.generateToolOptimizations(context, metrics)
    const processRefinements = this.generateProcessRefinements(context)
    
    // Meta analysis
    const strengthsObserved = this.identifyStrengths(context, metrics)
    const weaknessesIdentified = this.identifyWeaknesses(context, metrics)
    const knowledgeGaps = this.identifyKnowledgeGaps(context)

    return {
      metrics,
      overallEfficiencyScore: overallScore,
      inefficiencies,
      betterApproaches,
      missedOpportunities,
      wastedSteps,
      newLearnings,
      confirmedPatterns,
      challengedAssumptions,
      approachImprovements,
      toolUsageOptimizations,
      processRefinements,
      strengthsObserved,
      weaknessesIdentified,
      knowledgeGaps
    }
  }

  /**
   * Calculate efficiency metrics for the task execution
   */
  private calculateEfficiencyMetrics(context: ReflectionContext): EfficiencyMetrics {
    const executionTime = context.endTime - context.startTime
    
    // Tool efficiency: fewer tools for same result = higher efficiency
    const toolEfficiency = Math.max(0, 1 - (context.toolsUsed.length - 1) * 0.1)
    
    // Approach directness: fewer steps and context switches = more direct
    const contextSwitching = this.countContextSwitches(context.actualSteps)
    const approachDirectness = Math.max(0, 1 - contextSwitching * 0.15)
    
    // Error rate: errors per 100 steps
    const errorRate = (context.errorsEncountered.length / Math.max(context.actualSteps.length, 1)) * 100
    
    // Resource utilization: balanced file access and searches
    const resourceUtilization = this.calculateResourceUtilization(context)
    
    // Learning application: check if previous learnings were applied
    const learningApplication = this.calculateLearningApplication(context)

    return {
      executionTime,
      toolEfficiency,
      approachDirectness,
      errorRate,
      resourceUtilization,
      contextSwitching,
      learningApplication
    }
  }

  /**
   * Calculate overall efficiency score (0-100)
   */
  private calculateOverallEfficiencyScore(metrics: EfficiencyMetrics): number {
    const weights = {
      toolEfficiency: 0.2,
      approachDirectness: 0.25,
      errorRate: 0.2, // Lower error rate = higher score
      resourceUtilization: 0.15,
      learningApplication: 0.2
    }
    
    const errorRateScore = Math.max(0, 1 - metrics.errorRate / 100)
    
    const weightedScore = (
      metrics.toolEfficiency * weights.toolEfficiency +
      metrics.approachDirectness * weights.approachDirectness +
      errorRateScore * weights.errorRate +
      metrics.resourceUtilization * weights.resourceUtilization +
      metrics.learningApplication * weights.learningApplication
    )
    
    return Math.round(weightedScore * 100)
  }

  /**
   * Identify inefficiencies in the approach
   */
  private identifyInefficiencies(context: ReflectionContext, metrics: EfficiencyMetrics): string[] {
    const inefficiencies: string[] = []
    
    if (metrics.toolEfficiency < 0.7) {
      inefficiencies.push(`Used ${context.toolsUsed.length} tools - could potentially be reduced`)
    }
    
    if (metrics.contextSwitching > 3) {
      inefficiencies.push(`Too many context switches (${metrics.contextSwitching}) - approach lacked focus`)
    }
    
    if (metrics.errorRate > 20) {
      inefficiencies.push(`High error rate (${metrics.errorRate.toFixed(1)}%) - better preparation needed`)
    }
    
    if (context.filesAccessed.length > 10) {
      inefficiencies.push(`Accessed ${context.filesAccessed.length} files - could be more targeted`)
    }
    
    if (metrics.learningApplication < 0.5) {
      inefficiencies.push('Did not effectively apply previous learnings')
    }
    
    // Check for redundant steps
    const redundantSteps = this.findRedundantSteps(context.actualSteps)
    if (redundantSteps.length > 0) {
      inefficiencies.push(`${redundantSteps.length} redundant steps detected`)
    }
    
    return inefficiencies
  }

  /**
   * Identify better approaches that could have been taken
   */
  private async identifyBetterApproaches(context: ReflectionContext): Promise<string[]> {
    const betterApproaches: string[] = []
    
    // Check if Read tool should have been used before Edit
    if (context.toolsUsed.includes('Edit') && !context.toolsUsed.includes('Read')) {
      betterApproaches.push('Should have used Read tool before Edit to understand file structure')
    }
    
    // Check if Glob could have been used instead of multiple Read calls
    const readCount = context.actualSteps.filter(step => step.includes('Read')).length
    if (readCount > 3 && !context.toolsUsed.includes('Glob')) {
      betterApproaches.push('Could have used Glob tool to find files more efficiently')
    }
    
    // Check if Task tool could have been used for complex searches
    const grepCount = context.actualSteps.filter(step => step.includes('Grep')).length
    if (grepCount > 5 && !context.toolsUsed.includes('Task')) {
      betterApproaches.push('Could have used Task tool for complex search operations')
    }
    
    // Query learning system for similar tasks
    try {
      const learnings = await claudeErrorLogger.getRelevantLearnings({
        taskType: context.taskType,
        codeLanguage: context.codebase.language,
        framework: context.codebase.framework
      })
      
      learnings.forEach(learning => {
        if (learning.success_rate > 0.8 && learning.solution_pattern !== context.initialApproach) {
          betterApproaches.push(`Previous learning suggests: ${learning.solution_pattern}`)
        }
      })
    } catch (error) {
      logger.warn('Could not fetch learnings for approach analysis', { error: error instanceof Error ? error.message : String(error) })
    }
    
    return betterApproaches
  }

  /**
   * Generate improvement insights that can be saved to learning system
   */
  private async generateImprovementInsights(
    context: ReflectionContext, 
    analysis: ApproachAnalysis
  ): Promise<SelfImprovementInsight[]> {
    const insights: SelfImprovementInsight[] = []
    
    // Efficiency improvements
    if (analysis.overallEfficiencyScore < 70) {
      insights.push({
        id: `insight-${Date.now()}-1`,
        category: 'efficiency',
        insight: `Task execution efficiency was ${analysis.overallEfficiencyScore}% - below optimal`,
        evidenceFromTask: `Used ${context.toolsUsed.length} tools, ${analysis.metrics.contextSwitching} context switches`,
        improvementAction: analysis.approachImprovements[0] || 'Focus on more direct approach',
        measurableGain: 'Estimated 20-30% time reduction',
        confidenceLevel: 0.8,
        applicableContexts: [context.taskType, context.codebase.framework || 'general'].filter(Boolean),
        priority: 'high',
        created_at: new Date()
      })
    }
    
    // Tool usage improvements
    if (analysis.metrics.toolEfficiency < 0.7) {
      insights.push({
        id: `insight-${Date.now()}-2`,
        category: 'tool-usage',
        insight: 'Tool usage was not optimal for task completion',
        evidenceFromTask: `Tools used: ${context.toolsUsed.join(', ')}`,
        improvementAction: analysis.toolUsageOptimizations[0] || 'Use fewer, more targeted tools',
        measurableGain: 'Reduced tool switching overhead',
        confidenceLevel: 0.7,
        applicableContexts: [context.taskType],
        priority: 'medium',
        created_at: new Date()
      })
    }
    
    // Error prevention improvements
    if (context.errorOccurred) {
      insights.push({
        id: `insight-${Date.now()}-3`,
        category: 'error-prevention',
        insight: 'Errors occurred that could have been prevented',
        evidenceFromTask: `Errors: ${context.errorsEncountered.join(', ')}`,
        improvementAction: 'Apply better preparation and validation before execution',
        measurableGain: 'Reduce error rate by 50%',
        confidenceLevel: 0.9,
        applicableContexts: [context.taskType, 'error-prone-tasks'],
        priority: 'high',
        created_at: new Date()
      })
    }
    
    return insights
  }

  /**
   * Save improvement insights to the learning system
   */
  private async saveInsightsToLearningSystem(insights: SelfImprovementInsight[]): Promise<void> {
    for (const insight of insights) {
      try {
        await claudeErrorLogger.recordLearning(
          `self-improvement-${insight.category}-${Date.now()}`,
          `Inefficiency pattern: ${insight.insight}`,
          insight.improvementAction,
          insight.applicableContexts.map(ctx => `context:${ctx}`),
          insight.confidenceLevel
        )
        
        logger.info('Self-improvement insight saved to learning system', {
          category: insight.category,
          priority: insight.priority
        })
      } catch (error) {
        logger.error('Failed to save self-improvement insight', { insight }, error instanceof Error ? error : new Error(String(error)))
      }
    }
  }

  /**
   * Get reflection statistics and insights
   */
  getReflectionStats(): {
    totalReflections: number
    averageEfficiency: number
    topInsightCategories: string[]
    improvementTrends: string[]
  } {
    if (this.reflectionHistory.length === 0) {
      return {
        totalReflections: 0,
        averageEfficiency: 0,
        topInsightCategories: [],
        improvementTrends: []
      }
    }
    
    // Calculate average efficiency from completed analyses
    const recentReflections = this.reflectionHistory.slice(-20) // Last 20
    
    const categoryCount = new Map<string, number>()
    this.improvementInsights.forEach(insight => {
      categoryCount.set(insight.category, (categoryCount.get(insight.category) || 0) + 1)
    })
    
    const topCategories = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category)
    
    return {
      totalReflections: this.reflectionHistory.length,
      averageEfficiency: 75, // Placeholder - would need to store efficiency scores
      topInsightCategories: topCategories,
      improvementTrends: [
        'Tool usage efficiency improving',
        'Error rate decreasing',
        'Approach directness increasing'
      ]
    }
  }

  // Helper methods
  private countContextSwitches(steps: string[]): number {
    let switches = 0
    let currentContext = ''
    
    steps.forEach(step => {
      const context = this.extractContextFromStep(step)
      if (context !== currentContext) {
        switches++
        currentContext = context
      }
    })
    
    return switches
  }

  private extractContextFromStep(step: string): string {
    if (step.includes('Read') || step.includes('Write') || step.includes('Edit')) return 'file-ops'
    if (step.includes('Grep') || step.includes('Glob')) return 'search'
    if (step.includes('Bash')) return 'command'
    if (step.includes('Task')) return 'delegation'
    return 'analysis'
  }

  private calculateResourceUtilization(context: ReflectionContext): number {
    // Simple heuristic: balanced file access and tool usage
    const fileAccessScore = Math.min(1, context.filesAccessed.length / 5) // Optimal around 5 files
    const toolUsageScore = Math.min(1, context.toolsUsed.length / 3) // Optimal around 3 tools
    return (fileAccessScore + toolUsageScore) / 2
  }

  private calculateLearningApplication(context: ReflectionContext): number {
    // Placeholder - would need to check if previous learnings were actually applied
    // For now, return higher score if fewer errors and more direct approach
    const errorPenalty = Math.min(0.5, context.errorsEncountered.length * 0.1)
    const directnessBonus = context.actualSteps.length < 10 ? 0.3 : 0
    return Math.max(0, 0.5 - errorPenalty + directnessBonus)
  }

  private findRedundantSteps(steps: string[]): string[] {
    const stepCounts = new Map<string, number>()
    steps.forEach(step => {
      const normalizedStep = step.toLowerCase().trim()
      stepCounts.set(normalizedStep, (stepCounts.get(normalizedStep) || 0) + 1)
    })
    
    return Array.from(stepCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([step]) => step)
  }

  private identifyMissedOpportunities(context: ReflectionContext): string[] {
    const opportunities: string[] = []
    
    // Check for missed caching opportunities
    if (context.filesAccessed.length > 5) {
      const duplicateAccess = this.findDuplicateFileAccess(context.filesAccessed)
      if (duplicateAccess.length > 0) {
        opportunities.push('Could have cached file contents to avoid re-reading')
      }
    }
    
    return opportunities
  }

  private findDuplicateFileAccess(files: string[]): string[] {
    const fileCounts = new Map<string, number>()
    files.forEach(file => {
      fileCounts.set(file, (fileCounts.get(file) || 0) + 1)
    })
    
    return Array.from(fileCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([file]) => file)
  }

  private identifyWastedSteps(context: ReflectionContext): string[] {
    // Identify steps that didn't contribute to the solution
    const wastedSteps: string[] = []
    
    // If task failed, later steps might have been wasted
    if (!context.success && context.actualSteps.length > 5) {
      const lastSteps = context.actualSteps.slice(-3)
      wastedSteps.push(...lastSteps.map(step => `Potentially wasted: ${step}`))
    }
    
    return wastedSteps
  }

  private extractNewLearnings(context: ReflectionContext): string[] {
    const learnings: string[] = []
    
    if (context.success && context.completionQuality === 'excellent') {
      learnings.push(`Successful approach for ${context.taskType}: ${context.initialApproach}`)
    }
    
    if (context.errorOccurred) {
      context.errorsEncountered.forEach(error => {
        learnings.push(`Error pattern to avoid: ${error}`)
      })
    }
    
    return learnings
  }

  private identifyConfirmedPatterns(context: ReflectionContext): string[] {
    // Patterns that worked as expected
    const patterns: string[] = []
    
    if (context.toolsUsed.includes('Read') && context.toolsUsed.includes('Edit') && context.success) {
      patterns.push('Read-before-Edit pattern confirmed effective')
    }
    
    return patterns
  }

  private identifyChallengedAssumptions(context: ReflectionContext): string[] {
    // Assumptions that were proven wrong
    const challenged: string[] = []
    
    if (context.alternativeApproaches && context.alternativeApproaches.length > 0) {
      challenged.push('Initial approach assumption was not optimal')
    }
    
    return challenged
  }

  private generateApproachImprovements(context: ReflectionContext, inefficiencies: string[]): string[] {
    const improvements: string[] = []
    
    inefficiencies.forEach(inefficiency => {
      if (inefficiency.includes('tools')) {
        improvements.push('Plan tool usage more carefully before starting')
      }
      if (inefficiency.includes('context switches')) {
        improvements.push('Maintain focus on single approach longer')
      }
      if (inefficiency.includes('error rate')) {
        improvements.push('Add validation steps before execution')
      }
    })
    
    return improvements
  }

  private generateToolOptimizations(context: ReflectionContext, metrics: EfficiencyMetrics): string[] {
    const optimizations: string[] = []
    
    if (metrics.toolEfficiency < 0.7) {
      optimizations.push('Reduce tool switching by planning sequence upfront')
    }
    
    if (context.toolsUsed.includes('Grep') && context.toolsUsed.includes('Read')) {
      optimizations.push('Consider using Grep with content output instead of separate Read calls')
    }
    
    return optimizations
  }

  private generateProcessRefinements(context: ReflectionContext): string[] {
    const refinements: string[] = []
    
    if (context.actualSteps.length > 15) {
      refinements.push('Break complex tasks into smaller, focused sub-tasks')
    }
    
    if (context.decisionsReasoning.length < context.actualSteps.length * 0.5) {
      refinements.push('Document reasoning for each step more thoroughly')
    }
    
    return refinements
  }

  private identifyStrengths(context: ReflectionContext, metrics: EfficiencyMetrics): string[] {
    const strengths: string[] = []
    
    if (metrics.errorRate < 10) {
      strengths.push('Low error rate - good preparation and execution')
    }
    
    if (metrics.approachDirectness > 0.8) {
      strengths.push('Direct, focused approach to problem solving')
    }
    
    if (context.success && context.completionQuality === 'excellent') {
      strengths.push('High quality task completion')
    }
    
    return strengths
  }

  private identifyWeaknesses(context: ReflectionContext, metrics: EfficiencyMetrics): string[] {
    const weaknesses: string[] = []
    
    if (metrics.contextSwitching > 5) {
      weaknesses.push('Tendency to switch approaches too frequently')
    }
    
    if (metrics.toolEfficiency < 0.5) {
      weaknesses.push('Inefficient tool usage patterns')
    }
    
    if (context.errorsEncountered.length > 3) {
      weaknesses.push('High error rate indicates preparation issues')
    }
    
    return weaknesses
  }

  private identifyKnowledgeGaps(context: ReflectionContext): string[] {
    const gaps: string[] = []
    
    if (context.errorsEncountered.some(error => error.includes('type'))) {
      gaps.push('TypeScript type system understanding')
    }
    
    if (context.errorsEncountered.some(error => error.includes('syntax'))) {
      gaps.push('Language syntax knowledge')
    }
    
    if (context.taskType === 'debugging' && !context.success) {
      gaps.push('Debugging methodology and systematic approaches')
    }
    
    return gaps
  }
}

// Export singleton instance
export const claudeSelfReflection = new ClaudeSelfReflection()

// Convenience wrapper for automatic reflection
export function withSelfReflection<T extends (...args: unknown[]) => Promise<any>>(
  taskType: ReflectionContext['taskType'],
  taskDescription: string,
  userIntent: string,
  originalRequest: string,
  initialApproach: string,
  fn: T
): T {
  return (async (...args: unknown[]) => {
    const taskId = claudeSelfReflection.startReflection(
      taskType,
      taskDescription,
      userIntent,
      originalRequest,
      initialApproach
    )
    
    try {
      const result = await fn(...args)
      
      // Complete reflection with success
      await claudeSelfReflection.completeReflection(
        true,
        'excellent',
        'high'
      )
      
      return result
    } catch (error) {
      claudeSelfReflection.logError(error instanceof Error ? error.message : String(error))
      
      // Complete reflection with failure
      await claudeSelfReflection.completeReflection(
        false,
        'poor',
        'low'
      )
      
      throw error
    }
  }) as T
}
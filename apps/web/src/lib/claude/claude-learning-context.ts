/**
 * @fileMetadata
 * @purpose "Context system for Claude to query and apply learnings before tasks"
 * @owner ai-team
 * @dependencies ["@/lib/claude/claude-error-logger"]
 * @exports ["ClaudeLearningContext", "useLearningContext", "withLearningContext"]
 * @complexity high
 * @tags ["claude", "learning", "context", "prevention", "intelligence"]
 * @status stable
 */

import { claudeErrorLogger, ClaudeErrorContext, ClaudeLearning } from './claude-error-logger'
import { logger } from '@/lib/logger'

export interface TaskContext {
  taskType: ClaudeErrorContext['taskType']
  description: string
  filePath?: string
  codeLanguage?: string
  framework?: string
  tools: string[]
  userIntent: string
  previousAttempts?: number
}

export interface LearningRecommendation {
  learning: ClaudeLearning
  relevanceScore: number
  category: 'critical' | 'important' | 'helpful'
  actionable: boolean
  summary: string
}

export interface PreTaskAnalysis {
  riskLevel: 'low' | 'medium' | 'high'
  recommendations: LearningRecommendation[]
  warnings: string[]
  bestPractices: string[]
  commonMistakes: string[]
  suggestedApproach: string
  estimatedSuccessRate: number
}

class ClaudeLearningContext {
  private learningCache: Map<string, ClaudeLearning[]> = new Map()
  private contextHistory: TaskContext[] = []

  /**
   * Analyze task context and provide learning-based recommendations
   */
  async analyzeTask(context: TaskContext): Promise<PreTaskAnalysis> {
    try {
      // Get relevant learnings
      const learnings = await this.getRelevantLearnings(context)

      // Generate recommendations
      const recommendations = this.generateRecommendations(learnings, context)

      // Assess risk level
      const riskLevel = this.assessRiskLevel(learnings, context)

      // Extract insights
      const warnings = this.extractWarnings(learnings, context)
      const bestPractices = this.extractBestPractices(learnings)
      const commonMistakes = this.extractCommonMistakes(learnings)
      const suggestedApproach = this.generateSuggestedApproach(learnings, context)
      const estimatedSuccessRate = this.estimateSuccessRate(learnings, context)

      // Store context for future reference
      this.contextHistory.push(context)
      if (this.contextHistory.length > 50) {
        this.contextHistory.shift() // Keep last 50 contexts
      }

      const analysis: PreTaskAnalysis = {
        riskLevel,
        recommendations,
        warnings,
        bestPractices,
        commonMistakes,
        suggestedApproach,
        estimatedSuccessRate
      }

      // Log the analysis for debugging
      logger.info('Claude learning context analysis completed', {
        taskType: context.taskType,
        riskLevel,
        recommendationCount: recommendations.length,
        estimatedSuccessRate
      })

      return analysis
    } catch (error) {
      logger.error('Failed to analyze task context', { taskContext: context }, error instanceof Error ? error : new Error(String(error)))

      // Return safe default analysis
      return {
        riskLevel: 'medium',
        recommendations: [],
        warnings: ['Unable to load learning context - proceed with caution'],
        bestPractices: ['Read existing code patterns before making changes'],
        commonMistakes: [],
        suggestedApproach: 'Follow established patterns and test changes incrementally',
        estimatedSuccessRate: 0.7
      }
    }
  }

  /**
   * Get learnings relevant to the current task context
   */
  private async getRelevantLearnings(context: TaskContext): Promise<ClaudeLearning[]> {
    const cacheKey = this.generateCacheKey(context)

    // Check cache first
    if (this.learningCache.has(cacheKey)) {
      return this.learningCache.get(cacheKey)!
    }

    // Fetch from database
    const learnings = await claudeErrorLogger.getRelevantLearnings({
      taskType: context.taskType,
      codeLanguage: context.codeLanguage,
      framework: context.framework
    })

    // Cache the results
    this.learningCache.set(cacheKey, learnings)

    // Clear cache after 5 minutes
    setTimeout(() => {
      this.learningCache.delete(cacheKey)
    }, 5 * 60 * 1000)

    return learnings
  }

  /**
   * Generate actionable recommendations based on learnings
   */
  private generateRecommendations(learnings: ClaudeLearning[], context: TaskContext): LearningRecommendation[] {
    return learnings
      .map(learning => {
        const relevanceScore = this.calculateRelevanceScore(learning, context)
        const category = this.categorizeRecommendation(learning, relevanceScore)
        const actionable = this.isActionable(learning, context)
        const summary = this.generateRecommendationSummary(learning, context)

        return {
          learning,
          relevanceScore,
          category,
          actionable,
          summary
        }
      })
      .filter(rec => rec.relevanceScore > 0.3) // Only show relevant recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  /**
   * Assess risk level based on historical learnings
   */
  private assessRiskLevel(learnings: ClaudeLearning[], context: TaskContext): 'low' | 'medium' | 'high' {
    if (learnings.length === 0) return 'medium'

    const highRiskPatterns = learnings.filter(l =>
      l.success_rate < 0.6 ||
      l.confidence_score < 0.5 ||
      l.pattern_name.includes('critical') ||
      l.pattern_name.includes('breaking')
    )

    const complexityFactors = [
      context.previousAttempts && context.previousAttempts > 2,
      context.tools.length > 3,
      context.taskType === 'code-generation' && context.codeLanguage === 'typescript',
      context.framework && ['react', 'next.js'].includes(context.framework)
    ].filter(Boolean).length

    if (highRiskPatterns.length > 2 || complexityFactors > 2) return 'high'
    if (highRiskPatterns.length > 0 || complexityFactors > 1) return 'medium'
    return 'low'
  }

  /**
   * Extract warnings from learnings
   */
  private extractWarnings(learnings: ClaudeLearning[], context: TaskContext): string[] {
    const warnings: string[] = []

    // Add warnings from low success rate learnings
    learnings
      .filter(l => l.success_rate < 0.7)
      .forEach(l => {
        warnings.push(`⚠️ ${l.pattern_name}: ${l.mistake_pattern}`)
      })

    // Add context-specific warnings
    if (context.previousAttempts && context.previousAttempts > 1) {
      warnings.push('⚠️ Multiple previous attempts detected - review approach carefully')
    }

    if (context.taskType === 'file-modification' && !context.tools.includes('Read')) {
      warnings.push('⚠️ File modification without Read tool - may cause edit failures')
    }

    return warnings.slice(0, 5) // Limit to 5 warnings
  }

  /**
   * Extract best practices from successful learnings
   */
  private extractBestPractices(learnings: ClaudeLearning[]): string[] {
    return learnings
      .filter(l => l.success_rate > 0.8 && l.confidence_score > 0.7)
      .map(l => `✅ ${l.solution_pattern}`)
      .slice(0, 5)
  }

  /**
   * Extract common mistakes from learnings
   */
  private extractCommonMistakes(learnings: ClaudeLearning[]): string[] {
    return learnings
      .filter(l => l.usage_count > 3) // Frequently encountered mistakes
      .map(l => `❌ ${l.mistake_pattern}`)
      .slice(0, 5)
  }

  /**
   * Generate suggested approach based on learnings
   */
  private generateSuggestedApproach(learnings: ClaudeLearning[], context: TaskContext): string {
    const highConfidenceLearnings = learnings.filter(l => l.confidence_score > 0.8)

    if (highConfidenceLearnings.length === 0) {
      return 'Proceed with standard approach, following established patterns and testing changes incrementally.'
    }

    const topLearning = highConfidenceLearnings[0]
    let approach = topLearning.solution_pattern

    // Add context-specific suggestions
    if (context.taskType === 'code-generation') {
      approach += ' Start with simple implementation and add complexity gradually.'
    } else if (context.taskType === 'file-modification') {
      approach += ' Always read the file first to understand current structure.'
    } else if (context.taskType === 'debugging') {
      approach += ' Begin by reproducing the issue before implementing fixes.'
    }

    return approach
  }

  /**
   * Estimate success rate based on learnings and context
   */
  private estimateSuccessRate(learnings: ClaudeLearning[], context: TaskContext): number {
    if (learnings.length === 0) return 0.7 // Default moderate confidence

    const avgSuccessRate = learnings.reduce((sum, l) => sum + l.success_rate, 0) / learnings.length
    const avgConfidence = learnings.reduce((sum, l) => sum + l.confidence_score, 0) / learnings.length

    // Adjust based on context factors
    let adjustment = 0

    if (context.previousAttempts && context.previousAttempts > 2) adjustment -= 0.2
    if (context.tools.includes('Read')) adjustment += 0.1
    if (context.framework && learnings.some(l => l.context_tags.includes(`framework:${context.framework}`))) adjustment += 0.1

    return Math.max(0.1, Math.min(0.95, (avgSuccessRate + avgConfidence) / 2 + adjustment))
  }

  /**
   * Calculate relevance score for a learning vs context
   */
  private calculateRelevanceScore(learning: ClaudeLearning, context: TaskContext): number {
    let score = 0

    // Task type match
    if (learning.context_tags.includes(`task:${context.taskType}`)) score += 0.4

    // Language match
    if (context.codeLanguage && learning.context_tags.includes(`lang:${context.codeLanguage}`)) score += 0.3

    // Framework match
    if (context.framework && learning.context_tags.includes(`framework:${context.framework}`)) score += 0.2

    // Tool match
    const toolMatches = context.tools.filter(tool =>
      learning.context_tags.includes(`tool:${tool}`)
    ).length
    score += (toolMatches / context.tools.length) * 0.1

    return Math.min(1.0, score)
  }

  /**
   * Categorize recommendation importance
   */
  private categorizeRecommendation(learning: ClaudeLearning, relevanceScore: number): 'critical' | 'important' | 'helpful' {
    if (learning.success_rate < 0.6 && relevanceScore > 0.7) return 'critical'
    if (relevanceScore > 0.6 || learning.usage_count > 5) return 'important'
    return 'helpful'
  }

  /**
   * Check if learning is actionable for current context
   */
  private isActionable(learning: ClaudeLearning, context: TaskContext): boolean {
    // Learning is actionable if it provides specific steps
    const hasSpecificSteps = learning.solution_pattern.includes('Use ') ||
                            learning.solution_pattern.includes('Always ') ||
                            learning.solution_pattern.includes('First ')

    // And it's relevant to current context
    const isRelevant = this.calculateRelevanceScore(learning, context) > 0.5

    return hasSpecificSteps && isRelevant
  }

  /**
   * Generate human-readable recommendation summary
   */
  private generateRecommendationSummary(learning: ClaudeLearning, context: TaskContext): string {
    const confidence = (learning.confidence_score * 100).toFixed(0)
    const successRate = (learning.success_rate * 100).toFixed(0)

    return `${learning.solution_pattern} (${confidence}% confidence, ${successRate}% success rate, used ${learning.usage_count}x)`
  }

  /**
   * Generate cache key for learning lookup
   */
  private generateCacheKey(context: TaskContext): string {
    return `${context.taskType}-${context.codeLanguage || 'none'}-${context.framework || 'none'}`
  }

  /**
   * Record successful application of learning context
   */
  async recordSuccessfulApplication(taskContext: TaskContext, appliedRecommendations: string[]): Promise<void> {
    try {
      for (const recommendationId of appliedRecommendations) {
        // This would update the learning success rate
        // For now, we'll just log it
        logger.info('Claude learning successfully applied', {
          taskType: taskContext.taskType,
          recommendation: recommendationId,
          context: taskContext
        })
      }
    } catch (error) {
      logger.error('Failed to record learning application', { taskContext }, error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get learning context statistics
   */
  getContextStats(): {
    cacheSize: number
    contextHistorySize: number
    recentTaskTypes: string[]
  } {
    const recentTaskTypes = this.contextHistory
      .slice(-10)
      .map(c => c.taskType)
      .filter((type, index, arr) => arr.indexOf(type) === index)

    return {
      cacheSize: this.learningCache.size,
      contextHistorySize: this.contextHistory.length,
      recentTaskTypes
    }
  }
}

// Export singleton instance
export const claudeLearningContext = new ClaudeLearningContext()

// React hook for using learning context
export function useLearningContext(taskContext?: TaskContext) {
  const [analysis, setAnalysis] = React.useState<PreTaskAnalysis | null>(null)
  const [loading, setLoading] = React.useState(false)

  const analyzeTask = React.useCallback(async (context: TaskContext) => {
    setLoading(true)
    try {
      const result = await claudeLearningContext.analyzeTask(context)
      setAnalysis(result)
      return result
    } catch (error) {
      logger.error('Learning context analysis failed', { context }, error instanceof Error ? error : new Error(String(error)))
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (taskContext) {
      analyzeTask(taskContext)
    }
  }, [taskContext, analyzeTask])

  return { analysis, loading, analyzeTask }
}

// HOF to wrap functions with learning context
export function withLearningContext<T extends (...args: unknown[]) => Promise<any>>(
  taskContext: TaskContext,
  fn: T
): T {
  return (async (...args: unknown[]) => {
    // Analyze context before execution
    const analysis = await claudeLearningContext.analyzeTask(taskContext)

    // Log the recommendations
    console.log(`🧠 Claude Learning Context Analysis for ${taskContext.taskType}:`)
    console.log(`Risk Level: ${analysis.riskLevel}`)
    console.log(`Success Rate Estimate: ${(analysis.estimatedSuccessRate * 100).toFixed(1)}%`)

    if (analysis.recommendations.length > 0) {
      console.log('📋 Recommendations:')
      analysis.recommendations.slice(0, 3).forEach(rec => {
        console.log(`  ${rec.category.toUpperCase()}: ${rec.summary}`)
      })
    }

    if (analysis.warnings.length > 0) {
      console.log('⚠️ Warnings:')
      analysis.warnings.forEach(warning => console.log(`  ${warning}`))
    }

    // Execute the original function
    try {
      const result = await fn(...args)

      // Record successful application
      await claudeLearningContext.recordSuccessfulApplication(
        taskContext,
        analysis.recommendations.filter(r => r.actionable).map(r => r.learning.id)
      )

      return result
    } catch (error) {
      // Log the error with context for future learning
      await claudeErrorLogger.logError(
        error as Error,
        {
          taskType: taskContext.taskType,
          taskDescription: taskContext.description,
          userIntent: taskContext.userIntent,
          filePath: taskContext.filePath,
          codeLanguage: taskContext.codeLanguage,
          framework: taskContext.framework,
          errorType: 'runtime',
          toolsUsed: taskContext.tools,
          mistakeCategory: 'execution-failure',
          previousAttempts: taskContext.previousAttempts
        }
      )

      throw error
    }
  }) as T
}

// Import React for hooks
import React from 'react'

/**
 * @fileMetadata
 * @purpose "A/B Testing Framework for Claude Learning System"
 * @owner ai-team
 * @status stable
 * @dependencies ["@/lib/claude/claude-production-monitor", "@/lib/logger"]
 */

import { claudeProductionMonitor } from './claude-production-monitor'
import { claudeAdvancedAnalytics } from './claude-advanced-analytics'
import { claudeEnhancedAutomation } from './claude-enhanced-automation'
import { withCompleteLearning } from './claude-complete-learning-system'
import { logger } from '@/lib/logger'

interface ABTestSession {
  sessionId: string
  userId?: string
  group: 'control' | 'treatment'
  startTime: Date
  taskCount: number
  totalExecutionTime: number
  successCount: number
  errorCount: number
  learningPatternsApplied: number
  confidenceScores: number[]
  context: Record<string, any>
}

interface ABTestConfig {
  enabled: boolean
  treatmentPercentage: number
  minimumSampleSize: number
  confidenceLevel: number
  maxSessionDuration: number // milliseconds
  allowedTaskTypes: string[]
}

class ClaudeABTestingFramework {
  private sessions: Map<string, ABTestSession> = new Map()
  private config: ABTestConfig = {
    enabled: process.env.CLAUDE_AB_TEST_ENABLED !== 'false',
    treatmentPercentage: parseFloat(process.env.CLAUDE_AB_TEST_PERCENTAGE || '0.5'),
    minimumSampleSize: parseInt(process.env.CLAUDE_AB_MIN_SAMPLE_SIZE || '30'),
    confidenceLevel: parseFloat(process.env.CLAUDE_AB_CONFIDENCE_LEVEL || '0.95'),
    maxSessionDuration: parseInt(process.env.CLAUDE_AB_MAX_SESSION_DURATION || '3600000'), // 1 hour
    allowedTaskTypes: ['code-generation', 'file-modification', 'debugging', 'analysis', 'planning']
  }

  /**
   * Initialize A/B test session for a user
   */
  initializeSession(sessionId: string, userId?: string, context: Record<string, any> = {}): ABTestSession {
    if (!this.config.enabled) {
      // If A/B testing is disabled, always use treatment (learning enabled)
      const session: ABTestSession = {
        sessionId,
        userId,
        group: 'treatment',
        startTime: new Date(),
        taskCount: 0,
        totalExecutionTime: 0,
        successCount: 0,
        errorCount: 0,
        learningPatternsApplied: 0,
        confidenceScores: [],
        context
      }
      this.sessions.set(sessionId, session)
      return session
    }

    // Use production monitor for consistent group assignment
    const group = claudeProductionMonitor.assignABTestGroup(sessionId)
    
    const session: ABTestSession = {
      sessionId,
      userId,
      group,
      startTime: new Date(),
      taskCount: 0,
      totalExecutionTime: 0,
      successCount: 0,
      errorCount: 0,
      learningPatternsApplied: 0,
      confidenceScores: [],
      context
    }

    this.sessions.set(sessionId, session)

    logger.info('A/B test session initialized', {
      sessionId,
      group,
      userId,
      context
    })

    return session
  }

  /**
   * Execute task with A/B testing - this is the main integration point
   */
  async executeTaskWithABTesting<T>(
    sessionId: string,
    taskType: string,
    taskDescription: string,
    taskFunction: () => Promise<T>,
    context: {
      complexity?: 'simple' | 'medium' | 'complex'
      framework?: string
      language?: string
    } = {}
  ): Promise<{
    result: T
    group: 'control' | 'treatment'
    metrics: {
      executionTime: number
      success: boolean
      learningApplied: boolean
      optimizationsCount: number
      confidenceScore: number
    }
  }> {
    // Get or create session
    let session = this.sessions.get(sessionId)
    if (!session) {
      session = this.initializeSession(sessionId, undefined, context)
    }

    const startTime = Date.now()
    let result: T
    let success = false
    let optimizationsCount = 0
    let confidenceScore = 0

    try {
      if (session.group === 'treatment') {
        // TREATMENT GROUP: Use full learning system
        logger.info('Executing task with learning system (treatment)', {
          sessionId,
          taskType,
          taskDescription
        })

        // Apply auto-optimizations
        const optimization = await claudeEnhancedAutomation.applyAutoOptimizations({
          taskType,
          complexity: context.complexity || 'medium',
          framework: context.framework,
          codeLanguage: context.language
        })
        optimizationsCount = optimization.appliedOptimizations.length

        // Get prediction for confidence score
        const prediction = await claudeAdvancedAnalytics.predictTaskSuccess(
          taskType,
          context.complexity || 'medium',
          context
        )
        confidenceScore = prediction.confidenceLevel

        // Execute with complete learning system
        result = await withCompleteLearning(
          taskType as 'code-generation' | 'analysis' | 'debugging' | 'planning' | 'file-modification' | 'other',
          taskDescription,
          taskDescription,
          `A/B Test Treatment - Session: ${sessionId}`,
          context,
          taskFunction
        )()

        session.learningPatternsApplied += optimizationsCount
        session.confidenceScores.push(confidenceScore)

      } else {
        // CONTROL GROUP: Execute without learning system
        logger.info('Executing task without learning system (control)', {
          sessionId,
          taskType,
          taskDescription
        })

        result = await taskFunction()
      }

      success = true
      session.successCount++

    } catch (error) {
      logger.error('Task execution failed in A/B test', {
        sessionId,
        group: session.group,
        taskType,
        error
      })
      
      session.errorCount++
      throw error
    } finally {
      const executionTime = Date.now() - startTime
      
      // Update session metrics
      session.taskCount++
      session.totalExecutionTime += executionTime

      // Track in production monitor
      await claudeProductionMonitor.trackTaskExecution(
        sessionId,
        taskType,
        taskDescription,
        startTime,
        {
          success,
          toolsUsed: [], // Would be populated by actual task execution
          context
        },
        session.group === 'treatment' ? {
          optimizationsApplied: optimizationsCount,
          predictedSuccessRate: 0.8, // Would come from actual prediction
          confidenceLevel: confidenceScore
        } : undefined
      )

      // Clean up old sessions
      this.cleanupExpiredSessions()
    }

    return {
      result,
      group: session.group,
      metrics: {
        executionTime: Date.now() - startTime,
        success,
        learningApplied: session.group === 'treatment',
        optimizationsCount,
        confidenceScore
      }
    }
  }

  /**
   * Get session status and metrics
   */
  getSessionMetrics(sessionId: string): ABTestSession | null {
    return this.sessions.get(sessionId) || null
  }

  /**
   * Generate A/B test results with statistical analysis
   */
  async generateABTestReport(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<{
    overview: {
      totalSessions: number
      controlSessions: number
      treatmentSessions: number
      timeframe: string
    }
    controlGroup: {
      sessions: number
      avgTasksPerSession: number
      avgExecutionTime: number
      successRate: number
      errorRate: number
    }
    treatmentGroup: {
      sessions: number
      avgTasksPerSession: number
      avgExecutionTime: number
      successRate: number
      errorRate: number
      avgOptimizations: number
      avgConfidence: number
    }
    statisticalAnalysis: {
      sampleSizeSufficient: boolean
      statisticalSignificance: number
      pValue: number
      effectSize: number
      confidenceInterval: [number, number]
    }
    businessMetrics: {
      performanceImprovement: number
      errorReduction: number
      estimatedROI: number
      recommendation: 'rollout' | 'continue_testing' | 'rollback' | 'inconclusive'
    }
  }> {
    const now = Date.now()
    const timeframeDuration = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000
    }

    const cutoffTime = now - timeframeDuration[timeframe]
    const recentSessions = Array.from(this.sessions.values())
      .filter(session => session.startTime.getTime() > cutoffTime)

    const controlSessions = recentSessions.filter(s => s.group === 'control')
    const treatmentSessions = recentSessions.filter(s => s.group === 'treatment')

    // Calculate group metrics
    const controlMetrics = this.calculateGroupMetrics(controlSessions)
    const treatmentMetrics = this.calculateGroupMetrics(treatmentSessions)

    // Statistical analysis
    const statisticalAnalysis = this.performStatisticalAnalysis(controlSessions, treatmentSessions)

    // Business metrics
    const performanceImprovement = controlMetrics.avgExecutionTime > 0 
      ? ((controlMetrics.avgExecutionTime - treatmentMetrics.avgExecutionTime) / controlMetrics.avgExecutionTime) * 100
      : 0

    const errorReduction = controlMetrics.errorRate > 0
      ? ((controlMetrics.errorRate - treatmentMetrics.errorRate) / controlMetrics.errorRate) * 100
      : 0

    // Simple ROI estimation based on time savings
    const avgTasksPerHour = 10 // Assumption
    const hourlyRate = 100 // $100/hour developer
    const estimatedROI = (performanceImprovement / 100) * avgTasksPerHour * hourlyRate

    // Generate recommendation
    let recommendation: 'rollout' | 'continue_testing' | 'rollback' | 'inconclusive' = 'inconclusive'
    
    if (!statisticalAnalysis.sampleSizeSufficient) {
      recommendation = 'continue_testing'
    } else if (statisticalAnalysis.statisticalSignificance >= 0.95 && performanceImprovement > 10) {
      recommendation = 'rollout'
    } else if (statisticalAnalysis.statisticalSignificance >= 0.95 && performanceImprovement < -10) {
      recommendation = 'rollback'
    } else if (statisticalAnalysis.sampleSizeSufficient) {
      recommendation = performanceImprovement > 0 ? 'continue_testing' : 'inconclusive'
    }

    return {
      overview: {
        totalSessions: recentSessions.length,
        controlSessions: controlSessions.length,
        treatmentSessions: treatmentSessions.length,
        timeframe
      },
      controlGroup: controlMetrics,
      treatmentGroup: {
        ...treatmentMetrics,
        avgOptimizations: this.average(treatmentSessions.map(s => s.learningPatternsApplied)),
        avgConfidence: this.average(treatmentSessions.flatMap(s => s.confidenceScores))
      },
      statisticalAnalysis,
      businessMetrics: {
        performanceImprovement,
        errorReduction,
        estimatedROI,
        recommendation
      }
    }
  }

  private calculateGroupMetrics(sessions: ABTestSession[]) {
    if (sessions.length === 0) {
      return {
        sessions: 0,
        avgTasksPerSession: 0,
        avgExecutionTime: 0,
        successRate: 0,
        errorRate: 0
      }
    }

    const totalTasks = sessions.reduce((sum, s) => sum + s.taskCount, 0)
    const totalSuccesses = sessions.reduce((sum, s) => sum + s.successCount, 0)
    const totalErrors = sessions.reduce((sum, s) => sum + s.errorCount, 0)
    const totalExecutionTime = sessions.reduce((sum, s) => sum + s.totalExecutionTime, 0)

    return {
      sessions: sessions.length,
      avgTasksPerSession: totalTasks / sessions.length,
      avgExecutionTime: totalTasks > 0 ? totalExecutionTime / totalTasks : 0,
      successRate: totalTasks > 0 ? totalSuccesses / totalTasks : 0,
      errorRate: totalTasks > 0 ? totalErrors / totalTasks : 0
    }
  }

  private performStatisticalAnalysis(controlSessions: ABTestSession[], treatmentSessions: ABTestSession[]) {
    const minSampleSize = Math.min(controlSessions.length, treatmentSessions.length)
    const sampleSizeSufficient = minSampleSize >= this.config.minimumSampleSize

    // Simplified statistical analysis - in production would use proper statistical tests
    const controlMean = this.average(controlSessions.map(s => s.totalExecutionTime / Math.max(s.taskCount, 1)))
    const treatmentMean = this.average(treatmentSessions.map(s => s.totalExecutionTime / Math.max(s.taskCount, 1)))
    
    const pooledStdDev = this.calculatePooledStdDev(controlSessions, treatmentSessions)
    const effectSize = pooledStdDev > 0 ? Math.abs(controlMean - treatmentMean) / pooledStdDev : 0
    
    // Simplified significance calculation
    const statisticalSignificance = Math.min(0.99, Math.max(0, (effectSize * minSampleSize) / 100))
    const pValue = 1 - statisticalSignificance

    // Confidence interval estimation
    const margin = 1.96 * (pooledStdDev / Math.sqrt(minSampleSize)) // 95% CI
    const confidenceInterval: [number, number] = [
      (treatmentMean - controlMean) - margin,
      (treatmentMean - controlMean) + margin
    ]

    return {
      sampleSizeSufficient,
      statisticalSignificance,
      pValue,
      effectSize,
      confidenceInterval
    }
  }

  private calculatePooledStdDev(controlSessions: ABTestSession[], treatmentSessions: ABTestSession[]): number {
    const controlTimes = controlSessions.map(s => s.totalExecutionTime / Math.max(s.taskCount, 1))
    const treatmentTimes = treatmentSessions.map(s => s.totalExecutionTime / Math.max(s.taskCount, 1))
    
    const allTimes = [...controlTimes, ...treatmentTimes]
    const mean = this.average(allTimes)
    
    const variance = allTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / (allTimes.length - 1)
    return Math.sqrt(variance)
  }

  private average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now()
    const expiredSessions: string[] = []

    for (const [sessionId, session] of this.sessions) {
      if (now - session.startTime.getTime() > this.config.maxSessionDuration) {
        expiredSessions.push(sessionId)
      }
    }

    expiredSessions.forEach(sessionId => {
      this.sessions.delete(sessionId)
    })

    if (expiredSessions.length > 0) {
      logger.info('Cleaned up expired A/B test sessions', { count: expiredSessions.length })
    }
  }

  /**
   * Get current A/B test configuration
   */
  getConfig(): ABTestConfig {
    return { ...this.config }
  }

  /**
   * Update A/B test configuration
   */
  updateConfig(newConfig: Partial<ABTestConfig>): void {
    this.config = { ...this.config, ...newConfig }
    logger.info('A/B test configuration updated', { config: this.config })
  }

  /**
   * Get overall A/B testing status
   */
  getStatus(): {
    enabled: boolean
    activeSessions: number
    totalSessions: number
    configStatus: 'valid' | 'invalid'
    lastCleanup: Date
  } {
    return {
      enabled: this.config.enabled,
      activeSessions: this.sessions.size,
      totalSessions: this.sessions.size,
      configStatus: this.validateConfig() ? 'valid' : 'invalid',
      lastCleanup: new Date() // Would track actual cleanup time in production
    }
  }

  private validateConfig(): boolean {
    return (
      this.config.treatmentPercentage >= 0 &&
      this.config.treatmentPercentage <= 1 &&
      this.config.minimumSampleSize > 0 &&
      this.config.confidenceLevel > 0 &&
      this.config.confidenceLevel < 1 &&
      this.config.maxSessionDuration > 0
    )
  }
}

// Export singleton instance
export const claudeABTesting = new ClaudeABTestingFramework()

// Export types
export type { ABTestSession, ABTestConfig }
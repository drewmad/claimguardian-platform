/**
 * @fileMetadata
 * @purpose Production Learning System Monitoring and Validation
 * @owner ai-team
 * @status active
 * @dependencies ["@/lib/claude/claude-advanced-analytics", "@/lib/claude/claude-enhanced-automation", "@supabase/supabase-js"]
 */

import { createClient } from '@supabase/supabase-js'
import { claudeAdvancedAnalytics } from './claude-advanced-analytics'
import { claudeEnhancedAutomation } from './claude-enhanced-automation'
import { completeLearningSystem } from './claude-complete-learning-system'
import { logger } from '@/lib/logger'

// Production configuration
const PRODUCTION_CONFIG = {
  enableLearning: process.env.CLAUDE_LEARNING_ENABLED === 'true',
  confidenceThreshold: parseFloat(process.env.CLAUDE_CONFIDENCE_THRESHOLD || '0.8'),
  monitoringInterval: parseInt(process.env.CLAUDE_MONITORING_INTERVAL || '30000'), // 30 seconds
  abTestPercentage: parseFloat(process.env.CLAUDE_AB_TEST_PERCENTAGE || '0.5'), // 50% A/B split
  maxLearningPatterns: parseInt(process.env.CLAUDE_MAX_PATTERNS || '1000'),
  enableTelemetry: process.env.CLAUDE_TELEMETRY_ENABLED !== 'false'
}

interface ProductionMetrics {
  timestamp: Date
  sessionId: string
  userId?: string
  taskType: string
  taskDescription: string
  executionTime: number
  success: boolean
  learningEnabled: boolean
  optimizationsApplied: number
  predictedSuccessRate: number
  actualResult: 'success' | 'failure' | 'partial'
  errorDetails?: string
  performanceGain?: number
  confidenceLevel: number
  toolsUsed: string[]
  context: Record<string, any>
}

interface ABTestResult {
  controlGroup: {
    taskCount: number
    avgExecutionTime: number
    successRate: number
    errorRate: number
  }
  treatmentGroup: {
    taskCount: number
    avgExecutionTime: number
    successRate: number
    errorRate: number
    optimizationsApplied: number
    avgConfidence: number
  }
  statisticalSignificance: number
  performanceImprovement: number
  recommendation: 'continue' | 'pause' | 'rollout' | 'rollback'
}

class ClaudeProductionMonitor {
  private supabase: ReturnType<typeof createClient>
  private metrics: ProductionMetrics[] = []
  private abTestSessions: Map<string, 'control' | 'treatment'> = new Map()
  private monitoringTimer?: NodeJS.Timeout
  private isMonitoring = false

  constructor() {
    // Initialize Supabase for production metrics storage
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    }
  }

  /**
   * PRODUCTION DEPLOYMENT: Initialize learning system in production
   */
  async initializeProductionSystem(): Promise<{
    status: 'success' | 'error'
    message: string
    config: typeof PRODUCTION_CONFIG
    healthCheck: Record<string, boolean>
  }> {
    logger.info('Initializing Claude Learning System in production')

    try {
      // Health check all components
      const healthCheck = await this.performHealthCheck()
      
      // Initialize database tables for production metrics
      await this.initializeMetricsTables()
      
      // Start monitoring if enabled
      if (PRODUCTION_CONFIG.enableTelemetry) {
        this.startMonitoring()
      }

      // Set up A/B testing framework
      await this.initializeABTesting()

      return {
        status: 'success',
        message: 'Claude Learning System successfully deployed to production',
        config: PRODUCTION_CONFIG,
        healthCheck
      }
    } catch (error) {
      logger.error('Failed to initialize production system', { error })
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        config: PRODUCTION_CONFIG,
        healthCheck: {}
      }
    }
  }

  private async performHealthCheck(): Promise<Record<string, boolean>> {
    const checks = {
      advancedAnalytics: false,
      enhancedAutomation: false,
      completeLearningSystem: false,
      databaseConnection: false,
      configurationValid: false
    }

    try {
      // Test advanced analytics
      await claudeAdvancedAnalytics.generateTrendAnalysis('day')
      checks.advancedAnalytics = true
    } catch (error) {
      logger.warn('Advanced analytics health check failed', { error })
    }

    try {
      // Test enhanced automation
      await claudeEnhancedAutomation.getAutomationStats()
      checks.enhancedAutomation = true
    } catch (error) {
      logger.warn('Enhanced automation health check failed', { error })
    }

    try {
      // Test complete learning system
      await completeLearningSystem.getLearningStats()
      checks.completeLearningSystem = true
    } catch (error) {
      logger.warn('Complete learning system health check failed', { error })
    }

    // Test database connection
    if (this.supabase) {
      try {
        const { error } = await this.supabase.from('user_profiles').select('count').limit(1)
        checks.databaseConnection = !error
      } catch (error) {
        logger.warn('Database connection health check failed', { error })
      }
    }

    // Validate configuration
    checks.configurationValid = (
      typeof PRODUCTION_CONFIG.confidenceThreshold === 'number' &&
      PRODUCTION_CONFIG.confidenceThreshold > 0 &&
      PRODUCTION_CONFIG.confidenceThreshold <= 1
    )

    return checks
  }

  private async initializeMetricsTables(): Promise<void> {
    if (!this.supabase) return

    // Create production metrics table
    const { error } = await this.supabase.rpc('create_production_metrics_table', {})
    
    if (error) {
      logger.warn('Metrics table may already exist', { error })
    } else {
      logger.info('Production metrics table initialized')
    }
  }

  /**
   * REAL USAGE MONITORING: Track and validate improvements
   */
  async trackTaskExecution(
    sessionId: string,
    taskType: string,
    taskDescription: string,
    executionStartTime: number,
    result: {
      success: boolean
      errorDetails?: string
      toolsUsed: string[]
      context: Record<string, any>
    },
    learningData?: {
      optimizationsApplied: number
      predictedSuccessRate: number
      confidenceLevel: number
      performanceGain?: number
    }
  ): Promise<void> {
    const executionTime = Date.now() - executionStartTime
    const isLearningEnabled = this.abTestSessions.get(sessionId) === 'treatment'

    const metrics: ProductionMetrics = {
      timestamp: new Date(),
      sessionId,
      taskType,
      taskDescription,
      executionTime,
      success: result.success,
      learningEnabled: isLearningEnabled,
      optimizationsApplied: learningData?.optimizationsApplied || 0,
      predictedSuccessRate: learningData?.predictedSuccessRate || 0,
      actualResult: result.success ? 'success' : 'failure',
      errorDetails: result.errorDetails,
      performanceGain: learningData?.performanceGain,
      confidenceLevel: learningData?.confidenceLevel || 0,
      toolsUsed: result.toolsUsed,
      context: result.context
    }

    // Store metrics locally
    this.metrics.push(metrics)

    // Store in database if available
    if (this.supabase && PRODUCTION_CONFIG.enableTelemetry) {
      await this.storeMetricsToDatabase(metrics)
    }

    logger.info('Task execution tracked', {
      sessionId,
      taskType,
      executionTime,
      success: result.success,
      learningEnabled: isLearningEnabled
    })
  }

  private async storeMetricsToDatabase(metrics: ProductionMetrics): Promise<void> {
    try {
      const { error } = await this.supabase!
        .from('claude_production_metrics')
        .insert({
          timestamp: metrics.timestamp.toISOString(),
          session_id: metrics.sessionId,
          user_id: metrics.userId,
          task_type: metrics.taskType,
          task_description: metrics.taskDescription,
          execution_time: metrics.executionTime,
          success: metrics.success,
          learning_enabled: metrics.learningEnabled,
          optimizations_applied: metrics.optimizationsApplied,
          predicted_success_rate: metrics.predictedSuccessRate,
          actual_result: metrics.actualResult,
          error_details: metrics.errorDetails,
          performance_gain: metrics.performanceGain,
          confidence_level: metrics.confidenceLevel,
          tools_used: metrics.toolsUsed,
          context: metrics.context
        })

      if (error) {
        logger.error('Failed to store metrics to database', { error })
      }
    } catch (error) {
      logger.error('Database storage error', { error })
    }
  }

  /**
   * A/B TESTING: Measure actual ROI
   */
  private async initializeABTesting(): Promise<void> {
    // Clear previous A/B test assignments for new deployment
    this.abTestSessions.clear()
    logger.info('A/B testing framework initialized', {
      percentage: PRODUCTION_CONFIG.abTestPercentage
    })
  }

  assignABTestGroup(sessionId: string): 'control' | 'treatment' {
    // Consistent assignment based on session ID hash
    const hash = this.hashString(sessionId)
    const assignment = hash < PRODUCTION_CONFIG.abTestPercentage ? 'treatment' : 'control'
    
    this.abTestSessions.set(sessionId, assignment)
    
    logger.info('A/B test group assigned', { sessionId, assignment })
    return assignment
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647 // Normalize to 0-1
  }

  async generateABTestResults(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<ABTestResult> {
    const now = Date.now()
    const timeframeDuration = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000
    }

    const cutoffTime = now - timeframeDuration[timeframe]
    const recentMetrics = this.metrics.filter(m => m.timestamp.getTime() > cutoffTime)

    const controlMetrics = recentMetrics.filter(m => !m.learningEnabled)
    const treatmentMetrics = recentMetrics.filter(m => m.learningEnabled)

    // Calculate control group stats
    const controlGroup = {
      taskCount: controlMetrics.length,
      avgExecutionTime: this.average(controlMetrics.map(m => m.executionTime)),
      successRate: controlMetrics.filter(m => m.success).length / controlMetrics.length,
      errorRate: controlMetrics.filter(m => !m.success).length / controlMetrics.length
    }

    // Calculate treatment group stats
    const treatmentGroup = {
      taskCount: treatmentMetrics.length,
      avgExecutionTime: this.average(treatmentMetrics.map(m => m.executionTime)),
      successRate: treatmentMetrics.filter(m => m.success).length / treatmentMetrics.length,
      errorRate: treatmentMetrics.filter(m => !m.success).length / treatmentMetrics.length,
      optimizationsApplied: this.sum(treatmentMetrics.map(m => m.optimizationsApplied)),
      avgConfidence: this.average(treatmentMetrics.map(m => m.confidenceLevel))
    }

    // Calculate statistical significance and performance improvement
    const performanceImprovement = ((controlGroup.avgExecutionTime - treatmentGroup.avgExecutionTime) / controlGroup.avgExecutionTime) * 100
    const statisticalSignificance = this.calculateStatisticalSignificance(controlGroup, treatmentGroup)

    // Generate recommendation
    let recommendation: ABTestResult['recommendation'] = 'continue'
    if (statisticalSignificance > 0.95 && performanceImprovement > 15) {
      recommendation = 'rollout'
    } else if (statisticalSignificance > 0.95 && performanceImprovement < -10) {
      recommendation = 'rollback'
    } else if (controlGroup.taskCount < 30 || treatmentGroup.taskCount < 30) {
      recommendation = 'continue' // Need more data
    }

    return {
      controlGroup,
      treatmentGroup,
      statisticalSignificance,
      performanceImprovement,
      recommendation
    }
  }

  private average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0
  }

  private sum(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0)
  }

  private calculateStatisticalSignificance(control: any, treatment: any): number {
    // Simplified statistical significance calculation
    // In production, would use proper statistical tests
    const sampleSizeEffect = Math.min(control.taskCount, treatment.taskCount) / 100
    const effectSize = Math.abs(control.avgExecutionTime - treatment.avgExecutionTime) / control.avgExecutionTime
    
    return Math.min(0.99, sampleSizeEffect * effectSize * 2)
  }

  /**
   * CONFIDENCE THRESHOLD TUNING: Fine-tune based on real data
   */
  async analyzeConfidenceThresholds(): Promise<{
    currentThreshold: number
    recommendedThreshold: number
    analysis: {
      falsePositives: number
      falseNegatives: number
      accuracy: number
      optimalThreshold: number
    }
  }> {
    const recentMetrics = this.metrics.slice(-500) // Last 500 tasks
    const treatmentMetrics = recentMetrics.filter(m => m.learningEnabled)

    if (treatmentMetrics.length < 50) {
      return {
        currentThreshold: PRODUCTION_CONFIG.confidenceThreshold,
        recommendedThreshold: PRODUCTION_CONFIG.confidenceThreshold,
        analysis: {
          falsePositives: 0,
          falseNegatives: 0,
          accuracy: 0,
          optimalThreshold: PRODUCTION_CONFIG.confidenceThreshold
        }
      }
    }

    // Analyze different threshold values
    const thresholds = [0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95]
    let bestThreshold = PRODUCTION_CONFIG.confidenceThreshold
    let bestAccuracy = 0

    const analysis = {
      falsePositives: 0,
      falseNegatives: 0,
      accuracy: 0,
      optimalThreshold: PRODUCTION_CONFIG.confidenceThreshold
    }

    for (const threshold of thresholds) {
      const accuracy = this.calculateThresholdAccuracy(treatmentMetrics, threshold)
      if (accuracy > bestAccuracy) {
        bestAccuracy = accuracy
        bestThreshold = threshold
      }
    }

    // Calculate current threshold performance
    const currentAccuracy = this.calculateThresholdAccuracy(treatmentMetrics, PRODUCTION_CONFIG.confidenceThreshold)
    const falsePositives = treatmentMetrics.filter(m => 
      m.confidenceLevel >= PRODUCTION_CONFIG.confidenceThreshold && !m.success
    ).length
    const falseNegatives = treatmentMetrics.filter(m => 
      m.confidenceLevel < PRODUCTION_CONFIG.confidenceThreshold && m.success
    ).length

    analysis.falsePositives = falsePositives
    analysis.falseNegatives = falseNegatives
    analysis.accuracy = currentAccuracy
    analysis.optimalThreshold = bestThreshold

    return {
      currentThreshold: PRODUCTION_CONFIG.confidenceThreshold,
      recommendedThreshold: bestThreshold,
      analysis
    }
  }

  private calculateThresholdAccuracy(metrics: ProductionMetrics[], threshold: number): number {
    const predictions = metrics
      .filter(m => m.confidenceLevel > 0)
      .map(m => ({
        predicted: m.confidenceLevel >= threshold,
        actual: m.success
      }))

    if (predictions.length === 0) return 0

    const correct = predictions.filter(p => p.predicted === p.actual).length
    return correct / predictions.length
  }

  /**
   * MONITORING AND HEALTH: Real-time system monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.monitoringTimer = setInterval(async () => {
      await this.performMonitoringCheck()
    }, PRODUCTION_CONFIG.monitoringInterval)

    logger.info('Production monitoring started', {
      interval: PRODUCTION_CONFIG.monitoringInterval
    })
  }

  stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer)
      this.monitoringTimer = undefined
    }
    this.isMonitoring = false
    logger.info('Production monitoring stopped')
  }

  private async performMonitoringCheck(): Promise<void> {
    try {
      // Check system health
      const healthCheck = await this.performHealthCheck()
      const unhealthyComponents = Object.entries(healthCheck)
        .filter(([_, healthy]) => !healthy)
        .map(([component]) => component)

      if (unhealthyComponents.length > 0) {
        logger.warn('Unhealthy components detected', { components: unhealthyComponents })
      }

      // Check performance metrics
      const recentMetrics = this.metrics.slice(-100) // Last 100 tasks
      if (recentMetrics.length > 20) {
        const avgExecutionTime = this.average(recentMetrics.map(m => m.executionTime))
        const successRate = recentMetrics.filter(m => m.success).length / recentMetrics.length

        if (avgExecutionTime > 10000) { // > 10 seconds average
          logger.warn('High average execution time detected', { avgExecutionTime })
        }

        if (successRate < 0.8) { // < 80% success rate
          logger.warn('Low success rate detected', { successRate })
        }
      }

      // Memory cleanup
      if (this.metrics.length > PRODUCTION_CONFIG.maxLearningPatterns * 2) {
        this.metrics = this.metrics.slice(-PRODUCTION_CONFIG.maxLearningPatterns)
        logger.info('Metrics memory cleanup performed')
      }

    } catch (error) {
      logger.error('Monitoring check failed', { error })
    }
  }

  /**
   * GET PRODUCTION STATUS AND METRICS
   */
  async getProductionStatus(): Promise<{
    status: 'healthy' | 'warning' | 'error'
    config: typeof PRODUCTION_CONFIG
    metrics: {
      totalTasks: number
      avgExecutionTime: number
      successRate: number
      learningEnabled: boolean
      abTestStatus: string
    }
    healthCheck: Record<string, boolean>
    recommendations: string[]
  }> {
    const healthCheck = await this.performHealthCheck()
    const recentMetrics = this.metrics.slice(-1000)
    
    const status = Object.values(healthCheck).every(Boolean) ? 'healthy' : 
                  Object.values(healthCheck).some(Boolean) ? 'warning' : 'error'

    const metrics = {
      totalTasks: recentMetrics.length,
      avgExecutionTime: this.average(recentMetrics.map(m => m.executionTime)),
      successRate: recentMetrics.filter(m => m.success).length / recentMetrics.length,
      learningEnabled: PRODUCTION_CONFIG.enableLearning,
      abTestStatus: `${this.abTestSessions.size} active sessions`
    }

    const recommendations = []
    if (metrics.successRate < 0.8) {
      recommendations.push('Consider reviewing and adjusting confidence thresholds')
    }
    if (metrics.avgExecutionTime > 5000) {
      recommendations.push('High execution times detected - review system performance')
    }
    if (!PRODUCTION_CONFIG.enableLearning) {
      recommendations.push('Learning system is disabled - enable for full benefits')
    }

    return {
      status,
      config: PRODUCTION_CONFIG,
      metrics,
      healthCheck,
      recommendations
    }
  }
}

// Export singleton instance
export const claudeProductionMonitor = new ClaudeProductionMonitor()

// Export types
export type { ProductionMetrics, ABTestResult }
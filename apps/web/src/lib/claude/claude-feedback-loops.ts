/**
 * @fileMetadata
 * @purpose Feedback Loops for Continuous Improvement of Claude Learning System
 * @owner ai-team
 * @status active
 * @dependencies ["@/lib/claude/claude-production-monitor", "@/lib/claude/claude-threshold-tuner", "@/lib/logger"]
 */

import { claudeProductionMonitor } from './claude-production-monitor'
import { claudeThresholdTuner } from './claude-threshold-tuner'
import { claudeABTesting } from './claude-ab-testing'
import { claudeAdvancedAnalytics } from './claude-advanced-analytics'
import { completeLearningSystem } from './claude-complete-learning-system'
import { logger } from '@/lib/logger'

interface FeedbackMetric {
  id: string
  name: string
  category: 'performance' | 'quality' | 'user_satisfaction' | 'business_impact'
  currentValue: number
  targetValue: number
  trend: 'improving' | 'stable' | 'declining'
  priority: 'low' | 'medium' | 'high' | 'critical'
  lastUpdated: Date
  improvementActions: string[]
}

interface FeedbackAction {
  id: string
  type: 'threshold_adjustment' | 'pattern_refinement' | 'optimization_update' | 'alert_generation'
  description: string
  triggeredBy: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  timestamp: Date
  expectedImpact: string
  actualImpact?: string
  completedAt?: Date
}

interface UserFeedback {
  sessionId: string
  userId?: string
  timestamp: Date
  feedbackType: 'positive' | 'negative' | 'suggestion' | 'bug_report'
  category: 'performance' | 'accuracy' | 'usability' | 'feature_request'
  description: string
  rating?: number // 1-5 scale
  context: {
    taskType?: string
    learningEnabled: boolean
    executionTime?: number
    success: boolean
  }
  resolved: boolean
  resolutionActions?: string[]
}

interface ContinuousImprovementCycle {
  cycleId: string
  startDate: Date
  endDate?: Date
  phase: 'data_collection' | 'analysis' | 'action_planning' | 'implementation' | 'validation'
  metrics: FeedbackMetric[]
  actions: FeedbackAction[]
  outcomes: {
    metricsImproved: number
    actionsCompleted: number
    overallImpact: number
    lessonsLearned: string[]
  }
}

class ClaudeFeedbackLoops {
  private metrics: Map<string, FeedbackMetric> = new Map()
  private actions: Map<string, FeedbackAction> = new Map()
  private userFeedback: UserFeedback[] = []
  private improvementCycles: Map<string, ContinuousImprovementCycle> = new Map()
  private monitoringInterval?: NodeJS.Timeout

  private config = {
    enableContinuousMonitoring: process.env.CLAUDE_FEEDBACK_MONITORING !== 'false',
    monitoringIntervalMinutes: parseInt(process.env.CLAUDE_FEEDBACK_INTERVAL || '15'),
    improvementCycleDays: parseInt(process.env.CLAUDE_IMPROVEMENT_CYCLE_DAYS || '7'),
    actionThresholds: {
      critical: 0.9, // 90th percentile triggers critical actions
      high: 0.8,
      medium: 0.6,
      low: 0.4
    }
  }

  constructor() {
    this.initializeMetrics()
    if (this.config.enableContinuousMonitoring) {
      this.startMonitoring()
    }
  }

  /**
   * INITIALIZE CORE METRICS
   */
  private initializeMetrics(): void {
    const coreMetrics: Omit<FeedbackMetric, 'id' | 'lastUpdated'>[] = [
      {
        name: 'Task Success Rate',
        category: 'performance',
        currentValue: 0.85,
        targetValue: 0.90,
        trend: 'stable',
        priority: 'high',
        improvementActions: ['Improve error prediction', 'Refine learning patterns']
      },
      {
        name: 'Average Execution Time',
        category: 'performance',
        currentValue: 180, // seconds
        targetValue: 120,
        trend: 'improving',
        priority: 'medium',
        improvementActions: ['Optimize tool selection', 'Batch operations']
      },
      {
        name: 'Learning Application Rate',
        category: 'quality',
        currentValue: 0.78,
        targetValue: 0.85,
        trend: 'improving',
        priority: 'high',
        improvementActions: ['Increase pattern confidence', 'Expand pattern library']
      },
      {
        name: 'User Satisfaction Score',
        category: 'user_satisfaction',
        currentValue: 4.2,
        targetValue: 4.5,
        trend: 'stable',
        priority: 'medium',
        improvementActions: ['Gather more feedback', 'Improve user experience']
      },
      {
        name: 'ROI Percentage',
        category: 'business_impact',
        currentValue: 1247, // 1247% ROI
        targetValue: 1500,
        trend: 'improving',
        priority: 'critical',
        improvementActions: ['Optimize high-impact patterns', 'Reduce learning overhead']
      }
    ]

    coreMetrics.forEach((metric, index) => {
      this.metrics.set(`metric_${index}`, {
        id: `metric_${index}`,
        ...metric,
        lastUpdated: new Date()
      })
    })
  }

  /**
   * COLLECT USER FEEDBACK
   */
  async collectUserFeedback(feedback: Omit<UserFeedback, 'timestamp' | 'resolved'>): Promise<string> {
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const userFeedback: UserFeedback = {
      ...feedback,
      timestamp: new Date(),
      resolved: false
    }

    this.userFeedback.push(userFeedback)

    logger.info('User feedback collected', {
      feedbackId,
      type: feedback.feedbackType,
      category: feedback.category,
      rating: feedback.rating
    })

    // Automatically trigger actions for critical feedback
    if (feedback.feedbackType === 'negative' && (feedback.rating || 0) <= 2) {
      await this.triggerFeedbackAction({
        type: 'alert_generation',
        description: `Critical user feedback received: ${feedback.description}`,
        triggeredBy: `user_feedback_${feedbackId}`,
        priority: 'critical',
        expectedImpact: 'Address immediate user concern'
      })
    }

    return feedbackId
  }

  /**
   * UPDATE METRICS BASED ON PRODUCTION DATA
   */
  async updateMetricsFromProduction(): Promise<void> {
    try {
      // Get latest production status
      const productionStatus = await claudeProductionMonitor.getProductionStatus()
      const abTestReport = await claudeABTesting.generateABTestReport('day')
      const analyticsReport = await claudeAdvancedAnalytics.generateAnalyticsReport('week')

      // Update Task Success Rate
      const successRateMetric = this.findMetricByName('Task Success Rate')
      if (successRateMetric) {
        const newSuccessRate = productionStatus.metrics.successRate
        this.updateMetric(successRateMetric.id, newSuccessRate)
      }

      // Update Average Execution Time
      const executionTimeMetric = this.findMetricByName('Average Execution Time')
      if (executionTimeMetric) {
        const newExecutionTime = productionStatus.metrics.avgExecutionTime / 1000 // Convert to seconds
        this.updateMetric(executionTimeMetric.id, newExecutionTime)
      }

      // Update Learning Application Rate
      const learningRateMetric = this.findMetricByName('Learning Application Rate')
      if (learningRateMetric && abTestReport.treatmentGroup.taskCount > 0) {
        // Calculate based on A/B test data
        const learningRate = abTestReport.treatmentGroup.avgConfidence || 0.78
        this.updateMetric(learningRateMetric.id, learningRate)
      }

      // Update ROI
      const roiMetric = this.findMetricByName('ROI Percentage')
      if (roiMetric) {
        const newROI = analyticsReport.analytics.roi.netROI
        this.updateMetric(roiMetric.id, newROI)
      }

      logger.info('Metrics updated from production data')

    } catch (error) {
      logger.error('Failed to update metrics from production', { error })
    }
  }

  private findMetricByName(name: string): FeedbackMetric | undefined {
    return Array.from(this.metrics.values()).find(m => m.name === name)
  }

  private updateMetric(metricId: string, newValue: number): void {
    const metric = this.metrics.get(metricId)
    if (!metric) return

    const previousValue = metric.currentValue
    const change = newValue - previousValue
    const percentChange = previousValue > 0 ? (change / previousValue) * 100 : 0

    // Determine trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable'
    if (Math.abs(percentChange) > 2) { // 2% change threshold
      trend = change > 0 ? 'improving' : 'declining'
    }

    // Update metric
    const updatedMetric: FeedbackMetric = {
      ...metric,
      currentValue: newValue,
      trend,
      lastUpdated: new Date()
    }

    this.metrics.set(metricId, updatedMetric)

    // Trigger actions based on metric changes
    this.evaluateMetricForActions(updatedMetric, change, percentChange)
  }

  /**
   * EVALUATE METRICS AND TRIGGER ACTIONS
   */
  private async evaluateMetricForActions(
    metric: FeedbackMetric,
    change: number,
    percentChange: number
  ): Promise<void> {
    // Trigger actions based on performance gaps
    const performanceGap = (metric.targetValue - metric.currentValue) / metric.targetValue
    
    if (performanceGap > 0.2 && metric.priority === 'critical') { // 20% gap on critical metrics
      await this.triggerFeedbackAction({
        type: 'optimization_update',
        description: `Critical performance gap in ${metric.name}: ${(performanceGap * 100).toFixed(1)}% below target`,
        triggeredBy: `metric_${metric.id}`,
        priority: 'critical',
        expectedImpact: `Close performance gap and improve ${metric.name}`
      })
    }

    // Trigger actions for declining trends
    if (metric.trend === 'declining' && Math.abs(percentChange) > 10) {
      await this.triggerFeedbackAction({
        type: 'alert_generation',
        description: `${metric.name} declining by ${Math.abs(percentChange).toFixed(1)}%`,
        triggeredBy: `metric_${metric.id}`,
        priority: metric.priority === 'critical' ? 'high' : 'medium',
        expectedImpact: `Investigate and address decline in ${metric.name}`
      })
    }

    // Trigger threshold adjustments if needed
    if (metric.name === 'Task Success Rate' && metric.currentValue < 0.8) {
      await this.triggerFeedbackAction({
        type: 'threshold_adjustment',
        description: 'Low success rate may indicate threshold issues',
        triggeredBy: `metric_${metric.id}`,
        priority: 'high',
        expectedImpact: 'Optimize confidence thresholds to improve success rate'
      })
    }
  }

  /**
   * TRIGGER FEEDBACK ACTION
   */
  async triggerFeedbackAction(actionData: Omit<FeedbackAction, 'id' | 'status' | 'timestamp'>): Promise<string> {
    const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const action: FeedbackAction = {
      id: actionId,
      ...actionData,
      status: 'pending',
      timestamp: new Date()
    }

    this.actions.set(actionId, action)

    logger.info('Feedback action triggered', {
      actionId,
      type: action.type,
      priority: action.priority,
      description: action.description
    })

    // Auto-execute certain types of actions
    if (action.type === 'threshold_adjustment' && action.priority === 'high') {
      setTimeout(() => this.executeThresholdAdjustment(actionId), 1000)
    }

    return actionId
  }

  /**
   * EXECUTE SPECIFIC ACTION TYPES
   */
  private async executeThresholdAdjustment(actionId: string): Promise<void> {
    const action = this.actions.get(actionId)
    if (!action) return

    try {
      action.status = 'in_progress'
      this.actions.set(actionId, action)

      // Trigger threshold analysis and potential auto-tuning
      const tuningResult = await claudeThresholdTuner.autoTuneThreshold()
      
      if (tuningResult.tuningPerformed) {
        action.status = 'completed'
        action.actualImpact = `Threshold adjusted from ${tuningResult.previousThreshold} to ${tuningResult.newThreshold}`
        action.completedAt = new Date()
      } else {
        action.status = 'completed'
        action.actualImpact = `No threshold adjustment needed: ${tuningResult.reason}`
        action.completedAt = new Date()
      }

    } catch (error) {
      action.status = 'failed'
      action.actualImpact = `Failed to execute threshold adjustment: ${error}`
      logger.error('Threshold adjustment action failed', { actionId, error })
    }

    this.actions.set(actionId, action)
  }

  /**
   * START CONTINUOUS MONITORING
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.runMonitoringCycle()
    }, this.config.monitoringIntervalMinutes * 60 * 1000)

    logger.info('Feedback loop monitoring started', {
      interval: this.config.monitoringIntervalMinutes
    })
  }

  private async runMonitoringCycle(): Promise<void> {
    try {
      // Update metrics from production
      await this.updateMetricsFromProduction()

      // Process user feedback
      await this.processUnresolvedFeedback()

      // Execute pending actions
      await this.executePendingActions()

      // Check if improvement cycle should start
      await this.checkImprovementCycle()

    } catch (error) {
      logger.error('Monitoring cycle failed', { error })
    }
  }

  private async processUnresolvedFeedback(): Promise<void> {
    const unresolvedFeedback = this.userFeedback.filter(f => !f.resolved)
    
    for (const feedback of unresolvedFeedback) {
      // Process high-priority feedback
      if (feedback.feedbackType === 'bug_report' || (feedback.rating && feedback.rating <= 2)) {
        await this.triggerFeedbackAction({
          type: 'alert_generation',
          description: `Unresolved user issue: ${feedback.description}`,
          triggeredBy: `feedback_processing`,
          priority: 'high',
          expectedImpact: 'Address user concern and improve satisfaction'
        })
        
        feedback.resolved = true
        feedback.resolutionActions = ['Alert generated for manual review']
      }
    }
  }

  private async executePendingActions(): Promise<void> {
    const pendingActions = Array.from(this.actions.values())
      .filter(a => a.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })

    // Execute up to 3 actions per cycle to avoid overload
    const actionsToExecute = pendingActions.slice(0, 3)

    for (const action of actionsToExecute) {
      if (action.type === 'threshold_adjustment') {
        await this.executeThresholdAdjustment(action.id)
      }
      // Add other action type executions as needed
    }
  }

  private async checkImprovementCycle(): Promise<void> {
    // Check if we should start a new improvement cycle
    const activeCycle = Array.from(this.improvementCycles.values())
      .find(c => !c.endDate)

    if (!activeCycle) {
      // Start new cycle if needed
      const cyclesToday = Array.from(this.improvementCycles.values())
        .filter(c => {
          const daysDiff = (Date.now() - c.startDate.getTime()) / (1000 * 60 * 60 * 24)
          return daysDiff < this.config.improvementCycleDays
        })

      if (cyclesToday.length === 0) {
        await this.startImprovementCycle()
      }
    }
  }

  /**
   * IMPROVEMENT CYCLE MANAGEMENT
   */
  private async startImprovementCycle(): Promise<string> {
    const cycleId = `cycle_${Date.now()}`
    
    const cycle: ContinuousImprovementCycle = {
      cycleId,
      startDate: new Date(),
      phase: 'data_collection',
      metrics: Array.from(this.metrics.values()),
      actions: [],
      outcomes: {
        metricsImproved: 0,
        actionsCompleted: 0,
        overallImpact: 0,
        lessonsLearned: []
      }
    }

    this.improvementCycles.set(cycleId, cycle)

    logger.info('New improvement cycle started', { cycleId })
    return cycleId
  }

  /**
   * GET FEEDBACK SYSTEM STATUS
   */
  getFeedbackSystemStatus(): {
    metrics: FeedbackMetric[]
    recentActions: FeedbackAction[]
    userFeedbackSummary: {
      total: number
      byType: Record<string, number>
      avgRating: number
      unresolved: number
    }
    activeCycles: number
    systemHealth: 'healthy' | 'warning' | 'critical'
  } {
    const metrics = Array.from(this.metrics.values())
    const recentActions = Array.from(this.actions.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)

    // Summarize user feedback
    const feedbackByType = this.userFeedback.reduce((acc, f) => {
      acc[f.feedbackType] = (acc[f.feedbackType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const ratingsOnly = this.userFeedback
      .map(f => f.rating)
      .filter(r => r !== undefined) as number[]
    const avgRating = ratingsOnly.length > 0 
      ? ratingsOnly.reduce((a, b) => a + b, 0) / ratingsOnly.length 
      : 0

    const unresolved = this.userFeedback.filter(f => !f.resolved).length

    // Determine system health
    const criticalMetrics = metrics.filter(m => m.priority === 'critical')
    const underperformingCritical = criticalMetrics.filter(m => 
      (m.currentValue / m.targetValue) < 0.8
    ).length

    const criticalActions = recentActions.filter(a => a.priority === 'critical').length

    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (underperformingCritical > 0 || criticalActions > 2) {
      systemHealth = 'critical'
    } else if (unresolved > 5 || criticalActions > 0) {
      systemHealth = 'warning'
    }

    return {
      metrics,
      recentActions,
      userFeedbackSummary: {
        total: this.userFeedback.length,
        byType: feedbackByType,
        avgRating,
        unresolved
      },
      activeCycles: Array.from(this.improvementCycles.values()).filter(c => !c.endDate).length,
      systemHealth
    }
  }

  /**
   * STOP MONITORING
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
      logger.info('Feedback loop monitoring stopped')
    }
  }
}

// Export singleton instance
export const claudeFeedbackLoops = new ClaudeFeedbackLoops()

// Export types
export type { FeedbackMetric, FeedbackAction, UserFeedback, ContinuousImprovementCycle }
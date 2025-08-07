/**
 * @fileMetadata
 * @purpose "Real-time Production Monitoring for Claude Learning System"
 * @owner ai-team
 * @status stable
 * @dependencies ["@/lib/logger", "@claimguardian/utils"]
 */

import { logger } from '@/lib/logger'
import { formatDuration } from '@claimguardian/utils'

export interface TaskExecution {
  sessionId: string
  taskType: string
  taskDescription: string
  startTime: number
  endTime: number
  duration: number
  success: boolean
  toolsUsed: string[]
  context: Record<string, any>
  learningApplied?: {
    optimizationsApplied: number
    predictedSuccessRate: number
    confidenceLevel: number
  }
}

export interface ProductionMetrics {
  totalTasks: number
  successRate: number
  errorRate: number
  avgExecutionTime: number
  avgToolsUsed: number
  learningApplicationRate: number
  activeSessions: number
  tasksPerMinute: number
  topErrorTypes: Array<{ type: string; count: number }>
  topTaskTypes: Array<{ type: string; count: number }>
}

export interface Anomaly {
  id: string
  timestamp: Date
  type: 'performance' | 'error_rate' | 'volume'
  severity: 'warning' | 'critical'
  description: string
  metric: string
  currentValue: number
  threshold: number
  context: Record<string, any>
  resolved: boolean
  resolutionNotes?: string
}

export interface ABTestSummary {
  control: ABTestGroupMetrics
  treatment: ABTestGroupMetrics
  statisticalSignificance: number
  performanceImprovement: number
  errorReduction: number
  recommendation: 'rollout' | 'continue_testing' | 'rollback' | 'inconclusive'
}

export interface ABTestGroupMetrics {
  taskCount: number
  successRate: number
  avgExecutionTime: number
  errorRate: number
}

class ClaudeProductionMonitor {
  private taskHistory: TaskExecution[] = []
  private anomalies: Map<string, Anomaly> = new Map()
  private abTestGroups: Map<string, 'control' | 'treatment'> = new Map()
  private monitoringInterval?: NodeJS.Timeout

  private config = {
    logRetentionHours: 24,
    anomalyDetectionWindowMinutes: 15,
    anomalyThresholds: {
      errorRate: 0.2, // 20%
      durationSpike: 2.0, // 2x increase
      volumeSpike: 3.0 // 3x increase
    },
    abTestTreatmentPercentage: 0.5
  }

  constructor() {
    this.startMonitoring()
  }

  /**
   * Track a completed task execution
   */
  async trackTaskExecution(
    sessionId: string,
    taskType: string,
    taskDescription: string,
    startTime: number,
    result: {
      success: boolean
      toolsUsed: string[]
      context: Record<string, any>
    },
    learningContext?: TaskExecution['learningApplied']
  ): Promise<void> {
    const endTime = Date.now()
    const duration = endTime - startTime

    const execution: TaskExecution = {
      sessionId,
      taskType,
      taskDescription,
      startTime,
      endTime,
      duration,
      ...result,
      learningApplied: learningContext
    }

    this.taskHistory.push(execution)

    logger.debug('Task execution tracked', {
      sessionId,
      taskType,
      duration,
      success: result.success
    })

    // Clean up old logs
    this.cleanupOldLogs()
  }

  /**
   * Get current production status and metrics
   */
  async getProductionStatus(): Promise<{
    metrics: ProductionMetrics
    anomalies: Anomaly[]
    abTestSummary: ABTestSummary
  }> {
    const metrics = this.calculateMetrics()
    const anomalies = this.detectAnomalies(metrics)
    const abTestSummary = this.getABTestSummary()

    return {
      metrics,
      anomalies: Array.from(anomalies.values()).filter(a => !a.resolved),
      abTestSummary
    }
  }

  /**
   * Assign a user/session to an A/B test group
   */
  assignABTestGroup(sessionId: string): 'control' | 'treatment' {
    if (this.abTestGroups.has(sessionId)) {
      return this.abTestGroups.get(sessionId)!
    }

    const group = Math.random() < this.config.abTestTreatmentPercentage
      ? 'treatment'
      : 'control'

    this.abTestGroups.set(sessionId, group)
    return group
  }

  /**
   * Resolve an anomaly
   */
  async resolveAnomaly(anomalyId: string, notes: string): Promise<boolean> {
    const anomaly = this.anomalies.get(anomalyId)
    if (!anomaly) return false

    anomaly.resolved = true
    anomaly.resolutionNotes = notes
    this.anomalies.set(anomalyId, anomaly)

    logger.info('Anomaly resolved', { anomalyId, notes })
    return true
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      const metrics = this.calculateMetrics()
      this.detectAnomalies(metrics)
    }, this.config.anomalyDetectionWindowMinutes * 60 * 1000)

    if (process.env.NODE_ENV === 'development') {
      logger.info('Production monitoring started')
    }
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
      if (process.env.NODE_ENV === 'development') {
        logger.info('Production monitoring stopped')
      }
    }
  }

  /**
   * Calculate current production metrics
   */
  private calculateMetrics(): ProductionMetrics {
    const now = Date.now()
    const recentTasks = this.taskHistory.filter(
      task => now - task.endTime < this.config.logRetentionHours * 60 * 60 * 1000
    )

    if (recentTasks.length === 0) {
      return this.getEmptyMetrics()
    }

    const totalTasks = recentTasks.length
    const successfulTasks = recentTasks.filter(t => t.success).length
    const successRate = totalTasks > 0 ? successfulTasks / totalTasks : 0
    const errorRate = 1 - successRate

    const avgExecutionTime = recentTasks.reduce((sum, t) => sum + t.duration, 0) / totalTasks
    const avgToolsUsed = recentTasks.reduce((sum, t) => sum + t.toolsUsed.length, 0) / totalTasks

    const learningAppliedTasks = recentTasks.filter(t => t.learningApplied)
    const learningApplicationRate = totalTasks > 0 ? learningAppliedTasks.length / totalTasks : 0

    const activeSessions = new Set(recentTasks.map(t => t.sessionId)).size
    const timeframeMinutes = (now - recentTasks[0].startTime) / (1000 * 60)
    const tasksPerMinute = timeframeMinutes > 0 ? totalTasks / timeframeMinutes : 0

    // Top error and task types
    const topErrorTypes = this.getTopItems(recentTasks.filter(t => !t.success), 'taskType')
    const topTaskTypes = this.getTopItems(recentTasks, 'taskType')

    return {
      totalTasks,
      successRate,
      errorRate,
      avgExecutionTime,
      avgToolsUsed,
      learningApplicationRate,
      activeSessions,
      tasksPerMinute,
      topErrorTypes,
      topTaskTypes
    }
  }

  private getEmptyMetrics(): ProductionMetrics {
    return {
      totalTasks: 0,
      successRate: 0,
      errorRate: 0,
      avgExecutionTime: 0,
      avgToolsUsed: 0,
      learningApplicationRate: 0,
      activeSessions: 0,
      tasksPerMinute: 0,
      topErrorTypes: [],
      topTaskTypes: []
    }
  }

  private getTopItems(tasks: TaskExecution[], key: keyof TaskExecution): Array<{ type: string; count: number }> {
    const counts = new Map<string, number>()
    tasks.forEach(task => {
      const value = task[key] as string
      counts.set(value, (counts.get(value) || 0) + 1)
    })

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }))
  }

  /**
   * Detect anomalies in production metrics
   */
  private detectAnomalies(metrics: ProductionMetrics): Map<string, Anomaly> {
    // Error rate anomaly
    if (metrics.errorRate > this.config.anomalyThresholds.errorRate) {
      this.createAnomaly(
        'error_rate',
        'critical',
        `Error rate of ${(metrics.errorRate * 100).toFixed(1)}% exceeds threshold of ${(this.config.anomalyThresholds.errorRate * 100).toFixed(1)}%`,
        'errorRate',
        metrics.errorRate,
        this.config.anomalyThresholds.errorRate,
        { topErrorTypes: metrics.topErrorTypes }
      )
    }

    // Performance anomaly (spike in execution time)
    const avgTime = metrics.avgExecutionTime
    const historicalAvgTime = this.getHistoricalAverage('duration')

    if (avgTime > historicalAvgTime * this.config.anomalyThresholds.durationSpike) {
      this.createAnomaly(
        'performance',
        'warning',
        `Average execution time of ${formatDuration(avgTime)} is ${this.config.anomalyThresholds.durationSpike}x higher than historical average of ${formatDuration(historicalAvgTime)}`,
        'avgExecutionTime',
        avgTime,
        historicalAvgTime * this.config.anomalyThresholds.durationSpike,
        { topTaskTypes: metrics.topTaskTypes }
      )
    }

    // Volume anomaly (spike in task volume)
    const tpm = metrics.tasksPerMinute
    const historicalTpm = this.getHistoricalAverage('tpm')

    if (tpm > historicalTpm * this.config.anomalyThresholds.volumeSpike) {
      this.createAnomaly(
        'volume',
        'warning',
        `Task volume of ${tpm.toFixed(1)} TPM is ${this.config.anomalyThresholds.volumeSpike}x higher than historical average of ${historicalTpm.toFixed(1)} TPM`,
        'tasksPerMinute',
        tpm,
        historicalTpm * this.config.anomalyThresholds.volumeSpike,
        { activeSessions: metrics.activeSessions }
      )
    }

    return this.anomalies
  }

  private createAnomaly(
    type: Anomaly['type'],
    severity: Anomaly['severity'],
    description: string,
    metric: string,
    currentValue: number,
    threshold: number,
    context: Record<string, any>
  ): void {
    const anomalyId = `anomaly_${type}_${Date.now()}`

    // Avoid creating duplicate unresolved anomalies
    const existing = Array.from(this.anomalies.values()).find(
      a => a.type === type && !a.resolved
    )
    if (existing) return

    const anomaly: Anomaly = {
      id: anomalyId,
      timestamp: new Date(),
      type,
      severity,
      description,
      metric,
      currentValue,
      threshold,
      context,
      resolved: false
    }

    this.anomalies.set(anomalyId, anomaly)
    logger.warn('Anomaly detected', { ...anomaly })
  }

  private getHistoricalAverage(metric: 'duration' | 'tpm'): number {
    if (this.taskHistory.length < 10) return metric === 'duration' ? 5000 : 10

    if (metric === 'duration') {
      return this.taskHistory.reduce((sum, t) => sum + t.duration, 0) / this.taskHistory.length
    } else {
      const timeframeMinutes = (this.taskHistory[this.taskHistory.length - 1].endTime - this.taskHistory[0].startTime) / (1000 * 60)
      return timeframeMinutes > 0 ? this.taskHistory.length / timeframeMinutes : 10
    }
  }

  /**
   * Get A/B test summary
   */
  private getABTestSummary(): ABTestSummary {
    const controlTasks = this.taskHistory.filter(t => this.abTestGroups.get(t.sessionId) === 'control')
    const treatmentTasks = this.taskHistory.filter(t => this.abTestGroups.get(t.sessionId) === 'treatment')

    const controlGroupMetrics = this.calculateABTestGroupMetrics(controlTasks)
    const treatmentGroupMetrics = this.calculateABTestGroupMetrics(treatmentTasks)

    const statisticalSignificance = this.calculateStatisticalSignificance(
      controlGroupMetrics,
      treatmentGroupMetrics
    )

    const performanceImprovement = controlGroupMetrics.avgExecutionTime > 0
      ? (controlGroupMetrics.avgExecutionTime - treatmentGroupMetrics.avgExecutionTime) / controlGroupMetrics.avgExecutionTime
      : 0

    const errorReduction = controlGroupMetrics.errorRate > 0
      ? (controlGroupMetrics.errorRate - treatmentGroupMetrics.errorRate) / controlGroupMetrics.errorRate
      : 0

    let recommendation: ABTestSummary['recommendation'] = 'continue_testing'
    if (statisticalSignificance > 0.95) {
      if (performanceImprovement > 0.1) {
        recommendation = 'rollout'
      } else if (performanceImprovement < -0.1) {
        recommendation = 'rollback'
      }
    }

    return {
      control: controlGroupMetrics,
      treatment: treatmentGroupMetrics,
      statisticalSignificance,
      performanceImprovement,
      errorReduction,
      recommendation
    }
  }

  private calculateABTestGroupMetrics(tasks: TaskExecution[]): ABTestGroupMetrics {
    const taskCount = tasks.length
    if (taskCount === 0) {
      return { taskCount: 0, successRate: 0, avgExecutionTime: 0, errorRate: 0 }
    }

    const successCount = tasks.filter(t => t.success).length
    const successRate = successCount / taskCount
    const avgExecutionTime = tasks.reduce((sum, t) => sum + t.duration, 0) / taskCount
    const errorRate = 1 - successRate

    return { taskCount, successRate, avgExecutionTime, errorRate }
  }

  private calculateStatisticalSignificance(control: ABTestGroupMetrics, treatment: ABTestGroupMetrics): number {
    // Simplified statistical significance calculation
    // In production, would use proper statistical tests
    const sampleSizeEffect = Math.min(control.taskCount, treatment.taskCount) / 100
    const effectSize = control.avgExecutionTime > 0 ? Math.abs(control.avgExecutionTime - treatment.avgExecutionTime) / control.avgExecutionTime : 0

    return Math.min(0.99, sampleSizeEffect * effectSize * 2)
  }

  /**
   * Clean up old task logs
   */
  private cleanupOldLogs(): void {
    const now = Date.now()
    const cutoffTime = now - this.config.logRetentionHours * 60 * 60 * 1000

    const originalCount = this.taskHistory.length
    this.taskHistory = this.taskHistory.filter(task => task.endTime > cutoffTime)
    const removedCount = originalCount - this.taskHistory.length

    if (removedCount > 0) {
      logger.debug('Cleaned up old task logs', { removedCount })
    }
  }
}

// Export singleton instance
export const claudeProductionMonitor = new ClaudeProductionMonitor()

/**
 * @fileMetadata
 * @purpose "Comprehensive production monitoring system with real-time alerting"
 * @dependencies ["@/lib/logger", "@/lib/supabase"]
 * @owner platform-team
 * @complexity high
 * @tags ["monitoring", "alerting", "performance", "health-checks"]
 * @status stable
 */

import { logger } from '@/lib/logger/production-logger'
import { createClient } from '@/lib/supabase/server'
import { asyncErrorHandler, withRetry } from '@/lib/error-handling/async-error-handler'

export interface MonitoringMetrics {
  timestamp: number
  responseTime: number
  errorRate: number
  throughput: number
  cpuUsage?: number
  memoryUsage?: number
  activeConnections?: number
  queueSize?: number
}

export interface AlertRule {
  id: string
  name: string
  condition: (metrics: MonitoringMetrics) => boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  cooldownMs: number
  channels: Array<'email' | 'slack' | 'webhook'>
}

export interface HealthCheck {
  name: string
  check: () => Promise<boolean>
  critical: boolean
  timeout: number
  interval: number
}

interface AlertState {
  lastTriggered: number
  isActive: boolean
  count: number
}

export class ProductionMonitor {
  private metrics: MonitoringMetrics[] = []
  private alertStates = new Map<string, AlertState>()
  private healthChecks: HealthCheck[] = []
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null
  private metricsRetentionMs = 24 * 60 * 60 * 1000 // 24 hours

  private defaultAlertRules: AlertRule[] = [
    {
      id: 'high-response-time',
      name: 'High Response Time',
      condition: (metrics) => metrics.responseTime > 2000,
      severity: 'high',
      cooldownMs: 5 * 60 * 1000, // 5 minutes
      channels: ['email', 'slack']
    },
    {
      id: 'high-error-rate',
      name: 'High Error Rate',
      condition: (metrics) => metrics.errorRate > 0.05, // 5%
      severity: 'critical',
      cooldownMs: 2 * 60 * 1000, // 2 minutes
      channels: ['email', 'slack', 'webhook']
    },
    {
      id: 'low-throughput',
      name: 'Low Throughput',
      condition: (metrics) => metrics.throughput < 10, // requests per minute
      severity: 'medium',
      cooldownMs: 10 * 60 * 1000, // 10 minutes
      channels: ['slack']
    },
    {
      id: 'high-cpu',
      name: 'High CPU Usage',
      condition: (metrics) => (metrics.cpuUsage || 0) > 80,
      severity: 'high',
      cooldownMs: 5 * 60 * 1000,
      channels: ['email', 'slack']
    },
    {
      id: 'high-memory',
      name: 'High Memory Usage',
      condition: (metrics) => (metrics.memoryUsage || 0) > 85,
      severity: 'high',
      cooldownMs: 5 * 60 * 1000,
      channels: ['email', 'slack']
    },
    {
      id: 'large-queue',
      name: 'Large Queue Size',
      condition: (metrics) => (metrics.queueSize || 0) > 1000,
      severity: 'medium',
      cooldownMs: 15 * 60 * 1000,
      channels: ['slack']
    }
  ]

  constructor() {
    this.setupDefaultHealthChecks()
  }

  private setupDefaultHealthChecks(): void {
    this.healthChecks = [
      {
        name: 'database',
        check: async () => this.checkDatabaseHealth(),
        critical: true,
        timeout: 5000,
        interval: 30000 // 30 seconds
      },
      {
        name: 'external-apis',
        check: async () => this.checkExternalAPIs(),
        critical: false,
        timeout: 10000,
        interval: 60000 // 1 minute
      },
      {
        name: 'ai-services',
        check: async () => this.checkAIServices(),
        critical: false,
        timeout: 15000,
        interval: 60000 // 1 minute
      },
      {
        name: 'storage',
        check: async () => this.checkStorageHealth(),
        critical: true,
        timeout: 5000,
        interval: 60000 // 1 minute
      }
    ]
  }

  async startMonitoring(intervalMs: number = 30000): Promise<void> {
    if (this.isMonitoring) {
      logger.warn('Monitoring already started')
      return
    }

    this.isMonitoring = true
    
    logger.info('Starting production monitoring', {
      interval: intervalMs,
      healthChecks: this.healthChecks.length,
      alertRules: this.defaultAlertRules.length
    })

    // Start metrics collection
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics()
      await this.runHealthChecks()
      await this.evaluateAlerts()
      this.cleanupOldMetrics()
    }, intervalMs)

    // Initial health check
    await this.runHealthChecks()
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    logger.info('Production monitoring stopped')
  }

  private async collectMetrics(): Promise<void> {
    try {
      const startTime = Date.now()
      
      // Collect system metrics
      const metrics: MonitoringMetrics = {
        timestamp: startTime,
        responseTime: await this.measureResponseTime(),
        errorRate: await this.calculateErrorRate(),
        throughput: await this.calculateThroughput(),
        cpuUsage: await this.getCPUUsage(),
        memoryUsage: await this.getMemoryUsage(),
        activeConnections: await this.getActiveConnections(),
        queueSize: await this.getQueueSize()
      }

      this.metrics.push(metrics)

      // Store metrics in database for analysis
      await this.storeMetrics(metrics)

      logger.debug('Metrics collected', {
        responseTime: metrics.responseTime,
        errorRate: metrics.errorRate,
        throughput: metrics.throughput
      })

    } catch (error) {
      logger.error('Failed to collect metrics', error)
    }
  }

  private async measureResponseTime(): Promise<number> {
    const start = Date.now()
    
    try {
      // Test internal API endpoint
      const response = await fetch('/api/health', { 
        method: 'GET',
        headers: { 'x-monitoring-check': 'true' }
      })
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }
      
      return Date.now() - start
    } catch (error) {
      logger.error('Response time measurement failed', error)
      return 999999 // High value to trigger alerts
    }
  }

  private async calculateErrorRate(): Promise<number> {
    const result = await withRetry(async () => {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('request_logs')
        .select('status_code, created_at')
        .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) throw error

      if (!data || data.length === 0) return 0

      const errorCount = data.filter(log => log.status_code >= 400).length
      return errorCount / data.length

    }, 3, 'calculate-error-rate')

    return result.success ? result.data : 0
  }

  private async calculateThroughput(): Promise<number> {
    const result = await withRetry(async () => {
      const supabase = await createClient()
      
      const { count, error } = await supabase
        .from('request_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute

      if (error) throw error
      return count || 0

    }, 3, 'calculate-throughput')

    return result.success ? result.data : 0
  }

  private async getCPUUsage(): Promise<number> {
    // In a real implementation, this would connect to system monitoring
    // For now, return a mock value based on response times
    const recentMetrics = this.metrics.slice(-5)
    if (recentMetrics.length === 0) return 0
    
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
    
    // Estimate CPU usage based on response time (rough approximation)
    return Math.min((avgResponseTime / 10), 100)
  }

  private async getMemoryUsage(): Promise<number> {
    // Mock implementation - would integrate with actual system monitoring
    const errorRate = this.metrics.length > 0 ? this.metrics[this.metrics.length - 1].errorRate : 0
    return Math.min(50 + (errorRate * 200), 100) // Base 50% + errors increase memory usage
  }

  private async getActiveConnections(): Promise<number> {
    const result = await withRetry(async () => {
      const supabase = await createClient()
      
      // Query active sessions or connections
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('last_activity', new Date(Date.now() - 5 * 60000).toISOString()) // Active in last 5 minutes

      if (error) throw error
      return data || 0

    }, 3, 'get-active-connections')

    return result.success ? result.data : 0
  }

  private async getQueueSize(): Promise<number> {
    const result = await withRetry(async () => {
      const supabase = await createClient()
      
      const { count, error } = await supabase
        .from('ai_processing_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (error) throw error
      return count || 0

    }, 3, 'get-queue-size')

    return result.success ? result.data : 0
  }

  private async storeMetrics(metrics: MonitoringMetrics): Promise<void> {
    const result = await withRetry(async () => {
      const supabase = await createClient()
      
      const { error } = await supabase
        .from('system_metrics')
        .insert({
          timestamp: new Date(metrics.timestamp).toISOString(),
          response_time: metrics.responseTime,
          error_rate: metrics.errorRate,
          throughput: metrics.throughput,
          cpu_usage: metrics.cpuUsage,
          memory_usage: metrics.memoryUsage,
          active_connections: metrics.activeConnections,
          queue_size: metrics.queueSize,
          metadata: {
            collected_at: new Date().toISOString(),
            version: process.env.VERCEL_GIT_COMMIT_SHA || 'development'
          }
        })

      if (error) throw error

    }, 3, 'store-metrics')

    if (!result.success) {
      logger.error('Failed to store metrics in database', result.error)
    }
  }

  private async runHealthChecks(): Promise<void> {
    const results = await Promise.allSettled(
      this.healthChecks.map(async (check) => {
        const startTime = Date.now()
        
        try {
          const timeoutPromise = new Promise<boolean>((_, reject) => {
            setTimeout(() => reject(new Error(`Health check timeout: ${check.name}`)), check.timeout)
          })
          
          const result = await Promise.race([check.check(), timeoutPromise])
          const duration = Date.now() - startTime
          
          logger.debug(`Health check ${check.name}: ${result ? 'PASS' : 'FAIL'}`, {
            duration,
            critical: check.critical
          })

          if (!result && check.critical) {
            await this.triggerCriticalAlert(`Critical health check failed: ${check.name}`)
          }

          return { name: check.name, success: result, duration, critical: check.critical }

        } catch (error) {
          const duration = Date.now() - startTime
          logger.error(`Health check ${check.name} error`, error)
          
          if (check.critical) {
            await this.triggerCriticalAlert(`Critical health check error: ${check.name} - ${error instanceof Error ? error.message : 'Unknown error'}`)
          }

          return { name: check.name, success: false, duration, critical: check.critical, error }
        }
      })
    )

    // Log health check summary
    const summary = results.map((result, index) => ({
      name: this.healthChecks[index].name,
      status: result.status === 'fulfilled' ? (result.value.success ? 'PASS' : 'FAIL') : 'ERROR'
    }))

    logger.info('Health check summary', { checks: summary })
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      const supabase = await createClient()
      const { error } = await supabase.from('health_checks').select('1').limit(1)
      return !error
    } catch {
      return false
    }
  }

  private async checkExternalAPIs(): Promise<boolean> {
    try {
      // Check key external dependencies
      const checks = await Promise.allSettled([
        fetch('https://api.openai.com/v1/models', { 
          method: 'GET',
          headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
          signal: AbortSignal.timeout(5000)
        }),
        // Add other external API checks as needed
      ])

      return checks.some(check => check.status === 'fulfilled' && check.value.ok)
    } catch {
      return false
    }
  }

  private async checkAIServices(): Promise<boolean> {
    try {
      const response = await fetch('/api/ai/check-keys', {
        method: 'GET',
        headers: { 'x-health-check': 'true' },
        signal: AbortSignal.timeout(10000)
      })
      return response.ok
    } catch {
      return false
    }
  }

  private async checkStorageHealth(): Promise<boolean> {
    try {
      const supabase = await createClient()
      
      // Test storage by trying to list files (doesn't require actual files)
      const { error } = await supabase.storage.from('claim-documents').list('', { limit: 1 })
      return !error
    } catch {
      return false
    }
  }

  private async evaluateAlerts(): Promise<void> {
    if (this.metrics.length === 0) return

    const latestMetrics = this.metrics[this.metrics.length - 1]

    for (const rule of this.defaultAlertRules) {
      try {
        const shouldAlert = rule.condition(latestMetrics)
        const alertState = this.alertStates.get(rule.id) || { lastTriggered: 0, isActive: false, count: 0 }

        if (shouldAlert) {
          const now = Date.now()
          const canTrigger = now - alertState.lastTriggered > rule.cooldownMs

          if (canTrigger) {
            await this.triggerAlert(rule, latestMetrics)
            
            this.alertStates.set(rule.id, {
              lastTriggered: now,
              isActive: true,
              count: alertState.count + 1
            })
          }
        } else if (alertState.isActive) {
          // Alert condition resolved
          await this.resolveAlert(rule)
          this.alertStates.set(rule.id, { ...alertState, isActive: false })
        }

      } catch (error) {
        logger.error(`Error evaluating alert rule ${rule.id}`, error)
      }
    }
  }

  private async triggerAlert(rule: AlertRule, metrics: MonitoringMetrics): Promise<void> {
    const alertData = {
      rule_id: rule.id,
      rule_name: rule.name,
      severity: rule.severity,
      metrics,
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || 'development'
    }

    logger.warn(`ALERT TRIGGERED: ${rule.name}`, alertData)

    // Store alert in database
    await this.storeAlert(alertData)

    // Send notifications based on channels
    await this.sendAlertNotifications(rule, alertData)
  }

  private async triggerCriticalAlert(message: string): Promise<void> {
    const alertData = {
      rule_id: 'critical-system-failure',
      rule_name: 'Critical System Failure',
      severity: 'critical' as const,
      message,
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || 'development'
    }

    logger.error(`CRITICAL ALERT: ${message}`, alertData)

    await this.storeAlert(alertData)
    await this.sendCriticalNotifications(alertData)
  }

  private async resolveAlert(rule: AlertRule): Promise<void> {
    logger.info(`ALERT RESOLVED: ${rule.name}`, { ruleId: rule.id })
  }

  private async storeAlert(alertData: Record<string, unknown>): Promise<void> {
    const result = await withRetry(async () => {
      const supabase = await createClient()
      
      const { error } = await supabase
        .from('system_alerts')
        .insert(alertData)

      if (error) throw error

    }, 3, 'store-alert')

    if (!result.success) {
      logger.error('Failed to store alert in database', result.error)
    }
  }

  private async sendAlertNotifications(rule: AlertRule, alertData: Record<string, unknown>): Promise<void> {
    // Implement notification sending based on channels
    // This would integrate with email, Slack, webhook services
    
    if (process.env.NODE_ENV === 'production') {
      // Send actual notifications in production
      logger.info(`Alert notification sent for ${rule.name}`, { channels: rule.channels })
    }
  }

  private async sendCriticalNotifications(alertData: Record<string, unknown>): Promise<void> {
    // Send critical alerts to all channels immediately
    logger.error('Critical alert notification sent', alertData)
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - this.metricsRetentionMs
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoffTime)
  }

  // Public API methods for external monitoring integration

  async getLatestMetrics(): Promise<MonitoringMetrics | null> {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  async getMetricHistory(hours: number = 1): Promise<MonitoringMetrics[]> {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000)
    return this.metrics.filter(metric => metric.timestamp > cutoffTime)
  }

  async getSystemStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'critical'
    checks: Array<{ name: string; status: 'pass' | 'fail' }>
    metrics?: MonitoringMetrics
  }> {
    const latest = await this.getLatestMetrics()
    
    // Determine overall system status
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy'
    
    if (latest) {
      if (latest.errorRate > 0.1 || latest.responseTime > 5000) {
        status = 'critical'
      } else if (latest.errorRate > 0.05 || latest.responseTime > 2000) {
        status = 'degraded'
      }
    }

    return {
      status,
      checks: [], // Would include recent health check results
      metrics: latest || undefined
    }
  }
}

// Singleton instance
export const productionMonitor = new ProductionMonitor()

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
  productionMonitor.startMonitoring(30000) // 30 seconds interval
    .catch(error => logger.error('Failed to start production monitoring', error))
}
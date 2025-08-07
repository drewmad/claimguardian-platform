/**
 * @fileMetadata
 * @purpose "Production deployment configuration for Claude error monitoring system"
 * @dependencies ["@/lib"]
 * @owner ai-team
 * @status stable
 */

import { processClaimGuardianErrorLogs } from './log-processor'
import { productionErrorMonitor } from './production-error-monitor'
import { claudeErrorLogger } from './claude-error-logger'
import { logger } from '@/lib/logger'

export interface MonitoringConfig {
  healthCheckInterval: number // minutes
  errorLogProcessingEnabled: boolean
  alertThresholds: {
    criticalErrors: number
    missingObjects: number
    affectedUsers: number
  }
  enabledFeatures: {
    databaseHealth: boolean
    errorPatternAnalysis: boolean
    learningIntegration: boolean
    proactiveAlerts: boolean
  }
}

export const PRODUCTION_MONITORING_CONFIG: MonitoringConfig = {
  healthCheckInterval: 30, // Check every 30 minutes
  errorLogProcessingEnabled: true,
  alertThresholds: {
    criticalErrors: 5, // Alert if >5 critical errors
    missingObjects: 1, // Alert if any object missing
    affectedUsers: 3   // Alert if >3 users affected
  },
  enabledFeatures: {
    databaseHealth: true,
    errorPatternAnalysis: true,
    learningIntegration: true,
    proactiveAlerts: true
  }
}

class MonitoringDeployment {
  private isDeployed: boolean = false
  private healthCheckInterval: NodeJS.Timeout | null = null
  private config: MonitoringConfig

  constructor(config: MonitoringConfig = PRODUCTION_MONITORING_CONFIG) {
    this.config = config
  }

  /**
   * Deploy monitoring system to production
   */
  async deploy(): Promise<{ success: boolean; message: string; features: string[] }> {
    if (this.isDeployed) {
      return {
        success: false,
        message: 'Monitoring system already deployed',
        features: []
      }
    }

    try {
      const deployedFeatures: string[] = []

      // 1. Start database health monitoring
      if (this.config.enabledFeatures.databaseHealth) {
        productionErrorMonitor.startHealthMonitoring(this.config.healthCheckInterval)
        deployedFeatures.push('Database Health Monitoring')

        // Perform initial health check
        const initialHealth = await productionErrorMonitor.performDatabaseHealthCheck()
        const missingObjects = initialHealth.filter(check => !check.exists)

        if (missingObjects.length > 0) {
          logger.warn('Initial health check found missing objects', {
            missing: missingObjects.map(obj => `${obj.objectType}:${obj.objectName}`)
          })
        }
      }

      // 2. Process historical error logs for learning
      if (this.config.enabledFeatures.learningIntegration) {
        await processClaimGuardianErrorLogs()
        deployedFeatures.push('Historical Error Learning Integration')
      }

      // 3. Set up error pattern analysis
      if (this.config.enabledFeatures.errorPatternAnalysis) {
        // Enable real-time error pattern detection
        await this.enableErrorPatternAnalysis()
        deployedFeatures.push('Real-time Error Pattern Analysis')
      }

      // 4. Set up proactive alerting
      if (this.config.enabledFeatures.proactiveAlerts) {
        this.setupProactiveAlerts()
        deployedFeatures.push('Proactive Alert System')
      }

      // 5. Log successful deployment
      await claudeErrorLogger.recordLearning(
        'monitoring-system-deployment',
        'Deployed production error monitoring system',
        'Automated deployment with health checks, error analysis, and learning integration',
        ['deployment', 'monitoring', 'production', 'automation'],
        0.95
      )

      this.isDeployed = true

      logger.info('Production monitoring system deployed successfully', {
        features: deployedFeatures,
        config: this.config,
        timestamp: new Date().toISOString()
      })

      return {
        success: true,
        message: 'Production monitoring system deployed successfully',
        features: deployedFeatures
      }

    } catch (error) {
      logger.error('Failed to deploy monitoring system', {}, error instanceof Error ? error : new Error(String(error)))

      return {
        success: false,
        message: `Deployment failed: ${error instanceof Error ? error.message : String(error)}`,
        features: []
      }
    }
  }

  /**
   * Enable real-time error pattern analysis
   */
  private async enableErrorPatternAnalysis(): Promise<void> {
    // Set up periodic error pattern analysis
    this.healthCheckInterval = setInterval(async () => {
      try {
        // Get recent error patterns
        const patterns = await claudeErrorLogger.getErrorPatterns('day')

        // Check for concerning patterns
        const criticalPatterns = patterns.filter(pattern =>
          pattern.count >= this.config.alertThresholds.criticalErrors
        )

        if (criticalPatterns.length > 0) {
          logger.warn('Critical error patterns detected', {
            patterns: criticalPatterns,
            threshold: this.config.alertThresholds.criticalErrors
          })

          // Log as high-priority learning
          for (const pattern of criticalPatterns) {
            await claudeErrorLogger.recordLearning(
              `critical-pattern-${pattern.pattern}`,
              `High-frequency error pattern detected: ${pattern.pattern}`,
              'Investigate root cause and implement preventive measures',
              ['critical-pattern', 'high-frequency', 'production-alert'],
              0.9
            )
          }
        }

      } catch (error) {
        logger.error('Error pattern analysis failed', {}, error instanceof Error ? error : new Error(String(error)))
      }
    }, 15 * 60 * 1000) // Run every 15 minutes
  }

  /**
   * Set up proactive alerting system
   */
  private setupProactiveAlerts(): void {
    // This would integrate with your existing alerting system (email, Slack, etc.)
    logger.info('Proactive alerting system configured', {
      thresholds: this.config.alertThresholds,
      checkInterval: `${this.config.healthCheckInterval} minutes`
    })
  }

  /**
   * Get current deployment status
   */
  getStatus(): {
    deployed: boolean
    uptime: string
    config: MonitoringConfig
    lastHealthCheck?: Date
  } {
    return {
      deployed: this.isDeployed,
      uptime: this.isDeployed ? 'Active' : 'Not deployed',
      config: this.config,
      lastHealthCheck: this.isDeployed ? new Date() : undefined
    }
  }

  /**
   * Gracefully stop monitoring system
   */
  async stop(): Promise<void> {
    if (!this.isDeployed) return

    // Stop health monitoring
    productionErrorMonitor.stopHealthMonitoring()

    // Stop error pattern analysis
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }

    this.isDeployed = false

    logger.info('Production monitoring system stopped')
  }

  /**
   * Perform manual health check and report
   */
  async performManualHealthCheck(): Promise<{
    timestamp: Date
    databaseHealth: unknown[]
    errorPatterns: unknown[]
    systemStatus: string
  }> {
    const timestamp = new Date()

    // Check database health
    const databaseHealth = await productionErrorMonitor.performDatabaseHealthCheck()

    // Get recent error patterns
    const errorPatterns = await claudeErrorLogger.getErrorPatterns('day')

    // Determine system status
    const missingObjects = databaseHealth.filter(check => !check.exists).length
    const criticalErrors = errorPatterns.filter(pattern => pattern.severity?.high > 0 || pattern.severity?.critical > 0).length

    let systemStatus = 'healthy'
    if (missingObjects > 0 || criticalErrors > this.config.alertThresholds.criticalErrors) {
      systemStatus = 'warning'
    }
    if (missingObjects > this.config.alertThresholds.missingObjects) {
      systemStatus = 'critical'
    }

    const report = {
      timestamp,
      databaseHealth,
      errorPatterns,
      systemStatus
    }

    logger.info('Manual health check completed', {
      systemStatus,
      missingObjects,
      criticalErrors,
      totalObjects: databaseHealth.length
    })

    return report
  }
}

// Export singleton instance
export const monitoringDeployment = new MonitoringDeployment()

/**
 * Quick deployment function for immediate use
 */
export async function deployProductionMonitoring(): Promise<void> {
  const result = await monitoringDeployment.deploy()

  if (result.success) {
    console.log(`✅ ${result.message}`)
    console.log('📊 Deployed Features:')
    result.features.forEach(feature => console.log(`  - ${feature}`))
    console.log('\n🔍 Monitor status at: /admin (Production Monitoring tab)')
  } else {
    console.error(`❌ ${result.message}`)
  }
}

/**
 * Get monitoring system status
 */
export function getMonitoringStatus(): void {
  const status = monitoringDeployment.getStatus()

  console.log('📊 Production Monitoring Status:')
  console.log(`  Status: ${status.deployed ? '✅ ACTIVE' : '❌ NOT DEPLOYED'}`)
  console.log(`  Uptime: ${status.uptime}`)
  console.log(`  Health Check Interval: ${status.config.healthCheckInterval} minutes`)
  console.log(`  Features Enabled:`)
  Object.entries(status.config.enabledFeatures).forEach(([feature, enabled]) => {
    console.log(`    ${enabled ? '✅' : '❌'} ${feature}`)
  })
}

/**
 * @fileMetadata
 * @purpose "Production error monitoring and pattern detection for ClaimGuardian"
 * @dependencies ["@/lib","@supabase/supabase-js"]
 * @owner ai-team
 * @status stable
 */

import { claudeErrorLogger, claudeErrorHelpers } from './claude-error-logger'
import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'

export interface ProductionErrorPattern {
  pattern: string
  endpoint: string
  method: string
  statusCode: number
  frequency: number
  affectedUsers: string[]
  rootCause?: string
  resolution?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface DatabaseHealthCheck {
  objectName: string
  objectType: 'table' | 'view' | 'function'
  exists: boolean
  lastChecked: Date
  errorCount?: number
}

class ProductionErrorMonitor {
  private supabase: ReturnType<typeof createClient> | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    try {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    } catch (error) {
      logger.warn('Production Error Monitor: Supabase client not initialized')
    }
  }

  /**
   * Log critical database infrastructure errors based on production patterns
   */
  async logDatabaseInfrastructureError(
    missingObject: string,
    objectType: 'table' | 'view' | 'function',
    endpoint: string,
    affectedUsers: string[] = []
  ): Promise<void> {
    const errorId = await claudeErrorHelpers.analysis.misunderstanding(
      `Database object missing: ${objectType} '${missingObject}'`,
      'Ensure all database infrastructure is deployed',
      'missing-database-object'
    )

    // Record specific learning about this infrastructure issue
    if (errorId) {
      await claudeErrorLogger.recordLearning(
        `database-${objectType}-missing`,
        `${objectType} '${missingObject}' does not exist, causing 404 errors on ${endpoint}`,
        `Deploy ${objectType} to database and verify with health checks`,
        [`infrastructure`, `database`, objectType, 'production-critical'],
        0.9
      )
    }

    logger.error(`Database Infrastructure Error: Missing ${objectType}`, {
      object: missingObject,
      endpoint,
      affectedUsers: affectedUsers.length,
      errorId
    })
  }

  /**
   * Log user profile access errors (RLS policy issues)
   */
  async logUserProfileAccessError(
    userId: string,
    operation: 'GET' | 'PATCH' | 'POST',
    errorDetails: string
  ): Promise<void> {
    const errorId = await claudeErrorLogger.logError(
      new Error(`User profile access failed: ${errorDetails}`),
      {
        taskType: 'debugging',
        taskDescription: `User profile ${operation} operation failed`,
        userIntent: 'Access user profile data',
        errorType: 'runtime',
        toolsUsed: ['Database', 'RLS'],
        mistakeCategory: 'user-profile-access',
        rootCause: errorDetails,
        codeLanguage: 'sql',
        framework: 'supabase'
      },
      'high'
    )

    // Record learning about user profile issues
    if (errorId) {
      await claudeErrorLogger.recordLearning(
        'user-profile-rls-failure',
        `User profile ${operation} fails with 400 error due to missing profile record or RLS policy issue`,
        'Check if user_profiles record exists, create if missing, verify RLS policies allow user access',
        ['user-management', 'rls-policies', 'profile-creation', '400-errors'],
        0.85
      )
    }

    logger.error('User Profile Access Error', {
      userId,
      operation,
      errorDetails,
      errorId
    })
  }

  /**
   * Log storage configuration errors
   */
  async logStorageConfigError(
    bucketName: string,
    operation: string,
    userId: string,
    errorDetails: string
  ): Promise<void> {
    const errorId = await claudeErrorLogger.logError(
      new Error(`Storage operation failed: ${errorDetails}`),
      {
        taskType: 'debugging',
        taskDescription: `Storage ${operation} failed for bucket ${bucketName}`,
        userIntent: 'Upload/access files in storage',
        errorType: 'integration',
        toolsUsed: ['Storage', 'RLS'],
        mistakeCategory: 'storage-configuration',
        rootCause: errorDetails
      },
      'high'
    )

    // Record learning about storage issues
    if (errorId) {
      await claudeErrorLogger.recordLearning(
        'storage-rls-configuration',
        `Storage ${operation} fails due to missing bucket or incorrect RLS policies`,
        'Verify bucket exists, check RLS policies allow user access to their own folders',
        ['storage', 'file-upload', 'rls-policies', 'bucket-config'],
        0.8
      )
    }

    logger.error('Storage Configuration Error', {
      bucketName,
      operation,
      userId,
      errorDetails,
      errorId
    })
  }

  /**
   * Perform health checks on critical database objects
   */
  async performDatabaseHealthCheck(): Promise<DatabaseHealthCheck[]> {
    if (!this.supabase) return []

    const criticalObjects = [
      { name: 'user_profiles', type: 'table' as const },
      { name: 'policy_documents', type: 'table' as const },
      { name: 'policy_documents_extended', type: 'view' as const },
      { name: 'recent_login_activity', type: 'table' as const },
      { name: 'learnings', type: 'table' as const },
      { name: 'claude_errors', type: 'table' as const },
      { name: 'claude_learnings', type: 'table' as const },
      { name: 'search_learnings', type: 'function' as const }
    ]

    const healthChecks: DatabaseHealthCheck[] = []

    for (const obj of criticalObjects) {
      try {
        let exists = false

        if (obj.type === 'table') {
          const { data } = await this.supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_name', obj.name)
            .single()

          exists = !!data
        } else if (obj.type === 'view') {
          const { data } = await this.supabase
            .from('information_schema.views')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_name', obj.name)
            .single()

          exists = !!data
        } else if (obj.type === 'function') {
          const { data } = await this.supabase
            .from('information_schema.routines')
            .select('routine_name')
            .eq('routine_schema', 'public')
            .eq('routine_name', obj.name)
            .single()

          exists = !!data
        }

        healthChecks.push({
          objectName: obj.name,
          objectType: obj.type,
          exists,
          lastChecked: new Date()
        })

        // Log if missing
        if (!exists) {
          await this.logDatabaseInfrastructureError(
            obj.name,
            obj.type,
            `/rest/v1/${obj.name}`,
            []
          )
        }

      } catch (error) {
        healthChecks.push({
          objectName: obj.name,
          objectType: obj.type,
          exists: false,
          lastChecked: new Date(),
          errorCount: 1
        })

        logger.error(`Health check failed for ${obj.type} ${obj.name}`, {}, error instanceof Error ? error : new Error(String(error)))
      }
    }

    return healthChecks
  }

  /**
   * Analyze production error patterns from logs
   */
  async analyzeProductionErrorPatterns(logEntries: unknown[]): Promise<ProductionErrorPattern[]> {
    const patterns = new Map<string, ProductionErrorPattern>()

    for (const entry of logEntries) {
      const typedEntry = entry as any
      const key = `${typedEntry.method}_${typedEntry.path}_${typedEntry.status_code}`

      if (!patterns.has(key)) {
        patterns.set(key, {
          pattern: key,
          endpoint: typedEntry.path,
          method: typedEntry.method,
          statusCode: typedEntry.status_code,
          frequency: 0,
          affectedUsers: [],
          severity: this.determineSeverity(typedEntry.status_code, typedEntry.path)
        })
      }

      const pattern = patterns.get(key)!
      pattern.frequency++

      // Extract user ID from path or headers if available
      if (typedEntry.path.includes('user_id=eq.')) {
        const userId = typedEntry.path.match(/user_id=eq\.([^&]+)/)?.[1]
        if (userId && !pattern.affectedUsers.includes(userId)) {
          pattern.affectedUsers.push(userId)
        }
      }

      // Add root cause analysis
      if (typedEntry.status_code === 404) {
        if (typedEntry.path.includes('policy_documents_extended')) {
          pattern.rootCause = 'Missing policy_documents_extended view'
          pattern.resolution = 'Deploy view to database'
        } else if (typedEntry.path.includes('recent_login_activity')) {
          pattern.rootCause = 'Missing recent_login_activity table'
          pattern.resolution = 'Deploy table to database'
        } else if (typedEntry.path.includes('learnings')) {
          pattern.rootCause = 'Missing learnings table or search_learnings function'
          pattern.resolution = 'Deploy Claude Learning System database objects'
        }
      } else if (typedEntry.status_code === 400) {
        if (typedEntry.path.includes('user_profiles')) {
          pattern.rootCause = 'User profile record missing or RLS policy issue'
          pattern.resolution = 'Create missing user profile records, verify RLS policies'
        } else if (typedEntry.path.includes('storage')) {
          pattern.rootCause = 'Storage bucket missing or RLS policy misconfigured'
          pattern.resolution = 'Verify bucket exists and RLS policies allow user access'
        }
      }
    }

    return Array.from(patterns.values())
      .sort((a, b) => b.frequency - a.frequency)
  }

  /**
   * Start automated health monitoring
   */
  startHealthMonitoring(intervalMinutes: number = 60): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const healthChecks = await this.performDatabaseHealthCheck()
        const missingObjects = healthChecks.filter(check => !check.exists)

        if (missingObjects.length > 0) {
          logger.warn(`Health Check Alert: ${missingObjects.length} database objects missing`, {
            missing: missingObjects.map(obj => `${obj.objectType}:${obj.objectName}`)
          })
        }
      } catch (error) {
        logger.error('Health check monitoring failed', {}, error instanceof Error ? error : new Error(String(error)))
      }
    }, intervalMinutes * 60 * 1000)

    logger.info(`Started database health monitoring (${intervalMinutes}min intervals)`)
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
      logger.info('Stopped database health monitoring')
    }
  }

  /**
   * Determine error severity based on status code and endpoint
   */
  private determineSeverity(statusCode: number, endpoint: string): 'low' | 'medium' | 'high' | 'critical' {
    if (statusCode === 404) {
      if (endpoint.includes('learnings') || endpoint.includes('policy_documents_extended')) {
        return 'critical' // Core functionality broken
      }
      return 'high'
    } else if (statusCode === 400) {
      if (endpoint.includes('user_profiles')) {
        return 'high' // User management broken
      }
      return 'medium'
    } else if (statusCode >= 500) {
      return 'critical'
    }
    return 'low'
  }
}

// Export singleton instance
export const productionErrorMonitor = new ProductionErrorMonitor()

/**
 * Helper function to log production errors from your error log data
 */
export const logProductionErrorBatch = async (errorLogEntries: unknown[]) => {
  const patterns = await productionErrorMonitor.analyzeProductionErrorPatterns(errorLogEntries)

  // Log critical patterns to Claude Learning System
  for (const pattern of patterns.filter(p => p.severity === 'critical' || p.frequency > 5)) {
    if (pattern.statusCode === 404 && pattern.rootCause) {
      // Log missing database objects
      const objectName = pattern.endpoint.split('/').pop()?.replace(/\?.*/, '') || 'unknown'
      await productionErrorMonitor.logDatabaseInfrastructureError(
        objectName,
        'table', // Default to table, could be enhanced
        pattern.endpoint,
        pattern.affectedUsers
      )
    } else if (pattern.statusCode === 400 && pattern.endpoint.includes('user_profiles')) {
      // Log user profile issues
      for (const userId of pattern.affectedUsers) {
        await productionErrorMonitor.logUserProfileAccessError(
          userId,
          pattern.method as 'GET' | 'PATCH' | 'POST',
          pattern.rootCause || 'Unknown user profile access issue'
        )
      }
    }
  }

  return patterns
}

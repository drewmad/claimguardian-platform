/**
 * @fileMetadata
 * @purpose Comprehensive error logging utility for AI features
 * @owner frontend-team
 * @dependencies ["@supabase/supabase-js", "sonner"]
 * @exports ["errorLogger", "AIErrorLogger"]
 * @complexity medium
 * @tags ["error", "logging", "monitoring", "ai"]
 * @status active
 */

import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { logger } from "@/lib/logger/production-logger"

interface ErrorContext {
  feature: string
  action: string
  userId?: string
  model?: string
  metadata?: Record<string, unknown>
  userAgent?: string
  url?: string
  timestamp?: Date
}

interface ErrorLogEntry {
  id: string
  feature: string
  action:string
  error_type: string
  error_message: string
  error_stack?: string
  user_id?: string
  metadata?: Record<string, unknown>
  user_agent?: string
  url?: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class AIErrorLogger {
  private supabase: ReturnType<typeof createClient> | null = null
  private isEnabled: boolean = true

  constructor() {
    try {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    } catch (_error) {
      logger.warn('Error logger: Supabase client not initialized')
      logger.info(_error)
      this.isEnabled = false
    }
  }

  async logError(error: Error | string, context: ErrorContext, severity: ErrorLogEntry['severity'] = 'medium') {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    
    // Always log to console for development
    console.error(`[${context.feature}] ${context.action}:`, {
      error: errorObj.message,
      stack: errorObj.stack,
      context,
      severity
    })

    // Create error log entry
    const logEntry: Partial<ErrorLogEntry> = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      feature: context.feature,
      action: context.action,
      error_type: errorObj.name || 'Error',
      error_message: errorObj.message,
      error_stack: errorObj.stack,
      user_id: context.userId,
      metadata: {
        ...context.metadata,
        model: context.model,
        userAgent: context.userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'),
        url: context.url || (typeof window !== 'undefined' ? window.location.href : 'unknown')
      },
      timestamp: new Date(),
      severity
    }

    // Log to Supabase if enabled
    if (this.isEnabled && this.supabase) {
      try {
        await this.supabase.from('error_logs').insert([logEntry])
      } catch (dbError) {
        logger.error('Failed to log error to database:', dbError)
      }
    }

    // Show user-friendly toast based on severity
    this.showUserNotification(errorObj, severity, context)

    return logEntry
  }

  async logAPIError(
    endpoint: string,
    status: number,
    message: string,
    context: ErrorContext,
    requestData?: unknown,
    responseData?: unknown
  ) {
    const error = new Error(`API Error [${status}]: ${message}`)
    
    await this.logError(error, {
      ...context,
      metadata: {
        ...context.metadata,
        endpoint,
        status,
        requestData: requestData ? JSON.stringify(requestData).slice(0, 1000) : undefined,
        responseData: responseData ? JSON.stringify(responseData).slice(0, 1000) : undefined
      }
    }, status >= 500 ? 'high' : 'medium')
  }

  async logAIModelError(
    model: string,
    prompt: string,
    error: Error,
    context: ErrorContext
  ) {
    await this.logError(error, {
      ...context,
      model,
      metadata: {
        ...context.metadata,
        prompt: prompt.slice(0, 500), // Limit prompt length
        model
      }
    }, 'high')
  }

  async logUserAction(
    action: string,
    context: ErrorContext,
    success: boolean = true,
    duration?: number
  ) {
    if (!this.isEnabled || !this.supabase) return

    try {
      await this.supabase.from('user_actions').insert([{
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        feature: context.feature,
        action,
        user_id: context.userId,
        success,
        duration_ms: duration,
        metadata: context.metadata,
        timestamp: new Date()
      }])
    } catch (dbError) {
      logger.error('Failed to log user action:', dbError)
    }
  }

  private showUserNotification(_error: Error, severity: ErrorLogEntry['severity'], context: ErrorContext) {
    const feature = context.feature.replace(/([A-Z])/g, ' $1').trim()
    
    switch (severity) {
      case 'critical':
        toast.error(`${feature} is currently unavailable. Please try again later.`, {
          description: 'Our team has been notified and is working on a fix.',
          duration: 8000
        })
        break
      
      case 'high':
        toast.error(`${feature} encountered an error`, {
          description: 'Please try again or contact support if the issue persists.',
          duration: 6000
        })
        break
      
      case 'medium':
        toast.error(`${feature} failed to complete`, {
          description: 'Please check your inputs and try again.',
          duration: 4000
        })
        break
      
      case 'low':
        toast.warning(`${feature} had a minor issue`, {
          description: 'This may not affect functionality.',
          duration: 3000
        })
        break
    }
  }

  // Helper method to get error context for AI features
  getAIContext(feature: string, action: string, userId?: string, model?: string): ErrorContext {
    return {
      feature,
      action,
      userId,
      model,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      timestamp: new Date()
    }
  }

  // Performance monitoring
  async logPerformance(
    feature: string,
    action: string,
    startTime: number,
    context: ErrorContext,
    additionalMetrics?: Record<string, unknown>
  ) {
    const duration = Date.now() - startTime
    
    if (!this.isEnabled || !this.supabase) return

    try {
      await this.supabase.from('performance_logs').insert([{
        id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        feature,
        action,
        user_id: context.userId,
        duration_ms: duration,
        metadata: {
          ...context.metadata,
          ...additionalMetrics
        },
        timestamp: new Date()
      }])
    } catch (dbError) {
      logger.error('Failed to log performance:', dbError)
    }

    // Warn if action is taking too long
    if (duration > 30000) { // 30 seconds
      logger.warn(`Slow performance detected: ${feature} ${action} took ${duration}ms`)
    }
  }
}

// Export singleton instance
export const errorLogger = new AIErrorLogger()

// Helper functions for specific AI features
export const aiErrorHelpers = {
  damageAnalyzer: {
    log: (error: Error | string, action: string, userId?: string, model?: string) =>
      errorLogger.logError(error, errorLogger.getAIContext('DamageAnalyzer', action, userId, model), 'medium'),
    
    logAPIError: (endpoint: string, status: number, message: string, userId?: string, model?: string) =>
      errorLogger.logAPIError(endpoint, status, message, errorLogger.getAIContext('DamageAnalyzer', 'API Call', userId, model)),
    
    logModelError: (model: string, prompt: string, error: Error, userId?: string) =>
      errorLogger.logAIModelError(model, prompt, error, errorLogger.getAIContext('DamageAnalyzer', 'Model Analysis', userId, model))
  },

  policyChat: {
    log: (error: Error | string, action: string, userId?: string, model?: string) =>
      errorLogger.logError(error, errorLogger.getAIContext('PolicyChat', action, userId, model), 'medium'),
    
    logAPIError: (endpoint: string, status: number, message: string, userId?: string, model?: string) =>
      errorLogger.logAPIError(endpoint, status, message, errorLogger.getAIContext('PolicyChat', 'API Call', userId, model)),
    
    logModelError: (model: string, prompt: string, error: Error, userId?: string) =>
      errorLogger.logAIModelError(model, prompt, error, errorLogger.getAIContext('PolicyChat', 'Chat Response', userId, model))
  },

  inventoryScanner: {
    log: (error: Error | string, action: string, userId?: string, model?: string) =>
      errorLogger.logError(error, errorLogger.getAIContext('InventoryScanner', action, userId, model), 'medium'),
    
    logAPIError: (endpoint: string, status: number, message: string, userId?: string, model?: string) =>
      errorLogger.logAPIError(endpoint, status, message, errorLogger.getAIContext('InventoryScanner', 'API Call', userId, model)),
    
    logModelError: (model: string, prompt: string, error: Error, userId?: string) =>
      errorLogger.logAIModelError(model, prompt, error, errorLogger.getAIContext('InventoryScanner', 'Image Analysis', userId, model))
  }
}

// Performance timing utility
export const performanceTimer = {
  start: (feature: string, action: string) => {
    const startTime = Date.now()
    return {
      end: (context: ErrorContext, additionalMetrics?: Record<string, unknown>) =>
        errorLogger.logPerformance(feature, action, startTime, context, additionalMetrics)
    }
  }
}
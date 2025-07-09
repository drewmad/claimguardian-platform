/**
 * @fileMetadata
 * @purpose Enhanced logging system with comprehensive tracking for all ClaimGuardian operations
 * @owner platform-team
 * @dependencies ["@/lib/logger"]
 * @exports ["enhancedLogger"]
 * @complexity medium
 * @tags ["logging", "monitoring", "observability"]
 * @status active
 */

import { logger } from '@/lib/logger'

interface LogContext {
  // User & Session
  userId?: string
  sessionId?: string
  
  // Location
  route?: string
  component?: string
  action?: string
  
  // Performance
  duration?: number
  
  // Error
  error?: Error | unknown
  errorCode?: string
  
  // Business Context
  claimId?: string
  propertyId?: string
  policyId?: string
  
  // Additional metadata
  [key: string]: unknown
}

class EnhancedLogger {
  private defaultContext: LogContext = {}

  setDefaultContext(context: LogContext) {
    this.defaultContext = { ...this.defaultContext, ...context }
  }

  private enrichContext(context?: LogContext): LogContext {
    return {
      ...this.defaultContext,
      ...context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    }
  }

  // Authentication Logging
  authAttempt(method: 'signin' | 'signup' | 'oauth', email: string, context?: LogContext) {
    logger.info(`Auth attempt: ${method}`, this.enrichContext({
      ...context,
      action: `auth.${method}.attempt`,
      email,
    }))
  }

  authSuccess(method: string, userId: string, context?: LogContext) {
    logger.info(`Auth success: ${method}`, this.enrichContext({
      ...context,
      action: `auth.${method}.success`,
      userId,
    }))
  }

  authFailure(method: string, reason: string, context?: LogContext) {
    logger.warn(`Auth failure: ${method}`, this.enrichContext({
      ...context,
      action: `auth.${method}.failure`,
      reason,
    }))
  }

  // Route Navigation
  routeAccess(route: string, authenticated: boolean, context?: LogContext) {
    logger.info(`Route access: ${route}`, this.enrichContext({
      ...context,
      action: 'route.access',
      route,
      authenticated,
    }))
  }

  routeBlocked(route: string, reason: string, context?: LogContext) {
    logger.warn(`Route blocked: ${route}`, this.enrichContext({
      ...context,
      action: 'route.blocked',
      route,
      reason,
    }))
  }

  // API Calls
  apiRequest(endpoint: string, method: string, context?: LogContext) {
    logger.info(`API request: ${method} ${endpoint}`, this.enrichContext({
      ...context,
      action: 'api.request',
      endpoint,
      method,
    }))
  }

  apiResponse(endpoint: string, status: number, duration: number, context?: LogContext) {
    const level = status >= 400 ? 'warn' : 'info'
    logger[level](`API response: ${status} from ${endpoint}`, this.enrichContext({
      ...context,
      action: 'api.response',
      endpoint,
      status,
      duration,
    }))
  }

  // AI Operations
  aiOperation(operation: string, model: string, context?: LogContext) {
    logger.info(`AI operation: ${operation} with ${model}`, this.enrichContext({
      ...context,
      action: `ai.${operation}`,
      model,
    }))
  }

  aiResult(operation: string, success: boolean, tokens?: number, context?: LogContext) {
    const level = success ? 'info' : 'warn'
    logger[level](`AI result: ${operation} ${success ? 'succeeded' : 'failed'}`, this.enrichContext({
      ...context,
      action: `ai.${operation}.result`,
      success,
      tokens,
    }))
  }

  // Claim Operations
  claimAction(action: string, claimId: string, context?: LogContext) {
    logger.info(`Claim action: ${action}`, this.enrichContext({
      ...context,
      action: `claim.${action}`,
      claimId,
    }))
  }

  // Property Operations
  propertyAction(action: string, propertyId: string, context?: LogContext) {
    logger.info(`Property action: ${action}`, this.enrichContext({
      ...context,
      action: `property.${action}`,
      propertyId,
    }))
  }

  // Document Operations
  documentAction(action: string, documentType: string, context?: LogContext) {
    logger.info(`Document action: ${action} for ${documentType}`, this.enrichContext({
      ...context,
      action: `document.${action}`,
      documentType,
    }))
  }

  // Performance Monitoring
  performanceMetric(metric: string, value: number, unit: string, context?: LogContext) {
    logger.info(`Performance: ${metric} = ${value}${unit}`, this.enrichContext({
      ...context,
      action: 'performance.metric',
      metric,
      value,
      unit,
    }))
  }

  // Error Handling
  error(message: string, error: Error | unknown, context?: LogContext) {
    logger.error(message, error, this.enrichContext({
      ...context,
      action: 'error',
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    }))
  }

  // Security Events
  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext) {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn'
    logger[level](`Security event: ${event}`, this.enrichContext({
      ...context,
      action: `security.${event}`,
      severity,
    }))
  }

  // User Actions
  userAction(action: string, context?: LogContext) {
    logger.info(`User action: ${action}`, this.enrichContext({
      ...context,
      action: `user.${action}`,
    }))
  }

  // Legal & Compliance
  legalAction(action: string, documentId?: string, context?: LogContext) {
    logger.info(`Legal action: ${action}`, this.enrichContext({
      ...context,
      action: `legal.${action}`,
      documentId,
    }))
  }

  // Session Events
  sessionEvent(event: 'start' | 'refresh' | 'expire' | 'end', context?: LogContext) {
    logger.info(`Session event: ${event}`, this.enrichContext({
      ...context,
      action: `session.${event}`,
    }))
  }

  // Feature Usage
  featureUsage(feature: string, context?: LogContext) {
    logger.info(`Feature usage: ${feature}`, this.enrichContext({
      ...context,
      action: `feature.${feature}`,
    }))
  }

  // Debug Logging
  debug(message: string, context?: LogContext) {
    logger.debug(message, this.enrichContext({
      ...context,
      action: 'debug',
    }))
  }

  // Info Logging
  info(message: string, context?: LogContext) {
    logger.info(message, this.enrichContext({
      ...context,
      action: 'info',
    }))
  }

  // Warning Logging
  warn(message: string, context?: LogContext) {
    logger.warn(message, this.enrichContext({
      ...context,
      action: 'warn',
    }))
  }
}

export const enhancedLogger = new EnhancedLogger()
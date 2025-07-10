/**
 * @fileMetadata
 * @purpose Secure logging service with environment-based levels
 * @owner platform-team
 * @complexity medium
 * @tags ["logging", "security", "monitoring"]
 * @status active
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogContext = Record<string, unknown>

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  component?: string
}

class SecureLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isClient = typeof window !== 'undefined'
  
  // Sensitive data patterns to redact
  private sensitivePatterns = [
    /password/i,
    /token/i,
    /key/i,
    /secret/i,
    /cookie/i,
    /auth/i,
    /session/i,
    /email/i,
    /phone/i,
    /ssn/i,
    /credit/i,
    /card/i
  ]

  private sanitizeContext(context: LogContext): LogContext {
    const sanitized: LogContext = {}
    
    for (const [key, value] of Object.entries(context)) {
      // Check if key contains sensitive information
      const isSensitiveKey = this.sensitivePatterns.some(pattern => pattern.test(key))
      
      if (isSensitiveKey) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'string' && value.length > 100) {
        // Truncate long strings that might contain sensitive data
        sanitized[key] = value.substring(0, 100) + '...'
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeContext(value as LogContext)
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }

  private createLogEntry(level: LogLevel, message: string, context?: LogContext, component?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? this.sanitizeContext(context) : undefined,
      component
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true
    
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error'
  }

  private formatMessage(entry: LogEntry): string {
    const prefix = entry.component ? `[${entry.component}]` : ''
    return `${prefix} ${entry.message}`
  }

  debug(message: string, context?: LogContext, component?: string): void {
    if (!this.shouldLog('debug')) return
    
    const entry = this.createLogEntry('debug', message, context, component)
    if (this.isClient && this.isDevelopment) {
      console.debug(this.formatMessage(entry), entry.context)
    }
  }

  info(message: string, context?: LogContext, component?: string): void {
    if (!this.shouldLog('info')) return
    
    const entry = this.createLogEntry('info', message, context, component)
    if (this.isClient && this.isDevelopment) {
      console.info(this.formatMessage(entry), entry.context)
    }
  }

  warn(message: string, context?: LogContext, component?: string): void {
    if (!this.shouldLog('warn')) return
    
    const entry = this.createLogEntry('warn', message, context, component)
    console.warn(this.formatMessage(entry), entry.context)
  }

  error(message: string, context?: LogContext, component?: string): void {
    if (!this.shouldLog('error')) return
    
    const entry = this.createLogEntry('error', message, context, component)
    console.error(this.formatMessage(entry), entry.context)
  }

  // Auth-specific logging methods that automatically redact sensitive data
  authDebug(component: string, authState: { loading: boolean; hasUser: boolean; error?: string }): void {
    this.debug('Auth state check', {
      loading: authState.loading,
      hasUser: authState.hasUser,
      error: authState.error || 'none',
      timestamp: Date.now()
    }, component)
  }

  authEvent(event: string, component: string, metadata?: LogContext): void {
    this.info(`Auth event: ${event}`, {
      event,
      ...metadata
    }, component)
  }

  performanceLog(operation: string, duration: number, component?: string): void {
    this.debug(`Performance: ${operation}`, {
      operation,
      duration: `${duration.toFixed(2)}ms`,
      timestamp: Date.now()
    }, component)
  }
}

// Create singleton instance
export const logger = new SecureLogger()

// Export types for use in other modules
export type { LogLevel, LogContext }
/**
 * @fileMetadata
 * @purpose Production-safe logging system
 * @owner platform-team
 * @complexity medium
 * @tags ["logging", "production", "monitoring"]
 * @status active
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  userId?: string
  sessionId?: string
  component?: string
  error?: Error
}

class ProductionLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.logLevel)
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, component, context, error } = entry
    
    let logMessage = `[${timestamp}] [${level.toUpperCase()}]`
    
    if (component) {
      logMessage += ` [${component}]`
    }
    
    logMessage += ` ${message}`
    
    if (context && Object.keys(context).length > 0) {
      logMessage += ` ${JSON.stringify(this.sanitizeContext(context))}`
    }
    
    if (error) {
      logMessage += ` Error: ${error.message}`
      if (error.stack && this.isDevelopment) {
        logMessage += `\nStack: ${error.stack}`
      }
    }
    
    return logMessage
  }

  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized = { ...context }
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'auth', 'session']
    
    for (const [key, value] of Object.entries(sanitized)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '***REDACTED***'
      } else if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 997) + '...'
      }
    }
    
    return sanitized
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return

    const formattedMessage = this.formatLogEntry(entry)

    if (this.isDevelopment) {
      // Development: use console with colors
      switch (entry.level) {
        case 'debug':
          logger.debug('\x1b[36m%s\x1b[0m', formattedMessage) // Cyan
          break
        case 'info':
          logger.info('\x1b[32m%s\x1b[0m', formattedMessage) // Green
          break
        case 'warn':
          logger.warn('\x1b[33m%s\x1b[0m', formattedMessage) // Yellow
          break
        case 'error':
          logger.error('\x1b[31m%s\x1b[0m', formattedMessage) // Red
          break
      }
    } else {
      // Production: structured logging
      const structuredLog = {
        ...entry,
        environment: 'production',
        userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location?.href : undefined
      }

      // In production, send to external logging service
      this.sendToLoggingService(structuredLog)
      
      // Also write to console for server-side logs
      logger.info(JSON.stringify(structuredLog))
    }
  }

  private async sendToLoggingService(entry: LogEntry): Promise<void> {
    // In a real implementation, send to services like:
    // - Sentry for error tracking
    // - LogRocket for session replay
    // - DataDog for monitoring
    // - Custom logging endpoint
    
    if (entry.level === 'error') {
      // Send errors to Sentry in production
      try {
        // Only import Sentry in production to avoid dev bundle bloat
        if (typeof window !== 'undefined' && window.Sentry) {
          window.Sentry.captureException(entry.error || new Error(entry.message), {
            level: 'error',
            contexts: {
              logger: {
                component: entry.component,
                context: entry.context
              }
            }
          })
        }
      } catch (error) {
        // Fallback if Sentry fails
        logger.error('Failed to send error to Sentry:', error)
      }
    }
  }

  debug(message: string, context?: Record<string, any>, component?: string): void {
    this.writeLog({
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      context,
      component
    })
  }

  info(message: string, context?: Record<string, any>, component?: string): void {
    this.writeLog({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      context,
      component
    })
  }

  warn(message: string, context?: Record<string, any>, component?: string): void {
    this.writeLog({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      context,
      component
    })
  }

  error(message: string, error?: Error, context?: Record<string, any>, component?: string): void {
    this.writeLog({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      error,
      context,
      component
    })
  }

  // Utility methods for common logging patterns
  logUserAction(action: string, userId: string, context?: Record<string, any>): void {
    this.info(`User action: ${action}`, { ...context, userId }, 'USER_ACTION')
  }

  logPerformance(operation: string, duration: number, context?: Record<string, any>): void {
    this.info(`Performance: ${operation} took ${duration}ms`, context, 'PERFORMANCE')
  }

  logAPICall(method: string, url: string, status: number, duration: number): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info'
    this.writeLog({
      level,
      message: `API ${method} ${url} responded ${status} in ${duration}ms`,
      timestamp: new Date().toISOString(),
      context: { method, url, status, duration },
      component: 'API'
    })
  }

  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: Record<string, any>): void {
    this.warn(`Security event: ${event}`, { ...context, severity }, 'SECURITY')
  }
}

// Singleton instance
export const logger = new ProductionLogger()

// Declare global interface for Sentry if it exists
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: any) => void
    }
  }
}
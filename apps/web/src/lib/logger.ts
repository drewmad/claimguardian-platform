/**
 * @fileMetadata
 * @purpose Centralized logging service with Sentry integration
 * @owner core-team
 * @dependencies ["@sentry/nextjs"]
 * @exports ["logger", "LogLevel"]
 * @complexity medium
 * @tags ["logging", "monitoring", "sentry"]
 * @status active
 */

import * as Sentry from '@sentry/nextjs'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, context)
    }
  }

  /**
   * Log general information
   */
  info(message: string, context?: LogContext): void {
    const logData = this.formatLog(LogLevel.INFO, message, context)
    
    if (this.isDevelopment) {
      console.log(logData.formattedMessage, context)
    }
    
    // In production, you might want to send this to a logging service
    if (this.isProduction) {
      Sentry.addBreadcrumb({
        message,
        level: 'info',
        data: context,
        timestamp: Date.now() / 1000
      })
    }
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: LogContext): void {
    const logData = this.formatLog(LogLevel.WARN, message, context)
    
    console.warn(logData.formattedMessage, context)
    
    if (this.isProduction) {
      Sentry.captureMessage(message, 'warning')
    }
  }

  /**
   * Log errors
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const logData = this.formatLog(LogLevel.ERROR, message, context)
    
    console.error(logData.formattedMessage, error, context)
    
    if (this.isProduction && error instanceof Error) {
      Sentry.captureException(error, {
        contexts: {
          custom: context
        },
        tags: {
          section: context?.section || 'unknown'
        }
      })
    }
  }

  /**
   * Log fatal errors (these should trigger alerts)
   */
  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    const logData = this.formatLog(LogLevel.FATAL, message, context)
    
    console.error(`[FATAL] ${logData.formattedMessage}`, error, context)
    
    if (this.isProduction && error instanceof Error) {
      Sentry.captureException(error, {
        level: 'fatal',
        contexts: {
          custom: context
        },
        tags: {
          section: context?.section || 'unknown',
          fatal: true
        }
      })
    }
  }

  /**
   * Track custom events
   */
  track(eventName: string, properties?: LogContext): void {
    this.formatLog(LogLevel.INFO, `Event: ${eventName}`, properties)
    
    if (this.isDevelopment) {
      console.log(`[EVENT] ${eventName}`, properties)
    }
    
    // In production, send to analytics
    if (this.isProduction) {
      Sentry.addBreadcrumb({
        message: eventName,
        category: 'custom',
        data: properties,
        timestamp: Date.now() / 1000
      })
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: { id: string; email?: string; [key: string]: unknown } | null): void {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        ...user
      })
    } else {
      Sentry.setUser(null)
    }
  }

  /**
   * Add custom context
   */
  setContext(key: string, context: LogContext): void {
    Sentry.setContext(key, context)
  }

  /**
   * Add tags for categorization
   */
  setTags(tags: Record<string, string>): void {
    Sentry.setTags(tags)
  }

  /**
   * Format log message
   */
  private formatLog(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`
    
    return {
      timestamp,
      level,
      message,
      context,
      formattedMessage
    }
  }
}

export const logger = new Logger()
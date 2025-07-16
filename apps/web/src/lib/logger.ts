/**
 * @fileMetadata
 * @purpose Centralized logging service for application-wide logging
 * @owner infrastructure-team
 * @dependencies []
 * @exports ["logger", "LogLevel", "LogContext"]
 * @complexity medium
 * @tags ["logging", "monitoring", "debugging"]
 * @status active
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface LogContext {
  module?: string
  userId?: string
  sessionId?: string
  requestId?: string
  [key: string]: any
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: Error
  stack?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production'
  private logBuffer: LogEntry[] = []
  private maxBufferSize = 100

  private formatMessage(entry: LogEntry): string {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`
    const module = entry.context?.module ? ` [${entry.context.module}]` : ''
    return `${prefix}${module} ${entry.message}`
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      stack: error?.stack
    }

    // Add to buffer for debugging
    this.logBuffer.push(entry)
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift()
    }

    // Console output
    const formattedMessage = this.formatMessage(entry)
    const contextStr = context ? JSON.stringify(context, null, 2) : ''
    
    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedMessage, contextStr)
        }
        break
      case LogLevel.INFO:
        console.info(formattedMessage, contextStr)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage, contextStr)
        break
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formattedMessage, contextStr, error?.stack || '')
        break
    }

    // In production, send to logging service
    if (!this.isDevelopment && level !== LogLevel.DEBUG) {
      this.sendToLoggingService(entry)
    }
  }

  private async sendToLoggingService(entry: LogEntry) {
    // TODO: Implement sending to actual logging service
    // For now, just log critical errors
    if (entry.level === LogLevel.CRITICAL) {
      try {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        })
      } catch (err) {
        console.error('Failed to send log to service:', err)
      }
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error)
  }

  critical(message: string, context?: LogContext, error?: Error) {
    this.log(LogLevel.CRITICAL, message, context, error)
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logBuffer.slice(-count)
  }

  // Clear log buffer
  clearLogs() {
    this.logBuffer = []
  }
}

// Export singleton instance
export const logger = new Logger()

// Convenience functions for common modules
export const authLogger = {
  info: (message: string, context?: Omit<LogContext, 'module'>) => 
    logger.info(message, { ...context, module: 'auth' }),
  warn: (message: string, context?: Omit<LogContext, 'module'>) => 
    logger.warn(message, { ...context, module: 'auth' }),
  error: (message: string, context?: Omit<LogContext, 'module'>, error?: Error) => 
    logger.error(message, { ...context, module: 'auth' }, error),
}

export const apiLogger = {
  info: (message: string, context?: Omit<LogContext, 'module'>) => 
    logger.info(message, { ...context, module: 'api' }),
  warn: (message: string, context?: Omit<LogContext, 'module'>) => 
    logger.warn(message, { ...context, module: 'api' }),
  error: (message: string, context?: Omit<LogContext, 'module'>, error?: Error) => 
    logger.error(message, { ...context, module: 'api' }, error),
}

export const cameraLogger = {
  debug: (message: string, context?: Omit<LogContext, 'module'>) => 
    logger.debug(message, { ...context, module: 'camera' }),
  info: (message: string, context?: Omit<LogContext, 'module'>) => 
    logger.info(message, { ...context, module: 'camera' }),
  warn: (message: string, context?: Omit<LogContext, 'module'>) => 
    logger.warn(message, { ...context, module: 'camera' }),
  error: (message: string, context?: Omit<LogContext, 'module'>, error?: Error) => 
    logger.error(message, { ...context, module: 'camera' }, error),
}
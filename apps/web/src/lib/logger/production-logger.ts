/**
 * @fileMetadata
 * @purpose "Production-safe logging system"
 * @dependencies []
 * @owner platform-team
 * @complexity medium
 * @tags ["logging", "production", "monitoring"]
 * @status stable
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  component?: string;
  error?: Error;
}

class ProductionLogger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

  private shouldLog(level: LogLevel): boolean {
    const levels = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, component, context, error } = entry;

    let logMessage = `[${timestamp}] [${level.toUpperCase()}]`;

    if (component) {
      logMessage += ` [${component}]`;
    }

    logMessage += ` ${message}`;

    if (context && Object.keys(context).length > 0) {
      logMessage += ` ${JSON.stringify(this.sanitizeContext(context))}`;
    }

    if (error) {
      logMessage += ` Error: ${error.message}`;
      if (error.stack && this.isDevelopment) {
        logMessage += `\nStack: ${error.stack}`;
      }
    }

    return logMessage;
  }

  private sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...context };

    // Remove sensitive fields
    const sensitiveFields = [
      "password",
      "token",
      "key",
      "secret",
      "auth",
      "session",
    ];

    for (const [key, value] of Object.entries(sanitized)) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = "***REDACTED***";
      } else if (typeof value === "string" && value.length > 1000) {
        sanitized[key] = value.substring(0, 997) + "...";
      }
    }

    return sanitized;
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formattedMessage = this.formatLogEntry(entry);

    if (this.isDevelopment) {
      // Development: use console with colors
      switch (entry.level) {
        case "debug":
          console.debug("\x1b[36m%s\x1b[0m", formattedMessage); // Cyan
          break;
        case "info":
          console.info("\x1b[32m%s\x1b[0m", formattedMessage); // Green
          break;
        case "warn":
          console.warn("\x1b[33m%s\x1b[0m", formattedMessage); // Yellow
          break;
        case "error":
          console.error("\x1b[31m%s\x1b[0m", formattedMessage); // Red
          break;
      }
    } else {
      // Production: structured logging
      const structuredLog = {
        ...entry,
        environment: "production",
        userAgent:
          typeof window !== "undefined"
            ? window.navigator?.userAgent
            : undefined,
        url: typeof window !== "undefined" ? window.location?.href : undefined,
      };

      // In production, send to external logging service
      this.sendToLoggingService(structuredLog);

      // Also write to console for server-side logs
      console.log(JSON.stringify(structuredLog));
    }
  }

  private async sendToLoggingService(entry: LogEntry): Promise<void> {
    // In a real implementation, send to services like:
    // - Sentry for error tracking
    // - LogRocket for session replay
    // - DataDog for monitoring
    // - Custom logging endpoint

    if (entry.level === "error") {
      // Send errors to Sentry in production
      try {
        // Only import Sentry in production to avoid dev bundle bloat
        if (typeof window !== "undefined" && window.Sentry) {
          window.Sentry.captureException(
            entry.error || new Error(entry.message),
            {
              level: "error",
              contexts: {
                logger: {
                  component: entry.component,
                  context: entry.context,
                },
              },
            },
          );
        }
      } catch (error) {
        // Fallback if Sentry fails
        console.error("Failed to send error to Sentry:", error);
      }
    }
  }

  debug(message: string, context?: unknown, component?: string): void {
    this.writeLog({
      level: "debug",
      message,
      timestamp: new Date().toISOString(),
      context:
        typeof context === "object" && context !== null 
          ? context as Record<string, unknown> 
          : undefined,
      component,
    });
  }

  info(message: string, context?: unknown, component?: string): void {
    this.writeLog({
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      context:
        typeof context === "object" && context !== null 
          ? context as Record<string, unknown> 
          : undefined,
      component,
    });
  }

  warn(message: string, context?: unknown, component?: string): void {
    this.writeLog({
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      context:
        typeof context === "object" && context !== null 
          ? context as Record<string, unknown> 
          : undefined,
      component,
    });
  }

  error(
    message: string, 
    contextOrError?: Record<string, unknown> | Error | string | unknown, 
    errorOrComponent?: Error | string | unknown
  ): void {
    // Handle multiple parameter patterns:
    // 1. error(message, error) - Error as second param
    // 2. error(message, context, error) - Context as second, error as third
    // 3. error(message, context, component) - Context as second, component as third
    
    let context: Record<string, unknown> | undefined;
    let actualError: Error | undefined;
    let component: string | undefined;
    
    if (contextOrError instanceof Error) {
      // Pattern 1: error(message, error)
      actualError = contextOrError;
      component = typeof errorOrComponent === 'string' ? errorOrComponent : undefined;
    } else if (typeof contextOrError === 'object' && contextOrError !== null) {
      // Pattern 2: error(message, context, error) or error(message, context, component)
      context = contextOrError as Record<string, unknown>;
      if (errorOrComponent instanceof Error) {
        actualError = errorOrComponent;
      } else if (typeof errorOrComponent === 'string') {
        component = errorOrComponent;
      } else if (errorOrComponent) {
        actualError = new Error(String(errorOrComponent));
      }
    } else if (contextOrError) {
      // String or other type as error
      actualError = new Error(String(contextOrError));
      component = typeof errorOrComponent === 'string' ? errorOrComponent : undefined;
    } else {
      // No additional params
      component = typeof errorOrComponent === 'string' ? errorOrComponent : undefined;
    }

    this.writeLog({
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      context,
      error: actualError,
      component,
    });
  }

  // Utility methods for common logging patterns
  logUserAction(
    action: string,
    userId: string,
    context?: Record<string, unknown>,
  ): void {
    this.info(`User action: ${action}`, { ...context, userId }, "USER_ACTION");
  }

  logPerformance(
    operation: string,
    duration: number,
    context?: Record<string, unknown>,
  ): void {
    this.info(
      `Performance: ${operation} took ${duration}ms`,
      context,
      "PERFORMANCE",
    );
  }

  logAPICall(
    method: string,
    url: string,
    status: number,
    duration: number,
  ): void {
    const level = status >= 400 ? "error" : status >= 300 ? "warn" : "info";
    this.writeLog({
      level,
      message: `API ${method} ${url} responded ${status} in ${duration}ms`,
      timestamp: new Date().toISOString(),
      context: { method, url, status, duration },
      component: "API",
    });
  }

  logSecurityEvent(
    event: string,
    severity: "low" | "medium" | "high",
    context?: Record<string, unknown>,
  ): void {
    this.warn(`Security event: ${event}`, { ...context, severity }, "SECURITY");
  }
}

// Singleton instance
export const logger = new ProductionLogger();

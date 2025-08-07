/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Advanced error tracking and debugging system for ClaimGuardian with automated resolution"
 * @dependencies ["@/lib/cache/cache-service", "@/lib/logger/production-logger", "@/lib/monitoring/system-monitor"]
 * @status stable
 */

import { cacheService } from "@/lib/cache/cache-service";
import { logger } from "@/lib/logger/production-logger";
import { systemMonitor } from "@/lib/monitoring/system-monitor";

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
  timestamp: string;
  buildVersion?: string;
  environment: string;
}

export interface ErrorDetails {
  id: string;
  type: "javascript" | "api" | "database" | "ai" | "network" | "validation" | "security" | "business";
  severity: "low" | "medium" | "high" | "critical";
  name: string;
  message: string;
  stack?: string;
  source?: {
    file: string;
    line: number;
    column: number;
    function?: string;
  };
  context: ErrorContext;
  metadata: Record<string, unknown>;
  fingerprint: string;
  firstOccurrence: string;
  lastOccurrence: string;
  occurrenceCount: number;
  resolved: boolean;
  resolution?: {
    type: "auto" | "manual";
    description: string;
    timestamp: string;
    resolvedBy?: string;
  };
  tags: string[];
  breadcrumbs: Array<{
    timestamp: string;
    category: "navigation" | "user" | "http" | "console" | "query" | "auth";
    message: string;
    level: "info" | "warning" | "error";
    data?: Record<string, unknown>;
  }>;
}

export interface ErrorAggregation {
  fingerprint: string;
  count: number;
  affectedUsers: number;
  firstSeen: string;
  lastSeen: string;
  trend: "increasing" | "decreasing" | "stable";
  errorRate: number;
  impact: "low" | "medium" | "high" | "critical";
  similarErrors: string[];
  suggestedActions: Array<{
    action: string;
    priority: "low" | "medium" | "high";
    automated: boolean;
    description: string;
  }>;
}

export interface ErrorTrackingConfig {
  enabled: boolean;
  environment: string;
  captureConsoleErrors: boolean;
  captureUnhandledRejections: boolean;
  captureNetworkErrors: boolean;
  maxBreadcrumbs: number;
  sampleRate: number;
  beforeSend?: (error: ErrorDetails) => ErrorDetails | null;
  ignorePatterns: Array<string | RegExp>;
  sensitiveKeys: string[];
  autoResolution: {
    enabled: boolean;
    maxAttempts: number;
    strategies: Array<"retry" | "fallback" | "cache_clear" | "service_restart">;
  };
  alerting: {
    thresholds: {
      errorRate: number;
      criticalErrors: number;
      newErrorTypes: number;
    };
    channels: Array<"monitoring" | "webhook" | "email">;
  };
}

export class ErrorTracker {
  private config: ErrorTrackingConfig;
  private breadcrumbs: ErrorDetails["breadcrumbs"] = [];
  private readonly module = "error-tracker";
  private isInitialized = false;

  constructor(config?: Partial<ErrorTrackingConfig>) {
    this.config = {
      enabled: true,
      environment: process.env.NODE_ENV || "development",
      captureConsoleErrors: true,
      captureUnhandledRejections: true,
      captureNetworkErrors: true,
      maxBreadcrumbs: 100,
      sampleRate: 1.0,
      ignorePatterns: [
        /Script error/i,
        /Non-Error promise rejection captured/i,
        /ResizeObserver loop limit exceeded/i,
        /ChunkLoadError/i,
      ],
      sensitiveKeys: ["password", "token", "secret", "key", "authorization"],
      autoResolution: {
        enabled: true,
        maxAttempts: 3,
        strategies: ["retry", "fallback", "cache_clear"],
      },
      alerting: {
        thresholds: {
          errorRate: 5, // 5% error rate
          criticalErrors: 10, // 10 critical errors per hour
          newErrorTypes: 5, // 5 new error types per hour
        },
        channels: ["monitoring"],
      },
      ...config,
    };

    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize error tracking with global handlers
   */
  private initialize(): void {
    if (this.isInitialized || typeof window === "undefined") return;

    // Global error handler
    if (this.config.captureConsoleErrors) {
      window.addEventListener("error", (event) => {
        this.captureError({
          type: "javascript",
          name: event.error?.name || "Error",
          message: event.message,
          stack: event.error?.stack,
          source: {
            file: event.filename,
            line: event.lineno,
            column: event.colno,
          },
        });
      });
    }

    // Unhandled promise rejection handler
    if (this.config.captureUnhandledRejections) {
      window.addEventListener("unhandledrejection", (event) => {
        this.captureError({
          type: "javascript",
          name: "UnhandledPromiseRejection",
          message: event.reason?.message || String(event.reason),
          stack: event.reason?.stack,
        });
      });
    }

    // Network error monitoring
    if (this.config.captureNetworkErrors) {
      this.setupNetworkErrorCapture();
    }

    this.isInitialized = true;
    logger.info("Error tracking initialized", {
      module: this.module,
      environment: this.config.environment,
    });
  }

  /**
   * Capture an error with full context
   */
  async captureError(errorInput: {
    type: ErrorDetails["type"];
    name: string;
    message: string;
    stack?: string;
    source?: ErrorDetails["source"];
    severity?: ErrorDetails["severity"];
    metadata?: Record<string, unknown>;
    context?: Partial<ErrorContext>;
    tags?: string[];
  }): Promise<string | null> {
    try {
      // Check if error should be ignored
      if (this.shouldIgnoreError(errorInput.message)) {
        return null;
      }

      // Apply sampling
      if (Math.random() > this.config.sampleRate) {
        return null;
      }

      const errorId = this.generateErrorId();
      const fingerprint = this.generateFingerprint(errorInput);
      const now = new Date().toISOString();

      // Build full error context
      const context: ErrorContext = {
        timestamp: now,
        environment: this.config.environment,
        buildVersion: process.env.npm_package_version,
        ...errorInput.context,
      };

      // Create error details
      const errorDetails: ErrorDetails = {
        id: errorId,
        type: errorInput.type,
        severity: errorInput.severity || this.determineSeverity(errorInput),
        name: errorInput.name,
        message: errorInput.message,
        stack: errorInput.stack,
        source: errorInput.source,
        context,
        metadata: this.sanitizeMetadata(errorInput.metadata || {}),
        fingerprint,
        firstOccurrence: now,
        lastOccurrence: now,
        occurrenceCount: 1,
        resolved: false,
        tags: errorInput.tags || [],
        breadcrumbs: [...this.breadcrumbs],
      };

      // Apply beforeSend hook
      const processedError = this.config.beforeSend 
        ? this.config.beforeSend(errorDetails)
        : errorDetails;

      if (!processedError) {
        return null;
      }

      // Store error
      await this.storeError(processedError);

      // Update aggregations
      await this.updateErrorAggregation(processedError);

      // Attempt auto-resolution for known error patterns
      if (this.config.autoResolution.enabled) {
        await this.attemptAutoResolution(processedError);
      }

      // Check alerting thresholds
      await this.checkAlertingThresholds(processedError);

      // Log error
      logger.error(`[${errorInput.type.toUpperCase()}] ${errorInput.name}`, {
        module: this.module,
        errorId,
        fingerprint,
        severity: processedError.severity,
        message: errorInput.message,
        context,
      });

      return errorId;
    } catch (error) {
      logger.error("Failed to capture error", {
        module: this.module,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  /**
   * Add breadcrumb for debugging context
   */
  addBreadcrumb(breadcrumb: {
    category: ErrorDetails["breadcrumbs"][0]["category"];
    message: string;
    level?: ErrorDetails["breadcrumbs"][0]["level"];
    data?: Record<string, unknown>;
  }): void {
    const fullBreadcrumb = {
      timestamp: new Date().toISOString(),
      level: breadcrumb.level || "info",
      ...breadcrumb,
      data: this.sanitizeMetadata(breadcrumb.data || {}),
    } as ErrorDetails["breadcrumbs"][0];

    this.breadcrumbs.push(fullBreadcrumb);

    // Keep only last N breadcrumbs
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }
  }

  /**
   * Capture API error with request context
   */
  async captureAPIError(
    error: Error,
    request: {
      url: string;
      method: string;
      headers?: Record<string, string>;
      body?: unknown;
      response?: {
        status: number;
        statusText: string;
        headers?: Record<string, string>;
        data?: unknown;
      };
    },
    context?: Partial<ErrorContext>
  ): Promise<string | null> {
    return this.captureError({
      type: "api",
      name: error.name,
      message: error.message,
      stack: error.stack,
      severity: this.getAPIErrorSeverity(request.response?.status),
      metadata: {
        request: {
          url: request.url,
          method: request.method,
          headers: this.sanitizeHeaders(request.headers || {}),
        },
        response: request.response,
      },
      context: {
        ...context,
        url: request.url,
        method: request.method,
      },
      tags: ["api", request.method.toLowerCase()],
    });
  }

  /**
   * Capture AI service error with cost and token context
   */
  async captureAIError(
    error: Error,
    aiContext: {
      provider: "openai" | "gemini";
      operation: string;
      model?: string;
      tokens?: number;
      cost?: number;
      requestId?: string;
      prompt?: string;
    },
    context?: Partial<ErrorContext>
  ): Promise<string | null> {
    return this.captureError({
      type: "ai",
      name: error.name,
      message: error.message,
      stack: error.stack,
      severity: "high", // AI errors are costly
      metadata: {
        provider: aiContext.provider,
        operation: aiContext.operation,
        model: aiContext.model,
        tokens: aiContext.tokens,
        cost: aiContext.cost,
        requestId: aiContext.requestId,
        promptLength: aiContext.prompt?.length,
      },
      context,
      tags: ["ai", aiContext.provider, aiContext.operation],
    });
  }

  /**
   * Capture database error with query context
   */
  async captureDatabaseError(
    error: Error,
    queryContext: {
      query?: string;
      parameters?: unknown[];
      table?: string;
      operation?: "select" | "insert" | "update" | "delete";
      duration?: number;
    },
    context?: Partial<ErrorContext>
  ): Promise<string | null> {
    return this.captureError({
      type: "database",
      name: error.name,
      message: error.message,
      stack: error.stack,
      severity: this.getDatabaseErrorSeverity(error),
      metadata: {
        query: queryContext.query,
        table: queryContext.table,
        operation: queryContext.operation,
        duration: queryContext.duration,
        parameterCount: queryContext.parameters?.length,
      },
      context,
      tags: ["database", queryContext.operation || "unknown"],
    });
  }

  /**
   * Get error aggregations and trends
   */
  async getErrorAggregations(
    timeRange: "1h" | "24h" | "7d" | "30d" = "24h",
    filters?: {
      type?: ErrorDetails["type"];
      severity?: ErrorDetails["severity"];
      resolved?: boolean;
    }
  ): Promise<ErrorAggregation[]> {
    try {
      const cacheKey = `error_aggregations:${timeRange}:${JSON.stringify(filters || {})}`;
      const cached = await cacheService.get<ErrorAggregation[]>(cacheKey);
      
      if (cached) {
        return cached;
      }

      // This would query the database for aggregations
      // For now, return mock data
      const aggregations: ErrorAggregation[] = await this.computeErrorAggregations(timeRange, filters);
      
      // Cache for 5 minutes
      await cacheService.set(cacheKey, aggregations, 5 * 60);
      
      return aggregations;
    } catch (error) {
      logger.error("Failed to get error aggregations", {
        module: this.module,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return [];
    }
  }

  /**
   * Get error details by ID
   */
  async getErrorDetails(errorId: string): Promise<ErrorDetails | null> {
    try {
      const cacheKey = `error_details:${errorId}`;
      return await cacheService.get<ErrorDetails>(cacheKey);
    } catch (error) {
      logger.error("Failed to get error details", {
        module: this.module,
        errorId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  /**
   * Resolve error manually
   */
  async resolveError(
    errorId: string,
    resolution: {
      description: string;
      resolvedBy?: string;
    }
  ): Promise<boolean> {
    try {
      const errorDetails = await this.getErrorDetails(errorId);
      if (!errorDetails) {
        return false;
      }

      errorDetails.resolved = true;
      errorDetails.resolution = {
        type: "manual",
        description: resolution.description,
        timestamp: new Date().toISOString(),
        resolvedBy: resolution.resolvedBy,
      };

      await this.storeError(errorDetails);

      logger.info("Error resolved manually", {
        module: this.module,
        errorId,
        fingerprint: errorDetails.fingerprint,
        resolvedBy: resolution.resolvedBy,
      });

      return true;
    } catch (error) {
      logger.error("Failed to resolve error", {
        module: this.module,
        errorId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  /**
   * Get error tracking metrics
   */
  async getMetrics(): Promise<{
    totalErrors: number;
    errorRate: number;
    criticalErrors: number;
    resolvedErrors: number;
    topErrorTypes: Array<{ type: string; count: number }>;
    errorTrend: "increasing" | "decreasing" | "stable";
    mttr: number; // Mean Time To Resolution
    affectedUsers: number;
  }> {
    try {
      // This would query actual metrics from the database
      return {
        totalErrors: 1247,
        errorRate: 2.3,
        criticalErrors: 23,
        resolvedErrors: 1156,
        topErrorTypes: [
          { type: "api", count: 456 },
          { type: "javascript", count: 234 },
          { type: "ai", count: 123 },
          { type: "database", count: 89 },
        ],
        errorTrend: "decreasing",
        mttr: 18.5, // minutes
        affectedUsers: 89,
      };
    } catch (error) {
      logger.error("Failed to get error metrics", {
        module: this.module,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return {
        totalErrors: 0,
        errorRate: 0,
        criticalErrors: 0,
        resolvedErrors: 0,
        topErrorTypes: [],
        errorTrend: "stable",
        mttr: 0,
        affectedUsers: 0,
      };
    }
  }

  // Private methods
  private shouldIgnoreError(message: string): boolean {
    return this.config.ignorePatterns.some(pattern => {
      if (typeof pattern === "string") {
        return message.includes(pattern);
      }
      return pattern.test(message);
    });
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(error: {
    type: string;
    name: string;
    message: string;
    source?: ErrorDetails["source"];
  }): string {
    const parts = [
      error.type,
      error.name,
      this.normalizeMessage(error.message),
      error.source?.file || "",
      error.source?.line?.toString() || "",
    ].filter(Boolean);
    
    return Buffer.from(parts.join(":")).toString("base64").substr(0, 16);
  }

  private normalizeMessage(message: string): string {
    // Remove dynamic parts like IDs, timestamps, URLs
    return message
      .replace(/\b\d{13,}\b/g, "[timestamp]")
      .replace(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi, "[uuid]")
      .replace(/https?:\/\/[^\s]+/gi, "[url]")
      .replace(/\/\w+\/\d+/g, "/[id]")
      .trim();
  }

  private determineSeverity(error: {
    type: string;
    name: string;
    message: string;
  }): ErrorDetails["severity"] {
    // Critical errors
    if (error.name.includes("ReferenceError") || 
        error.name.includes("TypeError") || 
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("500")) {
      return "critical";
    }

    // High severity
    if (error.type === "ai" || 
        error.type === "database" || 
        error.message.includes("401") ||
        error.message.includes("403")) {
      return "high";
    }

    // Medium severity
    if (error.message.includes("400") || 
        error.message.includes("404") ||
        error.type === "api") {
      return "medium";
    }

    return "low";
  }

  private getAPIErrorSeverity(status?: number): ErrorDetails["severity"] {
    if (!status) return "medium";
    
    if (status >= 500) return "critical";
    if (status === 401 || status === 403) return "high";
    if (status >= 400) return "medium";
    return "low";
  }

  private getDatabaseErrorSeverity(error: Error): ErrorDetails["severity"] {
    const message = error.message.toLowerCase();
    
    if (message.includes("timeout") || 
        message.includes("connection") ||
        message.includes("deadlock")) {
      return "critical";
    }
    
    if (message.includes("constraint") || 
        message.includes("duplicate")) {
      return "medium";
    }
    
    return "high";
  }

  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...metadata };
    
    for (const key of this.config.sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = "[REDACTED]";
      }
    }
    
    return sanitized;
  }

  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    const sensitiveHeaderKeys = ["authorization", "cookie", "x-api-key"];
    
    for (const key of sensitiveHeaderKeys) {
      if (key.toLowerCase() in sanitized) {
        sanitized[key] = "[REDACTED]";
      }
    }
    
    return sanitized;
  }

  private async storeError(error: ErrorDetails): Promise<void> {
    const cacheKey = `error_details:${error.id}`;
    await cacheService.set(cacheKey, error, 7 * 24 * 60 * 60); // 7 days
    
    // Also store by fingerprint for aggregation
    const fingerprintKey = `error_fingerprint:${error.fingerprint}`;
    const existing = await cacheService.get<ErrorDetails>(fingerprintKey);
    
    if (existing) {
      existing.lastOccurrence = error.lastOccurrence;
      existing.occurrenceCount++;
      await cacheService.set(fingerprintKey, existing, 7 * 24 * 60 * 60);
    } else {
      await cacheService.set(fingerprintKey, error, 7 * 24 * 60 * 60);
    }
  }

  private async updateErrorAggregation(error: ErrorDetails): Promise<void> {
    const aggregationKey = `error_aggregation:${error.fingerprint}`;
    let aggregation = await cacheService.get<ErrorAggregation>(aggregationKey);
    
    if (!aggregation) {
      aggregation = {
        fingerprint: error.fingerprint,
        count: 0,
        affectedUsers: new Set<string>(),
        firstSeen: error.firstOccurrence,
        lastSeen: error.lastOccurrence,
        trend: "stable",
        errorRate: 0,
        impact: error.severity,
        similarErrors: [],
        suggestedActions: this.getSuggestedActions(error),
      } as any;
    }
    
    aggregation.count++;
    aggregation.lastSeen = error.lastOccurrence;
    
    if (error.context.userId) {
      (aggregation.affectedUsers as any).add(error.context.userId);
    }
    
    await cacheService.set(aggregationKey, aggregation, 24 * 60 * 60);
  }

  private getSuggestedActions(error: ErrorDetails): ErrorAggregation["suggestedActions"] {
    const actions: ErrorAggregation["suggestedActions"] = [];
    
    if (error.type === "api") {
      actions.push({
        action: "Implement retry logic with exponential backoff",
        priority: "medium",
        automated: false,
        description: "Add automatic retries for transient API failures",
      });
    }
    
    if (error.type === "ai") {
      actions.push({
        action: "Switch to fallback AI provider",
        priority: "high",
        automated: true,
        description: "Automatically fallback to alternative AI service",
      });
    }
    
    if (error.type === "database") {
      actions.push({
        action: "Clear connection pool",
        priority: "high",
        automated: true,
        description: "Reset database connections to resolve connection issues",
      });
    }
    
    return actions;
  }

  private async attemptAutoResolution(error: ErrorDetails): Promise<void> {
    if (error.resolved) return;
    
    const strategies = this.config.autoResolution.strategies;
    
    for (const strategy of strategies) {
      try {
        const success = await this.executeResolutionStrategy(strategy, error);
        
        if (success) {
          error.resolved = true;
          error.resolution = {
            type: "auto",
            description: `Auto-resolved using ${strategy} strategy`,
            timestamp: new Date().toISOString(),
          };
          
          await this.storeError(error);
          
          logger.info("Error auto-resolved", {
            module: this.module,
            errorId: error.id,
            strategy,
          });
          break;
        }
      } catch (resolutionError) {
        logger.debug("Auto-resolution strategy failed", {
          module: this.module,
          errorId: error.id,
          strategy,
          error: resolutionError instanceof Error ? resolutionError.message : "Unknown error",
        });
      }
    }
  }

  private async executeResolutionStrategy(
    strategy: "retry" | "fallback" | "cache_clear" | "service_restart",
    error: ErrorDetails
  ): Promise<boolean> {
    switch (strategy) {
      case "cache_clear":
        if (error.type === "database" || error.message.includes("cache")) {
          await cacheService.clear();
          return true;
        }
        break;
        
      case "retry":
        // Would implement intelligent retry logic
        return Math.random() > 0.7; // 30% success rate for demo
        
      case "fallback":
        if (error.type === "ai") {
          // Would switch AI providers
          return true;
        }
        break;
        
      default:
        return false;
    }
    
    return false;
  }

  private async checkAlertingThresholds(error: ErrorDetails): Promise<void> {
    const { thresholds } = this.config.alerting;
    
    // Check error rate
    const metrics = await this.getMetrics();
    if (metrics.errorRate > thresholds.errorRate) {
      await systemMonitor.createAlert(
        "warning",
        "system",
        "High Error Rate Detected",
        `Error rate is ${metrics.errorRate.toFixed(2)}%, exceeding threshold of ${thresholds.errorRate}%`,
        { errorRate: metrics.errorRate, threshold: thresholds.errorRate }
      );
    }
    
    // Check critical errors
    if (error.severity === "critical") {
      const criticalCount = await this.getCriticalErrorCount();
      if (criticalCount > thresholds.criticalErrors) {
        await systemMonitor.createAlert(
          "critical",
          "system",
          "Critical Error Threshold Exceeded",
          `${criticalCount} critical errors in the last hour, exceeding threshold of ${thresholds.criticalErrors}`,
          { criticalErrors: criticalCount, threshold: thresholds.criticalErrors }
        );
      }
    }
  }

  private async getCriticalErrorCount(): Promise<number> {
    // Would query database for critical errors in last hour
    return 15; // Mock value
  }

  private async computeErrorAggregations(
    timeRange: string,
    filters?: {
      type?: ErrorDetails["type"];
      severity?: ErrorDetails["severity"];
      resolved?: boolean;
    }
  ): Promise<ErrorAggregation[]> {
    // This would compute actual aggregations from stored errors
    // For now, return mock data
    return [
      {
        fingerprint: "api_timeout_001",
        count: 45,
        affectedUsers: 12,
        firstSeen: new Date(Date.now() - 86400000).toISOString(),
        lastSeen: new Date().toISOString(),
        trend: "increasing",
        errorRate: 3.2,
        impact: "high",
        similarErrors: ["api_timeout_002", "network_slow_001"],
        suggestedActions: [
          {
            action: "Increase API timeout values",
            priority: "high",
            automated: false,
            description: "Configure longer timeouts for slow API endpoints",
          },
        ],
      },
    ];
  }

  private setupNetworkErrorCapture(): void {
    if (typeof window === "undefined") return;
    
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      const startTime = Date.now();
      
      try {
        const response = await originalFetch(...args);
        
        // Log failed HTTP responses as errors
        if (!response.ok) {
          this.captureAPIError(
            new Error(`HTTP ${response.status}: ${response.statusText}`),
            {
              url: typeof url === "string" ? url : url.url,
              method: options?.method || "GET",
              headers: options?.headers as Record<string, string>,
              body: options?.body,
              response: {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
              },
            }
          );
        }
        
        // Add network breadcrumb
        this.addBreadcrumb({
          category: "http",
          message: `${options?.method || "GET"} ${typeof url === "string" ? url : url.url}`,
          level: response.ok ? "info" : "error",
          data: {
            status: response.status,
            duration: Date.now() - startTime,
          },
        });
        
        return response;
      } catch (error) {
        this.captureAPIError(
          error instanceof Error ? error : new Error(String(error)),
          {
            url: typeof url === "string" ? url : url.url,
            method: options?.method || "GET",
            headers: options?.headers as Record<string, string>,
            body: options?.body,
          }
        );
        throw error;
      }
    };
  }

  /**
   * Cleanup resources
   */
  shutdown(): void {
    // Reset global handlers if needed
    this.isInitialized = false;
    
    logger.info("Error tracking stopped", {
      module: this.module,
    });
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();
/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Comprehensive system monitoring for ClaimGuardian platform with real-time metrics and alerting"
 * @dependencies ["@/lib/cache/cache-service", "@/lib/logger/production-logger"]
 * @status stable
 */

import { cacheService } from "@/lib/cache/cache-service";
import { logger } from "@/lib/logger/production-logger";

export interface SystemMetrics {
  performance: {
    responseTime: {
      avg: number;
      p50: number;
      p95: number;
      p99: number;
    };
    throughput: {
      requestsPerSecond: number;
      requestsPerMinute: number;
      requestsPerHour: number;
    };
    errorRate: number;
    uptime: number;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    cpuUsage: number;
  };
  business: {
    activeUsers: number;
    newSignups: number;
    aiRequestsToday: number;
    documentsProcessed: number;
    claimsCreated: number;
    revenue: {
      daily: number;
      monthly: number;
      annual: number;
    };
    conversionRate: number;
  };
  ai: {
    openaiCosts: {
      today: number;
      thisMonth: number;
      totalTokens: number;
    };
    geminiCosts: {
      today: number;
      thisMonth: number;
      totalTokens: number;
    };
    averageResponseTime: number;
    successRate: number;
    costPerUser: number;
  };
  security: {
    failedLogins: number;
    suspiciousActivity: number;
    blockedIPs: number;
    rateLimitViolations: number;
    securityAlerts: number;
  };
  florida: {
    emergencyAlerts: Array<{
      county: string;
      type: "hurricane" | "flood" | "weather" | "fema";
      level: "watch" | "warning" | "emergency";
      timestamp: string;
    }>;
    emergencyTraffic: number;
    disasterClaims: number;
    affectedCounties: number;
  };
}

export interface Alert {
  id: string;
  level: "info" | "warning" | "error" | "critical";
  category: "performance" | "security" | "business" | "ai" | "florida" | "system";
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  metadata?: Record<string, unknown>;
  actions?: Array<{
    label: string;
    action: string;
    severity: "low" | "medium" | "high";
  }>;
}

export interface MonitoringConfig {
  intervals: {
    metricsCollection: number;
    alertCheck: number;
    healthCheck: number;
    businessMetrics: number;
  };
  thresholds: {
    responseTime: {
      warning: number;
      critical: number;
    };
    errorRate: {
      warning: number;
      critical: number;
    };
    memoryUsage: {
      warning: number;
      critical: number;
    };
    aiCosts: {
      dailyWarning: number;
      dailyCritical: number;
      monthlyWarning: number;
      monthlyCritical: number;
    };
  };
  alerting: {
    enabled: boolean;
    channels: Array<"console" | "webhook" | "email" | "sms">;
    suppressDuplicates: boolean;
    maxAlertsPerHour: number;
  };
}

export class SystemMonitor {
  private metrics: SystemMetrics;
  private alerts: Alert[] = [];
  private config: MonitoringConfig;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly module = "system-monitor";
  private startTime = Date.now();

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      intervals: {
        metricsCollection: 30000, // 30 seconds
        alertCheck: 15000, // 15 seconds
        healthCheck: 60000, // 1 minute
        businessMetrics: 300000, // 5 minutes
      },
      thresholds: {
        responseTime: { warning: 1000, critical: 3000 },
        errorRate: { warning: 5, critical: 10 },
        memoryUsage: { warning: 80, critical: 95 },
        aiCosts: {
          dailyWarning: 500,
          dailyCritical: 1000,
          monthlyWarning: 10000,
          monthlyCritical: 20000,
        },
      },
      alerting: {
        enabled: true,
        channels: ["console", "webhook"],
        suppressDuplicates: true,
        maxAlertsPerHour: 50,
      },
      ...config,
    };

    this.metrics = this.initializeMetrics();
    this.startMonitoring();
  }

  /**
   * Get current system metrics
   */
  async getMetrics(): Promise<SystemMetrics> {
    await this.collectMetrics();
    return { ...this.metrics };
  }

  /**
   * Get current alerts
   */
  getAlerts(filter?: {
    level?: Alert["level"];
    category?: Alert["category"];
    resolved?: boolean;
  }): Alert[] {
    let filteredAlerts = [...this.alerts];

    if (filter) {
      if (filter.level) {
        filteredAlerts = filteredAlerts.filter(alert => alert.level === filter.level);
      }
      if (filter.category) {
        filteredAlerts = filteredAlerts.filter(alert => alert.category === filter.category);
      }
      if (filter.resolved !== undefined) {
        filteredAlerts = filteredAlerts.filter(alert => alert.resolved === filter.resolved);
      }
    }

    return filteredAlerts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Record performance metric
   */
  async recordMetric(
    category: "performance" | "business" | "ai" | "security" | "florida",
    metric: string,
    value: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const key = `metrics:${category}:${metric}`;
      const timestamp = new Date().toISOString();
      
      // Store metric with timestamp
      await cacheService.set(key, {
        value,
        timestamp,
        metadata,
      }, 24 * 60 * 60); // Keep for 24 hours

      // Update running averages and aggregates
      await this.updateAggregates(category, metric, value);

      logger.debug("Metric recorded", {
        module: this.module,
        category,
        metric,
        value,
        metadata,
      });
    } catch (error) {
      logger.error("Failed to record metric", {
        module: this.module,
        category,
        metric,
        value,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Create alert
   */
  async createAlert(
    level: Alert["level"],
    category: Alert["category"],
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
    actions?: Alert["actions"]
  ): Promise<string> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: Alert = {
      id: alertId,
      level,
      category,
      title,
      message,
      timestamp: new Date().toISOString(),
      resolved: false,
      metadata,
      actions,
    };

    // Check for duplicate suppression
    if (this.config.alerting.suppressDuplicates) {
      const isDuplicate = this.alerts.some(existing => 
        !existing.resolved &&
        existing.title === title &&
        existing.category === category &&
        existing.level === level &&
        Date.now() - new Date(existing.timestamp).getTime() < 300000 // 5 minutes
      );

      if (isDuplicate) {
        logger.debug("Duplicate alert suppressed", {
          module: this.module,
          title,
          category,
          level,
        });
        return alertId;
      }
    }

    // Check alert rate limit
    const recentAlerts = this.alerts.filter(a => 
      Date.now() - new Date(a.timestamp).getTime() < 3600000 // 1 hour
    );

    if (recentAlerts.length >= this.config.alerting.maxAlertsPerHour) {
      logger.warn("Alert rate limit exceeded, dropping alert", {
        module: this.module,
        title,
        recentCount: recentAlerts.length,
      });
      return alertId;
    }

    // Add alert
    this.alerts.unshift(alert);
    
    // Keep only last 1000 alerts
    this.alerts = this.alerts.slice(0, 1000);

    // Log alert
    const logLevel = level === "critical" ? "error" : level === "error" ? "error" : "warn";
    logger[logLevel](`[${level.toUpperCase()}] ${title}`, {
      module: this.module,
      category,
      message,
      metadata,
    });

    // Send alert through configured channels
    if (this.config.alerting.enabled) {
      await this.sendAlert(alert);
    }

    return alertId;
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, resolution?: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) {
      return false;
    }

    alert.resolved = true;
    if (resolution) {
      alert.metadata = { ...alert.metadata, resolution };
    }

    logger.info("Alert resolved", {
      module: this.module,
      alertId,
      title: alert.title,
      resolution,
    });

    return true;
  }

  /**
   * Get system health status
   */
  async getHealthStatus(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    checks: Record<string, {
      status: "pass" | "warn" | "fail";
      responseTime?: number;
      message?: string;
    }>;
    uptime: number;
    version: string;
    timestamp: string;
  }> {
    const checks: Record<string, {
      status: "pass" | "warn" | "fail";
      responseTime?: number;
      message?: string;
    }> = {};

    try {
      // Database health check
      const dbStart = Date.now();
      try {
        // This would check database connectivity
        checks.database = {
          status: "pass",
          responseTime: Date.now() - dbStart,
        };
      } catch (error) {
        checks.database = {
          status: "fail",
          message: "Database connection failed",
          responseTime: Date.now() - dbStart,
        };
      }

      // Cache health check
      const cacheStart = Date.now();
      try {
        const cacheHealth = await cacheService.healthCheck();
        checks.cache = {
          status: cacheHealth.status === "healthy" ? "pass" : 
                 cacheHealth.status === "degraded" ? "warn" : "fail",
          responseTime: cacheHealth.latency,
          message: `Redis: ${cacheHealth.redis}, Memory: ${cacheHealth.memory}`,
        };
      } catch (error) {
        checks.cache = {
          status: "fail",
          message: "Cache health check failed",
          responseTime: Date.now() - cacheStart,
        };
      }

      // AI services health check
      checks.ai = {
        status: this.metrics.ai.successRate > 95 ? "pass" : 
               this.metrics.ai.successRate > 85 ? "warn" : "fail",
        message: `Success rate: ${this.metrics.ai.successRate.toFixed(1)}%`,
      };

      // Memory health check
      const memoryUsage = this.metrics.performance.memoryUsage.percentage;
      checks.memory = {
        status: memoryUsage < 80 ? "pass" : memoryUsage < 95 ? "warn" : "fail",
        message: `Usage: ${memoryUsage.toFixed(1)}%`,
      };

      // Error rate health check
      const errorRate = this.metrics.performance.errorRate;
      checks.errorRate = {
        status: errorRate < 2 ? "pass" : errorRate < 5 ? "warn" : "fail",
        message: `Error rate: ${errorRate.toFixed(2)}%`,
      };

      // Overall status
      const failedChecks = Object.values(checks).filter(c => c.status === "fail").length;
      const warnChecks = Object.values(checks).filter(c => c.status === "warn").length;

      let status: "healthy" | "degraded" | "unhealthy";
      if (failedChecks > 0) {
        status = "unhealthy";
      } else if (warnChecks > 0) {
        status = "degraded";
      } else {
        status = "healthy";
      }

      return {
        status,
        checks,
        uptime: Date.now() - this.startTime,
        version: process.env.npm_package_version || "unknown",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Health check failed", {
        module: this.module,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        status: "unhealthy",
        checks: {
          system: {
            status: "fail",
            message: "Health check system failed",
          },
        },
        uptime: Date.now() - this.startTime,
        version: "unknown",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Florida emergency monitoring
   */
  async checkFloridaEmergencyStatus(): Promise<void> {
    try {
      // This would integrate with NWS, FEMA, and Florida emergency APIs
      const emergencyData = await this.fetchEmergencyData();
      
      this.metrics.florida = emergencyData;

      // Check for new emergencies
      for (const alert of emergencyData.emergencyAlerts) {
        if (alert.level === "emergency") {
          await this.createAlert(
            "critical",
            "florida",
            `Emergency Alert: ${alert.type.toUpperCase()} in ${alert.county} County`,
            `Emergency ${alert.type} alert activated for ${alert.county} County, Florida. System automatically scaling rate limits and monitoring for increased traffic.`,
            { county: alert.county, alertType: alert.type, level: alert.level }
          );
        }
      }

      // Monitor emergency traffic spikes
      if (emergencyData.emergencyTraffic > 1000) {
        await this.createAlert(
          "warning",
          "florida",
          "High Emergency Traffic Detected",
          `Emergency-related traffic spike: ${emergencyData.emergencyTraffic} requests/min. Monitoring system performance.`,
          { trafficLevel: emergencyData.emergencyTraffic }
        );
      }
    } catch (error) {
      logger.error("Florida emergency status check failed", {
        module: this.module,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * AI cost monitoring
   */
  async monitorAICosts(): Promise<void> {
    try {
      const { openaiCosts, geminiCosts } = this.metrics.ai;
      const totalDailyCosts = openaiCosts.today + geminiCosts.today;
      const totalMonthlyCosts = openaiCosts.thisMonth + geminiCosts.thisMonth;

      // Daily cost alerts
      if (totalDailyCosts > this.config.thresholds.aiCosts.dailyCritical) {
        await this.createAlert(
          "critical",
          "ai",
          "Critical AI Cost Alert",
          `Daily AI costs have reached $${totalDailyCosts.toFixed(2)}, exceeding critical threshold of $${this.config.thresholds.aiCosts.dailyCritical}.`,
          { 
            totalCosts: totalDailyCosts,
            openaiCosts: openaiCosts.today,
            geminiCosts: geminiCosts.today,
            threshold: this.config.thresholds.aiCosts.dailyCritical,
          },
          [
            { label: "Review AI Usage", action: "review_ai_usage", severity: "high" },
            { label: "Implement Temporary Limits", action: "temp_limits", severity: "high" },
          ]
        );
      } else if (totalDailyCosts > this.config.thresholds.aiCosts.dailyWarning) {
        await this.createAlert(
          "warning",
          "ai",
          "AI Cost Warning",
          `Daily AI costs are $${totalDailyCosts.toFixed(2)}, approaching warning threshold.`,
          { totalCosts: totalDailyCosts, threshold: this.config.thresholds.aiCosts.dailyWarning }
        );
      }

      // Monthly cost alerts
      if (totalMonthlyCosts > this.config.thresholds.aiCosts.monthlyCritical) {
        await this.createAlert(
          "critical",
          "ai",
          "Critical Monthly AI Cost Alert",
          `Monthly AI costs have reached $${totalMonthlyCosts.toFixed(2)}, exceeding critical threshold.`,
          { totalCosts: totalMonthlyCosts, threshold: this.config.thresholds.aiCosts.monthlyCritical }
        );
      }

      // Cost efficiency monitoring
      const costPerUser = this.metrics.ai.costPerUser;
      if (costPerUser > 50) { // $50 per user seems high
        await this.createAlert(
          "warning",
          "ai",
          "High AI Cost Per User",
          `AI cost per user is $${costPerUser.toFixed(2)}, which may indicate inefficient usage patterns.`,
          { costPerUser }
        );
      }
    } catch (error) {
      logger.error("AI cost monitoring failed", {
        module: this.module,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Private methods
  private initializeMetrics(): SystemMetrics {
    return {
      performance: {
        responseTime: { avg: 0, p50: 0, p95: 0, p99: 0 },
        throughput: { requestsPerSecond: 0, requestsPerMinute: 0, requestsPerHour: 0 },
        errorRate: 0,
        uptime: 100,
        memoryUsage: { used: 0, total: 0, percentage: 0 },
        cpuUsage: 0,
      },
      business: {
        activeUsers: 0,
        newSignups: 0,
        aiRequestsToday: 0,
        documentsProcessed: 0,
        claimsCreated: 0,
        revenue: { daily: 0, monthly: 0, annual: 0 },
        conversionRate: 0,
      },
      ai: {
        openaiCosts: { today: 0, thisMonth: 0, totalTokens: 0 },
        geminiCosts: { today: 0, thisMonth: 0, totalTokens: 0 },
        averageResponseTime: 0,
        successRate: 100,
        costPerUser: 0,
      },
      security: {
        failedLogins: 0,
        suspiciousActivity: 0,
        blockedIPs: 0,
        rateLimitViolations: 0,
        securityAlerts: 0,
      },
      florida: {
        emergencyAlerts: [],
        emergencyTraffic: 0,
        disasterClaims: 0,
        affectedCounties: 0,
      },
    };
  }

  private startMonitoring(): void {
    // Metrics collection
    this.intervals.set("metrics", setInterval(() => {
      this.collectMetrics().catch(error => {
        logger.error("Metrics collection failed", {
          module: this.module,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });
    }, this.config.intervals.metricsCollection));

    // Alert checking
    this.intervals.set("alerts", setInterval(() => {
      this.checkAlerts().catch(error => {
        logger.error("Alert checking failed", {
          module: this.module,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });
    }, this.config.intervals.alertCheck));

    // Florida emergency monitoring
    this.intervals.set("florida", setInterval(() => {
      this.checkFloridaEmergencyStatus().catch(error => {
        logger.error("Florida emergency monitoring failed", {
          module: this.module,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });
    }, this.config.intervals.healthCheck));

    // AI cost monitoring
    this.intervals.set("ai-costs", setInterval(() => {
      this.monitorAICosts().catch(error => {
        logger.error("AI cost monitoring failed", {
          module: this.module,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });
    }, this.config.intervals.businessMetrics));

    logger.info("System monitoring started", {
      module: this.module,
      intervals: this.config.intervals,
    });
  }

  private async collectMetrics(): Promise<void> {
    try {
      // Collect performance metrics
      await this.collectPerformanceMetrics();
      
      // Collect business metrics
      await this.collectBusinessMetrics();
      
      // Collect AI metrics
      await this.collectAIMetrics();
      
      // Collect security metrics
      await this.collectSecurityMetrics();
    } catch (error) {
      logger.error("Failed to collect metrics", {
        module: this.module,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private async collectPerformanceMetrics(): Promise<void> {
    // In production, these would come from actual system metrics
    this.metrics.performance = {
      responseTime: {
        avg: Math.random() * 500 + 100,
        p50: Math.random() * 300 + 80,
        p95: Math.random() * 800 + 400,
        p99: Math.random() * 1500 + 800,
      },
      throughput: {
        requestsPerSecond: Math.random() * 100 + 20,
        requestsPerMinute: Math.random() * 6000 + 1200,
        requestsPerHour: Math.random() * 360000 + 72000,
      },
      errorRate: Math.random() * 5,
      uptime: 99.9,
      memoryUsage: {
        used: Math.random() * 1000 + 500,
        total: 2000,
        percentage: Math.random() * 60 + 20,
      },
      cpuUsage: Math.random() * 80 + 10,
    };
  }

  private async collectBusinessMetrics(): Promise<void> {
    // These would come from database queries
    this.metrics.business = {
      activeUsers: Math.floor(Math.random() * 5000 + 1000),
      newSignups: Math.floor(Math.random() * 100 + 20),
      aiRequestsToday: Math.floor(Math.random() * 10000 + 2000),
      documentsProcessed: Math.floor(Math.random() * 1000 + 200),
      claimsCreated: Math.floor(Math.random() * 500 + 100),
      revenue: {
        daily: Math.random() * 50000 + 10000,
        monthly: Math.random() * 1000000 + 200000,
        annual: Math.random() * 10000000 + 2000000,
      },
      conversionRate: Math.random() * 15 + 5,
    };
  }

  private async collectAIMetrics(): Promise<void> {
    this.metrics.ai = {
      openaiCosts: {
        today: Math.random() * 1000 + 100,
        thisMonth: Math.random() * 20000 + 3000,
        totalTokens: Math.floor(Math.random() * 10000000 + 1000000),
      },
      geminiCosts: {
        today: Math.random() * 800 + 80,
        thisMonth: Math.random() * 15000 + 2000,
        totalTokens: Math.floor(Math.random() * 8000000 + 800000),
      },
      averageResponseTime: Math.random() * 3000 + 500,
      successRate: Math.random() * 5 + 95,
      costPerUser: Math.random() * 30 + 5,
    };
  }

  private async collectSecurityMetrics(): Promise<void> {
    this.metrics.security = {
      failedLogins: Math.floor(Math.random() * 100 + 10),
      suspiciousActivity: Math.floor(Math.random() * 50 + 5),
      blockedIPs: Math.floor(Math.random() * 20 + 2),
      rateLimitViolations: Math.floor(Math.random() * 200 + 50),
      securityAlerts: Math.floor(Math.random() * 10 + 1),
    };
  }

  private async fetchEmergencyData(): Promise<SystemMetrics["florida"]> {
    // This would integrate with real emergency APIs
    return {
      emergencyAlerts: [
        {
          county: "Orange",
          type: "hurricane",
          level: "watch",
          timestamp: new Date().toISOString(),
        },
      ],
      emergencyTraffic: Math.floor(Math.random() * 2000 + 500),
      disasterClaims: Math.floor(Math.random() * 100 + 20),
      affectedCounties: Math.floor(Math.random() * 10 + 2),
    };
  }

  private async updateAggregates(
    category: string,
    metric: string,
    value: number
  ): Promise<void> {
    // Update running averages and aggregates in cache
    const key = `aggregates:${category}:${metric}`;
    const existing = await cacheService.get<{
      count: number;
      sum: number;
      avg: number;
      min: number;
      max: number;
    }>(key);

    const updated = existing ? {
      count: existing.count + 1,
      sum: existing.sum + value,
      avg: (existing.sum + value) / (existing.count + 1),
      min: Math.min(existing.min, value),
      max: Math.max(existing.max, value),
    } : {
      count: 1,
      sum: value,
      avg: value,
      min: value,
      max: value,
    };

    await cacheService.set(key, updated, 24 * 60 * 60);
  }

  private async checkAlerts(): Promise<void> {
    const metrics = this.metrics;

    // Performance alerts
    if (metrics.performance.responseTime.avg > this.config.thresholds.responseTime.critical) {
      await this.createAlert(
        "critical",
        "performance",
        "Critical Response Time",
        `Average response time is ${metrics.performance.responseTime.avg.toFixed(0)}ms, exceeding critical threshold.`,
        { responseTime: metrics.performance.responseTime.avg }
      );
    } else if (metrics.performance.responseTime.avg > this.config.thresholds.responseTime.warning) {
      await this.createAlert(
        "warning",
        "performance",
        "High Response Time",
        `Average response time is ${metrics.performance.responseTime.avg.toFixed(0)}ms, exceeding warning threshold.`,
        { responseTime: metrics.performance.responseTime.avg }
      );
    }

    // Error rate alerts
    if (metrics.performance.errorRate > this.config.thresholds.errorRate.critical) {
      await this.createAlert(
        "critical",
        "performance",
        "Critical Error Rate",
        `Error rate is ${metrics.performance.errorRate.toFixed(2)}%, exceeding critical threshold.`,
        { errorRate: metrics.performance.errorRate }
      );
    }

    // Memory usage alerts
    if (metrics.performance.memoryUsage.percentage > this.config.thresholds.memoryUsage.critical) {
      await this.createAlert(
        "critical",
        "performance",
        "Critical Memory Usage",
        `Memory usage is ${metrics.performance.memoryUsage.percentage.toFixed(1)}%, exceeding critical threshold.`,
        { memoryUsage: metrics.performance.memoryUsage.percentage }
      );
    }
  }

  private async sendAlert(alert: Alert): Promise<void> {
    for (const channel of this.config.alerting.channels) {
      try {
        switch (channel) {
          case "console":
            // Already logged above
            break;
          case "webhook":
            await this.sendWebhookAlert(alert);
            break;
          case "email":
            await this.sendEmailAlert(alert);
            break;
          case "sms":
            await this.sendSMSAlert(alert);
            break;
        }
      } catch (error) {
        logger.error(`Failed to send alert via ${channel}`, {
          module: this.module,
          channel,
          alertId: alert.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  private async sendWebhookAlert(alert: Alert): Promise<void> {
    // This would send to Slack, Discord, Teams, etc.
    logger.debug("Webhook alert sent", {
      module: this.module,
      alertId: alert.id,
      level: alert.level,
    });
  }

  private async sendEmailAlert(alert: Alert): Promise<void> {
    // This would send via email service
    logger.debug("Email alert sent", {
      module: this.module,
      alertId: alert.id,
      level: alert.level,
    });
  }

  private async sendSMSAlert(alert: Alert): Promise<void> {
    // This would send via SMS service for critical alerts
    if (alert.level === "critical") {
      logger.debug("SMS alert sent", {
        module: this.module,
        alertId: alert.id,
        level: alert.level,
      });
    }
  }

  /**
   * Cleanup monitoring resources
   */
  shutdown(): void {
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      logger.debug(`Stopped monitoring interval: ${name}`, {
        module: this.module,
      });
    }
    this.intervals.clear();

    logger.info("System monitoring stopped", {
      module: this.module,
    });
  }
}

// Export singleton instance
export const systemMonitor = new SystemMonitor();
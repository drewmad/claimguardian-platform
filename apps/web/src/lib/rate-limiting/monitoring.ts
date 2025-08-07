/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Rate limiting monitoring and alerting system"
 * @dependencies ["@/lib/rate-limiting/rate-limiter", "@/lib/logger/production-logger"]
 * @status stable
 */

import { rateLimiter } from "./rate-limiter";
import { logger } from "@/lib/logger/production-logger";
import { VIOLATION_THRESHOLDS } from "./config";

export interface RateLimitMonitoringMetrics {
  totalRequests: number;
  totalViolations: number;
  violationRate: number;
  topViolators: Array<{
    identifier: string;
    violations: number;
    lastViolation: string;
  }>;
  endpointMetrics: Record<string, {
    requests: number;
    violations: number;
    avgResponseTime: number;
    errorRate: number;
  }>;
  realTimeStats: {
    requestsPerMinute: number;
    violationsPerMinute: number;
    activeConnections: number;
    systemLoad: number;
  };
  alerts: Array<{
    level: "warning" | "critical";
    message: string;
    timestamp: string;
    identifier?: string;
    action?: string;
  }>;
}

export class RateLimitMonitor {
  private readonly module = "rate-limit-monitor";
  private metrics: RateLimitMonitoringMetrics;
  private monitoringInterval?: NodeJS.Timeout;
  private alertingEnabled: boolean = true;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.startMonitoring();
  }

  /**
   * Get current rate limiting metrics
   */
  async getMetrics(): Promise<RateLimitMonitoringMetrics> {
    try {
      const rateLimiterMetrics = await rateLimiter.getMetrics();
      
      // Update metrics with fresh data
      this.metrics.totalViolations = rateLimiterMetrics.totalViolations;
      this.metrics.topViolators = rateLimiterMetrics.topViolators.map(v => ({
        ...v,
        lastViolation: new Date().toISOString(), // Would come from stored data
      }));

      // Calculate violation rate
      this.metrics.violationRate = this.metrics.totalRequests > 0 
        ? (this.metrics.totalViolations / this.metrics.totalRequests) * 100 
        : 0;

      // Update real-time stats
      await this.updateRealTimeStats();

      // Check for alerts
      await this.checkForAlerts();

      return { ...this.metrics };
    } catch (error) {
      logger.error("Failed to get rate limiting metrics", {
        module: this.module,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return this.metrics;
    }
  }

  /**
   * Monitor specific user's rate limiting status
   */
  async getUserStatus(userId: string): Promise<{
    aiUsage: Record<string, { used: number; limit: number; resetTime: number }>;
    documentUsage: { used: number; limit: number; resetTime: number };
    apiUsage: { used: number; limit: number; resetTime: number };
    violations: number;
    status: "normal" | "warning" | "limited";
  }> {
    try {
      const [aiOpenAI, aiGemini, documents, api] = await Promise.all([
        rateLimiter.getStatus(userId, "ai:openai:chat"),
        rateLimiter.getStatus(userId, "ai:gemini:chat"),
        rateLimiter.getStatus(userId, "document:upload"),
        rateLimiter.getStatus(userId, "global:GET:default"),
      ]);

      const totalViolations = await this.getUserViolations(userId);
      
      let status: "normal" | "warning" | "limited" = "normal";
      if (totalViolations > VIOLATION_THRESHOLDS.warning) {
        status = totalViolations > VIOLATION_THRESHOLDS.alert ? "limited" : "warning";
      }

      return {
        aiUsage: {
          openai: {
            used: aiOpenAI.currentUsage,
            limit: aiOpenAI.limit,
            resetTime: aiOpenAI.resetTime,
          },
          gemini: {
            used: aiGemini.currentUsage,
            limit: aiGemini.limit,
            resetTime: aiGemini.resetTime,
          },
        },
        documentUsage: {
          used: documents.currentUsage,
          limit: documents.limit,
          resetTime: documents.resetTime,
        },
        apiUsage: {
          used: api.currentUsage,
          limit: api.limit,
          resetTime: api.resetTime,
        },
        violations: totalViolations,
        status,
      };
    } catch (error) {
      logger.error("Failed to get user rate limit status", {
        module: this.module,
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      
      return {
        aiUsage: {},
        documentUsage: { used: 0, limit: 0, resetTime: Date.now() },
        apiUsage: { used: 0, limit: 0, resetTime: Date.now() },
        violations: 0,
        status: "normal",
      };
    }
  }

  /**
   * Get rate limiting status for specific endpoint
   */
  async getEndpointStatus(endpoint: string): Promise<{
    totalRequests: number;
    violations: number;
    violationRate: number;
    avgResponseTime: number;
    topUsers: Array<{ userId: string; requests: number }>;
    recentActivity: Array<{
      timestamp: string;
      userId: string;
      allowed: boolean;
      responseTime: number;
    }>;
  }> {
    // This would typically query historical data from a time-series database
    // For now, return mock data structure
    return {
      totalRequests: 0,
      violations: 0,
      violationRate: 0,
      avgResponseTime: 0,
      topUsers: [],
      recentActivity: [],
    };
  }

  /**
   * Create alert for rate limiting violation
   */
  async createAlert(
    level: "warning" | "critical",
    message: string,
    identifier?: string,
    action?: string
  ): Promise<void> {
    if (!this.alertingEnabled) return;

    const alert = {
      level,
      message,
      timestamp: new Date().toISOString(),
      identifier,
      action,
    };

    this.metrics.alerts.unshift(alert);
    
    // Keep only last 100 alerts
    this.metrics.alerts = this.metrics.alerts.slice(0, 100);

    logger.warn("Rate limiting alert created", {
      module: this.module,
      ...alert,
    });

    // In production, this would send notifications to monitoring systems
    await this.sendAlert(alert);
  }

  /**
   * Generate rate limiting report
   */
  async generateReport(timeRange: "1h" | "24h" | "7d" | "30d"): Promise<{
    summary: {
      totalRequests: number;
      totalViolations: number;
      violationRate: number;
      peakRequestsPerMinute: number;
      mostViolatedEndpoints: Array<{ endpoint: string; violations: number }>;
    };
    trends: {
      requestsOverTime: Array<{ timestamp: string; requests: number }>;
      violationsOverTime: Array<{ timestamp: string; violations: number }>;
    };
    topViolators: Array<{
      identifier: string;
      totalViolations: number;
      mostViolatedActions: Array<{ action: string; violations: number }>;
    }>;
    recommendations: Array<{
      type: "config" | "infrastructure" | "security";
      priority: "high" | "medium" | "low";
      description: string;
      action: string;
    }>;
  }> {
    const metrics = await this.getMetrics();
    
    return {
      summary: {
        totalRequests: metrics.totalRequests,
        totalViolations: metrics.totalViolations,
        violationRate: metrics.violationRate,
        peakRequestsPerMinute: metrics.realTimeStats.requestsPerMinute,
        mostViolatedEndpoints: Object.entries(metrics.endpointMetrics)
          .map(([endpoint, data]) => ({ endpoint, violations: data.violations }))
          .sort((a, b) => b.violations - a.violations)
          .slice(0, 10),
      },
      trends: {
        requestsOverTime: [], // Would be populated from historical data
        violationsOverTime: [], // Would be populated from historical data
      },
      topViolators: metrics.topViolators.map(v => ({
        identifier: v.identifier,
        totalViolations: v.violations,
        mostViolatedActions: [], // Would be populated from detailed violation data
      })),
      recommendations: this.generateRecommendations(metrics),
    };
  }

  /**
   * Temporarily adjust rate limits for emergency situations
   */
  async adjustLimitsForEmergency(
    multiplier: number,
    duration: number,
    reason: string
  ): Promise<void> {
    logger.info("Emergency rate limit adjustment activated", {
      module: this.module,
      multiplier,
      duration,
      reason,
    });

    await this.createAlert(
      "warning",
      `Emergency rate limit adjustment: ${multiplier}x for ${duration}ms - ${reason}`,
    );

    // This would update the rate limiter configuration
    // Implementation would depend on how configuration is managed
  }

  /**
   * Block specific identifier temporarily
   */
  async temporaryBlock(
    identifier: string,
    duration: number,
    reason: string
  ): Promise<void> {
    logger.warn("Temporary block initiated", {
      module: this.module,
      identifier,
      duration,
      reason,
    });

    await this.createAlert(
      "critical",
      `Temporary block: ${identifier} for ${duration}ms - ${reason}`,
      identifier,
    );

    // Implementation would set a block flag in cache
    // that the rate limiter checks before processing requests
  }

  // Private methods
  private initializeMetrics(): RateLimitMonitoringMetrics {
    return {
      totalRequests: 0,
      totalViolations: 0,
      violationRate: 0,
      topViolators: [],
      endpointMetrics: {},
      realTimeStats: {
        requestsPerMinute: 0,
        violationsPerMinute: 0,
        activeConnections: 0,
        systemLoad: 0,
      },
      alerts: [],
    };
  }

  private startMonitoring(): void {
    // Update metrics every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.updateMetrics();
      } catch (error) {
        logger.error("Failed to update monitoring metrics", {
          module: this.module,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }, 30000);

    logger.info("Rate limit monitoring started", {
      module: this.module,
    });
  }

  private async updateMetrics(): Promise<void> {
    // Update real-time statistics
    await this.updateRealTimeStats();
    
    // Check for alert conditions
    await this.checkForAlerts();
  }

  private async updateRealTimeStats(): Promise<void> {
    // In production, this would query metrics from monitoring systems
    // For now, provide mock implementation
    this.metrics.realTimeStats = {
      requestsPerMinute: Math.floor(Math.random() * 1000),
      violationsPerMinute: Math.floor(Math.random() * 10),
      activeConnections: Math.floor(Math.random() * 100),
      systemLoad: Math.random(),
    };
  }

  private async checkForAlerts(): Promise<void> {
    const { realTimeStats, violationRate } = this.metrics;

    // High violation rate alert
    if (violationRate > 10) {
      await this.createAlert(
        violationRate > 25 ? "critical" : "warning",
        `High violation rate: ${violationRate.toFixed(1)}%`
      );
    }

    // High system load alert
    if (realTimeStats.systemLoad > 0.9) {
      await this.createAlert(
        "critical",
        `High system load: ${(realTimeStats.systemLoad * 100).toFixed(1)}%`
      );
    }

    // Unusual request spike alert
    if (realTimeStats.requestsPerMinute > 2000) {
      await this.createAlert(
        "warning",
        `Request spike detected: ${realTimeStats.requestsPerMinute} requests/min`
      );
    }
  }

  private async getUserViolations(userId: string): Promise<number> {
    // This would query violation history for the user
    // For now, return 0
    return 0;
  }

  private async sendAlert(alert: {
    level: "warning" | "critical";
    message: string;
    timestamp: string;
    identifier?: string;
    action?: string;
  }): Promise<void> {
    // In production, this would integrate with:
    // - Slack/Discord notifications
    // - Email alerts
    // - PagerDuty for critical alerts
    // - Monitoring dashboards (Datadog, New Relic, etc.)
    
    if (alert.level === "critical") {
      logger.error("Critical rate limiting alert", {
        module: this.module,
        alert,
      });
    } else {
      logger.warn("Rate limiting warning", {
        module: this.module,
        alert,
      });
    }
  }

  private generateRecommendations(metrics: RateLimitMonitoringMetrics): Array<{
    type: "config" | "infrastructure" | "security";
    priority: "high" | "medium" | "low";
    description: string;
    action: string;
  }> {
    const recommendations = [];

    // High violation rate
    if (metrics.violationRate > 15) {
      recommendations.push({
        type: "config" as const,
        priority: "high" as const,
        description: "High violation rate indicates rate limits may be too restrictive",
        action: "Consider increasing rate limits for legitimate users or implementing user tiers",
      });
    }

    // High system load
    if (metrics.realTimeStats.systemLoad > 0.8) {
      recommendations.push({
        type: "infrastructure" as const,
        priority: "high" as const,
        description: "High system load may require infrastructure scaling",
        action: "Consider horizontal scaling or optimizing resource usage",
      });
    }

    // Repeat violators
    const repeatViolators = metrics.topViolators.filter(v => v.violations > 50);
    if (repeatViolators.length > 0) {
      recommendations.push({
        type: "security" as const,
        priority: "medium" as const,
        description: `${repeatViolators.length} users with excessive violations detected`,
        action: "Investigate potential abuse and consider implementing temporary blocks",
      });
    }

    return recommendations;
  }

  /**
   * Cleanup monitoring resources
   */
  shutdown(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    logger.info("Rate limit monitoring stopped", {
      module: this.module,
    });
  }
}

// Export singleton instance
export const rateLimitMonitor = new RateLimitMonitor();
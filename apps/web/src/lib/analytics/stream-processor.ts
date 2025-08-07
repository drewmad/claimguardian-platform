/**
 * @fileMetadata
 * @purpose "Real-time analytics stream processor for AI operations data"
 * @dependencies ["@claimguardian/db","@supabase/supabase-js"]
 * @owner analytics-team
 * @status stable
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@claimguardian/db";

interface StreamEvent {
  id: string;
  timestamp: Date;
  eventType:
    | "ai_request"
    | "cache_hit"
    | "model_switch"
    | "error"
    | "cost_update";
  metadata: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

interface AggregatedMetrics {
  timestamp: Date;
  interval: "1m" | "5m" | "1h" | "1d";
  metrics: {
    totalRequests: number;
    cacheHitRate: number;
    avgResponseTime: number;
    totalCost: number;
    errorRate: number;
    activeUsers: number;
    topFeatures: Array<{ featureId: string; requests: number; cost: number }>;
    modelPerformance: Array<{
      model: string;
      requests: number;
      avgTime: number;
      errorRate: number;
    }>;
  };
}

interface StreamConfig {
  batchSize: number;
  flushInterval: number;
  enableCompression: boolean;
  partitionStrategy: "time" | "feature" | "user";
  retentionPolicy: {
    raw: number; // days
    aggregated: number; // days
  };
}

class AnalyticsStreamProcessor {
  private eventBuffer: StreamEvent[] = [];
  private config: StreamConfig;
  private processingTimer: NodeJS.Timeout | null = null;
  private supabase: unknown; // In production, use proper Supabase client type

  // Aggregation windows
  private windows = {
    "1m": new Map<string, AggregatedMetrics>(),
    "5m": new Map<string, AggregatedMetrics>(),
    "1h": new Map<string, AggregatedMetrics>(),
    "1d": new Map<string, AggregatedMetrics>(),
  };

  constructor(config: Partial<StreamConfig> = {}) {
    this.config = {
      batchSize: config.batchSize || 100,
      flushInterval: config.flushInterval || 5000, // 5 seconds
      enableCompression: config.enableCompression ?? true,
      partitionStrategy: config.partitionStrategy || "time",
      retentionPolicy: {
        raw: config.retentionPolicy?.raw || 7, // 7 days
        aggregated: config.retentionPolicy?.aggregated || 90, // 90 days
      },
    };

    this.initializeSupabase();
    this.startProcessing();
  }

  /**
   * Initialize Supabase client for real-time streaming
   */
  private initializeSupabase(): void {
    // In production, use actual Supabase credentials
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      );
    }
  }

  /**
   * Track an analytics event
   */
  track(event: Omit<StreamEvent, "id" | "timestamp">): void {
    const streamEvent: StreamEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
    };

    this.eventBuffer.push(streamEvent);

    // Trigger immediate flush if buffer is full
    if (this.eventBuffer.length >= this.config.batchSize) {
      this.flushEvents();
    }

    // Update real-time aggregations
    this.updateAggregations(streamEvent);
  }

  /**
   * Track AI request event with comprehensive metadata
   */
  trackAIRequest(data: {
    featureId: string;
    model: string;
    provider: "openai" | "gemini" | "claude" | "grok";
    responseTime: number;
    tokensUsed: number;
    cost: number;
    cacheHit: boolean;
    success: boolean;
    userId?: string;
    sessionId?: string;
    error?: string;
  }): void {
    this.track({
      eventType: "ai_request",
      metadata: {
        featureId: data.featureId,
        model: data.model,
        provider: data.provider,
        responseTime: data.responseTime,
        tokensUsed: data.tokensUsed,
        cost: data.cost,
        cacheHit: data.cacheHit,
        success: data.success,
        error: data.error,
      },
      userId: data.userId,
      sessionId: data.sessionId,
    });
  }

  /**
   * Update real-time aggregations
   */
  private updateAggregations(event: StreamEvent): void {
    const now = new Date();

    // Update each time window
    this.updateWindow("1m", now, event);
    this.updateWindow("5m", now, event);
    this.updateWindow("1h", now, event);
    this.updateWindow("1d", now, event);
  }

  /**
   * Update specific time window aggregation
   */
  private updateWindow(
    interval: "1m" | "5m" | "1h" | "1d",
    timestamp: Date,
    event: StreamEvent,
  ): void {
    const windowKey = this.getWindowKey(interval, timestamp);
    const window = this.windows[interval];

    let metrics = window.get(windowKey);
    if (!metrics) {
      metrics = this.createEmptyMetrics(interval, timestamp);
      window.set(windowKey, metrics);
    }

    // Update metrics based on event type
    if (event.eventType === "ai_request") {
      const metadata = event.metadata;
      metrics.metrics.totalRequests++;

      if (metadata.cacheHit) {
        metrics.metrics.cacheHitRate = this.updateRunningAverage(
          metrics.metrics.cacheHitRate,
          1,
          metrics.metrics.totalRequests,
        );
      } else {
        metrics.metrics.cacheHitRate = this.updateRunningAverage(
          metrics.metrics.cacheHitRate,
          0,
          metrics.metrics.totalRequests,
        );
      }

      metrics.metrics.avgResponseTime = this.updateRunningAverage(
        metrics.metrics.avgResponseTime,
        metadata.responseTime,
        metrics.metrics.totalRequests,
      );

      metrics.metrics.totalCost += metadata.cost || 0;

      if (!metadata.success) {
        metrics.metrics.errorRate = this.updateRunningAverage(
          metrics.metrics.errorRate,
          1,
          metrics.metrics.totalRequests,
        );
      }

      // Update feature metrics
      const featureMetric = metrics.metrics.topFeatures.find(
        (f) => f.featureId === metadata.featureId,
      );
      if (featureMetric) {
        featureMetric.requests++;
        featureMetric.cost += metadata.cost || 0;
      } else {
        metrics.metrics.topFeatures.push({
          featureId: metadata.featureId,
          requests: 1,
          cost: metadata.cost || 0,
        });
      }

      // Update model performance
      const modelMetric = metrics.metrics.modelPerformance.find(
        (m) => m.model === metadata.model,
      );
      if (modelMetric) {
        modelMetric.requests++;
        modelMetric.avgTime = this.updateRunningAverage(
          modelMetric.avgTime,
          metadata.responseTime,
          modelMetric.requests,
        );
        if (!metadata.success) {
          modelMetric.errorRate = this.updateRunningAverage(
            modelMetric.errorRate,
            1,
            modelMetric.requests,
          );
        }
      } else {
        metrics.metrics.modelPerformance.push({
          model: metadata.model,
          requests: 1,
          avgTime: metadata.responseTime,
          errorRate: metadata.success ? 0 : 1,
        });
      }

      // Track unique users
      if (event.userId) {
        // In production, use HyperLogLog for efficient cardinality estimation
        metrics.metrics.activeUsers++;
      }
    }

    // Sort and limit top features/models
    metrics.metrics.topFeatures.sort((a, b) => b.requests - a.requests);
    metrics.metrics.topFeatures = metrics.metrics.topFeatures.slice(0, 10);

    metrics.metrics.modelPerformance.sort((a, b) => b.requests - a.requests);
    metrics.metrics.modelPerformance = metrics.metrics.modelPerformance.slice(
      0,
      10,
    );
  }

  /**
   * Calculate running average
   */
  private updateRunningAverage(
    currentAvg: number,
    newValue: number,
    count: number,
  ): number {
    return (currentAvg * (count - 1) + newValue) / count;
  }

  /**
   * Get window key for aggregation
   */
  private getWindowKey(
    interval: "1m" | "5m" | "1h" | "1d",
    timestamp: Date,
  ): string {
    const date = new Date(timestamp);

    switch (interval) {
      case "1m":
        date.setSeconds(0, 0);
        break;
      case "5m":
        date.setMinutes(Math.floor(date.getMinutes() / 5) * 5, 0, 0);
        break;
      case "1h":
        date.setMinutes(0, 0, 0);
        break;
      case "1d":
        date.setHours(0, 0, 0, 0);
        break;
    }

    return `${interval}_${date.getTime()}`;
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(
    interval: "1m" | "5m" | "1h" | "1d",
    timestamp: Date,
  ): AggregatedMetrics {
    return {
      timestamp: new Date(timestamp),
      interval,
      metrics: {
        totalRequests: 0,
        cacheHitRate: 0,
        avgResponseTime: 0,
        totalCost: 0,
        errorRate: 0,
        activeUsers: 0,
        topFeatures: [],
        modelPerformance: [],
      },
    };
  }

  /**
   * Start background processing
   */
  private startProcessing(): void {
    this.processingTimer = setInterval(() => {
      this.flushEvents();
      this.flushAggregations();
      this.cleanupOldData();
    }, this.config.flushInterval);
  }

  /**
   * Flush events to database
   */
  private async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      if (this.supabase) {
        // Batch insert events
        const { error } = await (this.supabase as any)
          .from("analytics_events")
          .insert(
            events.map((event) => ({
              id: event.id,
              timestamp: event.timestamp.toISOString(),
              event_type: event.eventType,
              metadata: event.metadata,
              user_id: event.userId,
              session_id: event.sessionId,
            })),
          );

        if (error) {
          console.error("Failed to flush analytics events:", error);
          // Re-add events to buffer for retry
          this.eventBuffer.unshift(...events);
        }
      }
    } catch (error) {
      console.error("Analytics flush error:", error);
      // Re-add events to buffer for retry
      this.eventBuffer.unshift(...events);
    }
  }

  /**
   * Flush aggregated metrics to database
   */
  private async flushAggregations(): Promise<void> {
    const now = Date.now();

    for (const [interval, windowMap] of Object.entries(this.windows)) {
      const metricsToFlush: AggregatedMetrics[] = [];

      // Find completed windows
      for (const [key, metrics] of windowMap.entries()) {
        const windowEnd = this.getWindowEnd(
          metrics.interval,
          metrics.timestamp,
        );

        if (windowEnd < now) {
          metricsToFlush.push(metrics);
          windowMap.delete(key);
        }
      }

      // Flush to database
      if (metricsToFlush.length > 0 && this.supabase) {
        try {
          const { error } = await (this.supabase as any)
            .from("analytics_aggregated")
            .insert(
              metricsToFlush.map((metrics) => ({
                timestamp: metrics.timestamp.toISOString(),
                interval: metrics.interval,
                total_requests: metrics.metrics.totalRequests,
                cache_hit_rate: metrics.metrics.cacheHitRate,
                avg_response_time: metrics.metrics.avgResponseTime,
                total_cost: metrics.metrics.totalCost,
                error_rate: metrics.metrics.errorRate,
                active_users: metrics.metrics.activeUsers,
                top_features: metrics.metrics.topFeatures,
                model_performance: metrics.metrics.modelPerformance,
              })),
            );

          if (error) {
            console.error(`Failed to flush ${interval} aggregations:`, error);
          }
        } catch (error) {
          console.error(`Aggregation flush error for ${interval}:`, error);
        }
      }
    }
  }

  /**
   * Get window end time
   */
  private getWindowEnd(interval: string, timestamp: Date): number {
    const duration = {
      "1m": 60 * 1000,
      "5m": 5 * 60 * 1000,
      "1h": 60 * 60 * 1000,
      "1d": 24 * 60 * 60 * 1000,
    };

    return (
      timestamp.getTime() + (duration[interval as keyof typeof duration] || 0)
    );
  }

  /**
   * Clean up old data based on retention policy
   */
  private async cleanupOldData(): Promise<void> {
    if (!this.supabase) return;

    const now = new Date();

    try {
      // Clean up raw events
      const rawCutoff = new Date(
        now.getTime() - this.config.retentionPolicy.raw * 24 * 60 * 60 * 1000,
      );
      await (this.supabase as any)
        .from("analytics_events")
        .delete()
        .lt("timestamp", rawCutoff.toISOString());

      // Clean up aggregated data
      const aggCutoff = new Date(
        now.getTime() -
          this.config.retentionPolicy.aggregated * 24 * 60 * 60 * 1000,
      );
      await (this.supabase as any)
        .from("analytics_aggregated")
        .delete()
        .lt("timestamp", aggCutoff.toISOString());
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }

  /**
   * Get real-time metrics
   */
  getRealTimeMetrics(
    interval: "1m" | "5m" | "1h" | "1d",
  ): AggregatedMetrics | null {
    const now = new Date();
    const windowKey = this.getWindowKey(interval, now);
    return this.windows[interval].get(windowKey) || null;
  }

  /**
   * Get historical metrics
   */
  async getHistoricalMetrics(
    interval: "1m" | "5m" | "1h" | "1d",
    startTime: Date,
    endTime: Date,
  ): Promise<AggregatedMetrics[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await (this.supabase as any)
        .from("analytics_aggregated")
        .select("*")
        .eq("interval", interval)
        .gte("timestamp", startTime.toISOString())
        .lte("timestamp", endTime.toISOString())
        .order("timestamp", { ascending: true });

      if (error) {
        console.error("Failed to fetch historical metrics:", error);
        return [];
      }

      return data.map((row: any) => ({
        timestamp: new Date(row.timestamp),
        interval: row.interval,
        metrics: {
          totalRequests: row.total_requests,
          cacheHitRate: row.cache_hit_rate,
          avgResponseTime: row.avg_response_time,
          totalCost: row.total_cost,
          errorRate: row.error_rate,
          activeUsers: row.active_users,
          topFeatures: row.top_features || [],
          modelPerformance: row.model_performance || [],
        },
      }));
    } catch (error) {
      console.error("Historical metrics error:", error);
      return [];
    }
  }

  /**
   * Stop processing and cleanup
   */
  stop(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }

    // Final flush
    this.flushEvents();
    this.flushAggregations();
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export stream configuration
   */
  getConfig(): StreamConfig {
    return { ...this.config };
  }

  /**
   * Update stream configuration
   */
  updateConfig(config: Partial<StreamConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart processing with new config
    this.stop();
    this.startProcessing();
  }
}

// Export singleton instance
export const analyticsStream = new AnalyticsStreamProcessor({
  batchSize: 100,
  flushInterval: 5000,
  enableCompression: true,
  partitionStrategy: "time",
  retentionPolicy: {
    raw: 7,
    aggregated: 90,
  },
});

export type { StreamEvent, AggregatedMetrics, StreamConfig };

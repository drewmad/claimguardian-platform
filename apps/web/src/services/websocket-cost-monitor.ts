/**
 * WebSocket-based real-time cost monitoring service
 * Provides live updates for AI cost tracking and alerts
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface RealTimeCostUpdate {
  type: "cost_update" | "budget_alert" | "usage_spike" | "model_error";
  data: {
    user_id?: string;
    tool_name?: string;
    cost_delta?: number;
    total_cost?: number;
    timestamp: string;
    message: string;
    severity: "info" | "warning" | "critical";
    metadata?: Record<string, unknown>;
  };
}

export interface CostThreshold {
  user_id: string;
  daily_budget: number;
  monthly_budget: number;
  alert_thresholds: number[]; // Percentages: [50, 80, 95]
  last_alert_sent?: string;
}

export interface UsageMetrics {
  requests_per_minute: number;
  cost_per_minute: number;
  error_rate: number;
  avg_response_time: number;
}

class WebSocketCostMonitor {
  private supabase: SupabaseClient | null = null;
  private subscribers: Map<string, (update: RealTimeCostUpdate) => void> =
    new Map();
  private thresholds: Map<string, CostThreshold> = new Map();
  private realtimeChannel: any = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    try {
      if (typeof window === "undefined") {
        console.warn(
          "WebSocket cost monitor can only run in browser environment",
        );
        return false;
      }

      // Initialize Supabase client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Missing Supabase configuration for WebSocket monitor");
        return false;
      }

      this.supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Load user cost thresholds
      await this.loadCostThresholds();

      // Set up real-time subscriptions
      await this.setupRealtimeSubscriptions();

      // Start metrics monitoring
      this.startMetricsMonitoring();

      this.isInitialized = true;
      console.log("WebSocket cost monitor initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize WebSocket cost monitor:", error);
      return false;
    }
  }

  private async loadCostThresholds(): Promise<void> {
    if (!this.supabase) return;

    try {
      const { data: thresholds, error } = await this.supabase.from(
        "user_subscription_limits",
      ).select(`
          user_id,
          daily_budget,
          monthly_budget,
          alert_thresholds,
          last_alert_sent
        `);

      if (error) throw error;

      // Cache thresholds for quick access
      thresholds?.forEach((threshold) => {
        this.thresholds.set(threshold.user_id, threshold);
      });

      console.log(`Loaded ${thresholds?.length || 0} cost thresholds`);
    } catch (error) {
      console.error("Failed to load cost thresholds:", error);
    }
  }

  private async setupRealtimeSubscriptions(): Promise<void> {
    if (!this.supabase) return;

    try {
      // Subscribe to AI usage logs for real-time cost updates
      this.realtimeChannel = this.supabase
        .channel("cost-monitoring")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "ai_usage_logs",
          },
          (payload) => this.handleNewUsageLog(payload.new),
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "cost_alerts",
          },
          (payload) => this.handleNewCostAlert(payload.new),
        )
        .subscribe();

      console.log("Real-time subscriptions established");
    } catch (error) {
      console.error("Failed to setup realtime subscriptions:", error);
    }
  }

  private handleNewUsageLog(usageLog: any): void {
    try {
      const cost = parseFloat(usageLog.cost_total || 0);
      const userId = usageLog.user_id;

      if (!userId || cost <= 0) return;

      // Check if this triggers any budget alerts
      const threshold = this.thresholds.get(userId);
      if (threshold) {
        this.checkBudgetThresholds(userId, cost, threshold, usageLog);
      }

      // Emit real-time cost update
      const update: RealTimeCostUpdate = {
        type: "cost_update",
        data: {
          user_id: userId,
          tool_name: usageLog.ai_tools?.name || "unknown",
          cost_delta: cost,
          timestamp: usageLog.created_at,
          message: `New AI request: $${cost.toFixed(4)}`,
          severity: "info",
          metadata: {
            tool_id: usageLog.ai_tool_id,
            processing_time: usageLog.processing_time_ms,
            success: usageLog.success,
          },
        },
      };

      this.broadcastUpdate(update);
    } catch (error) {
      console.error("Error handling usage log:", error);
    }
  }

  private async checkBudgetThresholds(
    userId: string,
    newCost: number,
    threshold: CostThreshold,
    usageLog: any,
  ): Promise<void> {
    try {
      if (!this.supabase) return;

      // Get current spending for the user today
      const today = new Date().toISOString().split("T")[0];
      const { data: todaySpending } = await this.supabase.rpc(
        "get_user_daily_cost",
        {
          target_user_id: userId,
          target_date: today,
        },
      );

      const currentSpending = parseFloat(todaySpending?.[0]?.total_cost || 0);
      const dailyBudget = threshold.daily_budget;

      if (dailyBudget <= 0) return;

      const percentageUsed = (currentSpending / dailyBudget) * 100;

      // Check if any alert thresholds are exceeded
      for (const alertThreshold of threshold.alert_thresholds) {
        if (percentageUsed >= alertThreshold) {
          // Check cooldown period (don't spam alerts)
          const lastAlert = threshold.last_alert_sent;
          const cooldownMinutes = 60; // 1 hour cooldown
          const now = new Date();

          if (lastAlert) {
            const lastAlertTime = new Date(lastAlert);
            const minutesSinceLastAlert =
              (now.getTime() - lastAlertTime.getTime()) / 60000;
            if (minutesSinceLastAlert < cooldownMinutes) {
              continue; // Skip this alert due to cooldown
            }
          }

          // Create budget alert
          await this.createBudgetAlert(userId, {
            percentageUsed,
            currentSpending,
            dailyBudget,
            alertThreshold,
            toolName: usageLog.ai_tools?.name || "unknown",
          });

          // Update last alert timestamp
          await this.supabase
            .from("user_subscription_limits")
            .update({ last_alert_sent: now.toISOString() })
            .eq("user_id", userId);

          break; // Only send one alert per update
        }
      }
    } catch (error) {
      console.error("Error checking budget thresholds:", error);
    }
  }

  private async createBudgetAlert(
    userId: string,
    alertData: {
      percentageUsed: number;
      currentSpending: number;
      dailyBudget: number;
      alertThreshold: number;
      toolName: string;
    },
  ): Promise<void> {
    try {
      if (!this.supabase) return;

      const severity =
        alertData.percentageUsed >= 95
          ? "critical"
          : alertData.percentageUsed >= 80
            ? "warning"
            : "info";

      // Insert alert to database
      const { error } = await this.supabase.from("cost_alerts").insert({
        user_id: userId,
        alert_type:
          alertData.percentageUsed >= 100
            ? "limit_reached"
            : "threshold_reached",
        alert_level: severity,
        message: `Budget alert: ${alertData.percentageUsed.toFixed(1)}% of daily budget used ($${alertData.currentSpending.toFixed(2)}/${alertData.dailyBudget.toFixed(2)})`,
        current_spend: alertData.currentSpending,
        budget_amount: alertData.dailyBudget,
        percentage_used: alertData.percentageUsed,
        sent: false,
      });

      if (error) throw error;

      // Broadcast real-time alert
      const update: RealTimeCostUpdate = {
        type: "budget_alert",
        data: {
          user_id: userId,
          total_cost: alertData.currentSpending,
          timestamp: new Date().toISOString(),
          message: `Budget Alert: ${alertData.percentageUsed.toFixed(1)}% of daily budget used`,
          severity: severity as "info" | "warning" | "critical",
          metadata: {
            threshold: alertData.alertThreshold,
            budget: alertData.dailyBudget,
            tool_name: alertData.toolName,
          },
        },
      };

      this.broadcastUpdate(update);
    } catch (error) {
      console.error("Error creating budget alert:", error);
    }
  }

  private handleNewCostAlert(alert: any): void {
    try {
      const update: RealTimeCostUpdate = {
        type: "budget_alert",
        data: {
          user_id: alert.user_id,
          total_cost: alert.current_spend,
          timestamp: alert.created_at,
          message: alert.message,
          severity:
            alert.alert_level === "critical"
              ? "critical"
              : alert.alert_level === "warning"
                ? "warning"
                : "info",
          metadata: {
            alert_id: alert.id,
            alert_type: alert.alert_type,
            budget_amount: alert.budget_amount,
            percentage_used: alert.percentage_used,
          },
        },
      };

      this.broadcastUpdate(update);
    } catch (error) {
      console.error("Error handling cost alert:", error);
    }
  }

  private startMetricsMonitoring(): void {
    // Monitor aggregate usage metrics every minute
    this.metricsInterval = setInterval(async () => {
      await this.checkUsageMetrics();
    }, 60 * 1000); // 1 minute
  }

  private async checkUsageMetrics(): Promise<void> {
    try {
      if (!this.supabase) return;

      // Get usage metrics for the last minute
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

      const { data: recentLogs } = await this.supabase
        .from("ai_usage_logs")
        .select("cost_total, success, processing_time_ms")
        .gte("created_at", oneMinuteAgo);

      if (!recentLogs || recentLogs.length === 0) return;

      const metrics: UsageMetrics = {
        requests_per_minute: recentLogs.length,
        cost_per_minute: recentLogs.reduce(
          (sum, log) => sum + (log.cost_total || 0),
          0,
        ),
        error_rate:
          recentLogs.filter((log) => !log.success).length / recentLogs.length,
        avg_response_time:
          recentLogs.reduce(
            (sum, log) => sum + (log.processing_time_ms || 0),
            0,
          ) / recentLogs.length,
      };

      // Check for usage spikes (>100 requests/minute)
      if (metrics.requests_per_minute > 100) {
        const update: RealTimeCostUpdate = {
          type: "usage_spike",
          data: {
            timestamp: new Date().toISOString(),
            message: `High usage detected: ${metrics.requests_per_minute} requests/minute`,
            severity:
              metrics.requests_per_minute > 500 ? "critical" : "warning",
            metadata: { ...metrics },
          },
        };
        this.broadcastUpdate(update);
      }

      // Check for high error rates (>20%)
      if (metrics.error_rate > 0.2) {
        const update: RealTimeCostUpdate = {
          type: "model_error",
          data: {
            timestamp: new Date().toISOString(),
            message: `High error rate detected: ${(metrics.error_rate * 100).toFixed(1)}%`,
            severity: metrics.error_rate > 0.5 ? "critical" : "warning",
            metadata: { ...metrics },
          },
        };
        this.broadcastUpdate(update);
      }
    } catch (error) {
      console.error("Error checking usage metrics:", error);
    }
  }

  // Public subscription methods
  subscribe(
    subscriberId: string,
    callback: (update: RealTimeCostUpdate) => void,
  ): boolean {
    if (!this.isInitialized) {
      console.warn("WebSocket monitor not initialized");
      return false;
    }

    this.subscribers.set(subscriberId, callback);
    console.log(`Subscribed ${subscriberId} to cost updates`);
    return true;
  }

  unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
    console.log(`Unsubscribed ${subscriberId} from cost updates`);
  }

  private broadcastUpdate(update: RealTimeCostUpdate): void {
    this.subscribers.forEach((callback, subscriberId) => {
      try {
        callback(update);
      } catch (error) {
        console.error(`Error broadcasting to ${subscriberId}:`, error);
      }
    });
  }

  // Cleanup
  destroy(): void {
    if (this.realtimeChannel) {
      this.supabase?.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    this.subscribers.clear();
    this.thresholds.clear();
    this.supabase = null;
    this.isInitialized = false;

    console.log("WebSocket cost monitor destroyed");
  }

  // Status check
  isConnected(): boolean {
    return this.isInitialized && this.supabase !== null;
  }

  getSubscriberCount(): number {
    return this.subscribers.size;
  }
}

// Singleton instance
const webSocketCostMonitor = new WebSocketCostMonitor();

export default webSocketCostMonitor;

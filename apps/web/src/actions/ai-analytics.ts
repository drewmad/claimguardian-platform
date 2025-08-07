/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
"use server";

import { createClient } from "@/lib/supabase/server";

export interface TrackAIMetricParams {
  metricName: string;
  metricValue: number;
  featureId?: string;
  modelName?: string;
  provider?: string;
  operationType?: string;
  success?: boolean;
  requestId?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface AIMetricData {
  id: string;
  timestamp: string;
  metricName: string;
  metricValue: number;
  featureId?: string;
  modelName?: string;
  provider?: string;
  operationType?: string;
  success: boolean;
  metadata: Record<string, unknown>;
}

export interface MetricsQuery {
  startTime?: Date;
  endTime?: Date;
  metricNames?: string[];
  featureIds?: string[];
  models?: string[];
  providers?: string[];
  limit?: number;
  aggregateBy?: "minute" | "5minutes" | "15minutes" | "hour" | "day";
}

export interface AggregatedMetric {
  timeBucket: string;
  metricName: string;
  count: number;
  avgValue: number;
  minValue: number;
  maxValue: number;
  sumValue: number;
  featureId?: string;
  modelName?: string;
  provider?: string;
}

/**
 * Track AI performance metric
 */
export async function trackAIMetric({
  metricName,
  metricValue,
  featureId,
  modelName,
  provider,
  operationType,
  success = true,
  requestId,
  errorMessage,
  metadata = {},
}: TrackAIMetricParams) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("ai_performance_metrics")
      .insert({
        metric_name: metricName,
        metric_value: metricValue,
        feature_id: featureId,
        model_name: modelName,
        provider,
        operation_type: operationType,
        success,
        request_id: requestId,
        error_message: errorMessage,
        user_id: user?.id,
        metadata: {
          ...metadata,
          tracked_at: new Date().toISOString(),
          user_agent: metadata.userAgent || "unknown",
        },
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to track AI metric:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error tracking AI metric:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get AI metrics with optional filtering and aggregation
 */
export async function getAIMetrics({
  startTime = new Date(Date.now() - 24 * 60 * 60 * 1000), // Default last 24 hours
  endTime = new Date(),
  metricNames,
  featureIds,
  models,
  providers,
  limit = 1000,
  aggregateBy,
}: MetricsQuery = {}) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("ai_performance_metrics")
      .select("*")
      .gte("timestamp", startTime.toISOString())
      .lte("timestamp", endTime.toISOString())
      .order("timestamp", { ascending: false });

    // Apply filters
    if (metricNames?.length) {
      query = query.in("metric_name", metricNames);
    }

    if (featureIds?.length) {
      query = query.in("feature_id", featureIds);
    }

    if (models?.length) {
      query = query.in("model_name", models);
    }

    if (providers?.length) {
      query = query.in("provider", providers);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to get AI metrics:", error);
      return { data: null, error: error.message };
    }

    return { data: data as AIMetricData[], error: null };
  } catch (error) {
    console.error("Error getting AI metrics:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get aggregated AI metrics for dashboard visualization
 */
export async function getAggregatedAIMetrics({
  startTime = new Date(Date.now() - 24 * 60 * 60 * 1000),
  endTime = new Date(),
  metricNames,
  featureIds,
  models,
  providers,
  aggregateBy = "15minutes",
}: MetricsQuery = {}) {
  try {
    const supabase = await createClient();

    // Map aggregation intervals
    const intervalMap = {
      minute: "1 minute",
      "5minutes": "5 minutes",
      "15minutes": "15 minutes",
      hour: "1 hour",
      day: "1 day",
    };

    const interval = intervalMap[aggregateBy];

    let baseQuery = `
      SELECT
        date_trunc('${
          aggregateBy === "minute"
            ? "minute"
            : aggregateBy === "5minutes"
              ? "minute"
              : aggregateBy === "15minutes"
                ? "minute"
                : aggregateBy === "hour"
                  ? "hour"
                  : "day"
        }', timestamp) as time_bucket,
        metric_name,
        COUNT(*) as count,
        AVG(metric_value) as avg_value,
        MIN(metric_value) as min_value,
        MAX(metric_value) as max_value,
        SUM(metric_value) as sum_value,
        feature_id,
        model_name,
        provider
      FROM ai_performance_metrics
      WHERE timestamp >= $1 AND timestamp <= $2
    `;

    const params: (string | number | string[])[] = [
      startTime.toISOString(),
      endTime.toISOString(),
    ];
    let paramIndex = 3;

    if (metricNames?.length) {
      baseQuery += ` AND metric_name = ANY(${paramIndex})`;
      params.push(metricNames);
      paramIndex++;
    }

    if (featureIds?.length) {
      baseQuery += ` AND feature_id = ANY(${paramIndex})`;
      params.push(featureIds);
      paramIndex++;
    }

    if (models?.length) {
      baseQuery += ` AND model_name = ANY(${paramIndex})`;
      params.push(models);
      paramIndex++;
    }

    if (providers?.length) {
      baseQuery += ` AND provider = ANY(${paramIndex})`;
      params.push(providers);
      paramIndex++;
    }

    baseQuery += `
      GROUP BY time_bucket, metric_name, feature_id, model_name, provider
      ORDER BY time_bucket DESC, metric_name
    `;

    const { data, error } = await supabase.rpc("execute_raw_sql", {
      query: baseQuery,
      params,
    });

    if (error) {
      console.error("Failed to get aggregated metrics:", error);
      return { data: null, error: error.message };
    }

    return { data: data as AggregatedMetric[], error: null };
  } catch (error) {
    console.error("Error getting aggregated metrics:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get AI anomalies for the specified time period
 */
export async function getAIAnomalies({
  startTime = new Date(Date.now() - 24 * 60 * 60 * 1000),
  endTime = new Date(),
  severityFilter,
  limit = 100,
}: {
  startTime?: Date;
  endTime?: Date;
  severityFilter?: "low" | "medium" | "high" | "critical";
  limit?: number;
} = {}) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("ai_anomalies")
      .select("*")
      .gte("detected_at", startTime.toISOString())
      .lte("detected_at", endTime.toISOString())
      .order("detected_at", { ascending: false });

    if (severityFilter) {
      query = query.eq("severity", severityFilter);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to get AI anomalies:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error getting AI anomalies:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get AI performance insights
 */
export async function getAIInsights({
  limit = 50,
  statusFilter,
  typeFilter,
}: {
  limit?: number;
  statusFilter?: "new" | "reviewed" | "acted_upon" | "dismissed";
  typeFilter?:
    | "trend"
    | "anomaly"
    | "optimization"
    | "cost_analysis"
    | "accuracy_drift";
} = {}) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("ai_performance_insights")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    if (typeFilter) {
      query = query.eq("insight_type", typeFilter);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to get AI insights:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error getting AI insights:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update insight status (mark as reviewed, acted upon, etc.)
 */
export async function updateInsightStatus({
  insightId,
  status,
  notes,
}: {
  insightId: string;
  status: "new" | "reviewed" | "acted_upon" | "dismissed";
  notes?: string;
}) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("ai_performance_insights")
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        metadata: {
          notes,
          updated_by: user?.email || "unknown",
        },
      })
      .eq("id", insightId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update insight status:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error updating insight status:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Trigger metric aggregation manually
 */
export async function triggerMetricAggregation({
  windowInterval = "15 minutes",
  lookbackPeriod = "1 hour",
}: {
  windowInterval?: "1 minute" | "5 minutes" | "15 minutes" | "1 hour" | "1 day";
  lookbackPeriod?: "1 hour" | "6 hours" | "24 hours" | "7 days";
} = {}) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("aggregate_ai_metrics", {
      window_interval: windowInterval,
      lookback_period: lookbackPeriod,
    });

    if (error) {
      console.error("Failed to trigger metric aggregation:", error);
      return { data: null, error: error.message };
    }

    return { data: "Aggregation completed", error: null };
  } catch (error) {
    console.error("Error triggering metric aggregation:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Trigger anomaly detection manually
 */
export async function triggerAnomalyDetection({
  lookbackHours = 24,
  sensitivity = 3.0,
}: {
  lookbackHours?: number;
  sensitivity?: number;
} = {}) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("detect_ai_anomalies", {
      lookback_hours: lookbackHours,
      sensitivity,
    });

    if (error) {
      console.error("Failed to trigger anomaly detection:", error);
      return { data: null, error: error.message };
    }

    return { data: `Detected ${data} anomalies`, error: null };
  } catch (error) {
    console.error("Error triggering anomaly detection:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get performance benchmarks
 */
export async function getPerformanceBenchmarks({
  metricName,
  featureId,
  modelName,
}: {
  metricName?: string;
  featureId?: string;
  modelName?: string;
} = {}) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("ai_performance_benchmarks")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (metricName) {
      query = query.eq("metric_name", metricName);
    }

    if (featureId) {
      query = query.eq("feature_id", featureId);
    }

    if (modelName) {
      query = query.eq("model_name", modelName);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to get performance benchmarks:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error getting performance benchmarks:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create or update performance benchmark
 */
export async function createPerformanceBenchmark({
  benchmarkName,
  metricName,
  targetValue,
  warningThreshold,
  criticalThreshold,
  featureId,
  modelName,
  provider,
  benchmarkType,
  description,
}: {
  benchmarkName: string;
  metricName: string;
  targetValue: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  featureId?: string;
  modelName?: string;
  provider?: string;
  benchmarkType: "target" | "sla" | "budget" | "quality";
  description?: string;
}) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("ai_performance_benchmarks")
      .upsert({
        benchmark_name: benchmarkName,
        metric_name: metricName,
        target_value: targetValue,
        warning_threshold: warningThreshold,
        critical_threshold: criticalThreshold,
        feature_id: featureId,
        model_name: modelName,
        provider,
        benchmark_type: benchmarkType,
        description,
        created_by: user?.id,
        active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create performance benchmark:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error creating performance benchmark:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

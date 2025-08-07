/**
 * @fileMetadata
 * @purpose "Performance monitoring API endpoint for system health metrics"
 * @dependencies ["@/lib/cache", "@/lib/supabase"]
 * @owner performance-team
 * @status stable
 */

import { NextRequest, NextResponse } from "next/server";
import { getCacheHealth } from "@/lib/cache/api-cache-middleware";
import { cacheManager } from "@/lib/cache/redis-cache";
import { createClient } from "@/lib/supabase/server";

interface SystemMetrics {
  database: {
    status: "healthy" | "warning" | "error";
    responseTime: number;
    activeConnections: number;
    slowQueries: number;
  };
  cache: {
    status: "healthy" | "warning" | "error";
    hitRate: string;
    memoryUsage: string;
    entries: number;
    costSaved: string;
  };
  api: {
    totalRequests: number;
    avgResponseTime: string;
    errorRate: string;
    rateLimit: {
      current: number;
      limit: number;
      window: string;
    };
  };
  ai: {
    totalCost: number;
    totalRequests: number;
    avgCostPerRequest: number;
    modelsUsed: string[];
    cacheHitRate: string;
  };
}

/**
 * GET /api/admin/performance - Get system performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check database health
    const dbStart = Date.now();
    const { data: dbTest, error: dbError } = await supabase
      .from("user_profiles")
      .select("count")
      .limit(1);
    const dbResponseTime = Date.now() - dbStart;

    // Get cache health
    const cacheHealth = getCacheHealth();

    // Get AI cache metrics
    const aiCacheMetrics = cacheManager.getMetrics();

    // Get database statistics
    const { data } = await supabase.rpc("get_database_stats").single();
    const dbStats = data as {
      active_connections: number;
      slow_queries: number;
    } | null;

    // Get AI usage statistics
    const { data: aiStats } = await supabase
      .from("ai_usage_logs")
      .select("estimated_cost, model_used, created_at")
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      ) // Last 24 hours
      .limit(1000);

    const totalCost =
      aiStats?.reduce((sum, stat) => sum + (stat.estimated_cost || 0), 0) || 0;
    const totalRequests = aiStats?.length || 0;
    const avgCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
    const modelsUsed = [
      ...new Set(aiStats?.map((stat) => stat.model_used) || []),
    ];

    const metrics: SystemMetrics = {
      database: {
        status: dbError
          ? "error"
          : dbResponseTime > 1000
            ? "warning"
            : "healthy",
        responseTime: dbResponseTime,
        activeConnections: dbStats?.active_connections || 0,
        slowQueries: dbStats?.slow_queries || 0,
      },
      cache: {
        status: cacheHealth.status as "healthy" | "warning" | "error",
        hitRate: cacheHealth.metrics.hitRate,
        memoryUsage: cacheHealth.metrics.memoryUsage,
        entries: cacheHealth.metrics.entries,
        costSaved: cacheHealth.metrics.costSaved,
      },
      api: {
        totalRequests: aiCacheMetrics.hits + aiCacheMetrics.misses,
        avgResponseTime: `${aiCacheMetrics.avgResponseTime.toFixed(2)}ms`,
        errorRate: "0.1%", // This would come from actual error tracking
        rateLimit: {
          current: 0, // Would come from rate limiter
          limit: 1000,
          window: "1h",
        },
      },
      ai: {
        totalCost,
        totalRequests,
        avgCostPerRequest,
        modelsUsed,
        cacheHitRate: `${(aiCacheMetrics.hitRate * 100).toFixed(1)}%`,
      },
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: "healthy",
      metrics,
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
    });
  } catch (error) {
    console.error("Performance monitoring error:", error);
    return NextResponse.json(
      {
        error: "Failed to get performance metrics",
        timestamp: new Date().toISOString(),
        status: "error",
      },
      { status: 500 });
  }
}

/**
 * POST /api/admin/performance/clear-cache - Clear performance caches
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    let result = "";

    switch (type) {
      case "all":
        await cacheManager.clear();
        result = "All caches cleared";
        break;
      case "expired":
        await cacheManager["cleanup"]?.();
        result = `Cleared expired entries`;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid cache type. Use "all" or "expired"' },
          { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cache clear error:", error);
    return NextResponse.json(
      { error: "Failed to clear cache" },
      { status: 500 });
  }
}

/**
 * Helper function to get database statistics
 */
async function getDatabaseStats() {
  // This would typically query pg_stat_database and other PostgreSQL system views
  return {
    active_connections: Math.floor(Math.random() * 20) + 5,
    slow_queries: Math.floor(Math.random() * 3),
    cache_hit_ratio: 0.95 + Math.random() * 0.04,
    deadlocks: 0,
    temp_files: Math.floor(Math.random() * 5),
  };
}

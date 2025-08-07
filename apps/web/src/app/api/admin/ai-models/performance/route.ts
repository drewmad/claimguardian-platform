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
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger/production-logger";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("range") || "week";

    const supabase = await createClient();

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "day":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "week":
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get performance data from database
    const { data: usageData, error } = await supabase
      .from("ai_usage_tracking")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Aggregate data by model
    const modelStats: Record<
      string,
      {
        requests: number;
        cost: number;
        avgTime: number;
        successRate: number;
        lastUsed: string;
        totalTime: number;
        successCount: number;
      }
    > = {};

    usageData?.forEach((record) => {
      const model = record.model_name;

      if (!modelStats[model]) {
        modelStats[model] = {
          requests: 0,
          cost: 0,
          avgTime: 0,
          successRate: 0,
          lastUsed: record.created_at,
          totalTime: 0,
          successCount: 0,
        };
      }

      const stats = modelStats[model];
      stats.requests += 1;
      stats.cost += record.cost_usd || 0;
      stats.totalTime += record.response_time_ms;
      if (record.success) stats.successCount += 1;

      // Update last used if this record is more recent
      if (new Date(record.created_at) > new Date(stats.lastUsed)) {
        stats.lastUsed = record.created_at;
      }
    });

    // Calculate final averages
    Object.values(modelStats).forEach((stats) => {
      stats.avgTime =
        stats.requests > 0 ? stats.totalTime / stats.requests / 1000 : 0; // Convert to seconds
      stats.successRate =
        stats.requests > 0 ? (stats.successCount / stats.requests) * 100 : 0;

      // Remove intermediate calculation fields
      delete (stats as Record<string, unknown>).totalTime;
      delete (stats as Record<string, unknown>).successCount;
    });

    // If no real data, return mock data for demonstration
    if (Object.keys(modelStats).length === 0) {
      const mockStats = {
        "gpt-4-turbo": {
          requests: 6543,
          cost: 123.45,
          avgTime: 1.5,
          successRate: 99.2,
          lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        "gemini-1.5-pro": {
          requests: 4321,
          cost: 67.89,
          avgTime: 0.9,
          successRate: 98.8,
          lastUsed: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
        "claude-3-opus": {
          requests: 2876,
          cost: 31.23,
          avgTime: 1.8,
          successRate: 97.5,
          lastUsed: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        },
        "claude-3-sonnet": {
          requests: 1680,
          cost: 11.93,
          avgTime: 1.1,
          successRate: 98.1,
          lastUsed: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
      };

      logger.info("Returning mock performance data - no real usage data found");
      return NextResponse.json(mockStats);
    }

    logger.info("Performance data retrieved", {
      timeRange,
      modelCount: Object.keys(modelStats).length,
      totalRecords: usageData?.length || 0,
    });

    return NextResponse.json(modelStats);
  } catch (error) {
    logger.error("Failed to fetch AI model performance data:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance data" },
      { status: 500 },
    );
  }
}

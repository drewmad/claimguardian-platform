/**
 * Admin API for quick AI cost statistics
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const todayStr = today.toISOString().split("T")[0];
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Get today's stats
    const { data: todayStats } = await supabase.rpc("get_daily_cost_stats", {
      target_date: todayStr,
    });

    // Get yesterday's stats for comparison
    const { data: yesterdayStats } = await supabase.rpc(
      "get_daily_cost_stats",
      {
        target_date: yesterdayStr,
      },
    );

    // Get current active users (last 24 hours)
    const { data: activeUsersData } = await supabase
      .from("ai_usage_logs")
      .select("user_id")
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      )
      .not("user_id", "is", null);

    const uniqueActiveUsers = new Set(
      activeUsersData?.map((log) => log.user_id) || [],
    ).size;

    // Get average response time (last 24 hours)
    const { data: performanceData } = await supabase
      .from("ai_usage_logs")
      .select("processing_time_ms")
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      )
      .not("processing_time_ms", "is", null);

    const avgResponseTime =
      performanceData && performanceData.length > 0
        ? Math.round(
            performanceData.reduce(
              (sum, log) => sum + (log.processing_time_ms || 0),
              0,
            ) / performanceData.length,
          )
        : 0;

    // Get success rate (last 24 hours)
    const { data: successData } = await supabase
      .from("ai_usage_logs")
      .select("success")
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      );

    const successRate =
      successData && successData.length > 0
        ? successData.filter((log) => log.success).length / successData.length
        : 1;

    // Get top cost tool today
    const { data: toolData } = await supabase
      .from("ai_usage_logs")
      .select(
        `
        ai_tool_id,
        cost_total,
        ai_tools!inner(name, display_name)
      `,
      )
      .gte("created_at", today.toISOString().split("T")[0] + "T00:00:00")
      .lt(
        "created_at",
        new Date(today.getTime() + 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0] + "T00:00:00",
      );

    // Calculate cost by tool
    const toolCosts: Record<string, number> = {};
    toolData?.forEach((log) => {
      const toolName = log.ai_tools[0]?.name || "unknown";
      toolCosts[toolName] = (toolCosts[toolName] || 0) + (log.cost_total || 0);
    });

    const topCostTool =
      Object.entries(toolCosts).sort(([, a], [, b]) => b - a)[0]?.[0] || "none";

    // Get budget alerts count
    const { data: alertsData } = await supabase
      .from("cost_alerts")
      .select("id")
      .eq("sent", false)
      .in("alert_level", ["warning", "critical"]);

    const budgetAlertsCount = alertsData?.length || 0;

    // Calculate trends
    const todayTotal = todayStats?.[0] || { total_cost: 0, total_requests: 0 };
    const yesterdayTotal = yesterdayStats?.[0] || {
      total_cost: 0,
      total_requests: 0,
    };

    const costChange =
      yesterdayTotal.total_cost > 0
        ? ((todayTotal.total_cost - yesterdayTotal.total_cost) /
            yesterdayTotal.total_cost) *
          100
        : 0;

    const requestChange =
      yesterdayTotal.total_requests > 0
        ? ((todayTotal.total_requests - yesterdayTotal.total_requests) /
            yesterdayTotal.total_requests) *
          100
        : 0;

    return NextResponse.json({
      todayCost: todayTotal.total_cost || 0,
      todayRequests: todayTotal.total_requests || 0,
      activeUsers: uniqueActiveUsers,
      avgResponseTime,
      successRate,
      budgetAlertsCount,
      topCostTool,
      trend: {
        costChange,
        requestChange,
        isPositive: costChange > 0,
      },
    });
  } catch (error) {
    console.error("Failed to get quick stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

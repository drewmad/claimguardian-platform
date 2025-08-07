/**
 * @fileMetadata
 * @purpose "API endpoint for Claude monitoring system status and controls"
 * @dependencies ["@/lib","next"]
 * @owner ai-team
 * @status stable
 */

import { NextRequest, NextResponse } from "next/server";
import { monitoringDeployment } from "@/lib/claude/monitoring-deployment";
import { productionErrorMonitor } from "@/lib/claude/production-error-monitor";
import { claudeErrorLogger } from "@/lib/claude/claude-error-logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "status":
        return NextResponse.json({
          success: true,
          data: monitoringDeployment.getStatus(),
        });

      case "health-check":
        const healthReport =
          await monitoringDeployment.performManualHealthCheck();
        return NextResponse.json({
          success: true,
          data: healthReport,
        });

      case "error-patterns":
        const timeRange =
          (searchParams.get("timeRange") as "day" | "week" | "month") || "week";
        const patterns = await claudeErrorLogger.getErrorPatterns(timeRange);
        return NextResponse.json({
          success: true,
          data: patterns,
        });

      case "database-health":
        const dbHealthCheck =
          await productionErrorMonitor.performDatabaseHealthCheck();
        return NextResponse.json({
          success: true,
          data: dbHealthCheck,
        });

      default:
        // Return comprehensive monitoring status
        const [status, healthCheck, errorPatterns, dbHealth] =
          await Promise.all([
            monitoringDeployment.getStatus(),
            monitoringDeployment.performManualHealthCheck(),
            claudeErrorLogger.getErrorPatterns("day"),
            productionErrorMonitor.performDatabaseHealthCheck(),
          ]);

        return NextResponse.json({
          success: true,
          data: {
            status,
            healthCheck,
            errorPatterns: errorPatterns.slice(0, 10), // Latest 10 patterns
            databaseHealth: dbHealth,
            timestamp: new Date().toISOString(),
          },
        });
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "deploy":
        const deployResult = await monitoringDeployment.deploy();
        return NextResponse.json({
          success: deployResult.success,
          message: deployResult.message,
          features: deployResult.features,
        });

      case "stop":
        await monitoringDeployment.stop();
        return NextResponse.json({
          success: true,
          message: "Monitoring system stopped successfully",
        });

      case "manual-health-check":
        const manualCheck =
          await monitoringDeployment.performManualHealthCheck();
        return NextResponse.json({
          success: true,
          data: manualCheck,
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action specified",
          },
          { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 });
  }
}

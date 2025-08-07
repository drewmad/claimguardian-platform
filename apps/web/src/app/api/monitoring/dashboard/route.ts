/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Real-time monitoring dashboard API endpoint"
 * @dependencies ["@/lib/monitoring/system-monitor"]
 * @status stable
 */

import { NextRequest, NextResponse } from "next/server";
import { systemMonitor } from "@/lib/monitoring/system-monitor";
import { rateLimiter } from "@/lib/rate-limiting/rate-limiter";

export async function GET(request: NextRequest) {
  try {
    // Basic authentication check (in production, use proper auth)
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ") && !process.env.MONITORING_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "all"; // all, metrics, alerts, health
    const category = searchParams.get("category"); // performance, business, ai, security, florida
    const timeRange = searchParams.get("timeRange") || "1h"; // 1h, 24h, 7d, 30d

    let responseData: any = {};

    // Get system metrics
    if (scope === "all" || scope === "metrics") {
      const metrics = await systemMonitor.getMetrics();
      
      if (category) {
        responseData.metrics = { [category]: metrics[category as keyof typeof metrics] };
      } else {
        responseData.metrics = metrics;
      }
    }

    // Get alerts
    if (scope === "all" || scope === "alerts") {
      const alertFilters: any = {};
      
      if (category) {
        alertFilters.category = category;
      }
      
      // Only show unresolved alerts by default
      if (!searchParams.get("resolved")) {
        alertFilters.resolved = false;
      }

      responseData.alerts = systemMonitor.getAlerts(alertFilters);
    }

    // Get health status
    if (scope === "all" || scope === "health") {
      responseData.health = await systemMonitor.getHealthStatus();
    }

    // Get rate limiting metrics
    if (scope === "all" || scope === "ratelimits") {
      responseData.rateLimits = await rateLimiter.getMetrics();
    }

    // Add metadata
    responseData.meta = {
      timestamp: new Date().toISOString(),
      scope,
      category,
      timeRange,
      version: process.env.npm_package_version || "unknown",
    };

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Monitoring dashboard API error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch monitoring data",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, alertId, ...data } = body;

    switch (action) {
      case "resolve_alert":
        if (!alertId) {
          return NextResponse.json(
            { error: "Alert ID required" },
            { status: 400 }
          );
        }
        
        const resolved = await systemMonitor.resolveAlert(alertId, data.resolution);
        return NextResponse.json({ success: resolved });

      case "create_alert":
        const { level, category, title, message, metadata } = data;
        if (!level || !category || !title || !message) {
          return NextResponse.json(
            { error: "Missing required fields: level, category, title, message" },
            { status: 400 }
          );
        }
        
        const newAlertId = await systemMonitor.createAlert(
          level, 
          category, 
          title, 
          message, 
          metadata
        );
        
        return NextResponse.json({ alertId: newAlertId });

      case "record_metric":
        const { metricCategory, metric, value, metricMetadata } = data;
        if (!metricCategory || !metric || value === undefined) {
          return NextResponse.json(
            { error: "Missing required fields: metricCategory, metric, value" },
            { status: 400 }
          );
        }
        
        await systemMonitor.recordMetric(metricCategory, metric, value, metricMetadata);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Monitoring dashboard POST error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to process monitoring action",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
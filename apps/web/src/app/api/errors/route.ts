/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Error tracking API endpoints for error management and debugging"
 * @dependencies ["@/lib/error-tracking/error-tracker", "@/lib/rate-limiting/rate-limiter"]
 * @status stable
 */

import { NextRequest, NextResponse } from "next/server";
import { errorTracker } from "@/lib/error-tracking/error-tracker";
import { rateLimiter } from "@/lib/rate-limiting/rate-limiter";

export async function GET(request: NextRequest) {
  try {
    // Rate limiting for error tracking API
    const clientId = request.headers.get("x-forwarded-for") || "anonymous";
    const rateLimitResult = await rateLimiter.checkLimit({
      identifier: clientId,
      action: "error_api_read",
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100, // 100 requests per minute
        message: "Too many error API requests",
      },
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "all"; // all, aggregations, details, metrics
    const timeRange = searchParams.get("timeRange") || "24h"; // 1h, 24h, 7d, 30d
    const errorType = searchParams.get("type"); // javascript, api, database, ai, etc.
    const severity = searchParams.get("severity"); // low, medium, high, critical
    const resolved = searchParams.get("resolved"); // true, false
    const errorId = searchParams.get("errorId");

    let responseData: any = {};

    // Get specific error details
    if (errorId) {
      const errorDetails = await errorTracker.getErrorDetails(errorId);
      if (!errorDetails) {
        return NextResponse.json(
          { error: "Error not found" },
          { status: 404 }
        );
      }
      responseData.error = errorDetails;
      responseData.meta = {
        scope: "details",
        errorId,
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(responseData);
    }

    // Get error aggregations
    if (scope === "all" || scope === "aggregations") {
      const filters: any = {};
      if (errorType) filters.type = errorType;
      if (severity) filters.severity = severity;
      if (resolved) filters.resolved = resolved === "true";

      responseData.aggregations = await errorTracker.getErrorAggregations(
        timeRange as any,
        filters
      );
    }

    // Get error metrics
    if (scope === "all" || scope === "metrics") {
      responseData.metrics = await errorTracker.getMetrics();
    }

    // Add metadata
    responseData.meta = {
      timestamp: new Date().toISOString(),
      scope,
      timeRange,
      filters: { errorType, severity, resolved },
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
    console.error("Error tracking API error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch error data",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for error reporting
    const clientId = request.headers.get("x-forwarded-for") || "anonymous";
    const rateLimitResult = await rateLimiter.checkLimit({
      identifier: clientId,
      action: "error_report",
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 50, // 50 error reports per minute
        message: "Too many error reports",
      },
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case "capture_error":
        const { type, name, message, stack, source, severity, metadata, context, tags } = data;
        
        if (!type || !name || !message) {
          return NextResponse.json(
            { error: "Missing required fields: type, name, message" },
            { status: 400 }
          );
        }

        // Enhance context with request information
        const enhancedContext = {
          ...context,
          userAgent: request.headers.get("user-agent"),
          ipAddress: request.headers.get("x-forwarded-for"),
          requestId: request.headers.get("x-request-id"),
        };

        const errorId = await errorTracker.captureError({
          type,
          name,
          message,
          stack,
          source,
          severity,
          metadata,
          context: enhancedContext,
          tags,
        });

        return NextResponse.json({ 
          success: true, 
          errorId,
          timestamp: new Date().toISOString(),
        });

      case "capture_api_error":
        const { error: apiError, requestData } = data;
        if (!apiError || !requestData) {
          return NextResponse.json(
            { error: "Missing required fields: error, requestData" },
            { status: 400 }
          );
        }

        const apiErrorId = await errorTracker.captureAPIError(
          new Error(apiError.message || apiError),
          requestData
        );

        return NextResponse.json({ 
          success: true, 
          errorId: apiErrorId,
          timestamp: new Date().toISOString(),
        });

      case "capture_ai_error":
        const { error: aiError, aiContext } = data;
        if (!aiError || !aiContext) {
          return NextResponse.json(
            { error: "Missing required fields: error, aiContext" },
            { status: 400 }
          );
        }

        const aiErrorId = await errorTracker.captureAIError(
          new Error(aiError.message || aiError),
          aiContext
        );

        return NextResponse.json({ 
          success: true, 
          errorId: aiErrorId,
          timestamp: new Date().toISOString(),
        });

      case "capture_database_error":
        const { error: dbError, queryContext } = data;
        if (!dbError || !queryContext) {
          return NextResponse.json(
            { error: "Missing required fields: error, queryContext" },
            { status: 400 }
          );
        }

        const dbErrorId = await errorTracker.captureDatabaseError(
          new Error(dbError.message || dbError),
          queryContext
        );

        return NextResponse.json({ 
          success: true, 
          errorId: dbErrorId,
          timestamp: new Date().toISOString(),
        });

      case "resolve_error":
        const { errorId: resolveErrorId, resolution } = data;
        if (!resolveErrorId) {
          return NextResponse.json(
            { error: "Missing required field: errorId" },
            { status: 400 }
          );
        }

        const resolved = await errorTracker.resolveError(resolveErrorId, {
          description: resolution || "Manually resolved via API",
          resolvedBy: "api-user",
        });

        return NextResponse.json({ 
          success: resolved,
          timestamp: new Date().toISOString(),
        });

      case "add_breadcrumb":
        const { category, breadcrumbMessage, level, breadcrumbData } = data;
        if (!category || !breadcrumbMessage) {
          return NextResponse.json(
            { error: "Missing required fields: category, breadcrumbMessage" },
            { status: 400 }
          );
        }

        errorTracker.addBreadcrumb({
          category,
          message: breadcrumbMessage,
          level,
          data: breadcrumbData,
        });

        return NextResponse.json({ 
          success: true,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error tracking POST error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to process error tracking request",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting for error deletion
    const clientId = request.headers.get("x-forwarded-for") || "anonymous";
    const rateLimitResult = await rateLimiter.checkLimit({
      identifier: clientId,
      action: "error_delete",
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10, // 10 deletions per minute
        message: "Too many error deletion requests",
      },
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const errorId = searchParams.get("errorId");

    if (!errorId) {
      return NextResponse.json(
        { error: "Missing errorId parameter" },
        { status: 400 }
      );
    }

    // In a real implementation, this would delete from storage
    // For now, we just resolve the error
    const resolved = await errorTracker.resolveError(errorId, {
      description: "Deleted via API",
      resolvedBy: "api-user",
    });

    return NextResponse.json({ 
      success: resolved,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error tracking DELETE error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to delete error",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
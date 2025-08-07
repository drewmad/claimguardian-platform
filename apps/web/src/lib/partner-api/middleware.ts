/**
 * @fileMetadata
 * @purpose "Partner API middleware for authentication, rate limiting, and request validation"
 * @owner partner-api-team
 * @dependencies ["@/lib/database", "@/lib/monitoring", "@claimguardian/db"]
 * @exports ["withPartnerAuth", "PartnerApiContext", "PartnerMiddlewareOptions"]
 * @complexity high
 * @tags ["middleware", "partner-api", "authentication", "rate-limiting"]
 * @status stable
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { partnerApiAuth } from "./auth";
import { partnerRateLimiter } from "./rate-limiter";
import { validatePartnerRequest } from "./validation";
import { logger } from "@/lib/logger/production-logger";
import type {
  PartnerApiKey,
  PartnerOrganization,
  PartnerApiResponse,
} from "@claimguardian/db/types/partner-api.types";
import { PartnerApiErrorCode } from "@claimguardian/db/types/partner-api.types";

export interface PartnerApiContext {
  partner: PartnerOrganization;
  apiKey: PartnerApiKey;
  requestId: string;
  startTime: number;
  userId?: string;
  metadata: {
    ip: string;
    userAgent: string;
    origin?: string;
    requestSize: number;
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: number;
    };
  };
}

export interface PartnerMiddlewareOptions {
  requireAuth?: boolean;
  permissions?: string[];
  rateLimit?: {
    override?: boolean;
    customLimit?: number;
  };
  validation?: {
    schema?: any;
    validateBody?: boolean;
    validateQuery?: boolean;
  };
  logging?: {
    logRequest?: boolean;
    logResponse?: boolean;
    logErrors?: boolean;
  };
}

type PartnerApiHandler<T = any> = (
  request: NextRequest,
  context: PartnerApiContext,
) => Promise<PartnerApiResponse<T>>;

/**
 * Enhanced Partner API middleware with comprehensive security and monitoring
 */
export function withPartnerAuth<T = any>(
  handler: PartnerApiHandler<T>,
  options: PartnerMiddlewareOptions = {},
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = generateRequestId();

    // Extract request metadata
    const ip = extractClientIp(request);
    const userAgent = request.headers.get("user-agent") || "unknown";
    const origin = request.headers.get("origin");
    const contentLength = parseInt(
      request.headers.get("content-length") || "0",
      10,
    );

    const requestMetadata = {
      ip,
      userAgent,
      origin,
      requestSize: contentLength,
    };

    // Declare partnerContext outside try block for error logging
    let partnerContext: PartnerApiContext | null = null;

    try {
      // 1. Basic request validation
      const basicValidation = await validateBasicRequest(
        request,
        requestMetadata,
      );
      if (!basicValidation.valid) {
        return createErrorResponse({
          code: basicValidation.errorCode!,
          message: basicValidation.error!,
          requestId,
          startTime,
        });
      }

      // 2. Partner authentication

      if (options.requireAuth !== false) {
        const authResult = await partnerApiAuth.authenticate(request);

        if (!authResult.success) {
          await logSecurityEvent({
            type: "auth_failure",
            ip,
            userAgent,
            error: authResult.error,
            requestId,
          });

          return createErrorResponse({
            code: authResult.errorCode!,
            message: authResult.error!,
            requestId,
            startTime,
          });
        }

        partnerContext = {
          partner: authResult.partner!,
          apiKey: authResult.apiKey!,
          requestId,
          startTime,
          metadata: requestMetadata,
        };

        // 3. Permission validation
        if (options.permissions && options.permissions.length > 0) {
          const hasPermission = await validatePermissions(
            partnerContext.apiKey.permissions,
            options.permissions,
          );

          if (!hasPermission) {
            await logSecurityEvent({
              type: "permission_denied",
              partnerId: partnerContext.partner.id,
              permissions: options.permissions,
              requestId,
            });

            return createErrorResponse({
              code: "insufficient_permissions",
              message: "Insufficient permissions for this operation",
              requestId,
              startTime,
            });
          }
        }

        // 4. Rate limiting
        const rateLimitResult = await partnerRateLimiter.checkLimit({
          partnerId: partnerContext.partner.id,
          apiKeyId: partnerContext.apiKey.id,
          ip,
          endpoint: request.nextUrl.pathname,
          override: options.rateLimit?.override,
          customLimit: options.rateLimit?.customLimit,
        });

        if (!rateLimitResult.allowed) {
          await logSecurityEvent({
            type: "rate_limit_exceeded",
            partnerId: partnerContext.partner.id,
            limit: rateLimitResult.limit,
            current: rateLimitResult.current,
            requestId,
          });

          return createErrorResponse({
            code: "rate_limit_exceeded",
            message: `Rate limit exceeded. Limit: ${rateLimitResult.limit}, Reset: ${rateLimitResult.resetTime}`,
            requestId,
            startTime,
            headers: {
              "X-RateLimit-Limit": rateLimitResult.limit.toString(),
              "X-RateLimit-Remaining": Math.max(
                0,
                rateLimitResult.limit - rateLimitResult.current,
              ).toString(),
              "X-RateLimit-Reset": rateLimitResult.resetTime!.toString(),
            },
          });
        }

        // Add rate limit headers to context for response
        partnerContext.metadata = {
          ...partnerContext.metadata,
          rateLimit: {
            limit: rateLimitResult.limit,
            remaining: Math.max(
              0,
              rateLimitResult.limit - rateLimitResult.current,
            ),
            reset: rateLimitResult.resetTime!,
          },
        };
      }

      // 5. Request validation (schema, body, query)
      if (options.validation) {
        const validationResult = await validatePartnerRequest(
          request,
          options.validation,
        );
        if (!validationResult.valid) {
          return createErrorResponse({
            code: PartnerApiErrorCode.INVALID_REQUEST,
            message: validationResult.error!,
            details: validationResult.details,
            requestId,
            startTime,
          });
        }
      }

      // 6. Usage tracking
      if (partnerContext) {
        await trackApiUsage({
          partnerId: partnerContext.partner.id,
          apiKeyId: partnerContext.apiKey.id,
          endpoint: request.nextUrl.pathname,
          method: request.method,
          requestSize: contentLength,
          timestamp: new Date().toISOString(),
        });
      }

      // 7. Execute handler
      const response = await handler(request, partnerContext!);

      // 8. Process response
      const processedResponse = await processResponse(
        response,
        partnerContext,
        {
          requestId,
          startTime,
          options,
        },
      );

      // 9. Log successful request
      if (options.logging?.logRequest !== false && partnerContext) {
        await logApiRequest({
          partnerId: partnerContext.partner.id,
          requestId,
          endpoint: request.nextUrl.pathname,
          method: request.method,
          responseTime: Date.now() - startTime,
          statusCode: 200,
          requestSize: contentLength,
          responseSize: JSON.stringify(response).length,
        });
      }

      return processedResponse;
    } catch (error) {
      // Global error handling
      const errorMessage =
        error instanceof Error ? error.message : "Internal server error";

      logger.error("Partner API error", { 
        startTime,
        error,
        requestId,
        endpoint: request.nextUrl.pathname,
        method: request.method,
        ip,
        userAgent,
        responseTime: Date.now() - startTime });

      if (options.logging?.logErrors !== false) {
        await logApiRequest({
          partnerId: partnerContext?.partner.id,
          requestId,
          endpoint: request.nextUrl.pathname,
          method: request.method,
          responseTime: Date.now() - startTime,
          statusCode: 500,
          error: errorMessage,
          requestSize: contentLength,
        });
      }

      return createErrorResponse({
        code: PartnerApiErrorCode.INTERNAL_ERROR,
        message: "An internal error occurred",
        requestId,
        startTime,
      });
    }
  };
}

// Helper Functions

async function validateBasicRequest(
  request: NextRequest,
  metadata: { ip: string; userAgent: string; requestSize: number }): Promise<{
  valid: boolean;
  error?: string;
  errorCode?: PartnerApiErrorCode;
}> {
  // Check request size limits
  if (metadata.requestSize > 50 * 1024 * 1024) {
    // 50MB limit
    return {
      valid: false,
      error: "Request body too large",
      errorCode: PartnerApiErrorCode.INVALID_REQUEST,
    };
  }

  // Check for required headers
  const contentType = request.headers.get("content-type");
  if (request.method !== "GET" && !contentType) {
    return {
      valid: false,
      error: "Content-Type header required for non-GET requests",
      errorCode: PartnerApiErrorCode.INVALID_REQUEST,
    };
  }

  // Basic security checks
  if (
    metadata.userAgent.toLowerCase().includes("bot") &&
    !metadata.userAgent.toLowerCase().includes("legitimate-bot-identifier")
  ) {
    return {
      valid: false,
      error: "Automated requests not allowed",
      errorCode: PartnerApiErrorCode.INVALID_REQUEST,
    };
  }

  return { valid: true };
}

async function validatePermissions(
  apiPermissions: any,
  requiredPermissions: string[],
): Promise<boolean> {
  for (const permission of requiredPermissions) {
    const [resource, action] = permission.split(".");

    if (!apiPermissions[resource] || !apiPermissions[resource][action]) {
      return false;
    }
  }

  return true;
}

async function processResponse<T>(
  response: PartnerApiResponse<T>,
  context: PartnerApiContext | null,
  meta: {
    requestId: string;
    startTime: number;
    options: PartnerMiddlewareOptions;
  },
): Promise<NextResponse> {
  const processingTime = Date.now() - meta.startTime;

  // Enrich response with metadata
  const enrichedResponse: PartnerApiResponse<T> = {
    ...response,
    metadata: {
      requestId: meta.requestId,
      timestamp: new Date().toISOString(),
      processingTime,
      rateLimit: context?.metadata.rateLimit
        ? {
            remaining: context.metadata.rateLimit.remaining,
            reset: new Date(
              context.metadata.rateLimit.reset * 1000,
            ).toISOString(),
          }
        : {
            remaining: 0,
            reset: new Date().toISOString(),
          },
    },
  };

  const headers = new Headers({
    "Content-Type": "application/json",
    "X-Request-ID": meta.requestId,
    "X-Processing-Time": processingTime.toString(),
  });

  // Add rate limit headers if available
  if (context?.metadata.rateLimit) {
    headers.set(
      "X-RateLimit-Limit",
      context.metadata.rateLimit.limit.toString(),
    );
    headers.set(
      "X-RateLimit-Remaining",
      context.metadata.rateLimit.remaining.toString(),
    );
    headers.set(
      "X-RateLimit-Reset",
      context.metadata.rateLimit.reset.toString(),
    );
  }

  // Add CORS headers for browser requests
  if (context?.metadata.origin) {
    headers.set("Access-Control-Allow-Origin", context.metadata.origin);
    headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
    headers.set(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, X-Request-ID",
    );
  }

  return NextResponse.json(enrichedResponse, {
    status: response.success ? 200 : 400,
    headers,
  });
}

function createErrorResponse(params: {
  code: PartnerApiErrorCode | string;
  message: string;
  details?: Record<string, unknown>;
  requestId: string;
  startTime: number;
  headers?: Record<string, string>;
}): NextResponse {
  const errorResponse: PartnerApiResponse = {
    success: false,
    error: {
      code: params.code,
      message: params.message,
      details: params.details,
    },
    metadata: {
      requestId: params.requestId,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - params.startTime,
      rateLimit: {
        remaining: 0,
        reset: new Date().toISOString(),
      },
    },
  };

  const headers = new Headers({
    "Content-Type": "application/json",
    "X-Request-ID": params.requestId,
  });

  // Add any additional headers
  if (params.headers) {
    Object.entries(params.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

  const statusCode = getStatusCodeForError(params.code);

  return NextResponse.json(errorResponse, {
    status: statusCode,
    headers,
  });
}

function getStatusCodeForError(errorCode: string): number {
  switch (errorCode) {
    case "invalid_api_key":
    case "expired_api_key":
      return 401;
    case "insufficient_permissions":
      return 403;
    case "resource_not_found":
      return 404;
    case "rate_limit_exceeded":
    case "quota_exceeded":
      return 429;
    case "invalid_request":
    case "missing_required_field":
    case "invalid_field_value":
      return 400;
    case "resource_already_exists":
      return 409;
    case "document_too_large":
      return 413;
    case "service_unavailable":
      return 503;
    case "internal_error":
    default:
      return 500;
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${createHash("sha256")
    .update(Math.random().toString())
    .digest("hex")
    .substring(0, 8)}`;
}

function extractClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const real = request.headers.get("x-real-ip");
  const cf = request.headers.get("cf-connecting-ip");

  if (cf) return cf;
  if (real) return real;
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}

// Logging and tracking functions (to be implemented)
async function logSecurityEvent(event: any): Promise<void> {
  logger.warn("Partner API security event", event);
  // Implementation would log to security audit system
}

async function trackApiUsage(usage: any): Promise<void> {
  logger.debug("Partner API usage", usage);
  // Implementation would track usage for billing
}

async function logApiRequest(log: any): Promise<void> {
  logger.info("Partner API request", log);
  // Implementation would log request for analytics
}

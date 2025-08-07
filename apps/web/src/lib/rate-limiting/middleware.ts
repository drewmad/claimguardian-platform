/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Rate limiting middleware for Next.js API routes with comprehensive protection"
 * @dependencies ["@/lib/rate-limiting/rate-limiter", "next"]
 * @status stable
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimiter, RateLimitResult } from "./rate-limiter";
import { logger } from "@/lib/logger/production-logger";

export interface RateLimitMiddlewareOptions {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (req: NextRequest) => string;
  skipIf?: (req: NextRequest) => boolean;
  onLimitReached?: (req: NextRequest, result: RateLimitResult) => void;
  customResponse?: (req: NextRequest, result: RateLimitResult) => NextResponse;
  enableHeaders?: boolean;
}

/**
 * Create rate limiting middleware for Next.js API routes
 */
export function createRateLimitMiddleware(options: RateLimitMiddlewareOptions = {}) {
  const {
    windowMs = 60 * 1000,
    maxRequests = 100,
    keyGenerator = (req) => getClientIdentifier(req),
    skipIf,
    onLimitReached,
    customResponse,
    enableHeaders = true,
  } = options;

  return async (req: NextRequest): Promise<NextResponse | void> => {
    try {
      // Skip rate limiting if condition met
      if (skipIf && skipIf(req)) {
        return;
      }

      const identifier = keyGenerator(req);
      const endpoint = new URL(req.url).pathname;
      const method = req.method;

      // Perform multiple rate limit checks
      const [globalResult, ipResult] = await Promise.all([
        rateLimiter.checkGlobalLimit({ identifier, endpoint, method }),
        rateLimiter.checkIPLimit({ 
          ip: getClientIP(req), 
          endpoint,
          suspicious: await isSuspiciousRequest(req),
        }),
      ]);

      // Check if any rate limit is exceeded
      const limitResults = [globalResult, ipResult];
      const violatedResult = limitResults.find(result => !result.allowed);

      if (violatedResult) {
        if (onLimitReached) {
          onLimitReached(req, violatedResult);
        }

        // Create custom response or default
        if (customResponse) {
          return customResponse(req, violatedResult);
        }

        return createRateLimitResponse(violatedResult, enableHeaders);
      }

      // Add rate limit headers to successful requests
      if (enableHeaders) {
        const response = NextResponse.next();
        addRateLimitHeaders(response, globalResult);
        return response;
      }
    } catch (error) {
      logger.error("Rate limit middleware error", {
        module: "rate-limit-middleware",
        url: req.url,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Continue on error - don't block requests due to rate limiting failures
    }
  };
}

/**
 * Specialized middleware for AI endpoints
 */
export function createAIRateLimitMiddleware() {
  return async (req: NextRequest): Promise<NextResponse | void> => {
    try {
      const userId = await getUserId(req);
      if (!userId) {
        return NextResponse.json(
          { error: "Authentication required for AI endpoints" },
          { status: 401 }
        );
      }

      const pathname = new URL(req.url).pathname;
      const aiProvider = pathname.includes("openai") ? "openai" : "gemini";
      const operation = determineAIOperation(pathname);

      const result = await rateLimiter.checkAILimit({
        userId,
        aiProvider,
        operation,
        tokenCount: await estimateTokenCount(req),
      });

      if (!result.allowed) {
        logger.warn("AI rate limit exceeded", {
          module: "ai-rate-limit",
          userId,
          aiProvider,
          operation,
          remaining: result.remaining,
        });

        return NextResponse.json(
          {
            error: "AI rate limit exceeded",
            details: {
              provider: aiProvider,
              operation,
              resetTime: result.resetTime,
              remaining: result.remaining,
            },
          },
          { 
            status: 429,
            headers: {
              "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
              "X-RateLimit-Limit": "AI Usage Limit",
              "X-RateLimit-Remaining": result.remaining.toString(),
              "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
            },
          }
        );
      }

      // Add AI-specific headers
      const response = NextResponse.next();
      response.headers.set("X-AI-RateLimit-Remaining", result.remaining.toString());
      response.headers.set("X-AI-RateLimit-Reset", new Date(result.resetTime).toISOString());
      return response;
    } catch (error) {
      logger.error("AI rate limit middleware error", {
        module: "ai-rate-limit",
        url: req.url,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}

/**
 * Specialized middleware for emergency data endpoints
 */
export function createEmergencyDataRateLimitMiddleware() {
  return async (req: NextRequest): Promise<NextResponse | void> => {
    try {
      const userId = await getUserId(req);
      if (!userId) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      const pathname = new URL(req.url).pathname;
      const dataType = determineDataType(pathname);
      const county = req.nextUrl.searchParams.get("county") || undefined;

      const result = await rateLimiter.checkEmergencyDataLimit({
        userId,
        dataType,
        county,
      });

      if (!result.allowed) {
        return NextResponse.json(
          {
            error: "Emergency data rate limit exceeded",
            details: {
              dataType,
              county,
              resetTime: result.resetTime,
              remaining: result.remaining,
            },
          },
          { 
            status: 429,
            headers: {
              "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            },
          }
        );
      }

      const response = NextResponse.next();
      response.headers.set("X-Emergency-RateLimit-Remaining", result.remaining.toString());
      return response;
    } catch (error) {
      logger.error("Emergency data rate limit middleware error", {
        module: "emergency-rate-limit",
        url: req.url,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}

/**
 * Specialized middleware for document upload endpoints
 */
export function createDocumentRateLimitMiddleware() {
  return async (req: NextRequest): Promise<NextResponse | void> => {
    try {
      const userId = await getUserId(req);
      if (!userId) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      const pathname = new URL(req.url).pathname;
      const operation = determineDocumentOperation(pathname);
      const fileSize = parseInt(req.headers.get("content-length") || "0", 10);

      const result = await rateLimiter.checkDocumentLimit({
        userId,
        operation,
        fileSize,
      });

      if (!result.allowed) {
        return NextResponse.json(
          {
            error: "Document processing rate limit exceeded",
            details: {
              operation,
              resetTime: result.resetTime,
              remaining: result.remaining,
              message: "Please wait before uploading more documents",
            },
          },
          { 
            status: 429,
            headers: {
              "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            },
          }
        );
      }

      const response = NextResponse.next();
      response.headers.set("X-Document-RateLimit-Remaining", result.remaining.toString());
      return response;
    } catch (error) {
      logger.error("Document rate limit middleware error", {
        module: "document-rate-limit",
        url: req.url,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}

// Utility functions
function getClientIdentifier(req: NextRequest): string {
  // Try to get user ID first, fallback to IP
  const userId = req.headers.get("x-user-id");
  if (userId) return `user:${userId}`;

  const ip = getClientIP(req);
  return `ip:${ip}`;
}

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const real = req.headers.get("x-real-ip");
  const cf = req.headers.get("cf-connecting-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (real) return real;
  if (cf) return cf;
  
  return "unknown"; // Note: req.ip not available in Edge Runtime
}

async function getUserId(req: NextRequest): Promise<string | null> {
  // Extract user ID from JWT token, session, or headers
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      // This would decode the JWT token to get user ID
      // For now, return a mock implementation
      const userId = req.headers.get("x-user-id");
      return userId;
    } catch {
      return null;
    }
  }
  
  return null;
}

async function isSuspiciousRequest(req: NextRequest): Promise<boolean> {
  const ip = getClientIP(req);
  const userAgent = req.headers.get("user-agent") || "";
  
  // Basic suspicious request detection
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
  ];

  const isSuspiciousUA = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  const isPrivateIP = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(ip);
  
  return isSuspiciousUA && !isPrivateIP;
}

function determineAIOperation(pathname: string): "chat" | "analysis" | "generation" {
  if (pathname.includes("chat") || pathname.includes("policy-advisor")) return "chat";
  if (pathname.includes("analyze") || pathname.includes("damage-analyzer")) return "analysis";
  if (pathname.includes("generate") || pathname.includes("3d-model")) return "generation";
  return "chat";
}

function determineDataType(pathname: string): "hurricane" | "flood" | "weather" | "fema" {
  if (pathname.includes("hurricane")) return "hurricane";
  if (pathname.includes("flood")) return "flood";
  if (pathname.includes("weather")) return "weather";
  if (pathname.includes("fema")) return "fema";
  return "weather";
}

function determineDocumentOperation(pathname: string): "upload" | "analysis" | "extraction" {
  if (pathname.includes("upload")) return "upload";
  if (pathname.includes("analyze")) return "analysis";
  if (pathname.includes("extract")) return "extraction";
  return "upload";
}

async function estimateTokenCount(req: NextRequest): Promise<number> {
  try {
    const body = await req.clone().text();
    if (!body) return 100; // Default token count
    
    // Rough token estimation: ~4 characters per token
    return Math.ceil(body.length / 4);
  } catch {
    return 100; // Default fallback
  }
}

function createRateLimitResponse(result: RateLimitResult, enableHeaders: boolean): NextResponse {
  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
  
  const response = NextResponse.json(
    {
      error: "Rate limit exceeded",
      message: "Too many requests. Please try again later.",
      details: {
        resetTime: result.resetTime,
        retryAfter: retryAfter,
      },
    },
    { status: 429 }
  );

  if (enableHeaders) {
    addRateLimitHeaders(response, result);
    response.headers.set("Retry-After", retryAfter.toString());
  }

  return response;
}

function addRateLimitHeaders(response: NextResponse, result: RateLimitResult): void {
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", new Date(result.resetTime).toISOString());
  response.headers.set("X-RateLimit-Used", result.totalRequests.toString());
}

export {
  getClientIP,
  getClientIdentifier,
  isSuspiciousRequest,
};
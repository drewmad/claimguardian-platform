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
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { botProtection } from "@/lib/security/bot-protection";
import { createClient } from "@/lib/supabase/middleware";
import { rateLimiter, RateLimiter } from "@/lib/security/rate-limiter";
import { logger } from "@/lib/logger/production-logger";
import { toError } from "@claimguardian/utils";

// Cache for user validations to reduce database calls
const userValidationCache = new Map<string, { 
  user: any; 
  timestamp: number; 
  ttl: number; 
}>();
const VALIDATION_CACHE_TTL = 30000; // 30 seconds

// Cache for security headers to reduce computation
const securityHeadersCache = new Map<string, any>();

// Cache helper functions
function getCachedUserValidation(userId: string): any | null {
  const cached = userValidationCache.get(userId);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.user;
  }
  return null;
}

function setCachedUserValidation(userId: string, user: any): void {
  userValidationCache.set(userId, {
    user,
    timestamp: Date.now(),
    ttl: VALIDATION_CACHE_TTL
  });
  
  // Clean up old entries periodically
  if (userValidationCache.size > 1000) {
    const cutoff = Date.now() - VALIDATION_CACHE_TTL;
    for (const [key, value] of userValidationCache.entries()) {
      if (value.timestamp < cutoff) {
        userValidationCache.delete(key);
      }
    }
  }
}

// Admin role validation function
async function isUserAdmin(supabase: any, userId: string): Promise<boolean> {
  try {
    // Check if user has admin role in user_profiles table
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role, is_admin')
      .eq('id', userId)
      .single();
    
    if (error) {
      logger.warn("[MIDDLEWARE] Failed to check admin status:", {
        userId,
        error: error.message,
      });
      return false;
    }
    
    // User is admin if role is 'admin' or is_admin is true
    return data?.role === 'admin' || data?.is_admin === true;
  } catch (error) {
    logger.error("[MIDDLEWARE] Admin check error:", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

// Type guards for middleware safety
type MiddlewareRequest = NextRequest & {
  cookies: {
    getAll(): Array<{ name: string; value: string }>;
  };
};

type MiddlewareResponse = NextResponse & {
  cookies: {
    set(name: string, value: string, options?: Record<string, unknown>): void;
  };
};

function isValidRequest(request: NextRequest): request is MiddlewareRequest {
  return "cookies" in request && typeof request.cookies.getAll === "function";
}

function isValidResponse(
  response: NextResponse,
): response is MiddlewareResponse {
  return "cookies" in response && typeof response.cookies.set === "function";
}

// Helper to clear all auth cookies
function clearAuthCookies(request: NextRequest, response: NextResponse) {
  if (!isValidRequest(request) || !isValidResponse(response)) {
    logger.warn(
      "[MIDDLEWARE] Invalid request or response objects for cookie clearing",
    );
    return;
  }

  const cookies = request.cookies.getAll();

  cookies.forEach((cookie) => {
    // Clear Supabase auth cookies and any custom auth cookies
    if (
      cookie.name.includes("sb-") ||
      cookie.name.includes("auth") ||
      cookie.name === "supabase-auth-token"
    ) {
      response.cookies.set(cookie.name, "", {
        path: "/",
        expires: new Date(0),
        maxAge: 0,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
      });
    }
  });

  logger.info("[MIDDLEWARE] Cleared all auth cookies");
}

// Helper to add security headers
function addSecurityHeaders(response: NextResponse, pathname: string) {
  // Base security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");

  // Content Security Policy with comprehensive directives
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "";

  const cspDirectives = [
    "default-src 'self'",
    // Scripts: Allow self, inline (for Next.js), Google Maps, and specific CDNs
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.google.com https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com",
    // Styles: Allow self and inline (for styled components) and Google Maps
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com https://maps.gstatic.com",
    // Images: Allow various sources for property images and AI analysis
    "img-src 'self' data: blob: https: http://localhost:*",
    // Fonts: Allow self and Google Fonts
    "font-src 'self' data: https://fonts.gstatic.com",
    // Connect: Allow API calls to Supabase, AI services, Google Maps, and analytics
    `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://*.supabase.co wss://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com https://*.google-analytics.com https://*.googleapis.com https://maps.googleapis.com https://maps.google.com https://maps.gstatic.com`,
    // Media: Allow video/audio from self and blob URLs
    "media-src 'self' blob: data:",
    // Objects: Restrict plugins
    "object-src 'none'",
    // Frame ancestors: Prevent clickjacking
    "frame-ancestors 'none'",
    // Base URI: Restrict base tag
    "base-uri 'self'",
    // Form action: Only allow self
    "form-action 'self'",
    // Upgrade insecure requests in production
    process.env.NODE_ENV === "production" ? "upgrade-insecure-requests" : "",
    // Worker sources for PWA support
    "worker-src 'self' blob:",
    // Manifest for PWA
    "manifest-src 'self'",
    // Frame sources (if needed for embeds)
    "frame-src 'self' https://www.google.com https://maps.google.com",
  ].filter(Boolean);

  response.headers.set("Content-Security-Policy", cspDirectives.join("; "));

  // Report-Only CSP for monitoring violations without blocking
  if (process.env.NODE_ENV === "production") {
    const reportUri = process.env.CSP_REPORT_URI || "/api/csp-report";
    const reportOnlyDirectives = [...cspDirectives, `report-uri ${reportUri}`];
    response.headers.set(
      "Content-Security-Policy-Report-Only",
      reportOnlyDirectives.join("; "),
    );
  }

  // Permissions Policy based on route
  if (
    pathname.includes("/damage-analyzer") ||
    pathname.includes("/ai-tools") ||
    pathname.includes("/evidence-organizer") ||
    pathname.includes("/3d-model-generator")
  ) {
    response.headers.set(
      "Permissions-Policy",
      "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()",
    );
  } else {
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()",
    );
  }
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static assets and health checks
  const skipRateLimit = ["/_next", "/favicon.ico", "/api/health", "/debug"];

  // Skip middleware for static assets and API routes that don't need auth
  const publicPaths = [
    "/_next",
    "/favicon.ico",
    "/api/health",
    "/api/legal/documents",
    "/debug",
  ];

  // Define truly public pages that don't require authentication
  const publicPages = [
    "/",
    "/auth/signin",
    "/auth/signup",
    "/auth/recover",
    "/auth/reset-password",
    "/auth/verify",
    "/auth/callback",
    "/legal/privacy-policy",
    "/legal/terms-of-service",
    "/legal/ai-use-agreement",
    "/contact",
    "/blog",
    "/guides",
    "/hurricane-prep",
    "/onboarding",
  ];

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return response;
  }

  // Apply rate limiting (except for static assets)
  if (!skipRateLimit.some((path) => pathname.startsWith(path))) {
    const rateLimitConfig = getRateLimitConfigForPath(pathname);
    const rateLimitResult = await rateLimiter.isRateLimited(
      request,
      pathname,
      rateLimitConfig,
    );

    if (rateLimitResult.limited) {
      // Log rate limit violation for security monitoring
      logger.warn("[RATE_LIMIT_EXCEEDED]", {
        timestamp: new Date().toISOString(),
        ip:
          request.headers.get("x-forwarded-for")?.split(",")[0] ||
          request.headers.get("x-real-ip") ||
          "unknown",
        path: pathname,
        method: request.method,
        userAgent: request.headers.get("user-agent"),
        resetTime: new Date(rateLimitResult.resetTime).toISOString(),
      });

      return new NextResponse(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
          resetTime: new Date(rateLimitResult.resetTime).toISOString(),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil(
              (rateLimitResult.resetTime - Date.now()) / 1000,
            ).toString(),
            "X-RateLimit-Limit": rateLimitConfig.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        },
      );
    }

    // Add rate limit headers to successful responses
    response.headers.set(
      "X-RateLimit-Limit",
      rateLimitConfig.maxRequests.toString(),
    );
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimitResult.remaining.toString(),
    );
    response.headers.set(
      "X-RateLimit-Reset",
      rateLimitResult.resetTime.toString(),
    );
  }

  // Bot protection check
  const botCheck = botProtection.checkRequest(request);

  // Block obvious bots
  if (botCheck.shouldBlock) {
    logger.info("[MIDDLEWARE] Bot blocked:", {
      confidence: botCheck.confidence,
      reasons: botCheck.reasons,
      path: pathname,
      userAgent: request.headers.get("user-agent"),
    });

    return new NextResponse("Access Denied", {
      status: 403,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  // Add bot detection headers for client-side handling
  if (botCheck.shouldChallenge) {
    response.headers.set("X-Bot-Challenge", "true");
    response.headers.set("X-Bot-Confidence", botCheck.confidence.toString());
  }

  // Determine if this is a public page
  const isPublicPage =
    publicPages.includes(pathname) ||
    publicPages.some((page) => pathname.startsWith(page));

  // Create Supabase client for middleware
  const supabase = createClient(request, response);

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Only log auth errors for protected routes, not public pages
    if (error && !isPublicPage) {
      logger.error(
        `[MIDDLEWARE] Session error at ${pathname}:`,
        new Error(error.message),
      );

      // Handle refresh token errors by clearing cookies (only for protected routes)
      if (
        error.message.includes("refresh_token_not_found") ||
        error.message.includes("Invalid Refresh Token") ||
        error.message.includes("invalid_grant")
      ) {
        clearAuthCookies(request, response);

        // Redirect to signin if on protected route
        const protectedPaths = [
          "/dashboard",
          "/ai-tools",
          "/account",
          "/admin",
        ];
        if (protectedPaths.some((path) => pathname.startsWith(path))) {
          return NextResponse.redirect(
            new URL("/auth/signin?message=Session expired", request.url),
          );
        }
      }
    } else if (error && isPublicPage) {
      // For public pages, silently handle auth errors without logging
      // This is expected behavior - public pages don't require auth
    }

    // Double-validate session for extra security on protected routes only
    let validatedUser = null;
    if (user && !error && !isPublicPage) {
      // Check cache first to avoid unnecessary database calls
      const cachedValidation = getCachedUserValidation(user.id);
      
      if (cachedValidation) {
        validatedUser = cachedValidation;
      } else {
        const {
          data: { user: validatedUserFromGet },
          error: userError,
        } = await supabase.auth.getUser();

        if (!userError && validatedUserFromGet) {
          validatedUser = validatedUserFromGet;
          setCachedUserValidation(user.id, validatedUserFromGet);
        } else if (userError) {
          logger.warn("[MIDDLEWARE] User validation failed:", {
            error: userError.message,
            path: pathname,
            sessionUser: user.email,
          });

          // Clear cookies on validation failure
          if (
            userError.message?.includes("refresh_token") ||
            userError.message?.includes("Invalid") ||
            userError.message?.includes(
              "User from sub claim in JWT does not exist",
            )
          ) {
            clearAuthCookies(request, response);
            // Sign out to clear server-side session
            await supabase.auth.signOut();
          }
        }
      }
    } else if (user && !error && isPublicPage) {
      // For public pages, if user exists, use them directly without double validation
      validatedUser = user;
    }

    // Audit logging for security and compliance
    try {
      // Get IP address and user agent
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        request.headers.get("cf-connecting-ip") ||
        "unknown";

      const userAgent = request.headers.get("user-agent") || "unknown";

      // Build metadata for logging
      const metadata = {
        method: request.method,
        path: pathname,
        query: Object.fromEntries(request.nextUrl.searchParams),
        referer: request.headers.get("referer"),
        timestamp: new Date().toISOString(),
      };

      // Log authenticated requests to audit_logs (only for protected routes to reduce noise)
      if (validatedUser && !isPublicPage) {
        await supabase.from("audit_logs").insert({
          user_id: validatedUser.id,
          action: `${request.method} ${pathname}`,
          resource_type: "http_request",
          resource_id: pathname,
          ip_address: ip,
          user_agent: userAgent,
          metadata,
        });
      }

      // Log security-sensitive events to security_logs
      const securityPaths = ["/auth/", "/api/", "/admin/"];
      const shouldLogSecurity = securityPaths.some((path) =>
        pathname.startsWith(path),
      );

      if (
        shouldLogSecurity ||
        (request.method !== "GET" && request.method !== "HEAD")
      ) {
        const severity = pathname.startsWith("/admin/") ? "warning" : "info";
        const eventType = pathname.startsWith("/auth/")
          ? "auth_attempt"
          : pathname.startsWith("/api/")
            ? "api_call"
            : "admin_access";

        await supabase.from("security_logs").insert({
          event_type: eventType,
          severity: severity,
          user_id: validatedUser?.id || null,
          action: `${request.method} ${pathname}`,
          ip_address: ip,
          user_agent: userAgent,
          metadata: {
            ...metadata,
            authenticated: !!validatedUser,
            user_email: validatedUser?.email,
          },
        });
      }
    } catch (error) {
      // Don't block requests if logging fails
      logger.warn("[MIDDLEWARE] Audit logging failed:", {
        error: error instanceof Error ? error.message : "Unknown error",
        path: pathname,
      });
    }

    // Log access attempts for security monitoring
    if (
      process.env.NODE_ENV === "production" &&
      pathname.startsWith("/admin")
    ) {
      logger.info("[SECURITY] Admin access attempt:", {
        timestamp: new Date().toISOString(),
        userId: validatedUser?.id || "unauthenticated",
        userEmail: validatedUser?.email || "unknown",
        path: pathname,
        ip:
          request.headers.get("x-forwarded-for")?.split(",")[0] ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent"),
      });
    }

    // Protected routes configuration
    const protectedRoutes = [
      { path: "/dashboard", requiresAuth: true },
      { path: "/ai-tools", requiresAuth: true },
      { path: "/account", requiresAuth: true },
      { path: "/admin", requiresAuth: true, requiresAdmin: true },
    ];

    // Check if current path is protected
    const matchedRoute = protectedRoutes.find((route) =>
      pathname.startsWith(route.path),
    );

    if (matchedRoute?.requiresAuth && !validatedUser) {
      // Store the attempted URL for redirect after login
      const redirectUrl = new URL("/auth/signin", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      redirectUrl.searchParams.set("message", "Please sign in to continue");

      return NextResponse.redirect(redirectUrl);
    }

    // Check admin routes - enforce actual admin authorization
    if (matchedRoute?.requiresAdmin && validatedUser) {
      const userIsAdmin = await isUserAdmin(supabase, validatedUser.id);
      
      if (!userIsAdmin) {
        logger.warn("[MIDDLEWARE] Unauthorized admin access attempt:", {
          userId: validatedUser.id,
          email: validatedUser.email,
          path: pathname,
          timestamp: new Date().toISOString(),
        });
        
        // Return 403 Forbidden for non-admin users trying to access admin routes
        return new NextResponse("Access Denied: Admin privileges required", {
          status: 403,
          headers: {
            "Content-Type": "text/plain",
          },
        });
      }
      
      // Log successful admin access for auditing
      logger.info("[MIDDLEWARE] Admin route accessed successfully:", {
        userId: validatedUser.id,
        email: validatedUser.email,
        path: pathname,
        timestamp: new Date().toISOString(),
      });
    }

    // Auth pages redirect if already authenticated
    const authPaths = ["/auth/signin", "/auth/signup"];
    if (authPaths.includes(pathname) && validatedUser) {
      // Get redirect URL from query params or default to dashboard
      const redirectTo =
        request.nextUrl.searchParams.get("redirect") || "/dashboard";
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  } catch (error) {
    logger.error(
      `[MIDDLEWARE] Unexpected error at ${pathname}:`,
      toError(error),
    );

    // Don't block requests on unexpected errors
    // Just log and continue
  }

  // Add security headers to all responses
  addSecurityHeaders(response, pathname);

  // Add request ID for tracking
  response.headers.set("X-Request-Id", crypto.randomUUID());

  return response;
}

// Helper function to get rate limit configuration based on path
function getRateLimitConfigForPath(pathname: string) {
  // Authentication paths - very strict
  if (
    pathname.includes("/auth/signin") ||
    pathname.includes("/auth/callback") ||
    pathname.includes("/api/auth/signin")
  ) {
    return RateLimiter.configs.strict;
  }

  // Password reset paths - very strict
  if (
    pathname.includes("/auth/reset") ||
    pathname.includes("/auth/recover") ||
    pathname.includes("/api/auth/reset")
  ) {
    return { maxRequests: 3, windowMs: 60 * 60 * 1000 }; // 3 per hour
  }

  // Registration paths - strict
  if (
    pathname.includes("/auth/signup") ||
    pathname.includes("/api/auth/signup")
  ) {
    return { maxRequests: 5, windowMs: 60 * 60 * 1000 }; // 5 per hour
  }

  // Upload paths - moderate
  if (
    pathname.includes("/upload") ||
    pathname.includes("/api/upload") ||
    pathname.includes("/api/documents")
  ) {
    return { maxRequests: 10, windowMs: 60 * 60 * 1000 }; // 10 per hour
  }

  // AI processing paths - moderate
  if (
    pathname.includes("/ai-tools") ||
    pathname.includes("/api/ai") ||
    pathname.includes("/api/analysis") ||
    pathname.includes("/api/extraction")
  ) {
    return { maxRequests: 30, windowMs: 60 * 60 * 1000 }; // 30 per hour
  }

  // API paths - standard
  if (pathname.startsWith("/api/")) {
    return RateLimiter.configs.moderate;
  }

  // Admin paths - strict
  if (pathname.startsWith("/admin")) {
    return RateLimiter.configs.strict;
  }

  // Default for all other paths - lenient
  return RateLimiter.configs.lenient;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - images/videos/fonts with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|mov|webm|woff|woff2|ttf|otf)$).*)",
  ],
};

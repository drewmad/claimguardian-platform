/**
 * @fileMetadata
 * @purpose "Higher-order component to protect routes that require authentication."
 * @owner frontend-team
 * @dependencies ["react", "@/components/auth/auth-provider"]
 * @exports ["ProtectedRoute"]
 * @complexity low
 * @tags ["auth", "route", "protection"]
 * @status stable
 * @notes Redirects unauthenticated users to landing page.
 */
"use client";

// Removed useRouter import - no client redirects
import React, { useEffect } from "react";
import { logger } from "@/lib/logger";

import { AuthLoading } from "./auth-loading";
import { useAuth } from "./auth-provider";
import { ClientOnlyAuth } from "./client-only-auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRouteInner({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Use secure debug logging only in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      import("@/lib/logger").then(({ logger }) => {
        logger.authDebug("ProtectedRoute", {
          loading,
          hasUser: !!user,
          pathname:
            typeof window !== "undefined" ? window.location.pathname : "server",
        });
      });
    }
  }, [user, loading]);

  // Log when unauthenticated users attempt access (for monitoring only)
  useEffect(() => {
    if (!loading && !user) {
      const redirectInfo = {
        loading,
        pathname: typeof window !== "undefined" ? window.location.pathname : "server",
        timestamp: new Date().toISOString(),
        referrer: typeof document !== "undefined" ? document.referrer : "server",
      };

      logger.info(
        "Unauthenticated user attempted to access protected route",
        redirectInfo,
      );
      logger.warn("Route blocked - unauthenticated user", {
        path: redirectInfo.pathname,
        reason: "unauthenticated",
        userId: undefined,
        ...redirectInfo,
      });

      // NO CLIENT REDIRECT - let middleware handle this
      logger.info(
        '[ProtectedRoute] No client redirect - middleware will handle auth',
        redirectInfo,
      );
    }
  }, [user, loading]);

  // Show loading state while checking authentication
  if (loading) {
    return <AuthLoading />;
  }

  // If no user after loading completes, show loading (middleware will redirect)
  if (!user) {
    return <AuthLoading />; // Middleware will handle redirect to /auth/signin
  }

  // User is authenticated, render children
  return <>{children}</>;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return (
    <ClientOnlyAuth>
      <ProtectedRouteInner>{children}</ProtectedRouteInner>
    </ClientOnlyAuth>
  );
}

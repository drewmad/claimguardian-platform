/**
 * @fileMetadata
 * @purpose "Session cleanup utilities for handling expired tokens"
 * @owner auth-team
 * @dependencies ["next/server", "@/lib/logger"]
 * @exports ["clearSessionCookies", "isSessionExpired", "getSessionExpiryTime"]
 * @complexity low
 * @tags ["auth", "session", "cleanup"]
 * @status stable
 */

import type { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export interface SessionCleanupOptions {
  includeProviderTokens?: boolean;
  includeActivity?: boolean;
  secure?: boolean;
}

/**
 * Clear Supabase session cookies from response
 */
export function clearSessionCookies(
  response: NextResponse,
  options: SessionCleanupOptions = {}
): void {
  const {
    includeProviderTokens = true,
    includeActivity = true,
    secure = process.env.NODE_ENV === 'production'
  } = options;

  const cookiesToClear = [
    'sb-access-token',
    'sb-refresh-token',
    ...(includeProviderTokens ? ['sb-provider-token', 'sb-provider-refresh-token'] : []),
    ...(includeActivity ? ['last_activity'] : [])
  ];

  cookiesToClear.forEach(cookieName => {
    response.cookies.set({
      name: cookieName,
      value: '',
      expires: new Date(0),
      maxAge: 0,
      path: '/',
      httpOnly: true,
      secure,
      sameSite: 'lax'
    });
  });

  logger.info("Session cookies cleared", {
    cookies: cookiesToClear,
    secure,
    includeProviderTokens,
    includeActivity
  });
}

/**
 * Check if session is expired based on error message
 */
export function isSessionExpired(error: any): boolean {
  if (!error || typeof error.message !== 'string') {
    return false;
  }

  const expiredIndicators = [
    'session_not_found',
    'expired',
    'invalid_token',
    'refresh_token_not_found',
    'jwt expired',
    'token has expired',
    'Invalid Refresh Token',
    'Auth session missing'
  ];

  return expiredIndicators.some(indicator => 
    error.message.toLowerCase().includes(indicator.toLowerCase())
  );
}

/**
 * Extract session expiry time from JWT token (if available)
 */
export function getSessionExpiryTime(token: string | null): Date | null {
  if (!token) return null;

  try {
    // Decode JWT payload (without verification, just for expiry check)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    if (payload.exp) {
      return new Date(payload.exp * 1000);
    }
  } catch (error) {
    logger.warn("Failed to decode token expiry", { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }

  return null;
}

/**
 * Check if token is expired based on current timestamp
 */
export function isTokenExpired(token: string | null, bufferMinutes: number = 5): boolean {
  const expiryTime = getSessionExpiryTime(token);
  
  if (!expiryTime) return true; // Assume expired if we can't determine

  const bufferTime = bufferMinutes * 60 * 1000; // Convert to milliseconds
  const now = Date.now();
  
  return (expiryTime.getTime() - bufferTime) <= now;
}

/**
 * Log session cleanup event with context
 */
export function logSessionCleanup(reason: string, context: Record<string, any> = {}): void {
  logger.info("Session cleanup performed", {
    reason,
    timestamp: new Date().toISOString(),
    ...context
  });
}
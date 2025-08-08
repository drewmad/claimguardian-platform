/**
 * @fileMetadata
 * @purpose "Admin authorization utilities with enhanced security"
 * @owner auth-team
 * @dependencies ["@/lib/supabase/server", "@/lib/logger"]
 * @exports ["verifyAdminRole", "requireAdminRole", "AdminAuthResult"]
 * @complexity medium
 * @tags ["auth", "admin", "authorization"]
 * @status stable
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export interface AdminAuthResult {
  success: boolean;
  user?: any;
  error?: string;
  statusCode?: number;
}

/**
 * Verify admin role for a user (non-throwing version)
 */
export async function verifyAdminRole(): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn("Admin access attempt without authentication", { 
        error: authError?.message,
        hasUser: !!user
      });
      return { 
        success: false, 
        error: "Authentication required", 
        statusCode: 401 
      };
    }

    // Check admin role via RLS-protected query
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role, email, full_name")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      logger.error("Failed to fetch user profile for admin check", {
        userId: user.id,
        email: user.email
      }, profileError);
      return { 
        success: false, 
        error: "Profile access denied", 
        statusCode: 403 
      };
    }

    if (!profile || profile.role !== "admin") {
      logger.warn("Non-admin user attempted admin access", {
        userId: user.id,
        email: user.email,
        role: profile?.role || "none",
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
      });
      return { 
        success: false, 
        error: "Admin access required", 
        statusCode: 403 
      };
    }

    // Success - log admin action
    logger.info("Admin access granted", {
      userId: user.id,
      email: user.email,
      adminEmail: profile.email,
      timestamp: new Date().toISOString()
    });

    return { 
      success: true, 
      user: { ...user, profile } 
    };
  } catch (error) {
    logger.error("Admin role verification failed", {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return { 
      success: false, 
      error: "Authorization check failed", 
      statusCode: 500 
    };
  }
}

/**
 * Require admin role (throws appropriate HTTP response)
 */
export async function requireAdminRole(): Promise<{ user: any; profile: any }> {
  const result = await verifyAdminRole();
  
  if (!result.success) {
    const response = NextResponse.json(
      { error: result.error },
      { 
        status: result.statusCode || 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        }
      }
    );
    throw response;
  }

  return { 
    user: result.user, 
    profile: result.user.profile 
  };
}

/**
 * Admin middleware for API routes
 */
export async function withAdminAuth<T>(
  handler: (user: any, profile: any) => Promise<T>
): Promise<T | NextResponse> {
  try {
    const { user, profile } = await requireAdminRole();
    return await handler(user, profile);
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    
    logger.error("Admin handler failed", {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        }
      }
    );
  }
}

/**
 * Check if current user has admin role (for use in components/pages)
 */
export async function isAdmin(): Promise<boolean> {
  const result = await verifyAdminRole();
  return result.success;
}
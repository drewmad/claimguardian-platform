/**
 * @fileMetadata
 * @purpose "Debug endpoint to check auth configuration"
 * @dependencies ["@/lib","next"]
 * @owner backend-team
 * @status stable
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger/production-logger";

import { createClient } from "@/lib/supabase/server";

async function getAuthCookies() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  return allCookies
    .filter(
      (cookie) => cookie.name.includes("sb-") || cookie.name.includes("auth"),
    )
    .map((cookie) => ({
      name: cookie.name,
      hasValue: !!cookie.value,
      length: cookie.value?.length || 0,
    }));
}

export async function GET(request: Request) {
  try {
    // Check environment variables (without exposing sensitive data)
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT_SET";

    // Try to create a Supabase client
    let clientCreated = false;
    let sessionCheck = null;
    let healthCheck = null;

    try {
      const supabase = await createClient();
      clientCreated = true;

      // Try to get user
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      sessionCheck = {
        hasSession: !!user,
        error: error?.message || null,
      };

      // Try a simple health check query
      const { error: healthError } = await supabase
        .from("_test_connection")
        .select("*")
        .limit(1);
      healthCheck = {
        connected:
          !healthError || healthError.message.includes("does not exist"),
        error: healthError?.message || null,
      };
    } catch (clientError) {
      logger.error("Client creation error:", clientError);
      sessionCheck = {
        hasSession: false,
        error:
          clientError instanceof Error ? clientError.message : "Unknown error",
      };
    }

    // Get request info
    const url = new URL(request.url);
    const domain = url.hostname;

    return NextResponse.json({
      status: "debug",
      timestamp: new Date().toISOString(),
      domain,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl,
        hasSupabaseAnonKey,
        supabaseUrl: supabaseUrl.substring(0, 30) + "...",
        supabaseHost: supabaseUrl ? new URL(supabaseUrl).hostname : "NOT_SET",
        isProduction: process.env.NODE_ENV === "production",
        vercelUrl: process.env.VERCEL_URL || "NOT_SET",
      },
      client: {
        created: clientCreated,
        sessionCheck,
        healthCheck,
      },
      cookies: {
        headers: request.headers.get("cookie") ? "present" : "none",
        authCookies: await getAuthCookies(),
      },
    });
  } catch (error) {
    logger.error("Debug endpoint error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

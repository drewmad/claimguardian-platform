/**
 * @fileMetadata
 * @purpose "Test endpoint to verify sign-in functionality"
 * @dependencies ["@/lib","next"]
 * @owner backend-team
 * @status stable
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger/production-logger";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Test sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign in error:", {
        message: error.message,
        status: error.status,
        code: error.code,
      });

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errorCode: error.code,
          errorStatus: error.status,
        },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        emailConfirmed: data.user?.email_confirmed_at !== null,
      },
      session: {
        accessToken: data.session?.access_token ? "present" : "missing",
        expiresAt: data.session?.expires_at,
      },
    });
  } catch (error) {
    logger.error("Test sign in error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * @fileMetadata
 * @purpose "Clear all auth-related cookies to fix refresh token issues"
 * @dependencies ["@/lib","next"]
 * @owner backend-team
 * @status stable
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger/production-logger";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Clear all Supabase and auth-related cookies
    allCookies.forEach((cookie) => {
      if (
        cookie.name.includes("sb-") ||
        cookie.name.includes("auth") ||
        cookie.name === "supabase-auth-token"
      ) {
        cookieStore.set(cookie.name, "", {
          path: "/",
          expires: new Date(0),
          maxAge: 0,
          sameSite: "lax",
          secure: true,
          httpOnly: true,
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "All auth cookies cleared",
      clearedCookies: allCookies
        .filter(
          (c) =>
            c.name.includes("sb-") ||
            c.name.includes("auth") ||
            c.name === "supabase-auth-token",
        )
        .map((c) => c.name),
    });
  } catch (error) {
    logger.error("Clear cookies error:", {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 });
  }
}

export async function POST() {
  return GET();
}

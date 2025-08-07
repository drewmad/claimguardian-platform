/**
 * @fileMetadata
 * @purpose "Server-side auth callback handler for email verification"
 * @dependencies ["@/lib","next"]
 * @owner auth-team
 * @status stable
 */

import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  // Handle token_hash format (email verification links)
  if (tokenHash) {
    logger.info("Redirecting token_hash verification to verify-enhanced page");
    return NextResponse.redirect(
      new URL(
        `/auth/verify-enhanced?token_hash=${tokenHash}&type=${type || "signup"}`,
        requestUrl.origin,
      ),
    );
  }

  if (code) {
    try {
      const supabase = await createClient();

      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        logger.error("Failed to exchange code for session", { error: error.message });
        return NextResponse.redirect(
          new URL(
            `/auth/signin?error=${encodeURIComponent(error.message)}`,
            requestUrl.origin,
          ),
        );
      }

      // Check if this is email verification
      if (type === "signup" || type === "email") {
        logger.info("Email verification successful");
        // Redirect to dashboard since the user is now verified and has a session
        return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
      }

      // For other types (recovery, etc), redirect to next
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch (error) {
      logger.error("Auth callback error", {}, error as Error);
      return NextResponse.redirect(
        new URL("/auth/signin?error=Authentication failed", requestUrl.origin),
      );
    }
  }

  // No code provided
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}

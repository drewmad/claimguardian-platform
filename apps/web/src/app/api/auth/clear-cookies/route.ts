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
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.json({
    message: "All authentication cookies cleared",
    timestamp: new Date().toISOString(),
  });

  // Get all cookies and clear any auth-related ones
  const cookies = request.cookies.getAll();
  cookies.forEach((cookie) => {
    if (
      cookie.name.includes("sb-") ||
      cookie.name.includes("auth") ||
      cookie.name.includes("supabase")
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

  // Also clear with different path combinations just to be sure
  const authCookieNames = [
    "sb-auth-token",
    "sb-refresh-token",
    "sb-access-token",
    "supabase-auth-token",
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const projectRef = supabaseUrl.split("//")[1]?.split(".")[0];
    if (projectRef) {
      authCookieNames.push(`sb-${projectRef}-auth-token`);
      authCookieNames.push(`sb-${projectRef}-auth-token-code-verifier`);
    }
  }

  authCookieNames.forEach((cookieName) => {
    response.cookies.set(cookieName, "", {
      path: "/",
      expires: new Date(0),
      maxAge: 0,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });
  });

  return response;
}

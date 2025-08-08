import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clearSessionCookies, logSessionCleanup } from "@/lib/auth/session-cleanup";

// Force Node.js runtime to avoid Edge warnings with Supabase
export const runtime = 'nodejs';

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut(); // clears the HttpOnly cookie
    
    // Create response and clear all session cookies
    const response = NextResponse.json({ ok: true, message: "Successfully logged out" });
    clearSessionCookies(response);
    
    logSessionCleanup("force_logout", {
      timestamp: new Date().toISOString(),
      method: "POST"
    });
    
    return response;
  } catch (error) {
    console.error("Force logout error:", error);
    
    // Even on error, clear cookies and return success to user
    const response = NextResponse.json({ ok: true, message: "Session cleared" });
    clearSessionCookies(response);
    
    logSessionCleanup("force_logout_error", {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      method: "POST"
    });
    
    return response;
  }
}

export async function GET() {
  return POST();
}
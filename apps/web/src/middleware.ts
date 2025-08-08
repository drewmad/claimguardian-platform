import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { clearSessionCookies, isSessionExpired, logSessionCleanup } from "@/lib/auth/session-cleanup";

const PROTECTED_PATHS = ["/dashboard", "/settings", "/ai-tools", "/account", "/admin"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.cookies.set({ name, value, ...options });
            });
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    const { pathname } = req.nextUrl;

    // Debug headers you can see in Network tab
    res.headers.set("x-auth-path", pathname);
    res.headers.set("x-auth-user", user ? "1" : "0");
    
    // Handle authentication errors and expired sessions
    if (error) {
      res.headers.set("x-auth-error", error.message);
      
      // Check for session expiry or invalid auth errors using utility function
      if (isSessionExpired(error)) {
        clearSessionCookies(res);
        logSessionCleanup("expired_session_detected", {
          path: pathname,
          error: error.message,
          userAgent: req.headers.get('user-agent')
        });
        res.headers.set("x-auth-cleanup", "session-cleared");
      }
    }

    const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

    if (isProtected && !user) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/signin";
      return NextResponse.redirect(url);
    }

    // IMPORTANT: do NOT redirect away from /auth/* here.
    // Allow the sign-in page to load even if a cookie exists.

    return res;
  } catch (error) {
    console.error("Middleware error:", error);
    
    // Clear potentially corrupted session cookies on middleware error
    clearSessionCookies(res);
    logSessionCleanup("middleware_error", {
      path: req.nextUrl.pathname,
      error: error instanceof Error ? error.message : 'Unknown error',
      userAgent: req.headers.get('user-agent')
    });
    
    res.headers.set("x-auth-error", "middleware-error");
    res.headers.set("x-auth-cleanup", "error-recovery");
    return res;
  }
}

export const config = {
  matcher: [
    // Exclude static assets, CSP report endpoint, AND auth routes/api from middleware
    "/((?!_next/static|_next/image|favicon.ico|api/csp-report|auth/.*|api/auth/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|mov|webm|woff|woff2|ttf|otf)$).*)",
  ],
};
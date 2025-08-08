import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PATHS = ["/dashboard", "/settings", "/ai-tools", "/account", "/admin"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => res.cookies.set({ name, value, ...options }),
        remove: (name, options) => res.cookies.set({ name, value: "", ...options, maxAge: 0 }),
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  const { pathname } = req.nextUrl;

  // Debug headers you can see in Network tab
  res.headers.set("x-auth-path", pathname);
  res.headers.set("x-auth-user", user ? "1" : "0");
  if (error?.message) res.headers.set("x-auth-error", error.message);

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/signin";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: do NOT redirect away from /auth/* here.
  // Allow the sign-in page to load even if a cookie exists.

  return res;
}

export const config = {
  matcher: [
    // Exclude static assets, CSP report endpoint, AND auth routes/api from middleware
    "/((?!_next/static|_next/image|favicon.ico|api/csp-report|auth/.*|api/auth/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|mov|webm|woff|woff2|ttf|otf)$).*)",
  ],
};
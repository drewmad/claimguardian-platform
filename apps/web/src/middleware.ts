import { NextResponse, NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PROTECTED = new Set(['/dashboard','/settings','/ai-tools','/account','/admin'])
const isProtected = (p:string) => PROTECTED.has(p) || Array.from(PROTECTED).some(path => p.startsWith(path))

function addDebug(res: NextResponse, path: string, user: boolean, err?: string) {
  res.headers.set('x-auth-path', path)
  res.headers.set('x-auth-user', user ? '1' : '0')
  if (err) res.headers.set('x-auth-error', err)
  // Prevent ALL caching - CDN, browser, edge
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.headers.set('x-middleware-cache', 'no-cache')
  res.headers.set('Pragma', 'no-cache')
  res.headers.set('Expires', '0')
  res.headers.set('Surrogate-Control', 'no-store')
}

function clearAuthCookies(res: NextResponse) {
  // Comprehensive list of all possible Supabase cookies
  const names = [
    'sb-access-token',
    'sb-refresh-token',
    'sb-provider-token',
    'sb-provider-refresh-token',
    'supabase-auth-token',
    'supabase.auth.token',
    'last_activity',
    // Project-specific cookies if Supabase URL is available
    ...(process.env.NEXT_PUBLIC_SUPABASE_URL 
      ? [`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL.split('://')[1]?.split('.')[0]}-auth-token`]
      : [])
  ]
  
  for (const name of names) {
    res.cookies.set({
      name,
      value: '',
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0), // hard delete
      maxAge: 0 // additional deletion signal
    })
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url)

  // Always allow /auth/* and make it uncached
  if (pathname.startsWith('/auth')) {
    const pass = NextResponse.next()
    addDebug(pass, pathname, false)
    return pass
  }

  // Only check auth for protected paths
  if (!isProtected(pathname)) {
    const pass = NextResponse.next()
    addDebug(pass, pathname, false)
    return pass
  }

  // Create response object to update
  let res = NextResponse.next()
  
  // Supabase SSR client with response for cookie updates
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          // Allow Supabase to update cookies on the response
          res.cookies.set({ name, value, ...options })
        },
        remove: (name: string, options: any) => {
          res.cookies.set({ name, value: '', ...options, maxAge: 0 })
        }
      }
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  // If Supabase reports error or no user, clear cookies and redirect
  if (error || !user) {
    // Create redirect response with 302 and no-cache headers
    res = NextResponse.redirect(new URL('/auth/signin', req.url), { status: 302 })
    clearAuthCookies(res)
    addDebug(res, pathname, false, error?.message)
    return res
  }

  // User is authenticated, return updated response with any refreshed cookies
  addDebug(res, pathname, true)
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js)).*)'
  ],
}
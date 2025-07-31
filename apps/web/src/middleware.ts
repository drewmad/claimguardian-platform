import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/middleware'

// Helper to clear all auth cookies
function clearAuthCookies(request: NextRequest, response: NextResponse) {
  const cookies = request.cookies.getAll()
  
  cookies.forEach(cookie => {
    // Clear Supabase auth cookies and any custom auth cookies
    if (cookie.name.includes('sb-') || 
        cookie.name.includes('auth') ||
        cookie.name === 'supabase-auth-token') {
      response.cookies.set(cookie.name, '', {
        path: '/',
        expires: new Date(0),
        maxAge: 0,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
      })
    }
  })
  
  console.log('[MIDDLEWARE] Cleared all auth cookies')
}

// Helper to add security headers
function addSecurityHeaders(response: NextResponse, pathname: string) {
  // Base security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ]
  
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  
  // Permissions Policy based on route
  if (pathname.includes('/damage-analyzer') || 
      pathname.includes('/ai-tools') ||
      pathname.includes('/evidence-organizer') ||
      pathname.includes('/3d-model-generator')) {
    response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()')
  } else {
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  }
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const pathname = request.nextUrl.pathname
  
  // Skip middleware for static assets and API routes that don't need auth
  const publicPaths = [
    '/_next',
    '/favicon.ico',
    '/api/health',
    '/api/legal/documents'
  ]
  
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return response
  }
  
  // Create Supabase client for middleware
  const supabase = createClient(request, response)
  
  try {
    // Get session and validate
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('[MIDDLEWARE] Session error:', {
        error: error.message,
        path: pathname,
        timestamp: new Date().toISOString()
      })
      
      // Handle refresh token errors by clearing cookies
      if (error.message.includes('refresh_token_not_found') || 
          error.message.includes('Invalid Refresh Token') ||
          error.message.includes('invalid_grant')) {
        clearAuthCookies(request, response)
        
        // Redirect to signin if on protected route
        const protectedPaths = ['/dashboard', '/ai-tools', '/ai-augmented', '/account', '/admin']
        if (protectedPaths.some(path => pathname.startsWith(path))) {
          return NextResponse.redirect(new URL('/auth/signin?message=Session expired', request.url))
        }
      }
    }
    
    // Double-validate session for extra security on protected routes
    let validatedUser = null
    if (session && !error) {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (!userError && user) {
        validatedUser = user
      } else if (userError) {
        console.warn('[MIDDLEWARE] User validation failed:', {
          error: userError.message,
          path: pathname,
          sessionUser: session.user?.email
        })
        
        // Clear cookies on validation failure
        if (userError.message?.includes('refresh_token') || 
            userError.message?.includes('Invalid')) {
          clearAuthCookies(request, response)
        }
      }
    }
    
    // Log access attempts for security monitoring
    if (process.env.NODE_ENV === 'production' && pathname.startsWith('/admin')) {
      console.log('[SECURITY] Admin access attempt:', {
        timestamp: new Date().toISOString(),
        userId: validatedUser?.id || 'unauthenticated',
        userEmail: validatedUser?.email || 'unknown',
        path: pathname,
        ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 
            request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent')
      })
    }
    
    // Protected routes configuration
    const protectedRoutes = [
      { path: '/dashboard', requiresAuth: true },
      { path: '/ai-tools', requiresAuth: true },
      { path: '/ai-augmented', requiresAuth: true },
      { path: '/account', requiresAuth: true },
      { path: '/admin', requiresAuth: true, requiresAdmin: true }
    ]
    
    // Check if current path is protected
    const matchedRoute = protectedRoutes.find(route => pathname.startsWith(route.path))
    
    if (matchedRoute?.requiresAuth && !validatedUser) {
      // Store the attempted URL for redirect after login
      const redirectUrl = new URL('/auth/signin', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      redirectUrl.searchParams.set('message', 'Please sign in to continue')
      
      return NextResponse.redirect(redirectUrl)
    }
    
    // Check admin routes (placeholder for future implementation)
    if (matchedRoute?.requiresAdmin && validatedUser) {
      // TODO: Check if user has admin role
      // For now, log the attempt
      console.warn('[MIDDLEWARE] Admin route accessed:', {
        userId: validatedUser.id,
        email: validatedUser.email,
        path: pathname
      })
    }
    
    // Auth pages redirect if already authenticated
    const authPaths = ['/auth/signin', '/auth/signup']
    if (authPaths.includes(pathname) && validatedUser) {
      // Get redirect URL from query params or default to dashboard
      const redirectTo = request.nextUrl.searchParams.get('redirect') || '/dashboard'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    
  } catch (error) {
    console.error('[MIDDLEWARE] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: pathname,
      timestamp: new Date().toISOString()
    })
    
    // Don't block requests on unexpected errors
    // Just log and continue
  }
  
  // Add security headers to all responses
  addSecurityHeaders(response, pathname)
  
  // Add request ID for tracking
  response.headers.set('X-Request-Id', crypto.randomUUID())
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - images/videos/fonts with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|mov|webm|woff|woff2|ttf|otf)$).*)',
  ],
}
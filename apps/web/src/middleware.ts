import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { botProtection } from '@/lib/security/bot-protection'
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
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  
  // Content Security Policy with comprehensive directives
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : ''
  
  const cspDirectives = [
    "default-src 'self'",
    // Scripts: Allow self, inline (for Next.js), and specific CDNs
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com",
    // Styles: Allow self and inline (for styled components)
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Images: Allow various sources for property images and AI analysis
    "img-src 'self' data: blob: https: http://localhost:*",
    // Fonts: Allow self and Google Fonts
    "font-src 'self' data: https://fonts.gstatic.com",
    // Connect: Allow API calls to Supabase, AI services, and analytics
    `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://*.supabase.co wss://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com https://*.google-analytics.com https://*.googleapis.com`,
    // Media: Allow video/audio from self and blob URLs
    "media-src 'self' blob: data:",
    // Objects: Restrict plugins
    "object-src 'none'",
    // Frame ancestors: Prevent clickjacking
    "frame-ancestors 'none'",
    // Base URI: Restrict base tag
    "base-uri 'self'",
    // Form action: Only allow self
    "form-action 'self'",
    // Upgrade insecure requests in production
    process.env.NODE_ENV === 'production' ? "upgrade-insecure-requests" : "",
    // Worker sources for PWA support
    "worker-src 'self' blob:",
    // Manifest for PWA
    "manifest-src 'self'",
    // Frame sources (if needed for embeds)
    "frame-src 'self' https://www.google.com https://maps.google.com"
  ].filter(Boolean)
  
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  
  // Report-Only CSP for monitoring violations without blocking
  if (process.env.NODE_ENV === 'production') {
    const reportUri = process.env.CSP_REPORT_URI || '/api/csp-report'
    const reportOnlyDirectives = [...cspDirectives, `report-uri ${reportUri}`]
    response.headers.set('Content-Security-Policy-Report-Only', reportOnlyDirectives.join('; '))
  }
  
  // Permissions Policy based on route
  if (pathname.includes('/damage-analyzer') || 
      pathname.includes('/ai-tools') ||
      pathname.includes('/evidence-organizer') ||
      pathname.includes('/3d-model-generator')) {
    response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()')
  } else {
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()')
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
    '/api/legal/documents',
    '/debug'
  ]
  
  // Define truly public pages that don't require authentication
  const publicPages = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/signup-advanced',
    '/auth/recover',
    '/auth/reset-password',
    '/auth/verify',
    '/auth/callback',
    '/legal/privacy-policy',
    '/legal/terms-of-service',
    '/legal/ai-use-agreement',
    '/contact',
    '/blog',
    '/guides',
    '/hurricane-prep',
    '/onboarding'
  ]
  
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return response
  }
  
  // Bot protection check
  const botCheck = botProtection.checkRequest(request)
  
  // Block obvious bots
  if (botCheck.shouldBlock) {
    console.log('[MIDDLEWARE] Bot blocked:', {
      confidence: botCheck.confidence,
      reasons: botCheck.reasons,
      path: pathname,
      userAgent: request.headers.get('user-agent')
    })
    
    return new NextResponse('Access Denied', { 
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
      }
    })
  }
  
  // Add bot detection headers for client-side handling
  if (botCheck.shouldChallenge) {
    response.headers.set('X-Bot-Challenge', 'true')
    response.headers.set('X-Bot-Confidence', botCheck.confidence.toString())
  }
  
  // Determine if this is a public page
  const isPublicPage = publicPages.includes(pathname) || 
                      publicPages.some(page => pathname.startsWith(page))
  
  // Create Supabase client for middleware
  const supabase = createClient(request, response)
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // Only log auth errors for protected routes, not public pages
    if (error && !isPublicPage) {
      console.error('[MIDDLEWARE] Session error:', {
        error: error.message,
        path: pathname,
        timestamp: new Date().toISOString()
      })
      
      // Handle refresh token errors by clearing cookies (only for protected routes)
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
    } else if (error && isPublicPage) {
      // For public pages, silently handle auth errors without logging
      // This is expected behavior - public pages don't require auth
    }
    
    // Double-validate session for extra security on protected routes only
    let validatedUser = null
    if (user && !error && !isPublicPage) {
      const { data: { user: validatedUserFromGet }, error: userError } = await supabase.auth.getUser()
      
      if (!userError && validatedUserFromGet) {
        validatedUser = validatedUserFromGet
      } else if (userError) {
        console.warn('[MIDDLEWARE] User validation failed:', {
          error: userError.message,
          path: pathname,
          sessionUser: user.email
        })
        
        // Clear cookies on validation failure
        if (userError.message?.includes('refresh_token') || 
            userError.message?.includes('Invalid') ||
            userError.message?.includes('User from sub claim in JWT does not exist')) {
          clearAuthCookies(request, response)
          // Sign out to clear server-side session
          await supabase.auth.signOut()
        }
      }
    } else if (user && !error && isPublicPage) {
      // For public pages, if user exists, use them directly without double validation
      validatedUser = user
    }
    
    // Audit logging for security and compliance
    try {
      // Get IP address and user agent
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                 request.headers.get('x-real-ip') ||
                 request.headers.get('cf-connecting-ip') ||
                 'unknown'
      
      const userAgent = request.headers.get('user-agent') || 'unknown'
      
      // Build metadata for logging
      const metadata = {
        method: request.method,
        path: pathname,
        query: Object.fromEntries(request.nextUrl.searchParams),
        referer: request.headers.get('referer'),
        timestamp: new Date().toISOString()
      }
      
      // Log authenticated requests to audit_logs (only for protected routes to reduce noise)
      if (validatedUser && !isPublicPage) {
        await supabase.from('audit_logs').insert({
          user_id: validatedUser.id,
          action: `${request.method} ${pathname}`,
          resource_type: 'http_request',
          resource_id: pathname,
          ip_address: ip,
          user_agent: userAgent,
          metadata
        })
      }
      
      // Log security-sensitive events to security_logs
      const securityPaths = ['/auth/', '/api/', '/admin/']
      const shouldLogSecurity = securityPaths.some(path => pathname.startsWith(path))
      
      if (shouldLogSecurity || (request.method !== 'GET' && request.method !== 'HEAD')) {
        const severity = pathname.startsWith('/admin/') ? 'warning' : 'info'
        const eventType = pathname.startsWith('/auth/') ? 'auth_attempt' : 
                         pathname.startsWith('/api/') ? 'api_call' : 
                         'admin_access'
        
        await supabase.from('security_logs').insert({
          event_type: eventType,
          severity: severity,
          user_id: validatedUser?.id || null,
          action: `${request.method} ${pathname}`,
          ip_address: ip,
          user_agent: userAgent,
          metadata: {
            ...metadata,
            authenticated: !!validatedUser,
            user_email: validatedUser?.email
          }
        })
      }
    } catch (error) {
      // Don't block requests if logging fails
      console.warn('[MIDDLEWARE] Audit logging failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: pathname
      })
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
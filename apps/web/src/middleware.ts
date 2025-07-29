import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createClient(request, response)

  // Refresh session if it exists
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('[MIDDLEWARE] Session error:', {
      error: error.message,
      path: request.nextUrl.pathname,
      timestamp: new Date().toISOString()
    })
  }
  
  // Get client IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') ||
    'unknown'

  // Enhanced logging for debugging
  if (request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/ai-augmented')) {
    console.log('[MIDDLEWARE] Protected route access:', {
      path: request.nextUrl.pathname,
      hasSession: !!session,
      sessionUser: session?.user?.email || 'none',
      timestamp: new Date().toISOString()
    })
  }

  // Skip audit logging for now - tables may not exist
  // TODO: Re-enable once audit_logs and security_logs tables are created
  /*
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Log authenticated requests
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: `${request.method} ${request.nextUrl.pathname}`,
        ip_address: ip,
        user_agent: metadata.user_agent,
        metadata,
        created_at: new Date().toISOString(),
      })
    } else if (request.nextUrl.pathname.startsWith('/auth/') || request.nextUrl.pathname.startsWith('/api/')) {
      // Log auth attempts and API calls even when unauthenticated
      await supabase.from('security_logs').insert({
        action: `${request.method} ${request.nextUrl.pathname}`,
        ip_address: ip,
        user_agent: metadata.user_agent,
        metadata,
        created_at: new Date().toISOString(),
      })
    }
  } catch (error) {
    // Don't block requests if logging fails
    console.warn('Audit logging failed:', error)
  }
  */

  // Check protected routes
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/ai-augmented') || 
                          request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/account')
  
  if (isProtectedRoute && !session) {
    // Only log security events in production, avoid exposing internal paths
    if (process.env.NODE_ENV === 'production') {
      // Use structured logging for security monitoring
      // This would typically go to your logging service
      console.warn('Security: Unauthorized route access', {
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        ip: ip
      })
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Allow camera access for damage analyzer and AI tools
  if (request.nextUrl.pathname.includes('/damage-analyzer') || 
      request.nextUrl.pathname.includes('/ai-tools') ||
      request.nextUrl.pathname.includes('/evidence-organizer')) {
    response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()')
  } else {
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  }

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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
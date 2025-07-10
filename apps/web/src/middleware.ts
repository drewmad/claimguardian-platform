import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createClient(request, response)

  // Refresh session if it exists
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Middleware session error:', error)
  }
  
  // Get client IP
  const ip = request.ip || 
    request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') ||
    'unknown'

  // Get metadata
  const metadata = {
    ip,
    user_agent: request.headers.get('user-agent') || 'unknown',
    referer: request.headers.get('referer') || null,
    path: request.nextUrl.pathname,
    method: request.method,
    timestamp: new Date().toISOString(),
    geo: request.geo || null,
  }

  // Log to audit table for authenticated requests
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
        ip: request.ip
      })
    }
    // Let client-side handle the redirect for now to debug the issue
    // return NextResponse.redirect(new URL('/', request.url))
  }

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

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
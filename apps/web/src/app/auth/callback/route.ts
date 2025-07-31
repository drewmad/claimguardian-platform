import type { SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  
  const supabase = await createClient()
  
  // Extract tracking data from request
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1'
  const userAgent = request.headers.get('user-agent') || 'Unknown'
  
  // Handle PKCE flow (code parameter)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Track successful login
      await trackLoginActivity(supabase, {
        userId: data.user.id,
        email: data.user.email || '',
        success: true,
        ipAddress,
        userAgent,
        loginMethod: 'email_verification',
        attemptType: 'email_confirmation'
      })
      
      // Successful verification - redirect to verify success page
      return NextResponse.redirect(`${origin}/auth/verify?success=true`)
    }
  }
  
  // Handle token hash flow (token_hash parameter)
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'recovery' | 'invite'
    })
    
    if (!error && data.user) {
      // Track successful login
      await trackLoginActivity(supabase, {
        userId: data.user.id,
        email: data.user.email || '',
        success: true,
        ipAddress,
        userAgent,
        loginMethod: 'otp_verification',
        attemptType: type
      })
      
      // Successful verification - redirect to verify success page
      return NextResponse.redirect(`${origin}/auth/verify?success=true`)
    }
  }

  // Error case - track failed attempt if we have email
  const email = searchParams.get('email')
  if (email) {
    await trackLoginActivity(supabase, {
      userId: null,
      email,
      success: false,
      ipAddress,
      userAgent,
      loginMethod: 'email_verification',
      attemptType: 'verification_failed',
      errorMessage: 'Invalid verification link'
    })
  }

  // Error case - redirect to error page
  return NextResponse.redirect(`${origin}/auth/verify?error=invalid_link`)
}

// Helper function to track login activity
async function trackLoginActivity(supabase: SupabaseClient, data: {
  userId: string | null
  email: string
  success: boolean
  ipAddress?: string | null
  userAgent?: string | null
  loginMethod: string
  attemptType: string
  errorMessage?: string
}) {
  try {
    if (data.userId && data.success) {
      // For successful logins, use track_user_login function
      const sessionId = `login-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const { error } = await supabase.rpc('track_user_login', {
        p_user_id: data.userId,
        p_session_id: sessionId,
        p_ip_address: data.ipAddress,
        p_user_agent: data.userAgent,
        p_referrer_url: null,
        p_utm_source: null,
        p_utm_medium: null,
        p_utm_campaign: null,
        p_login_method: data.loginMethod
      })
      
      if (error) {
        console.error('Failed to track user login:', error)
      }
    }
    
    // Also log to login_activity table for all attempts
    const { error: logError } = await supabase
      .from('login_activity')
      .insert({
        user_id: data.userId,
        email: data.email,
        success: data.success,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        attempt_type: data.attemptType,
        error_message: data.errorMessage,
        created_at: new Date().toISOString()
      })
    
    if (logError) {
      console.error('Failed to log login activity:', logError)
    }
    
  } catch (error) {
    console.error('Error tracking login activity:', error)
  }
}
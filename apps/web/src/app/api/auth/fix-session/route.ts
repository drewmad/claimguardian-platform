/**
 * @fileMetadata
 * @purpose "Fix invalid user sessions by clearing cookies and redirecting to sign in"
 * @dependencies ["@/lib","next"]
 * @owner backend-team
 * @status stable
 */

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from "@/lib/logger/production-logger"

import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient()

    // Sign out from Supabase
    await supabase.auth.signOut()

    // Clear all auth-related cookies
    const allCookies = cookieStore.getAll()

    allCookies.forEach(cookie => {
      if (cookie.name.includes('sb-') ||
          cookie.name.includes('auth') ||
          cookie.name === 'supabase-auth-token') {
        cookieStore.set(cookie.name, '', {
          path: '/',
          expires: new Date(0),
          maxAge: 0,
          sameSite: 'lax',
          secure: true,
          httpOnly: true
        })
      }
    })

    // Redirect to sign in page with success message
    return NextResponse.redirect(new URL('/auth/signin?message=Session cleared. Please sign in again.', process.env.NEXT_PUBLIC_APP_URL || 'https://claimguardianai.com'))
  } catch (error) {
    logger.error('Fix session error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

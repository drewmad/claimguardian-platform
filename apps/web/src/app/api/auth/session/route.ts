/**
 * @fileMetadata
 * @purpose API route to check authentication session status
 * @owner backend-team
 * @status active
 */

import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/supabase/server-auth'

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        session: null
      })
    }
    
    // Return session info without sensitive data
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        emailConfirmed: session.user.email_confirmed_at !== null,
        createdAt: session.user.created_at,
        metadata: session.user.user_metadata
      },
      session: {
        expiresAt: session.expires_at,
        expiresIn: session.expires_in
      }
    })
  } catch (error) {
    console.error('Session check error:', error)
    
    return NextResponse.json({
      authenticated: false,
      user: null,
      session: null,
      error: 'Failed to check session'
    }, { status: 500 })
  }
}
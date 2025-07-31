/**
 * @fileMetadata
 * @purpose Debug endpoint to check auth configuration
 * @owner backend-team
 * @status active
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: Request) {
  try {
    // Check environment variables (without exposing sensitive data)
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasSupabaseAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET'
    
    // Try to create a Supabase client
    let clientCreated = false
    let sessionCheck = null
    let healthCheck = null
    
    try {
      const supabase = createClient()
      clientCreated = true
      
      // Try to get session
      const { data: { session }, error } = await supabase.auth.getSession()
      sessionCheck = {
        hasSession: !!session,
        error: error?.message || null
      }
      
      // Try a simple health check query
      const { error: healthError } = await supabase.from('_test_connection').select('*').limit(1)
      healthCheck = {
        connected: !healthError || healthError.message.includes('does not exist'),
        error: healthError?.message || null
      }
    } catch (clientError) {
      console.error('Client creation error:', clientError)
      sessionCheck = {
        hasSession: false,
        error: clientError instanceof Error ? clientError.message : 'Unknown error'
      }
    }
    
    // Get request info
    const url = new URL(request.url)
    const domain = url.hostname
    
    return NextResponse.json({
      status: 'debug',
      timestamp: new Date().toISOString(),
      domain,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl,
        hasSupabaseAnonKey,
        supabaseUrl: supabaseUrl.substring(0, 30) + '...',
        supabaseHost: supabaseUrl ? new URL(supabaseUrl).hostname : 'NOT_SET',
        isProduction: process.env.NODE_ENV === 'production',
        vercelUrl: process.env.VERCEL_URL || 'NOT_SET'
      },
      client: {
        created: clientCreated,
        sessionCheck,
        healthCheck
      },
      cookies: {
        headers: request.headers.get('cookie') ? 'present' : 'none'
      }
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test 1: Check if we can connect to Supabase
    await supabase
      .from('_test_connection')
      .select('*')
      .limit(1)
      .maybeSingle()
    
    // Test 2: Check auth status
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Test 3: Validate session with getUser() if session exists
    let validatedUser = null
    let userError = null
    if (session) {
      const { data: { user }, error } = await supabase.auth.getUser()
      validatedUser = user
      userError = error
    }
    
    // Test 4: Check if auth schema exists
    const { data: authSchema, error: schemaError } = await supabase
      .rpc('to_regclass', { rel_name: 'auth.users' })
    
    return NextResponse.json({
      status: 'success',
      tests: {
        connection: {
          success: true,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
        session: {
          hasSession: !!session,
          sessionUser: session?.user?.email || null,
          sessionError: sessionError?.message || null,
        },
        userValidation: {
          hasValidatedUser: !!validatedUser,
          validatedEmail: validatedUser?.email || null,
          userError: userError?.message || null,
        },
        authSchema: {
          exists: !!authSchema,
          schemaError: schemaError?.message || null,
        },
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
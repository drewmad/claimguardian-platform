import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Successful verification - redirect to dashboard
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Error case - redirect to error page
  return NextResponse.redirect(`${origin}/auth/verify?error=invalid_link`)
}
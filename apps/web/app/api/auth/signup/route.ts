import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, firstName, lastName, phone } = await request.json()
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone_number: phone,
        },
      },
    })

    if (error) {
      console.error('Supabase signup error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (e) {
    console.error('Unexpected signup error:', e)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

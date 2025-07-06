import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { name, address, type, year_built, square_feet, details, insurance_carrier, insurance_policy_number } = await request.json()
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: userError?.message || 'User not authenticated' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('properties')
    .insert({
      user_id: user.id,
      name,
      address,
      type,
      year_built,
      square_feet,
      details,
      insurance_carrier,
      insurance_policy_number,
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase create property error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'Property created successfully', property: data })
}
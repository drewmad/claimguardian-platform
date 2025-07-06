import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { property_id, basic_info, identification, financial, physical, location, documentation, warranty, metadata } = await request.json()
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

  // Verify that the property belongs to the user
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id')
    .eq('id', property_id)
    .eq('user_id', user.id)
    .single()

  if (propertyError || !property) {
    return NextResponse.json({ error: 'Property not found or does not belong to user' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('personal_property_items')
    .insert({
      property_id,
      basic_info,
      identification,
      financial,
      physical,
      location,
      documentation,
      warranty,
      metadata,
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase create personal property item error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'Personal property item created successfully', item: data })
}
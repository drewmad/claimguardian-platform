import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
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

  const { data: item, error } = await supabase
    .from('personal_property_items')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Supabase get personal property item error:', error)
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  // Verify that the item belongs to a property owned by the user
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id')
    .eq('id', item.property_id)
    .eq('user_id', user.id)
    .single()

  if (propertyError || !property) {
    return NextResponse.json({ error: 'Item not found or does not belong to user' }, { status: 403 })
  }

  return NextResponse.json({ item })
}
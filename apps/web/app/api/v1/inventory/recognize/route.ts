import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const property_id = formData.get('property_id')
  const imageFile = formData.get('image')

  if (!property_id || !imageFile) {
    return NextResponse.json({ error: 'Missing property_id or image file' }, { status: 400 })
  }

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

  // Simulate AI recognition (replace with actual AI service call)
  const recognizedItems = [
    { name: "Simulated TV", category: "Electronics", value: 500, description: "AI-recognized TV" },
    { name: "Simulated Sofa", category: "Furniture", value: 800, description: "AI-recognized Sofa" },
  ]

  return NextResponse.json({ detected_items: recognizedItems })
}
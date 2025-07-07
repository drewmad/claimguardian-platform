import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { policy_id, property_id, claim_details, damages, timeline, parties, financial, status, correspondence, compliance } = await request.json()
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

  // Basic validation: Ensure property belongs to user
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
    .from('insurance_claims')
    .insert({
      policy_id,
      property_id,
      claim_details,
      damages,
      timeline,
      parties,
      financial,
      status,
      correspondence,
      compliance,
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase create claim error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'Claim created successfully', claim: data })
}
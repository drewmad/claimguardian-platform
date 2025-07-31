import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

import { createBrowserSupabaseClient } from '@claimguardian/db'
import { createPortalSession } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const supabase = createBrowserSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the user's Stripe customer ID from the database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      )
    }

    // Get the host from headers
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const origin = `${protocol}://${host}`

    // Create portal session
    const { url, error } = await createPortalSession(
      profile.stripe_customer_id,
      `${origin}/dashboard/billing`
    )

    if (error || !url) {
      console.error('Error creating portal session:', error)
      return NextResponse.json(
        { error: 'Failed to create portal session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Error in create-portal-session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
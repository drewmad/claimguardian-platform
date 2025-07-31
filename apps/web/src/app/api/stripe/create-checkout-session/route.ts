import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

import { createBrowserSupabaseClient } from '@claimguardian/db'
import { createCheckoutSession, STRIPE_PRICE_IDS } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
    const { priceId, planName } = await request.json()

    // Get the current user
    const supabase = createBrowserSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate price ID
    const validPriceIds = Object.values(STRIPE_PRICE_IDS).flatMap(plan => 
      Object.values(plan).filter(id => id)
    )
    
    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 }
      )
    }

    // Get the host from headers
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const origin = `${protocol}://${host}`

    // Create checkout session
    const { session, error } = await createCheckoutSession({
      userId: user.id,
      email: user.email || '',
      priceId,
      successUrl: `${origin}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/dashboard/billing?canceled=true`,
      trialPeriodDays: 7, // 7-day free trial for all plans
      metadata: {
        planName,
      },
    })

    if (error || !session) {
      console.error('Error creating checkout session:', error)
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error in create-checkout-session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
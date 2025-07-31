import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
  }
  return stripePromise
}

export interface CreateCheckoutSessionResponse {
  sessionId?: string
  error?: string
}

export async function redirectToCheckout(sessionId: string) {
  const stripe = await getStripe()
  if (!stripe) {
    console.error('Stripe not loaded')
    return { error: 'Stripe not loaded' }
  }

  const { error } = await stripe.redirectToCheckout({ sessionId })
  
  if (error) {
    console.error('Error redirecting to checkout:', error)
    return { error: error.message }
  }

  return { error: null }
}

export async function createCheckoutSession(
  priceId: string,
  planName: string
): Promise<CreateCheckoutSessionResponse> {
  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId, planName }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout session')
    }

    return { sessionId: data.sessionId }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function redirectToCustomerPortal(): Promise<{ error?: string }> {
  try {
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create portal session')
    }

    if (data.url) {
      window.location.href = data.url
    }

    return {}
  } catch (error) {
    console.error('Error redirecting to customer portal:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
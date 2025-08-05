/**
 * @fileMetadata
 * @purpose "Stripe payment integration service"
 * @dependencies ["@/config","@stripe/stripe-js"]
 * @owner billing-team
 * @status stable
 */

import { loadStripe, Stripe } from '@stripe/stripe-js'
import { PRICING_PLANS } from '@/config/pricing'

// Client-side Stripe instance
let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
    )
  }
  return stripePromise
}

export interface CreateCheckoutSessionParams {
  priceId: string
  userId: string
  successUrl: string
  cancelUrl: string
  billingInterval: 'monthly' | 'annually'
  customerEmail?: string
  metadata?: Record<string, string>
}

export interface CreatePortalSessionParams {
  customerId: string
  returnUrl: string
}

export interface SubscriptionDetails {
  id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  plan: {
    id: string
    name: string
    interval: 'month' | 'year'
    amount: number
  }
}

export interface PaymentMethod {
  id: string
  type: 'card'
  card: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  isDefault: boolean
}

// Client-side functions
export const stripeClient = {
  /**
   * Redirect to Stripe Checkout for subscription
   */
  async redirectToCheckout(sessionId: string) {
    const stripe = await getStripe()
    if (!stripe) throw new Error('Stripe not initialized')
    
    const { error } = await stripe.redirectToCheckout({ sessionId })
    if (error) {
      throw new Error(error.message)
    }
  },

  /**
   * Update payment method
   */
  async updatePaymentMethod(
    paymentMethodId: string,
    customerId: string
  ) {
    const response = await fetch('/api/stripe/payment-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentMethodId,
        customerId
      })
    })

    if (!response.ok) {
      throw new Error('Failed to update payment method')
    }

    return response.json()
  },

  /**
   * Create setup intent for adding payment method
   */
  async createSetupIntent() {
    const response = await fetch('/api/stripe/setup-intent', {
      method: 'POST'
    })

    if (!response.ok) {
      throw new Error('Failed to create setup intent')
    }

    return response.json()
  }
}

// Helper functions
export const formatCurrency = (
  amount: number,
  currency: string = 'usd'
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount / 100) // Stripe amounts are in cents
}

export const getSubscriptionStatus = (status: string): {
  label: string
  color: 'green' | 'yellow' | 'red' | 'gray'
} => {
  switch (status) {
    case 'active':
      return { label: 'Active', color: 'green' }
    case 'trialing':
      return { label: 'Trial', color: 'yellow' }
    case 'past_due':
      return { label: 'Past Due', color: 'red' }
    case 'canceled':
      return { label: 'Canceled', color: 'gray' }
    case 'incomplete':
      return { label: 'Incomplete', color: 'yellow' }
    default:
      return { label: 'Unknown', color: 'gray' }
  }
}

export const calculateUpgradePrice = (
  currentPlan: string,
  newPlan: string,
  billingInterval: 'monthly' | 'annually',
  daysRemaining: number
): number => {
  const current = PRICING_PLANS[currentPlan]
  const target = PRICING_PLANS[newPlan]
  
  if (!current || !target) return 0
  
  const currentPrice = billingInterval === 'monthly' 
    ? current.price.monthly 
    : current.price.annually / 12
    
  const newPrice = billingInterval === 'monthly'
    ? target.price.monthly
    : target.price.annually / 12
    
  const priceDifference = newPrice - currentPrice
  const proRatedAmount = (priceDifference * daysRemaining) / 30
  
  return Math.max(0, Math.round(proRatedAmount * 100)) // Convert to cents
}
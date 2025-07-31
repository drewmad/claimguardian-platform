import Stripe from 'stripe'

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
  typescript: true,
})

// Price IDs for different plans
export const STRIPE_PRICE_IDS = {
  essential: {
    monthly: process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_ESSENTIAL_ANNUAL || '',
  },
  plus: {
    monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_PLUS_ANNUAL || '',
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL || '',
  },
}

// Webhook secret for validating webhook signatures
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

export type SubscriptionStatus = 
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'paused'
  | 'trialing'
  | 'unpaid'

export interface CreateCheckoutSessionParams {
  userId: string
  email: string
  priceId: string
  successUrl: string
  cancelUrl: string
  trialPeriodDays?: number
  metadata?: Record<string, string>
}

export async function createCheckoutSession({
  userId,
  email,
  priceId,
  successUrl,
  cancelUrl,
  trialPeriodDays,
  metadata = {},
}: CreateCheckoutSessionParams) {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: trialPeriodDays,
        metadata: {
          userId,
          ...metadata,
        },
      },
      metadata: {
        userId,
        ...metadata,
      },
    })

    return { session, error: null }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return { session: null, error: error as Error }
  }
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return { url: session.url, error: null }
  } catch (error) {
    console.error('Error creating portal session:', error)
    return { url: null, error: error as Error }
  }
}

export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return { subscription, error: null }
  } catch (error) {
    console.error('Error retrieving subscription:', error)
    return { subscription: null, error: error as Error }
  }
}

export async function cancelSubscription(subscriptionId: string, immediately = false) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: !immediately,
    })

    if (immediately) {
      await stripe.subscriptions.cancel(subscriptionId)
    }

    return { subscription, error: null }
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return { subscription: null, error: error as Error }
  }
}

export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string,
  prorationBehavior: 'create_prorations' | 'none' | 'always_invoice' = 'create_prorations'
) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: prorationBehavior,
    })

    return { subscription: updatedSubscription, error: null }
  } catch (error) {
    console.error('Error updating subscription:', error)
    return { subscription: null, error: error as Error }
  }
}

export async function createCustomer(email: string, userId: string, metadata?: Record<string, string>) {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
        ...metadata,
      },
    })

    return { customer, error: null }
  } catch (error) {
    console.error('Error creating customer:', error)
    return { customer: null, error: error as Error }
  }
}

export async function constructWebhookEvent(payload: string | Buffer, signature: string) {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_WEBHOOK_SECRET
    )
    return { event, error: null }
  } catch (error) {
    console.error('Error constructing webhook event:', error)
    return { event: null, error: error as Error }
  }
}
'use server'

/**
 * @fileMetadata
 * @purpose "Server actions for Stripe payment processing"
 * @dependencies ["@/config","@/lib","stripe","zod"]
 * @owner billing-team
 * @status stable
 */

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { PRICING_PLANS } from '@/config/pricing'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil'
})

// Input validation schemas
const CreateCheckoutSessionSchema = z.object({
  planId: z.enum(['homeowner', 'landlord', 'enterprise']),
  billingInterval: z.enum(['monthly', 'annually']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
})

const CreatePortalSessionSchema = z.object({
  returnUrl: z.string().url()
})

export async function createCheckoutSession(input: z.infer<typeof CreateCheckoutSessionSchema>) {
  try {
    const validated = CreateCheckoutSessionSchema.parse(input)
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single()

    // Get the price ID for the selected plan
    const plan = PRICING_PLANS[validated.planId]
    const priceId = validated.billingInterval === 'monthly' 
      ? plan.stripePriceId.monthly 
      : plan.stripePriceId.annually

    if (!priceId) {
      return { error: 'Invalid price configuration' }
    }

    // Create or retrieve Stripe customer
    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.full_name,
        metadata: {
          supabase_user_id: user.id
        }
      })
      customerId = customer.id

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      success_url: validated.successUrl,
      cancel_url: validated.cancelUrl,
      metadata: {
        user_id: user.id,
        plan_id: validated.planId
      },
      subscription_data: {
        trial_period_days: validated.planId === 'homeowner' ? 14 : 0,
        metadata: {
          user_id: user.id,
          plan_id: validated.planId
        }
      }
    })

    return { sessionId: session.id, url: session.url }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return { error: 'Failed to create checkout session' }
  }
}

export async function createPortalSession(input: z.infer<typeof CreatePortalSessionSchema>) {
  try {
    const validated = CreatePortalSessionSchema.parse(input)
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Get user's Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return { error: 'No active subscription found' }
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: validated.returnUrl
    })

    return { url: session.url }
  } catch (error) {
    console.error('Error creating portal session:', error)
    return { error: 'Failed to create portal session' }
  }
}

export async function getSubscriptionDetails() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_id, subscription_status, subscription_plan, subscription_current_period_end')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_subscription_id) {
      return { 
        subscription: null,
        plan: 'free'
      }
    }

    // Get subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      profile.stripe_subscription_id,
      {
        expand: ['default_payment_method', 'latest_invoice']
      }
    )

    return {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date((subscription as unknown).current_period_end * 1000),
        cancelAtPeriodEnd: (subscription as Stripe.Subscription).cancel_at_period_end,
        plan: {
          id: profile.subscription_plan,
          name: PRICING_PLANS[profile.subscription_plan]?.name || 'Unknown',
          interval: subscription.items.data[0]?.price.recurring?.interval || 'month',
          amount: subscription.items.data[0]?.price.unit_amount || 0
        },
        paymentMethod: subscription.default_payment_method ? {
          type: 'card',
          card: (subscription.default_payment_method as Stripe.PaymentMethod).card
        } : null,
        nextInvoice: subscription.latest_invoice ? {
          amount: (subscription.latest_invoice as Stripe.Invoice).amount_due,
          dueDate: new Date((subscription.latest_invoice as Stripe.Invoice).due_date! * 1000)
        } : null
      },
      plan: profile.subscription_plan || 'free'
    }
  } catch (error) {
    console.error('Error getting subscription details:', error)
    return { error: 'Failed to get subscription details' }
  }
}

export async function cancelSubscription() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Get subscription ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_subscription_id) {
      return { error: 'No active subscription found' }
    }

    // Cancel at period end
    const subscription = await stripe.subscriptions.update(
      profile.stripe_subscription_id,
      {
        cancel_at_period_end: true
      }
    )

    return { 
      success: true,
      cancelAt: new Date(subscription.cancel_at! * 1000)
    }
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return { error: 'Failed to cancel subscription' }
  }
}

export async function resumeSubscription() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Get subscription ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_subscription_id) {
      return { error: 'No subscription found' }
    }

    // Resume subscription
    const subscription = await stripe.subscriptions.update(
      profile.stripe_subscription_id,
      {
        cancel_at_period_end: false
      }
    )

    return { 
      success: true,
      status: subscription.status
    }
  } catch (error) {
    console.error('Error resuming subscription:', error)
    return { error: 'Failed to resume subscription' }
  }
}

export async function getPaymentMethods() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Get customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return { paymentMethods: [] }
    }

    // Get payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: profile.stripe_customer_id,
      type: 'card'
    })

    // Get default payment method
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id)
    const defaultPaymentMethodId = (customer as Stripe.Customer).invoice_settings?.default_payment_method

    return {
      paymentMethods: paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year
        } : null,
        isDefault: pm.id === defaultPaymentMethodId
      }))
    }
  } catch (error) {
    console.error('Error getting payment methods:', error)
    return { error: 'Failed to get payment methods' }
  }
}
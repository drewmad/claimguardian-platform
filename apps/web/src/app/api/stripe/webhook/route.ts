/**
 * @fileMetadata
 * @purpose "Stripe webhook handler for subscription events"
 * @dependencies ["@/lib","@supabase/supabase-js","next","stripe"]
 * @owner billing-team
 * @status stable
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { UserTier } from '@/lib/permissions/permission-checker'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

// Use service role for webhook processing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Helper function to map Stripe price IDs to user tiers
function mapPriceIdToTier(priceId: string): UserTier {
  // ClaimGuardian subscription plan price IDs
  const priceIdToTierMap: Record<string, UserTier> = {
    // Homeowner Essentials ($19/mo, $190/yr)
    'price_1RsjF7Qw4bp7RvuAXhAixl2J': 'essential',
    'price_1RsjFJQw4bp7RvuAOeQ2Clc8': 'essential',
    
    // Landlord Pro ($49/mo, $490/yr)
    'price_1RsjFgQw4bp7RvuAav7rp1sw': 'plus',
    'price_1RsjFoQw4bp7RvuApt5jgbup': 'plus',
    
    // Enterprise ($199/mo, $1,990/yr)
    'price_1RsjGSQw4bp7RvuANR3wjS1Z': 'pro',
    'price_1RsjHIQw4bp7RvuAqLyhtami': 'pro'
  }
  
  return priceIdToTierMap[priceId] || 'free'
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription') return

  const userId = session.metadata?.user_id
  
  if (!userId) {
    console.error('Missing user_id in checkout session metadata')
    return
  }

  // Get the subscription details to determine the tier
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
  const priceId = subscription.items.data[0]?.price.id
  const tier = mapPriceIdToTier(priceId)

  // Create or update user subscription in our user_subscriptions table
  const { error: subscriptionError } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      tier,
      status: 'active',
      stripe_subscription_id: session.subscription as string,
      stripe_price_id: priceId,
      started_at: new Date().toISOString(),
      trial_ends_at: (subscription as Stripe.Subscription).trial_end ? new Date((subscription as Stripe.Subscription).trial_end! * 1000).toISOString() : null,
      current_period_end: (subscription as unknown).current_period_end ? new Date((subscription as unknown).current_period_end * 1000).toISOString() : new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })

  if (subscriptionError) {
    console.error('Error creating/updating user subscription:', subscriptionError)
    throw subscriptionError
  }

  // Log subscription start in activity logs
  await supabase
    .from('user_activity_logs')
    .insert({
      user_id: userId,
      action_type: 'subscription_created',
      details: {
        tier,
        stripe_subscription_id: session.subscription,
        amount: session.amount_total,
        currency: session.currency,
        trial_end: subscription.trial_end
      }
    })

  console.log(`✅ Subscription created for user ${userId} with tier ${tier}`)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id
  const tier = mapPriceIdToTier(priceId)
  const currentPeriodEnd = new Date((subscription as unknown).current_period_end * 1000).toISOString()

  // Update subscription details in user_subscriptions table
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      tier,
      status: subscription.status as 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing', // Map Stripe status to our status
      stripe_price_id: priceId,
      current_period_end: currentPeriodEnd,
      trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }

  // Log the subscription update
  const userId = subscription.metadata?.user_id
  if (userId) {
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        action_type: 'subscription_updated',
        details: {
          tier,
          status: subscription.status,
          current_period_end: currentPeriodEnd
        }
      })
  }

  console.log(`✅ Subscription updated for subscription ${subscription.id} to tier ${tier}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Update subscription to cancelled status and downgrade to free tier
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      tier: 'free',
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }

  // Log cancellation
  const userId = subscription.metadata?.user_id
  if (userId) {
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        action_type: 'subscription_cancelled',
        details: {
          subscription_id: subscription.id,
          reason: subscription.cancellation_details?.reason || 'user_canceled',
          cancelled_at: new Date().toISOString()
        }
      })
  }

  console.log(`✅ Subscription cancelled for subscription ${subscription.id}, user downgraded to free tier`)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!(invoice as unknown).subscription) return

  // Get subscription details to find user
  const subscription = await stripe.subscriptions.retrieve((invoice as unknown).subscription as string)
  const userId = subscription.metadata?.user_id

  if (userId) {
    // Log successful payment
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        action_type: 'payment_succeeded',
        details: {
          invoice_id: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          subscription_id: (invoice as unknown).subscription
        }
      })

    console.log(`✅ Payment succeeded for user ${userId}, amount: ${invoice.amount_paid} ${invoice.currency}`)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!(invoice as unknown).subscription) return

  // Get subscription details to find user  
  const subscription = await stripe.subscriptions.retrieve((invoice as unknown).subscription as string)
  const userId = subscription.metadata?.user_id

  // Update subscription status to past_due
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', (invoice as unknown).subscription)

  if (error) {
    console.error('Error updating subscription status:', error)
  }

  if (userId) {
    // Log failed payment
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        action_type: 'payment_failed',
        details: {
          invoice_id: invoice.id,
          amount: invoice.amount_due,
          currency: invoice.currency,
          subscription_id: (invoice as unknown).subscription,
          failure_reason: ((invoice as unknown).charge as unknown)?.failure_message || 'Payment failed'
        }
      })

    console.log(`❌ Payment failed for user ${userId}, amount: ${invoice.amount_due} ${invoice.currency}`)
    
    // TODO: Send email notification about failed payment
    // TODO: Consider downgrading user access after multiple failures
  }
}
/**
 * @fileMetadata
 * @purpose "Stripe webhook handler for subscription events"
 * @dependencies ["@/lib","@supabase/supabase-js","next","stripe"]
 * @owner billing-team
 * @status stable
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger/production-logger";

// Initialize Stripe only if the secret key is available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-07-30.basil",
    })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

// Use service role for webhook processing (only if configured)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Map Stripe price IDs to our tiers
const PRICE_TO_TIER: Record<string, string> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_HOMEOWNER_MONTHLY || ""]: "homeowner",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_HOMEOWNER_ANNUALLY || ""]: "homeowner",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_LANDLORD_MONTHLY || ""]: "landlord",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_LANDLORD_ANNUALLY || ""]: "landlord",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY || ""]: "enterprise",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUALLY || ""]: "enterprise",
};

export async function POST(request: Request) {
  // Return early if Stripe is not configured
  if (!stripe || !supabase) {
    logger.error("Payment processing is not fully configured", {
      stripeConfigured: !!stripe,
      supabaseConfigured: !!supabase,
    });
    return NextResponse.json(
      { error: "Payment processing is not configured" },
      { status: 503 },
    );
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    logger.error("Missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const error = err as Error;
    logger.error("Webhook signature verification failed:", { error: error.message });
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Webhook processing error:", { 
      eventType: event.type, 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  if (!session.customer_email || !session.subscription) {
    return;
  }

  // Get user by email
  const { data: user } = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq("email", session.customer_email)
    .single();

  if (!user) {
    logger.error("User not found for checkout session", { email: session.customer_email });
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string,
  );

  const priceId = subscription.items.data[0]?.price.id;
  const tier = PRICE_TO_TIER[priceId] || "free";

  // Update user subscription
  const { error } = await supabase.from("user_subscriptions").upsert({
    user_id: user.user_id,
    tier,
    status: "active",
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: "user_id",
  });

  if (error) {
    logger.error("Failed to update subscription", { error, userId: user.user_id });
    return;
  }

  // Update user tier in user_profiles
  await supabase
    .from("user_profiles")
    .update({ 
      subscription_tier: tier,
      subscription_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.user_id);

  logger.info("Checkout completed", { 
    userId: user.user_id, 
    tier, 
    subscriptionId: subscription.id 
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Find user by Stripe customer ID
  const { data: userSub } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!userSub) {
    logger.warn("User subscription not found for customer", { customerId });
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier = PRICE_TO_TIER[priceId] || "free";
  const status = subscription.status === "active" ? "active" : 
                 subscription.status === "past_due" ? "past_due" :
                 subscription.status === "canceled" ? "canceled" : "inactive";

  // Update subscription record
  await supabase.from("user_subscriptions").update({
    tier,
    status,
    current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userSub.user_id);

  // Update user profile
  await supabase
    .from("user_profiles")
    .update({ 
      subscription_tier: tier,
      subscription_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userSub.user_id);

  logger.info("Subscription updated", { 
    userId: userSub.user_id, 
    tier, 
    status,
    subscriptionId: subscription.id 
  });
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Find user by Stripe customer ID
  const { data: userSub } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!userSub) {
    return;
  }

  // Update to free tier
  await supabase.from("user_subscriptions").update({
    tier: "free",
    status: "canceled",
    canceled_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("user_id", userSub.user_id);

  // Update user profile
  await supabase
    .from("user_profiles")
    .update({ 
      subscription_tier: "free",
      subscription_status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userSub.user_id);

  logger.info("Subscription canceled", { 
    userId: userSub.user_id,
    subscriptionId: subscription.id 
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!(invoice as any).subscription) return;

  const customerId = invoice.customer as string;
  
  // Find user by Stripe customer ID
  const { data: userSub } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!userSub) return;

  // Record payment
  await supabase.from("billing_history").insert({
    user_id: userSub.user_id,
    stripe_invoice_id: invoice.id,
    amount: (invoice.amount_paid || 0) / 100, // Convert from cents
    currency: invoice.currency,
    status: "succeeded",
    description: `Payment for ${invoice.lines.data[0]?.description || "subscription"}`,
    created_at: new Date().toISOString(),
  });

  logger.info("Payment succeeded", { 
    userId: userSub.user_id,
    amount: (invoice.amount_paid || 0) / 100,
    invoiceId: invoice.id 
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!(invoice as any).subscription) return;

  const customerId = invoice.customer as string;
  
  // Find user by Stripe customer ID
  const { data: userSub } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!userSub) return;

  // Update subscription status
  await supabase.from("user_subscriptions").update({
    status: "past_due",
    updated_at: new Date().toISOString(),
  }).eq("user_id", userSub.user_id);

  // Record failed payment
  await supabase.from("billing_history").insert({
    user_id: userSub.user_id,
    stripe_invoice_id: invoice.id,
    amount: (invoice.amount_due || 0) / 100,
    currency: invoice.currency,
    status: "failed",
    description: `Failed payment for ${invoice.lines.data[0]?.description || "subscription"}`,
    created_at: new Date().toISOString(),
  });

  logger.warn("Payment failed", { 
    userId: userSub.user_id,
    amount: (invoice.amount_due || 0) / 100,
    invoiceId: invoice.id 
  });

  // TODO: Send email notification about failed payment
}
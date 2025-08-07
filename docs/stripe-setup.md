# Stripe Payment Integration Setup

This guide walks you through setting up Stripe payments for ClaimGuardian.

## Prerequisites

1. A Stripe account (create one at https://stripe.com)
2. Access to your Stripe Dashboard
3. Vercel/deployment environment variables configured

## Setup Steps

### 1. Get Your API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Developers → API keys
3. Copy your keys:
   - **Publishable key**: Starts with `pk_test_` (test mode) or `pk_live_` (production)
   - **Secret key**: Starts with `sk_test_` (test mode) or `sk_live_` (production)

### 2. Create Products and Prices

Create the following products in your Stripe Dashboard:

#### Guardian Essential

1. Go to Products → Add product
2. Name: "Guardian Essential"
3. Add pricing:
   - Monthly: $29/month
   - Annual: $290/year

#### Guardian Plus (Future)

1. Name: "Guardian Plus"
2. Pricing:
   - Monthly: $49/month
   - Annual: $490/year

#### Guardian Professional (Future)

1. Name: "Guardian Professional"
2. Pricing:
   - Monthly: $99/month
   - Annual: $990/year

### 3. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Stripe Price IDs (get these from your Stripe Dashboard)
STRIPE_PRICE_ESSENTIAL_MONTHLY=price_...
STRIPE_PRICE_ESSENTIAL_ANNUAL=price_...
STRIPE_PRICE_PLUS_MONTHLY=price_...
STRIPE_PRICE_PLUS_ANNUAL=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...

# Webhook Secret (set this up in step 4)
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Set Up Webhooks

1. In Stripe Dashboard, go to Developers → Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL:
   - Local testing: Use [Stripe CLI](https://stripe.com/docs/stripe-cli) or [ngrok](https://ngrok.com)
   - Production: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the signing secret (starts with `whsec_`)

### 5. Test Locally with Stripe CLI

Install Stripe CLI:

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Or download from https://stripe.com/docs/stripe-cli
```

Forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI will show your webhook signing secret. Use this for `STRIPE_WEBHOOK_SECRET` in development.

### 6. Apply Database Migrations

Run the Stripe fields migration:

```sql
-- Run this in your Supabase SQL editor
-- File: supabase/sql/add-stripe-fields.sql
```

### 7. Configure Customer Portal

1. Go to Stripe Dashboard → Settings → Billing → Customer portal
2. Configure:
   - Allow customers to update payment methods
   - Allow customers to cancel subscriptions
   - Show invoice history
3. Save the configuration

## Testing

### Test Cards

Use these test card numbers in test mode:

- **Successful payment**: 4242 4242 4242 4242
- **Requires authentication**: 4000 0025 0000 3155
- **Declined**: 4000 0000 0000 9995

Use any future expiry date and any 3-digit CVC.

### Test Flow

1. Start your development server: `pnpm dev`
2. Start Stripe webhook forwarding (if testing webhooks)
3. Navigate to pricing page
4. Click "Go Essential"
5. Complete checkout with test card
6. Verify:
   - Redirect to success page
   - User profile updated with subscription
   - Webhook events processed

## Production Deployment

### Vercel Environment Variables

Add these secrets in Vercel Dashboard:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ESSENTIAL_MONTHLY
STRIPE_PRICE_ESSENTIAL_ANNUAL
```

### Security Checklist

- [ ] Use production API keys (not test keys)
- [ ] Webhook endpoint uses HTTPS
- [ ] Webhook signature verification enabled
- [ ] Environment variables are properly secured
- [ ] Customer portal configured with appropriate settings
- [ ] Subscription limits enforced in application code

## Common Issues

### "No such price" error

- Ensure price IDs in environment variables match your Stripe Dashboard
- Check you're using the correct mode (test vs live)

### Webhook signature verification failed

- Ensure `STRIPE_WEBHOOK_SECRET` matches your webhook endpoint secret
- Check raw body parsing in webhook route

### Subscription not updating

- Verify webhook events are being received
- Check Supabase RLS policies allow updates
- Look for errors in webhook processing logs

## Monitoring

### Stripe Dashboard

- Monitor failed payments
- Review subscription lifecycle
- Check webhook delivery status

### Application Logs

- Monitor `/api/stripe/*` routes for errors
- Check Supabase logs for database errors
- Set up alerts for payment failures

## Support

For Stripe-specific issues:

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For ClaimGuardian integration issues:

- Check application logs
- Review webhook processing
- Verify database schema matches expectations

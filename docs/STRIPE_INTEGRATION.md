# Stripe Payment Integration Guide

## Overview
ClaimGuardian uses Stripe for subscription management and payment processing. This document outlines the implementation details and usage.

## Architecture

### Components Created
1. **Pricing Page** (`/pricing`) - Public pricing display with plan comparison
2. **Billing Dashboard** (`/dashboard/billing`) - Subscription management for authenticated users
3. **Subscription Hooks** - React hooks for checking subscription status and limits
4. **Server Actions** - Secure server-side Stripe operations
5. **Webhook Handler** - Process Stripe events and update database

## Subscription Plans

### Free Plan
- 1 property
- 1 claim per year
- 50 AI requests/month
- 1 GB storage
- Community support

### Homeowner Plan ($19/mo)
- Up to 3 properties
- Unlimited claims
- 1,000 AI requests/month
- 10 GB storage
- Priority support
- 14-day free trial

### Landlord Plan ($49/mo)
- Up to 10 properties
- Unlimited claims
- 5,000 AI requests/month
- 50 GB storage
- Priority support
- Tenant portal access

### Enterprise Plan ($199/mo)
- Unlimited everything
- Dedicated support
- Custom integrations
- SLA guarantee

## Implementation Details

### Environment Variables Required
```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PRICE_HOMEOWNER_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_HOMEOWNER_ANNUALLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_LANDLORD_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_LANDLORD_ANNUALLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUALLY=price_...
```

### Database Schema Updates
The following fields were added to the `profiles` table:
- `stripe_customer_id` - Stripe customer ID
- `stripe_subscription_id` - Active subscription ID
- `subscription_status` - Current subscription status
- `subscription_plan` - Current plan (free/homeowner/landlord/enterprise)
- `subscription_current_period_end` - When current period ends
- `trial_ends_at` - Trial end date (if applicable)

### Usage Tracking
AI usage is tracked in the `ai_usage_logs` table and checked against plan limits.

## Key Features

### 1. Subscription Management
- Create checkout sessions for new subscriptions
- Manage payment methods via Stripe billing portal
- Cancel/resume subscriptions
- View billing history

### 2. Usage Limits
- Automatic tracking of AI requests
- Enforcement of plan limits
- Usage display in UI components

### 3. Subscription Gates
- `<SubscriptionGate>` component for feature gating
- `useSubscription()` hook for checking limits
- Automatic redirects to pricing page

## Usage Examples

### Check Subscription in Components
```typescript
import { useSubscription } from '@/hooks/use-subscription'

function MyComponent() {
  const subscription = useSubscription()
  
  // Check if user can use feature
  const canAnalyze = subscription.checkFeatureAccess('aiRequests', 1)
  if (!canAnalyze.allowed) {
    toast.error(canAnalyze.message)
    return
  }
  
  // Proceed with AI analysis...
}
```

### Gate Features by Plan
```typescript
import { SubscriptionGate } from '@/components/subscription/subscription-gate'

function PremiumFeature() {
  return (
    <SubscriptionGate requiredPlan="landlord">
      <TenantPortal />
    </SubscriptionGate>
  )
}
```

### Display Usage
```typescript
import { FeatureLimitBadge } from '@/components/subscription/subscription-gate'

function AITool() {
  return (
    <div>
      <h1>AI Damage Analyzer</h1>
      <FeatureLimitBadge feature="aiRequests" />
    </div>
  )
}
```

## Webhook Setup

1. Configure webhook endpoint in Stripe Dashboard:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

2. Set `STRIPE_WEBHOOK_SECRET` environment variable

## Testing

### Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### Test Flow
1. Create test account
2. Navigate to `/pricing`
3. Select a plan and click Subscribe
4. Complete Stripe checkout
5. Verify subscription in `/dashboard/billing`
6. Test feature access with subscription gates

## Security Considerations
- All payment operations use server actions
- Webhook signature verification
- Customer IDs stored securely in database
- No credit card data stored locally
- RLS policies protect payment history

## Monitoring
- Track subscription metrics in admin dashboard
- Monitor webhook failures
- Alert on payment failures
- Track conversion rates
# ClaimGuardian Payment Flow Documentation

## Overview
ClaimGuardian uses Stripe for subscription management with 4 tiers: Free, Homeowner ($19/mo), Landlord ($49/mo), and Enterprise ($199/mo).

## Architecture

### Frontend Flow
1. **Pricing Page** (`/pricing`)
   - Displays all subscription tiers
   - Highlights enterprise FEMA NIMS features
   - Annual/monthly toggle (17% discount on annual)

2. **Checkout Process**
   - User clicks "Subscribe" → `createCheckoutSession()` 
   - Redirects to Stripe hosted checkout
   - Success → Returns to `/dashboard?payment=success`
   - Cancel → Returns to `/pricing`

3. **Billing Dashboard** (`/dashboard/billing`)
   - Current subscription status
   - Usage metrics (properties, AI requests)
   - Payment methods management
   - Cancel/resume subscription
   - Billing history

### Backend Infrastructure

#### Webhook Handler (`/api/stripe/webhook`)
Processes Stripe events:
- `checkout.session.completed` → Creates subscription record
- `customer.subscription.updated` → Updates tier/status
- `customer.subscription.deleted` → Downgrades to free
- `invoice.payment_succeeded` → Records payment
- `invoice.payment_failed` → Marks as past_due

#### Database Schema
```sql
user_subscriptions
├── user_id (FK to auth.users)
├── tier (free/homeowner/landlord/enterprise)
├── status (active/past_due/canceled)
├── stripe_subscription_id
├── stripe_customer_id
├── current_period_start/end
└── cancel_at_period_end

billing_history
├── user_id (FK to auth.users)
├── stripe_invoice_id
├── amount
├── currency
├── status (succeeded/failed/pending/refunded)
└── description
```

## Tier Limits

| Feature | Free | Homeowner | Landlord | Enterprise |
|---------|------|-----------|----------|------------|
| Properties | 1 | 1 | 10 | Unlimited |
| Claims/year | 1 | Unlimited | Unlimited | Unlimited |
| AI Requests/mo | 50 | 1,000 | 5,000 | Unlimited |
| Storage | 1GB | 10GB | 50GB | Unlimited |
| Support | Community | Priority | Priority | Dedicated |
| FEMA NIMS | ❌ | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ | ✅ |

## Environment Variables

### Required in Vercel
```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Price IDs (from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PRICE_HOMEOWNER_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_HOMEOWNER_ANNUALLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_LANDLORD_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_LANDLORD_ANNUALLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUALLY=price_xxx
```

## Testing

### Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`

### Test Flow
1. Create test account at `/auth/signup`
2. Visit `/pricing`
3. Select plan and complete checkout
4. Verify subscription at `/dashboard/billing`
5. Test portal access (change payment method)
6. Test cancellation flow
7. Check webhook logs in Stripe Dashboard

## Production Checklist

- [x] Environment variables in Vercel
- [ ] Database migration applied (`supabase migration up`)
- [ ] Webhook endpoint configured in Stripe
- [ ] Products/prices created in Stripe Dashboard
- [ ] Test mode validated
- [ ] Switch to live keys when ready

## Monitoring

### Key Metrics
- Conversion rate: Pricing → Checkout → Subscription
- Churn rate by tier
- Failed payment rate
- Average revenue per user (ARPU)

### Webhook Health
Check Stripe Dashboard → Developers → Webhooks for:
- Success rate (should be >99%)
- Response time (<1s)
- Failed events (investigate immediately)

## Support Scripts

```bash
# Verify setup
./scripts/verify-stripe-setup.sh

# Apply migrations
supabase migration up

# Check subscription status (SQL)
SELECT * FROM get_user_subscription_status('user_uuid_here');
```

## Revenue Projections

Based on CLAUDE.md targets:
- Year 1: $1.4M (consumer) + $2.6M (enterprise) = $4M total
- Break-even: Month 3
- TAM: $4.6B+ combined market

## Contact

For Stripe integration issues:
- Technical: Check webhook logs first
- Billing: Create Stripe support ticket
- Product: Update pricing in `/config/pricing.ts`
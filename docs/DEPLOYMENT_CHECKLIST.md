# ClaimGuardian Deployment Checklist

## ✅ Database Migrations Applied

The following migrations have been successfully applied to production:
- ✅ `billing_history_and_subscriptions` - Payment tracking tables
- ✅ `add_stripe_customer_to_profiles` - Stripe customer ID on user profiles

## 🔧 Environment Variables to Configure

### 1. Vercel Environment Variables

Add these to your Vercel project settings:

```bash
# Stripe Configuration (Required for payments)
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Already configured locally
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFkZW5naW5lZXJpbmciLCJhIjoiY21kenV0N2tnMGg4bjJtb2lvMmx3dHFvbCJ9.ki3iDWbz2mPypnQYZoZQnw

# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=https://tmlrvecuwgppbaynesji.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHJ2ZWN1d2dwcGJheW5lc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzUwMzksImV4cCI6MjA2NDY1MTAzOX0.P69j3GyOQ9NeGXeLul_ZyhWOvuyepL9FskjYAK-CDMU
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# AI Keys (Optional but recommended)
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY
GEMINI_API_KEY=YOUR_GEMINI_KEY
```

### 2. Stripe Dashboard Configuration

1. **Get your webhook signing secret:**
   - Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
   - Click "Add endpoint"
   - URL: `https://claimguardianai.com/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the signing secret (starts with `whsec_`)

2. **Verify your products:**
   - [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
   - Should have 4 products: Free, Homeowner ($19), Landlord ($49), Enterprise ($199)

## 🚀 Deployment Steps

### Step 1: Push Latest Code
```bash
git push origin main
```

### Step 2: Verify Vercel Deployment
- Check [Vercel Dashboard](https://vercel.com)
- Ensure build succeeds
- Check deployment logs for any errors

### Step 3: Test Payment Flow
1. Go to https://claimguardianai.com/pricing
2. Click "Get Started" on Homeowner tier
3. Complete test checkout with Stripe test card: `4242 4242 4242 4242`
4. Verify:
   - Redirect to dashboard after payment
   - Subscription shows as active
   - Billing history recorded

### Step 4: Test Map Display
1. Go to https://claimguardianai.com/dashboard
2. Verify map displays with Mapbox token
3. Test map features:
   - Layer toggles
   - Style switching
   - Property search
   - Statistics display

### Step 5: Test Enhanced Map
1. Go to https://claimguardianai.com/dashboard/property-map-enhanced
2. Verify all advanced features work:
   - Risk assessment layers
   - Property overlays
   - Search functionality
   - Export data

## 📊 Monitoring

### Database Health Check
```sql
-- Check recent subscriptions
SELECT 
    u.email,
    us.tier,
    us.status,
    us.created_at
FROM user_subscriptions us
JOIN auth.users u ON u.id = us.user_id
ORDER BY us.created_at DESC
LIMIT 10;

-- Check billing history
SELECT 
    COUNT(*) as total_transactions,
    SUM(amount) / 100 as total_revenue,
    status
FROM billing_history
GROUP BY status;
```

### Stripe Webhook Monitoring
- Check [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
- Look for successful webhook deliveries
- Monitor for any failed attempts

## 🔍 Testing Checklist

### Payment System
- [ ] Test card checkout works
- [ ] Subscription creates in database
- [ ] User tier updates correctly
- [ ] Billing portal accessible
- [ ] Cancel subscription works
- [ ] Webhook events processing

### Map Features
- [ ] Map loads with token
- [ ] Properties display
- [ ] Search works
- [ ] Layers toggle
- [ ] Statistics update
- [ ] Enhanced map page works

### User Experience
- [ ] Sign up flow works
- [ ] Login works
- [ ] Dashboard loads
- [ ] Profile updates save
- [ ] Settings modal works

## 🚨 Troubleshooting

### Payment Issues
- Check Stripe webhook logs
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check Supabase logs for database errors
- Ensure RLS policies allow inserts

### Map Not Displaying
- Verify `NEXT_PUBLIC_MAPBOX_TOKEN` in Vercel
- Check browser console for errors
- Ensure token has correct scopes

### Database Connection Issues
- Check Supabase service status
- Verify service role key is correct
- Check RLS policies

## 📝 Notes

- Production URL: https://claimguardianai.com
- Supabase Project: ClaimGuardian (tmlrvecuwgppbaynesji)
- Region: us-east-2
- Database Version: PostgreSQL 17.4.1

## 🎯 Success Criteria

1. ✅ Users can sign up and log in
2. ✅ Payment flow completes successfully
3. ✅ Subscriptions are recorded in database
4. ✅ Map displays with property data
5. ✅ All dashboard features accessible
6. ✅ No console errors in production

---

Last Updated: August 7, 2025
Deployment Version: 1.0.0
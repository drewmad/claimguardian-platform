# Production Setup Instructions

## 🚀 Deployment Status

Code has been successfully pushed to production. The following manual configuration steps are required:

## 1️⃣ Vercel Dashboard Configuration

### Environment Variables to Add

Go to [Vercel Dashboard](https://vercel.com) → Your Project → Settings → Environment Variables

Add these production variables:

```bash
# Stripe Production Keys (REQUIRED)
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Mapbox (Already Added - Verify it's there)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFkZW5naW5lZXJpbmciLCJhIjoiY21kenV0N2tnMGg4bjJtb2lvMmx3dHFvbCJ9.ki3iDWbz2mPypnQYZoZQnw

# AI Keys (Optional but recommended)
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY
GEMINI_API_KEY=YOUR_GEMINI_KEY
```

## 2️⃣ Stripe Dashboard Configuration

### A. Create Webhook Endpoint

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Configure:
   - **Endpoint URL**: `https://claimguardianai.com/api/stripe/webhook`
   - **Events to listen for**:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. After creating, copy the **Signing secret** (starts with `whsec_`)
5. Add this to Vercel as `STRIPE_WEBHOOK_SECRET`

### B. Verify Products

Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)

Ensure you have these 4 products:
- **Free Tier** - $0/month
- **Homeowner Essentials** - $19/month
- **Landlord Pro** - $49/month
- **Enterprise** - $199/month

## 3️⃣ Testing the Deployment

### Test Map Display
1. Visit https://claimguardianai.com/dashboard
2. Verify the map loads with Mapbox
3. Test map controls and layers

### Test Payment Flow
1. Visit https://claimguardianai.com/pricing
2. Click "Get Started" on any paid tier
3. Use test card: `4242 4242 4242 4242`
4. Verify redirect to dashboard after payment
5. Check subscription status in account settings

### Test Enhanced Map Features
1. Visit https://claimguardianai.com/dashboard/property-map-enhanced
2. Verify:
   - Property overlays work
   - Search functionality works
   - Risk layers toggle properly
   - Statistics display correctly

## 4️⃣ Monitor Deployment

### Vercel
- Check build logs: https://vercel.com/your-team/your-project
- Monitor for any runtime errors

### Stripe
- Monitor webhook events: https://dashboard.stripe.com/webhooks
- Check for successful/failed deliveries

### Database
- Verify migrations applied successfully in Supabase
- Check user_subscriptions and billing_history tables

## 5️⃣ Quick Verification Checklist

- [ ] Vercel deployment successful
- [ ] Map displays on dashboard
- [ ] Enhanced map page works
- [ ] Pricing page loads
- [ ] Stripe checkout works (test mode)
- [ ] Webhook endpoint configured
- [ ] Environment variables set

## 📝 Notes

- The Mapbox token is already configured locally and should be added to Vercel
- Database migrations have been applied via MCP tools
- TypeScript errors have been fixed
- All packages are installed and lockfile is up to date

## 🆘 Troubleshooting

If the map doesn't display:
- Verify `NEXT_PUBLIC_MAPBOX_TOKEN` is set in Vercel
- Check browser console for errors

If payments don't work:
- Verify `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set
- Check Stripe webhook logs for failures
- Ensure products exist in Stripe dashboard

---

Last Updated: August 7, 2025
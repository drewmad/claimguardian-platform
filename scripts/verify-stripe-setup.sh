#!/bin/bash

# Stripe Setup Verification Script
# Run this to verify your Stripe integration is ready for production

echo "🔍 Verifying Stripe Setup for ClaimGuardian..."
echo "============================================"

# Check environment variables
echo ""
echo "1️⃣ Checking Environment Variables..."

check_env() {
    if [ -z "$1" ]; then
        echo "   ❌ $2 is not set"
        return 1
    else
        echo "   ✅ $2 is set"
        return 0
    fi
}

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

ALL_GOOD=true

check_env "$STRIPE_SECRET_KEY" "STRIPE_SECRET_KEY" || ALL_GOOD=false
check_env "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" || ALL_GOOD=false
check_env "$STRIPE_WEBHOOK_SECRET" "STRIPE_WEBHOOK_SECRET" || ALL_GOOD=false

# Check for price IDs
echo ""
echo "2️⃣ Checking Stripe Price IDs..."
check_env "$NEXT_PUBLIC_STRIPE_PRICE_HOMEOWNER_MONTHLY" "HOMEOWNER_MONTHLY" || ALL_GOOD=false
check_env "$NEXT_PUBLIC_STRIPE_PRICE_HOMEOWNER_ANNUALLY" "HOMEOWNER_ANNUALLY" || ALL_GOOD=false
check_env "$NEXT_PUBLIC_STRIPE_PRICE_LANDLORD_MONTHLY" "LANDLORD_MONTHLY" || echo "   ⚠️  LANDLORD_MONTHLY not set (optional)"
check_env "$NEXT_PUBLIC_STRIPE_PRICE_LANDLORD_ANNUALLY" "LANDLORD_ANNUALLY" || echo "   ⚠️  LANDLORD_ANNUALLY not set (optional)"
check_env "$NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY" "ENTERPRISE_MONTHLY" || echo "   ⚠️  ENTERPRISE_MONTHLY not set (optional)"
check_env "$NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUALLY" "ENTERPRISE_ANNUALLY" || echo "   ⚠️  ENTERPRISE_ANNUALLY not set (optional)"

# Check database tables
echo ""
echo "3️⃣ Checking Database Tables..."
echo "   Run: supabase migration up"
echo "   To apply: supabase/migrations/20250807_billing_history.sql"

# Check webhook endpoint
echo ""
echo "4️⃣ Webhook Endpoint Configuration..."
echo "   Your webhook endpoint should be:"
echo "   🔗 https://claimguardianai.com/api/stripe/webhook"
echo ""
echo "   Events to listen for:"
echo "   • checkout.session.completed"
echo "   • customer.subscription.created"
echo "   • customer.subscription.updated"
echo "   • customer.subscription.deleted"
echo "   • invoice.payment_succeeded"
echo "   • invoice.payment_failed"

# Summary
echo ""
echo "============================================"
if [ "$ALL_GOOD" = true ]; then
    echo "✅ Basic Stripe setup looks good!"
    echo ""
    echo "Next steps:"
    echo "1. Apply database migration: supabase migration up"
    echo "2. Verify webhook is configured in Stripe Dashboard"
    echo "3. Test with Stripe test mode first"
    echo "4. Use test card: 4242 4242 4242 4242"
else
    echo "⚠️  Some configuration is missing"
    echo ""
    echo "Please ensure all environment variables are set in:"
    echo "• Local: .env.local"
    echo "• Production: Vercel Dashboard → Settings → Environment Variables"
fi

echo ""
echo "📝 Test Checklist:"
echo "□ Visit /pricing page"
echo "□ Click Subscribe on a plan"
echo "□ Complete checkout with test card"
echo "□ Check /dashboard/billing shows subscription"
echo "□ Test cancel/resume subscription"
echo "□ Verify webhook logs in Stripe Dashboard"
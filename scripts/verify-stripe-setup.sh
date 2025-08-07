#!/bin/bash

# Stripe Setup Verification Script for ClaimGuardian
# This script helps verify and set up Stripe webhook endpoints

echo "🔍 ClaimGuardian Stripe Setup Verification"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${RED}❌ Stripe CLI is not installed${NC}"
    echo "Install it from: https://stripe.com/docs/stripe-cli"
    exit 1
fi

echo -e "${GREEN}✅ Stripe CLI found${NC}"

# Check if logged in
if ! stripe config --list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Stripe${NC}"
    echo "Run: stripe login"
    exit 1
fi

echo -e "${GREEN}✅ Logged in to Stripe${NC}"

# Production webhook endpoint
PROD_WEBHOOK_URL="https://claimguardianai.com/api/stripe/webhook"

echo ""
echo "📌 Webhook Endpoint Configuration"
echo "================================="
echo "Production URL: $PROD_WEBHOOK_URL"

# Check existing webhooks
echo ""
echo "📋 Existing Webhooks:"
stripe webhook_endpoints list --limit 10

echo ""
echo "🔧 To create a new webhook endpoint, run:"
echo ""
echo "stripe webhook_endpoints create \\"
echo "  --url $PROD_WEBHOOK_URL \\"
echo "  --enabled-events checkout.session.completed \\"
echo "  --enabled-events customer.subscription.created \\"
echo "  --enabled-events customer.subscription.updated \\"
echo "  --enabled-events customer.subscription.deleted \\"
echo "  --enabled-events invoice.payment_succeeded \\"
echo "  --enabled-events invoice.payment_failed"

echo ""
echo "🔑 After creating, add the webhook secret to Vercel:"
echo "1. Copy the webhook secret (whsec_...)"
echo "2. Go to Vercel Dashboard → Settings → Environment Variables"
echo "3. Add STRIPE_WEBHOOK_SECRET with the value"

echo ""
echo "📦 Required Environment Variables:"
echo "- STRIPE_SECRET_KEY (starts with sk_)"
echo "- STRIPE_PUBLISHABLE_KEY (starts with pk_)"
echo "- STRIPE_WEBHOOK_SECRET (starts with whsec_)"

echo ""
echo "🧪 For local testing, use:"
echo "stripe listen --forward-to localhost:3000/api/stripe/webhook"

echo ""
echo "📚 Stripe Products Configuration:"
echo "================================="

# List products
echo "Current Products:"
stripe products list --limit 10

echo ""
echo "💳 To create subscription products:"
echo ""
echo "# Homeowner Essentials ($19/month)"
echo "stripe products create \\"
echo "  --name \"ClaimGuardian Homeowner Essentials\" \\"
echo "  --description \"Essential tools for Florida homeowners\""
echo ""
echo "stripe prices create \\"
echo "  --product PRODUCT_ID \\"
echo "  --unit-amount 1900 \\"
echo "  --currency usd \\"
echo "  --recurring[interval]=month"

echo ""
echo "# Landlord Pro ($49/month)"
echo "stripe products create \\"
echo "  --name \"ClaimGuardian Landlord Pro\" \\"
echo "  --description \"Multi-property management and claim tools\""
echo ""
echo "stripe prices create \\"
echo "  --product PRODUCT_ID \\"
echo "  --unit-amount 4900 \\"
echo "  --currency usd \\"
echo "  --recurring[interval]=month"

echo ""
echo "# Enterprise ($199/month)"
echo "stripe products create \\"
echo "  --name \"ClaimGuardian Enterprise\" \\"
echo "  --description \"Full platform access with priority support\""
echo ""
echo "stripe prices create \\"
echo "  --product PRODUCT_ID \\"
echo "  --unit-amount 19900 \\"
echo "  --currency usd \\"
echo "  --recurring[interval]=month"

echo ""
echo "✅ Setup verification complete!"
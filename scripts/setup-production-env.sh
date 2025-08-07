#!/bin/bash

# Script to help configure production environment variables in Vercel
# This generates the commands to set environment variables

echo "========================================="
echo "Production Environment Setup for Vercel"
echo "========================================="
echo ""
echo "Once your deployment is complete, run these commands:"
echo ""
echo "# 1. Install Vercel CLI if not already installed:"
echo "npm i -g vercel"
echo ""
echo "# 2. Link your project:"
echo "vercel link"
echo ""
echo "# 3. Set required environment variables:"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    # Extract values from .env.local
    SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d '=' -f2)
    SUPABASE_ANON_KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local | cut -d '=' -f2)
    SUPABASE_SERVICE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY" .env.local | cut -d '=' -f2)

    echo "# Required Supabase variables:"
    echo "vercel env add NEXT_PUBLIC_SUPABASE_URL production"
    echo "# Value: $SUPABASE_URL"
    echo ""
    echo "vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production"
    echo "# Value: [Copy from .env.local]"
    echo ""
    echo "vercel env add SUPABASE_SERVICE_ROLE_KEY production"
    echo "# Value: [Copy from .env.local - keep secret!]"
    echo ""
else
    echo "# Warning: .env.local not found. You'll need to add these manually:"
    echo "vercel env add NEXT_PUBLIC_SUPABASE_URL production"
    echo "vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production"
    echo "vercel env add SUPABASE_SERVICE_ROLE_KEY production"
    echo ""
fi

echo "# 4. Set AI API keys (optional but recommended):"
echo "vercel env add GEMINI_API_KEY production"
echo "vercel env add OPENAI_API_KEY production"
echo ""
echo "# 5. Set optional variables:"
echo "vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production"
echo "vercel env add NEXT_PUBLIC_APP_URL production"
echo "# Value: https://claimguardian.vercel.app"
echo ""
echo "========================================="
echo "Alternative: Use Vercel Dashboard"
echo "========================================="
echo ""
echo "1. Go to: https://vercel.com/dashboard"
echo "2. Select your ClaimGuardian project"
echo "3. Go to Settings > Environment Variables"
echo "4. Add each variable listed above"
echo ""
echo "========================================="
echo "Post-Configuration Steps"
echo "========================================="
echo ""
echo "1. Update Supabase allowed redirect URLs:"
echo "   - Add: https://claimguardian.vercel.app/auth/callback"
echo "   - Add: https://claimguardian.vercel.app/auth/verify"
echo "   - Add: https://claimguardian.vercel.app/auth/reset-password"
echo ""
echo "2. Test critical features:"
echo "   - Sign up flow"
echo "   - Login flow"
echo "   - AI tools (if API keys configured)"
echo ""
echo "3. Monitor deployment:"
echo "   - Check Vercel logs for errors"
echo "   - Verify Supabase connection"
echo ""

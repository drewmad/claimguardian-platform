#!/bin/bash

# Setup Google Maps API for ClaimGuardian
# This script helps configure Google Maps API key for both local and production environments

set -e

echo "🗺️  ClaimGuardian Google Maps API Setup"
echo "======================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps/web" ]; then
    echo "❌ Error: Please run this script from the ClaimGuardian root directory"
    exit 1
fi

# Check if .env.local exists
ENV_FILE="apps/web/.env.local"
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Creating .env.local file..."
    cp apps/web/.env.example "$ENV_FILE"
fi

# Check if Google Maps API key is already set
if grep -q "^NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=.*[a-zA-Z0-9]" "$ENV_FILE" 2>/dev/null; then
    echo "✅ Google Maps API key is already configured in .env.local"
    echo ""
    echo "Current configuration:"
    grep "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" "$ENV_FILE" | sed 's/=.*/=***HIDDEN***/'
    echo ""
    read -p "Do you want to update it? (y/N): " UPDATE_KEY
    if [ "$UPDATE_KEY" != "y" ] && [ "$UPDATE_KEY" != "Y" ]; then
        SKIP_LOCAL=true
    fi
fi

if [ "$SKIP_LOCAL" != "true" ]; then
    echo ""
    echo "📋 To get your Google Maps API key:"
    echo "1. Go to https://console.cloud.google.com/"
    echo "2. Create a new project or select existing"
    echo "3. Enable these APIs:"
    echo "   - Maps JavaScript API"
    echo "   - Places API"
    echo "   - Geocoding API"
    echo "4. Create credentials (API Key)"
    echo "5. Restrict the key to your domains"
    echo ""
    echo "Enter your Google Maps API key (or press Enter to skip):"
    read -s GOOGLE_MAPS_KEY
    echo ""

    if [ -n "$GOOGLE_MAPS_KEY" ]; then
        # Update or add the key to .env.local
        if grep -q "^NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=" "$ENV_FILE"; then
            # Key exists, update it
            sed -i.bak "s/^NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=.*/NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_KEY/" "$ENV_FILE"
            rm "${ENV_FILE}.bak"
        else
            # Key doesn't exist, add it
            echo "" >> "$ENV_FILE"
            echo "# Google Maps API" >> "$ENV_FILE"
            echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_KEY" >> "$ENV_FILE"
        fi
        echo "✅ Local environment updated!"
    else
        echo "⏭️  Skipping local configuration"
    fi
fi

echo ""
echo "🚀 Configuring Vercel Production Environment"
echo "============================================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not installed. Install it with: npm i -g vercel"
    echo ""
    echo "To manually add to Vercel:"
    echo "1. Go to https://vercel.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to Settings → Environment Variables"
    echo "4. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY with your API key"
    echo "5. Select Production and Preview environments"
    echo ""
else
    echo "Do you want to add the Google Maps API key to Vercel? (y/N):"
    read ADD_TO_VERCEL

    if [ "$ADD_TO_VERCEL" = "y" ] || [ "$ADD_TO_VERCEL" = "Y" ]; then
        if [ -z "$GOOGLE_MAPS_KEY" ]; then
            echo "Enter your Google Maps API key:"
            read -s GOOGLE_MAPS_KEY
            echo ""
        fi

        if [ -n "$GOOGLE_MAPS_KEY" ]; then
            echo "Adding to Vercel..."
            echo "$GOOGLE_MAPS_KEY" | vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production
            echo "$GOOGLE_MAPS_KEY" | vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY preview
            echo "✅ Vercel environment variables updated!"
            echo ""
            echo "⚠️  Note: You need to redeploy for changes to take effect:"
            echo "   vercel --prod"
        fi
    fi
fi

echo ""
echo "📝 Summary"
echo "========="
echo ""

# Check local configuration
if grep -q "^NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=.*[a-zA-Z0-9]" "$ENV_FILE" 2>/dev/null; then
    echo "✅ Local: Configured"
else
    echo "❌ Local: Not configured"
fi

# Check Vercel configuration
if command -v vercel &> /dev/null; then
    if vercel env ls 2>/dev/null | grep -q "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"; then
        echo "✅ Vercel: Configured"
    else
        echo "❌ Vercel: Not configured"
    fi
else
    echo "⚠️  Vercel: Cannot check (CLI not installed)"
fi

echo ""
echo "🎯 Next Steps:"
echo "============="
echo ""
echo "1. If you just updated .env.local, restart your dev server:"
echo "   pnpm dev"
echo ""
echo "2. Test the address autocomplete at:"
echo "   http://localhost:3000/dashboard/properties"
echo "   Click 'Add Property' and start typing an address"
echo ""
echo "3. If it's still not working, check:"
echo "   - Browser console for errors"
echo "   - That all 3 APIs are enabled in Google Cloud Console"
echo "   - That your API key has proper restrictions"
echo ""
echo "For detailed instructions, see: docs/GOOGLE_MAPS_SETUP.md"
echo ""
echo "✨ Setup complete!"

#!/bin/bash

# Test the scraper locally before deploying to Digital Ocean

echo "🧪 Testing ClaimGuardian Property Scraper Locally"
echo "================================================"

# Check if .env.local exists for testing
if [ -f "../.env.local" ]; then
    echo "📋 Loading environment from .env.local..."
    export $(cat ../.env.local | grep -E '^(SUPABASE_|NEXT_PUBLIC_SUPABASE_)' | xargs)
fi

# Validate environment
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY not set"
    echo "Please set it in .env.local or export it manually"
    exit 1
fi

# Set test configuration
export BATCH_SIZE=10
export MAX_RETRIES=1
export SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-$SUPABASE_URL}

echo "🔧 Configuration:"
echo "  SUPABASE_URL: $SUPABASE_URL"
echo "  BATCH_SIZE: $BATCH_SIZE (reduced for testing)"
echo "  MAX_RETRIES: $MAX_RETRIES"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run health check
echo "🏥 Running health check..."
npm run health

# Run scraper test
echo "🚀 Starting test scrape (limited to 10 records per county)..."
npm test

echo ""
echo "✅ Test complete! Check the output above for any errors."
echo "📊 To verify data was inserted, run:"
echo "   psql $SUPABASE_URL -c 'SELECT source, COUNT(*) FROM external_raw_fl.property_data GROUP BY source;'"
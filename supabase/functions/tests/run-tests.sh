#!/bin/bash

# ML Pipeline Integration Test Runner
# This script runs integration tests for the ML operations infrastructure

set -e

echo "🧪 Starting ML Pipeline Integration Tests..."
echo "================================================"

# Check if Supabase is running locally
if ! supabase status &>/dev/null; then
    echo "⚠️  Warning: Supabase is not running locally. Tests will run against production."
    echo "   To test locally, run: supabase start"
    echo ""
fi

# Export environment variables for tests
export SUPABASE_URL=${SUPABASE_URL:-"https://tmlrvecuwgppbaynesji.supabase.co"}
export SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
export SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# Check if environment variables are set
if [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Required environment variables are not set."
    echo "   Please ensure NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are set."
    exit 1
fi

# Run the integration tests
echo "🔄 Running ML Pipeline Integration Tests..."
echo ""

deno test \
    --allow-net \
    --allow-env \
    --allow-read \
    ./ml-pipeline-integration.test.ts

echo ""
echo "✅ ML Pipeline Integration Tests Complete!"
echo ""

# Optional: Run specific test suites
if [ "$1" == "--detailed" ]; then
    echo "📊 Running Detailed Test Reports..."
    
    # ML Model Management Tests
    echo "Testing ML Model Management..."
    deno test --allow-all --filter="ML Model Management" ./ml-pipeline-integration.test.ts
    
    # Federated Learning Tests
    echo "Testing Federated Learning..."
    deno test --allow-all --filter="Federated Learning" ./ml-pipeline-integration.test.ts
    
    # Spatial AI Tests
    echo "Testing Spatial AI..."
    deno test --allow-all --filter="Spatial AI" ./ml-pipeline-integration.test.ts
    
    # Database Schema Tests
    echo "Testing Database Schema..."
    deno test --allow-all --filter="Database" ./ml-pipeline-integration.test.ts
fi

echo "================================================"
echo "🎉 All tests completed!"
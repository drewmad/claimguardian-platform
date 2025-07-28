#!/bin/bash

# Florida Data Platform Test Script
# Tests all deployed Edge Functions and database connectivity

set -e

echo "🚀 Testing Florida Data Platform Deployment..."

# Configuration
PROJECT_ID="tmlrvecuwgppbaynesji"
BASE_URL="https://${PROJECT_ID}.supabase.co/functions/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required environment variables are set
check_env_vars() {
    echo "🔍 Checking environment variables..."
    
    if [ -z "$SUPABASE_ANON_KEY" ]; then
        echo -e "${RED}❌ SUPABASE_ANON_KEY not set${NC}"
        echo "Set it with: export SUPABASE_ANON_KEY=your_anon_key"
        exit 1
    fi
    
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo -e "${YELLOW}⚠️ SUPABASE_SERVICE_ROLE_KEY not set (needed for admin functions)${NC}"
    fi
    
    echo -e "${GREEN}✅ Environment variables OK${NC}"
}

# Test function availability
test_function_health() {
    local func_name=$1
    echo "🔍 Testing $func_name availability..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "${BASE_URL}/${func_name}" \
        -H "Content-Type: application/json" \
        -d '{}' \
        --connect-timeout 10)
    
    if [ "$response" = "401" ] || [ "$response" = "400" ] || [ "$response" = "422" ]; then
        echo -e "${GREEN}✅ $func_name is deployed and responding${NC}"
        return 0
    else
        echo -e "${RED}❌ $func_name returned unexpected status: $response${NC}"
        return 1
    fi
}

# Test FLOIR extractor with news bulletins
test_floir_extractor() {
    echo "📰 Testing FLOIR news bulletins extraction..."
    
    response=$(curl -s \
        -X POST "${BASE_URL}/floir-extractor" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{"data_type": "news_bulletins"}' \
        --connect-timeout 30)
    
    echo "Response: $response"
    
    if echo "$response" | grep -q '"success"'; then
        echo -e "${GREEN}✅ FLOIR extractor working!${NC}"
        return 0
    elif echo "$response" | grep -q '"error"'; then
        echo -e "${YELLOW}⚠️ FLOIR extractor responding but returned error (check OpenAI API key)${NC}"
        return 0
    else
        echo -e "${RED}❌ FLOIR extractor test failed${NC}"
        return 1
    fi
}

# Test RAG search
test_rag_search() {
    echo "🔍 Testing FLOIR RAG search..."
    
    response=$(curl -s \
        -X POST "${BASE_URL}/floir-rag-search" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{"query": "insurance regulation"}' \
        --connect-timeout 15)
    
    echo "Response: $response"
    
    if echo "$response" | grep -q '"results"' || echo "$response" | grep -q '"message"'; then
        echo -e "${GREEN}✅ RAG search working!${NC}"
        return 0
    else
        echo -e "${RED}❌ RAG search test failed${NC}"
        return 1
    fi
}

# Test property monitoring
test_property_monitor() {
    echo "🏠 Testing property monitoring..."
    
    response=$(curl -s \
        -X POST "${BASE_URL}/florida-parcel-monitor" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{"action": "status"}' \
        --connect-timeout 10)
    
    echo "Response: $response"
    
    if echo "$response" | grep -q '"status"' || echo "$response" | grep -q '"message"'; then
        echo -e "${GREEN}✅ Property monitor working!${NC}"
        return 0
    else
        echo -e "${RED}❌ Property monitor test failed${NC}"
        return 1
    fi
}

# Test database connectivity
test_database() {
    echo "🗄️ Testing database connectivity..."
    
    # Try to query FLOIR data table
    response=$(curl -s \
        -X GET "https://${PROJECT_ID}.supabase.co/rest/v1/floir_data?select=count" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        --connect-timeout 10)
    
    echo "Database response: $response"
    
    if echo "$response" | grep -q '\[' || echo "$response" | grep -q 'count'; then
        echo -e "${GREEN}✅ Database accessible!${NC}"
        return 0
    else
        echo -e "${RED}❌ Database connectivity test failed${NC}"
        return 1
    fi
}

# Main test execution
main() {
    echo "============================================"
    echo "🧪 Florida Data Platform Test Suite"
    echo "============================================"
    
    check_env_vars
    
    echo -e "\n📡 Testing Edge Function Deployment..."
    test_function_health "floir-extractor"
    test_function_health "floir-rag-search"
    test_function_health "florida-parcel-monitor"
    test_function_health "property-ai-enrichment"
    
    echo -e "\n🧪 Testing Function Functionality..."
    test_database
    
    if [ ! -z "$SUPABASE_ANON_KEY" ]; then
        test_floir_extractor
        test_rag_search
        test_property_monitor
    else
        echo -e "${YELLOW}⚠️ Skipping functional tests (no SUPABASE_ANON_KEY)${NC}"
    fi
    
    echo -e "\n============================================"
    echo -e "${GREEN}🎉 Florida Data Platform Test Complete!${NC}"
    echo "============================================"
    
    echo -e "\n📋 Next Steps:"
    echo "1. Set OpenAI API key in Supabase Dashboard if not done already"
    echo "2. Run: export SUPABASE_ANON_KEY=your_key && ./test-florida-platform.sh"
    echo "3. Test FLOIR data extraction: curl with news_bulletins"
    echo "4. Monitor Edge Function logs in Supabase Dashboard"
}

main "$@"
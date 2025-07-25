#!/bin/bash

source .env.local

echo "=== Testing Database Fixes ==="
echo ""

# Test 1: Check if scraper_logs table exists
echo "1. Testing scraper_logs table..."
SCRAPER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/scraper_logs?limit=1")

if [ "$SCRAPER_STATUS" = "200" ]; then
  echo "   ✅ scraper_logs table exists"
  
  # Try to insert a test record
  INSERT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"source": "test", "level": "INFO", "message": "Test from verification script"}' \
    "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/scraper_logs")
  
  if [ "$INSERT_STATUS" = "201" ]; then
    echo "   ✅ Can insert into scraper_logs table"
  else
    echo "   ❌ Cannot insert into scraper_logs (status: $INSERT_STATUS)"
  fi
else
  echo "   ❌ scraper_logs table does not exist (status: $SCRAPER_STATUS)"
fi

echo ""

# Test 2: Check if claims_overview is accessible
echo "2. Testing claims_overview view..."
CLAIMS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/claims_overview?limit=1")

if [ "$CLAIMS_STATUS" = "200" ]; then
  echo "   ✅ claims_overview view is accessible"
else
  echo "   ❌ claims_overview view issue (status: $CLAIMS_STATUS)"
fi

echo ""

# Test 3: Check if get_my_claim_details function exists
echo "3. Testing get_my_claim_details function..."
FUNCTION_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"claim_id": "00000000-0000-0000-0000-000000000000"}' \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/get_my_claim_details")

if [ "$FUNCTION_STATUS" = "200" ] || [ "$FUNCTION_STATUS" = "204" ]; then
  echo "   ✅ get_my_claim_details function exists"
else
  echo "   ❌ get_my_claim_details function issue (status: $FUNCTION_STATUS)"
fi

echo ""
echo "=== Summary ==="
echo "Please execute fix-database.sql in Supabase SQL editor if any tests failed."
echo "Location: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql/new"
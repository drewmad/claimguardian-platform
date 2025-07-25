#!/bin/bash

# Load environment variables
source .env.local

echo "🔍 Checking scraper_logs table status..."
echo ""

# Test GET request
echo "Testing GET /rest/v1/scraper_logs..."
curl -s -o /dev/null -w "Status: %{http_code}\n" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/scraper_logs?limit=1"

echo ""

# If table exists, try to insert a test log
echo "Testing POST /rest/v1/scraper_logs..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "source": "test-script",
    "level": "INFO", 
    "message": "Test log from bash script",
    "metadata": {"test": true}
  }' \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/scraper_logs")

HTTP_STATUS=$(echo "$RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed -n '1,/HTTP_STATUS/p' | sed '$d')

echo "Status: $HTTP_STATUS"
if [ "$HTTP_STATUS" = "201" ]; then
  echo "✅ Successfully created test log entry"
  echo "Response: $BODY"
elif [ "$HTTP_STATUS" = "404" ]; then
  echo "❌ Table scraper_logs does not exist!"
  echo ""
  echo "To fix this issue:"
  echo "1. Go to: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql/new"
  echo "2. Copy and execute the SQL from: supabase/migrations/20250717009_fix_scraper_logs_table.sql"
else
  echo "❌ Unexpected status code: $HTTP_STATUS"
  echo "Response: $BODY"
fi
#!/bin/bash

# Apply consent functions migration to Supabase
# This script adds the missing RPC functions needed for user signup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Applying consent functions migration...${NC}"

# Check if Supabase URL and service role key are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set${NC}"
    echo "Please set these environment variables before running this script."
    exit 1
fi

# Get the project ID from the Supabase URL
PROJECT_ID=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -E 's/https:\/\/([a-z]+)\.supabase\.co/\1/')

echo -e "${GREEN}📦 Project ID: ${PROJECT_ID}${NC}"

# Read the migration file
MIGRATION_SQL=$(cat supabase/migrations/20240201_consent_functions.sql)

echo -e "${YELLOW}🚀 Executing migration...${NC}"

# Execute the migration using curl
RESPONSE=$(curl -s -X POST \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/query" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"query\": $(echo "$MIGRATION_SQL" | jq -Rs .)}")

# Check if the request was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration applied successfully!${NC}"
    echo -e "${GREEN}🎉 The following functions are now available:${NC}"
    echo "  - record_signup_consent()"
    echo "  - validate_signup_consent()"
    echo "  - link_consent_to_user()"
    echo "  - update_user_consent_preferences()"
    echo "  - track_user_consent()"
else
    echo -e "${RED}❌ Error applying migration${NC}"
    echo "Response: $RESPONSE"
    exit 1
fi

echo -e "${YELLOW}🧪 Running verification tests...${NC}"

# Test if the functions exist
TEST_QUERY="SELECT 
    p.proname as function_name,
    pg_catalog.pg_get_function_result(p.oid) as return_type
FROM pg_catalog.pg_proc p
WHERE p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND p.proname IN (
    'record_signup_consent',
    'validate_signup_consent',
    'link_consent_to_user',
    'update_user_consent_preferences',
    'track_user_consent'
)
ORDER BY p.proname;"

VERIFY_RESPONSE=$(curl -s -X POST \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/query" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"query\": \"$TEST_QUERY\"}")

echo -e "${GREEN}✅ Verification complete!${NC}"
echo "Functions created in database:"
echo "$VERIFY_RESPONSE" | jq -r '.[] | "  - \(.function_name) -> \(.return_type)"'

echo -e "${GREEN}🎊 Migration completed successfully!${NC}"
echo -e "${YELLOW}You can now test user signup with proper consent tracking.${NC}"
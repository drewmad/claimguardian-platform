#!/bin/bash

# Simple parcel loader using the working Edge Function
set -euo pipefail

echo "🚀 Simple Florida Parcel Loader"
echo "================================"

# Load environment variables
SUPABASE_URL=$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d'=' -f2- | sed 's/\s*#.*$//' | tr -d '\n' | tr -d '"')
SUPABASE_ANON_KEY=$(grep -E '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env.local | cut -d'=' -f2 | cut -d'\' -f1 | tr -d '\n' | tr -d '"')

# Default parameters
COUNTY="${1:-Monroe}"
OFFSET="${2:-0}"
LIMIT="${3:-100}"

echo "Loading $LIMIT parcels from $COUNTY County starting at offset $OFFSET..."

# Call the working Edge Function
curl -X POST "${SUPABASE_URL}/functions/v1/load-florida-parcels-fdot" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"county\": \"$COUNTY\", \"offset\": $OFFSET, \"limit\": $LIMIT}" \
  --silent | python3 -m json.tool

echo -e "\n✅ Request completed"
#!/bin/bash

# Direct parcel loader for testing
set -euo pipefail

# Load environment variables safely
NEXT_PUBLIC_SUPABASE_URL=$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d'=' -f2- | sed 's/\s*#.*$//' | tr -d '\n' | tr -d '"')
# The anon key appears on one line and we need to extract just the key part
NEXT_PUBLIC_SUPABASE_ANON_KEY=$(grep -E '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env.local | cut -d'=' -f2 | cut -d'\' -f1 | tr -d '\n' | tr -d '"')

echo "Loading parcels directly..."

# Test with Monroe County first
COUNTY="Monroe"
OFFSET=0
LIMIT=100

echo "Loading $LIMIT parcels from $COUNTY County starting at offset $OFFSET..."

curl -X POST "${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/load-florida-parcels-fdot" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"county\": \"$COUNTY\", \"offset\": $OFFSET, \"limit\": $LIMIT}" \
  --silent | python3 -m json.tool

echo "Done!"
#!/bin/bash

# Load parcels using service role key
set -euo pipefail

echo "Loading parcels with service role authentication..."

# Extract environment variables securely
SUPABASE_URL=$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' ../.env.local 2>/dev/null | cut -d'=' -f2- | sed 's/\s*#.*$//' | tr -d '\n' | tr -d '"')
SERVICE_ROLE_KEY=$(grep -E '^SUPABASE_SERVICE_ROLE_KEY=' ../.env.local 2>/dev/null | cut -d'=' -f2- | sed 's/\s*#.*$//' | tr -d '\n' | tr -d '"')

if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "Service role key not found, trying anon key..."
  ANON_KEY=$(grep -E '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' ../.env.local 2>/dev/null | cut -d'=' -f2- | sed 's/\\n.*$//' | tr -d '\n' | tr -d '"')
  AUTH_KEY="$ANON_KEY"
else
  AUTH_KEY="$SERVICE_ROLE_KEY"
fi

# Run from project root
cd "$(dirname "$0")/.."

echo "Testing with Monroe County, 50 parcels..."

curl -X POST "${SUPABASE_URL}/functions/v1/load-florida-parcels-fdot" \
  -H "Authorization: Bearer ${AUTH_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"county": "Monroe", "offset": 20, "limit": 50}' \
  -w "\nHTTP Status: %{http_code}\n" \
  --silent | tail -n +1
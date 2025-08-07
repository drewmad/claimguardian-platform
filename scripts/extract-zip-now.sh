#!/bin/bash

# Extract the ZIP file in Supabase Storage
set -euo pipefail

echo "Extracting Cadastral_Statewide.zip..."

curl -X POST \
  https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/florida-parcels-zip-extractor \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHJ2ZWN1d2dwcGJheW5lc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzUwMzksImV4cCI6MjA2NDY1MTAzOX0.P69j3GyOQ9NeGXeLul_ZyhWOvuyepL9FskjYAK-CDMU" \
  -H "Content-Type: application/json" \
  -d '{"action": "extract"}' | jq '.'

echo "Done!"

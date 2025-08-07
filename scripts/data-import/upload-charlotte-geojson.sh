#!/bin/bash

# Upload Charlotte County GeoJSON to Supabase Storage
set -euo pipefail

echo "Uploading Charlotte County GeoJSON to Storage..."

# Use curl to upload directly to Supabase Storage
curl -X POST \
  "https://tmlrvecuwgppbaynesji.supabase.co/storage/v1/object/parcels/geojson/charlotte_county.geojson" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHJ2ZWN1d2dwcGJheW5lc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzUwMzksImV4cCI6MjA2NDY1MTAzOX0.P69j3GyOQ9NeGXeLul_ZyhWOvuyepL9FskjYAK-CDMU" \
  -H "Content-Type: application/json" \
  -H "x-upsert: true" \
  --data-binary "@/Users/madengineering/ClaimGuardian/data/florida/charlotte_parcels_2024.geojson" \
  --progress-bar | cat

echo ""
echo "Upload complete!"
echo "Storage path: parcels/geojson/charlotte_county.geojson"

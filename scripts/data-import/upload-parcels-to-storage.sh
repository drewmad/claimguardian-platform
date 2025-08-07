#\!/bin/bash
# Upload parcels CSV to Supabase Storage and then process via Edge Function
set -euo pipefail

SUPABASE_URL="https://tmlrvecuwgppbaynesji.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHJ2ZWN1d2dwcGJheW5lc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzUwMzksImV4cCI6MjA2NDY1MTAzOX0.P69j3GyOQ9NeGXeLul_ZyhWOvuyepL9FskjYAK-CDMU"
CSV_FILE="/tmp/charlotte_parcels.csv"

echo "Uploading Charlotte County CSV to Storage..."

# Upload to Storage
curl -X POST \
  "${SUPABASE_URL}/storage/v1/object/parcels/counties/charlotte_18.csv" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: text/csv" \
  -H "x-upsert: true" \
  --data-binary "@${CSV_FILE}" \
  --progress-bar

echo ""
echo "✓ Upload complete\!"
echo ""
echo "Now processing with Edge Function..."

# Call the processor Edge Function
curl -X POST \
  "${SUPABASE_URL}/functions/v1/florida-parcels-processor" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "countyCode": 18,
    "batchSize": 500,
    "storagePath": "counties/charlotte_18.csv"
  }'

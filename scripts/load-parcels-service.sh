#\!/bin/bash
# Load parcels using service account

SERVICE_URL="https://tmlrvecuwgppbaynesji.supabase.co"
# Get service key from environment or use default
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHJ2ZWN1d2dwcGJheW5lc2ppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzU0MTQzOSwiZXhwIjoyMDMzMTE3NDM5fQ._QLDwkVhXJpPZFPgY3nQvQ-VxUOZ7O7hUNLSCDNhSxk}"

echo "Testing with 100 rows first..."

# Extract 100 rows with key columns
head -101 /Users/madengineering/ClaimGuardian/data/florida/charlotte_chunks/charlotte_part_aa.csv | tail -100 > /tmp/test_batch.csv

# Convert to JSON format
echo "Converting to JSON..."
python3 -c "
import csv
import json

rows = []
with open('/tmp/test_batch.csv', 'r') as f:
    reader = csv.DictReader(open('/Users/madengineering/ClaimGuardian/data/florida/charlotte_chunks/charlotte_part_aa.csv'))
    for i, row in enumerate(reader):
        if i >= 100:
            break
        rows.append({
            'co_no': int(row.get('CO_NO', 18)),
            'parcel_id': row.get('PARCEL_ID'),
            'own_name': row.get('OWN_NAME', '').strip() or 'UNKNOWN',
            'phy_addr1': row.get('PHY_ADDR1', '').strip() or None,
            'phy_city': row.get('PHY_CITY', '').strip() or None,
            'lnd_val': float(row.get('LND_VAL', 0)) if row.get('LND_VAL') else None
        })

with open('/tmp/test_batch.json', 'w') as f:
    json.dump(rows, f)
"

echo "Uploading batch..."
curl -X POST \
  "$SERVICE_URL/rest/v1/florida_parcels" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d @/tmp/test_batch.json

echo ""
echo "Check results at: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/editor/florida_parcels"

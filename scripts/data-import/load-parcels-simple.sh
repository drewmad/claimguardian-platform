#\!/bin/bash
# Simple parcel loader for Charlotte County
set -euo pipefail

echo "Converting Charlotte County to CSV..."
ogr2ogr -f CSV \
  /tmp/charlotte_parcels.csv \
  "/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb" \
  CADASTRAL_DOR \
  -where "CO_NO = 18" \
  -progress

echo "CSV created. Size: $(du -h /tmp/charlotte_parcels.csv | cut -f1)"
echo "Upload this file to Supabase Table Editor:"
echo "https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/editor/florida_parcels"

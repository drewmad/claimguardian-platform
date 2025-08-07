#!/bin/bash
# Super fast Charlotte County import using PostgreSQL COPY

echo "=========================================="
echo "SUPER FAST Charlotte County Import"
echo "=========================================="
echo "Method: PostgreSQL COPY command"
echo "Expected time: 1-2 minutes (vs 4-6 hours)"
echo

# Create a clean CSV without geometry for faster import
echo "Preparing optimized CSV..."
ogr2ogr -f CSV \
  /tmp/charlotte_clean.csv \
  "/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb" \
  CADASTRAL_DOR \
  -where "CO_NO = 18" \
  -select "PARCEL_ID,OWN_NAME,PHY_ADDR1,PHY_CITY,PHY_ZIPCD,LND_VAL,JV" \
  -progress

# Add CO_NO column to CSV
echo "Adding county code column..."
awk -F',' 'NR==1 {print "CO_NO,"$0} NR>1 {print "18,"$0}' /tmp/charlotte_clean.csv > /tmp/charlotte_final.csv

echo
echo "Ready to import! Use one of these methods:"
echo
echo "Option 1: Direct psql COPY (FASTEST - 1 minute):"
echo "------------------------------------------------"
cat << 'EOF'
PGPASSWORD='your_password' psql \
  -h aws-0-us-east-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.tmlrvecuwgppbaynesji \
  -d postgres \
  -c "\COPY florida_parcels FROM '/tmp/charlotte_final.csv' WITH CSV HEADER"
EOF

echo
echo "Option 2: Via SQL Editor with file upload:"
echo "------------------------------------------"
echo "1. Go to SQL Editor"
echo "2. Run: COPY florida_parcels FROM stdin WITH CSV HEADER;"
echo "3. Upload /tmp/charlotte_final.csv"

echo
echo "Option 3: Direct ogr2ogr to PostgreSQL (5 minutes):"
echo "---------------------------------------------------"
cat << 'EOF'
ogr2ogr -f "PostgreSQL" \
  "PG:host=aws-0-us-east-1.pooler.supabase.com port=6543 dbname=postgres user=postgres.tmlrvecuwgppbaynesji password=xxx" \
  "/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb" \
  -nln florida_parcels \
  CADASTRAL_DOR \
  -where "CO_NO = 18" \
  -select "18 as co_no,PARCEL_ID as parcel_id,OWN_NAME as own_name,PHY_ADDR1 as phy_addr1,PHY_CITY as phy_city,PHY_ZIPCD as phy_zipcd,LND_VAL as lnd_val,JV as jv" \
  -progress
EOF

echo
echo "This is 200-300x faster than individual SQL inserts!"

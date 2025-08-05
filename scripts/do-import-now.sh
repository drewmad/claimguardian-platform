#!/bin/bash

echo "================================================"
echo "FAST CHARLOTTE COUNTY IMPORT - STEP BY STEP"
echo "================================================"
echo

# Step 1: Create optimized CSV (if not already done)
if [ ! -f "/tmp/charlotte_parcels.csv" ]; then
    echo "Step 1: Creating CSV from GDB..."
    ogr2ogr -f CSV \
        /tmp/charlotte_parcels.csv \
        "/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb" \
        CADASTRAL_DOR \
        -where "CO_NO = 18" \
        -progress
else
    echo "✅ Step 1: CSV already exists"
fi

echo
echo "Step 2: Choose your import method:"
echo
echo "================================================"
echo "METHOD A: Using Supabase Dashboard (EASIEST)"
echo "================================================"
echo "1. Go to: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/editor/florida_parcels"
echo "2. Click the '+ Insert' button -> 'Import data from CSV'"
echo "3. Upload: /tmp/charlotte_parcels.csv"
echo "4. Map columns: CO_NO = 18 (set as default)"
echo "5. Click Import"
echo "Time: ~5-10 minutes"
echo

echo "================================================"
echo "METHOD B: Direct Database Connection (FASTEST)"  
echo "================================================"
echo "1. First, get your database password from Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/settings/database"
echo
echo "2. Install psql if needed:"
echo "   brew install postgresql"
echo
echo "3. Run this command (replace YOUR_PASSWORD):"
echo
cat << 'COMMAND'
PGPASSWORD='YOUR_PASSWORD' psql \
  -h aws-0-us-east-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.tmlrvecuwgppbaynesji \
  -d postgres \
  -c "\COPY florida_parcels(co_no, parcel_id, own_name, phy_addr1, phy_city, phy_zipcd, lnd_val, jv) FROM '/tmp/charlotte_parcels.csv' WITH (FORMAT csv, HEADER true);"
COMMAND
echo
echo "Time: ~1-2 minutes"
echo

echo "================================================"
echo "METHOD C: Using SQL Editor (MODERATE)"
echo "================================================"
echo "1. Go to: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql/new"
echo "2. Create this function:"
echo
cat << 'SQL'
-- Run this SQL in the editor:
CREATE OR REPLACE FUNCTION import_charlotte_csv() RETURNS void AS $$
BEGIN
  -- This would need the CSV data pasted or uploaded
  -- For now, you can use the batch SQL files instead
END;
$$ LANGUAGE plpgsql;
SQL
echo
echo "3. Then use the SQL batch files you already generated"
echo

echo "================================================"
echo "TO CHECK PROGRESS:"
echo "================================================"
echo "Run this query in SQL Editor:"
echo "SELECT COUNT(*) FROM florida_parcels WHERE co_no = 18;"
echo
echo "Current count: 50 rows"
echo "Target count: 218,846 rows"
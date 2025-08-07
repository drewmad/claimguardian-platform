#!/bin/bash
# Efficient parcel import methods

echo "=========================================="
echo "EFFICIENT Florida Parcel Import Methods"
echo "=========================================="
echo

echo "🚀 FAST METHOD 1: PostgreSQL COPY (1-2 minutes per county)"
echo "--------------------------------------------------------"
echo "# Direct COPY from CSV - handles millions of rows efficiently"
echo 'PGPASSWORD="your_password" psql \'
echo '  -h aws-0-us-east-1.pooler.supabase.com \'
echo '  -p 6543 \'
echo '  -U postgres.tmlrvecuwgppbaynesji \'
echo '  -d postgres \'
echo '  -c "\COPY florida_parcels FROM '\''/tmp/charlotte_parcels.csv'\'' CSV HEADER"'
echo

echo "🚀 FAST METHOD 2: Parallel Processing (5-10 minutes total)"
echo "--------------------------------------------------------"
echo "# Split CSV and process in parallel"
echo "split -l 50000 /tmp/charlotte_parcels.csv /tmp/chunk_"
echo "# Then import each chunk simultaneously"
echo

echo "🚀 FAST METHOD 3: Direct GDB Import (No CSV needed!)"
echo "--------------------------------------------------------"
echo "# Use ogr2ogr directly to PostgreSQL"
echo 'ogr2ogr -f "PostgreSQL" \'
echo '  "PG:host=aws-0-us-east-1.pooler.supabase.com port=6543 dbname=postgres user=postgres.tmlrvecuwgppbaynesji password=xxx" \'
echo '  "/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb" \'
echo '  -nln florida_parcels \'
echo '  -where "CO_NO = 18" \'
echo '  -progress \'
echo '  -skipfailures'
echo

echo "🚀 FAST METHOD 4: Supabase Storage + Foreign Data Wrapper"
echo "--------------------------------------------------------"
echo "1. Upload CSV to Storage"
echo "2. Create foreign table pointing to CSV"
echo "3. INSERT INTO florida_parcels SELECT * FROM foreign_table"
echo

echo "⚠️  Why current method is slow:"
echo "- 438 individual SQL files = 438 network round trips"
echo "- Small batches (500 rows) = high overhead"
echo "- No parallelization"
echo "- Text-based SQL parsing overhead"
echo
echo "Time comparison:"
echo "- Current method: 4-6 hours"
echo "- COPY method: 1-2 minutes"
echo "- Direct ogr2ogr: 5-10 minutes"
echo "- All 67 counties with COPY: ~1 hour total!"

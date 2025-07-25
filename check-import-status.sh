#!/bin/bash

# Check import status for Florida parcels

export PGPASSWORD="Hotdam!2025"

# Configuration
DB_HOST="db.tmlrvecuwgppbaynesji.supabase.co"
DB_NAME="postgres"
DB_USER="postgres"
DB_PORT="5432"
GDB_PATH="temp_extract/Cadastral_Statewide.gdb"

echo "Florida Parcels Import Status"
echo "============================="
echo ""

# Get counts from GDB
echo "Checking source data (GDB file)..."
echo "County totals in source:"
echo ""

ogrinfo -al -so "$GDB_PATH" CADASTRAL_DOR -sql "SELECT CO_NO, COUNT(*) as count FROM CADASTRAL_DOR WHERE CO_NO IN (15,71,115,21,86,11,99) GROUP BY CO_NO ORDER BY CO_NO" 2>/dev/null | grep -A 20 "Layer name: CADASTRAL_DOR" | grep -E "^[0-9]"

echo ""
echo "Database status:"
echo "================"

psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" <<EOF
-- Total records
SELECT 'Total records in database: ' || TO_CHAR(COUNT(*), 'FM999,999,999') 
FROM florida_parcels;

-- By county
SELECT 
    co_no,
    CASE co_no
        WHEN 15 THEN 'Charlotte'
        WHEN 71 THEN 'Lee'
        WHEN 115 THEN 'Sarasota'
        WHEN 21 THEN 'Collier'
        WHEN 86 THEN 'Miami-Dade'
        WHEN 11 THEN 'Broward'
        WHEN 99 THEN 'Palm Beach'
        ELSE 'County ' || co_no
    END as county,
    TO_CHAR(COUNT(*), 'FM999,999') as in_database
FROM florida_parcels
WHERE co_no IN (15,71,115,21,86,11,99)
GROUP BY co_no
ORDER BY co_no;

-- Check for objectid values
SELECT 
    'Records with objectid: ' || COUNT(*) as objectid_status
FROM florida_parcels 
WHERE objectid IS NOT NULL;
EOF

echo ""
echo "Recommendations:"
echo "================"
echo "1. For Charlotte County, we have 35,000 records but objectid is NULL"
echo "2. This suggests we imported via the API method which doesn't preserve objectid"
echo "3. To complete the import, we can:"
echo "   - Clear and reimport with ogr2ogr (preserves all fields)"
echo "   - Or continue with API method for remaining counties"

unset PGPASSWORD
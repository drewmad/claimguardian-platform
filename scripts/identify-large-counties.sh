#!/bin/bash

# Identify large counties that need batched import

DB_HOST="aws-0-us-east-2.pooler.supabase.com"
DB_PORT="6543"
DB_USER="postgres.tmlrvecuwgppbaynesji"
DB_PASSWORD="Hotdam2025a"

echo "Checking which counties are already imported..."
IMPORTED=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -t -c "SELECT co_no, COUNT(*) FROM florida_parcels GROUP BY co_no ORDER BY co_no;" | awk '{print $1}')

echo "Already imported counties:"
echo "$IMPORTED"
echo

# Large counties that typically need batched import
LARGE_COUNTIES=(
    "16:BROWARD:750000"
    "21:COLLIER:300000"
    "25:DUVAL:500000"
    "38:HILLSBOROUGH:600000"
    "44:LAKE:200000"
    "45:LEE:400000"
    "51:MARION:200000"
    "53:MIAMI-DADE:900000"
    "58:ORANGE:500000"
    "60:PALM_BEACH:700000"
    "61:PASCO:250000"
    "62:PINELLAS:500000"
    "63:POLK:350000"
    "68:SARASOTA:250000"
    "69:SEMINOLE:200000"
    "74:VOLUSIA:300000"
)

echo "Large counties that may need batched import:"
echo "============================================"
for county_info in "${LARGE_COUNTIES[@]}"; do
    IFS=':' read -r code name est_size <<< "$county_info"

    # Check if already imported
    if echo "$IMPORTED" | grep -q "^$code$"; then
        COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -t -c "SELECT COUNT(*) FROM florida_parcels WHERE co_no = $code;" | xargs)
        echo "✅ $name ($code): Already imported with $COUNT parcels"
    else
        echo "❌ $name ($code): Not imported yet (est. $est_size parcels)"
    fi
done

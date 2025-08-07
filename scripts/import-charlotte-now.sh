#!/bin/bash

# Import Charlotte County with proper password escaping
echo "Starting Charlotte County import..."
echo "This should take 1-2 minutes..."
echo

# Method 1: Using environment variable (more secure)
export PGPASSWORD="Hotdam'2025a"

psql \
  -h aws-0-us-east-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.tmlrvecuwgppbaynesji \
  -d postgres \
  -c "\COPY florida_parcels(co_no, parcel_id, own_name, phy_addr1, phy_city, phy_zipcd, lnd_val, jv) FROM '/tmp/charlotte_parcels.csv' WITH (FORMAT csv, HEADER true);"

# Unset password after use
unset PGPASSWORD

echo
echo "Import complete! Checking count..."
echo

# Check the count
export PGPASSWORD="Hotdam'2025a"
psql \
  -h aws-0-us-east-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.tmlrvecuwgppbaynesji \
  -d postgres \
  -c "SELECT COUNT(*) as charlotte_county_parcels FROM florida_parcels WHERE co_no = 18;"

unset PGPASSWORD

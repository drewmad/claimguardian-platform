#!/bin/bash
# Fast import using SQL and service role key
set -euo pipefail

# Use connection pooler with service role
DB_URL="postgresql://postgres.tmlrvecuwgppbaynesji:Madengineering%231@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
GDB="/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb"

echo "Testing Charlotte County (18) first..."

# Direct import using ogr2ogr to PostgreSQL
ogr2ogr -f "PostgreSQL" \
  PG:"$DB_URL" \
  "$GDB" \
  -nln florida_parcels \
  -where "CO_NO = 18" \
  -nlt GEOMETRY \
  -lco GEOMETRY_NAME=shape_wkt \
  -progress \
  CADASTRAL_DOR

echo "Done! Check: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/editor"
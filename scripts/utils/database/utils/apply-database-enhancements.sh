#!/bin/bash

# Script to apply database enhancements to Supabase
# This script uses the Supabase service role key to execute SQL directly

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_URL="https://tmlrvecuwgppbaynesji.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHJ2ZWN1d2dwcGJheW5lc2ppIiwicm9sZSI6InNlcnZpY2Ufcm9sZSIsImlhdCI6MTc0OTA3NTAzOSwiZXhwIjoyMDY0NjUxMDM5fQ.aIfLJZFqLLucsgSZaGo0P-NwJULB2Zc_z_3jz3a4i3E"

echo -e "${YELLOW}🚀 Applying Database Enhancements to ClaimGuardian${NC}"
echo "=================================================="

# Function to execute SQL and check result
execute_sql() {
    local sql=$1
    local description=$2

    echo -e "\n${YELLOW}Executing: ${description}${NC}"

    # For now, we'll output the SQL that needs to be run
    echo -e "${GREEN}SQL to execute in Supabase Dashboard:${NC}"
    echo "----------------------------------------"
    echo "$sql"
    echo "----------------------------------------"
}

# Step 1: Create enum types
execute_sql "-- Create enum types for claims and policies
CREATE TYPE public.claim_status_enum AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'approved',
    'denied',
    'settled',
    'closed',
    'reopened'
);

CREATE TYPE public.damage_type_enum AS ENUM (
    'hurricane',
    'flood',
    'wind',
    'hail',
    'fire',
    'water_damage',
    'mold',
    'theft',
    'vandalism',
    'lightning',
    'fallen_tree',
    'other'
);

CREATE TYPE public.policy_type_enum AS ENUM (
    'HO3',
    'HO5',
    'HO6',
    'HO8',
    'DP1',
    'DP3',
    'FLOOD',
    'WIND',
    'UMBRELLA',
    'OTHER'
);" "Creating enum types"

echo -e "\n${GREEN}✅ Database enhancement SQL has been prepared!${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Go to: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql/new"
echo "2. Copy and paste the SQL from supabase/migrations/20250716051556_add_claims_and_policies_tables.sql"
echo "3. Execute the SQL in the dashboard"
echo "4. Verify the tables were created successfully"

echo -e "\n${YELLOW}Alternative: Use psql directly${NC}"
echo "PGPASSWORD='your-db-password' psql -h db.tmlrvecuwgppbaynesji.supabase.co -U postgres -d postgres -f supabase/migrations/20250716051556_add_claims_and_policies_tables.sql"

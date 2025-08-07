#!/bin/bash

# Apply database migration using Supabase Dashboard approach

SUPABASE_PROJECT_URL="https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji"

echo "=========================================="
echo "🚀 APPLYING DATABASE MIGRATION"
echo "=========================================="
echo ""
echo "Since direct SQL execution via API requires special permissions,"
echo "please follow these steps to apply the migration:"
echo ""
echo "1. Open Supabase SQL Editor:"
echo "   ${SUPABASE_PROJECT_URL}/sql/new"
echo ""
echo "2. Copy the entire contents of this file:"
echo "   supabase/migrations/20250716051556_add_claims_and_policies_tables.sql"
echo ""
echo "3. Paste into the SQL editor and click 'Run'"
echo ""
echo "The migration will:"
echo "  ✓ Create claims and policies tables"
echo "  ✓ Add enum types for statuses and types"
echo "  ✓ Migrate existing insurance data"
echo "  ✓ Add structured address columns"
echo "  ✓ Set up Row Level Security"
echo "  ✓ Create helpful views and indexes"
echo ""
echo "Alternatively, you can run smaller parts of the migration:"
echo ""
echo "Step 1 - Create enum types:"
echo "----------------------------------------"
cat << 'ENUMS'
-- Create enum types for claims and policies
CREATE TYPE public.claim_status_enum AS ENUM (
    'draft', 'submitted', 'under_review', 'approved',
    'denied', 'settled', 'closed', 'reopened'
);

CREATE TYPE public.damage_type_enum AS ENUM (
    'hurricane', 'flood', 'wind', 'hail', 'fire',
    'water_damage', 'mold', 'theft', 'vandalism',
    'lightning', 'fallen_tree', 'other'
);

CREATE TYPE public.policy_type_enum AS ENUM (
    'HO3', 'HO5', 'HO6', 'HO8', 'DP1', 'DP3',
    'FLOOD', 'WIND', 'UMBRELLA', 'OTHER'
);
ENUMS

echo ""
echo "Step 2 - Create tables (run after enums):"
echo "----------------------------------------"
echo "(See full migration file for complete table definitions)"
echo ""
echo "=========================================="

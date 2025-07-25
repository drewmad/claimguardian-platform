#!/bin/bash

# Execute migration via Supabase Management API

API_URL="https://api.supabase.com/v1/projects/tmlrvecuwgppbaynesji/database/query"
AUTH_TOKEN="${SUPABASE_ACCESS_TOKEN}"

echo "🚀 Executing property schema migration via Management API..."
echo ""

# Function to execute SQL
execute_sql() {
    local query="$1"
    local description="$2"
    
    echo "📝 $description"
    
    response=$(curl -s -X POST "$API_URL" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(echo "$query" | jq -Rs .)}")
    
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        echo "❌ Error: $(echo "$response" | jq -r '.error')"
        return 1
    else
        echo "✅ Success"
        echo "$response" | jq .
        return 0
    fi
}

# Step 1: Create enum types
echo "🏷️ Step 1: Creating enum types..."
execute_sql "
DO \$\$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type') THEN
        CREATE TYPE property_type AS ENUM ('residential', 'commercial', 'land', 'mixed_use');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'occupancy_status') THEN
        CREATE TYPE occupancy_status AS ENUM ('owner_occupied', 'tenant_occupied', 'vacant', 'seasonal');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'damage_severity') THEN
        CREATE TYPE damage_severity AS ENUM ('minor', 'moderate', 'major', 'total_loss');
    END IF;
END \$\$;
" "Creating missing enum types"

# Step 2: Check current state
echo -e "\n🔍 Step 2: Checking current database state..."
execute_sql "
SELECT 
    (SELECT COUNT(*) FROM properties) as properties_count,
    (SELECT COUNT(*) FROM pg_type WHERE typname IN ('property_type', 'occupancy_status', 'damage_severity')) as enum_count,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'property%' AND table_schema = 'public') as table_count
" "Current database statistics"

# Step 3: Rename existing properties table
echo -e "\n📦 Step 3: Backing up and renaming properties table..."
execute_sql "
ALTER TABLE IF EXISTS properties RENAME TO properties_old;
" "Renaming properties to properties_old"

# Step 4: Create new properties table
echo -e "\n🏗️ Step 4: Creating new properties table..."
execute_sql "
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'FL',
    zip_code TEXT NOT NULL,
    county TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location GEOGRAPHY(POINT, 4326),
    parcel_number TEXT,
    property_type property_type DEFAULT 'residential',
    year_built INTEGER,
    square_footage INTEGER,
    lot_size_acres DECIMAL(10, 4),
    occupancy_status occupancy_status DEFAULT 'owner_occupied',
    purchase_date DATE,
    purchase_price DECIMAL(12, 2),
    current_value DECIMAL(12, 2),
    metadata JSONB DEFAULT '{}',
    external_ids JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    CONSTRAINT valid_location CHECK (
        (latitude IS NULL AND longitude IS NULL) OR 
        (latitude IS NOT NULL AND longitude IS NOT NULL)
    )
);
" "Creating enhanced properties table"

# Step 5: Create property_insurance table
echo -e "\n🏗️ Step 5: Creating property_insurance table..."
execute_sql "
CREATE TABLE IF NOT EXISTS property_insurance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    carrier_name TEXT,
    policy_number TEXT,
    policy_type TEXT DEFAULT 'homeowners',
    effective_date DATE,
    expiration_date DATE,
    dwelling_coverage DECIMAL(12, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);
" "Creating property_insurance table"

# Step 6: Migrate data
echo -e "\n📊 Step 6: Migrating data from old table..."
execute_sql "
INSERT INTO properties (
    id, user_id, address, city, state, zip_code, county,
    year_built, square_footage, current_value, created_at, updated_at
)
SELECT 
    id, user_id,
    COALESCE(street_address, name, '') as address,
    COALESCE(city, '') as city,
    COALESCE(state, 'FL') as state,
    COALESCE(postal_code, '') as zip_code,
    '' as county,
    year_built,
    square_feet as square_footage,
    value as current_value,
    created_at,
    updated_at
FROM properties_old;
" "Migrating property data"

# Step 7: Enable RLS
echo -e "\n🔒 Step 7: Enabling Row Level Security..."
execute_sql "
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_insurance ENABLE ROW LEVEL SECURITY;

CREATE POLICY \"Users can view own properties\" ON properties
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY \"Users can create own properties\" ON properties
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY \"Users can update own properties\" ON properties
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY \"Users can delete own properties\" ON properties
    FOR DELETE USING (user_id = auth.uid());
" "Setting up RLS policies"

# Final verification
echo -e "\n✅ Step 8: Verifying migration..."
execute_sql "
SELECT 
    (SELECT COUNT(*) FROM properties) as new_properties_count,
    (SELECT COUNT(*) FROM properties_old) as old_properties_count,
    (SELECT COUNT(*) FROM property_insurance) as insurance_count,
    (SELECT COUNT(*) FROM pg_tables WHERE tablename LIKE 'property%' AND rowsecurity = true) as rls_enabled_count
" "Final migration verification"

echo -e "\n🎉 Migration complete! Check the results above."
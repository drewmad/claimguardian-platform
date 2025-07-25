#!/bin/bash

# Apply remaining schema components

API_URL="https://api.supabase.com/v1/projects/tmlrvecuwgppbaynesji/database/query"
AUTH_TOKEN="${SUPABASE_ACCESS_TOKEN}"

echo "🚀 Applying remaining property schema components..."
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
        return 0
    fi
}

# Create remaining core tables
echo "🏗️ Creating additional property tables..."

# Property Land
execute_sql "
CREATE TABLE IF NOT EXISTS property_land (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    zoning_code TEXT,
    zoning_description TEXT,
    land_use_code TEXT,
    flood_zone TEXT,
    elevation_feet DECIMAL(8, 2),
    legal_description TEXT,
    assessed_land_value DECIMAL(12, 2),
    assessment_year INTEGER,
    gis_data JSONB DEFAULT '{}',
    environmental_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    CONSTRAINT unique_property_land UNIQUE(property_id)
);
" "Creating property_land table"

# Property Structures
execute_sql "
CREATE TABLE IF NOT EXISTS property_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    structure_type TEXT NOT NULL,
    structure_name TEXT,
    square_footage INTEGER,
    stories INTEGER,
    bedrooms INTEGER,
    bathrooms DECIMAL(3, 1),
    construction_type TEXT,
    foundation_type TEXT,
    exterior_walls TEXT,
    roof_type TEXT,
    roof_material TEXT,
    roof_age_years INTEGER,
    overall_condition TEXT,
    last_renovation_date DATE,
    construction_details JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);
" "Creating property_structures table"

# Property Systems
execute_sql "
CREATE TABLE IF NOT EXISTS property_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    structure_id UUID NOT NULL REFERENCES property_structures(id) ON DELETE CASCADE,
    system_type TEXT NOT NULL,
    system_name TEXT,
    manufacturer TEXT,
    model_number TEXT,
    serial_number TEXT,
    install_date DATE,
    warranty_expiration DATE,
    last_inspection_date DATE,
    last_service_date DATE,
    condition_rating INTEGER CHECK (condition_rating BETWEEN 1 AND 10),
    specifications JSONB DEFAULT '{}',
    maintenance_history JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);
" "Creating property_systems table"

# Property Damage
execute_sql "
CREATE TABLE IF NOT EXISTS property_damage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    claim_id UUID REFERENCES claims(id) ON DELETE SET NULL,
    structure_id UUID REFERENCES property_structures(id) ON DELETE SET NULL,
    assessment_date DATE NOT NULL,
    assessor_name TEXT,
    assessor_type TEXT,
    damage_type TEXT NOT NULL,
    damage_severity damage_severity NOT NULL,
    damage_description TEXT,
    location_description TEXT,
    affected_rooms JSONB DEFAULT '[]',
    affected_systems JSONB DEFAULT '[]',
    photo_urls JSONB DEFAULT '[]',
    video_urls JSONB DEFAULT '[]',
    report_url TEXT,
    estimated_repair_cost DECIMAL(12, 2),
    actual_repair_cost DECIMAL(12, 2),
    repair_completed_date DATE,
    measurements JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);
" "Creating property_damage table"

# Property Contractors
execute_sql "
CREATE TABLE IF NOT EXISTS property_contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    claim_id UUID REFERENCES claims(id) ON DELETE SET NULL,
    damage_id UUID REFERENCES property_damage(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    contact_name TEXT,
    license_number TEXT,
    phone TEXT,
    email TEXT,
    work_type TEXT NOT NULL,
    scope_of_work TEXT,
    estimate_date DATE,
    start_date DATE,
    completion_date DATE,
    warranty_expiration DATE,
    estimate_amount DECIMAL(12, 2),
    contract_amount DECIMAL(12, 2),
    paid_amount DECIMAL(12, 2),
    estimate_url TEXT,
    contract_url TEXT,
    invoice_urls JSONB DEFAULT '[]',
    permit_urls JSONB DEFAULT '[]',
    work_quality_rating INTEGER CHECK (work_quality_rating BETWEEN 1 AND 5),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);
" "Creating property_contractors table"

# Update claims table to ensure it references new properties
echo -e "\n🔗 Updating claims table foreign key..."
execute_sql "
ALTER TABLE claims 
    DROP CONSTRAINT IF EXISTS claims_property_id_fkey;
ALTER TABLE claims 
    ADD CONSTRAINT claims_property_id_fkey 
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
" "Updating claims foreign key"

# Create indexes
echo -e "\n📊 Creating performance indexes..."
execute_sql "
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_property_land_property ON property_land(property_id);
CREATE INDEX IF NOT EXISTS idx_property_structures_property ON property_structures(property_id);
CREATE INDEX IF NOT EXISTS idx_property_systems_structure ON property_systems(structure_id);
CREATE INDEX IF NOT EXISTS idx_property_damage_property ON property_damage(property_id);
CREATE INDEX IF NOT EXISTS idx_property_contractors_property ON property_contractors(property_id);
" "Creating indexes"

# Enable RLS on remaining tables
echo -e "\n🔒 Enabling RLS on remaining tables..."
execute_sql "
ALTER TABLE property_land ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_damage ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_contractors ENABLE ROW LEVEL SECURITY;
" "Enabling RLS"

# Create update triggers
echo -e "\n⚡ Creating update triggers..."
execute_sql "
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
\$\$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_insurance_updated_at BEFORE UPDATE ON property_insurance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_land_updated_at BEFORE UPDATE ON property_land
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_structures_updated_at BEFORE UPDATE ON property_structures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
" "Creating update triggers"

# Final verification
echo -e "\n✅ Verifying complete schema..."
execute_sql "
SELECT 
    table_name,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = table_name) as index_count,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = table_name) as rls_enabled
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'property%'
ORDER BY table_name;
" "Schema verification"

echo -e "\n🎉 Complete property schema has been deployed!"
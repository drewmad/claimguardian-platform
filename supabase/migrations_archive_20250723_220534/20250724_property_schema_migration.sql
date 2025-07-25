-- ClaimGuardian Property Schema Migration Strategy
-- ================================================
-- This migration safely transforms the existing schema to our new comprehensive design

-- STEP 1: Create backup tables
-- ============================
CREATE TABLE IF NOT EXISTS properties_backup_20250724 AS 
SELECT * FROM properties;

CREATE TABLE IF NOT EXISTS claims_backup_20250724 AS 
SELECT * FROM claims;

-- STEP 2: Create missing enum types (skip if exists)
-- ==================================================
DO $$ 
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
    
    -- Note: claim_status already exists as claim_status_enum
END $$;

-- STEP 3: Rename existing properties table
-- ========================================
ALTER TABLE properties RENAME TO properties_old;

-- STEP 4: Create new properties table with enhanced structure
-- ===========================================================
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Core fields
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'FL',
    zip_code TEXT NOT NULL,
    county TEXT,
    
    -- Geospatial
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location GEOGRAPHY(POINT, 4326),
    parcel_number TEXT,
    
    -- Property details
    property_type property_type DEFAULT 'residential',
    year_built INTEGER,
    square_footage INTEGER,
    lot_size_acres DECIMAL(10, 4),
    occupancy_status occupancy_status DEFAULT 'owner_occupied',
    
    -- Financial
    purchase_date DATE,
    purchase_price DECIMAL(12, 2),
    current_value DECIMAL(12, 2),
    
    -- Flexible metadata
    metadata JSONB DEFAULT '{}',
    external_ids JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    
    -- Constraints
    CONSTRAINT valid_location CHECK (
        (latitude IS NULL AND longitude IS NULL) OR 
        (latitude IS NOT NULL AND longitude IS NOT NULL)
    )
);

-- Create spatial index
CREATE INDEX idx_properties_location ON properties USING GIST(location);

-- STEP 5: Migrate data from old properties table
-- ==============================================
INSERT INTO properties (
    id,
    user_id,
    address,
    city,
    state,
    zip_code,
    county,
    latitude,
    longitude,
    location,
    parcel_number,
    property_type,
    year_built,
    square_footage,
    current_value,
    metadata,
    created_at,
    updated_at
)
SELECT 
    id,
    user_id,
    COALESCE(
        street_address, 
        address->>'street',
        address->>'address',
        name
    ) as address,
    COALESCE(
        city,
        address->>'city',
        ''
    ) as city,
    COALESCE(
        state,
        address->>'state',
        'FL'
    ) as state,
    COALESCE(
        postal_code,
        address->>'zip',
        address->>'postal_code',
        ''
    ) as zip_code,
    address->>'county' as county,
    CASE 
        WHEN location IS NOT NULL THEN ST_Y(location::geometry)
        ELSE NULL
    END as latitude,
    CASE 
        WHEN location IS NOT NULL THEN ST_X(location::geometry)
        ELSE NULL
    END as longitude,
    location::geography as location,
    parcel_id as parcel_number,
    CASE 
        WHEN lower(property_type) = 'residential' THEN 'residential'::property_type
        WHEN lower(property_type) = 'commercial' THEN 'commercial'::property_type
        WHEN lower(property_type) = 'land' THEN 'land'::property_type
        ELSE 'residential'::property_type
    END as property_type,
    year_built,
    square_feet as square_footage,
    value as current_value,
    jsonb_build_object(
        'legacy_details', details,
        'legacy_name', name,
        'insurability_score', insurability_score,
        'imported_from_legacy', true
    ) as metadata,
    created_at,
    updated_at
FROM properties_old;

-- STEP 6: Create new child tables
-- ===============================

-- Property Insurance (migrate from properties table)
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

-- Migrate insurance data
INSERT INTO property_insurance (
    property_id,
    carrier_name,
    policy_number,
    created_at,
    updated_at
)
SELECT 
    id,
    insurance_carrier,
    insurance_policy_number,
    created_at,
    updated_at
FROM properties_old
WHERE insurance_carrier IS NOT NULL 
   OR insurance_policy_number IS NOT NULL;

-- Create other new tables (land, structures, etc.)
-- These are new tables with no legacy data to migrate
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

-- STEP 7: Update claims table to reference new properties
-- =======================================================
-- Claims table already exists and has good structure
-- Just ensure foreign key points to new properties table
ALTER TABLE claims 
    DROP CONSTRAINT IF EXISTS claims_property_id_fkey,
    ADD CONSTRAINT claims_property_id_fkey 
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- STEP 8: Enable RLS on new tables
-- =================================
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_land ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can view own properties" ON properties
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own properties" ON properties
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own properties" ON properties
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own properties" ON properties
    FOR DELETE USING (user_id = auth.uid());

-- STEP 9: Create update triggers
-- ==============================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_insurance_updated_at 
    BEFORE UPDATE ON property_insurance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- STEP 10: Verification queries
-- =============================
DO $$
DECLARE
    old_count INTEGER;
    new_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_count FROM properties_old;
    SELECT COUNT(*) INTO new_count FROM properties;
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '  Old properties count: %', old_count;
    RAISE NOTICE '  New properties count: %', new_count;
    RAISE NOTICE '  Insurance records created: %', (SELECT COUNT(*) FROM property_insurance);
    
    IF old_count = new_count THEN
        RAISE NOTICE '✅ All properties migrated successfully!';
    ELSE
        RAISE WARNING '⚠️  Property count mismatch! Check migration.';
    END IF;
END $$;

-- IMPORTANT: After verifying migration success, you can:
-- DROP TABLE properties_old;
-- But keep it for now as a safety backup
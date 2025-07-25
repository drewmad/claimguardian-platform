-- Florida Counties Reference Table
-- ================================
-- This table contains hard-coded reference data for all 67 Florida counties
-- Used for county-specific regulations, contacts, and requirements

CREATE TABLE IF NOT EXISTS florida_counties (
    -- Core identifiers
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    county_code TEXT UNIQUE NOT NULL, -- Official FIPS code (e.g., '12001' for Alachua)
    county_name TEXT UNIQUE NOT NULL, -- Official county name
    county_seat TEXT NOT NULL, -- County seat city
    
    -- Geographic information
    region TEXT NOT NULL CHECK (region IN ('Northwest', 'North Central', 'Northeast', 'Central West', 'Central', 'Central East', 'Southwest', 'Southeast')),
    time_zone TEXT NOT NULL CHECK (time_zone IN ('EST', 'CST')),
    fema_region TEXT, -- FEMA disaster region
    
    -- Property/Building Department
    building_dept_name TEXT,
    building_dept_phone TEXT,
    building_dept_email TEXT,
    building_dept_address TEXT,
    building_dept_website TEXT,
    permit_search_url TEXT,
    online_permit_system BOOLEAN DEFAULT false,
    
    -- Property Appraiser
    property_appraiser_name TEXT,
    property_appraiser_phone TEXT,
    property_appraiser_email TEXT,
    property_appraiser_website TEXT,
    property_search_url TEXT,
    gis_url TEXT,
    parcel_data_url TEXT,
    
    -- Tax Collector
    tax_collector_name TEXT,
    tax_collector_phone TEXT,
    tax_collector_email TEXT,
    tax_collector_website TEXT,
    
    -- Emergency Management
    emergency_mgmt_name TEXT,
    emergency_mgmt_phone TEXT,
    emergency_mgmt_email TEXT,
    emergency_mgmt_website TEXT,
    emergency_hotline TEXT,
    
    -- Insurance specific
    citizens_service_center TEXT, -- Citizens Property Insurance office
    flood_zone_maps_url TEXT,
    windstorm_requirements JSONB DEFAULT '{}', -- County-specific windstorm mitigation requirements
    
    -- Building codes and regulations
    building_code_version TEXT, -- e.g., '2020 Florida Building Code'
    wind_speed_requirement INTEGER, -- Design wind speed in mph
    flood_elevation_requirement BOOLEAN DEFAULT false,
    impact_glass_required BOOLEAN DEFAULT false,
    permit_expiration_days INTEGER DEFAULT 180,
    
    -- Fee structures (for estimates)
    permit_fee_structure JSONB DEFAULT '{}', -- {"base": 50, "per_1000": 5.50}
    reinspection_fee DECIMAL(10,2),
    
    -- Hurricane/Disaster specific
    hurricane_evacuation_zone_url TEXT,
    storm_surge_planning_zone_url TEXT,
    fema_flood_zone_url TEXT,
    
    -- County-specific claim requirements
    claim_filing_requirements JSONB DEFAULT '{}',
    supplemental_claim_deadline_days INTEGER DEFAULT 365, -- Days after initial claim
    aob_restrictions JSONB DEFAULT '{}', -- Assignment of Benefits restrictions
    
    -- Contractor licensing
    contractor_license_search_url TEXT,
    contractor_license_verification_phone TEXT,
    unlicensed_contractor_limit DECIMAL(10,2) DEFAULT 2500.00, -- Max $ for unlicensed work
    
    -- Demographics and statistics
    population INTEGER,
    households INTEGER,
    median_home_value DECIMAL(12,2),
    coastal_county BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Create indexes separately
CREATE INDEX idx_counties_name ON florida_counties (county_name);
CREATE INDEX idx_counties_code ON florida_counties (county_code);
CREATE INDEX idx_counties_region ON florida_counties (region);

-- Enable RLS
ALTER TABLE florida_counties ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read county data
CREATE POLICY "Counties are viewable by all users" ON florida_counties
    FOR SELECT USING (true);

-- Only admins can modify county data
CREATE POLICY "Only admins can modify counties" ON florida_counties
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Function to get county by various identifiers
CREATE OR REPLACE FUNCTION get_florida_county(
    p_identifier TEXT -- Can be county name, code, or zip code
)
RETURNS SETOF florida_counties AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM florida_counties
    WHERE county_name ILIKE p_identifier
       OR county_code = p_identifier
       OR county_name ILIKE p_identifier || ' County'
       OR REPLACE(LOWER(county_name), ' county', '') = LOWER(p_identifier)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get county for a property
CREATE OR REPLACE FUNCTION get_county_for_property(
    p_property_id UUID
)
RETURNS SETOF florida_counties AS $$
DECLARE
    v_county_name TEXT;
BEGIN
    -- Get county from property address
    SELECT 
        CASE 
            WHEN address ILIKE '%County%' THEN 
                TRIM(REGEXP_REPLACE(address, '.*,\s*([^,]+)\s+County.*', '\1', 'i'))
            ELSE 
                NULL
        END INTO v_county_name
    FROM properties
    WHERE id = p_property_id;
    
    IF v_county_name IS NOT NULL THEN
        RETURN QUERY
        SELECT * FROM florida_counties
        WHERE county_name ILIKE v_county_name || '%';
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_florida_counties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_florida_counties_updated_at
BEFORE UPDATE ON florida_counties
FOR EACH ROW
EXECUTE FUNCTION update_florida_counties_updated_at();
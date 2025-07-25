-- Drop existing table if exists
DROP TABLE IF EXISTS florida_counties CASCADE;

-- Create Florida Counties Reference Table with exact structure
CREATE TABLE florida_counties (
    -- Core identifiers (reordered to match CSV)
    county_code TEXT UNIQUE NOT NULL,
    id UUID PRIMARY KEY,
    county_name TEXT UNIQUE NOT NULL,
    county_seat TEXT NOT NULL,
    
    -- Geographic information
    region TEXT NOT NULL,
    time_zone TEXT NOT NULL,
    fema_region TEXT,
    coastal_county BOOLEAN DEFAULT false,
    
    -- Building Department
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
    citizens_service_center TEXT,
    flood_zone_maps_url TEXT,
    windstorm_requirements JSONB DEFAULT '{}',
    
    -- Building codes and regulations
    building_code_version TEXT,
    wind_speed_requirement INTEGER,
    flood_elevation_requirement BOOLEAN DEFAULT false,
    impact_glass_required BOOLEAN DEFAULT false,
    permit_expiration_days INTEGER DEFAULT 180,
    
    -- Fee structures
    permit_fee_structure JSONB DEFAULT '{}',
    reinspection_fee DECIMAL(10,2),
    
    -- Hurricane/Disaster specific
    hurricane_evacuation_zone_url TEXT,
    storm_surge_planning_zone_url TEXT,
    fema_flood_zone_url TEXT,
    
    -- County-specific claim requirements
    claim_filing_requirements JSONB DEFAULT '{}',
    supplemental_claim_deadline_days INTEGER DEFAULT 365,
    aob_restrictions JSONB DEFAULT '{}',
    
    -- Contractor licensing
    contractor_license_search_url TEXT,
    contractor_license_verification_phone TEXT,
    unlicensed_contractor_limit DECIMAL(10,2) DEFAULT 2500.00,
    
    -- Demographics and statistics
    population INTEGER,
    households INTEGER,
    median_home_value DECIMAL(12,2),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Create indexes for efficient lookups
CREATE INDEX idx_florida_counties_name ON florida_counties (county_name);
CREATE INDEX idx_florida_counties_code ON florida_counties (county_code);
CREATE INDEX idx_florida_counties_region ON florida_counties (region);
CREATE INDEX idx_florida_counties_coastal ON florida_counties (coastal_county);

-- Enable RLS
ALTER TABLE florida_counties ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read county data
CREATE POLICY "Counties are viewable by all users" ON florida_counties
    FOR SELECT USING (true);

-- Only admins can modify county data
CREATE POLICY "Only admins can modify counties" ON florida_counties
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
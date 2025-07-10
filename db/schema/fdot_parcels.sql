-- FDOT Parcels Schema
-- Hand-written DDL for Florida parcel data storage
-- This schema is designed for high-performance spatial queries and analytics

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create enum types for better data integrity
CREATE TYPE land_use_category AS ENUM (
    'residential',
    'commercial',
    'industrial',
    'agricultural',
    'vacant',
    'institutional',
    'recreational',
    'transportation',
    'utility',
    'other'
);

CREATE TYPE flood_zone_type AS ENUM (
    'A', 'AE', 'AH', 'AO', 'AR', 'A99',
    'V', 'VE', 'X', 'B', 'C', 'D',
    'UNKNOWN'
);

-- Main parcels table
CREATE TABLE IF NOT EXISTS florida_parcels (
    -- Primary identifiers
    parcel_id TEXT PRIMARY KEY,
    county TEXT NOT NULL,
    state_parcel_id TEXT,
    
    -- Owner information
    owner_name TEXT,
    owner_address TEXT,
    owner_city TEXT,
    owner_state TEXT,
    owner_zip TEXT,
    
    -- Property location
    property_address TEXT,
    property_city TEXT,
    property_zip TEXT,
    municipality TEXT,
    subdivision TEXT,
    
    -- Legal description
    legal_description TEXT,
    deed_book TEXT,
    deed_page TEXT,
    
    -- Property characteristics
    land_use_code TEXT,
    land_use_category land_use_category,
    zoning TEXT,
    acreage NUMERIC(10,4),
    lot_size NUMERIC(12,2), -- square feet
    
    -- Building information
    year_built INTEGER,
    building_area NUMERIC(10,2), -- square feet
    living_area NUMERIC(10,2), -- square feet
    bedrooms INTEGER,
    bathrooms NUMERIC(3,1),
    stories INTEGER,
    building_type TEXT,
    construction_type TEXT,
    roof_type TEXT,
    exterior_wall TEXT,
    
    -- Valuation
    assessed_value NUMERIC(12,2),
    market_value NUMERIC(12,2),
    land_value NUMERIC(12,2),
    building_value NUMERIC(12,2),
    total_value NUMERIC(12,2),
    
    -- Exemptions
    homestead_exempt BOOLEAN DEFAULT FALSE,
    senior_exempt BOOLEAN DEFAULT FALSE,
    veteran_exempt BOOLEAN DEFAULT FALSE,
    disability_exempt BOOLEAN DEFAULT FALSE,
    agricultural_exempt BOOLEAN DEFAULT FALSE,
    
    -- Assessment year
    assessment_year INTEGER,
    
    -- Tax information
    tax_district TEXT,
    school_district TEXT,
    fire_district TEXT,
    water_district TEXT,
    sewer_district TEXT,
    
    -- Environmental and risk factors
    flood_zone TEXT,
    flood_zone_type flood_zone_type,
    hurricane_zone TEXT,
    evacuation_zone TEXT,
    coastal_construction_line BOOLEAN DEFAULT FALSE,
    
    -- Sales information
    last_sale_date DATE,
    last_sale_price NUMERIC(12,2),
    previous_sale_date DATE,
    previous_sale_price NUMERIC(12,2),
    
    -- Spatial data
    geom GEOMETRY(POLYGON, 4326),
    centroid GEOMETRY(POINT, 4326),
    
    -- Data provenance
    data_source TEXT DEFAULT 'FDOT',
    data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_acreage CHECK (acreage >= 0),
    CONSTRAINT positive_values CHECK (
        assessed_value >= 0 AND 
        market_value >= 0 AND 
        land_value >= 0 AND 
        building_value >= 0 AND 
        total_value >= 0
    ),
    CONSTRAINT valid_year_built CHECK (year_built >= 1700 AND year_built <= EXTRACT(YEAR FROM NOW()) + 10),
    CONSTRAINT valid_assessment_year CHECK (assessment_year >= 1990 AND assessment_year <= EXTRACT(YEAR FROM NOW()) + 1)
);

-- Create spatial indexes
CREATE INDEX IF NOT EXISTS idx_florida_parcels_geom 
    ON florida_parcels USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_centroid 
    ON florida_parcels USING GIST (centroid);

-- Create standard indexes
CREATE INDEX IF NOT EXISTS idx_florida_parcels_county 
    ON florida_parcels (county);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_owner_name 
    ON florida_parcels (owner_name);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_property_address 
    ON florida_parcels (property_address);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_municipality 
    ON florida_parcels (municipality);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_subdivision 
    ON florida_parcels (subdivision);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_land_use_code 
    ON florida_parcels (land_use_code);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_land_use_category 
    ON florida_parcels (land_use_category);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_zoning 
    ON florida_parcels (zoning);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_assessed_value 
    ON florida_parcels (assessed_value);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_market_value 
    ON florida_parcels (market_value);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_year_built 
    ON florida_parcels (year_built);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_homestead_exempt 
    ON florida_parcels (homestead_exempt);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_flood_zone 
    ON florida_parcels (flood_zone);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_flood_zone_type 
    ON florida_parcels (flood_zone_type);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_hurricane_zone 
    ON florida_parcels (hurricane_zone);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_evacuation_zone 
    ON florida_parcels (evacuation_zone);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_last_sale_date 
    ON florida_parcels (last_sale_date);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_tax_district 
    ON florida_parcels (tax_district);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_school_district 
    ON florida_parcels (school_district);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_created_at 
    ON florida_parcels (created_at);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_updated_at 
    ON florida_parcels (updated_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_florida_parcels_county_land_use 
    ON florida_parcels (county, land_use_category);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_county_value 
    ON florida_parcels (county, assessed_value);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_municipality_value 
    ON florida_parcels (municipality, assessed_value);

CREATE INDEX IF NOT EXISTS idx_florida_parcels_flood_zone_value 
    ON florida_parcels (flood_zone_type, assessed_value);

-- Partial indexes for performance
CREATE INDEX IF NOT EXISTS idx_florida_parcels_homestead_true 
    ON florida_parcels (county, assessed_value) 
    WHERE homestead_exempt = true;

CREATE INDEX IF NOT EXISTS idx_florida_parcels_high_value 
    ON florida_parcels (county, municipality) 
    WHERE assessed_value > 500000;

CREATE INDEX IF NOT EXISTS idx_florida_parcels_flood_zones 
    ON florida_parcels (county, municipality, assessed_value) 
    WHERE flood_zone_type IN ('A', 'AE', 'V', 'VE');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_florida_parcels_updated_at 
    BEFORE UPDATE ON florida_parcels 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically calculate centroid
CREATE OR REPLACE FUNCTION calculate_centroid()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.geom IS NOT NULL THEN
        NEW.centroid = ST_Centroid(NEW.geom);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_parcel_centroid 
    BEFORE INSERT OR UPDATE ON florida_parcels 
    FOR EACH ROW EXECUTE FUNCTION calculate_centroid();

-- Create view for summary statistics
CREATE OR REPLACE VIEW florida_parcels_summary AS
SELECT 
    county,
    COUNT(*) as parcel_count,
    COUNT(DISTINCT municipality) as municipality_count,
    COUNT(DISTINCT subdivision) as subdivision_count,
    AVG(assessed_value) as avg_assessed_value,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY assessed_value) as median_assessed_value,
    MIN(assessed_value) as min_assessed_value,
    MAX(assessed_value) as max_assessed_value,
    SUM(assessed_value) as total_assessed_value,
    AVG(acreage) as avg_acreage,
    SUM(acreage) as total_acreage,
    COUNT(*) FILTER (WHERE homestead_exempt = true) as homestead_count,
    COUNT(*) FILTER (WHERE flood_zone_type IN ('A', 'AE', 'V', 'VE')) as flood_zone_count,
    AVG(year_built) FILTER (WHERE year_built > 0) as avg_year_built,
    COUNT(DISTINCT land_use_category) as land_use_categories
FROM florida_parcels
GROUP BY county;

-- Create view for high-value properties
CREATE OR REPLACE VIEW florida_parcels_high_value AS
SELECT 
    parcel_id,
    county,
    municipality,
    owner_name,
    property_address,
    assessed_value,
    market_value,
    land_use_category,
    year_built,
    building_area,
    acreage,
    homestead_exempt,
    flood_zone_type,
    last_sale_date,
    last_sale_price,
    geom
FROM florida_parcels
WHERE assessed_value > 1000000
ORDER BY assessed_value DESC;

-- Create view for flood risk properties
CREATE OR REPLACE VIEW florida_parcels_flood_risk AS
SELECT 
    parcel_id,
    county,
    municipality,
    property_address,
    assessed_value,
    flood_zone,
    flood_zone_type,
    hurricane_zone,
    evacuation_zone,
    coastal_construction_line,
    geom
FROM florida_parcels
WHERE flood_zone_type IN ('A', 'AE', 'AH', 'AO', 'AR', 'A99', 'V', 'VE')
   OR hurricane_zone IS NOT NULL
   OR evacuation_zone IS NOT NULL
   OR coastal_construction_line = true;

-- Create materialized view for performance
CREATE MATERIALIZED VIEW florida_parcels_county_stats AS
SELECT 
    county,
    COUNT(*) as total_parcels,
    COUNT(DISTINCT municipality) as municipalities,
    AVG(assessed_value) as avg_assessed_value,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY assessed_value) as median_assessed_value,
    SUM(assessed_value) as total_assessed_value,
    SUM(acreage) as total_acreage,
    COUNT(*) FILTER (WHERE homestead_exempt = true) as homestead_parcels,
    COUNT(*) FILTER (WHERE flood_zone_type IN ('A', 'AE', 'V', 'VE')) as flood_zone_parcels,
    COUNT(*) FILTER (WHERE assessed_value > 500000) as high_value_parcels,
    COUNT(*) FILTER (WHERE land_use_category = 'residential') as residential_parcels,
    COUNT(*) FILTER (WHERE land_use_category = 'commercial') as commercial_parcels,
    COUNT(*) FILTER (WHERE land_use_category = 'industrial') as industrial_parcels,
    MAX(updated_at) as last_updated
FROM florida_parcels
GROUP BY county;

-- Create unique index on materialized view
CREATE UNIQUE INDEX ON florida_parcels_county_stats (county);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_parcels_stats()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY florida_parcels_county_stats;
END;
$$ LANGUAGE plpgsql;

-- Create comments for documentation
COMMENT ON TABLE florida_parcels IS 'Florida property parcel data from FDOT with spatial and assessment information';
COMMENT ON COLUMN florida_parcels.parcel_id IS 'Unique identifier for the parcel';
COMMENT ON COLUMN florida_parcels.county IS 'County where the parcel is located';
COMMENT ON COLUMN florida_parcels.geom IS 'Polygon geometry of the parcel boundary';
COMMENT ON COLUMN florida_parcels.centroid IS 'Point geometry of the parcel centroid';
COMMENT ON COLUMN florida_parcels.assessed_value IS 'Current assessed value for tax purposes';
COMMENT ON COLUMN florida_parcels.market_value IS 'Estimated market value';
COMMENT ON COLUMN florida_parcels.flood_zone_type IS 'FEMA flood zone designation';
COMMENT ON COLUMN florida_parcels.homestead_exempt IS 'Whether the property has homestead exemption';
COMMENT ON COLUMN florida_parcels.data_quality_score IS 'Quality score from 0-100 based on data completeness';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT ON florida_parcels TO anon, authenticated;
-- GRANT SELECT ON florida_parcels_summary TO anon, authenticated;
-- GRANT SELECT ON florida_parcels_high_value TO authenticated;
-- GRANT SELECT ON florida_parcels_flood_risk TO anon, authenticated;
-- GRANT SELECT ON florida_parcels_county_stats TO anon, authenticated;

-- Create RLS policies (uncomment and adjust as needed)
-- ALTER TABLE florida_parcels ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Public parcels are viewable by everyone" ON florida_parcels
--     FOR SELECT USING (true);
-- 
-- CREATE POLICY "Authenticated users can view all data" ON florida_parcels
--     FOR SELECT TO authenticated USING (true);

-- Analyze tables for query optimization
ANALYZE florida_parcels;
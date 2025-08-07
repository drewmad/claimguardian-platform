#!/bin/bash

# Script to apply geospatial schema to ClaimGuardian database
# This creates tables for Florida Open Data Portal integration

set -e

echo "🌍 Applying geospatial schema for Florida data integration..."

# Load environment variables more safely
if [ -f .env.local ]; then
    # Extract specific variables we need
    SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d '=' -f2)
    SUPABASE_PASSWORD=$(grep "^SUPABASE_PASSWORD=" .env.local | cut -d '=' -f2)

    # Construct DATABASE_URL if not found
    if [ -z "$DATABASE_URL" ]; then
        DATABASE_URL="postgresql://postgres:${SUPABASE_PASSWORD}@db.tmlrvecuwgppbaynesji.supabase.co:5432/postgres"
    fi
fi

# Create SQL script with the geospatial schema
cat > /tmp/geospatial_schema.sql << 'EOF'
-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create schema for geospatial data
CREATE SCHEMA IF NOT EXISTS geospatial;

-- Set search path to include geospatial schema
SET search_path TO public, geospatial;

-- =====================================================
-- CORE CADASTRAL DATA
-- =====================================================

-- Florida parcels table (optimized version of existing florida_parcels)
CREATE TABLE IF NOT EXISTS geospatial.parcels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parcel_id VARCHAR(50) UNIQUE NOT NULL,
    county_fips VARCHAR(5) NOT NULL,
    county_name VARCHAR(50) NOT NULL,
    property_address TEXT,
    owner_name TEXT,
    owner_address TEXT,
    property_use_code VARCHAR(10),
    assessed_value NUMERIC(12,2),
    taxable_value NUMERIC(12,2),
    year_built INTEGER,
    living_area INTEGER,
    land_area NUMERIC(10,2),
    geom GEOMETRY(MultiPolygon, 4326) NOT NULL,
    raw_data JSONB, -- Store complete original data
    data_source VARCHAR(50) DEFAULT 'FL_OPEN_DATA',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial and lookup indexes
CREATE INDEX idx_parcels_geom ON geospatial.parcels USING GIST (geom);
CREATE INDEX idx_parcels_parcel_id ON geospatial.parcels(parcel_id);
CREATE INDEX idx_parcels_county ON geospatial.parcels(county_fips, county_name);
CREATE INDEX idx_parcels_owner ON geospatial.parcels(owner_name);

-- =====================================================
-- HAZARD DATA
-- =====================================================

-- Hazard type definitions
CREATE TABLE IF NOT EXISTS geospatial.hazard_types (
    code VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- flood, fire, wind, surge
    source_agency VARCHAR(100),
    description TEXT,
    risk_weight NUMERIC(3,2) DEFAULT 1.0, -- For composite risk scoring
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard hazard types
INSERT INTO geospatial.hazard_types (code, name, category, source_agency, description) VALUES
    ('FEMA_FLOOD_AE', 'FEMA Flood Zone AE', 'flood', 'FEMA', '1% annual chance flood with BFE'),
    ('FEMA_FLOOD_VE', 'FEMA Flood Zone VE', 'flood', 'FEMA', 'Coastal high hazard area'),
    ('FEMA_FLOOD_X', 'FEMA Flood Zone X', 'flood', 'FEMA', 'Minimal flood hazard'),
    ('STORM_SURGE_1', 'Category 1 Storm Surge', 'surge', 'NOAA', 'Cat 1 hurricane surge zone'),
    ('STORM_SURGE_2', 'Category 2 Storm Surge', 'surge', 'NOAA', 'Cat 2 hurricane surge zone'),
    ('STORM_SURGE_3', 'Category 3 Storm Surge', 'surge', 'NOAA', 'Cat 3 hurricane surge zone'),
    ('STORM_SURGE_4', 'Category 4 Storm Surge', 'surge', 'NOAA', 'Cat 4 hurricane surge zone'),
    ('STORM_SURGE_5', 'Category 5 Storm Surge', 'surge', 'NOAA', 'Cat 5 hurricane surge zone'),
    ('WILDFIRE_HIGH', 'High Wildfire Risk', 'fire', 'FL Forest Service', 'High wildfire risk area'),
    ('WILDFIRE_MEDIUM', 'Medium Wildfire Risk', 'fire', 'FL Forest Service', 'Medium wildfire risk area'),
    ('WIND_ZONE_1', 'Wind Zone 1', 'wind', 'FL Building Code', 'Highest wind speed zone')
ON CONFLICT (code) DO NOTHING;

-- Hazard zones with geometries
CREATE TABLE IF NOT EXISTS geospatial.hazard_zones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hazard_type_code VARCHAR(30) REFERENCES geospatial.hazard_types(code),
    zone_name VARCHAR(100),
    zone_attributes JSONB, -- Flexible storage for zone-specific data
    geom GEOMETRY(MultiPolygon, 4326) NOT NULL,
    effective_date DATE,
    expiration_date DATE,
    data_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hazard_zones_geom ON geospatial.hazard_zones USING GIST (geom);
CREATE INDEX idx_hazard_zones_type ON geospatial.hazard_zones(hazard_type_code);
CREATE INDEX idx_hazard_zones_dates ON geospatial.hazard_zones(effective_date, expiration_date);

-- =====================================================
-- INFRASTRUCTURE DATA
-- =====================================================

-- Critical facilities (fire stations, hospitals, etc.)
CREATE TABLE IF NOT EXISTS geospatial.critical_facilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_type VARCHAR(50) NOT NULL, -- fire_station, hospital, police, shelter
    name VARCHAR(200) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    capacity INTEGER,
    attributes JSONB, -- Additional facility-specific data
    geom GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_critical_facilities_geom ON geospatial.critical_facilities USING GIST (geom);
CREATE INDEX idx_critical_facilities_type ON geospatial.critical_facilities(facility_type);

-- =====================================================
-- ACTIVE EVENTS (Real-time data)
-- =====================================================

-- Active hazard events (wildfires, storms, etc.)
CREATE TABLE IF NOT EXISTS geospatial.active_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- wildfire, hurricane, flood
    event_name VARCHAR(200),
    status VARCHAR(50) DEFAULT 'active', -- active, contained, resolved
    severity VARCHAR(20),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    attributes JSONB, -- Event-specific data
    geom GEOMETRY(Geometry, 4326) NOT NULL, -- Can be point, line, or polygon
    data_source VARCHAR(100),
    external_id VARCHAR(100), -- ID from source system
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_active_events_geom ON geospatial.active_events USING GIST (geom);
CREATE INDEX idx_active_events_status ON geospatial.active_events(status, event_type);
CREATE INDEX idx_active_events_time ON geospatial.active_events(start_time, end_time);

-- =====================================================
-- RISK ANALYSIS TABLES
-- =====================================================

-- Pre-computed parcel risk assessments
CREATE TABLE IF NOT EXISTS geospatial.parcel_risk_assessment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parcel_id VARCHAR(50) REFERENCES geospatial.parcels(parcel_id) ON DELETE CASCADE,
    assessment_date DATE DEFAULT CURRENT_DATE,
    flood_risk_score NUMERIC(3,2), -- 0.0 to 1.0
    wildfire_risk_score NUMERIC(3,2),
    wind_risk_score NUMERIC(3,2),
    surge_risk_score NUMERIC(3,2),
    composite_risk_score NUMERIC(3,2), -- Weighted average
    risk_factors JSONB, -- Detailed breakdown
    nearest_fire_station_distance NUMERIC(8,2), -- in meters
    nearest_hospital_distance NUMERIC(8,2),
    hazard_zones JSONB, -- Array of hazard zone IDs affecting this parcel
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parcel_id, assessment_date)
);

CREATE INDEX idx_parcel_risk_parcel ON geospatial.parcel_risk_assessment(parcel_id);
CREATE INDEX idx_parcel_risk_date ON geospatial.parcel_risk_assessment(assessment_date);
CREATE INDEX idx_parcel_risk_composite ON geospatial.parcel_risk_assessment(composite_risk_score);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to calculate distance to nearest facility
CREATE OR REPLACE FUNCTION geospatial.distance_to_nearest_facility(
    p_geom GEOMETRY,
    p_facility_type VARCHAR
) RETURNS NUMERIC AS $$
DECLARE
    v_distance NUMERIC;
BEGIN
    SELECT MIN(ST_Distance(p_geom::geography, cf.geom::geography))
    INTO v_distance
    FROM geospatial.critical_facilities cf
    WHERE cf.facility_type = p_facility_type;

    RETURN COALESCE(v_distance, 999999); -- Return large number if no facility found
END;
$$ LANGUAGE plpgsql;

-- Function to get all hazard zones for a geometry
CREATE OR REPLACE FUNCTION geospatial.get_hazard_zones(
    p_geom GEOMETRY
) RETURNS JSONB AS $$
DECLARE
    v_hazards JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'hazard_type', ht.name,
            'category', ht.category,
            'zone_name', hz.zone_name,
            'risk_weight', ht.risk_weight,
            'attributes', hz.zone_attributes
        )
    )
    INTO v_hazards
    FROM geospatial.hazard_zones hz
    JOIN geospatial.hazard_types ht ON hz.hazard_type_code = ht.code
    WHERE ST_Intersects(p_geom, hz.geom)
    AND (hz.expiration_date IS NULL OR hz.expiration_date > CURRENT_DATE);

    RETURN COALESCE(v_hazards, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate composite risk score
CREATE OR REPLACE FUNCTION geospatial.calculate_risk_score(
    p_parcel_id VARCHAR
) RETURNS TABLE (
    flood_risk NUMERIC,
    wildfire_risk NUMERIC,
    wind_risk NUMERIC,
    surge_risk NUMERIC,
    composite_risk NUMERIC,
    risk_factors JSONB
) AS $$
DECLARE
    v_geom GEOMETRY;
    v_hazards JSONB;
    v_flood_risk NUMERIC := 0;
    v_wildfire_risk NUMERIC := 0;
    v_wind_risk NUMERIC := 0;
    v_surge_risk NUMERIC := 0;
    v_composite NUMERIC := 0;
    v_factors JSONB := '[]'::jsonb;
BEGIN
    -- Get parcel geometry
    SELECT geom INTO v_geom FROM geospatial.parcels WHERE parcel_id = p_parcel_id;

    IF v_geom IS NULL THEN
        RETURN;
    END IF;

    -- Get all hazard zones
    v_hazards := geospatial.get_hazard_zones(v_geom);

    -- Calculate risk scores by category
    SELECT
        COALESCE(MAX(CASE WHEN h->>'category' = 'flood' THEN (h->>'risk_weight')::numeric ELSE 0 END), 0),
        COALESCE(MAX(CASE WHEN h->>'category' = 'fire' THEN (h->>'risk_weight')::numeric ELSE 0 END), 0),
        COALESCE(MAX(CASE WHEN h->>'category' = 'wind' THEN (h->>'risk_weight')::numeric ELSE 0 END), 0),
        COALESCE(MAX(CASE WHEN h->>'category' = 'surge' THEN (h->>'risk_weight')::numeric ELSE 0 END), 0)
    INTO v_flood_risk, v_wildfire_risk, v_wind_risk, v_surge_risk
    FROM jsonb_array_elements(v_hazards) h;

    -- Calculate composite score (weighted average)
    v_composite := (v_flood_risk * 0.3 + v_wildfire_risk * 0.2 + v_wind_risk * 0.25 + v_surge_risk * 0.25);

    -- Build risk factors JSON
    v_factors := jsonb_build_object(
        'hazard_zones', v_hazards,
        'fire_station_distance', geospatial.distance_to_nearest_facility(v_geom, 'fire_station'),
        'hospital_distance', geospatial.distance_to_nearest_facility(v_geom, 'hospital')
    );

    RETURN QUERY SELECT v_flood_risk, v_wildfire_risk, v_wind_risk, v_surge_risk, v_composite, v_factors;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR EASY ACCESS
-- =====================================================

-- View for parcels with current risk assessment
CREATE OR REPLACE VIEW geospatial.parcels_with_risk AS
SELECT
    p.*,
    pra.flood_risk_score,
    pra.wildfire_risk_score,
    pra.wind_risk_score,
    pra.surge_risk_score,
    pra.composite_risk_score,
    pra.risk_factors,
    pra.assessment_date
FROM geospatial.parcels p
LEFT JOIN LATERAL (
    SELECT * FROM geospatial.parcel_risk_assessment
    WHERE parcel_id = p.parcel_id
    ORDER BY assessment_date DESC
    LIMIT 1
) pra ON true;

-- View for active events with affected parcels count
CREATE OR REPLACE VIEW geospatial.active_events_impact AS
SELECT
    ae.*,
    COUNT(DISTINCT p.parcel_id) as affected_parcels_count,
    jsonb_agg(DISTINCT p.parcel_id) FILTER (WHERE p.parcel_id IS NOT NULL) as affected_parcel_ids
FROM geospatial.active_events ae
LEFT JOIN geospatial.parcels p ON ST_Intersects(ae.geom, p.geom)
WHERE ae.status = 'active'
GROUP BY ae.id;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE geospatial.parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE geospatial.hazard_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE geospatial.critical_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE geospatial.active_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE geospatial.parcel_risk_assessment ENABLE ROW LEVEL SECURITY;

-- Public read access for reference data
CREATE POLICY "Public read access to hazard zones" ON geospatial.hazard_zones
    FOR SELECT USING (true);

CREATE POLICY "Public read access to critical facilities" ON geospatial.critical_facilities
    FOR SELECT USING (true);

CREATE POLICY "Public read access to active events" ON geospatial.active_events
    FOR SELECT USING (true);

-- Parcel access based on property ownership
CREATE POLICY "Users can view parcels they own" ON geospatial.parcels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE properties.user_id = auth.uid()
            AND properties.parcel_id = parcels.parcel_id
        )
        OR auth.jwt()->>'role' = 'service_role'
    );

-- Risk assessment access
CREATE POLICY "Users can view risk assessments for their parcels" ON geospatial.parcel_risk_assessment
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE properties.user_id = auth.uid()
            AND properties.parcel_id = parcel_risk_assessment.parcel_id
        )
        OR auth.jwt()->>'role' = 'service_role'
    );

-- =====================================================
-- INTEGRATION WITH EXISTING SCHEMA
-- =====================================================

-- Add parcel_id to properties table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'properties'
        AND column_name = 'parcel_id'
    ) THEN
        ALTER TABLE public.properties
        ADD COLUMN parcel_id VARCHAR(50),
        ADD CONSTRAINT fk_properties_parcel
            FOREIGN KEY (parcel_id)
            REFERENCES geospatial.parcels(parcel_id);

        CREATE INDEX idx_properties_parcel ON public.properties(parcel_id);
    END IF;
END $$;

-- Add risk scores to properties view
CREATE OR REPLACE VIEW public.properties_with_risk AS
SELECT
    p.*,
    pr.flood_risk_score,
    pr.wildfire_risk_score,
    pr.wind_risk_score,
    pr.surge_risk_score,
    pr.composite_risk_score,
    pr.risk_factors
FROM public.properties p
LEFT JOIN geospatial.parcels_with_risk pr ON p.parcel_id = pr.parcel_id;

-- Grant permissions
GRANT USAGE ON SCHEMA geospatial TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA geospatial TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA geospatial TO authenticated;

EOF

# Apply the schema
if [ -n "$DATABASE_URL" ]; then
    echo "📤 Applying schema via DATABASE_URL..."
    psql "$DATABASE_URL" -f /tmp/geospatial_schema.sql
elif [ -n "$SUPABASE_DB_URL" ]; then
    echo "📤 Applying schema via SUPABASE_DB_URL..."
    psql "$SUPABASE_DB_URL" -f /tmp/geospatial_schema.sql
else
    echo "❌ Error: No database connection URL found"
    echo "Please set DATABASE_URL or SUPABASE_DB_URL in your .env.local file"
    exit 1
fi

# Clean up
rm -f /tmp/geospatial_schema.sql

echo "✅ Geospatial schema applied successfully!"
echo ""
echo "Next steps:"
echo "1. Run data acquisition scripts to populate the tables"
echo "2. Set up ETL pipelines for automated updates"
echo "3. Create server actions for risk assessment queries"
echo "4. Build UI components for risk visualization"

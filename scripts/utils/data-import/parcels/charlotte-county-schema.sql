-- Enhanced Florida Parcel Database Schema
-- Optimized for Charlotte County Phase 1 Testing

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main properties table (hybrid spatial + AI)
CREATE TABLE IF NOT EXISTS properties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id text UNIQUE NOT NULL,
    county_fips text NOT NULL,
    
    -- Spatial data (PostGIS)
    geometry geometry(POLYGON, 4326),
    centroid geometry(POINT, 4326),
    simplified_geom geometry(POLYGON, 4326), -- For fast rendering
    
    -- AI-optimized spatial data
    coordinates jsonb NOT NULL, -- {"lat": 28.5, "lng": -81.3}
    bbox jsonb NOT NULL, -- {"n": 28.6, "s": 28.4, "e": -81.2, "w": -81.4}
    geojson jsonb, -- Full GeoJSON for AI
    simple_wkt text, -- Simplified WKT string
    
    -- Pre-computed metrics
    area_sqft numeric,
    area_acres numeric,
    perimeter_ft numeric,
    
    -- Core property data
    address text,
    owner_name text,
    owner_address jsonb, -- {"street": "", "city": "", "state": "", "zip": ""}
    property_value numeric,
    assessed_value numeric,
    year_built integer,
    
    -- AI-ready features
    spatial_features jsonb DEFAULT '{}', -- {"coastal": true, "flood_zone": "X", "hurricane_risk": 0.7}
    risk_factors jsonb DEFAULT '{}', -- {"hurricane": 0.7, "flood": 0.3, "wildfire": 0.1}
    property_features jsonb DEFAULT '{}', -- {"bedrooms": 3, "bathrooms": 2, "square_feet": 1800}
    
    -- Vector embeddings for AI similarity search
    feature_vector vector(384), -- OpenAI embeddings (384-dim)
    description_vector vector(384), -- Address/description embeddings
    
    -- ETL metadata
    source_file text,
    import_batch_id uuid,
    data_vintage date, -- When data was collected by state
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Staging table (exact mirror for atomic swaps)
CREATE TABLE IF NOT EXISTS stg_properties (LIKE properties INCLUDING ALL);

-- Import metadata tracking
CREATE TABLE IF NOT EXISTS import_batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name text NOT NULL,
    county_fips text,
    status text CHECK (status IN ('running', 'completed', 'failed')),
    records_processed integer DEFAULT 0,
    records_succeeded integer DEFAULT 0,
    records_failed integer DEFAULT 0,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    error_details jsonb,
    source_files text[],
    data_vintage date
);

-- County reference data
CREATE TABLE IF NOT EXISTS florida_counties (
    fips_code text PRIMARY KEY,
    county_name text NOT NULL,
    region text, -- North, Central, South, Southwest
    population integer,
    area_sq_miles numeric,
    coastal boolean DEFAULT false,
    hurricane_risk_level text, -- Low, Medium, High
    last_processed timestamptz,
    processing_priority integer DEFAULT 5 -- 1=highest, 10=lowest
);

-- Insert Charlotte County data
INSERT INTO florida_counties (fips_code, county_name, region, population, area_sq_miles, coastal, hurricane_risk_level, processing_priority)
VALUES ('12015', 'Charlotte', 'Southwest', 188910, 694, true, 'High', 1)
ON CONFLICT (fips_code) DO UPDATE SET
    county_name = EXCLUDED.county_name,
    region = EXCLUDED.region,
    population = EXCLUDED.population,
    area_sq_miles = EXCLUDED.area_sq_miles,
    coastal = EXCLUDED.coastal,
    hurricane_risk_level = EXCLUDED.hurricane_risk_level,
    processing_priority = EXCLUDED.processing_priority;

-- Spatial relationships for AI
CREATE TABLE IF NOT EXISTS spatial_relationships (
    property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
    relationship_type text NOT NULL, -- 'nearest_hospital', 'flood_zone', 'school_district'
    related_feature jsonb,
    distance_miles numeric,
    confidence_score numeric DEFAULT 1.0,
    computed_at timestamptz DEFAULT now(),
    PRIMARY KEY (property_id, relationship_type)
);

-- AI model predictions cache
CREATE TABLE IF NOT EXISTS ai_predictions (
    property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
    model_name text NOT NULL, -- 'hurricane_risk_v2', 'property_value_estimator'
    predictions jsonb,
    confidence_score numeric,
    model_version text,
    computed_at timestamptz DEFAULT now(),
    PRIMARY KEY (property_id, model_name)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_properties_geometry ON properties USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_properties_centroid ON properties USING GIST (centroid);
CREATE INDEX IF NOT EXISTS idx_properties_simplified_geom ON properties USING GIST (simplified_geom);

-- Vector similarity search (will be created after we have data)
-- CREATE INDEX IF NOT EXISTS idx_properties_feature_vector ON properties USING hnsw (feature_vector vector_cosine_ops);
-- CREATE INDEX IF NOT EXISTS idx_properties_description_vector ON properties USING hnsw (description_vector vector_cosine_ops);

-- Query optimization
CREATE INDEX IF NOT EXISTS idx_properties_county_fips ON properties(county_fips);
CREATE INDEX IF NOT EXISTS idx_properties_parcel_id ON properties(parcel_id);
CREATE INDEX IF NOT EXISTS idx_properties_coordinates ON properties USING GIN (coordinates);
CREATE INDEX IF NOT EXISTS idx_properties_spatial_features ON properties USING GIN (spatial_features);
CREATE INDEX IF NOT EXISTS idx_properties_risk_factors ON properties USING GIN (risk_factors);

-- ETL tracking
CREATE INDEX IF NOT EXISTS idx_properties_import_batch ON properties(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_properties_data_vintage ON properties(data_vintage);

-- AI-optimized views
CREATE OR REPLACE VIEW properties_ai_ready AS
SELECT
    p.id,
    p.parcel_id,
    p.county_fips,
    
    -- Spatial data for AI
    ST_Y(p.centroid) as latitude,
    ST_X(p.centroid) as longitude,
    p.coordinates,
    p.bbox,
    ST_AsGeoJSON(p.simplified_geom)::jsonb as simple_geojson,
    
    -- Computed metrics
    p.area_acres,
    p.area_sqft,
    ROUND(p.perimeter_ft::numeric, 2) as perimeter_ft,
    
    -- Property details
    p.address,
    p.owner_name,
    p.owner_address,
    p.property_value,
    p.assessed_value,
    p.year_built,
    
    -- AI features (flattened)
    p.spatial_features,
    p.risk_factors,
    p.property_features,
    
    -- Derived classifications
    CASE
        WHEN p.spatial_features->>'coastal' = 'true' THEN 'coastal'
        WHEN p.spatial_features->>'waterfront' = 'true' THEN 'waterfront'
        WHEN p.spatial_features->>'urban' = 'true' THEN 'urban'
        ELSE 'suburban'
    END as location_classification,
    
    CASE
        WHEN (p.risk_factors->>'hurricane')::numeric > 0.7 THEN 'high_risk'
        WHEN (p.risk_factors->>'hurricane')::numeric > 0.4 THEN 'medium_risk'
        ELSE 'low_risk'
    END as hurricane_risk_classification,
    
    -- Vectors for similarity search
    p.feature_vector,
    p.description_vector,
    
    -- Metadata
    p.data_vintage,
    p.updated_at

FROM properties p
WHERE p.geometry IS NOT NULL;

-- County-level aggregations for monitoring
CREATE MATERIALIZED VIEW IF NOT EXISTS county_import_summary AS
SELECT
    fc.county_name,
    fc.fips_code,
    fc.region,
    COUNT(p.id) as total_properties,
    AVG(p.property_value) as avg_property_value,
    AVG((p.risk_factors->>'hurricane')::numeric) as avg_hurricane_risk,
    COUNT(*) FILTER (WHERE p.spatial_features->>'coastal' = 'true') as coastal_properties,
    MAX(p.updated_at) as last_updated,
    SUM(p.area_acres) as total_acres
FROM florida_counties fc
LEFT JOIN properties p ON fc.fips_code = p.county_fips
GROUP BY fc.county_name, fc.fips_code, fc.region;

-- Functions
CREATE OR REPLACE FUNCTION atomic_properties_swap()
RETURNS jsonb AS $
DECLARE
    staging_count integer;
    production_count integer;
    result jsonb := '{}';
BEGIN
    -- Validate staging data
    SELECT COUNT(*) INTO staging_count FROM stg_properties;
    SELECT COUNT(*) INTO production_count FROM properties;
    
    IF staging_count = 0 THEN
        RAISE EXCEPTION 'Staging table is empty - aborting swap';
    END IF;
    
    IF staging_count < (production_count * 0.5) AND production_count > 0 THEN
        RAISE EXCEPTION 'Staging data seems incomplete (% vs % records) - aborting swap', 
            staging_count, production_count;
    END IF;
    
    -- Perform atomic swap
    BEGIN
        ALTER TABLE properties RENAME TO properties_backup;
        ALTER TABLE stg_properties RENAME TO properties;
        
        -- Rebuild critical indexes
        REINDEX INDEX idx_properties_geometry;
        REINDEX INDEX idx_properties_centroid;
        
        -- Refresh materialized views
        REFRESH MATERIALIZED VIEW county_import_summary;
        
        -- Clean up backup
        DROP TABLE properties_backup;
        
        result := jsonb_build_object(
            'success', true,
            'old_count', production_count,
            'new_count', staging_count,
            'swapped_at', now()
        );
        
    EXCEPTION WHEN OTHERS THEN
        -- Rollback on error
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties_backup') THEN
            DROP TABLE IF EXISTS properties;
            ALTER TABLE properties_backup RENAME TO properties;
        END IF;
        RAISE;
    END;
    
    RETURN result;
END;
$ LANGUAGE plpgsql;

-- Properties within radius function
CREATE OR REPLACE FUNCTION properties_within_radius(
    center_lat double precision,
    center_lng double precision,
    radius_miles double precision
)
RETURNS TABLE (
    id uuid,
    parcel_id text,
    distance_miles double precision
)
LANGUAGE sql STABLE
AS $$
    SELECT 
        p.id,
        p.parcel_id,
        ST_Distance(
            ST_Point(center_lng, center_lat)::geography,
            p.centroid::geography
        ) / 1609.34 AS distance_miles
    FROM properties p
    WHERE ST_DWithin(
        ST_Point(center_lng, center_lat)::geography,
        p.centroid::geography,
        radius_miles * 1609.34
    )
    ORDER BY distance_miles;
$$;
-- ============================================================================
-- FLORIDA DATA PLATFORM DEPLOYMENT SCRIPT
-- Execute this in Supabase SQL Editor to deploy the complete platform
-- ============================================================================

-- STEP 1: Enable Extensions
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;  
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- STEP 2: Create FLOIR Data Types
CREATE TYPE public.floir_data_type AS ENUM (
    'catastrophe',
    'industry_reports', 
    'professional_liability',
    'data_call',
    'licensee_search',
    'rate_filings',
    'receivership',
    'financial_reports',
    'news_bulletins',
    'surplus_lines'
);

CREATE TYPE public.crawl_status AS ENUM (
    'pending',
    'running', 
    'completed',
    'failed',
    'cancelled'
);

CREATE TYPE public.parcel_data_source AS ENUM (
    'fl_dor_statewide',
    'fl_county_charlotte',
    'fl_county_lee', 
    'fl_county_sarasota',
    'fl_county_miami_dade',
    'fl_county_broward',
    'fl_county_palm_beach',
    'fl_county_hillsborough',
    'fl_county_pinellas',
    'fl_county_orange',
    'fl_county_duval'
);

CREATE TYPE public.import_status AS ENUM (
    'pending',
    'downloading',
    'validating',
    'transforming',
    'importing',
    'completed',
    'failed',
    'cancelled'
);

-- STEP 3: Create Core FLOIR Tables
CREATE TABLE IF NOT EXISTS public.floir_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type public.floir_data_type NOT NULL,
    primary_key text NOT NULL,
    raw_data jsonb NOT NULL,
    normalized_data jsonb,
    embedding vector(1536),
    content_hash text,
    source_url text,
    pdf_content text,
    extracted_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    UNIQUE(data_type, primary_key)
);

CREATE TABLE IF NOT EXISTS public.crawl_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type public.floir_data_type NOT NULL,
    status public.crawl_status DEFAULT 'pending',
    records_processed integer DEFAULT 0,
    records_updated integer DEFAULT 0,
    records_created integer DEFAULT 0,
    errors jsonb,
    error_count integer DEFAULT 0,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    duration_seconds integer,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- STEP 4: Create Property Tables
CREATE TABLE IF NOT EXISTS public.properties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id text UNIQUE NOT NULL,
    data_source public.parcel_data_source NOT NULL,
    
    -- Spatial data (PostGIS)
    geometry geometry(POLYGON, 4326),
    centroid geometry(POINT, 4326),
    simplified_geometry geometry(POLYGON, 4326),
    
    -- Pre-computed spatial metrics
    area_sqft numeric,
    area_acres numeric GENERATED ALWAYS AS (area_sqft / 43560) STORED,
    perimeter_ft numeric,
    
    -- Coordinate data (JSON for AI consumption)
    coordinates jsonb,
    bbox jsonb,
    geojson jsonb,
    simplified_wkt text,
    
    -- Property information
    address text,
    street_number text,
    street_name text,
    city text,
    county text,
    state text DEFAULT 'FL',
    zip_code text,
    
    -- Ownership data
    owner_name text,
    owner_address text,
    
    -- Valuation data  
    property_value numeric,
    assessed_value numeric,
    market_value numeric,
    
    -- Property characteristics
    property_type text,
    year_built integer,
    
    -- AI-ready features
    spatial_features jsonb,
    risk_factors jsonb,
    feature_vector vector(1536),
    
    -- Metadata
    import_batch_id uuid,
    data_vintage date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create staging table for atomic imports
CREATE TABLE IF NOT EXISTS public.stg_properties (LIKE public.properties INCLUDING ALL);

-- STEP 5: Create Supporting Tables
CREATE TABLE IF NOT EXISTS public.parcel_import_batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    data_source public.parcel_data_source NOT NULL,
    status public.import_status DEFAULT 'pending',
    
    total_records integer DEFAULT 0,
    processed_records integer DEFAULT 0,
    valid_records integer DEFAULT 0,
    invalid_records integer DEFAULT 0,
    
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    duration_seconds integer,
    
    errors jsonb,
    warnings jsonb
);

-- STEP 6: Create Indexes
CREATE INDEX IF NOT EXISTS idx_floir_data_type ON public.floir_data(data_type);
CREATE INDEX IF NOT EXISTS idx_floir_data_extracted_at ON public.floir_data(extracted_at DESC);
CREATE INDEX IF NOT EXISTS idx_floir_embedding_vector ON public.floir_data USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_properties_geometry ON public.properties USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_properties_centroid ON public.properties USING GIST (centroid);
CREATE INDEX IF NOT EXISTS idx_properties_parcel_id ON public.properties (parcel_id);
CREATE INDEX IF NOT EXISTS idx_properties_feature_vector ON public.properties USING hnsw (feature_vector vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- STEP 7: Enable RLS and Create Policies
ALTER TABLE public.floir_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcel_import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Global FLOIR data read access" ON public.floir_data
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Service role FLOIR data write access" ON public.floir_data
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Public read access to properties" ON public.properties
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Service role write access to properties" ON public.properties
    FOR ALL USING (auth.role() = 'service_role');

-- STEP 8: Create Essential Functions
CREATE OR REPLACE FUNCTION public.search_floir_data(
    query_embedding vector(1536),
    data_types public.floir_data_type[] DEFAULT NULL,
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    data_type public.floir_data_type,
    primary_key text,
    normalized_data jsonb,
    source_url text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.data_type,
        f.primary_key,
        f.normalized_data,
        f.source_url,
        1 - (f.embedding <=> query_embedding) as similarity
    FROM public.floir_data f
    WHERE 
        f.embedding IS NOT NULL
        AND (data_types IS NULL OR f.data_type = ANY(data_types))
        AND 1 - (f.embedding <=> query_embedding) > match_threshold
    ORDER BY f.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- STEP 9: Grant Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.floir_data TO anon, authenticated;
GRANT ALL ON public.floir_data TO service_role;
GRANT SELECT ON public.properties TO anon, authenticated;
GRANT ALL ON public.properties TO service_role;
GRANT ALL ON public.stg_properties TO service_role;
GRANT SELECT ON public.crawl_runs TO authenticated;
GRANT ALL ON public.crawl_runs TO service_role;
GRANT SELECT ON public.parcel_import_batches TO authenticated;
GRANT ALL ON public.parcel_import_batches TO service_role;

-- Grant usage on custom types
GRANT USAGE ON TYPE public.floir_data_type TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.crawl_status TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.parcel_data_source TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.import_status TO anon, authenticated, service_role;

-- STEP 10: Verification Queries
DO $$
BEGIN
    -- Test vector extension
    PERFORM vector_dims('[1,2,3]'::vector);
    
    -- Test PostGIS extension  
    PERFORM ST_AsText(ST_Point(-82.0, 27.5));
    
    -- Verify tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'floir_data') THEN
        RAISE EXCEPTION 'floir_data table not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties') THEN
        RAISE EXCEPTION 'properties table not created';
    END IF;
    
    RAISE NOTICE '✅ Florida Data Platform deployment successful!';
    RAISE NOTICE 'Tables created: floir_data, properties, crawl_runs, parcel_import_batches';
    RAISE NOTICE 'Extensions enabled: vector, postgis, pg_cron, pg_net';
    RAISE NOTICE 'Ready for Edge Function deployment';
END $$;
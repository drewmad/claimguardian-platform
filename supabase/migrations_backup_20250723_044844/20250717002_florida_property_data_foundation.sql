-- Florida Property Data Foundation - Enhanced Schema
-- Creates comprehensive infrastructure for county-level data ingestion and AI processing

-- Step 1: Create dedicated schema for raw data (extends existing external schema)
CREATE SCHEMA IF NOT EXISTS external_raw_fl;
GRANT USAGE ON SCHEMA external_raw_fl TO postgres, anon, authenticated, service_role;

-- Step 2: Create scraper runs tracking table for incremental updates
CREATE TABLE IF NOT EXISTS public.scraper_runs (
    source TEXT PRIMARY KEY,
    last_object_id BIGINT DEFAULT 0,
    last_run_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT
);

-- Enable RLS for scraper_runs
ALTER TABLE public.scraper_runs ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access for automated scraping
CREATE POLICY "Allow service_role full access to scraper_runs"
ON public.scraper_runs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Step 3: Create the "data lake" table for raw county JSON data
CREATE TABLE IF NOT EXISTS external_raw_fl.property_data (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    source_record_id TEXT NOT NULL,
    raw_data JSONB NOT NULL,
    data_hash TEXT NOT NULL,
    scraped_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure uniqueness per source and record
ALTER TABLE external_raw_fl.property_data
ADD CONSTRAINT IF NOT EXISTS property_data_source_record_id_unique 
UNIQUE (source, source_record_id);

-- Grant permissions for automated processing
GRANT ALL ON TABLE external_raw_fl.property_data TO service_role;
GRANT ALL ON SEQUENCE external_raw_fl.property_data_id_seq TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_data_source ON external_raw_fl.property_data(source);
CREATE INDEX IF NOT EXISTS idx_property_data_scraped_at ON external_raw_fl.property_data(scraped_at);
CREATE INDEX IF NOT EXISTS idx_property_data_hash ON external_raw_fl.property_data(data_hash);
CREATE INDEX IF NOT EXISTS idx_property_data_raw_data ON external_raw_fl.property_data USING GIN(raw_data);

-- Step 4: Enhanced parcels table (replaces materialized view with proper table)
-- First, preserve any existing data from the materialized view
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parcels' AND table_type = 'VIEW') THEN
        -- Create temporary backup of existing materialized view data
        CREATE TEMP TABLE parcels_backup AS SELECT * FROM public.parcels;
        
        -- Drop the materialized view
        DROP MATERIALIZED VIEW public.parcels;
        
        -- Create the new table structure
        CREATE TABLE public.parcels (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            parcel_id TEXT NOT NULL,
            source TEXT NOT NULL,
            owner_name TEXT,
            situs_address TEXT,
            situs_city TEXT,
            situs_zip TEXT,
            property_use_code TEXT,
            year_built INTEGER,
            just_value NUMERIC(15, 2),
            assessed_value NUMERIC(15, 2),
            living_area_sqft INTEGER,
            geom GEOMETRY(Geometry, 4326),
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            raw_data_id BIGINT REFERENCES external_raw_fl.property_data(id)
        );
        
        -- Restore data if any existed (with adapted schema)
        IF EXISTS (SELECT 1 FROM parcels_backup LIMIT 1) THEN
            INSERT INTO public.parcels (
                parcel_id, source, owner_name, situs_address, 
                year_built, just_value, living_area_sqft, geom
            )
            SELECT 
                parcel_id, 
                COALESCE(source, 'legacy'),
                owner_name,
                situs_address,
                year_built,
                just_value,
                living_area::integer,
                geom
            FROM parcels_backup;
        END IF;
        
    ELSE
        -- Create the new table structure (no existing materialized view)
        CREATE TABLE IF NOT EXISTS public.parcels (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            parcel_id TEXT NOT NULL,
            source TEXT NOT NULL,
            owner_name TEXT,
            situs_address TEXT,
            situs_city TEXT,
            situs_zip TEXT,
            property_use_code TEXT,
            year_built INTEGER,
            just_value NUMERIC(15, 2),
            assessed_value NUMERIC(15, 2),
            living_area_sqft INTEGER,
            geom GEOMETRY(Geometry, 4326),
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            raw_data_id BIGINT REFERENCES external_raw_fl.property_data(id)
        );
    END IF;
END $$;

-- Create indexes for the parcels table
CREATE UNIQUE INDEX IF NOT EXISTS idx_parcels_parcel_id_source ON public.parcels (parcel_id, source);
CREATE INDEX IF NOT EXISTS idx_parcels_geom ON public.parcels USING gist (geom);
CREATE INDEX IF NOT EXISTS idx_parcels_owner_name ON public.parcels (owner_name);
CREATE INDEX IF NOT EXISTS idx_parcels_situs_address ON public.parcels (situs_address);
CREATE INDEX IF NOT EXISTS idx_parcels_year_built ON public.parcels (year_built);
CREATE INDEX IF NOT EXISTS idx_parcels_just_value ON public.parcels (just_value);
CREATE INDEX IF NOT EXISTS idx_parcels_property_use_code ON public.parcels (property_use_code);

-- Create updated_at trigger for parcels table
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_parcels_update ON public.parcels;
CREATE TRIGGER on_parcels_update
    BEFORE UPDATE ON public.parcels
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Enable RLS for parcels table
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;

-- Create policies for parcels table
CREATE POLICY "Allow public read-only access to parcels" 
ON public.parcels FOR SELECT USING (true);

CREATE POLICY "Allow service_role full access to parcels" 
ON public.parcels FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Step 5: Create function to get unprocessed parcels for normalization pipeline
CREATE OR REPLACE FUNCTION public.get_unprocessed_parcels()
RETURNS SETOF external_raw_fl.property_data AS $$
BEGIN
    RETURN QUERY
    SELECT r.*
    FROM external_raw_fl.property_data r
    LEFT JOIN public.parcels p ON r.source = p.source AND r.source_record_id = p.parcel_id
    WHERE p.id IS NULL
    ORDER BY r.scraped_at ASC
    LIMIT 1000; -- Process in batches for performance
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.get_unprocessed_parcels() TO service_role;

-- Step 6: Initialize scraper tracking for target counties
INSERT INTO public.scraper_runs (source, last_object_id, notes) VALUES 
    ('fl_charlotte_county', 0, 'Charlotte County parcel data scraper'),
    ('fl_lee_county', 0, 'Lee County parcel data scraper'),
    ('fl_sarasota_county', 0, 'Sarasota County parcel data scraper')
ON CONFLICT (source) DO NOTHING;

-- Step 7: Create data quality and monitoring functions
CREATE OR REPLACE FUNCTION public.get_parcel_stats()
RETURNS TABLE (
    source TEXT,
    total_records BIGINT,
    records_last_24h BIGINT,
    avg_processing_lag_hours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH raw_stats AS (
        SELECT 
            pd.source,
            COUNT(*) as total_raw,
            COUNT(*) FILTER (WHERE pd.scraped_at > now() - interval '24 hours') as raw_24h
        FROM external_raw_fl.property_data pd
        GROUP BY pd.source
    ),
    processed_stats AS (
        SELECT 
            p.source,
            COUNT(*) as total_processed,
            AVG(EXTRACT(epoch FROM (p.created_at - pd.scraped_at))/3600) as avg_lag_hours
        FROM public.parcels p
        JOIN external_raw_fl.property_data pd ON p.raw_data_id = pd.id
        GROUP BY p.source
    )
    SELECT 
        COALESCE(r.source, pr.source) as source,
        COALESCE(pr.total_processed, 0) as total_records,
        COALESCE(r.raw_24h, 0) as records_last_24h,
        COALESCE(pr.avg_lag_hours, 0) as avg_processing_lag_hours
    FROM raw_stats r
    FULL OUTER JOIN processed_stats pr ON r.source = pr.source
    ORDER BY source;
END;
$$ LANGUAGE plpgsql;

-- Grant access to monitoring function
GRANT EXECUTE ON FUNCTION public.get_parcel_stats() TO authenticated, service_role;

-- Step 8: Add comment documentation
COMMENT ON SCHEMA external_raw_fl IS 'Raw data lake for Florida county property data before normalization';
COMMENT ON TABLE external_raw_fl.property_data IS 'Raw JSON data from county ArcGIS services';
COMMENT ON TABLE public.scraper_runs IS 'Tracks incremental scraping state for each data source';
COMMENT ON TABLE public.parcels IS 'Normalized, clean property data for AI processing and user queries';
COMMENT ON FUNCTION public.get_unprocessed_parcels() IS 'Returns raw records that need normalization processing';
COMMENT ON FUNCTION public.get_parcel_stats() IS 'Monitoring function for data pipeline health and performance';
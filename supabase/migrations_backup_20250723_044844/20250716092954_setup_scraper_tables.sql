-- Step 1: Create a dedicated schema for raw data to keep it isolated.
CREATE SCHEMA IF NOT EXISTS external_raw_fl;
GRANT USAGE ON SCHEMA external_raw_fl TO postgres, anon, authenticated, service_role;

-- Step 2: Create a table to track the state of each scraper for efficient, incremental updates.
CREATE TABLE IF NOT EXISTS public.scraper_runs (
    source TEXT PRIMARY KEY,
    last_object_id BIGINT DEFAULT 0,
    last_run_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT
);
ALTER TABLE public.scraper_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service_role full access to scraper_runs"
ON public.scraper_runs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Step 3: Create the "data lake" table to store raw, unmodified JSON from scrapers.
CREATE TABLE IF NOT EXISTS external_raw_fl.property_data (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    source_record_id TEXT NOT NULL,
    raw_data JSONB NOT NULL,
    data_hash TEXT NOT NULL,
    scraped_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE external_raw_fl.property_data
ADD CONSTRAINT property_data_source_record_id_unique UNIQUE (source, source_record_id);
GRANT ALL ON TABLE external_raw_fl.property_data TO service_role;
GRANT ALL ON SEQUENCE external_raw_fl.property_data_id_seq TO service_role;

-- Step 4: Replace the old materialized view with a proper, writable table for clean data.
DROP MATERIALIZED VIEW IF EXISTS public.parcels;
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
CREATE UNIQUE INDEX idx_parcels_parcel_id_source ON public.parcels (parcel_id, source);
CREATE INDEX idx_parcels_geom ON public.parcels USING gist (geom);
CREATE TRIGGER on_parcels_update
  BEFORE UPDATE ON public.parcels
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to parcels" ON public.parcels FOR SELECT USING (true);
CREATE POLICY "Allow service_role full access to parcels" ON public.parcels FOR ALL TO service_role USING (true) WITH CHECK (true);

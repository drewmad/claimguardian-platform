-- Create a table in the public schema for Florida property data
-- Since external_raw_fl schema is not exposed via API, we'll use public schema

CREATE TABLE IF NOT EXISTS public.florida_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    source_record_id TEXT NOT NULL,
    parcel_id TEXT,
    county TEXT,
    owner_name TEXT,
    situs_address TEXT,
    situs_city TEXT,
    situs_zip TEXT,
    total_value NUMERIC,
    year_built INTEGER,
    raw_data JSONB,
    data_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(source, source_record_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_florida_properties_source ON public.florida_properties(source);
CREATE INDEX IF NOT EXISTS idx_florida_properties_parcel_id ON public.florida_properties(parcel_id);
CREATE INDEX IF NOT EXISTS idx_florida_properties_county ON public.florida_properties(county);
CREATE INDEX IF NOT EXISTS idx_florida_properties_owner_name ON public.florida_properties(owner_name);

-- Enable RLS
ALTER TABLE public.florida_properties ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service role can manage florida properties"
ON public.florida_properties FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read florida properties"
ON public.florida_properties FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anon users can read florida properties"
ON public.florida_properties FOR SELECT TO anon USING (true);

-- Grant permissions
GRANT SELECT ON public.florida_properties TO anon;
GRANT ALL ON public.florida_properties TO authenticated;
GRANT ALL ON public.florida_properties TO service_role;
-- ============================================================================
-- FLOIR-ONLY DEPLOYMENT SCRIPT
-- Execute this to deploy just the FLOIR data platform without parcel conflicts
-- ============================================================================

-- STEP 1: Enable Extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;  
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- STEP 2: Create FLOIR Data Types (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'floir_data_type') THEN
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
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crawl_status') THEN
        CREATE TYPE public.crawl_status AS ENUM (
            'pending',
            'running', 
            'completed',
            'failed',
            'cancelled'
        );
    END IF;
END $$;

-- STEP 3: Create Core FLOIR Tables (idempotent)
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

-- STEP 4: Create Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_floir_data_type ON public.floir_data(data_type);
CREATE INDEX IF NOT EXISTS idx_floir_data_extracted_at ON public.floir_data(extracted_at DESC);

-- Try to create HNSW index, fall back to IVFFlat if HNSW not available
DO $$
BEGIN
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_floir_embedding_vector ON public.floir_data 
        USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
    EXCEPTION
        WHEN undefined_function THEN
            -- HNSW not available, use IVFFlat
            CREATE INDEX IF NOT EXISTS idx_floir_embedding_vector ON public.floir_data 
            USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    END;
END $$;

-- STEP 5: Enable RLS and Create Policies (idempotent)
ALTER TABLE public.floir_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_runs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Global FLOIR data read access" ON public.floir_data;
DROP POLICY IF EXISTS "Service role FLOIR data write access" ON public.floir_data;

CREATE POLICY "Global FLOIR data read access" ON public.floir_data
    FOR SELECT USING (true);

CREATE POLICY "Service role FLOIR data write access" ON public.floir_data
    FOR ALL USING (auth.role() = 'service_role');

-- STEP 6: Create Essential Functions (replace if exists)
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

-- STEP 7: Grant Permissions (idempotent)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.floir_data TO anon, authenticated;
GRANT ALL ON public.floir_data TO service_role;
GRANT SELECT ON public.crawl_runs TO authenticated;
GRANT ALL ON public.crawl_runs TO service_role;

-- Grant usage on custom types
GRANT USAGE ON TYPE public.floir_data_type TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.crawl_status TO anon, authenticated, service_role;

-- STEP 8: Verification
DO $$
BEGIN
    -- Test vector extension
    PERFORM vector_dims('[1,2,3]'::vector);
    
    -- Test PostGIS extension  
    PERFORM ST_AsText(ST_Point(-82.0, 27.5));
    
    -- Verify FLOIR tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'floir_data') THEN
        RAISE EXCEPTION 'floir_data table not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crawl_runs') THEN
        RAISE EXCEPTION 'crawl_runs table not created';
    END IF;
    
    RAISE NOTICE '✅ FLOIR Data Platform core deployment successful!';
    RAISE NOTICE 'Tables created: floir_data, crawl_runs';
    RAISE NOTICE 'Extensions enabled: vector, postgis, pg_cron, pg_net';
    RAISE NOTICE 'Ready for Edge Function deployment';
END $$;
-- Create monitoring tables for the Digital Ocean scraper

-- Scraper logs table for detailed monitoring
CREATE TABLE IF NOT EXISTS public.scraper_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG')),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_scraper_logs_source ON public.scraper_logs(source);
CREATE INDEX idx_scraper_logs_level ON public.scraper_logs(level);
CREATE INDEX idx_scraper_logs_timestamp ON public.scraper_logs(timestamp DESC);

-- Enable RLS
ALTER TABLE public.scraper_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Service role can manage scraper logs"
ON public.scraper_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read scraper logs"
ON public.scraper_logs FOR SELECT TO authenticated USING (true);

-- Update scraper_runs table with additional fields
ALTER TABLE public.scraper_runs 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'idle' 
    CHECK (status IN ('idle', 'running', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS records_processed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Function to get scraper health status
CREATE OR REPLACE FUNCTION public.get_scraper_health()
RETURNS TABLE (
    source TEXT,
    status TEXT,
    last_run_at TIMESTAMPTZ,
    records_processed INTEGER,
    health_status TEXT,
    days_since_run NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_runs AS (
        SELECT 
            sr.source,
            sr.status,
            sr.last_run_at,
            sr.records_processed,
            EXTRACT(EPOCH FROM (now() - sr.last_run_at)) / 86400 as days_since_run
        FROM public.scraper_runs sr
    )
    SELECT 
        lr.source,
        lr.status,
        lr.last_run_at,
        lr.records_processed,
        CASE 
            WHEN lr.status = 'running' THEN 'running'
            WHEN lr.days_since_run IS NULL THEN 'never_run'
            WHEN lr.days_since_run < 1 THEN 'healthy'
            WHEN lr.days_since_run < 3 THEN 'warning'
            ELSE 'critical'
        END as health_status,
        ROUND(lr.days_since_run::numeric, 2) as days_since_run
    FROM latest_runs lr
    ORDER BY lr.source;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent scraper activity
CREATE OR REPLACE FUNCTION public.get_scraper_activity(
    p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    hour TIMESTAMPTZ,
    source TEXT,
    records_processed INTEGER,
    errors INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH hourly_stats AS (
        SELECT 
            date_trunc('hour', sl.timestamp) as hour,
            sl.source,
            COUNT(*) FILTER (WHERE sl.level = 'INFO' AND sl.message LIKE 'Processed batch:%') as info_count,
            COUNT(*) FILTER (WHERE sl.level = 'ERROR') as error_count
        FROM public.scraper_logs sl
        WHERE sl.timestamp > now() - (p_hours || ' hours')::interval
        GROUP BY date_trunc('hour', sl.timestamp), sl.source
    )
    SELECT 
        hs.hour,
        hs.source,
        COALESCE(hs.info_count * 500, 0) as records_processed, -- Assuming batch size of 500
        hs.error_count as errors
    FROM hourly_stats hs
    ORDER BY hs.hour DESC, hs.source;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_scraper_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_scraper_activity(INTEGER) TO authenticated;

-- Create a view for easy monitoring
CREATE OR REPLACE VIEW public.scraper_dashboard AS
SELECT 
    sr.source,
    sr.status,
    sr.last_run_at,
    sr.records_processed,
    sr.error_message,
    COALESCE(
        (SELECT COUNT(*) 
         FROM public.scraper_logs sl 
         WHERE sl.source = sr.source 
         AND sl.level = 'ERROR' 
         AND sl.timestamp > now() - interval '24 hours'
        ), 0
    ) as errors_last_24h,
    COALESCE(
        (SELECT COUNT(*) 
         FROM external_raw_fl.property_data pd 
         WHERE pd.source = sr.source
        ), 0
    ) as total_records
FROM public.scraper_runs sr;

-- Grant access to the view
GRANT SELECT ON public.scraper_dashboard TO authenticated;
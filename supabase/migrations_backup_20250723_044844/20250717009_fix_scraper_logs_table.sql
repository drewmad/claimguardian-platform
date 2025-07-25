-- Create scraper_logs table for monitoring
-- This is a simplified version that creates just the scraper_logs table

-- Create scraper_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.scraper_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG')),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_scraper_logs_source ON public.scraper_logs(source);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_level ON public.scraper_logs(level);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_timestamp ON public.scraper_logs(timestamp DESC);

-- Enable RLS
ALTER TABLE public.scraper_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage scraper logs" ON public.scraper_logs;
DROP POLICY IF EXISTS "Authenticated users can read scraper logs" ON public.scraper_logs;

-- Create policies
CREATE POLICY "Service role can manage scraper logs"
ON public.scraper_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read scraper logs"
ON public.scraper_logs FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT, INSERT ON public.scraper_logs TO anon;
GRANT ALL ON public.scraper_logs TO service_role;
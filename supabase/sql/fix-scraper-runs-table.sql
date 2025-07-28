-- Add missing columns to scraper_runs table
-- These columns are referenced in the scraper but were added in a migration that hasn't been applied

-- Add status column with CHECK constraint
ALTER TABLE public.scraper_runs 
ADD COLUMN IF NOT EXISTS status TEXT 
CHECK (status IN ('pending', 'running', 'completed', 'failed'));

-- Add monitoring columns
ALTER TABLE public.scraper_runs 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.scraper_runs 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE public.scraper_runs 
ADD COLUMN IF NOT EXISTS records_processed INTEGER DEFAULT 0;

ALTER TABLE public.scraper_runs 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_scraper_runs_status ON public.scraper_runs(status);

-- Update existing records to have a status
UPDATE public.scraper_runs 
SET status = 'completed'
WHERE status IS NULL AND last_run_at IS NOT NULL;

-- Test that it works
SELECT source, status, last_object_id, records_processed, last_run_at 
FROM public.scraper_runs 
LIMIT 5;
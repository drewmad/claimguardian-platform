-- Create webhook trigger for scraping requests
-- This allows triggering external scrapers via database events

-- Create a table to queue scraping requests
CREATE TABLE IF NOT EXISTS public.scraper_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    last_object_id BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    records_processed INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.scraper_queue ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role can manage scraper queue"
ON public.scraper_queue FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create function to trigger webhook on new scraping request
CREATE OR REPLACE FUNCTION public.notify_scraper_webhook()
RETURNS trigger AS $$
DECLARE
    payload json;
BEGIN
    -- Only trigger for new pending requests
    IF NEW.status = 'pending' AND (TG_OP = 'INSERT' OR OLD.status != 'pending') THEN
        payload = json_build_object(
            'id', NEW.id,
            'source', NEW.source,
            'last_object_id', NEW.last_object_id,
            'webhook_url', 'https://your-external-scraper.vercel.app/api/scrape'
        );
        
        -- This would typically call pg_net to make HTTP request
        -- For now, we'll use NOTIFY to simulate
        PERFORM pg_notify('scraper_request', payload::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_scraper_request
    AFTER INSERT OR UPDATE ON public.scraper_queue
    FOR EACH ROW EXECUTE FUNCTION public.notify_scraper_webhook();

-- Function to initiate scraping for all counties
CREATE OR REPLACE FUNCTION public.queue_county_scraping()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    -- Get last run info and queue new requests
    INSERT INTO public.scraper_queue (source, last_object_id)
    SELECT 
        s.source,
        COALESCE(sr.last_object_id, 0)
    FROM (VALUES 
        ('fl_charlotte_county'),
        ('fl_lee_county'),
        ('fl_sarasota_county')
    ) AS s(source)
    LEFT JOIN public.scraper_runs sr ON s.source = sr.source
    ON CONFLICT DO NOTHING;
    
    -- Return queued items
    SELECT json_agg(row_to_json(q)) INTO result
    FROM (
        SELECT id, source, status, created_at 
        FROM public.scraper_queue 
        WHERE created_at > now() - interval '1 minute'
    ) q;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.queue_county_scraping() TO authenticated;
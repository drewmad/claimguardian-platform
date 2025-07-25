-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Store the scraper endpoint URL in vault
SELECT vault.create_secret('http://159.223.126.155:3001', 'scraper_url');

-- Create a function to trigger the scraper
CREATE OR REPLACE FUNCTION trigger_property_scraper()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    scraper_endpoint TEXT;
BEGIN
    -- Get the scraper URL from vault
    SELECT decrypted_secret INTO scraper_endpoint 
    FROM vault.decrypted_secrets 
    WHERE name = 'scraper_url';

    -- Make HTTP request to trigger scraper
    PERFORM net.http_post(
        url := scraper_endpoint || '/trigger',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'X-Scraper-Secret', 'your-secret-key-here'
        ),
        body := jsonb_build_object(
            'triggered_by', 'pg_cron',
            'timestamp', now()
        )
    );
    
    -- Log the trigger
    INSERT INTO public.scraper_logs (source, level, message, metadata)
    VALUES ('pg_cron', 'INFO', 'Scraper triggered', 
            jsonb_build_object('triggered_at', now()));
END;
$$;

-- Schedule the scraper to run weekly on Sunday at 3 AM EST (8 AM UTC)
SELECT cron.schedule(
    'florida-property-scraper',
    '0 8 * * 0', -- Weekly on Sunday at 8 AM UTC
    $$
    SELECT trigger_property_scraper();
    $$
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- To unschedule (if needed)
-- SELECT cron.unschedule('florida-property-scraper');
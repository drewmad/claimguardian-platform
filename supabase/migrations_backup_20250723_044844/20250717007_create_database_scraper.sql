-- Alternative: Run scraper logic directly in database using pg_cron
-- This approach doesn't require external services

-- Create a function that performs the scraping logic
CREATE OR REPLACE FUNCTION scrape_florida_properties()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    county_config JSONB;
    last_object_id INTEGER;
    api_response JSONB;
    request_id BIGINT;
BEGIN
    -- Array of counties to scrape
    FOR county_config IN 
        SELECT jsonb_array_elements('[
            {"name": "fl_charlotte_county", "url": "https://services1.arcgis.com/..."},
            {"name": "fl_lee_county", "url": "https://services1.arcgis.com/..."},
            {"name": "fl_sarasota_county", "url": "https://gis.scgov.net/..."}
        ]'::jsonb)
    LOOP
        -- Get last processed object ID
        SELECT last_object_id INTO last_object_id
        FROM public.scraper_runs
        WHERE source = county_config->>'name'
        ORDER BY last_run_at DESC
        LIMIT 1;
        
        -- Update scraper status
        INSERT INTO public.scraper_runs (source, status, started_at)
        VALUES (county_config->>'name', 'running', now())
        ON CONFLICT (source) 
        DO UPDATE SET status = 'running', started_at = now();
        
        -- Make HTTP request to county API
        SELECT net.http_get(
            url := county_config->>'url' || 
                   '/query?where=OBJECTID>' || COALESCE(last_object_id, 0) ||
                   '&outFields=*&f=json&resultRecordCount=500',
            headers := jsonb_build_object('User-Agent', 'ClaimGuardian-Scraper/1.0')
        ) INTO request_id;
        
        -- Note: pg_net is asynchronous, so we'd need to handle responses differently
        -- This is a simplified example
    END LOOP;
    
    -- Log completion
    INSERT INTO public.scraper_logs (source, level, message)
    VALUES ('pg_cron', 'INFO', 'Scraping job initiated for all counties');
END;
$$;

-- Schedule the database scraper
SELECT cron.schedule(
    'florida-property-db-scraper',
    '0 8 * * 0', -- Weekly on Sunday at 8 AM UTC
    $$
    SELECT scrape_florida_properties();
    $$
);
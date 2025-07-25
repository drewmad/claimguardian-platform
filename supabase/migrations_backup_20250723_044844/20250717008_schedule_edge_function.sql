-- Schedule Edge Function to run weekly

-- First, store your project URL and anon key in vault
SELECT vault.create_secret('https://tmlrvecuwgppbaynesji.supabase.co', 'project_url');
SELECT vault.create_secret('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHJ2ZWN1d2dwcGJheW5lc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzUwMzksImV4cCI6MjA2NDY1MTAzOX0.P69j3GyOQ9NeGXeLul_ZyhWOvuyepL9FskjYAK-CDMU', 'anon_key');

-- Schedule the Edge Function
SELECT cron.schedule(
    'scrape-properties-edge-function',
    '0 8 * * 0', -- Weekly on Sunday at 8 AM UTC
    $$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/scrape-properties',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
        ),
        body := jsonb_build_object(
            'triggered_by', 'pg_cron',
            'timestamp', now()
        )
    ) as request_id;
    $$
);
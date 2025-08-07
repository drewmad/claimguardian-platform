-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Note: On managed Supabase, cron permissions are handled automatically
-- No manual grants to postgres role needed (and would fail anyway)

-- Create weather sync job (every 15 minutes)
SELECT cron.schedule(
    'weather-sync-15min',
    '*/15 * * * *', -- Every 15 minutes
    $$
    SELECT net.http_post(
        url := 'https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/weather-sync-orchestrator',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object(
            'type', 'weather',
            'scope', 'incremental'
        )
    );
    $$
);

-- Create FEMA sync job (daily at 2 AM)
SELECT cron.schedule(
    'fema-sync-daily',
    '0 2 * * *', -- Daily at 2 AM
    $$
    SELECT net.http_post(
        url := 'https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/weather-sync-orchestrator',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object(
            'type', 'fema',
            'scope', 'incremental'
        )
    );
    $$
);

-- Create comprehensive sync job (weekly on Sunday at 3 AM)
SELECT cron.schedule(
    'comprehensive-sync-weekly',
    '0 3 * * 0', -- Sunday at 3 AM
    $$
    SELECT net.http_post(
        url := 'https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/weather-sync-orchestrator',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object(
            'type', 'all',
            'scope', 'full'
        )
    );
    $$
);

-- View scheduled jobs
SELECT * FROM cron.job;
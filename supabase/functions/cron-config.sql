-- NOAA Data Ingestion Cron Jobs
-- These cron jobs trigger the NOAA scheduler at different intervals based on criticality

-- Main scheduler - runs every 5 minutes to check severity and trigger appropriate ingestion
SELECT cron.schedule(
  'noaa-scheduler-main',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/noaa-scheduler',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);

-- Weather alerts check - runs every 5 minutes (critical for safety)
SELECT cron.schedule(
  'noaa-alerts-check',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/noaa-data-ingestor',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('action', 'ingest-alerts')
  );
  $$
);

-- Cleanup old observations - runs daily at 2 AM
SELECT cron.schedule(
  'noaa-cleanup-old-data',
  '0 2 * * *', -- Daily at 2 AM
  $$
  DELETE FROM noaa_weather_observations 
  WHERE observation_time < NOW() - INTERVAL '30 days';
  
  DELETE FROM noaa_tide_and_current_data 
  WHERE observation_time < NOW() - INTERVAL '30 days';
  
  DELETE FROM noaa_storm_events 
  WHERE active = false AND expires < NOW() - INTERVAL '90 days';
  
  DELETE FROM noaa_ingestion_logs 
  WHERE created_at < NOW() - INTERVAL '7 days';
  $$
);

-- Update station metadata - runs weekly on Sunday at 3 AM
SELECT cron.schedule(
  'noaa-update-stations',
  '0 3 * * 0', -- Weekly on Sunday at 3 AM
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/noaa-data-ingestor',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('action', 'update-stations')
  );
  $$
);

-- Historical data archival - runs monthly on the 1st at 4 AM
SELECT cron.schedule(
  'noaa-archive-historical',
  '0 4 1 * *', -- Monthly on the 1st at 4 AM
  $$
  -- Archive old observations to historical table
  INSERT INTO noaa_historical_storms (
    storm_type,
    year,
    month,
    state,
    property_damage,
    data_source,
    created_at
  )
  SELECT 
    event_type,
    EXTRACT(YEAR FROM sent),
    EXTRACT(MONTH FROM sent),
    'FL',
    0, -- Would need to calculate from affected properties
    'NWS_ALERTS',
    NOW()
  FROM noaa_storm_events
  WHERE active = false 
    AND expires < NOW() - INTERVAL '90 days'
    AND event_type IN ('Hurricane', 'Tropical Storm', 'Tornado', 'Flood');
  $$
);

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Note: On managed Supabase, cron permissions are handled automatically
-- No manual grants to postgres role needed (and would fail anyway)

-- View all scheduled jobs
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('noaa-scheduler-main');
-- supabase/migrations/20250717005_schedule_db_scrapers.sql

-- Uses the pg_cron extension to schedule the plv8 scraper function to run periodically.

-- Clear any existing jobs for these sources to avoid duplicates
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname IN ('scrape-charlotte', 'scrape-lee', 'scrape-sarasota');

-- Schedule Charlotte County scrape for 2:00 AM UTC daily
SELECT cron.schedule(
  'scrape-charlotte',
  '0 2 * * *', -- Cron syntax for 2:00 AM UTC
  $$
    SELECT scrape_county_data(
      'fl_charlotte_county',
      'https://ccgis.charlottecountyfl.gov/arcgis/rest/services/WEB_Parcels/MapServer/0'
    );
  $$
);

-- Schedule Lee County scrape for 2:05 AM UTC daily
SELECT cron.schedule(
  'scrape-lee',
  '5 2 * * *', -- Cron syntax for 2:05 AM UTC
  $$
    SELECT scrape_county_data(
      'fl_lee_county',
      'https://maps.leepa.org/arcgis/rest/services/Leegis/SecureParcels/MapServer/0'
    );
  $$
);

-- Schedule Sarasota County scrape for 2:10 AM UTC daily
SELECT cron.schedule(
  'scrape-sarasota',
  '10 2 * * *', -- Cron syntax for 2:10 AM UTC
  $$
    SELECT scrape_county_data(
      'fl_sarasota_county',
      'https://gis.sc-pa.com/server/rest/services/Parcel/ParcelData/MapServer/1'
    );
  $$
);

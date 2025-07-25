CREATE OR REPLACE FUNCTION public.get_scraper_verification_data()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  WITH runs AS (
    SELECT source, last_object_id, last_run_at
    FROM public.scraper_runs
  ),
  counts AS (
    SELECT source, count(*) as record_count
    FROM external_raw_fl.property_data
    GROUP BY source
  )
  SELECT json_build_object(
    'scraper_runs', (SELECT json_agg(runs) FROM runs),
    'raw_data_counts', (SELECT json_agg(counts) FROM counts)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

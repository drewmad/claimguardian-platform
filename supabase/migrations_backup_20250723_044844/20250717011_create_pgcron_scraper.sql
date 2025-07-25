-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create staging table for external data loads
CREATE TABLE IF NOT EXISTS public.property_import_staging (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    import_batch UUID DEFAULT gen_random_uuid(),
    raw_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    imported_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient processing
CREATE INDEX idx_staging_unprocessed ON public.property_import_staging(processed) WHERE processed = FALSE;

-- Function to process staged data into the main property_data table
CREATE OR REPLACE FUNCTION public.process_staged_property_data()
RETURNS TABLE (
    source TEXT,
    records_processed INTEGER,
    errors INTEGER
) AS $$
DECLARE
    batch_record RECORD;
    processed_count INTEGER := 0;
    error_count INTEGER := 0;
    current_source TEXT;
    source_counts JSONB := '{}'::jsonb;
BEGIN
    -- Process unprocessed staged records in batches
    FOR batch_record IN 
        SELECT * FROM public.property_import_staging 
        WHERE processed = FALSE 
        ORDER BY imported_at 
        LIMIT 1000
    LOOP
        BEGIN
            -- Extract parcel_id from raw_data
            DECLARE
                parcel_id TEXT := batch_record.raw_data->>'parcel_id';
                data_hash TEXT := encode(sha256(batch_record.raw_data::text::bytea), 'hex');
            BEGIN
                -- Insert into main property_data table
                INSERT INTO external_raw_fl.property_data (
                    source,
                    source_record_id,
                    raw_data,
                    data_hash
                ) VALUES (
                    batch_record.source,
                    COALESCE(parcel_id, batch_record.raw_data->>'source_object_id'),
                    batch_record.raw_data,
                    data_hash
                ) ON CONFLICT (source, source_record_id) 
                DO UPDATE SET 
                    raw_data = EXCLUDED.raw_data,
                    data_hash = EXCLUDED.data_hash,
                    scraped_at = now();
                
                -- Mark as processed
                UPDATE public.property_import_staging 
                SET processed = TRUE 
                WHERE id = batch_record.id;
                
                -- Update counts
                current_source := batch_record.source;
                source_counts := jsonb_set(
                    source_counts,
                    ARRAY[current_source],
                    to_jsonb(COALESCE((source_counts->>current_source)::int, 0) + 1)
                );
                
                processed_count := processed_count + 1;
            END;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE WARNING 'Error processing record %: %', batch_record.id, SQLERRM;
        END;
    END LOOP;
    
    -- Update scraper_runs with max object IDs
    UPDATE public.scraper_runs sr
    SET 
        last_object_id = subq.max_object_id,
        last_run_at = now()
    FROM (
        SELECT 
            source,
            MAX((raw_data->>'source_object_id')::bigint) as max_object_id
        FROM external_raw_fl.property_data
        GROUP BY source
    ) subq
    WHERE sr.source = subq.source;
    
    -- Return summary
    RETURN QUERY
    SELECT 
        key as source,
        value::int as records_processed,
        0 as errors
    FROM jsonb_each_text(source_counts)
    UNION ALL
    SELECT 
        'TOTAL' as source,
        processed_count as records_processed,
        error_count as errors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create pg_cron job to process staged data every 5 minutes
SELECT cron.schedule(
    'process-property-imports',
    '*/5 * * * *',
    $$SELECT public.process_staged_property_data();$$
);

-- Function to manually trigger processing
CREATE OR REPLACE FUNCTION public.trigger_property_import_processing()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_agg(row_to_json(t)) INTO result
    FROM public.process_staged_property_data() t;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.trigger_property_import_processing() TO authenticated;
GRANT INSERT ON TABLE public.property_import_staging TO authenticated;
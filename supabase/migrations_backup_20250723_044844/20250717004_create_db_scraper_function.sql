-- supabase/migrations/20250717004_create_db_scraper_function.sql

-- Creates a PostgreSQL function using the plv8 (JavaScript) extension
-- that can fetch data from an external URL and insert it into the database.
CREATE OR REPLACE FUNCTION scrape_county_data(source_name TEXT, service_url TEXT)
RETURNS TEXT
LANGUAGE plv8
AS $$
  // Get the last object ID for this source to perform an incremental scrape
  let lastObjectId = 0;
  try {
    const lastRun = plv8.execute(
      'SELECT last_object_id FROM public.scraper_runs WHERE source = $1',
      [source_name]
    );
    if (lastRun.length > 0) {
      lastObjectId = lastRun[0].last_object_id;
    }
  } catch (e) {
    plv8.elog(NOTICE, `Could not fetch last run for ${source_name}, starting from 0.`);
  }

  // Construct the query URL
  const query = `OBJECTID > ${lastObjectId}`;
  const url = `${service_url}/query?where=${encodeURIComponent(query)}&outFields=*&f=json&resultRecordCount=500&orderByFields=OBJECTID+ASC`;

  // Perform the external HTTP request
  const result = plv8.execute(`SELECT content FROM http_get('${url}')`);
  const json_result = JSON.parse(result[0].content);

  if (!json_result || !json_result.features || json_result.features.length === 0) {
    return `No new records found for ${source_name}`;
  }

  const features = json_result.features;
  let maxObjectIdInRun = lastObjectId;

  // Prepare the insert statement
  const plan = plv8.prepare(
    'INSERT INTO external_raw_fl.property_data (source, source_record_id, raw_data, data_hash) VALUES ($1, $2, $3, $4) ON CONFLICT (source, source_record_id) DO NOTHING',
    ['text', 'text', 'jsonb', 'text']
  );

  features.forEach(feature => {
    const objectId = feature.attributes.OBJECTID;
    if (objectId > maxObjectIdInRun) {
      maxObjectIdInRun = objectId;
    }
    const rawData = JSON.stringify(feature.attributes);
    // Note: Hashing is omitted for simplicity in plv8, but could be added.
    plan.execute([source_name, feature.attributes.OBJECTID, rawData, 'temp_hash']);
  });

  plan.free();

  // Update the scraper_runs table with the new max object ID
  plv8.execute(
    'INSERT INTO public.scraper_runs (source, last_object_id, last_run_at) VALUES ($1, $2, now()) ON CONFLICT (source) DO UPDATE SET last_object_id = $2, last_run_at = now()',
    [source_name, maxObjectIdInRun]
  );

  return `Successfully processed ${features.length} records for ${source_name}`;
$$;

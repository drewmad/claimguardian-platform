// scripts/verify_scraper_run.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function verify() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables.');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 1. Check the scraper runs table
  const { data: runs, error: runsError } = await supabase
    .from('scraper_runs')
    .select('source, last_object_id, last_run_at');

  if (runsError) {
    console.error('Error fetching scraper_runs:', runsError.message);
    return;
  }

  // 2. Fetch records from the raw data table using the CORRECT syntax.
  const { data: rawData, error: rawDataError } = await supabase
    .from('property_data')
    .select('source', { count: 'exact' })
    .schema('external_raw_fl');

  if (rawDataError) {
    console.error('Error fetching from external_raw_fl.property_data:', rawDataError.message);
    return;
  }

  // The count is returned in the `count` property of the response when { count: 'exact' } is used.
  // We need to group the full dataset.
  const { data: allRawData, error: allRawDataError } = await supabase
    .from('property_data')
    .select('source')
    .schema('external_raw_fl');

  if(allRawDataError) {
      console.error('Error fetching all raw data:', allRawDataError.message);
      return;
  }

  const counts = allRawData.reduce((acc, record) => {
    acc[record.source] = (acc[record.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formattedCounts = Object.entries(counts).map(([source, record_count]) => ({ source, record_count }));

  console.log(JSON.stringify({ scraper_runs: runs, raw_data_counts: formattedCounts }, null, 2));
}

verify();
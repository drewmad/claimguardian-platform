// supabase/functions/scrape-florida-parcels/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.119.0/crypto/mod.ts';

import scrapeCharlotte from './adapters/charlotte.ts';
import scrapeLee from './adapters/lee.ts';
import scrapeSarasota from './adapters/sarasota.ts';

// Define the adapters to run
const adapters = [
  { name: 'fl_charlotte_county', scrape: scrapeCharlotte },
  { name: 'fl_lee_county', scrape: scrapeLee },
  { name: 'fl_sarasota_county', scrape: scrapeSarasota },
];

// Helper to create a hash for change detection
async function createHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. Get the last run state for all scrapers
  const { data: lastRuns, error: fetchError } = await supabaseClient
    .from('scraper_runs')
    .select('source, last_object_id');

  if (fetchError) {
    return new Response(JSON.stringify({ error: `Failed to fetch scraper runs: ${fetchError.message}` }), { status: 500 });
  }

  const lastRunMap = new Map(lastRuns.map(run => [run.source, run.last_object_id]));

  // 2. Run all adapter scrapes in parallel
  const scrapePromises = adapters.map(adapter => {
    const lastObjectId = lastRunMap.get(adapter.name) || 0;
    return adapter.scrape(lastObjectId);
  });

  const results = await Promise.allSettled(scrapePromises);

  // 3. Process results and insert into the database
  for (const result of results) {
    if (result.status === 'rejected' || !result.value.success) {
      console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: `Scrape failed for a source: ${result.reason || result.value?.error || 'Unknown error'}`
}));
      continue;
    }

    const scrapeResult = result.value;
    if (scrapeResult.data.length === 0) {
      console.log(JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message: `[${scrapeResult.source}] No new data to insert.`
      }));
      continue;
    }

    // Prepare data for insertion
    const recordsToInsert = await Promise.all(scrapeResult.data.map(async (record) => {
      const rawDataString = JSON.stringify(record);
      return {
        source: scrapeResult.source,
        source_record_id: record.parcel_id || record.source_object_id,
        raw_data: record,
        data_hash: await createHash(rawDataString),
      };
    }));

    // Insert new data into the raw table
    const { error: insertError } = await supabaseClient
      .from('property_data')
      .schema('external_raw_fl')
      .upsert(recordsToInsert, { onConflict: 'source, source_record_id' });

    if (insertError) {
      console.log(JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message: `[${scrapeResult.source}] Failed to insert data:`, insertError
      }));
      continue;
    }

    // Update the last run state with the new max OBJECTID
    const { error: updateError } = await supabaseClient
      .from('scraper_runs')
      .upsert({ source: scrapeResult.source, last_object_id: scrapeResult.lastObjectId }, { onConflict: 'source' });

    if (updateError) {
      console.log(JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message: `[${scrapeResult.source}] Failed to update scraper run state:`, updateError
      }));
    }

    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `[${scrapeResult.source}] Successfully processed ${recordsToInsert.length} records.`
    }));
  }

  return new Response(JSON.stringify({ message: 'Scraping process completed.' }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});

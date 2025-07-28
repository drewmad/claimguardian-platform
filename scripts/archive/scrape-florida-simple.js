#!/usr/bin/env node

/**
 * Simplified Florida Statewide Parcels Scraper
 * Works with the existing scraper_runs table structure
 */

const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmlrvecuwgppbaynesji.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Run: export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Florida Statewide Service Configuration
const STATEWIDE_SERVICE = {
  url: 'https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0',
  counties: {
    'CHARLOTTE': '15',
    'LEE': '36',
    'SARASOTA': '58',
    'COLLIER': '11',
    'MIAMI-DADE': '13',
    'BROWARD': '06',
    'PALM BEACH': '50'
  }
};

// Helper function to make HTTPS requests
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; FlPropertyScraper/1.0)'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

// Create hash for deduplication
function createHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Log to scraper_logs table
async function logToTable(source, level, message, metadata = {}) {
  try {
    await supabase.from('scraper_logs').insert({
      source,
      level,
      message,
      metadata
    });
  } catch (error) {
    console.error('[LOG ERROR]', error.message);
  }
}

// Scrape a single county
async function scrapeCounty(countyName, countyCode) {
  const source = `fl_${countyName.toLowerCase().replace(/[^a-z]/g, '_')}_county`;
  console.log(`\n[${source}] Starting scrape for ${countyName} County (code: ${countyCode})...`);
  
  await logToTable(source, 'INFO', `Starting scrape for ${countyName} County`);
  
  // Get last processed OBJECTID
  const { data: lastRun } = await supabase
    .from('scraper_runs')
    .select('last_object_id')
    .eq('source', source)
    .single();
  
  const lastObjectId = lastRun?.last_object_id || 0;
  console.log(`[${source}] Last processed OBJECTID: ${lastObjectId}`);
  
  // First, let's test with a small batch to see what fields are available
  const testParams = new URLSearchParams({
    where: `CO_NO='${countyCode}'`,
    outFields: '*',
    f: 'json',
    resultOffset: '0',
    resultRecordCount: '1'
  });
  
  const testUrl = `${STATEWIDE_SERVICE.url}/query?${testParams}`;
  console.log(`[${source}] Testing query to check available fields...`);
  
  try {
    const testResponse = await httpsGet(testUrl);
    if (testResponse.features && testResponse.features.length > 0) {
      console.log(`[${source}] Available fields:`, Object.keys(testResponse.features[0].attributes));
    }
  } catch (error) {
    console.error(`[${source}] Test query failed:`, error.message);
  }
  
  const BATCH_SIZE = 1000;
  let currentOffset = 0;
  let totalProcessed = 0;
  let maxObjectId = lastObjectId;
  let hasMore = true;
  
  while (hasMore) {
    const queryParams = new URLSearchParams({
      where: `CO_NO=${countyCode} AND OBJECTID>${lastObjectId}`,
      outFields: 'OBJECTID,PARCEL_ID,CO_NO,OWN_NAME,PHY_ADDR1,PHY_CITY,PHY_ZIPCD,JV,ACT_YR_BLT',
      f: 'json',
      resultOffset: String(currentOffset),
      resultRecordCount: String(BATCH_SIZE),
      orderByFields: 'OBJECTID ASC'
    });
    
    const url = `${STATEWIDE_SERVICE.url}/query?${queryParams}`;
    
    try {
      console.log(`[${source}] Fetching batch at offset ${currentOffset}...`);
      const response = await httpsGet(url);
      
      if (response.error) {
        throw new Error(response.error.message || 'API error');
      }
      
      if (!response.features || response.features.length === 0) {
        hasMore = false;
        continue;
      }
      
      // Process and insert records
      const recordsToInsert = response.features.map(feature => {
        const attrs = feature.attributes;
        maxObjectId = Math.max(maxObjectId, attrs.OBJECTID);
        
        return {
          source,
          source_record_id: String(attrs.OBJECTID),
          raw_data: attrs,
          data_hash: createHash(attrs),
          // Map basic fields
          parcel_id: attrs.PARCEL_ID,
          county: `${attrs.CO_NO}`,
          owner_name: attrs.OWN_NAME,
          situs_address: attrs.PHY_ADDR1,
          situs_city: attrs.PHY_CITY,
          situs_zip: attrs.PHY_ZIPCD ? String(attrs.PHY_ZIPCD) : null,
          total_value: attrs.JV,
          year_built: attrs.ACT_YR_BLT
        };
      });
      
      // Insert in smaller batches
      const INSERT_BATCH_SIZE = 100;
      for (let i = 0; i < recordsToInsert.length; i += INSERT_BATCH_SIZE) {
        const batch = recordsToInsert.slice(i, i + INSERT_BATCH_SIZE);
        const { error: insertError } = await supabase
          .schema('external_raw_fl')
          .from('property_data')
          .upsert(batch, { onConflict: 'source,source_record_id' });
        
        if (insertError) {
          console.error(`[${source}] Insert error:`, insertError);
          await logToTable(source, 'ERROR', 'Failed to insert batch', { error: insertError.message });
        } else {
          totalProcessed += batch.length;
          console.log(`[${source}] Inserted ${batch.length} records (total: ${totalProcessed})`);
        }
      }
      
      currentOffset += response.features.length;
      
      // Check if we've fetched all records
      if (response.features.length < BATCH_SIZE) {
        hasMore = false;
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`[${source}] Error:`, error.message);
      await logToTable(source, 'ERROR', 'Scrape failed', { error: error.message });
      break;
    }
  }
  
  // Update scraper_runs with only the columns that exist
  const { error: updateError } = await supabase
    .from('scraper_runs')
    .upsert({
      source,
      last_object_id: maxObjectId,
      last_run_at: new Date().toISOString(),
      notes: `Processed ${totalProcessed} records`
    }, { onConflict: 'source' });
  
  if (updateError) {
    console.error(`[${source}] Failed to update run status:`, updateError);
  }
  
  console.log(`[${source}] Completed! Processed ${totalProcessed} records`);
  await logToTable(source, 'INFO', `Completed scrape`, { records_processed: totalProcessed });
}

// Main function
async function main() {
  console.log('Florida Statewide Parcels Scraper (Simplified)');
  console.log('=============================================\n');
  
  const countyArg = process.argv[2];
  
  if (countyArg) {
    // Scrape specific county
    const county = countyArg.toUpperCase();
    const countyCode = STATEWIDE_SERVICE.counties[county];
    
    if (countyCode) {
      await scrapeCounty(county, countyCode);
    } else {
      console.error(`Invalid county: ${countyArg}`);
      console.error(`Valid counties: ${Object.keys(STATEWIDE_SERVICE.counties).join(', ')}`);
    }
  } else {
    // Scrape Charlotte County as a test
    console.log('Running test scrape for Charlotte County...');
    await scrapeCounty('CHARLOTTE', '15');
  }
  
  console.log('\nScraping complete!');
}

// Run the scraper
main().catch(console.error);
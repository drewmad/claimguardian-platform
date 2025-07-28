#!/usr/bin/env node

/**
 * Local scraper script for Florida county property data
 * Run this script locally or on a server you control to bypass Edge Function network restrictions
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

// County configurations
const counties = [
  {
    name: 'fl_charlotte_county',
    serviceUrl: 'https://services1.arcgis.com/O1JpcwDW8sjYuddV/arcgis/rest/services/Parcels/FeatureServer/0',
    fieldMap: {
      'OBJECTID': 'source_object_id',
      'Strap': 'parcel_id',
      'Owner': 'owner_name',
      'Situs_Addr': 'situs_address',
      'Situs_City': 'situs_city',
      'Situs_Zip': 'situs_zip',
      'Total_Just': 'just_value',
      'Year_Built': 'year_built',
      'Prop_Use_C': 'property_use_code',
      'Heated_Are': 'heated_area_sqft'
    }
  },
  {
    name: 'fl_lee_county',
    serviceUrl: 'https://services1.arcgis.com/O1JpcwDW8sjYuddV/arcgis/rest/services/Parcels_Lee/FeatureServer/0',
    fieldMap: {
      'OBJECTID': 'source_object_id',
      'STRAP': 'parcel_id',
      'OWNER_NAME': 'owner_name',
      'SITE_ADDRESS_LINE1': 'situs_address',
      'SITE_ADDRESS_CITY': 'situs_city',
      'SITE_ADDRESS_ZIP': 'situs_zip',
      'TOTAL_ASSESSED_VALUE': 'assessed_value',
      'JUST_MARKET_VALUE': 'just_value',
      'YEAR_BUILT': 'year_built',
      'USE_CODE': 'property_use_code',
      'TOTAL_LIVING_AREA': 'heated_area_sqft'
    }
  },
  {
    name: 'fl_sarasota_county',
    serviceUrl: 'https://gis.scgov.net/arcgis/rest/services/Property/Public_Parcels/MapServer/0',
    fieldMap: {
      'OBJECTID': 'source_object_id',
      'PARCEL_ID': 'parcel_id',
      'OWNER_1': 'owner_name',
      'SITUS_ADDR': 'situs_address',
      'SITUS_CITY': 'situs_city',
      'SITUS_ZIP': 'situs_zip',
      'JV_TOTAL': 'just_value',
      'YR_BLT': 'year_built',
      'DOR_UC': 'property_use_code',
      'TOT_LVG_AR': 'heated_area_sqft'
    }
  }
];

// Helper function to make HTTPS requests
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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

// Create hash for change detection
function createHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Scrape a single county
async function scrapeCounty(county, lastObjectId = 0) {
  console.log(`\n[${county.name}] Starting scrape from OBJECTID > ${lastObjectId}`);
  
  const BATCH_SIZE = 500;
  let allData = [];
  let currentOffset = 0;
  let moreRecords = true;
  let maxObjectIdInRun = lastObjectId;
  
  while (moreRecords) {
    const queryParams = new URLSearchParams({
      where: `OBJECTID > ${lastObjectId}`,
      outFields: Object.keys(county.fieldMap).join(','),
      f: 'json',
      resultOffset: String(currentOffset),
      resultRecordCount: String(BATCH_SIZE),
      orderByFields: 'OBJECTID ASC'
    });
    
    const url = `${county.serviceUrl}/query?${queryParams}`;
    console.log(`[${county.name}] Fetching batch at offset ${currentOffset}...`);
    
    try {
      const response = await httpsGet(url);
      
      if (response.error) {
        throw new Error(response.error.message || 'API error');
      }
      
      if (!response.features || response.features.length === 0) {
        moreRecords = false;
        continue;
      }
      
      const mappedData = response.features.map(feature => {
        const mapped = {};
        for (const [sourceField, targetField] of Object.entries(county.fieldMap)) {
          const value = feature.attributes[sourceField];
          mapped[targetField] = value !== null && value !== undefined ? String(value) : null;
        }
        
        const objectId = feature.attributes.OBJECTID;
        if (objectId > maxObjectIdInRun) {
          maxObjectIdInRun = objectId;
        }
        
        return mapped;
      });
      
      allData.push(...mappedData);
      console.log(`[${county.name}] Fetched ${response.features.length} records (total: ${allData.length})`);
      
      if (response.features.length < BATCH_SIZE) {
        moreRecords = false;
      } else {
        currentOffset += BATCH_SIZE;
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`[${county.name}] Error fetching data:`, error.message);
      return { success: false, error: error.message, data: allData, lastObjectId: maxObjectIdInRun };
    }
  }
  
  console.log(`[${county.name}] Scrape complete. Found ${allData.length} new records.`);
  return { success: true, data: allData, lastObjectId: maxObjectIdInRun };
}

// Save data to Supabase
async function saveToSupabase(countyName, data) {
  if (data.length === 0) return true;
  
  console.log(`[${countyName}] Preparing ${data.length} records for insertion...`);
  
  const recordsToInsert = data.map(record => ({
    source: countyName,
    source_record_id: record.parcel_id || record.source_object_id,
    raw_data: record,
    data_hash: createHash(record)
  }));
  
  // Insert in batches of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
    const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
    
    const { error } = await supabase
      .schema('external_raw_fl')
      .from('property_data')
      .upsert(batch, { onConflict: 'source,source_record_id' });
    
    if (error) {
      console.error(`[${countyName}] Failed to insert batch:`, error);
      return false;
    }
    
    console.log(`[${countyName}] Inserted batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(recordsToInsert.length/BATCH_SIZE)}`);
  }
  
  return true;
}

// Main scraping function
async function main() {
  console.log('Florida County Property Data Scraper');
  console.log('====================================\n');
  
  // Get last run states
  const { data: lastRuns, error: fetchError } = await supabase
    .from('scraper_runs')
    .select('source, last_object_id');
  
  if (fetchError) {
    console.error('Failed to fetch scraper runs:', fetchError);
    return;
  }
  
  const lastRunMap = new Map(lastRuns?.map(run => [run.source, run.last_object_id]) || []);
  
  // Process each county
  for (const county of counties) {
    const lastObjectId = lastRunMap.get(county.name) || 0;
    
    console.log(`\nProcessing ${county.name}...`);
    console.log('='.repeat(40));
    
    const result = await scrapeCounty(county, lastObjectId);
    
    if (result.success && result.data.length > 0) {
      const saved = await saveToSupabase(county.name, result.data);
      
      if (saved) {
        // Update scraper run state
        const { error: updateError } = await supabase
          .from('scraper_runs')
          .upsert({ 
            source: county.name, 
            last_object_id: result.lastObjectId,
            last_run_at: new Date().toISOString()
          }, { onConflict: 'source' });
        
        if (updateError) {
          console.error(`[${county.name}] Failed to update scraper state:`, updateError);
        } else {
          console.log(`[${county.name}] Successfully processed ${result.data.length} records`);
        }
      }
    } else if (!result.success) {
      console.error(`[${county.name}] Scraping failed:`, result.error);
    } else {
      console.log(`[${county.name}] No new data found`);
    }
  }
  
  console.log('\n\nScraping complete!');
}

// Run the scraper
main().catch(console.error);
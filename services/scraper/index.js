#!/usr/bin/env node

/**
 * Florida County Property Data Scraper
 * Designed for Digital Ocean deployment with Supabase integration
 */

const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configuration from environment
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '500');
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3');
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY || '5000');

// Validate environment
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// County configurations
const counties = [
  {
    name: 'fl_charlotte_county',
    serviceUrl: 'https://ccgis.charlottecountyfl.gov/arcgis/rest/services/WEB_Parcels/MapServer/0',
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
    serviceUrl: 'https://maps.leepa.org/arcgis/rest/services/Leegis/SecureParcels/MapServer/0',
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
    serviceUrl: 'https://gis.sc-pa.com/server/rest/services/Parcel/ParcelData/MapServer/1',
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

// Logger with Supabase integration
class Logger {
  constructor(source) {
    this.source = source;
  }

  async log(level, message, metadata = {}) {
    const logEntry = {
      source: this.source,
      level,
      message,
      metadata,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[${this.source}] ${level}: ${message}`);
    
    // Also log to Supabase for monitoring
    try {
      await supabase.from('scraper_logs').insert(logEntry);
    } catch (err) {
      console.error('Failed to log to Supabase:', err.message);
    }
  }

  info(message, metadata) { return this.log('INFO', message, metadata); }
  error(message, metadata) { return this.log('ERROR', message, metadata); }
  warn(message, metadata) { return this.log('WARN', message, metadata); }
}

// HTTP request with retries
async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const data = await new Promise((resolve, reject) => {
        https.get(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ClaimGuardian Property Scraper/1.0'
          },
          timeout: 30000
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error(`Invalid JSON response: ${e.message}`));
            }
          });
        }).on('error', reject);
      });
      
      if (data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
      }
      
      return data;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
    }
  }
}

// Create hash for change detection
function createHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Scrape a single county
async function scrapeCounty(county) {
  const logger = new Logger(county.name);
  
  try {
    // Get last processed object ID
    const { data: lastRun } = await supabase
      .from('scraper_runs')
      .select('last_object_id')
      .eq('source', county.name)
      .single();
    
    const lastObjectId = lastRun?.last_object_id || 0;
    await logger.info(`Starting scrape from OBJECTID > ${lastObjectId}`);
    
    let offset = 0;
    let totalRecords = 0;
    let maxObjectId = lastObjectId;
    let hasMore = true;
    
    // Create scraper run record
    const { data: runRecord } = await supabase
      .from('scraper_runs')
      .upsert({
        source: county.name,
        status: 'running',
        started_at: new Date().toISOString()
      }, { onConflict: 'source' })
      .select()
      .single();
    
    while (hasMore) {
      const queryParams = new URLSearchParams({
        where: `OBJECTID > ${lastObjectId}`,
        outFields: Object.keys(county.fieldMap).join(','),
        f: 'json',
        resultOffset: String(offset),
        resultRecordCount: String(BATCH_SIZE),
        orderByFields: 'OBJECTID ASC'
      });
      
      const url = `${county.serviceUrl}/query?${queryParams}`;
      
      try {
        const response = await fetchWithRetry(url);
        
        if (!response.features || response.features.length === 0) {
          hasMore = false;
          continue;
        }
        
        // Map and prepare records
        const records = response.features.map(feature => {
          const mapped = {};
          for (const [sourceField, targetField] of Object.entries(county.fieldMap)) {
            const value = feature.attributes[sourceField];
            mapped[targetField] = value !== null && value !== undefined ? String(value) : null;
          }
          
          const objectId = feature.attributes.OBJECTID;
          if (objectId > maxObjectId) {
            maxObjectId = objectId;
          }
          
          return {
            source: county.name,
            source_record_id: mapped.parcel_id || mapped.source_object_id,
            raw_data: mapped,
            data_hash: createHash(mapped)
          };
        });
        
        // Insert batch into Supabase
        const { error: insertError } = await supabase
          .schema('external_raw_fl')
          .from('property_data')
          .upsert(records, { onConflict: 'source,source_record_id' });
        
        if (insertError) {
          await logger.error(`Failed to insert batch at offset ${offset}`, { error: insertError });
          // Continue with next batch
        } else {
          totalRecords += records.length;
          await logger.info(`Processed batch: ${records.length} records at offset ${offset}`);
        }
        
        offset += BATCH_SIZE;
        
        if (response.features.length < BATCH_SIZE) {
          hasMore = false;
        }
        
        // Rate limiting pause
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        await logger.error(`Failed to fetch batch at offset ${offset}`, { 
          error: error.message,
          url 
        });
        // Skip this batch and continue
        offset += BATCH_SIZE;
      }
    }
    
    // Update scraper run status
    await supabase
      .from('scraper_runs')
      .update({
        status: 'completed',
        last_object_id: maxObjectId,
        last_run_at: new Date().toISOString(),
        records_processed: totalRecords,
        completed_at: new Date().toISOString()
      })
      .eq('source', county.name);
    
    await logger.info(`Completed scraping. Processed ${totalRecords} records`, {
      lastObjectId: maxObjectId,
      totalRecords
    });
    
    return { success: true, recordsProcessed: totalRecords };
    
  } catch (error) {
    await logger.error(`Scraping failed`, { error: error.message });
    
    // Update status to failed
    await supabase
      .from('scraper_runs')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('source', county.name);
    
    return { success: false, error: error.message };
  }
}

// Health check endpoint for monitoring
async function healthCheck() {
  try {
    const { data, error } = await supabase
      .from('scraper_runs')
      .select('source, status, last_run_at')
      .order('last_run_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    return {
      status: 'healthy',
      lastRun: data[0],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Main execution
async function main() {
  const logger = new Logger('MAIN');
  
  await logger.info('Florida County Property Scraper starting', {
    counties: counties.map(c => c.name),
    batchSize: BATCH_SIZE
  });
  
  const results = [];
  
  // Process counties sequentially to avoid overwhelming services
  for (const county of counties) {
    await logger.info(`Processing ${county.name}`);
    const result = await scrapeCounty(county);
    results.push({ county: county.name, ...result });
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalRecords = results.reduce((sum, r) => sum + (r.recordsProcessed || 0), 0);
  
  await logger.info('Scraping completed', {
    successful,
    failed,
    totalRecords,
    results
  });
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Handle different execution modes
if (process.argv[2] === 'health') {
  // Health check mode
  healthCheck().then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === 'healthy' ? 0 : 1);
  });
} else {
  // Normal scraping mode
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
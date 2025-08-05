// supabase/functions/scrape-florida-parcels/utils/arcgis.ts

import { ScrapeResult, ArcGISAdapterConfig } from '../types.ts';

const BATCH_SIZE = 500;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function scrapeArcGIS(
  config: ArcGISAdapterConfig, 
  lastObjectId = 0
): Promise<ScrapeResult> {
  const allData: any[] = [];
  let currentOffset = 0;
  let moreRecords = true;
  let maxObjectIdInRun = lastObjectId;
  
  console.log(JSON.stringify({
    level: "info",
    timestamp: new Date().toISOString(),
    message: `[${config.source}] Starting scrape from OBJECTID > ${lastObjectId}`
  }));
  
  while (moreRecords) {
    const queryParams = new URLSearchParams({
      where: `OBJECTID > ${lastObjectId}`,
      outFields: Object.keys(config.fieldMap).join(','),
      f: 'json',
      resultOffset: String(currentOffset),
      resultRecordCount: String(BATCH_SIZE),
      orderByFields: 'OBJECTID ASC',
    });
    
    let retries = 0;
    let success = false;
    
    while (retries < MAX_RETRIES && !success) {
      try {
        const response = await fetch(`${config.serviceUrl}/query?${queryParams}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ClaimGuardian/1.0 (Insurance Property Data Collection)',
            'Referer': 'https://claimguardian.com',
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!response.ok) {
          throw new Error(`[${config.source}] API request failed: ${response.status} ${response.statusText}`);
        }
        
        const json = await response.json();
        
        if (json.error) {
          throw new Error(`[${config.source}] API error: ${json.error instanceof Error ? error.message : String(error) || JSON.stringify(json.error)}`);
        }
        
        if (!json.features || json.features.length === 0) {
          moreRecords = false;
          success = true;
          continue;
        }
        
        const features = json.features;
        const mappedData = features.map((feature: any) => {
          const mapped: { [key: string]: any } = {};
          
          // Map fields according to configuration
          for (const [sourceField, targetField] of Object.entries(config.fieldMap)) {
            const value = feature.attributes[sourceField];
            // Convert numbers to strings for consistency
            mapped[targetField] = value !== null && value !== undefined ? String(value) : null;
          }
          
          // Track the maximum OBJECTID for incremental updates
          const objectId = feature.attributes.OBJECTID;
          if (objectId > maxObjectIdInRun) {
            maxObjectIdInRun = objectId;
          }
          
          // Include geometry if available
          if (feature.geometry) {
            mapped.geometry = feature.geometry;
          }
          
          return mapped;
        });
        
        allData.push(...mappedData);
        console.log(JSON.stringify({ level: "info", timestamp: new Date().toISOString(), message: `[${config.source}] Fetched ${features.length} records (total: ${allData.length} }))`);
        
        if (features.length < BATCH_SIZE) {
          moreRecords = false;
        } else {
          currentOffset += BATCH_SIZE;
        }
        
        success = true;
        
      } catch (error) {
        retries++;
        console.log(JSON.stringify({
          level: "info",
          timestamp: new Date().toISOString(),
          message: `[${config.source}] Attempt ${retries}/${MAX_RETRIES} failed:`, error
        }));
        
        if (retries >= MAX_RETRIES) {
          return { 
            source: config.source, 
            success: false, 
            data: allData, // Return partial data if any
            error: error instanceof Error ? error.message : String(error),
            lastObjectId: maxObjectIdInRun 
          };
        }
        
        await sleep(RETRY_DELAY * retries); // Exponential backoff
      }
    }
  }
  
  console.log(JSON.stringify({
    level: "info",
    timestamp: new Date().toISOString(),
    message: `[${config.source}] Scrape complete. Found ${allData.length} new records.`
  }));
  
  return { 
    source: config.source, 
    success: true, 
    data: allData, 
    lastObjectId: maxObjectIdInRun 
  };
}
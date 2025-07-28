/**
 * @fileMetadata
 * @purpose FGIO quarterly parcel sync edge function
 * @owner data-team
 * @dependencies ["@supabase/supabase-js"]
 * @exports ["handler"]
 * @complexity high
 * @tags ["etl", "edge-function", "fgio", "parcels"]
 * @status active
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { FGIO_REST, REQUEST_CONFIG } from "./config.ts";

// Supabase client initialization
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  {
    auth: {
      persistSession: false
    }
  }
);

interface FeatureProperties {
  PARCELID: string;
  CNTYFIPS: string;
  [key: string]: any;
}

interface GeoJsonFeature {
  type: string;
  properties: FeatureProperties;
  geometry: any;
}

interface GeoJsonResponse {
  features: GeoJsonFeature[];
}

async function fetchWithRetry(url: string, attempts = REQUEST_CONFIG.retryAttempts): Promise<Response> {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_CONFIG.timeout)
      });
      
      if (response.ok) {
        return response;
      }
      
      // Don't retry on 4xx errors
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, REQUEST_CONFIG.retryDelay));
    }
  }
  
  throw new Error("Max retry attempts reached");
}

export async function handler(req: Request): Promise<Response> {
  const startTime = Date.now();
  const ingestBatchId = crypto.randomUUID();
  
  // Log ingest start
  const { error: logError } = await supabase
    .from("fl_parcel_ingest_events")
    .insert({
      ingest_batch_id: ingestBatchId,
      source: "fgio",
      status: "started",
      metadata: {
        source_url: FGIO_REST,
        started_by: "cron"
      }
    });
    
  if (logError) {
    console.error("Failed to log ingest start:", logError);
  }

  try {
    console.log("Starting FGIO quarterly sync...");
    
    // 1. Fetch all object IDs
    const idsUrl = `${FGIO_REST}/query?where=1=1&returnIdsOnly=true&f=json`;
    const idsResponse = await fetchWithRetry(idsUrl);
    const { objectIds } = await idsResponse.json();
    
    if (!objectIds || objectIds.length === 0) {
      throw new Error("No object IDs returned from FGIO");
    }
    
    console.log(`Found ${objectIds.length} parcels to sync`);
    
    let totalInserted = 0;
    let totalErrors = 0;
    
    // 2. Process in chunks
    for (let i = 0; i < objectIds.length; i += REQUEST_CONFIG.maxRecordCount) {
      const chunk = objectIds.slice(i, i + REQUEST_CONFIG.maxRecordCount);
      const objectIdList = chunk.join(",");
      
      try {
        // Fetch features with geometry
        const featuresUrl = `${FGIO_REST}/query?objectIds=${objectIdList}&outFields=*&returnGeometry=true&outSR=4326&f=geojson`;
        const featuresResponse = await fetchWithRetry(featuresUrl);
        const geoJson: GeoJsonResponse = await featuresResponse.json();
        
        if (!geoJson.features || geoJson.features.length === 0) {
          console.warn(`No features returned for chunk ${i / REQUEST_CONFIG.maxRecordCount + 1}`);
          continue;
        }
        
        // Transform features for insertion
        const rows = geoJson.features
          .filter(feature => feature.properties.PARCELID && feature.properties.CNTYFIPS)
          .map(feature => ({
            source: "fgio",
            source_url: FGIO_REST,
            county_fips: feature.properties.CNTYFIPS,
            parcel_id: feature.properties.PARCELID,
            geom: feature.geometry,
            attrs: feature.properties,
            ingest_batch_id: ingestBatchId
          }));
        
        if (rows.length === 0) {
          console.warn(`No valid rows in chunk ${i / REQUEST_CONFIG.maxRecordCount + 1}`);
          continue;
        }
        
        // Batch insert with upsert
        const { error: insertError, count } = await supabase
          .from("fl_parcels_raw")
          .upsert(rows, {
            onConflict: "source,parcel_id",
            ignoreDuplicates: false
          });
          
        if (insertError) {
          console.error(`Error inserting chunk ${i / REQUEST_CONFIG.maxRecordCount + 1}:`, insertError);
          totalErrors += rows.length;
        } else {
          totalInserted += rows.length;
          console.log(`Processed chunk ${i / REQUEST_CONFIG.maxRecordCount + 1}: ${rows.length} parcels`);
        }
        
      } catch (chunkError) {
        console.error(`Failed to process chunk starting at ${i}:`, chunkError);
        totalErrors += chunk.length;
      }
      
      // Add small delay between chunks to avoid rate limiting
      if (i + REQUEST_CONFIG.maxRecordCount < objectIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Update ingest log
    const { error: updateError } = await supabase
      .from("fl_parcel_ingest_events")
      .update({
        status: "completed",
        record_count: totalInserted,
        completed_at: new Date().toISOString(),
        metadata: {
          source_url: FGIO_REST,
          started_by: "cron",
          total_objects: objectIds.length,
          total_inserted: totalInserted,
          total_errors: totalErrors,
          duration_ms: Date.now() - startTime
        }
      })
      .eq("ingest_batch_id", ingestBatchId);
      
    if (updateError) {
      console.error("Failed to update ingest log:", updateError);
    }
    
    // Trigger materialized view refresh
    const { error: refreshError } = await supabase.rpc("refresh_parcels_view");
    if (refreshError) {
      console.error("Failed to refresh materialized view:", refreshError);
    }
    
    console.log(`FGIO sync completed. Inserted: ${totalInserted}, Errors: ${totalErrors}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        ingestBatchId,
        totalInserted,
        totalErrors,
        duration: Date.now() - startTime
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    );
    
  } catch (error) {
    console.error("FGIO sync failed:", error);
    
    // Update ingest log with error
    await supabase
      .from("fl_parcel_ingest_events")
      .update({
        status: "failed",
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq("ingest_batch_id", ingestBatchId);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        ingestBatchId
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 500
      }
    );
  }
}

// Handle both direct invocation and scheduled cron
Deno.serve(handler);
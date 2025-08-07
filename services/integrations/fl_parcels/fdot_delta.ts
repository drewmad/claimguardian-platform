/**
 * @fileMetadata
 * @purpose FDOT weekly delta sync for parcel updates
 * @owner data-team
 * @dependencies ["@supabase/supabase-js"]
 * @exports ["handler"]
 * @complexity high
 * @tags ["etl", "edge-function", "fdot", "parcels", "delta"]
 * @status active
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { COUNTY_IDS, FDOT_SERVICE, REQUEST_CONFIG, COUNTY_FIPS_MAP } from "./config.ts";

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
  PARCELID?: string;
  CNTYFIPS?: string;
  COUNTYFIPS?: string;
  objectid?: number;
  layerid?: number;
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

async function syncCountyLayer(layerId: number, ingestBatchId: string): Promise<{ inserted: number; errors: number }> {
  const layerUrl = `${FDOT_SERVICE}/${layerId}`;
  console.log(`Processing county layer ${layerId}...`);

  try {
    // Get max ObjectID already stored for this county
    const { data: maxData, error: maxError } = await supabase
      .rpc("max_objectid_for_county", { cnty_layer: layerId });

    if (maxError) {
      console.error(`Error getting max ObjectID for layer ${layerId}:`, maxError);
    }

    const lastObjectId = maxData?.max || -1;
    console.log(`Last ObjectID for layer ${layerId}: ${lastObjectId}`);

    // Fetch new ObjectIDs
    const idsUrl = `${layerUrl}/query?where=objectid>${lastObjectId}&returnIdsOnly=true&f=json`;
    const idsResponse = await fetchWithRetry(idsUrl);
    const idsData = await idsResponse.json();

    const objectIds = idsData.objectIds || [];

    if (objectIds.length === 0) {
      console.log(`No new parcels for county layer ${layerId}`);
      return { inserted: 0, errors: 0 };
    }

    console.log(`Found ${objectIds.length} new parcels for layer ${layerId}`);

    let totalInserted = 0;
    let totalErrors = 0;

    // Process in chunks
    for (let i = 0; i < objectIds.length; i += REQUEST_CONFIG.fdotPageSize) {
      const chunk = objectIds.slice(i, i + REQUEST_CONFIG.fdotPageSize);
      const objectIdList = chunk.join(",");

      try {
        const featuresUrl = `${layerUrl}/query?objectIds=${objectIdList}&outFields=*&returnGeometry=true&outSR=4326&f=geojson`;
        const featuresResponse = await fetchWithRetry(featuresUrl);
        const geoJson: GeoJsonResponse = await featuresResponse.json();

        if (!geoJson.features || geoJson.features.length === 0) {
          continue;
        }

        // Transform features
        const rows = geoJson.features
          .filter(feature => {
            const parcelId = feature.properties.PARCELID;
            const countyFips = feature.properties.CNTYFIPS || feature.properties.COUNTYFIPS;
            return parcelId && countyFips;
          })
          .map(feature => {
            // Add layerid to attrs for future reference
            feature.properties.layerid = layerId;

            return {
              source: "fdot",
              source_url: layerUrl,
              county_fips: feature.properties.CNTYFIPS || feature.properties.COUNTYFIPS,
              parcel_id: feature.properties.PARCELID,
              geom: feature.geometry,
              attrs: feature.properties,
              ingest_batch_id: ingestBatchId
            };
          });

        if (rows.length === 0) {
          continue;
        }

        // Insert batch
        const { error: insertError } = await supabase
          .from("fl_parcels_raw")
          .upsert(rows, {
            onConflict: "source,parcel_id",
            ignoreDuplicates: false
          });

        if (insertError) {
          console.error(`Error inserting chunk for layer ${layerId}:`, insertError);
          totalErrors += rows.length;
        } else {
          totalInserted += rows.length;
        }

      } catch (chunkError) {
        console.error(`Failed to process chunk for layer ${layerId}:`, chunkError);
        totalErrors += chunk.length;
      }
    }

    return { inserted: totalInserted, errors: totalErrors };

  } catch (error) {
    console.error(`Failed to sync county layer ${layerId}:`, error);
    return { inserted: 0, errors: 0 };
  }
}

export async function handler(req: Request): Promise<Response> {
  const startTime = Date.now();
  const ingestBatchId = crypto.randomUUID();

  // Log ingest start
  await supabase
    .from("fl_parcel_ingest_events")
    .insert({
      ingest_batch_id: ingestBatchId,
      source: "fdot",
      status: "started",
      metadata: {
        source_url: FDOT_SERVICE,
        started_by: "cron",
        sync_type: "delta"
      }
    });

  try {
    console.log("Starting FDOT delta sync...");

    let totalInserted = 0;
    let totalErrors = 0;
    const countyResults: Record<number, { inserted: number; errors: number }> = {};

    // Process each county layer
    for (const layerId of COUNTY_IDS) {
      const result = await syncCountyLayer(layerId, ingestBatchId);
      countyResults[layerId] = result;
      totalInserted += result.inserted;
      totalErrors += result.errors;

      // Add delay between counties to avoid rate limiting
      if (layerId < COUNTY_IDS[COUNTY_IDS.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Update ingest log
    await supabase
      .from("fl_parcel_ingest_events")
      .update({
        status: "completed",
        record_count: totalInserted,
        completed_at: new Date().toISOString(),
        metadata: {
          source_url: FDOT_SERVICE,
          started_by: "cron",
          sync_type: "delta",
          total_inserted: totalInserted,
          total_errors: totalErrors,
          county_results: countyResults,
          duration_ms: Date.now() - startTime
        }
      })
      .eq("ingest_batch_id", ingestBatchId);

    // Trigger materialized view refresh
    const { error: refreshError } = await supabase.rpc("refresh_parcels_view");
    if (refreshError) {
      console.error("Failed to refresh materialized view:", refreshError);
    }

    console.log(`FDOT delta sync completed. Inserted: ${totalInserted}, Errors: ${totalErrors}`);

    return new Response(
      JSON.stringify({
        success: true,
        ingestBatchId,
        totalInserted,
        totalErrors,
        countyResults,
        duration: Date.now() - startTime
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    console.error("FDOT delta sync failed:", error);

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

Deno.serve(handler);

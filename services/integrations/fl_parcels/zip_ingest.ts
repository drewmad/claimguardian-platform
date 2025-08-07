/**
 * @fileMetadata
 * @purpose Generic ZIP shapefile ingest for FGDL and DOR parcels
 * @owner data-team
 * @dependencies ["@supabase/supabase-js", "unzipit"]
 * @exports ["ingestZipShapefile", "handler"]
 * @complexity high
 * @tags ["etl", "edge-function", "shapefile", "zip"]
 * @status active
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { unzip } from "https://esm.sh/unzipit@1.4.3";
import * as shp from "https://esm.sh/shpjs@4.0.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  {
    auth: {
      persistSession: false
    }
  }
);

interface ShapefileFeature {
  type: string;
  properties: Record<string, any>;
  geometry: any;
}

export async function ingestZipShapefile(
  url: string,
  source: "fgdl" | "dor",
  ingestBatchId: string
): Promise<{ inserted: number; errors: number }> {
  console.log(`Downloading ZIP from: ${url}`);

  try {
    // Download ZIP file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log(`Downloaded ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);

    // Unzip the file
    const { entries } = await unzip(arrayBuffer);

    // Find shapefile components
    let shpBuffer: ArrayBuffer | null = null;
    let dbfBuffer: ArrayBuffer | null = null;
    let prjBuffer: ArrayBuffer | null = null;

    for (const [name, entry] of Object.entries(entries)) {
      const lowerName = name.toLowerCase();
      if (lowerName.endsWith('.shp')) {
        shpBuffer = await entry.arrayBuffer();
      } else if (lowerName.endsWith('.dbf')) {
        dbfBuffer = await entry.arrayBuffer();
      } else if (lowerName.endsWith('.prj')) {
        prjBuffer = await entry.arrayBuffer();
      }
    }

    if (!shpBuffer || !dbfBuffer) {
      throw new Error("Missing required shapefile components (.shp or .dbf)");
    }

    console.log("Parsing shapefile...");

    // Parse shapefile
    const geojson = await shp.parseShp(shpBuffer, dbfBuffer, prjBuffer);

    if (!geojson.features || geojson.features.length === 0) {
      throw new Error("No features found in shapefile");
    }

    console.log(`Found ${geojson.features.length} features to process`);

    let totalInserted = 0;
    let totalErrors = 0;
    const batchSize = 1000;

    // Process in batches
    for (let i = 0; i < geojson.features.length; i += batchSize) {
      const batch = geojson.features.slice(i, i + batchSize);

      try {
        // Transform features based on source
        const rows = batch
          .filter((feature: ShapefileFeature) => {
            // Different sources have different field names
            const parcelId = feature.properties.PARCELID ||
                           feature.properties.PARCEL_NO ||
                           feature.properties.PARID;
            const countyFips = feature.properties.CNTYFIPS ||
                             feature.properties.COUNTY ||
                             feature.properties.CNTY_NO;
            return parcelId && countyFips;
          })
          .map((feature: ShapefileFeature) => {
            const parcelId = feature.properties.PARCELID ||
                           feature.properties.PARCEL_NO ||
                           feature.properties.PARID;
            let countyFips = feature.properties.CNTYFIPS ||
                           feature.properties.COUNTY ||
                           feature.properties.CNTY_NO;

            // Normalize county FIPS to 3 digits
            if (typeof countyFips === 'number') {
              countyFips = countyFips.toString().padStart(3, '0');
            } else if (typeof countyFips === 'string' && countyFips.length < 3) {
              countyFips = countyFips.padStart(3, '0');
            }

            return {
              source,
              source_url: url,
              county_fips: countyFips,
              parcel_id: parcelId,
              geom: feature.geometry,
              attrs: feature.properties,
              ingest_batch_id: ingestBatchId
            };
          });

        if (rows.length === 0) {
          console.warn(`No valid rows in batch ${Math.floor(i / batchSize) + 1}`);
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
          console.error(`Error inserting batch:`, insertError);
          totalErrors += rows.length;
        } else {
          totalInserted += rows.length;
          console.log(`Processed batch ${Math.floor(i / batchSize) + 1}: ${rows.length} parcels`);
        }

      } catch (batchError) {
        console.error(`Failed to process batch starting at ${i}:`, batchError);
        totalErrors += batch.length;
      }

      // Add delay between batches
      if (i + batchSize < geojson.features.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return { inserted: totalInserted, errors: totalErrors };

  } catch (error) {
    console.error(`Failed to ingest ZIP shapefile:`, error);
    throw error;
  }
}

export async function handler(req: Request): Promise<Response> {
  const startTime = Date.now();
  const ingestBatchId = crypto.randomUUID();

  // Parse request parameters
  const url = new URL(req.url);
  const sourceUrl = url.searchParams.get("url");
  const source = url.searchParams.get("source") as "fgdl" | "dor";

  if (!sourceUrl || !source || !["fgdl", "dor"].includes(source)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing or invalid parameters. Required: url, source (fgdl or dor)"
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400
      }
    );
  }

  // Log ingest start
  await supabase
    .from("fl_parcel_ingest_events")
    .insert({
      ingest_batch_id: ingestBatchId,
      source,
      status: "started",
      metadata: {
        source_url: sourceUrl,
        started_by: "manual"
      }
    });

  try {
    console.log(`Starting ${source.toUpperCase()} ZIP ingest...`);

    const result = await ingestZipShapefile(sourceUrl, source, ingestBatchId);

    // Update ingest log
    await supabase
      .from("fl_parcel_ingest_events")
      .update({
        status: "completed",
        record_count: result.inserted,
        completed_at: new Date().toISOString(),
        metadata: {
          source_url: sourceUrl,
          started_by: "manual",
          total_inserted: result.inserted,
          total_errors: result.errors,
          duration_ms: Date.now() - startTime
        }
      })
      .eq("ingest_batch_id", ingestBatchId);

    // Trigger materialized view refresh
    const { error: refreshError } = await supabase.rpc("refresh_parcels_view");
    if (refreshError) {
      console.error("Failed to refresh materialized view:", refreshError);
    }

    console.log(`${source.toUpperCase()} ZIP ingest completed. Inserted: ${result.inserted}, Errors: ${result.errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        ingestBatchId,
        totalInserted: result.inserted,
        totalErrors: result.errors,
        duration: Date.now() - startTime
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    console.error(`${source.toUpperCase()} ZIP ingest failed:`, error);

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

// Handle direct invocation
Deno.serve(handler);

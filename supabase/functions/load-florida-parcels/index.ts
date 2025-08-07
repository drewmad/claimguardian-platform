import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { county, offset = 0, limit = 1000 } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(
      `Loading Florida parcels - County: ${county || "All"}, Offset: ${offset}, Limit: ${limit}`,
    );

    // Florida Statewide Parcels endpoint - Updated 2025
    const url = new URL(
      "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Florida_Parcels_2023/FeatureServer/0/query",
    );

    // Build query parameters
    const params = {
      where: county ? `COUNTY = '${county.toUpperCase()}'` : "1=1",
      outFields:
        "PARCEL_ID,CO_NO,COUNTY,SITUS_ADDR,OWN_NAME,OWN_ADDR,DOR_UC,JV,TV_NSD,YR_BLT,LV_SF,ACRES",
      f: "json",
      resultOffset: offset,
      resultRecordCount: limit,
      returnGeometry: "true",
      outSR: "4326",
    };

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    // Fetch data
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch parcels: ${response.statusText}`);
    }

    const data = await response.json();
    const features = data.features || [];

    console.log(`Fetched ${features.length} parcels`);

    let processed = 0;
    let errors = 0;
    const batchSize = 100;

    // Process in batches
    for (let i = 0; i < features.length; i += batchSize) {
      const batch = features.slice(i, i + batchSize);

      try {
        const records = batch
          .map((feature: any) => {
            const { attributes, geometry } = feature;

            // Convert geometry to WKT
            let wkt = null;
            if (geometry && geometry.rings) {
              const rings = geometry.rings
                .map(
                  (ring: number[][]) =>
                    `(${ring.map((coord) => `${coord[0]} ${coord[1]}`).join(",")})`,
                )
                .join(",");
              wkt = `SRID=4326;MULTIPOLYGON((${rings}))`;
            }

            return {
              parcel_id: attributes.PARCEL_ID,
              county_fips: String(attributes.CO_NO).padStart(3, "0"),
              county_name: attributes.COUNTY,
              property_address: attributes.SITUS_ADDR,
              owner_name: attributes.OWN_NAME,
              owner_address: attributes.OWN_ADDR,
              property_use_code: attributes.DOR_UC,
              assessed_value: attributes.JV,
              taxable_value: attributes.TV_NSD,
              year_built: attributes.YR_BLT,
              living_area: attributes.LV_SF,
              land_area: attributes.ACRES,
              geom: wkt,
              raw_data: {
                ...attributes,
                source_metadata: {
                  source_url: url.origin + url.pathname,
                  source_name: "Florida Statewide Parcels 2023",
                  source_agency: "Florida Department of Revenue",
                  fetch_date: new Date().toISOString(),
                  fetch_params: params,
                  record_offset: offset + i,
                },
              },
              data_source: "FL_OPEN_DATA",
              last_updated: new Date().toISOString(),
              created_at: new Date().toISOString(),
            };
          })
          .filter((r) => r.geom && r.parcel_id); // Only include valid records

        if (records.length > 0) {
          const { error } = await supabase
            .from("geospatial.parcels")
            .upsert(records, {
              onConflict: "parcel_id",
              ignoreDuplicates: false,
            });

          if (error) throw error;
          processed += records.length;
        }
      } catch (err) {
        console.error(`Error processing batch ${i}-${i + batchSize}:`, err);
        errors += batch.length;
      }
    }

    // Check if there are more records
    const hasMore = features.length === limit;

    // Log the operation
    await supabase.from("system_logs").insert({
      level: "info",
      message: `Florida parcels loaded`,
      context: {
        county: county || "All",
        offset,
        limit,
        processed,
        errors,
        hasMore,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        errors,
        total: features.length,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in load-florida-parcels:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

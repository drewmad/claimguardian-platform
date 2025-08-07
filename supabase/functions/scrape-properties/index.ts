import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Counties to scrape
    const counties = [
      {
        name: "fl_charlotte_county",
        url: "https://services1.arcgis.com/O1JpcwDW8sjYuddV/arcgis/rest/services/Parcels/FeatureServer/0",
      },
      {
        name: "fl_lee_county",
        url: "https://services1.arcgis.com/O1JpcwDW8sjYuddV/arcgis/rest/services/Parcels_Lee/FeatureServer/0",
      },
      {
        name: "fl_sarasota_county",
        url: "https://gis.scgov.net/arcgis/rest/services/Property/Public_Parcels/MapServer/0",
      },
    ];

    const results = [];

    for (const county of counties) {
      try {
        // Get last processed ID
        const { data: lastRun } = await supabaseClient
          .from("scraper_runs")
          .select("last_object_id")
          .eq("source", county.name)
          .single();

        const lastObjectId = lastRun?.last_object_id || 0;

        // Update status
        await supabaseClient.from("scraper_runs").upsert({
          source: county.name,
          status: "running",
          started_at: new Date().toISOString(),
        });

        // Fetch data from county API
        const response = await fetch(
          `${county.url}/query?where=OBJECTID>${lastObjectId}&outFields=*&f=json&resultRecordCount=500`,
        );

        const data = await response.json();

        if (data.features && data.features.length > 0) {
          // Process and store features
          const records = data.features.map((feature: any) => ({
            source: county.name,
            source_record_id: feature.attributes.OBJECTID.toString(),
            raw_data: feature,
            data_hash: await crypto.subtle
              .digest(
                "SHA-256",
                new TextEncoder().encode(JSON.stringify(feature)),
              )
              .then((buf) =>
                Array.from(new Uint8Array(buf))
                  .map((b) => b.toString(16).padStart(2, "0"))
                  .join(""),
              ),
          }));

          // Insert records
          const { error: insertError } = await supabaseClient
            .from("property_data")
            .insert(records)
            .select();

          if (insertError) throw insertError;

          // Update last processed ID
          const maxObjectId = Math.max(
            ...data.features.map((f: any) => f.attributes.OBJECTID),
          );

          await supabaseClient
            .from("scraper_runs")
            .update({
              status: "completed",
              last_object_id: maxObjectId,
              last_run_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
              records_processed: data.features.length,
            })
            .eq("source", county.name);

          results.push({
            county: county.name,
            processed: data.features.length,
            lastObjectId: maxObjectId,
          });
        }
      } catch (error) {
        console.log(
          JSON.stringify({
            level: "info",
            timestamp: new Date().toISOString(),
            message: `Error processing ${county.name}:`,
            error,
          }),
        );

        await supabaseClient
          .from("scraper_runs")
          .update({
            status: "failed",
            error_message:
              error instanceof Error ? error.message : String(error),
            completed_at: new Date().toISOString(),
          })
          .eq("source", county.name);
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});

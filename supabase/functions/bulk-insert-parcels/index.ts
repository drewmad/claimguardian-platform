import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin":
    process.env.NODE_ENV === "production"
      ? "https://claimguardianai.com"
      : "http://localhost:3000",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }

    // Verify it's a service role key (not anon key)
    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Only allow if the provided token matches service role key
    if (token !== supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - service role required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { parcels } = await req.json();

    if (!parcels || !Array.isArray(parcels)) {
      return new Response(JSON.stringify({ error: "Invalid parcels data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log(`Processing ${parcels.length} parcels for bulk insert`);

    let successful = 0;
    let errors = 0;
    const errorDetails = [];

    // Process each parcel
    for (const parcel of parcels) {
      try {
        // Check if parcel exists
        const { data: existing } = await supabase
          .from("parcels")
          .select("id")
          .eq("parcel_id", parcel.parcel_id)
          .single();

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from("parcels")
            .update(parcel)
            .eq("parcel_id", parcel.parcel_id);

          if (error) {
            errors++;
            errorDetails.push({
              parcel_id: parcel.parcel_id,
              error: error.message,
            });
          } else {
            successful++;
          }
        } else {
          // Insert new
          const { error } = await supabase.from("parcels").insert(parcel);

          if (error) {
            errors++;
            errorDetails.push({
              parcel_id: parcel.parcel_id,
              error: error.message,
            });
          } else {
            successful++;
          }
        }
      } catch (err) {
        errors++;
        errorDetails.push({ parcel_id: parcel.parcel_id, error: err.message });
      }
    }

    console.log(
      `Bulk insert complete: ${successful} successful, ${errors} errors`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        successful,
        errors,
        errorDetails: errorDetails.slice(0, 10), // Return first 10 errors
        total: parcels.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test with a simple parcel record
    const timestamp = Date.now();
    const testParcel = {
      id: crypto.randomUUID(),
      parcel_id: "TEST-" + timestamp,
      county_fips: "044",
      county_name: "MONROE",
      property_address: "123 Test St",
      owner_name: "Test Owner",
      owner_address: "123 Test St",
      property_use_code: "0100",
      assessed_value: 100000,
      taxable_value: 80000,
      year_built: 2000,
      living_area: 1500,
      land_area: 0.25,
      geom: "SRID=4326;MULTIPOLYGON(((-81.767203 24.567003, -81.767203 24.568003, -81.766203 24.568003, -81.766203 24.567003, -81.767203 24.567003)))",
      raw_data: { test: true },
      data_source: "TEST",
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    console.log("Attempting to insert test parcel:", testParcel.parcel_id);

    // Use public schema view
    const { data, error } = await supabase
      .from("parcels")
      .insert(testParcel)
      .select();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          details: error,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test parcel inserted successfully",
        data,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in test-parcel-insert:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

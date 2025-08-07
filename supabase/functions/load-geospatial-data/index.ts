import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Data source configurations
const DATA_SOURCES = {
  fire_stations: {
    name: "Florida Fire Stations",
    url: "https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/Fire_Stations/FeatureServer/0/query",
    params: {
      where: "1=1",
      outFields: "NAME,ADDRESS,CITY,PHONE",
      f: "json",
      resultRecordCount: 2000,
    },
    table: "critical_facilities",
    type: "fire_station",
  },
  active_wildfires: {
    name: "Florida Active Wildfires",
    url: "https://services3.arcgis.com/2p3s2n29pGgURi54/arcgis/rest/services/FFS_Active_Wildfires/FeatureServer/0/query",
    params: {
      where: "1=1",
      outFields: "*",
      f: "json",
    },
    table: "active_events",
    type: "wildfire",
  },
  fema_flood_zones: {
    name: "FEMA Flood Zones",
    url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Flood_Hazard_Reduced_Set_gdb/FeatureServer/0/query",
    params: {
      where: "STATE = 'FL'",
      outFields: "FLD_ZONE,ZONE_SUBTY,STATIC_BFE",
      f: "json",
      resultRecordCount: 1000,
      geometry: JSON.stringify({
        xmin: -87.634896,
        ymin: 24.396308,
        xmax: -79.974306,
        ymax: 31.001056,
        spatialReference: { wkid: 4326 },
      }),
      geometryType: "esriGeometryEnvelope",
      spatialRel: "esriSpatialRelIntersects",
    },
    table: "hazard_zones",
    type: "flood",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { source, operation = "load" } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (operation === "list") {
      return new Response(
        JSON.stringify({
          sources: Object.keys(DATA_SOURCES).map((key) => ({
            id: key,
            ...DATA_SOURCES[key as keyof typeof DATA_SOURCES],
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!source || !DATA_SOURCES[source as keyof typeof DATA_SOURCES]) {
      throw new Error(
        `Invalid source: ${source}. Available: ${Object.keys(DATA_SOURCES).join(", ")}`,
      );
    }

    const config = DATA_SOURCES[source as keyof typeof DATA_SOURCES];
    console.log(`Loading ${config.name}...`);

    // Fetch data from ArcGIS REST API
    const url = new URL(config.url);
    Object.entries(config.params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();
    const features = data.features || [];
    console.log(`Fetched ${features.length} features`);

    let processed = 0;
    let errors = 0;

    // Process based on data type
    if (config.type === "fire_station") {
      for (const feature of features) {
        try {
          const { attributes, geometry } = feature;

          const { error } = await supabase.from("critical_facilities").upsert(
            {
              facility_type: "fire_station",
              name: attributes.NAME || "Unknown",
              address: attributes.ADDRESS || "",
              phone: attributes.PHONE || "",
              geom: `SRID=4326;POINT(${geometry.x} ${geometry.y})`,
              attributes: {
                ...attributes,
                data_source: config.url,
                source_name: config.name,
                last_fetched: new Date().toISOString(),
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "name,facility_type",
              ignoreDuplicates: false,
            },
          );

          if (error) throw error;
          processed++;
        } catch (err) {
          console.error("Error processing facility:", err);
          errors++;
        }
      }
    } else if (config.type === "wildfire") {
      for (const feature of features) {
        try {
          const { attributes, geometry } = feature;

          const { error } = await supabase.from("active_events").upsert(
            {
              external_id:
                attributes.FIRE_ID || `wildfire_${attributes.OBJECTID}`,
              event_type: "wildfire",
              event_name: attributes.FIRE_NAME || "Unnamed Fire",
              status: "active",
              severity:
                attributes.ACRES > 100
                  ? "high"
                  : attributes.ACRES > 10
                    ? "medium"
                    : "low",
              start_time: attributes.DISCOVERY_DATE
                ? new Date(attributes.DISCOVERY_DATE).toISOString()
                : new Date().toISOString(),
              attributes: {
                ...attributes,
                source_url: config.url,
                source_name: config.name,
                last_fetched: new Date().toISOString(),
                fetch_timestamp: Date.now(),
              },
              geom: geometry
                ? `SRID=4326;POINT(${geometry.x} ${geometry.y})`
                : null,
              data_source: "FL_FOREST_SERVICE",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "external_id",
            },
          );

          if (error) throw error;
          processed++;
        } catch (err) {
          console.error("Error processing event:", err);
          errors++;
        }
      }
    } else if (config.type === "flood") {
      // Process flood zones in batches
      const batchSize = 100;
      for (let i = 0; i < features.length; i += batchSize) {
        const batch = features.slice(i, i + batchSize);

        try {
          const records = batch
            .map((feature: any) => {
              const { attributes, geometry } = feature;

              // Map FEMA zones to our hazard types
              const zoneMapping: Record<string, string> = {
                AE: "FEMA_FLOOD_AE",
                VE: "FEMA_FLOOD_VE",
                X: "FEMA_FLOOD_X",
                A: "FEMA_FLOOD_AE",
              };

              const hazardTypeCode =
                zoneMapping[attributes.FLD_ZONE] ||
                `FEMA_FLOOD_${attributes.FLD_ZONE}`;

              // Convert geometry rings to WKT polygon
              let wkt = null;
              if (geometry && geometry.rings) {
                const rings = geometry.rings
                  .map(
                    (ring: number[][]) =>
                      `(${ring.map((coord) => `${coord[0]} ${coord[1]}`).join(",")})`,
                  )
                  .join(",");
                wkt = `SRID=4326;POLYGON(${rings})`;
              }

              return {
                hazard_type_code: hazardTypeCode,
                zone_name: attributes.FLD_ZONE,
                zone_attributes: {
                  base_flood_elevation: attributes.STATIC_BFE,
                  original_attributes: attributes,
                  source_url: config.url,
                  source_name: config.name,
                  fetch_timestamp: new Date().toISOString(),
                },
                geom: wkt,
                effective_date: new Date().toISOString().split("T")[0],
                data_version: new Date()
                  .toISOString()
                  .split("T")[0]
                  .replace(/-/g, ""),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
            })
            .filter((r) => r.geom); // Only include records with valid geometry

          if (records.length > 0) {
            const { error } = await supabase
              .from("hazard_zones")
              .insert(records);

            if (error) throw error;
            processed += records.length;
          }
        } catch (err) {
          console.error(`Error processing batch ${i}-${i + batchSize}:`, err);
          errors += batch.length;
        }
      }
    }

    // Update last sync timestamp
    await supabase.from("system_logs").insert({
      level: "info",
      message: `Geospatial data loaded: ${config.name}`,
      context: {
        source,
        processed,
        errors,
        total: features.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        source: config.name,
        processed,
        errors,
        total: features.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in load-geospatial-data:", error);
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

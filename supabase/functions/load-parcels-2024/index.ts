import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Florida GIO ArcGIS Feature Service endpoints
const FLORIDA_GIO_BASE =
  "https://services1.arcgis.com/pGfbNJoYypmNq86F/arcgis/rest/services";
const PARCEL_SERVICE = "Florida_Statewide_Parcels_Current/FeatureServer/0";

// County mapping
const COUNTIES: Record<string, { name: string; fips: string; number: number }> =
  {
    CHARLOTTE: { name: "Charlotte", fips: "12015", number: 15 },
    // Add more counties as needed
  };

interface LoadParcelsRequest {
  county: string;
  offset?: number;
  limit?: number;
  mode?: "count" | "load"; // count first to get total, then load with pagination
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: LoadParcelsRequest = await req.json();
    const {
      county = "CHARLOTTE",
      offset = 0,
      limit = 1000,
      mode = "load",
    } = body;

    const countyInfo = COUNTIES[county.toUpperCase()];
    if (!countyInfo) {
      throw new Error(`County ${county} not configured`);
    }

    console.log(
      `Loading ${countyInfo.name} County parcels (2024 data) - Mode: ${mode}, Offset: ${offset}, Limit: ${limit}`,
    );

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build Florida GIO query URL
    const serviceUrl = `${FLORIDA_GIO_BASE}/${PARCEL_SERVICE}/query`;

    // First, get count if in count mode
    if (mode === "count") {
      const countParams = new URLSearchParams({
        where: `COUNTY = '${countyInfo.name.toUpperCase()}'`,
        returnCountOnly: "true",
        f: "json",
      });

      const countResponse = await fetch(`${serviceUrl}?${countParams}`);
      if (!countResponse.ok) {
        throw new Error(`Count query failed: ${countResponse.status}`);
      }

      const countData = await countResponse.json();

      return new Response(
        JSON.stringify({
          success: true,
          county: countyInfo.name,
          totalCount: countData.count || 0,
          message: `Found ${countData.count || 0} parcels in ${countyInfo.name} County`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Load mode - fetch actual parcels
    const queryParams = new URLSearchParams({
      where: `COUNTY = '${countyInfo.name.toUpperCase()}'`,
      outFields: "*", // Get all fields
      returnGeometry: "true",
      geometryType: "esriGeometryPolygon",
      spatialRel: "esriSpatialRelIntersects",
      outSR: "4326", // WGS84
      f: "json",
      resultOffset: offset.toString(),
      resultRecordCount: limit.toString(),
      orderByFields: "PARCEL_ID", // Consistent ordering
    });

    console.log("Fetching from Florida GIO:", `${serviceUrl}?${queryParams}`);

    // Fetch with retry logic
    let data;
    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      try {
        const response = await fetch(`${serviceUrl}?${queryParams}`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Florida GIO API error: ${response.status} - ${errorText}`,
          );
        }
        data = await response.json();
        break;
      } catch (err) {
        attempts++;
        if (attempts === maxRetries) throw err;
        const delay = 1000 * 2 ** attempts;
        console.warn(
          `Retry ${attempts} after error: ${err.message}. Waiting ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    const features = data.features || [];
    console.log(`Received ${features.length} features from Florida GIO`);

    const records = [];
    const errors = [];
    const processedIds = new Set<string>();

    for (const feature of features) {
      try {
        const { attributes, geometry } = feature;

        // Skip if we've already processed this parcel ID
        const parcelId = attributes.PARCEL_ID || attributes.PARCELNO;
        if (!parcelId || processedIds.has(parcelId)) {
          continue;
        }
        processedIds.add(parcelId);

        // Convert ESRI geometry to PostGIS WKT
        let wkt = null;
        if (geometry?.rings) {
          const rings = geometry.rings;
          if (rings.length === 1) {
            // Single ring polygon
            const ringStr = rings[0]
              .map((coord: number[]) => `${coord[0]} ${coord[1]}`)
              .join(",");
            wkt = `SRID=4326;POLYGON((${ringStr}))`;
          } else if (rings.length > 1) {
            // Multi-ring polygon (with holes or multiple parts)
            const multiStr = rings
              .map(
                (ring: number[][]) =>
                  `((${ring.map((coord) => `${coord[0]} ${coord[1]}`).join(",")}))`,
              )
              .join(",");
            wkt = `SRID=4326;MULTIPOLYGON(${multiStr})`;
          }
        }

        // Map to florida_parcels table - using uppercase columns
        const record = {
          // Core identifiers
          CO_NO: countyInfo.number,
          PARCEL_ID: parcelId,
          county_fips: countyInfo.fips,

          // Assessment data from 2024
          ASMNT_YR: 2024,
          DOR_UC: attributes.DOR_UC || attributes.USE_CODE || null,
          PA_UC: attributes.PA_UC || null,
          JV: parseFloat(attributes.JV || attributes.JUST_VALUE || 0) || null,
          TV_NSD:
            parseFloat(attributes.TV_NSD || attributes.TAXABLE_VALUE || 0) ||
            null,

          // Owner information
          OWN_NAME: attributes.OWNER_NAME || attributes.OWN_NAME || null,
          OWN_ADDR1: attributes.OWNER_ADDR1 || attributes.OWN_ADDR1 || null,
          OWN_ADDR2: attributes.OWNER_ADDR2 || attributes.OWN_ADDR2 || null,
          OWN_CITY: attributes.OWNER_CITY || attributes.OWN_CITY || null,
          OWN_STATE: attributes.OWNER_STATE || attributes.OWN_STATE || null,
          OWN_ZIPCD: attributes.OWNER_ZIP || attributes.OWN_ZIPCD || null,

          // Property address
          PHY_ADDR1:
            attributes.SITE_ADDR ||
            attributes.PHY_ADDR1 ||
            attributes.SITUS_ADDR ||
            null,
          PHY_ADDR2: attributes.SITE_ADDR2 || attributes.PHY_ADDR2 || null,
          PHY_CITY: attributes.SITE_CITY || attributes.PHY_CITY || null,
          PHY_ZIPCD: attributes.SITE_ZIP || attributes.PHY_ZIPCD || null,

          // Building information
          EFF_YR_BLT:
            parseInt(attributes.YEAR_BUILT || attributes.EFF_YR_BLT || 0) ||
            null,
          ACT_YR_BLT:
            parseInt(attributes.ACT_YR_BLT || attributes.YEAR_BUILT || 0) ||
            null,
          TOT_LVG_AR:
            parseFloat(attributes.HEATED_AREA || attributes.TOT_LVG_AR || 0) ||
            null,
          LND_SQFOOT:
            parseFloat(attributes.LND_SQFOOT || attributes.LAND_SQFT || 0) ||
            null,
          NO_BULDNG:
            parseInt(attributes.NO_BULDNG || attributes.BLDG_NUM || 0) || null,

          // Values
          LND_VAL:
            parseFloat(attributes.LAND_VAL || attributes.LND_VAL || 0) || null,
          IMP_VAL:
            parseFloat(attributes.BLDG_VAL || attributes.IMP_VAL || 0) || null,

          // Sale information
          SALE_PRC1:
            parseFloat(attributes.SALE_PRICE || attributes.SALE_PRC1 || 0) ||
            null,
          SALE_YR1:
            parseInt(attributes.SALE_YEAR || attributes.SALE_YR1 || 0) || null,
          SALE_MO1:
            parseInt(attributes.SALE_MONTH || attributes.SALE_MO1 || 0) || null,

          // Legal description
          S_LEGAL: attributes.LEGAL_DESC || attributes.S_LEGAL || null,

          // Subdivision info
          SUB: attributes.SUBDIVISION || attributes.SUB || null,
          BLOCK: attributes.BLOCK || null,
          LOT: attributes.LOT || null,

          // Township/Range/Section
          TWP: attributes.TOWNSHIP || attributes.TWP || null,
          RNG: attributes.RANGE || attributes.RNG || null,
          SEC: attributes.SECTION || attributes.SEC || null,

          // Geometry and location
          geom: wkt,
          LATITUDE: geometry?.rings?.[0]?.[0]?.[1] || null,
          LONGITUDE: geometry?.rings?.[0]?.[0]?.[0] || null,

          // Metadata
          data_source: "FLORIDA_GIO_2024",
          import_batch: `${county.toLowerCase()}_2024_${new Date().toISOString().split("T")[0]}`,
          import_date: new Date().toISOString(),
        };

        records.push(record);
      } catch (err) {
        console.error("Error processing parcel:", err);
        errors.push({
          parcelId: feature?.attributes?.PARCEL_ID,
          error: err.message,
          stack: err.stack,
        });
      }
    }

    // Batch upsert
    if (records.length > 0) {
      console.log(
        `Upserting ${records.length} records to florida_parcels table...`,
      );

      const { error } = await supabase.from("florida_parcels").upsert(records, {
        onConflict: "CO_NO,PARCEL_ID",
        ignoreDuplicates: false,
      });

      if (error) {
        console.error("Batch upsert error:", error);
        throw error;
      }
    }

    const processed = records.length;
    const hasMore = features.length === limit; // If we got full limit, there might be more

    // Log to system_logs
    try {
      await supabase.from("system_logs").insert({
        level: "info",
        message: `${countyInfo.name} County parcels (2024) load completed`,
        metadata: {
          county: countyInfo.name,
          offset,
          limit,
          processed,
          errors: errors.length,
          hasMore,
          dataSource: "FLORIDA_GIO_2024",
        },
        created_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error("Failed to write to system_logs:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        county: countyInfo.name,
        processed,
        errors: errors.length,
        total: features.length,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
        message: `Processed ${processed} parcels from 2024 Florida GIO data`,
        dataSource: "FLORIDA_GIO_2024",
        errorSample: errors.slice(0, 3), // First 3 errors for debugging
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Function error:", err);

    // Log error
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await supabase.from("system_logs").insert({
        level: "error",
        message: "2024 parcels load failed",
        metadata: {
          error: err.message,
          stack: err.stack,
          request: req.body,
        },
        created_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(
      JSON.stringify({
        error: err.message,
        success: false,
        details: err.stack,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

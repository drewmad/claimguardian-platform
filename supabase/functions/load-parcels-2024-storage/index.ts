import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// County mapping
const COUNTIES: Record<string, { name: string; fips: string; number: number }> =
  {
    CHARLOTTE: { name: "Charlotte", fips: "12015", number: 15 },
  };

interface LoadRequest {
  county: string;
  offset?: number;
  limit?: number;
  useFullFile?: boolean; // Use full statewide file instead of county subset
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: LoadRequest = await req.json();
    const {
      county = "CHARLOTTE",
      offset = 0,
      limit = 1000,
      useFullFile = false,
    } = body;

    const countyInfo = COUNTIES[county.toUpperCase()];
    if (!countyInfo) {
      throw new Error(`County ${county} not configured`);
    }

    console.log(
      `Loading ${countyInfo.name} County parcels from Storage - Offset: ${offset}, Limit: ${limit}`,
    );

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine which file to use
    const fileName = useFullFile
      ? "2024/florida_parcels_full.geojson"
      : `2024/${county.toLowerCase()}_parcels.geojson`;

    // Get signed URL for the file
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from("parcels")
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    if (urlError || !signedUrlData?.signedUrl) {
      throw new Error(
        `Failed to get signed URL: ${urlError?.message || "No URL returned"}`,
      );
    }

    console.log(`Fetching from Storage: ${fileName}`);

    // Fetch the file
    const response = await fetch(signedUrlData.signedUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch file: ${response.status} ${response.statusText}`,
      );
    }

    // Parse JSON (for county subset files, this should be manageable)
    // For full file, we'd need streaming parser
    const geojsonData = await response.json();

    let features = geojsonData.features || [];
    console.log(`Total features in file: ${features.length}`);

    // Filter by county if using full file
    if (useFullFile) {
      features = features.filter(
        (f: any) =>
          f.properties?.COUNTYNAME === countyInfo.name.toUpperCase() ||
          f.properties?.COUNTY === countyInfo.name.toUpperCase(),
      );
      console.log(
        `Filtered to ${features.length} ${countyInfo.name} County features`,
      );
    }

    // Apply pagination
    const paginatedFeatures = features.slice(offset, offset + limit);
    console.log(
      `Processing ${paginatedFeatures.length} features (offset: ${offset}, limit: ${limit})`,
    );

    const records = [];
    const errors = [];

    for (const feature of paginatedFeatures) {
      try {
        const props = feature.properties || {};
        const geometry = feature.geometry;

        // Convert GeoJSON geometry to PostGIS WKT
        let wkt = null;
        if (geometry && geometry.type === "Polygon" && geometry.coordinates) {
          const coords = geometry.coordinates;
          if (coords.length === 1) {
            // Simple polygon
            const ringStr = coords[0]
              .map((c: number[]) => `${c[0]} ${c[1]}`)
              .join(",");
            wkt = `SRID=4326;POLYGON((${ringStr}))`;
          } else {
            // Polygon with holes
            const ringsStr = coords
              .map(
                (ring: number[][]) =>
                  `(${ring.map((c) => `${c[0]} ${c[1]}`).join(",")})`,
              )
              .join(",");
            wkt = `SRID=4326;POLYGON(${ringsStr})`;
          }
        } else if (
          geometry &&
          geometry.type === "MultiPolygon" &&
          geometry.coordinates
        ) {
          // MultiPolygon
          const polysStr = geometry.coordinates
            .map(
              (poly: number[][][]) =>
                `(${poly
                  .map(
                    (ring) =>
                      `(${ring.map((c) => `${c[0]} ${c[1]}`).join(",")})`,
                  )
                  .join(",")})`,
            )
            .join(",");
          wkt = `SRID=4326;MULTIPOLYGON(${polysStr})`;
        }

        // Map 2024 field names to florida_parcels schema
        const record = {
          // Core identifiers
          CO_NO: countyInfo.number,
          PARCEL_ID: props.PARCEL_ID || props.PARCELNO || props.PCN,
          county_fips: countyInfo.fips,

          // Assessment data
          ASMNT_YR: parseInt(props.ASMNT_YR || "2024"),
          DOR_UC: props.DOR_UC || props.USE_CODE,
          PA_UC: props.PA_UC,

          // Values - parse as numbers
          JV: parseFloat(props.JV || props.JUST_VALUE || "0") || null,
          TV_NSD:
            parseFloat(props.TV_NSD || props.TAXABLE_VALUE || "0") || null,
          LND_VAL: parseFloat(props.LND_VAL || props.LAND_VAL || "0") || null,
          IMP_VAL: parseFloat(props.IMP_VAL || props.BLDG_VAL || "0") || null,

          // Owner information (2024 uses OWN_NAME1, MAIL_ADDR1, etc.)
          OWN_NAME: props.OWN_NAME1 || props.OWN_NAME || props.OWNER_NAME,
          OWN_ADDR1: props.MAIL_ADDR1 || props.OWN_ADDR1 || props.OWNER_ADDR1,
          OWN_ADDR2: props.MAIL_ADDR2 || props.OWN_ADDR2,
          OWN_CITY: props.MAIL_CITY || props.OWN_CITY || props.OWNER_CITY,
          OWN_STATE: props.MAIL_STATE || props.OWN_STATE || props.OWNER_STATE,
          OWN_ZIPCD: props.MAIL_ZIPCD || props.OWN_ZIPCD || props.OWNER_ZIP,

          // Property address
          PHY_ADDR1: props.PHY_ADDR1 || props.SITE_ADDR || props.SITUS_ADDR,
          PHY_ADDR2: props.PHY_ADDR2,
          PHY_CITY: props.PHY_CITY || props.SITE_CITY,
          PHY_ZIPCD: props.PHY_ZIPCD || props.SITE_ZIP,

          // Building info
          EFF_YR_BLT:
            parseInt(props.EFF_YR_BLT || props.YEAR_BUILT || "0") || null,
          ACT_YR_BLT:
            parseInt(props.ACT_YR_BLT || props.ACTUAL_YEAR_BUILT || "0") ||
            null,
          TOT_LVG_AR:
            parseFloat(
              props.TOT_LVG_AREA ||
                props.TOT_LVG_AR ||
                props.HEATED_AREA ||
                "0",
            ) || null,
          LND_SQFOOT:
            parseFloat(props.LAND_SQ_FOOTAGE || props.LND_SQFOOT || "0") ||
            null,
          NO_BULDNG: parseInt(props.NO_BULDNG || props.BLDG_NUM || "0") || null,

          // Sale info
          SALE_PRC1:
            parseFloat(props.SALE_PRC1 || props.SALE_PRICE || "0") || null,
          SALE_YR1: parseInt(props.SALE_YR1 || props.SALE_YEAR || "0") || null,
          SALE_MO1: parseInt(props.SALE_MO1 || props.SALE_MONTH || "0") || null,
          VI_CD1: props.VI_CD1 || props.VALID_CODE,
          QUAL_CD1: props.QUAL_CD1 || props.QUAL_CODE,

          // Legal description
          S_LEGAL: props.S_LEGAL || props.LEGAL_DESC || props.LEGAL,

          // Subdivision/location
          SUB: props.SUB || props.SUBDIVISION,
          BLOCK: props.BLOCK,
          LOT: props.LOT,
          TWP: props.TWP || props.TOWNSHIP,
          RNG: props.RNG || props.RANGE,
          SEC: props.SEC || props.SECTION,

          // Neighborhood
          NBRHD_CD: props.NBRHD_CD || props.NEIGHBORHOOD,

          // Geometry
          geom: wkt,
          LATITUDE: geometry?.coordinates?.[0]?.[0]?.[1] || null,
          LONGITUDE: geometry?.coordinates?.[0]?.[0]?.[0] || null,

          // Metadata
          data_source: "FLORIDA_GIO_2024",
          import_batch: `${county.toLowerCase()}_2024_storage_${new Date().toISOString().split("T")[0]}`,
          import_date: new Date().toISOString(),
        };

        // Skip if no parcel ID
        if (!record.PARCEL_ID) {
          errors.push({
            reason: "Missing PARCEL_ID",
            properties: props,
          });
          continue;
        }

        records.push(record);
      } catch (err) {
        console.error("Error processing feature:", err);
        errors.push({
          parcelId: feature.properties?.PARCEL_ID,
          error: err.message,
          stack: err.stack,
        });
      }
    }

    // Batch upsert
    if (records.length > 0) {
      console.log(`Upserting ${records.length} records...`);

      const { error: upsertError } = await supabase
        .from("florida_parcels")
        .upsert(records, {
          onConflict: "CO_NO,PARCEL_ID",
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error("Upsert error:", upsertError);
        throw upsertError;
      }
    }

    const hasMore = offset + limit < features.length;

    // Log operation
    try {
      await supabase.from("system_logs").insert({
        level: "info",
        message: `${countyInfo.name} parcels loaded from Storage`,
        metadata: {
          county: countyInfo.name,
          fileName,
          offset,
          limit,
          totalInFile: features.length,
          processed: records.length,
          errors: errors.length,
          hasMore,
        },
        created_at: new Date().toISOString(),
      });
    } catch (logErr) {
      console.error("Failed to log:", logErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        county: countyInfo.name,
        processed: records.length,
        errors: errors.length,
        totalAvailable: features.length,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
        message: `Processed ${records.length} parcels from 2024 Storage data`,
        errorSample: errors.slice(0, 3),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Function error:", err);

    // Try to log error
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await supabase.from("system_logs").insert({
        level: "error",
        message: "Storage parcels load failed",
        metadata: {
          error: err.message,
          stack: err.stack,
        },
        created_at: new Date().toISOString(),
      });
    } catch (logErr) {
      console.error("Failed to log error:", logErr);
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

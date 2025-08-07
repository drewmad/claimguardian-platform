#!/usr/bin/env node

/**
 * Florida Parcels Batch Import
 * Imports GDB data in manageable batches to avoid disk space issues
 */

const { exec } = require("child_process");
const { promisify } = require("util");
const { createClient } = require("@supabase/supabase-js");

const execAsync = promisify(exec);

// Configuration
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tmlrvecuwgppbaynesji.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error(
    "Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Counties with FIPS codes
const FLORIDA_COUNTIES = [
  { name: "Charlotte", fips: 15 },
  { name: "Lee", fips: 71 },
  { name: "Sarasota", fips: 115 },
  { name: "Collier", fips: 21 },
  { name: "Miami-Dade", fips: 86 },
  { name: "Broward", fips: 11 },
  { name: "Palm Beach", fips: 99 },
];

async function checkGDBLayers() {
  console.log("Checking GDB file structure...");

  try {
    const { stdout } = await execAsync("ogrinfo -so Cadastral_Statewide.gdb");
    const layers = stdout.match(/Layer name: (.+)/g);

    if (layers) {
      console.log("Found layers:");
      layers.forEach((layer) => {
        console.log(`  - ${layer.replace("Layer name: ", "")}`);
      });

      // Find the main parcels layer
      const parcelsLayer = layers.find((l) => /parcel|cadastral/i.test(l));
      if (parcelsLayer) {
        return parcelsLayer.replace("Layer name: ", "").trim();
      }
    }
  } catch (error) {
    console.error("Error reading GDB:", error.message);
  }

  return null;
}

async function importCountyData(
  layerName,
  countyFips,
  offset = 0,
  limit = 1000,
) {
  console.log(`Importing county ${countyFips} (offset: ${offset})...`);

  const tempFile = `/tmp/parcels_${countyFips}_${offset}.json`;

  try {
    // Export subset to GeoJSON
    const exportCmd =
      `ogr2ogr -f GeoJSON ${tempFile} Cadastral_Statewide.gdb "${layerName}" ` +
      `-where "CO_NO = ${countyFips}" -skipfailures -t_srs EPSG:4326 ` +
      `-sql "SELECT * FROM \\"${layerName}\\" WHERE CO_NO = ${countyFips} LIMIT ${limit} OFFSET ${offset}"`;

    await execAsync(exportCmd);

    // Read and parse GeoJSON
    const fs = require("fs");
    const geoData = JSON.parse(fs.readFileSync(tempFile, "utf8"));

    if (!geoData.features || geoData.features.length === 0) {
      console.log(`No more data for county ${countyFips}`);
      return 0;
    }

    // Transform features to database format
    const records = geoData.features.map((feature) => {
      const props = feature.properties;
      return {
        parcel_id: props.PARCEL_ID,
        co_no: props.CO_NO,
        asmnt_yr: props.ASMNT_YR,
        jv: props.JV,
        av_sd: props.AV_SD,
        av_nsd: props.AV_NSD,
        tv_sd: props.TV_SD,
        tv_nsd: props.TV_NSD,
        dor_uc: props.DOR_UC,
        pa_uc: props.PA_UC,
        land_val: props.LND_VAL,
        bldg_val: props.BLDG_VAL,
        tot_val: props.TOT_VAL,
        act_yr_blt: props.ACT_YR_BLT,
        eff_yr_blt: props.EFF_YR_BLT,
        tot_lvg_ar: props.TOT_LVG_AR,
        land_sqfoot: props.LND_SQFOOT,
        no_buldng: props.NO_BULDNG,
        no_res_unt: props.NO_RES_UNT,
        own_name: props.OWN_NAME,
        own_addr1: props.OWN_ADDR1,
        own_addr2: props.OWN_ADDR2,
        own_city: props.OWN_CITY,
        own_state: props.OWN_STATE,
        own_zipcd: props.OWN_ZIPCD,
        phy_addr1: props.PHY_ADDR1,
        phy_addr2: props.PHY_ADDR2,
        phy_city: props.PHY_CITY,
        phy_zipcd: props.PHY_ZIPCD,
        s_legal: props.S_LEGAL,
        twn: props.TWN,
        rng: props.RNG,
        sec: props.SEC,
        sale_prc1: props.SALE_PRC1,
        sale_yr1: props.SALE_YR1,
        sale_mo1: props.SALE_MO1,
        nbrhd_cd: props.NBRHD_CD,
        census_bk: props.CENSUS_BK,
        mkt_ar: props.MKT_AR,
        raw_data: props,
        geom: feature.geometry,
      };
    });

    // Insert to database
    const { error } = await supabase.from("florida_parcels").upsert(records, {
      onConflict: "parcel_id,co_no",
      ignoreDuplicates: true,
    });

    if (error) {
      console.error("Insert error:", error);
    } else {
      console.log(`Inserted ${records.length} parcels`);
    }

    // Clean up temp file
    fs.unlinkSync(tempFile);

    return records.length;
  } catch (error) {
    console.error(`Error processing batch:`, error.message);
    return 0;
  }
}

async function importAllCounties(layerName) {
  for (const county of FLORIDA_COUNTIES) {
    console.log(`\nProcessing ${county.name} County (FIPS: ${county.fips})...`);

    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const imported = await importCountyData(layerName, county.fips, offset);

      if (imported === 0) {
        hasMore = false;
      } else {
        offset += imported;
        // Small delay to avoid overwhelming the system
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Get county summary
    const { data: summary } = await supabase
      .from("florida_parcels")
      .select("co_no", { count: "exact", head: true })
      .eq("co_no", county.fips);

    console.log(
      `${county.name} County complete. Total parcels: ${summary?.count || 0}`,
    );
  }
}

async function main() {
  console.log("Florida Parcels Batch Import Tool");
  console.log("=================================\n");

  // Check if table exists
  const { data: tables } = await supabase
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_schema", "public")
    .eq("table_name", "florida_parcels")
    .single();

  if (!tables) {
    console.error("Error: florida_parcels table does not exist");
    console.error(
      "Please run: psql $DATABASE_URL -f create-florida-parcels-schema.sql",
    );
    process.exit(1);
  }

  // Find parcels layer
  const layerName = await checkGDBLayers();

  if (!layerName) {
    console.error("Could not find parcels layer in GDB file");
    process.exit(1);
  }

  console.log(`\nUsing layer: ${layerName}`);
  console.log("Starting import...\n");

  // Import all counties
  await importAllCounties(layerName);

  // Final summary
  const { data: totalSummary } = await supabase
    .from("florida_parcels")
    .select("co_no", { count: "exact", head: true });

  console.log(`\n\nImport complete!`);
  console.log(`Total parcels imported: ${totalSummary?.count || 0}`);

  // Show county breakdown
  const { data: countyBreakdown } = await supabase
    .from("florida_parcels_summary")
    .select("*")
    .order("co_no");

  if (countyBreakdown) {
    console.log("\nCounty breakdown:");
    countyBreakdown.forEach((county) => {
      console.log(`  ${county.county_name}: ${county.parcel_count} parcels`);
    });
  }
}

// Run the import
main().catch(console.error);

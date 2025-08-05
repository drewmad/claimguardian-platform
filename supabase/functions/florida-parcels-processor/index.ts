import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { extract } from "https://deno.land/x/zip@v1.2.5/mod.ts";
import { ensureDir } from "https://deno.land/std@0.177.0/fs/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Florida county codes and names mapping
const FLORIDA_COUNTIES = {
  1: "ALACHUA", 2: "BAKER", 3: "BAY", 4: "BRADFORD", 5: "BREVARD",
  6: "BROWARD", 7: "CALHOUN", 8: "CHARLOTTE", 9: "CITRUS", 10: "CLAY",
  11: "COLLIER", 12: "COLUMBIA", 13: "DADE", 14: "DESOTO", 15: "DIXIE",
  16: "DUVAL", 17: "ESCAMBIA", 18: "FLAGLER", 19: "FRANKLIN", 20: "GADSDEN",
  21: "GILCHRIST", 22: "GLADES", 23: "GULF", 24: "HAMILTON", 25: "HARDEE",
  26: "HENDRY", 27: "HERNANDO", 28: "HIGHLANDS", 29: "HILLSBOROUGH", 30: "HOLMES",
  31: "INDIAN RIVER", 32: "JACKSON", 33: "JEFFERSON", 34: "LAFAYETTE", 35: "LAKE",
  36: "LEE", 37: "LEON", 38: "LEVY", 39: "LIBERTY", 40: "MADISON",
  41: "MANATEE", 42: "MARION", 43: "MARTIN", 44: "MONROE", 45: "NASSAU",
  46: "OKALOOSA", 47: "OKEECHOBEE", 48: "ORANGE", 49: "OSCEOLA", 50: "PALM BEACH",
  51: "PASCO", 52: "PINELLAS", 53: "POLK", 54: "PUTNAM", 55: "ST. JOHNS",
  56: "ST. LUCIE", 57: "SANTA ROSA", 58: "SARASOTA", 59: "SEMINOLE", 60: "SUMTER",
  61: "SUWANNEE", 62: "TAYLOR", 63: "UNION", 64: "VOLUSIA", 65: "WAKULLA",
  66: "WALTON", 67: "WASHINGTON"
};

interface ProcessingRequest {
  action: 'status' | 'process' | 'verify';
  county_code?: number;
  batch_size?: number;
  resume_from?: number;
}

interface ProcessingStatus {
  county_code: number;
  county_name: string;
  total_parcels: number;
  processed_parcels: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  last_updated: string;
  error_message?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, county_code, batch_size = 1000, resume_from = 0 } = await req.json() as ProcessingRequest;

    switch (action) {
      case 'status':
        return await getProcessingStatus(supabase);
      
      case 'process':
        if (!county_code || !FLORIDA_COUNTIES[county_code]) {
          throw new Error(`Invalid county code: ${county_code}`);
        }
        return await processCounty(supabase, county_code, batch_size, resume_from);
      
      case 'verify':
        return await verifyData(supabase, county_code);
      
      default:
        throw new Error(`Invalid action: ${action}`);
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

async function getProcessingStatus(supabase: any): Promise<Response> {
  // Get processing status for all counties
  const statuses: ProcessingStatus[] = [];
  
  for (const [code, name] of Object.entries(FLORIDA_COUNTIES)) {
    const countyCode = parseInt(code);
    
    // Check processing log
    const { data: logData } = await supabase
      .from('florida_parcels_processing_log')
      .select('*')
      .eq('county_code', countyCode)
      .order('created_at', { ascending: false })
      .limit(1);
    
    // Count parcels
    const { count } = await supabase
      .from('florida_parcels')
      .select('*', { count: 'exact', head: true })
      .eq('CO_NO', countyCode);
    
    const log = logData?.[0];
    
    statuses.push({
      county_code: countyCode,
      county_name: name,
      total_parcels: log?.total_parcels || 0,
      processed_parcels: count || 0,
      status: log?.status || 'pending',
      last_updated: log?.updated_at || new Date().toISOString(),
      error_message: log?.error_message
    });
  }
  
  // Summary statistics
  const summary = {
    total_counties: Object.keys(FLORIDA_COUNTIES).length,
    completed_counties: statuses.filter(s => s.status === 'completed').length,
    processing_counties: statuses.filter(s => s.status === 'processing').length,
    pending_counties: statuses.filter(s => s.status === 'pending').length,
    error_counties: statuses.filter(s => s.status === 'error').length,
    total_parcels_processed: statuses.reduce((sum, s) => sum + s.processed_parcels, 0)
  };
  
  return new Response(
    JSON.stringify({ summary, counties: statuses }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function processCounty(
  supabase: any, 
  countyCode: number, 
  batchSize: number,
  resumeFrom: number
): Promise<Response> {
  const countyName = FLORIDA_COUNTIES[countyCode];
  console.log(`Processing ${countyName} County (${countyCode})`);
  
  // Update processing log
  await supabase.from('florida_parcels_processing_log').upsert({
    county_code: countyCode,
    county_name: countyName,
    status: 'processing',
    started_at: new Date().toISOString(),
    batch_size: batchSize
  });
  
  try {
    // Download and extract ZIP if not already done
    const tempDir = `/tmp/cadastral_${countyCode}`;
    await ensureDir(tempDir);
    
    // Check if ZIP is already extracted
    const extractedFlag = `${tempDir}/.extracted`;
    let needsExtraction = true;
    
    try {
      await Deno.stat(extractedFlag);
      needsExtraction = false;
      console.log('Using previously extracted data');
    } catch {
      // File doesn't exist, need to extract
    }
    
    if (needsExtraction) {
      console.log('Downloading ZIP from Storage...');
      
      // Download ZIP from Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('parcels')
        .download('Cadastral_Statewide.zip');
      
      if (downloadError) throw downloadError;
      
      // Save to temp file
      const zipPath = `${tempDir}/cadastral.zip`;
      const arrayBuffer = await fileData.arrayBuffer();
      await Deno.writeFile(zipPath, new Uint8Array(arrayBuffer));
      
      console.log('Extracting ZIP...');
      await extract(zipPath, { dir: tempDir });
      
      // Mark as extracted
      await Deno.writeTextFile(extractedFlag, new Date().toISOString());
    }
    
    // Convert GDB to GeoJSON for specific county
    const geoJsonPath = `${tempDir}/county_${countyCode}.geojson`;
    
    if (resumeFrom === 0) {
      console.log(`Converting File Geodatabase for county ${countyCode}...`);
      
      const ogr2ogrCmd = new Deno.Command("ogr2ogr", {
        args: [
          "-f", "GeoJSON",
          geoJsonPath,
          `${tempDir}/Cadastral_Statewide.gdb`,
          "CADASTRAL_DOR",
          "-where", `CO_NO = ${countyCode}`,
          "-t_srs", "EPSG:4326",
          "-progress"
        ]
      });
      
      const { success, stderr } = await ogr2ogrCmd.output();
      if (!success) {
        throw new Error(`ogr2ogr failed: ${new TextDecoder().decode(stderr)}`);
      }
    }
    
    // Read and process GeoJSON
    console.log('Processing GeoJSON data...');
    const geoJsonText = await Deno.readTextFile(geoJsonPath);
    const geoJson = JSON.parse(geoJsonText);
    const features = geoJson.features;
    const totalFeatures = features.length;
    
    console.log(`Total features for ${countyName}: ${totalFeatures}`);
    
    // Update log with total count
    await supabase.from('florida_parcels_processing_log').upsert({
      county_code: countyCode,
      county_name: countyName,
      status: 'processing',
      total_parcels: totalFeatures,
      processed_parcels: resumeFrom
    });
    
    // Process in batches
    let processed = resumeFrom;
    const errors: string[] = [];
    
    for (let i = resumeFrom; i < totalFeatures; i += batchSize) {
      const batch = features.slice(i, Math.min(i + batchSize, totalFeatures));
      
      // Transform batch
      const records = batch.map((feature: any) => {
        const props = feature.properties;
        const geom = feature.geometry;
        
        // Create WKT geometry
        let wkt = null;
        if (geom?.type === 'Polygon') {
          const rings = geom.coordinates.map((ring: number[][]) => 
            ring.map(coord => `${coord[0]} ${coord[1]}`).join(',')
          ).join('),(');
          wkt = `SRID=4326;POLYGON((${rings}))`;
        } else if (geom?.type === 'MultiPolygon') {
          const polygons = geom.coordinates.map((polygon: number[][][]) => {
            const rings = polygon.map(ring =>
              ring.map(coord => `${coord[0]} ${coord[1]}`).join(',')
            ).join('),(');
            return `((${rings}))`;
          }).join(',');
          wkt = `SRID=4326;MULTIPOLYGON(${polygons})`;
        }
        
        // Map all DOR fields
        return {
          // Core identifiers
          CO_NO: props.CO_NO,
          PARCEL_ID: props.PARCEL_ID,
          county_fips: `12${String(props.CO_NO).padStart(3, '0')}`,
          
          // File and assessment info
          FILE_T: props.FILE_T,
          ASMNT_YR: props.ASMNT_YR,
          BAS_STRT: props.BAS_STRT,
          ATV_STRT: props.ATV_STRT,
          
          // Use codes
          GRP_NO: props.GRP_NO,
          DOR_UC: props.DOR_UC,
          PA_UC: props.PA_UC,
          SPASS_CD: props.SPASS_CD,
          
          // Values - all 138 fields from schema
          JV: props.JV,
          JV_CHNG: props.JV_CHNG,
          JV_CHNG_CD: props.JV_CHNG_CD,
          AV_SD: props.AV_SD,
          AV_NSD: props.AV_NSD,
          TV_SD: props.TV_SD,
          TV_NSD: props.TV_NSD,
          JV_HMSTD: props.JV_HMSTD,
          AV_HMSTD: props.AV_HMSTD,
          JV_NON_HMS: props.JV_NON_HMS,
          AV_NON_HMS: props.AV_NON_HMS,
          JV_RESD_NO: props.JV_RESD_NO,
          AV_RESD_NO: props.AV_RESD_NO,
          JV_CLASS_U: props.JV_CLASS_U,
          AV_CLASS_U: props.AV_CLASS_U,
          JV_H2O_REC: props.JV_H2O_REC,
          AV_H2O_REC: props.AV_H2O_REC,
          JV_CONSRV_: props.JV_CONSRV_,
          AV_CONSRV_: props.AV_CONSRV_,
          JV_HIST_CO: props.JV_HIST_CO,
          AV_HIST_CO: props.AV_HIST_CO,
          JV_HIST_SI: props.JV_HIST_SI,
          AV_HIST_SI: props.AV_HIST_SI,
          JV_WRKNG_W: props.JV_WRKNG_W,
          AV_WRKNG_W: props.AV_WRKNG_W,
          
          // Land and improvements
          LND_VAL: props.LND_VAL,
          LND_UNTS_C: props.LND_UNTS_C,
          NO_LND_UNT: props.NO_LND_UNT,
          LND_SQFOOT: props.LND_SQFOOT,
          DT_LAST_IN: props.DT_LAST_IN,
          IMP_QUAL: props.IMP_QUAL,
          IMP_VAL: props.IMP_VAL,
          CONST_CLAS: props.CONST_CLAS,
          EFF_YR_BLT: props.EFF_YR_BLT,
          ACT_YR_BLT: props.ACT_YR_BLT,
          TOT_LVG_AR: props.TOT_LVG_AR,
          NO_BULDNG: props.NO_BULDNG,
          NO_RES_UNT: props.NO_RES_UNT,
          SPEC_FEAT_: props.SPEC_FEAT_,
          
          // Sales data (2 sales)
          M_PAR_SAL1: props.M_PAR_SAL1,
          QUAL_CD1: props.QUAL_CD1,
          VI_CD1: props.VI_CD1,
          SALE_PRC1: props.SALE_PRC1,
          SALE_YR1: props.SALE_YR1,
          SALE_MO1: props.SALE_MO1,
          OR_BOOK1: props.OR_BOOK1,
          OR_PAGE1: props.OR_PAGE1,
          CLERK_NO1: props.CLERK_NO1,
          S_CHNG_CD1: props.S_CHNG_CD1,
          
          M_PAR_SAL2: props.M_PAR_SAL2,
          QUAL_CD2: props.QUAL_CD2,
          VI_CD2: props.VI_CD2,
          SALE_PRC2: props.SALE_PRC2,
          SALE_YR2: props.SALE_YR2,
          SALE_MO2: props.SALE_MO2,
          OR_BOOK2: props.OR_BOOK2,
          OR_PAGE2: props.OR_PAGE2,
          CLERK_NO2: props.CLERK_NO2,
          S_CHNG_CD2: props.S_CHNG_CD2,
          
          // Owner information
          OWN_NAME: props.OWN_NAME,
          OWN_ADDR1: props.OWN_ADDR1,
          OWN_ADDR2: props.OWN_ADDR2,
          OWN_CITY: props.OWN_CITY,
          OWN_STATE: props.OWN_STATE,
          OWN_ZIPCD: props.OWN_ZIPCD,
          
          // Fiduciary
          FIDU_NAME: props.FIDU_NAME,
          FIDU_ADDR1: props.FIDU_ADDR1,
          FIDU_ADDR2: props.FIDU_ADDR2,
          FIDU_CITY: props.FIDU_CITY,
          FIDU_STATE: props.FIDU_STATE,
          FIDU_ZIPCD: props.FIDU_ZIPCD,
          FIDU_CD: props.FIDU_CD,
          
          // Legal and location
          S_LEGAL: props.S_LEGAL,
          APP_STAT: props.APP_STAT,
          CO_APP_STA: props.CO_APP_STA,
          MKT_AR: props.MKT_AR,
          NBRHD_CD: props.NBRHD_CD,
          PUBLIC_LND: props.PUBLIC_LND,
          TAX_AUTH_C: props.TAX_AUTH_C,
          
          // Township/Range/Section
          TWN: props.TWN,
          RNG: props.RNG,
          SEC: props.SEC,
          CENSUS_BK: props.CENSUS_BK,
          
          // Physical address
          PHY_ADDR1: props.PHY_ADDR1,
          PHY_ADDR2: props.PHY_ADDR2,
          PHY_CITY: props.PHY_CITY,
          PHY_ZIPCD: props.PHY_ZIPCD,
          
          // Other fields
          ALT_KEY: props.ALT_KEY,
          ASS_TRNSFR: props.ASS_TRNSFR,
          PREV_HMSTD: props.PREV_HMSTD,
          ASS_DIF_TR: props.ASS_DIF_TR,
          CONO_PRV_H: props.CONO_PRV_H,
          YR_VAL_TRN: props.YR_VAL_TRN,
          SEQ_NO: props.SEQ_NO,
          RS_ID: props.RS_ID,
          MP_ID: props.MP_ID,
          STATE_PAR_: props.STATE_PAR_,
          SPC_CIR_CD: props.SPC_CIR_CD,
          SPC_CIR_YR: props.SPC_CIR_YR,
          SPC_CIR_TX: props.SPC_CIR_TX,
          
          // Shape fields
          Shape_Area: props.Shape_Area,
          Shape_Length: props.Shape_Length,
          
          // Geometry
          geom: wkt,
          LATITUDE: props.LATITUDE,
          LONGITUDE: props.LONGITUDE,
          
          // Metadata
          data_source: 'FLORIDA_DOR_2024',
          import_batch: `edge_function_${countyCode}_${new Date().toISOString()}`,
          source_file: 'Cadastral_Statewide.zip',
          data_version: '2024.0',
          import_date: new Date().toISOString(),
          processed_by: 'florida-parcels-processor'
        };
      });
      
      // Insert batch
      const { error } = await supabase
        .from('florida_parcels')
        .upsert(records, {
          onConflict: 'CO_NO,PARCEL_ID',
          ignoreDuplicates: false
        });
      
      if (error) {
        const errorMsg = `Batch ${i}-${i + batchSize}: ${error.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      } else {
        processed += batch.length;
        console.log(`Processed ${processed}/${totalFeatures} parcels`);
        
        // Update progress
        await supabase.from('florida_parcels_processing_log').upsert({
          county_code: countyCode,
          county_name: countyName,
          status: 'processing',
          processed_parcels: processed,
          last_batch_index: i + batchSize
        });
      }
    }
    
    // Mark as completed
    const finalStatus = errors.length > 0 ? 'completed_with_errors' : 'completed';
    
    await supabase.from('florida_parcels_processing_log').upsert({
      county_code: countyCode,
      county_name: countyName,
      status: finalStatus,
      processed_parcels: processed,
      completed_at: new Date().toISOString(),
      error_count: errors.length,
      error_message: errors.length > 0 ? errors.join('; ') : null
    });
    
    // Clean up temp files if completed
    if (processed === totalFeatures) {
      try {
        await Deno.remove(tempDir, { recursive: true });
      } catch (e) {
        console.error('Cleanup error:', e);
      }
    }
    
    return new Response(
      JSON.stringify({
        county_code: countyCode,
        county_name: countyName,
        total_parcels: totalFeatures,
        processed_parcels: processed,
        status: finalStatus,
        errors: errors.length,
        message: `Processed ${processed} of ${totalFeatures} parcels for ${countyName} County`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    // Log error
    await supabase.from('florida_parcels_processing_log').upsert({
      county_code: countyCode,
      county_name: countyName,
      status: 'error',
      error_message: error.message,
      failed_at: new Date().toISOString()
    });
    
    throw error;
  }
}

async function verifyData(supabase: any, countyCode?: number): Promise<Response> {
  const conditions: any = {};
  if (countyCode) {
    conditions.CO_NO = countyCode;
  }
  
  // Get counts by county
  const { data: countData, error } = await supabase
    .from('florida_parcels')
    .select('CO_NO, county_fips')
    .eq(countyCode ? 'CO_NO' : '', countyCode || '');
  
  if (error) throw error;
  
  // Aggregate counts
  const countsByCounty = countData.reduce((acc: any, row: any) => {
    const code = row.CO_NO;
    acc[code] = (acc[code] || 0) + 1;
    return acc;
  }, {});
  
  // Build verification report
  const verificationReport = Object.entries(countsByCounty).map(([code, count]) => ({
    county_code: parseInt(code),
    county_name: FLORIDA_COUNTIES[parseInt(code)],
    parcel_count: count,
    county_fips: `12${code.padStart(3, '0')}`
  }));
  
  // Get total count
  const totalParcels = Object.values(countsByCounty).reduce((sum: number, count: any) => sum + count, 0);
  
  return new Response(
    JSON.stringify({
      total_parcels: totalParcels,
      counties_loaded: verificationReport.length,
      verification_date: new Date().toISOString(),
      counties: verificationReport
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
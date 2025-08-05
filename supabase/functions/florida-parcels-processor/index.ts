import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Florida county codes and names mapping
const FLORIDA_COUNTIES: Record<number, string> = {
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
  storage_path?: string; // Path to GeoJSON file in storage
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

    const body = await req.json() as ProcessingRequest;
    const { action, county_code, batch_size = 1000, storage_path } = body;

    switch (action) {
      case 'status':
        return await getProcessingStatus(supabase);
      
      case 'process':
        if (!county_code || !FLORIDA_COUNTIES[county_code]) {
          throw new Error(`Invalid county code: ${county_code}`);
        }
        if (!storage_path) {
          throw new Error('Storage path is required for processing');
        }
        return await processCounty(supabase, county_code, batch_size, storage_path);
      
      case 'verify':
        return await verifyData(supabase, county_code);
      
      default:
        throw new Error(`Invalid action: ${action}`);
    }

  } catch (error: any) {
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
  // Get processing logs for all counties
  const { data: logs, error } = await supabase
    .from('florida_parcels_processing_log')
    .select('*')
    .order('county_code');

  if (error) throw error;

  // Count existing parcels by county
  const { data: counts } = await supabase
    .from('florida_parcels')
    .select('CO_NO')
    .is('CO_NO', 'not.null');

  const countsByCounty = new Map<number, number>();
  if (counts) {
    counts.forEach((row: any) => {
      const code = row.CO_NO;
      countsByCounty.set(code, (countsByCounty.get(code) || 0) + 1);
    });
  }

  // Build status for all counties
  const statuses = Object.entries(FLORIDA_COUNTIES).map(([code, name]) => {
    const countyCode = parseInt(code);
    const log = logs?.find((l: any) => l.county_code === countyCode);
    const count = countsByCounty.get(countyCode) || 0;
    
    return {
      county_code: countyCode,
      county_name: name,
      status: log?.status || 'pending',
      total_parcels: log?.total_parcels || 0,
      processed_parcels: count,
      progress: log?.total_parcels > 0 ? Math.round((count / log.total_parcels) * 100) : 0,
      last_updated: log?.updated_at || null,
      error_message: log?.error_message
    };
  });

  // Summary
  const summary = {
    total_counties: Object.keys(FLORIDA_COUNTIES).length,
    completed_counties: statuses.filter(s => s.status === 'completed').length,
    processing_counties: statuses.filter(s => s.status === 'processing').length,
    pending_counties: statuses.filter(s => s.status === 'pending').length,
    error_counties: statuses.filter(s => s.status === 'error').length,
    total_parcels_processed: Array.from(countsByCounty.values()).reduce((sum, count) => sum + count, 0)
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
  storagePath: string
): Promise<Response> {
  const countyName = FLORIDA_COUNTIES[countyCode];
  console.log(`Processing ${countyName} County (${countyCode}) from ${storagePath}`);
  
  // Update processing log
  await supabase.from('florida_parcels_processing_log').upsert({
    county_code: countyCode,
    county_name: countyName,
    status: 'processing',
    started_at: new Date().toISOString(),
    batch_size: batchSize
  });
  
  try {
    // Download GeoJSON from Storage
    console.log('Downloading GeoJSON from Storage...');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('parcels')
      .download(storagePath);
    
    if (downloadError) {
      throw new Error(`Storage download failed: ${downloadError.message}`);
    }
    
    // Parse GeoJSON
    console.log('Parsing GeoJSON data...');
    const text = await fileData.text();
    const geoJson = JSON.parse(text);
    
    // Filter features for this county
    const features = geoJson.features.filter((f: any) => f.properties.CO_NO === countyCode);
    const totalFeatures = features.length;
    
    console.log(`Found ${totalFeatures} features for ${countyName} County`);
    
    // Update total count
    await supabase.from('florida_parcels_processing_log').upsert({
      county_code: countyCode,
      county_name: countyName,
      status: 'processing',
      total_parcels: totalFeatures
    });
    
    // Process in batches
    let processed = 0;
    const errors: string[] = [];
    
    for (let i = 0; i < totalFeatures; i += batchSize) {
      const batch = features.slice(i, Math.min(i + batchSize, totalFeatures));
      
      // Transform batch to database records
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
        
        // Return all 138 fields
        return {
          // Core identifiers
          CO_NO: props.CO_NO,
          PARCEL_ID: props.PARCEL_ID,
          county_fips: `12${String(props.CO_NO).padStart(3, '0')}`,
          
          // All DOR fields...
          FILE_T: props.FILE_T,
          ASMNT_YR: props.ASMNT_YR,
          BAS_STRT: props.BAS_STRT,
          ATV_STRT: props.ATV_STRT,
          GRP_NO: props.GRP_NO,
          DOR_UC: props.DOR_UC,
          PA_UC: props.PA_UC,
          SPASS_CD: props.SPASS_CD,
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
          OWN_NAME: props.OWN_NAME,
          OWN_ADDR1: props.OWN_ADDR1,
          OWN_ADDR2: props.OWN_ADDR2,
          OWN_CITY: props.OWN_CITY,
          OWN_STATE: props.OWN_STATE,
          OWN_ZIPCD: props.OWN_ZIPCD,
          FIDU_NAME: props.FIDU_NAME,
          FIDU_ADDR1: props.FIDU_ADDR1,
          FIDU_ADDR2: props.FIDU_ADDR2,
          FIDU_CITY: props.FIDU_CITY,
          FIDU_STATE: props.FIDU_STATE,
          FIDU_ZIPCD: props.FIDU_ZIPCD,
          FIDU_CD: props.FIDU_CD,
          S_LEGAL: props.S_LEGAL,
          APP_STAT: props.APP_STAT,
          CO_APP_STA: props.CO_APP_STA,
          MKT_AR: props.MKT_AR,
          NBRHD_CD: props.NBRHD_CD,
          PUBLIC_LND: props.PUBLIC_LND,
          TAX_AUTH_C: props.TAX_AUTH_C,
          TWN: props.TWN,
          RNG: props.RNG,
          SEC: props.SEC,
          CENSUS_BK: props.CENSUS_BK,
          PHY_ADDR1: props.PHY_ADDR1,
          PHY_ADDR2: props.PHY_ADDR2,
          PHY_CITY: props.PHY_CITY,
          PHY_ZIPCD: props.PHY_ZIPCD,
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
          NCONST_VAL: props.NCONST_VAL,
          DEL_VAL: props.DEL_VAL,
          PAR_SPLT: props.PAR_SPLT,
          DISTR_CD: props.DISTR_CD,
          DISTR_YR: props.DISTR_YR,
          
          // Additional columns
          PARCEL_ID_: props.PARCEL_ID_,
          OWN_STATE_: props.OWN_STATE_,
          OWN_ZIPCDA: props.OWN_ZIPCDA,
          
          // Shape fields
          Shape_Area: props.Shape_Area,
          Shape_Length: props.Shape_Length,
          
          // Geometry
          geom: wkt,
          LATITUDE: props.LATITUDE,
          LONGITUDE: props.LONGITUDE,
          
          // Metadata
          data_source: 'FLORIDA_DOR_2024',
          import_batch: `edge_${countyCode}_${new Date().toISOString()}`,
          source_file: storagePath,
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
          updated_at: new Date().toISOString()
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
    
  } catch (error: any) {
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
  let query = supabase
    .from('florida_parcels')
    .select('CO_NO', { count: 'exact' });
    
  if (countyCode) {
    query = query.eq('CO_NO', countyCode);
  }
  
  const { count, error } = await query;
  
  if (error) throw error;
  
  const response = {
    total_parcels: count || 0,
    county_code: countyCode,
    county_name: countyCode ? FLORIDA_COUNTIES[countyCode] : 'All Counties',
    verification_date: new Date().toISOString()
  };
  
  return new Response(
    JSON.stringify(response),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
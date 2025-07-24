#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Column mapping from CSV headers (uppercase) to database columns (lowercase)
const columnMapping = {
  'CO_NO': 'co_no',
  'PARCEL_ID': 'parcel_id',
  'FILE_T': 'file_t',
  'ASMNT_YR': 'asmnt_yr',
  'BAS_STRT': 'bas_strt',
  'ATV_STRT': 'atv_strt',
  'GRP_NO': 'grp_no',
  'DOR_UC': 'dor_uc',
  'PA_UC': 'pa_uc',
  'SPASS_CD': 'spass_cd',
  'JV': 'jv',
  'JV_CHNG': 'jv_chng',
  'JV_CHNG_CD': 'jv_chng_cd',
  'AV_SD': 'av_sd',
  'AV_NSD': 'av_nsd',
  'TV_SD': 'tv_sd',
  'TV_NSD': 'tv_nsd',
  'JV_HMSTD': 'jv_hmstd',
  'AV_HMSTD': 'av_hmstd',
  'JV_NON_HMS': 'jv_non_hms',
  'AV_NON_HMS': 'av_non_hms',
  'JV_RESD_NO': 'jv_resd_no',
  'AV_RESD_NO': 'av_resd_no',
  'JV_CLASS_U': 'jv_class_u',
  'AV_CLASS_U': 'av_class_u',
  'JV_H2O_REC': 'jv_h2o_rec',
  'AV_H2O_REC': 'av_h2o_rec',
  'JV_CONSRV_': 'jv_consrv_',
  'AV_CONSRV_': 'av_consrv_',
  'JV_HIST_CO': 'jv_hist_co',
  'AV_HIST_CO': 'av_hist_co',
  'JV_HIST_SI': 'jv_hist_si',
  'AV_HIST_SI': 'av_hist_si',
  'JV_WRKNG_W': 'jv_wrkng_w',
  'AV_WRKNG_W': 'av_wrkng_w',
  'NCONST_VAL': 'nconst_val',
  'DEL_VAL': 'del_val',
  'PAR_SPLT': 'par_splt',
  'DISTR_CD': 'distr_cd',
  'DISTR_YR': 'distr_yr',
  'LND_VAL': 'lnd_val',
  'LND_UNTS_C': 'lnd_unts_c',
  'NO_LND_UNT': 'no_lnd_unt',
  'LND_SQFOOT': 'lnd_sqfoot',
  'DT_LAST_IN': 'dt_last_in',
  'IMP_QUAL': 'imp_qual',
  'CONST_CLAS': 'const_clas',
  'EFF_YR_BLT': 'eff_yr_blt',
  'ACT_YR_BLT': 'act_yr_blt',
  'TOT_LVG_AR': 'tot_lvg_ar',
  'NO_BULDNG': 'no_buldng',
  'NO_RES_UNT': 'no_res_unt',
  'SPEC_FEAT_': 'spec_feat_',
  'M_PAR_SAL1': 'm_par_sal1',
  'QUAL_CD1': 'qual_cd1',
  'VI_CD1': 'vi_cd1',
  'SALE_PRC1': 'sale_prc1',
  'SALE_YR1': 'sale_yr1',
  'SALE_MO1': 'sale_mo1',
  'OR_BOOK1': 'or_book1',
  'OR_PAGE1': 'or_page1',
  'CLERK_NO1': 'clerk_no1',
  'S_CHNG_CD1': 's_chng_cd1',
  'M_PAR_SAL2': 'm_par_sal2',
  'QUAL_CD2': 'qual_cd2',
  'VI_CD2': 'vi_cd2',
  'SALE_PRC2': 'sale_prc2',
  'SALE_YR2': 'sale_yr2',
  'SALE_MO2': 'sale_mo2',
  'OR_BOOK2': 'or_book2',
  'OR_PAGE2': 'or_page2',
  'CLERK_NO2': 'clerk_no2',
  'S_CHNG_CD2': 's_chng_cd2',
  'OWN_NAME': 'own_name',
  'OWN_ADDR1': 'own_addr1',
  'OWN_ADDR2': 'own_addr2',
  'OWN_CITY': 'own_city',
  'OWN_STATE': 'own_state',
  'OWN_ZIPCD': 'own_zipcd',
  'OWN_STATE_': 'own_state_',
  'FIDU_NAME': 'fidu_name',
  'FIDU_ADDR1': 'fidu_addr1',
  'FIDU_ADDR2': 'fidu_addr2',
  'FIDU_CITY': 'fidu_city',
  'FIDU_STATE': 'fidu_state',
  'FIDU_ZIPCD': 'fidu_zipcd',
  'FIDU_CD': 'fidu_cd',
  'S_LEGAL': 's_legal',
  'APP_STAT': 'app_stat',
  'CO_APP_STA': 'co_app_sta',
  'MKT_AR': 'mkt_ar',
  'NBRHD_CD': 'nbrhd_cd',
  'PUBLIC_LND': 'public_lnd',
  'TAX_AUTH_C': 'tax_auth_c',
  'TWN': 'twn',
  'RNG': 'rng',
  'SEC': 'sec',
  'CENSUS_BK': 'census_bk',
  'PHY_ADDR1': 'phy_addr1',
  'PHY_ADDR2': 'phy_addr2',
  'PHY_CITY': 'phy_city',
  'PHY_ZIPCD': 'phy_zipcd',
  'ALT_KEY': 'alt_key',
  'ASS_TRNSFR': 'ass_trnsfr',
  'PREV_HMSTD': 'prev_hmstd',
  'ASS_DIF_TR': 'ass_dif_tr',
  'CONO_PRV_H': 'cono_prv_h',
  'PARCEL_ID_': 'parcel_id_',
  'YR_VAL_TRN': 'yr_val_trn',
  'SEQ_NO': 'seq_no',
  'RS_ID': 'rs_id',
  'MP_ID': 'mp_id',
  'STATE_PAR_': 'state_par_',
  'SPC_CIR_CD': 'spc_cir_cd',
  'SPC_CIR_YR': 'spc_cir_yr',
  'SPC_CIR_TX': 'spc_cir_tx',
  'Shape_Length': 'shape_length',
  'Shape_Area': 'shape_area',
  'geometry_wkt': 'geometry_wkt'
};

// Function to derive county_fips from co_no
function getCountyFips(coNo) {
  if (!coNo) return null;
  // Florida FIPS codes start with 12 and county codes are 3 digits
  // co_no appears to be the county number (1-67)
  const countyNum = parseInt(coNo);
  if (countyNum >= 1 && countyNum <= 67) {
    // Convert to FIPS code: 12001 to 12133 (odd numbers only)
    return 12000 + (countyNum * 2) - 1;
  }
  return null;
}

// Transform row data
function transformRow(row) {
  const transformed = {};
  
  // Map columns from uppercase to lowercase
  for (const [csvCol, dbCol] of Object.entries(columnMapping)) {
    if (row[csvCol] !== undefined && row[csvCol] !== '') {
      // Handle numeric fields
      if (csvCol.includes('_') || ['JV', 'LND_VAL', 'SALE_PRC1', 'SALE_PRC2', 'TOT_LVG_AR'].includes(csvCol)) {
        const val = parseFloat(row[csvCol]);
        transformed[dbCol] = isNaN(val) ? null : val;
      } else {
        transformed[dbCol] = row[csvCol];
      }
    }
  }
  
  // Add county_fips based on co_no
  if (transformed.co_no) {
    transformed.county_fips = getCountyFips(transformed.co_no);
  }
  
  return transformed;
}

// Main import function
async function importParcels(csvPath, options = {}) {
  const { 
    batchSize = 100, 
    skipErrors = false,
    limit = null,
    testMode = false 
  } = options;
  
  console.log('🏘️  Florida Parcels CSV Import');
  console.log('=' .repeat(50));
  console.log(`📄 CSV File: ${csvPath}`);
  console.log(`📦 Batch Size: ${batchSize}`);
  console.log(`🔄 Skip Errors: ${skipErrors}`);
  console.log(`🧪 Test Mode: ${testMode}`);
  if (limit) console.log(`📊 Limit: ${limit} records`);
  console.log('');
  
  const stats = {
    total: 0,
    processed: 0,
    inserted: 0,
    errors: 0,
    skipped: 0,
    startTime: Date.now()
  };
  
  const parser = fs
    .createReadStream(csvPath)
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: false
    }));
  
  let batch = [];
  
  for await (const row of parser) {
    stats.total++;
    
    // Check limit
    if (limit && stats.total > limit) {
      console.log(`\n📊 Reached limit of ${limit} records`);
      break;
    }
    
    try {
      const transformed = transformRow(row);
      
      // Skip if no parcel_id
      if (!transformed.parcel_id) {
        stats.skipped++;
        continue;
      }
      
      batch.push(transformed);
      
      // Process batch when full
      if (batch.length >= batchSize) {
        await processBatch(batch, stats, testMode);
        batch = [];
        
        // Progress update
        if (stats.processed % 1000 === 0) {
          const elapsed = (Date.now() - stats.startTime) / 1000;
          const rate = Math.round(stats.processed / elapsed);
          console.log(`⏱️  Processed: ${stats.processed} | Rate: ${rate} records/sec | Errors: ${stats.errors}`);
        }
      }
      
    } catch (error) {
      stats.errors++;
      if (!skipErrors) {
        console.error(`\n❌ Error processing row ${stats.total}:`, error);
        throw error;
      }
    }
  }
  
  // Process remaining batch
  if (batch.length > 0) {
    await processBatch(batch, stats, testMode);
  }
  
  // Final stats
  const elapsed = (Date.now() - stats.startTime) / 1000;
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Import Complete!');
  console.log(`✅ Total Records: ${stats.total}`);
  console.log(`✅ Processed: ${stats.processed}`);
  console.log(`✅ Inserted: ${stats.inserted}`);
  console.log(`⚠️  Skipped: ${stats.skipped}`);
  console.log(`❌ Errors: ${stats.errors}`);
  console.log(`⏱️  Time: ${elapsed.toFixed(2)} seconds`);
  console.log(`📈 Rate: ${Math.round(stats.processed / elapsed)} records/sec`);
}

// Process a batch of records
async function processBatch(batch, stats, testMode) {
  if (testMode) {
    console.log(`\n🧪 Test Mode - Would insert ${batch.length} records`);
    console.log('Sample record:', JSON.stringify(batch[0], null, 2));
    stats.processed += batch.length;
    return;
  }
  
  try {
    const { data, error } = await supabase
      .from('florida_parcels')
      .upsert(batch, { 
        onConflict: 'parcel_id',
        ignoreDuplicates: false 
      });
    
    if (error) {
      throw error;
    }
    
    stats.processed += batch.length;
    stats.inserted += batch.length;
    
  } catch (error) {
    console.error(`\n❌ Batch insert error:`, error.message);
    stats.errors += batch.length;
    
    // Try individual inserts if batch fails
    if (error.code === '23505') { // Duplicate key
      console.log('🔄 Retrying individual inserts...');
      for (const record of batch) {
        try {
          const { error: insertError } = await supabase
            .from('florida_parcels')
            .upsert(record, { 
              onConflict: 'parcel_id',
              ignoreDuplicates: true 
            });
          
          if (!insertError) {
            stats.inserted++;
          }
        } catch (e) {
          // Skip individual errors
        }
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node import-florida-parcels-csv.js <csv-file> [options]');
    console.log('\nOptions:');
    console.log('  --batch-size=100     Number of records per batch');
    console.log('  --skip-errors        Continue on errors');
    console.log('  --limit=1000         Limit number of records to import');
    console.log('  --test               Test mode (no actual inserts)');
    console.log('\nExample:');
    console.log('  node import-florida-parcels-csv.js parcels.csv --batch-size=500 --skip-errors');
    process.exit(1);
  }
  
  const csvPath = args[0];
  const options = {
    batchSize: 100,
    skipErrors: false,
    limit: null,
    testMode: false
  };
  
  // Parse options
  args.slice(1).forEach(arg => {
    if (arg.startsWith('--batch-size=')) {
      options.batchSize = parseInt(arg.split('=')[1]);
    } else if (arg === '--skip-errors') {
      options.skipErrors = true;
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1]);
    } else if (arg === '--test') {
      options.testMode = true;
    }
  });
  
  // Check if file exists
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }
  
  // Run import
  importParcels(csvPath, options)
    .then(() => {
      console.log('\n✅ Import completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Import failed:', error);
      process.exit(1);
    });
}

module.exports = { importParcels, transformRow };
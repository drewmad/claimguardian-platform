#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parser');
const { Transform } = require('stream');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = 1000; // Records per batch
const MAX_CONCURRENT_BATCHES = 3; // Parallel uploads

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Statistics tracking
const stats = {
  totalFiles: 0,
  processedFiles: 0,
  totalRecords: 0,
  successfulRecords: 0,
  failedRecords: 0,
  startTime: Date.now(),
  estimatedStorageGB: 0
};

// Column mappings - lowercase to uppercase
const columnMappings = {
  'parcel_id': 'PARCEL_ID',
  'co_no': 'CO_NO',
  'asmnt_yr': 'ASMNT_YR',
  'jv': 'JV',
  'av_sd': 'AV_SD',
  'av_nsd': 'AV_NSD',
  'tv_sd': 'TV_SD',
  'tv_nsd': 'TV_NSD',
  'dor_uc': 'DOR_UC',
  'pa_uc': 'PA_UC',
  'land_val': 'LAND_VAL',
  'bldg_val': 'BLDG_VAL',
  'tot_val': 'TOT_VAL',
  'act_yr_blt': 'ACT_YR_BLT',
  'eff_yr_blt': 'EFF_YR_BLT',
  'tot_lvg_ar': 'TOT_LVG_AR',
  'land_sqfoot': 'LAND_SQFOOT',
  'no_buldng': 'NO_BULDNG',
  'no_res_unt': 'NO_RES_UNT',
  'own_name': 'OWN_NAME',
  'own_addr1': 'OWN_ADDR1',
  'own_addr2': 'OWN_ADDR2',
  'own_city': 'OWN_CITY',
  'own_state': 'OWN_STATE',
  'own_zipcd': 'OWN_ZIPCD',
  'phy_addr1': 'PHY_ADDR1',
  'phy_addr2': 'PHY_ADDR2',
  'phy_city': 'PHY_CITY',
  'phy_zipcd': 'PHY_ZIPCD',
  's_legal': 'S_LEGAL',
  'twn': 'TWN',
  'rng': 'RNG',
  'sec': 'SEC',
  'sale_prc1': 'SALE_PRC1',
  'sale_yr1': 'SALE_YR1',
  'sale_mo1': 'SALE_MO1',
  'sale_prc2': 'SALE_PRC2',
  'sale_yr2': 'SALE_YR2',
  'sale_mo2': 'SALE_MO2',
  'nbrhd_cd': 'NBRHD_CD',
  'census_bk': 'CENSUS_BK',
  'mkt_ar': 'MKT_AR',
  'own_state2': 'OWN_STATE2',
  'own_zipcda': 'OWN_ZIPCDA',
  'nbrhd_cd1': 'NBRHD_CD1',
  'nbrhd_cd2': 'NBRHD_CD2',
  'nbrhd_cd3': 'NBRHD_CD3',
  'nbrhd_cd4': 'NBRHD_CD4',
  'dor_cd1': 'DOR_CD1',
  'dor_cd2': 'DOR_CD2',
  'dor_cd3': 'DOR_CD3',
  'dor_cd4': 'DOR_CD4',
  'ag_val': 'AG_VAL',
  'qual_cd2_': 'QUAL_CD2_',
  'vi_cd2_': 'VI_CD2_',
  'sale_prc2_': 'SALE_PRC2_',
  'sale_yr2_': 'SALE_YR2_',
  'sale_mo2_': 'SALE_MO2_',
  'or_book2_': 'OR_BOOK2_',
  'or_page2_': 'OR_PAGE2_',
  'clerk_n_2': 'CLERK_N_2',
  'imp_val': 'IMP_VAL',
  'const_val': 'CONST_VAL',
  'distr_no': 'DISTR_NO',
  'front': 'FRONT',
  'depth': 'DEPTH',
  'cap': 'CAP',
  'cape_shpa': 'CAPE_SHPA',
  'latitude': 'LATITUDE',
  'longitude': 'LONGITUDE',
  'pin_1': 'PIN_1',
  'pin_2': 'PIN_2',
  'half_cd': 'HALF_CD',
  'twp': 'TWP',
  'sub': 'SUB',
  'blk': 'BLK',
  'lot': 'LOT',
  'plat_book': 'PLAT_BOOK',
  'plat_page': 'PLAT_PAGE'
};

// Transform stream to convert column names
class ColumnTransform extends Transform {
  constructor(options) {
    super({ ...options, objectMode: true });
  }

  _transform(chunk, encoding, callback) {
    const transformed = {};
    
    for (const [key, value] of Object.entries(chunk)) {
      const mappedKey = columnMappings[key.toLowerCase()] || key.toUpperCase();
      // Convert empty strings to null
      transformed[mappedKey] = value === '' ? null : value;
    }
    
    callback(null, transformed);
  }
}

async function importBatch(records, fileName) {
  try {
    // Bypass the problematic view and insert directly into staging table
    const { error } = await supabase
      .from('florida_parcels_staging')
      .insert(records);

    if (error) {
      console.error(`❌ Batch insert error for ${fileName}:`, error.message);
      stats.failedRecords += records.length;
      return false;
    }

    stats.successfulRecords += records.length;
    return true;
  } catch (err) {
    console.error(`❌ Unexpected error:`, err.message);
    stats.failedRecords += records.length;
    return false;
  }
}

async function processCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const fileStats = fs.statSync(filePath);
    stats.estimatedStorageGB += fileStats.size / (1024 * 1024 * 1024);
    
    console.log(`\n📄 Processing: ${fileName} (${(fileStats.size / 1024 / 1024).toFixed(2)} MB)`);
    
    const records = [];
    let recordCount = 0;
    const batchPromises = [];

    const stream = fs.createReadStream(filePath)
      .pipe(csv())
      .pipe(new ColumnTransform())
      .on('data', async (row) => {
        records.push(row);
        recordCount++;
        stats.totalRecords++;

        if (records.length >= BATCH_SIZE) {
          stream.pause();
          const batch = records.splice(0, BATCH_SIZE);
          
          const batchPromise = importBatch(batch, fileName)
            .then(() => {
              process.stdout.write(`\r  Progress: ${recordCount} records processed...`);
              stream.resume();
            });
          
          batchPromises.push(batchPromise);
          
          // Limit concurrent batches
          if (batchPromises.length >= MAX_CONCURRENT_BATCHES) {
            await Promise.race(batchPromises);
          }
        }
      })
      .on('end', async () => {
        // Process remaining records
        if (records.length > 0) {
          await importBatch(records, fileName);
        }
        
        // Wait for all batches to complete
        await Promise.all(batchPromises);
        
        console.log(`\n  ✅ Completed: ${recordCount} records from ${fileName}`);
        stats.processedFiles++;
        resolve();
      })
      .on('error', (error) => {
        console.error(`\n  ❌ Error reading ${fileName}:`, error.message);
        reject(error);
      });
  });
}

async function transferToMainTable() {
  console.log('\n🔄 Transferring data from staging to main table...');
  
  try {
    const { data, error } = await supabase.rpc('transfer_florida_parcels_staging');
    
    if (error) {
      console.error('❌ Transfer error:', error.message);
      return false;
    }
    
    console.log('✅ Data transferred successfully!');
    return true;
  } catch (err) {
    console.error('❌ Transfer failed:', err.message);
    return false;
  }
}

async function calculateCosts() {
  const runtime = (Date.now() - stats.startTime) / 1000 / 60; // minutes
  
  console.log('\n💰 Supabase Cost Estimation:');
  console.log('============================');
  
  // Storage costs
  const storageGB = stats.estimatedStorageGB;
  const storageCostPerGB = 0.021; // $0.021 per GB per month
  const monthlystorageCost = storageGB * storageCostPerGB;
  
  console.log(`📦 Storage: ${storageGB.toFixed(2)} GB`);
  console.log(`   Monthly cost: $${monthlystorageCost.toFixed(2)}`);
  
  // Database size (with indexes, typically 2-3x raw data)
  const estimatedDBSize = storageGB * 2.5;
  const dbCostPerGB = 0.125; // $0.125 per GB per month
  const monthlyDBCost = estimatedDBSize * dbCostPerGB;
  
  console.log(`💾 Database size (with indexes): ~${estimatedDBSize.toFixed(2)} GB`);
  console.log(`   Monthly cost: $${monthlyDBCost.toFixed(2)}`);
  
  // API requests (read operations)
  const estimatedMonthlyReads = stats.totalRecords * 10; // Assume 10 reads per record per month
  const apiCostPer1M = 0.40; // $0.40 per million requests
  const monthlyAPICost = (estimatedMonthlyReads / 1000000) * apiCostPer1M;
  
  console.log(`🔍 Estimated monthly API calls: ${(estimatedMonthlyReads / 1000000).toFixed(2)}M`);
  console.log(`   Monthly cost: $${monthlyAPICost.toFixed(2)}`);
  
  const totalMonthlyCost = monthlystorageCost + monthlyDBCost + monthlyAPICost;
  console.log(`\n💵 Total estimated monthly cost: $${totalMonthlyCost.toFixed(2)}`);
  
  // One-time import costs
  const importAPICalls = Math.ceil(stats.totalRecords / BATCH_SIZE) * 2; // insert + transfer
  const importCost = (importAPICalls / 1000000) * apiCostPer1M;
  console.log(`\n📥 One-time import cost: $${importCost.toFixed(2)}`);
}

async function main() {
  const csvDirectory = process.argv[2] || './florida_parcels_data';
  
  if (!fs.existsSync(csvDirectory)) {
    console.error(`❌ Directory not found: ${csvDirectory}`);
    process.exit(1);
  }

  console.log('🚀 Florida Parcels Bulk Import Tool');
  console.log('===================================\n');
  console.log(`📁 CSV Directory: ${csvDirectory}`);
  console.log(`📦 Batch size: ${BATCH_SIZE} records`);
  console.log(`🔄 Concurrent batches: ${MAX_CONCURRENT_BATCHES}\n`);

  // Find all CSV files
  const csvFiles = fs.readdirSync(csvDirectory)
    .filter(file => file.toLowerCase().endsWith('.csv'))
    .map(file => path.join(csvDirectory, file));

  stats.totalFiles = csvFiles.length;
  console.log(`📊 Found ${csvFiles.length} CSV files to process\n`);

  if (csvFiles.length === 0) {
    console.log('❌ No CSV files found!');
    process.exit(1);
  }

  // Process each file
  for (const csvFile of csvFiles) {
    try {
      await processCSVFile(csvFile);
    } catch (error) {
      console.error(`❌ Failed to process ${path.basename(csvFile)}`);
    }
  }

  // Transfer data to main table
  console.log('\n🏁 All files processed. Starting final transfer...');
  await transferToMainTable();

  // Print summary
  const duration = (Date.now() - stats.startTime) / 1000;
  console.log('\n📊 Import Summary');
  console.log('=================');
  console.log(`✅ Files processed: ${stats.processedFiles}/${stats.totalFiles}`);
  console.log(`✅ Records imported: ${stats.successfulRecords}/${stats.totalRecords}`);
  console.log(`❌ Failed records: ${stats.failedRecords}`);
  console.log(`⏱️  Duration: ${(duration / 60).toFixed(2)} minutes`);
  console.log(`⚡ Speed: ${(stats.totalRecords / duration).toFixed(0)} records/second`);

  // Calculate costs
  await calculateCosts();

  console.log('\n✨ Import complete!');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { processCSVFile, transferToMainTable };
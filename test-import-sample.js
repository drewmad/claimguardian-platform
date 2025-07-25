#!/usr/bin/env node

/**
 * Test import of sample Florida parcels data
 * This script tests the import process with a small sample
 */

const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmlrvecuwgppbaynesji.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testImport() {
  console.log('Florida Parcels Test Import');
  console.log('===========================\n');
  
  // Check if table exists
  console.log('Checking if florida_parcels table exists...');
  
  const { data: tableCheck, error: tableError } = await supabase
    .from('florida_parcels')
    .select('id')
    .limit(1);
  
  if (tableError && tableError.code === '42P01') {
    console.log('Table does not exist. Please create it first.');
    console.log('\nTo create the table:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Copy contents of create-florida-parcels-schema.sql');
    console.log('3. Run the query\n');
    return;
  }
  
  // Get current count
  const { count: currentCount } = await supabase
    .from('florida_parcels')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Current records in table: ${currentCount || 0}`);
  
  // Extract sample data using ogr2ogr
  console.log('\nExtracting sample data from Charlotte County...');
  
  const tempFile = '/tmp/charlotte_sample.json';
  
  try {
    // Extract 100 records from Charlotte County
    const extractCmd = `ogr2ogr -f GeoJSON ${tempFile} temp_extract/Cadastral_Statewide.gdb CADASTRAL_DOR ` +
      `-where "CO_NO = 15" -limit 100 -t_srs EPSG:4326`;
    
    console.log('Running extraction...');
    await execAsync(extractCmd);
    
    // Read the GeoJSON file
    const fs = require('fs');
    const geoData = JSON.parse(fs.readFileSync(tempFile, 'utf8'));
    
    console.log(`Extracted ${geoData.features.length} features`);
    
    // Transform to database format
    const records = geoData.features.map(feature => {
      const props = feature.properties;
      
      // Map fields to our schema
      return {
        objectid: props.OBJECTID,
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
        sale_prc2: props.SALE_PRC2,
        sale_yr2: props.SALE_YR2,
        sale_mo2: props.SALE_MO2,
        nbrhd_cd: props.NBRHD_CD,
        census_bk: props.CENSUS_BK,
        mkt_ar: props.MKT_AR,
        raw_data: props,
        // Note: geometry handling depends on PostGIS being enabled
        // For now, we'll skip geometry
      };
    });
    
    console.log('\nInserting records to database...');
    
    // Insert in batches of 50
    const batchSize = 50;
    let successCount = 0;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('florida_parcels')
        .upsert(batch, {
          onConflict: 'parcel_id,co_no',
          ignoreDuplicates: true
        });
      
      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message);
      } else {
        successCount += batch.length;
        console.log(`✓ Inserted batch ${i / batchSize + 1} (${batch.length} records)`);
      }
    }
    
    console.log(`\n✓ Successfully inserted ${successCount} records`);
    
    // Get new count
    const { count: newCount } = await supabase
      .from('florida_parcels')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total records now: ${newCount || 0}`);
    
    // Show sample data
    console.log('\nSample records:');
    const { data: samples } = await supabase
      .from('florida_parcels')
      .select('parcel_id, own_name, phy_addr1, phy_city, jv')
      .limit(5);
    
    if (samples) {
      samples.forEach(record => {
        console.log(`- ${record.parcel_id}: ${record.own_name}`);
        console.log(`  ${record.phy_addr1}, ${record.phy_city}`);
        console.log(`  Just Value: $${(record.jv || 0).toLocaleString()}`);
      });
    }
    
    // Clean up
    fs.unlinkSync(tempFile);
    
  } catch (error) {
    console.error('Error during import:', error.message);
  }
}

// Run the test
testImport().catch(console.error);
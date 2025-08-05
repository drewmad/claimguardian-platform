#!/usr/bin/env node

// Import Florida parcels using Supabase client (no direct DB password needed)
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
const { exec } = require('child_process');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://tmlrvecuwgppbaynesji.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHJ2ZWN1d2dwcGJheW5lc2ppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA3NTAzOSwiZXhwIjoyMDY0NjUxMDM5fQ.oSc6kfaT_fyrtIS7noLzJdw4gGGJXIivnz0cqJfwuxc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// County mapping
const COUNTIES = {
  11: "ALACHUA", 12: "BAKER", 13: "BAY", 14: "BRADFORD", 15: "BREVARD",
  16: "BROWARD", 17: "CALHOUN", 18: "CHARLOTTE", 19: "CITRUS", 20: "CLAY",
  21: "COLLIER", 22: "COLUMBIA", 23: "MIAMI-DADE", 24: "DESOTO", 25: "DIXIE",
  26: "DUVAL", 27: "ESCAMBIA", 28: "FLAGLER", 29: "FRANKLIN", 30: "GADSDEN",
  31: "GILCHRIST", 32: "GLADES", 33: "GULF", 34: "HAMILTON", 35: "HARDEE",
  36: "HENDRY", 37: "HERNANDO", 38: "HIGHLANDS", 39: "HILLSBOROUGH", 40: "HOLMES",
  41: "INDIAN_RIVER", 42: "JACKSON", 43: "JEFFERSON", 44: "LAFAYETTE", 45: "LAKE",
  46: "LEE", 47: "LEON", 48: "LEVY", 49: "LIBERTY", 50: "MADISON",
  51: "MANATEE", 52: "MARION", 53: "MARTIN", 54: "MONROE", 55: "NASSAU",
  56: "OKALOOSA", 57: "OKEECHOBEE", 58: "ORANGE", 59: "OSCEOLA", 60: "PALM_BEACH",
  61: "PASCO", 62: "PINELLAS", 63: "POLK", 64: "PUTNAM", 65: "ST_JOHNS",
  66: "ST_LUCIE", 67: "SANTA_ROSA", 68: "SARASOTA", 69: "SEMINOLE", 70: "SUMTER",
  71: "SUWANNEE", 72: "TAYLOR", 73: "UNION", 74: "VOLUSIA", 75: "WAKULLA",
  76: "WALTON", 77: "WASHINGTON"
};

// Convert county to CSV first
async function convertCountyToCSV(countyCode, countyName) {
  return new Promise((resolve, reject) => {
    const gdbPath = '/Users/madengineering/ClaimGuardian/data/florida/Cadastral_Statewide.gdb';
    const csvPath = `/Users/madengineering/ClaimGuardian/data/florida/csv_by_county/county_${countyCode}_${countyName}.csv`;
    
    console.log(`Converting ${countyName} County (${countyCode}) to CSV...`);
    
    const cmd = `ogr2ogr -f CSV "${csvPath}" "${gdbPath}" CADASTRAL_DOR -where "CO_NO = ${countyCode}" -lco GEOMETRY=AS_WKT`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error converting county ${countyCode}:`, error);
        reject(error);
      } else {
        console.log(`✓ Converted ${countyName} County`);
        resolve(csvPath);
      }
    });
  });
}

// Import CSV to Supabase
async function importCSVToSupabase(csvPath, countyCode, countyName) {
  console.log(`Importing ${countyName} County to Supabase...`);
  
  const parcels = [];
  const batchSize = 1000;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        // Map CSV columns to database columns
        parcels.push({
          CO_NO: parseInt(row.CO_NO) || countyCode,
          PARCEL_ID: row.PARCEL_ID,
          FILE_NO: row.FILE_NO,
          ASMNT_YR: parseInt(row.ASMNT_YR) || null,
          OWN_NAME: row.OWN_NAME,
          PHY_ADDR1: row.PHY_ADDR1,
          PHY_CITY: row.PHY_CITY,
          PHY_ZIPCD: row.PHY_ZIPCD,
          SHAPE_WKT: row.WKT || row.SHAPE || null
        });
        
        // Insert in batches
        if (parcels.length >= batchSize) {
          const batch = parcels.splice(0, batchSize);
          insertBatch(batch);
        }
      })
      .on('end', async () => {
        // Insert remaining parcels
        if (parcels.length > 0) {
          await insertBatch(parcels);
        }
        console.log(`✓ Imported ${countyName} County`);
        resolve();
      })
      .on('error', reject);
  });
}

async function insertBatch(parcels) {
  const { data, error } = await supabase
    .from('florida_parcels')
    .insert(parcels);
    
  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log(`  Inserted ${parcels.length} parcels`);
  }
}

// Main function
async function main() {
  console.log('Florida Parcels Import via Supabase Client');
  console.log('==========================================\n');
  
  // Create CSV directory
  const csvDir = '/Users/madengineering/ClaimGuardian/data/florida/csv_by_county';
  if (!fs.existsSync(csvDir)) {
    fs.mkdirSync(csvDir, { recursive: true });
  }
  
  // Get county selection from command line
  const args = process.argv.slice(2);
  const mode = args[0] || 'single';
  
  if (mode === 'all') {
    // Import all counties
    for (const [code, name] of Object.entries(COUNTIES)) {
      try {
        const csvPath = await convertCountyToCSV(code, name);
        await importCSVToSupabase(csvPath, code, name);
        // Clean up CSV to save space
        fs.unlinkSync(csvPath);
      } catch (error) {
        console.error(`Failed to process ${name} County:`, error);
      }
    }
  } else if (mode === 'priority') {
    // Import priority counties
    const priorityCodes = [23, 16, 60, 39, 58, 62, 52, 63, 15, 46];
    for (const code of priorityCodes) {
      const name = COUNTIES[code];
      if (name) {
        try {
          const csvPath = await convertCountyToCSV(code, name);
          await importCSVToSupabase(csvPath, code, name);
          fs.unlinkSync(csvPath);
        } catch (error) {
          console.error(`Failed to process ${name} County:`, error);
        }
      }
    }
  } else {
    // Single county
    const countyCode = parseInt(args[0]) || 18; // Default to Charlotte
    const countyName = COUNTIES[countyCode];
    
    if (countyName) {
      try {
        const csvPath = await convertCountyToCSV(countyCode, countyName);
        await importCSVToSupabase(csvPath, countyCode, countyName);
      } catch (error) {
        console.error(`Failed to process ${countyName} County:`, error);
      }
    } else {
      console.error(`Invalid county code: ${countyCode}`);
    }
  }
  
  console.log('\nImport complete!');
  
  // Show stats
  const { count } = await supabase
    .from('florida_parcels')
    .select('*', { count: 'exact', head: true });
    
  console.log(`Total parcels in database: ${count}`);
}

// Run the import
main().catch(console.error);
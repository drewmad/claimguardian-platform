#!/usr/bin/env node

/**
 * DBPR License Import Processor
 * Processes CSV files and imports into Supabase with history tracking
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const DOWNLOAD_DIR = '/Users/madengineering/ClaimGuardian/data/florida/dbpr_licenses/';
const LOG_FILE = '/Users/madengineering/ClaimGuardian/logs/dbpr_import.log';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Logging utility
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// Map license type from filename
function getLicenseType(filename) {
  const typeMap = {
    'cilb_certified.csv': 'certified',
    'cilb_registered.csv': 'registered',
    'elc.csv': 'electrical',
    'plc.csv': 'plumbing',
    'cilb_roofing.csv': 'roofing'
  };
  return typeMap[filename] || 'certified';
}

// Parse date string to ISO format
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Handle different date formats
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
    /(\d{4})-(\d{2})-(\d{2})/,        // YYYY-MM-DD
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        // MM/DD/YYYY
        return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
      } else {
        // Already in YYYY-MM-DD
        return match[0];
      }
    }
  }
  
  return null;
}

// Process a single CSV file
async function processCSVFile(filepath, licenseType, batchId) {
  return new Promise((resolve, reject) => {
    const results = [];
    const filename = path.basename(filepath);
    
    log(`Processing ${filename}...`);
    
    fs.createReadStream(filepath)
      .pipe(csv())
      .on('data', (row) => {
        // Map CSV columns to database fields
        // Note: Column names may vary, adjust as needed based on actual CSV structure
        const license = {
          license_number: row['License Number'] || row['LICENSE_NUMBER'] || row['LicenseNumber'],
          license_type: licenseType,
          status: 'active', // Will be determined based on expiration
          business_name: row['Business Name'] || row['BUSINESS_NAME'] || row['Company Name'],
          licensee_name: row['Licensee Name'] || row['LICENSEE_NAME'] || row['Name'],
          first_name: row['First Name'] || row['FIRST_NAME'],
          last_name: row['Last Name'] || row['LAST_NAME'],
          middle_name: row['Middle Name'] || row['MIDDLE_NAME'],
          address_line1: row['Address 1'] || row['ADDRESS_1'] || row['Address'],
          address_line2: row['Address 2'] || row['ADDRESS_2'],
          city: row['City'] || row['CITY'],
          state: row['State'] || row['STATE'] || 'FL',
          zip_code: row['Zip'] || row['ZIP'] || row['Zip Code'],
          county: row['County'] || row['COUNTY'],
          phone: row['Phone'] || row['PHONE'] || row['Phone Number'],
          email: row['Email'] || row['EMAIL'],
          license_class: row['License Class'] || row['LICENSE_CLASS'] || row['Class'],
          license_category: row['License Category'] || row['LICENSE_CATEGORY'] || row['Category'],
          original_issue_date: parseDate(row['Original Issue Date'] || row['ORIGINAL_ISSUE_DATE']),
          expiration_date: parseDate(row['Expiration Date'] || row['EXPIRATION_DATE']),
          last_renewal_date: parseDate(row['Last Renewal Date'] || row['LAST_RENEWAL_DATE']),
          business_type: row['Business Type'] || row['BUSINESS_TYPE'],
          dba_name: row['DBA'] || row['DBA_NAME'] || row['Doing Business As'],
          federal_employer_id: row['FEIN'] || row['Federal Employer ID'],
          insurance_carrier: row['Insurance Carrier'] || row['INSURANCE_CARRIER'],
          insurance_policy_number: row['Insurance Policy Number'] || row['INSURANCE_POLICY_NUMBER'],
          insurance_expiration: parseDate(row['Insurance Expiration'] || row['INSURANCE_EXPIRATION']),
          bond_amount: parseFloat(row['Bond Amount'] || row['BOND_AMOUNT'] || '0') || null,
          bond_company: row['Bond Company'] || row['BOND_COMPANY'],
          data_source: filename,
          last_seen_date: new Date().toISOString(),
          is_current: true
        };
        
        // Check if license is expired
        if (license.expiration_date) {
          const expDate = new Date(license.expiration_date);
          if (expDate < new Date()) {
            license.status = 'expired';
          }
        }
        
        // Clean up null/undefined values
        Object.keys(license).forEach(key => {
          if (license[key] === undefined || license[key] === '') {
            license[key] = null;
          }
        });
        
        if (license.license_number) {
          results.push(license);
        }
      })
      .on('end', () => {
        log(`Parsed ${results.length} records from ${filename}`);
        resolve(results);
      })
      .on('error', (error) => {
        log(`Error processing ${filename}: ${error.message}`);
        reject(error);
      });
  });
}

// Main import function
async function importDBPRLicenses() {
  try {
    log('Starting DBPR license import process...');
    
    // Create import batch record
    const { data: batch, error: batchError } = await supabase
      .from('dbpr_import_batches')
      .insert({
        status: 'processing',
        file_names: []
      })
      .select()
      .single();
    
    if (batchError) {
      throw new Error(`Failed to create import batch: ${batchError.message}`);
    }
    
    const batchId = batch.id;
    log(`Created import batch: ${batchId}`);
    
    // Get list of CSV files
    const csvFiles = fs.readdirSync(DOWNLOAD_DIR)
      .filter(file => file.endsWith('.csv'))
      .map(file => path.join(DOWNLOAD_DIR, file));
    
    if (csvFiles.length === 0) {
      throw new Error('No CSV files found to import');
    }
    
    log(`Found ${csvFiles.length} CSV files to process`);
    
    // Process each CSV file
    const allLicenses = [];
    const fileNames = [];
    
    for (const csvFile of csvFiles) {
      const filename = path.basename(csvFile);
      fileNames.push(filename);
      const licenseType = getLicenseType(filename);
      
      try {
        const licenses = await processCSVFile(csvFile, licenseType, batchId);
        allLicenses.push(...licenses);
      } catch (error) {
        log(`Failed to process ${filename}: ${error.message}`);
      }
    }
    
    log(`Total licenses to process: ${allLicenses.length}`);
    
    // Get all license numbers from current import
    const currentLicenseNumbers = allLicenses.map(l => l.license_number);
    
    // Process licenses in batches
    const BATCH_SIZE = 1000;
    let newCount = 0;
    let updateCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < allLicenses.length; i += BATCH_SIZE) {
      const batch = allLicenses.slice(i, i + BATCH_SIZE);
      
      // Upsert licenses
      const { data, error } = await supabase
        .from('dbpr_licenses')
        .upsert(batch, {
          onConflict: 'license_number',
          ignoreDuplicates: false
        })
        .select();
      
      if (error) {
        log(`Error upserting batch ${i / BATCH_SIZE + 1}: ${error.message}`);
        errorCount += batch.length;
      } else {
        // Count new vs updated (this is approximate)
        newCount += data.filter(d => !d.last_updated || 
          new Date(d.last_updated) >= new Date(Date.now() - 60000)).length;
        updateCount += data.length - newCount;
      }
      
      log(`Processed batch ${i / BATCH_SIZE + 1} of ${Math.ceil(allLicenses.length / BATCH_SIZE)}`);
    }
    
    // Deactivate licenses not in current import
    log('Deactivating licenses not in current import...');
    
    const { data: deactivateResult, error: deactivateError } = await supabase
      .rpc('deactivate_missing_licenses', {
        batch_id: batchId,
        current_license_numbers: currentLicenseNumbers
      });
    
    if (deactivateError) {
      log(`Error deactivating missing licenses: ${deactivateError.message}`);
    } else {
      log(`Deactivated ${deactivateResult} licenses`);
    }
    
    // Update import batch with results
    const { error: updateError } = await supabase
      .from('dbpr_import_batches')
      .update({
        status: 'completed',
        file_names: fileNames,
        total_records: allLicenses.length,
        new_records: newCount,
        updated_records: updateCount,
        deactivated_records: deactivateResult || 0,
        error_records: errorCount,
        import_duration_seconds: Math.floor((Date.now() - new Date(batch.created_at).getTime()) / 1000)
      })
      .eq('id', batchId);
    
    if (updateError) {
      log(`Error updating import batch: ${updateError.message}`);
    }
    
    log('Import process completed successfully');
    log(`Summary: ${newCount} new, ${updateCount} updated, ${deactivateResult || 0} deactivated, ${errorCount} errors`);
    
  } catch (error) {
    log(`Import failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the import
importDBPRLicenses()
  .then(() => {
    log('Import script completed');
    process.exit(0);
  })
  .catch((error) => {
    log(`Fatal error: ${error.message}`);
    process.exit(1);
  });
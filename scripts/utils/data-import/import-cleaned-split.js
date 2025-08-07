#!/usr/bin/env node

/**
 * Import all CSV files from CleanedSplit folder to Supabase
 * Deletes each file after successful import
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Load env vars from .env.local
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = 1000;
const CLEANED_SPLIT_DIR = path.join(process.cwd(), 'CleanedSplit');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Track overall progress
const globalStats = {
  totalFiles: 0,
  processedFiles: 0,
  successfulFiles: 0,
  failedFiles: [],
  totalRecords: 0,
  totalSize: 0,
  startTime: Date.now()
};

// Parse CSV line handling quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Import a single batch to Supabase
async function importBatch(records) {
  try {
    const { error } = await supabase
      .from('florida_parcels_csv_import')
      .insert(records);

    if (error) {
      console.error(`\n❌ Batch insert error: ${error.message}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`\n❌ Unexpected error: ${err.message}`);
    return false;
  }
}

// Process a single CSV file
async function processCSVFile(filePath) {
  const fileName = path.basename(filePath);
  const fileSize = fs.statSync(filePath).size;
  globalStats.totalSize += fileSize;

  console.log(`\n📄 Processing: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

  return new Promise((resolve) => {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let headers = null;
    let lineNumber = 0;
    let batch = [];
    let fileRecords = 0;
    let hasErrors = false;

    rl.on('line', async (line) => {
      lineNumber++;

      // Skip empty lines
      if (!line.trim()) return;

      if (lineNumber === 1) {
        // Parse headers and convert to lowercase
        headers = parseCSVLine(line).map(h => h.toLowerCase().trim());
        return;
      }

      const values = parseCSVLine(line);

      if (values.length !== headers.length) {
        console.error(`\n⚠️  Line ${lineNumber}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
        hasErrors = true;
        return;
      }

      // Create record object
      const record = {};
      headers.forEach((header, index) => {
        const value = values[index];
        // Convert empty strings to null
        record[header] = value === '' || value === '""' ? null : value.replace(/^"|"$/g, '');
      });

      batch.push(record);
      fileRecords++;
      globalStats.totalRecords++;

      // Process batch when it reaches the size limit
      if (batch.length >= BATCH_SIZE) {
        rl.pause();

        const success = await importBatch(batch);
        if (!success) hasErrors = true;

        process.stdout.write(`\r  Progress: ${fileRecords} records processed...`);
        batch = [];

        rl.resume();
      }
    });

    rl.on('close', async () => {
      // Process remaining records
      if (batch.length > 0) {
        const success = await importBatch(batch);
        if (!success) hasErrors = true;
      }

      console.log(`\n  ✓ Processed ${fileRecords} records`);

      if (!hasErrors) {
        // Transfer from staging to main table
        console.log('  🔄 Transferring to main table...');

        try {
          const { error } = await supabase.rpc('transfer_florida_parcels_staging');

          if (error) {
            console.error(`  ❌ Transfer error: ${error.message}`);
            hasErrors = true;
          } else {
            console.log('  ✅ Transfer successful');
          }
        } catch (err) {
          console.error(`  ❌ Transfer failed: ${err.message}`);
          hasErrors = true;
        }
      }

      resolve({ success: !hasErrors, recordCount: fileRecords });
    });

    rl.on('error', (error) => {
      console.error(`\n❌ Error reading file: ${error.message}`);
      resolve({ success: false, recordCount: 0 });
    });
  });
}

// Delete file with safety check
async function deleteFile(filePath) {
  try {
    const fileName = path.basename(filePath);

    // Create backup path
    const backupDir = path.join(process.cwd(), 'CleanedSplit_imported');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Move instead of delete (safer)
    const backupPath = path.join(backupDir, fileName);
    fs.renameSync(filePath, backupPath);

    console.log(`  📦 Moved to: CleanedSplit_imported/${fileName}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to move file: ${error.message}`);
    return false;
  }
}

// Main import function
async function main() {
  console.log('🚀 Florida Parcels Import Tool');
  console.log('==============================\n');
  console.log(`📁 Source: ${CLEANED_SPLIT_DIR}`);
  console.log(`📦 Batch size: ${BATCH_SIZE} records\n`);

  // Check if directory exists
  if (!fs.existsSync(CLEANED_SPLIT_DIR)) {
    console.error(`❌ Directory not found: ${CLEANED_SPLIT_DIR}`);
    process.exit(1);
  }

  // Get all CSV files sorted by name
  const csvFiles = fs.readdirSync(CLEANED_SPLIT_DIR)
    .filter(file => file.toLowerCase().endsWith('.csv'))
    .sort()
    .map(file => path.join(CLEANED_SPLIT_DIR, file));

  globalStats.totalFiles = csvFiles.length;
  console.log(`📊 Found ${csvFiles.length} CSV files to process\n`);

  if (csvFiles.length === 0) {
    console.log('✅ No files to process');
    process.exit(0);
  }

  // Confirm before starting
  console.log('⚠️  Files will be moved to CleanedSplit_imported/ after successful import');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Process each file
  for (let i = 0; i < csvFiles.length; i++) {
    const csvFile = csvFiles[i];
    globalStats.processedFiles++;

    console.log(`\n[${i + 1}/${csvFiles.length}] File: ${path.basename(csvFile)}`);
    console.log('─'.repeat(50));

    const result = await processCSVFile(csvFile);

    if (result.success) {
      globalStats.successfulFiles++;

      // Delete/move the file after successful import
      const deleted = await deleteFile(csvFile);

      if (!deleted) {
        console.log('  ⚠️  File processed but not moved');
      }
    } else {
      globalStats.failedFiles.push(path.basename(csvFile));
      console.log('  ❌ Keeping file due to errors');
    }

    // Show progress
    const elapsed = (Date.now() - globalStats.startTime) / 1000;
    const rate = globalStats.totalRecords / elapsed;
    const eta = (csvFiles.length - i - 1) * (elapsed / (i + 1));

    console.log(`\n📊 Overall Progress: ${i + 1}/${csvFiles.length} files`);
    console.log(`   Records: ${globalStats.totalRecords.toLocaleString()} | Rate: ${rate.toFixed(0)}/sec | ETA: ${(eta / 60).toFixed(1)} min`);
  }

  // Final summary
  const duration = (Date.now() - globalStats.startTime) / 1000;
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Successful files: ${globalStats.successfulFiles}/${globalStats.totalFiles}`);
  console.log(`📈 Total records: ${globalStats.totalRecords.toLocaleString()}`);
  console.log(`💾 Total size: ${(globalStats.totalSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`⏱️  Duration: ${(duration / 60).toFixed(2)} minutes`);
  console.log(`⚡ Average speed: ${(globalStats.totalRecords / duration).toFixed(0)} records/second`);

  if (globalStats.failedFiles.length > 0) {
    console.log(`\n❌ Failed files (${globalStats.failedFiles.length}):`);
    globalStats.failedFiles.forEach(file => console.log(`   - ${file}`));
  }

  // Cost estimate
  const estimatedDBSize = (globalStats.totalSize / 1024 / 1024 / 1024) * 2.5;
  const monthlyCost = estimatedDBSize * 0.125;

  console.log('\n💰 Estimated Supabase Costs:');
  console.log(`   Database size: ~${estimatedDBSize.toFixed(1)} GB`);
  console.log(`   Monthly cost: ~$${monthlyCost.toFixed(2)}`);

  console.log('\n✨ Import process complete!');
  console.log('📁 Original files moved to: CleanedSplit_imported/');
}

// Handle interruption
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Import interrupted by user');
  console.log(`Processed ${globalStats.processedFiles} files before interruption`);
  process.exit(1);
});

// Run the import
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}

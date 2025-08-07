#!/usr/bin/env node

/**
 * Resilient import script for CleanedSplit CSV files
 * Features: connection pooling, retries, rate limiting, smaller batches
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Load env vars
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = 250; // Smaller batches to avoid timeouts
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const BATCH_DELAY = 100; // 100ms between batches
const CLEANED_SPLIT_DIR = path.join(process.cwd(), 'CleanedSplit');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create Supabase client with custom settings
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Global statistics
const globalStats = {
  totalFiles: 0,
  processedFiles: 0,
  successfulFiles: 0,
  failedFiles: [],
  totalRecords: 0,
  successfulRecords: 0,
  failedRecords: 0,
  totalSize: 0,
  startTime: Date.now()
};

// Sleep function for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

// Import batch with retry logic
async function importBatchWithRetry(records, retryCount = 0) {
  try {
    const { data, error } = await supabase
      .from('florida_parcels_csv_import')
      .insert(records);

    if (error) {
      throw new Error(error.message);
    }

    globalStats.successfulRecords += records.length;
    return { success: true };
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
      console.log(`\n  ⚠️  Retry ${retryCount + 1}/${MAX_RETRIES} after ${delay}ms: ${error.message}`);
      await sleep(delay);
      return importBatchWithRetry(records, retryCount + 1);
    } else {
      console.error(`\n  ❌ Failed after ${MAX_RETRIES} retries: ${error.message}`);
      globalStats.failedRecords += records.length;
      return { success: false, error: error.message };
    }
  }
}

// Process CSV file with streaming
async function processCSVFile(filePath) {
  const fileName = path.basename(filePath);
  const fileSize = fs.statSync(filePath).size;
  globalStats.totalSize += fileSize;

  console.log(`\n📄 Processing: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`   Batch size: ${BATCH_SIZE} | Max retries: ${MAX_RETRIES}`);

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
    let fileErrors = 0;
    let batchCount = 0;
    let lastProgressUpdate = Date.now();

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
        fileErrors++;
        return;
      }

      // Create record object
      const record = {};
      headers.forEach((header, index) => {
        const value = values[index];
        record[header] = value === '' || value === '""' ? null : value.replace(/^"|"$/g, '');
      });

      batch.push(record);
      fileRecords++;
      globalStats.totalRecords++;

      // Process batch when it reaches the size limit
      if (batch.length >= BATCH_SIZE) {
        rl.pause();
        batchCount++;

        // Add delay between batches to avoid overwhelming the connection pool
        if (batchCount % 5 === 0) {
          await sleep(BATCH_DELAY * 2);
        } else {
          await sleep(BATCH_DELAY);
        }

        const result = await importBatchWithRetry(batch);
        if (!result.success) {
          fileErrors += batch.length;
        }

        // Update progress every second
        if (Date.now() - lastProgressUpdate > 1000) {
          const percent = ((fileRecords / 150000) * 100).toFixed(1); // Estimate ~150k records per file
          process.stdout.write(`\r  Progress: ${fileRecords} records | ${batchCount} batches | ~${percent}% complete`);
          lastProgressUpdate = Date.now();
        }

        batch = [];
        rl.resume();
      }
    });

    rl.on('close', async () => {
      // Process remaining records
      if (batch.length > 0) {
        batchCount++;
        const result = await importBatchWithRetry(batch);
        if (!result.success) {
          fileErrors += batch.length;
        }
      }

      console.log(`\n  ✓ Processed ${fileRecords} records in ${batchCount} batches`);

      const hasErrors = fileErrors > 0;

      if (!hasErrors) {
        // Transfer from staging to main table with retry
        console.log('  🔄 Transferring to main table...');

        let transferred = false;
        for (let i = 0; i < MAX_RETRIES; i++) {
          try {
            const { error } = await supabase.rpc('transfer_florida_parcels_staging');

            if (!error) {
              console.log('  ✅ Transfer successful');
              transferred = true;
              break;
            } else {
              throw new Error(error.message);
            }
          } catch (err) {
            console.error(`  ⚠️  Transfer attempt ${i + 1} failed: ${err.message}`);
            if (i < MAX_RETRIES - 1) {
              await sleep(RETRY_DELAY * Math.pow(2, i));
            }
          }
        }

        if (!transferred) {
          hasErrors = true;
          console.error('  ❌ Transfer failed after all retries');
        }
      }

      resolve({
        success: !hasErrors,
        recordCount: fileRecords,
        errorCount: fileErrors
      });
    });

    rl.on('error', (error) => {
      console.error(`\n❌ Error reading file: ${error.message}`);
      resolve({ success: false, recordCount: 0, errorCount: 0 });
    });
  });
}

// Safe file move
async function moveFile(filePath) {
  try {
    const fileName = path.basename(filePath);
    const backupDir = path.join(process.cwd(), 'CleanedSplit_imported');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const backupPath = path.join(backupDir, fileName);
    fs.renameSync(filePath, backupPath);

    console.log(`  📦 Moved to: CleanedSplit_imported/${fileName}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to move file: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Florida Parcels Resilient Import Tool');
  console.log('=======================================\n');
  console.log(`📁 Source: ${CLEANED_SPLIT_DIR}`);
  console.log(`📦 Batch size: ${BATCH_SIZE} records`);
  console.log(`🔄 Max retries: ${MAX_RETRIES}`);
  console.log(`⏱️  Delays: ${BATCH_DELAY}ms between batches\n`);

  if (!fs.existsSync(CLEANED_SPLIT_DIR)) {
    console.error(`❌ Directory not found: ${CLEANED_SPLIT_DIR}`);
    process.exit(1);
  }

  // Get all CSV files
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

  console.log('⚠️  Files will be moved to CleanedSplit_imported/ after successful import');
  console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

  await sleep(3000);

  // Process each file
  for (let i = 0; i < csvFiles.length; i++) {
    const csvFile = csvFiles[i];
    globalStats.processedFiles++;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[${i + 1}/${csvFiles.length}] File: ${path.basename(csvFile)}`);
    console.log('='.repeat(60));

    const startTime = Date.now();
    const result = await processCSVFile(csvFile);
    const duration = (Date.now() - startTime) / 1000;

    console.log(`  ⏱️  File processing time: ${duration.toFixed(1)}s`);
    console.log(`  📊 Records/second: ${(result.recordCount / duration).toFixed(0)}`);

    if (result.success) {
      globalStats.successfulFiles++;
      await moveFile(csvFile);
    } else {
      globalStats.failedFiles.push(path.basename(csvFile));
      console.log('  ❌ File kept due to errors');
    }

    // Overall progress
    const elapsed = (Date.now() - globalStats.startTime) / 1000;
    const filesRemaining = csvFiles.length - i - 1;
    const avgTimePerFile = elapsed / (i + 1);
    const eta = filesRemaining * avgTimePerFile;

    console.log(`\n📊 Overall Progress:`);
    console.log(`   Files: ${i + 1}/${csvFiles.length} (${filesRemaining} remaining)`);
    console.log(`   Records: ${globalStats.successfulRecords.toLocaleString()} successful, ${globalStats.failedRecords.toLocaleString()} failed`);
    console.log(`   ETA: ${(eta / 60).toFixed(1)} minutes`);

    // Add longer delay between files to let connections recover
    if (i < csvFiles.length - 1) {
      console.log('\n⏸️  Pausing 2 seconds before next file...');
      await sleep(2000);
    }
  }

  // Final summary
  const totalDuration = (Date.now() - globalStats.startTime) / 1000;
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Successful files: ${globalStats.successfulFiles}/${globalStats.totalFiles}`);
  console.log(`📈 Total records processed: ${globalStats.totalRecords.toLocaleString()}`);
  console.log(`✅ Successful records: ${globalStats.successfulRecords.toLocaleString()}`);
  console.log(`❌ Failed records: ${globalStats.failedRecords.toLocaleString()}`);
  console.log(`💾 Total size: ${(globalStats.totalSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`⏱️  Total duration: ${(totalDuration / 60).toFixed(2)} minutes`);
  console.log(`⚡ Average speed: ${(globalStats.totalRecords / totalDuration).toFixed(0)} records/second`);

  if (globalStats.failedFiles.length > 0) {
    console.log(`\n❌ Failed files (${globalStats.failedFiles.length}):`);
    globalStats.failedFiles.forEach(file => console.log(`   - ${file}`));
  }

  console.log('\n✨ Import process complete!');
  if (globalStats.successfulFiles > 0) {
    console.log('📁 Successfully imported files moved to: CleanedSplit_imported/');
  }
}

// Handle interruption
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Import interrupted by user');
  console.log(`Processed ${globalStats.processedFiles} files before interruption`);
  console.log(`Records: ${globalStats.successfulRecords.toLocaleString()} successful, ${globalStats.failedRecords.toLocaleString()} failed`);
  process.exit(1);
});

// Run
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}

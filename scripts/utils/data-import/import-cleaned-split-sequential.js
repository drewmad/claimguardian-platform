#!/usr/bin/env node

/**
 * Sequential import with visual progress tracking
 * Processes one batch at a time to avoid connection pool issues
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
const BATCH_SIZE = 100; // Even smaller batches
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds base delay
const BATCH_DELAY = 1000; // 1 second between batches
const CLEANED_SPLIT_DIR = path.join(process.cwd(), 'CleanedSplit');

// Visual progress bar width
const PROGRESS_BAR_WIDTH = 40;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Statistics
const stats = {
  currentFile: {
    name: '',
    totalRecords: 0,
    processedRecords: 0,
    successfulBatches: 0,
    failedBatches: 0,
    retryingBatches: 0,
    startTime: 0
  },
  global: {
    totalFiles: 0,
    processedFiles: 0,
    successfulFiles: 0,
    totalRecords: 0,
    successfulRecords: 0,
    startTime: Date.now()
  }
};

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Clear current line and move cursor to beginning
const clearLine = () => {
  process.stdout.write('\r\x1b[K');
};

// Create progress bar
const createProgressBar = (current, total, width = PROGRESS_BAR_WIDTH) => {
  const percentage = total > 0 ? current / total : 0;
  const filled = Math.round(width * percentage);
  const empty = width - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const percentStr = (percentage * 100).toFixed(1).padStart(5);
  
  return `[${bar}] ${percentStr}%`;
};

// Update progress display
const updateProgress = () => {
  clearLine();
  
  const { currentFile } = stats;
  const progress = createProgressBar(currentFile.processedRecords, currentFile.totalRecords);
  const elapsed = (Date.now() - currentFile.startTime) / 1000;
  const rate = currentFile.processedRecords / elapsed || 0;
  const eta = rate > 0 ? (currentFile.totalRecords - currentFile.processedRecords) / rate : 0;
  
  const status = [
    `${colors.bright}${progress}${colors.reset}`,
    `Records: ${currentFile.processedRecords.toLocaleString()}/${currentFile.totalRecords.toLocaleString()}`,
    `${colors.green}✓${currentFile.successfulBatches}${colors.reset}`,
    currentFile.failedBatches > 0 ? `${colors.red}✗${currentFile.failedBatches}${colors.reset}` : '',
    currentFile.retryingBatches > 0 ? `${colors.yellow}↻${currentFile.retryingBatches}${colors.reset}` : '',
    `${rate.toFixed(0)}/s`,
    `ETA: ${eta > 0 ? Math.ceil(eta) + 's' : '---'}`
  ].filter(Boolean).join(' | ');
  
  process.stdout.write(status);
};

// Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Parse CSV line
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

// Import single batch with retry
async function importBatch(records, batchNumber, retryCount = 0) {
  stats.currentFile.retryingBatches = retryCount > 0 ? 1 : 0;
  updateProgress();
  
  try {
    await sleep(BATCH_DELAY); // Always delay before request
    
    const { error } = await supabase
      .from('florida_parcels_csv_import')
      .insert(records);

    if (error) {
      throw new Error(error.message);
    }
    
    stats.currentFile.successfulBatches++;
    stats.currentFile.retryingBatches = 0;
    stats.global.successfulRecords += records.length;
    return true;
    
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount);
      
      clearLine();
      console.log(`\n${colors.yellow}⚠️  Batch ${batchNumber} failed: ${error.message}${colors.reset}`);
      console.log(`${colors.gray}   Retrying in ${delay / 1000}s... (attempt ${retryCount + 1}/${MAX_RETRIES})${colors.reset}`);
      
      await sleep(delay);
      return importBatch(records, batchNumber, retryCount + 1);
    } else {
      stats.currentFile.failedBatches++;
      stats.currentFile.retryingBatches = 0;
      
      clearLine();
      console.log(`\n${colors.red}❌ Batch ${batchNumber} failed permanently after ${MAX_RETRIES} retries${colors.reset}`);
      console.log(`${colors.gray}   Error: ${error.message}${colors.reset}`);
      return false;
    }
  }
}

// Count total lines in file for progress tracking
async function countFileLines(filePath) {
  return new Promise((resolve) => {
    let lineCount = 0;
    const stream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: stream });
    
    rl.on('line', () => lineCount++);
    rl.on('close', () => resolve(lineCount - 1)); // Subtract header line
  });
}

// Process single CSV file
async function processCSVFile(filePath, fileIndex) {
  const fileName = path.basename(filePath);
  const fileSize = fs.statSync(filePath).size;
  
  console.log(`\n${colors.bright}[${fileIndex}/${stats.global.totalFiles}] ${fileName}${colors.reset} (${(fileSize / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);
  
  // Count total records first
  console.log(`${colors.cyan}📊 Counting records...${colors.reset}`);
  const totalRecords = await countFileLines(filePath);
  
  // Reset current file stats
  stats.currentFile = {
    name: fileName,
    totalRecords,
    processedRecords: 0,
    successfulBatches: 0,
    failedBatches: 0,
    retryingBatches: 0,
    startTime: Date.now()
  };
  
  console.log(`${colors.cyan}📦 Processing ${totalRecords.toLocaleString()} records in batches of ${BATCH_SIZE}${colors.reset}\n`);
  
  return new Promise((resolve) => {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let headers = null;
    let lineNumber = 0;
    let batch = [];
    let batchNumber = 0;
    let hasErrors = false;

    // Process lines sequentially
    let lineQueue = [];
    let processing = false;
    
    const processNextBatch = async () => {
      if (processing || lineQueue.length === 0) return;
      
      processing = true;
      const currentBatch = lineQueue.shift();
      
      batchNumber++;
      const success = await importBatch(currentBatch.records, batchNumber);
      
      if (!success) {
        hasErrors = true;
      }
      
      stats.currentFile.processedRecords += currentBatch.records.length;
      updateProgress();
      
      processing = false;
      
      // Process next batch if available
      if (lineQueue.length > 0) {
        await processNextBatch();
      } else if (currentBatch.isLast) {
        // File processing complete
        finishFile();
      }
    };
    
    const finishFile = async () => {
      clearLine();
      const duration = (Date.now() - stats.currentFile.startTime) / 1000;
      
      console.log(`\n${colors.bright}📋 File Summary:${colors.reset}`);
      console.log(`   ${colors.green}✓ Successful batches: ${stats.currentFile.successfulBatches}${colors.reset}`);
      console.log(`   ${colors.red}✗ Failed batches: ${stats.currentFile.failedBatches}${colors.reset}`);
      console.log(`   ⏱️  Duration: ${duration.toFixed(1)}s (${(stats.currentFile.processedRecords / duration).toFixed(0)} records/s)`);
      
      if (!hasErrors) {
        console.log(`\n${colors.cyan}🔄 Transferring to main table...${colors.reset}`);
        
        try {
          await supabase.rpc('transfer_florida_parcels_staging');
          console.log(`${colors.green}✅ Transfer successful${colors.reset}`);
          stats.global.successfulFiles++;
        } catch (error) {
          console.error(`${colors.red}❌ Transfer failed: ${error.message}${colors.reset}`);
          hasErrors = true;
        }
      }
      
      resolve({ success: !hasErrors, recordCount: stats.currentFile.processedRecords });
    };

    rl.on('line', (line) => {
      lineNumber++;
      
      if (!line.trim()) return;
      
      if (lineNumber === 1) {
        headers = parseCSVLine(line).map(h => h.toLowerCase().trim());
        return;
      }

      const values = parseCSVLine(line);
      if (values.length !== headers.length) {
        hasErrors = true;
        return;
      }

      const record = {};
      headers.forEach((header, index) => {
        const value = values[index];
        record[header] = value === '' || value === '""' ? null : value.replace(/^"|"$/g, '');
      });

      batch.push(record);

      if (batch.length >= BATCH_SIZE) {
        lineQueue.push({ 
          records: [...batch], 
          isLast: false 
        });
        batch = [];
        processNextBatch();
      }
    });

    rl.on('close', () => {
      // Queue final batch
      if (batch.length > 0) {
        lineQueue.push({ 
          records: batch, 
          isLast: true 
        });
        processNextBatch();
      } else if (lineQueue.length === 0) {
        finishFile();
      }
    });

    rl.on('error', (error) => {
      console.error(`${colors.red}❌ Error reading file: ${error.message}${colors.reset}`);
      resolve({ success: false, recordCount: 0 });
    });
  });
}

// Main function
async function main() {
  console.clear();
  console.log(`${colors.bright}${colors.cyan}🚀 Florida Parcels Sequential Import${colors.reset}`);
  console.log(`${'═'.repeat(60)}\n`);
  
  console.log(`📁 Source: ${CLEANED_SPLIT_DIR}`);
  console.log(`📦 Batch size: ${BATCH_SIZE} records`);
  console.log(`🔄 Retries: ${MAX_RETRIES} attempts`);
  console.log(`⏱️  Delays: ${BATCH_DELAY}ms between batches\n`);

  const csvFiles = fs.readdirSync(CLEANED_SPLIT_DIR)
    .filter(file => file.toLowerCase().endsWith('.csv'))
    .sort()
    .map(file => path.join(CLEANED_SPLIT_DIR, file));

  stats.global.totalFiles = csvFiles.length;
  console.log(`📊 Found ${colors.bright}${csvFiles.length}${colors.reset} CSV files\n`);

  console.log(`${colors.yellow}⚠️  Files will be moved after successful import${colors.reset}`);
  console.log(`${colors.gray}Press Ctrl+C to cancel, starting in 3 seconds...${colors.reset}\n`);
  
  await sleep(3000);

  // Process each file sequentially
  for (let i = 0; i < csvFiles.length; i++) {
    const csvFile = csvFiles[i];
    stats.global.processedFiles++;
    
    const result = await processCSVFile(csvFile, i + 1);
    
    if (result.success) {
      // Move file
      const fileName = path.basename(csvFile);
      const backupDir = path.join(process.cwd(), 'CleanedSplit_imported');
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
      }
      
      try {
        fs.renameSync(csvFile, path.join(backupDir, fileName));
        console.log(`${colors.green}📦 Moved to CleanedSplit_imported/${colors.reset}\n`);
      } catch (e) {
        console.error(`${colors.red}❌ Failed to move file${colors.reset}\n`);
      }
    } else {
      console.log(`${colors.red}❌ File kept due to errors${colors.reset}\n`);
    }
    
    stats.global.totalRecords += result.recordCount;
  }

  // Final summary
  const totalDuration = (Date.now() - stats.global.startTime) / 1000;
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`${colors.bright}📊 IMPORT COMPLETE${colors.reset}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`✅ Successful files: ${colors.green}${stats.global.successfulFiles}${colors.reset}/${stats.global.totalFiles}`);
  console.log(`📈 Total records: ${stats.global.totalRecords.toLocaleString()}`);
  console.log(`⏱️  Duration: ${(totalDuration / 60).toFixed(2)} minutes`);
  console.log(`⚡ Average: ${(stats.global.totalRecords / totalDuration).toFixed(0)} records/second`);
  
  console.log(`\n${colors.green}✨ Done!${colors.reset}`);
}

// Handle interruption
process.on('SIGINT', () => {
  clearLine();
  console.log(`\n\n${colors.yellow}⚠️  Import interrupted${colors.reset}`);
  console.log(`Processed ${stats.global.processedFiles} files`);
  console.log(`Records: ${stats.global.successfulRecords.toLocaleString()}`);
  process.exit(1);
});

// Run
if (require.main === module) {
  main().catch(console.error);
}
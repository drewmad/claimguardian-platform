#!/usr/bin/env node

/**
 * Direct CSV file upload to Supabase
 * Uploads entire files instead of processing line by line
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Load env vars
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLEANED_SPLIT_DIR = path.join(process.cwd(), 'CleanedSplit');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Progress bar
const createProgressBar = (current, total, width = 40) => {
  const percentage = total > 0 ? current / total : 0;
  const filled = Math.round(width * percentage);
  const empty = width - filled;

  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const percentStr = (percentage * 100).toFixed(1).padStart(5);

  return `[${bar}] ${percentStr}%`;
};

// Upload CSV file directly to Supabase
async function uploadCSVFile(filePath, fileIndex, totalFiles) {
  const fileName = path.basename(filePath);
  const fileSize = fs.statSync(filePath).size;
  const startTime = Date.now();

  console.log(`\n${colors.bright}[${fileIndex}/${totalFiles}] ${fileName}${colors.reset} (${(fileSize / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);

  try {
    // Read file
    const fileContent = fs.readFileSync(filePath, 'utf8');

    console.log(`${colors.cyan}📤 Uploading to Supabase...${colors.reset}`);

    // Method 1: Direct SQL COPY command (if available)
    const copyCommand = `
      COPY florida_parcels_csv_import
      FROM STDIN
      WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"', ESCAPE '"');
    `;

    // Method 2: Use Supabase Storage and then import
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), {
      filename: fileName,
      contentType: 'text/csv'
    });

    // First, try storage upload
    const storageUrl = `${SUPABASE_URL}/storage/v1/object/temp-csv-import/${fileName}`;
    const storageResponse = await fetch(storageUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: form
    });

    if (!storageResponse.ok) {
      // Fallback to batch insert via API
      console.log(`${colors.yellow}⚠️  Storage upload failed, using batch API...${colors.reset}`);
      return await batchUploadFile(filePath, fileName);
    }

    // Import from storage
    console.log(`${colors.cyan}📥 Importing from storage...${colors.reset}`);

    const importResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/import_csv_from_storage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file_path: `temp-csv-import/${fileName}`,
        table_name: 'florida_parcels_csv_import'
      })
    });

    if (!importResponse.ok) {
      const error = await importResponse.text();
      throw new Error(`Import failed: ${error}`);
    }

    // Clean up storage file
    await fetch(storageUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      }
    });

    // Transfer to main table
    console.log(`${colors.cyan}🔄 Transferring to main table...${colors.reset}`);

    const transferResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/transfer_florida_parcels_staging`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      },
      body: '{}'
    });

    if (!transferResponse.ok) {
      const error = await transferResponse.text();
      throw new Error(`Transfer failed: ${error}`);
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`${colors.green}✅ Success! Processed in ${duration.toFixed(1)}s${colors.reset}`);

    return { success: true, duration };

  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

// Fallback: Batch upload using parsed CSV
async function batchUploadFile(filePath, fileName) {
  const { createClient } = require('@supabase/supabase-js');
  const csv = require('csv-parser');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  return new Promise((resolve) => {
    const records = [];
    let recordCount = 0;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        records.push(row);
        recordCount++;

        // Process in chunks of 1000
        if (records.length >= 1000) {
          const batch = records.splice(0, 1000);
          supabase.from('florida_parcels_csv_import').insert(batch).then();
        }
      })
      .on('end', async () => {
        // Insert remaining records
        if (records.length > 0) {
          await supabase.from('florida_parcels_csv_import').insert(records);
        }

        // Transfer to main table
        await supabase.rpc('transfer_florida_parcels_staging');

        console.log(`${colors.green}✅ Imported ${recordCount.toLocaleString()} records${colors.reset}`);
        resolve({ success: true });
      })
      .on('error', (error) => {
        console.error(`${colors.red}❌ Parse error: ${error.message}${colors.reset}`);
        resolve({ success: false, error: error.message });
      });
  });
}

// Alternative: Use Supabase CLI if available
async function uploadViaSupabaseCLI(filePath) {
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);

  try {
    // Check if Supabase CLI is installed
    await execPromise('supabase --version');

    console.log(`${colors.cyan}📤 Uploading via Supabase CLI...${colors.reset}`);

    const command = `supabase db push --file "${filePath}" --table florida_parcels_csv_import --project-ref ${projectRef}`;

    const { stdout, stderr } = await execPromise(command, {
      env: {
        ...process.env,
        SUPABASE_ACCESS_TOKEN: SUPABASE_SERVICE_KEY
      }
    });

    if (stderr) {
      throw new Error(stderr);
    }

    console.log(`${colors.green}✅ ${stdout}${colors.reset}`);
    return { success: true };

  } catch (error) {
    // CLI not available or command failed
    return null;
  }
}

// Main function
async function main() {
  console.clear();
  console.log(`${colors.bright}${colors.cyan}🚀 Florida Parcels Direct File Import${colors.reset}`);
  console.log(`${'═'.repeat(60)}\n`);

  console.log(`📁 Source: ${CLEANED_SPLIT_DIR}`);
  console.log(`🔧 Method: Direct file upload\n`);

  const csvFiles = fs.readdirSync(CLEANED_SPLIT_DIR)
    .filter(file => file.toLowerCase().endsWith('.csv'))
    .sort()
    .map(file => path.join(CLEANED_SPLIT_DIR, file));

  const totalFiles = csvFiles.length;
  console.log(`📊 Found ${colors.bright}${totalFiles}${colors.reset} CSV files\n`);

  // Check for required dependencies
  try {
    require.resolve('form-data');
    require.resolve('node-fetch');
  } catch {
    console.log(`${colors.yellow}⚠️  Installing required dependencies...${colors.reset}`);
    const { execSync } = require('child_process');
    execSync('pnpm add -w form-data node-fetch@2', { stdio: 'inherit' });
    console.log(`${colors.green}✅ Dependencies installed${colors.reset}\n`);
  }

  console.log(`${colors.yellow}⚠️  Files will be moved after successful import${colors.reset}`);
  console.log(`${colors.gray}Press Ctrl+C to cancel, starting in 3 seconds...${colors.reset}\n`);

  await new Promise(r => setTimeout(r, 3000));

  let successCount = 0;
  const startTime = Date.now();

  // Process each file
  for (let i = 0; i < csvFiles.length; i++) {
    const csvFile = csvFiles[i];
    const fileName = path.basename(csvFile);

    // Try CLI first
    let result = await uploadViaSupabaseCLI(csvFile);

    // Fallback to API upload
    if (!result) {
      result = await uploadCSVFile(csvFile, i + 1, totalFiles);
    }

    if (result.success) {
      successCount++;

      // Move file
      const backupDir = path.join(process.cwd(), 'CleanedSplit_imported');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
      }

      try {
        fs.renameSync(csvFile, path.join(backupDir, fileName));
        console.log(`${colors.green}📦 Moved to CleanedSplit_imported/${colors.reset}`);
      } catch (e) {
        console.error(`${colors.red}❌ Failed to move file${colors.reset}`);
      }
    } else {
      console.log(`${colors.red}❌ File kept due to errors${colors.reset}`);
    }

    // Progress summary
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = totalFiles - i - 1;
    const avgTime = elapsed / (i + 1);
    const eta = remaining * avgTime;

    if (remaining > 0) {
      console.log(`${colors.gray}Progress: ${createProgressBar(i + 1, totalFiles)} | ETA: ${Math.ceil(eta / 60)} min${colors.reset}`);
    }
  }

  // Final summary
  const totalDuration = (Date.now() - startTime) / 1000;

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`${colors.bright}📊 IMPORT COMPLETE${colors.reset}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`✅ Successful files: ${colors.green}${successCount}${colors.reset}/${totalFiles}`);
  console.log(`⏱️  Total duration: ${(totalDuration / 60).toFixed(2)} minutes`);
  console.log(`⚡ Average: ${(totalDuration / successCount).toFixed(1)}s per file`);

  console.log(`\n${colors.green}✨ Done!${colors.reset}`);
}

// Handle interruption
process.on('SIGINT', () => {
  console.log(`\n\n${colors.yellow}⚠️  Import interrupted${colors.reset}`);
  process.exit(1);
});

// Run
if (require.main === module) {
  main().catch(console.error);
}

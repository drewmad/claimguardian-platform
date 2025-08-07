#!/usr/bin/env node

/**
 * Optimal Parallel Import - Combines speed and parallel processing
 * Usage: node import-parallel-optimal.js [START] [END]
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { Worker } = require("worker_threads");
const os = require("os");

// Load environment
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 1000;
const CLEANED_SPLIT_DIR = process.env.TEST_MODE
  ? path.join(process.cwd(), "CleanedSplit_test")
  : path.join(process.cwd(), "CleanedSplit");

// Parse arguments
const start = parseInt(process.argv[2]) || 0;
const end = parseInt(process.argv[3]) || 999;
const workerMode = process.argv[4] === "worker";

// Column mapping cache (will be populated on first file)
let columnMapping = null;

// Colors for terminal
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Get column mapping between CSV headers and staging table columns
async function getColumnMapping(csvHeaders) {
  if (columnMapping) return columnMapping;

  try {
    // Get staging table structure
    const { data, error } = await supabase
      .from("stg_florida_parcels")
      .select("*")
      .limit(1);

    if (error) throw error;

    const stagingColumns = Object.keys(data[0] || {});
    const mapping = {};

    // Map CSV headers to staging columns (case-insensitive match)
    for (const csvHeader of csvHeaders) {
      const stagingMatch = stagingColumns.find(
        (col) => col.toLowerCase() === csvHeader.toLowerCase(),
      );
      if (stagingMatch) {
        mapping[csvHeader] = stagingMatch;
      }
    }

    columnMapping = mapping;
    console.log(
      `   📋 Mapped ${Object.keys(mapping).length}/${csvHeaders.length} columns`,
    );
    return mapping;
  } catch (error) {
    throw new Error(`Failed to get column mapping: ${error.message}`);
  }
}

// Fast CSV parser
function parseCSVLine(line) {
  const result = [];
  let current = "";
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
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Process single file
async function processFile(filePath, fileIndex, totalFiles) {
  const fileName = path.basename(filePath);
  const fileSize = (fs.statSync(filePath).size / 1024 / 1024).toFixed(1);
  const processId = `[${process.pid}]`;

  console.log(
    `${colors.cyan}${processId} [${fileIndex}/${totalFiles}] ${fileName} (${fileSize} MB)${colors.reset}`,
  );

  const startTime = Date.now();
  let recordCount = 0;
  let errorCount = 0;

  try {
    // Read entire file for maximum speed
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.trim().split("\n");

    if (lines.length < 2) {
      throw new Error("File has no data");
    }

    // Parse headers (keep original case for mapping)
    const csvHeaders = parseCSVLine(lines[0]).map((h) =>
      h.trim().replace(/"/g, ""),
    );

    // Get column mapping
    const mapping = await getColumnMapping(csvHeaders);

    // Process all records
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      try {
        const values = parseCSVLine(lines[i]);

        if (values.length !== csvHeaders.length) {
          errorCount++;
          continue;
        }

        // Create CSV record first
        const csvRecord = {};
        csvHeaders.forEach((header, idx) => {
          let value = values[idx] || "";
          value = value.replace(/^"|"$/g, "").trim();
          csvRecord[header] = value === "" ? null : value;
        });

        // Map to staging table columns
        const stagingRecord = {};
        for (const [csvHeader, value] of Object.entries(csvRecord)) {
          const stagingColumn = mapping[csvHeader];
          if (stagingColumn) {
            stagingRecord[stagingColumn] = value;
          }
        }

        records.push(stagingRecord);
        recordCount++;
      } catch (e) {
        errorCount++;
      }
    }

    // Upload in large batches
    console.log(`${processId}    📤 Uploading ${recordCount} records...`);

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const progress = Math.min(i + BATCH_SIZE, records.length);

      process.stdout.write(
        `\r${processId}    Progress: ${progress}/${recordCount} (${Math.round((progress / recordCount) * 100)}%)`,
      );

      // Add ETL metadata to each record
      const batchWithMetadata = batch.map((record, idx) => ({
        ...record,
        stg_source_file: fileName,
        stg_row_number: i + idx + 2, // +2 for header row and 1-based indexing
      }));

      // Insert into staging table
      const { error } = await supabase
        .from("stg_florida_parcels")
        .insert(batchWithMetadata);

      if (error) {
        console.error(
          `${processId}    ❌ Supabase error details:`,
          JSON.stringify(error, null, 2),
        );
        throw new Error(
          `Batch insert failed: ${error.message || error.details || JSON.stringify(error)}`,
        );
      }

      // Small delay to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Note: Data now in staging table - transfer to main table will be done separately
    console.log(
      `\n${processId}    📋 Data loaded to staging table (stg_florida_parcels)`,
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = Math.round(recordCount / duration);

    console.log(
      `${processId}    ${colors.green}✅ Success! ${recordCount} records in ${duration}s (${rate} rec/s)${colors.reset}`,
    );
    if (errorCount > 0) {
      console.log(
        `${processId}    ${colors.yellow}⚠️  Skipped ${errorCount} malformed rows${colors.reset}`,
      );
    }

    return { success: true, recordCount, duration: parseFloat(duration) };
  } catch (error) {
    console.error(
      `${processId}    ${colors.red}❌ Failed: ${error.message}${colors.reset}`,
    );
    return { success: false, recordCount: 0, duration: 0 };
  }
}

// Main function
async function main() {
  // Get files in range
  const allFiles = fs
    .readdirSync(CLEANED_SPLIT_DIR)
    .filter((f) => f.endsWith(".csv"))
    .sort();

  const files = allFiles.slice(start, end);

  if (files.length === 0) {
    console.log("No files in specified range");
    return;
  }

  console.log(`\n${colors.bright}🚀 Optimal Parallel Import${colors.reset}`);
  console.log(`📊 Processing files ${start}-${end}: ${files.length} files`);
  console.log(`⚡ Batch size: ${BATCH_SIZE} records\n`);

  const startTime = Date.now();
  let successCount = 0;
  let totalRecords = 0;

  // Process files
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(CLEANED_SPLIT_DIR, files[i]);
    const result = await processFile(filePath, i + 1, files.length);

    if (result.success) {
      successCount++;
      totalRecords += result.recordCount;
    }
  }

  // Summary
  const totalDuration = ((Date.now() - startTime) / 60000).toFixed(1);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`${colors.bright}📊 SUBSET COMPLETE${colors.reset}`);
  console.log(`✅ Files: ${successCount}/${files.length}`);
  console.log(`📈 Records: ${totalRecords.toLocaleString()}`);
  console.log(`⏱️  Time: ${totalDuration} minutes`);
  console.log(
    `⚡ Rate: ${Math.round(totalRecords / (totalDuration * 60))} records/second`,
  );
}

// Run
if (!workerMode) {
  main().catch(console.error);
}

#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const readline = require("readline");

// Load env vars
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = 2000; // Much larger batches for speed
const CLEANED_SPLIT_DIR = path.join(process.cwd(), "CleanedSplit");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// Parse CSV efficiently
async function* readCSV(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream });

  let headers = null;
  let lineNumber = 0;

  for await (const line of rl) {
    lineNumber++;
    if (!line.trim()) continue;

    if (lineNumber === 1) {
      headers = line.split(",").map((h) => h.trim().toLowerCase());
      continue;
    }

    // Simple CSV parsing for speed
    const values = line.split(",").map((v) => {
      v = v.trim();
      if (v.startsWith('"') && v.endsWith('"')) {
        v = v.slice(1, -1);
      }
      return v === "" ? null : v;
    });

    const record = {};
    headers.forEach((h, i) => {
      record[h] = values[i];
    });

    yield record;
  }
}

async function importFile(filePath) {
  const fileName = path.basename(filePath);
  const fileSize = (fs.statSync(filePath).size / 1024 / 1024).toFixed(1);

  console.log(`\n📄 ${fileName} (${fileSize} MB)`);

  const startTime = Date.now();
  let batch = [];
  let totalRecords = 0;
  let batchCount = 0;

  try {
    for await (const record of readCSV(filePath)) {
      batch.push(record);
      totalRecords++;

      if (batch.length >= BATCH_SIZE) {
        batchCount++;
        process.stdout.write(
          `\r   Batch ${batchCount}: ${totalRecords} records...`,
        );

        const { error } = await supabase
          .from("florida_parcels_csv_import")
          .insert(batch);

        if (error) throw error;
        batch = [];
      }
    }

    // Final batch
    if (batch.length > 0) {
      batchCount++;
      await supabase.from("florida_parcels_csv_import").insert(batch);
    }

    // Transfer to main table
    console.log(`\n   🔄 Transferring to main table...`);
    await supabase.rpc("transfer_florida_parcels_staging");

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ✅ Success! ${totalRecords} records in ${duration}s`);

    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🚀 Fast Import for Remaining Files\n");

  const files = fs
    .readdirSync(CLEANED_SPLIT_DIR)
    .filter((f) => f.endsWith(".csv"))
    .sort();

  console.log(`📊 Found ${files.length} remaining CSV files`);
  console.log(`📦 Using batch size: ${BATCH_SIZE}\n`);

  const startTime = Date.now();
  let success = 0;

  for (let i = 0; i < files.length; i++) {
    console.log(`[${i + 1}/${files.length}]`);

    const filePath = path.join(CLEANED_SPLIT_DIR, files[i]);

    if (await importFile(filePath)) {
      success++;

      // Move file
      const importedDir = path.join(process.cwd(), "CleanedSplit_imported");
      if (!fs.existsSync(importedDir)) fs.mkdirSync(importedDir);
      fs.renameSync(filePath, path.join(importedDir, files[i]));
    }

    // ETA
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = (i + 1) / elapsed;
    const eta = (files.length - i - 1) / rate;
    console.log(`   ⏱️  ETA: ${Math.ceil(eta / 60)} minutes\n`);
  }

  const totalMin = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(
    `\n✅ Complete: ${success}/${files.length} files in ${totalMin} minutes`,
  );
}

main().catch(console.error);

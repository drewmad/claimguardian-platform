#!/usr/bin/env node

// Usage: node import-subset.js START END
// Example: node import-subset.js 0 25

const fs = require("fs");
const path = require("path");

// Get file range
const start = parseInt(process.argv[2]) || 0;
const end = parseInt(process.argv[3]) || 999;

console.log(`\n🚀 Processing files ${start} to ${end}\n`);

// Get files in range
const allFiles = fs
  .readdirSync("./CleanedSplit")
  .filter((f) => f.endsWith(".csv"))
  .sort();

const files = allFiles.slice(start, end);

console.log(
  `📊 Processing ${files.length} files from position ${start}-${end}\n`,
);

// Now run the import (using the fast import logic)
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

async function importFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(
    `[${process.argv[2]}-${process.argv[3]}] Processing ${fileName}...`,
  );

  try {
    // Read entire file
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    const records = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(",").map((v) => {
        v = v.trim();
        if (v.startsWith('"')) v = v.slice(1, -1);
        return v === "" ? null : v;
      });

      const record = {};
      headers.forEach((h, idx) => {
        record[h] = values[idx];
      });
      records.push(record);
    }

    // Upload in chunks of 3000
    const chunkSize = 3000;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      const { error } = await supabase
        .from("florida_parcels_csv_import")
        .insert(chunk);

      if (error) throw error;
      process.stdout.write(
        `\r   ${i + chunk.length}/${records.length} records`,
      );
    }

    // Transfer
    await supabase.rpc("transfer_florida_parcels_staging");
    console.log(` ✅`);

    // Move file
    const importedDir = "./CleanedSplit_imported";
    if (!fs.existsSync(importedDir)) fs.mkdirSync(importedDir);
    fs.renameSync(filePath, path.join(importedDir, fileName));

    return true;
  } catch (error) {
    console.error(` ❌ ${error.message}`);
    return false;
  }
}

// Process files
(async () => {
  let success = 0;
  for (const file of files) {
    if (await importFile(path.join("./CleanedSplit", file))) {
      success++;
    }
  }
  console.log(`\n✅ Subset complete: ${success}/${files.length} files`);
})();

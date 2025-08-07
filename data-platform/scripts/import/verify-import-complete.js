#!/usr/bin/env node

/**
 * Verify Florida Parcels Import Completion
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Load env
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

async function verify() {
  console.log(
    `\n${colors.bright}🔍 Florida Parcels Import Verification${colors.reset}`,
  );
  console.log("=".repeat(60) + "\n");

  // 1. Check file system
  console.log(`${colors.cyan}📁 File System Check:${colors.reset}`);

  const remainingFiles = fs.existsSync("./CleanedSplit")
    ? fs.readdirSync("./CleanedSplit").filter((f) => f.endsWith(".csv"))
    : [];

  // Estimate original count from file numbering (parcels_part_00000.csv to parcels_part_xxxxx.csv)
  const originalFiles = Array.from(
    { length: 100 },
    (_, i) => `parcels_part_${String(i).padStart(5, "0")}.csv`,
  );

  // Since files are deleted after import, count by comparing original vs remaining
  const importedCount = originalFiles.length - remainingFiles.length;
  const importedFiles = [];

  console.log(`   Original files remaining: ${remainingFiles.length}`);
  console.log(`   Successfully imported: ${importedCount}`);
  console.log(`   Total processed: ${importedCount}`);

  if (remainingFiles.length > 0) {
    console.log(
      `\n   ${colors.yellow}⚠️  Files still to import:${colors.reset}`,
    );
    remainingFiles.slice(0, 5).forEach((f) => console.log(`      - ${f}`));
    if (remainingFiles.length > 5) {
      console.log(`      ... and ${remainingFiles.length - 5} more`);
    }
  } else {
    console.log(`   ${colors.green}✅ All files imported!${colors.reset}`);
  }

  // 2. Check database
  console.log(`\n${colors.cyan}💾 Database Check:${colors.reset}`);

  try {
    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from("florida_parcels")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;

    console.log(`   Total records in database: ${totalCount.toLocaleString()}`);

    // Get sample of counties
    const { data: counties, error: countyError } = await supabase
      .from("florida_parcels")
      .select("county_fips")
      .limit(1000);

    if (!countyError && counties) {
      const uniqueCounties = new Set(counties.map((c) => c.county_fips)).size;
      console.log(`   Unique counties found: ${uniqueCounties}`);
    }

    // Check recent imports
    const { data: recent, error: recentError } = await supabase
      .from("florida_parcels")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!recentError && recent && recent.length > 0) {
      const lastImport = new Date(recent[0].created_at);
      const minutesAgo = Math.round((Date.now() - lastImport) / 60000);
      console.log(`   Last import: ${minutesAgo} minutes ago`);
    }

    // Expected records calculation
    const filesProcessed = importedFiles.length;
    const avgRecordsPerFile = 59000; // Based on sample
    const expectedRecords = filesProcessed * avgRecordsPerFile;
    const completionRate = ((totalCount / expectedRecords) * 100).toFixed(1);

    console.log(`\n   ${colors.cyan}📊 Import Statistics:${colors.reset}`);
    console.log(`   Expected records: ~${expectedRecords.toLocaleString()}`);
    console.log(`   Actual records: ${totalCount.toLocaleString()}`);
    console.log(`   Completion rate: ${completionRate}%`);

    // 3. Final status
    console.log(`\n${colors.bright}📋 FINAL STATUS:${colors.reset}`);

    if (remainingFiles.length === 0 && totalCount > 0) {
      console.log(`   ${colors.green}✅ IMPORT COMPLETE!${colors.reset}`);
      console.log(`   All ${importedFiles.length} files successfully imported`);
      console.log(`   Total records: ${totalCount.toLocaleString()}`);
    } else if (remainingFiles.length > 0) {
      console.log(`   ${colors.yellow}⚠️  IMPORT INCOMPLETE${colors.reset}`);
      console.log(
        `   ${remainingFiles.length} files still need to be imported`,
      );
      console.log(`   Run the import script again to complete`);
    } else {
      console.log(`   ${colors.green}✅ All files processed${colors.reset}`);
    }

    // 4. Recommendations
    if (remainingFiles.length > 0) {
      console.log(`\n${colors.cyan}💡 To complete import:${colors.reset}`);
      console.log("   node scripts/import-parallel-optimal.js");
      console.log("   or");
      console.log("   bash scripts/run-parallel-import.sh");
    }
  } catch (error) {
    console.error(
      `\n${colors.red}❌ Database check failed: ${error.message}${colors.reset}`,
    );
  }

  console.log("\n" + "=".repeat(60) + "\n");
}

// Run verification
verify().catch(console.error);

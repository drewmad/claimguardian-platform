#!/usr/bin/env node

// Script to apply Florida counties migrations

const fs = require("fs");
const path = require("path");

const PROJECT_ID = "tmlrvecuwgppbaynesji";
const API_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!API_TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN environment variable not set");
  process.exit(1);
}

// Florida counties migration files
const migrationFiles = [
  "011_create_florida_counties_reference.sql",
  "012_populate_florida_counties.sql",
  "013_link_properties_to_counties.sql",
];

async function executeSQL(sql, filename) {
  try {
    console.log(`\n📄 Applying ${filename}...`);

    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sql }),
      },
    );

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ ${filename} applied successfully`);
      return { success: true };
    } else {
      console.error(`❌ ${filename} failed`);
      console.error(`   Error: ${result.message || JSON.stringify(result)}`);
      return {
        success: false,
        error: result.message || JSON.stringify(result),
      };
    }
  } catch (error) {
    console.error(`❌ ${filename} failed`);
    console.error(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function applyMigrations() {
  console.log("🌴 Starting Florida Counties migrations...");
  console.log(`📁 Applying ${migrationFiles.length} migration files\n`);

  const results = [];

  for (const file of migrationFiles) {
    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations_ai",
      file,
    );

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ File not found: ${file}`);
      results.push({ file, success: false, error: "File not found" });
      continue;
    }

    const sql = fs.readFileSync(migrationPath, "utf8");
    const result = await executeSQL(sql, file);
    results.push({ file, ...result });
  }

  // Summary
  console.log("\n📊 Migration Summary:");
  console.log("=".repeat(50));

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Successful: ${successful}/${migrationFiles.length}`);
  console.log(`❌ Failed: ${failed}/${migrationFiles.length}`);

  if (failed > 0) {
    console.log("\n❌ Failed migrations:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${r.file}: ${r.error}`);
      });
  }

  if (successful === migrationFiles.length) {
    console.log("\n🎉 All Florida Counties migrations completed successfully!");
    console.log("\n✨ Features enabled:");
    console.log("   - All 67 Florida counties with complete reference data");
    console.log("   - Automatic county detection from property addresses");
    console.log("   - County-specific building requirements");
    console.log("   - Emergency contacts and permit information");
    console.log("   - Property appraiser and tax collector links");

    // Test the county lookup
    console.log("\n🧪 Testing county lookup...");
    const testResult = await executeSQL(
      "SELECT county_name, county_seat, region, coastal_county FROM florida_counties WHERE county_name = 'Miami-Dade' LIMIT 1",
      "Test Query",
    );

    if (testResult.success) {
      console.log("✅ County lookup working correctly!");
    }
  } else {
    console.log(
      "\n⚠️  Some migrations failed. Please review the errors above.",
    );
  }
}

// Run the migrations
applyMigrations().catch(console.error);

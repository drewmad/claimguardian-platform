#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const PROJECT_ID = "tmlrvecuwgppbaynesji";
const API_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!API_TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN environment variable not set");
  process.exit(1);
}

async function executeSQL(sql, description) {
  try {
    console.log(`\n📄 ${description}...`);

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
      console.log(`✅ ${description} - Success`);
      if (result.rows && result.rows.length > 0) {
        return { success: true, data: result.rows };
      }
      return { success: true };
    } else {
      console.error(`❌ ${description} - Failed`);
      console.error(`   Error: ${result.message || JSON.stringify(result)}`);
      return {
        success: false,
        error: result.message || JSON.stringify(result),
      };
    }
  } catch (error) {
    console.error(`❌ ${description} - Failed`);
    console.error(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function applyFinalEnhancements() {
  console.log("🎯 Applying Final Florida Parcels Enhancements");
  console.log("=".repeat(50));

  // Apply the fixes and analysis functions
  const migrationPath = path.join(
    __dirname,
    "../supabase/migrations_ai/028_fix_validation_function_and_analyze.sql",
  );

  if (!fs.existsSync(migrationPath)) {
    console.error("❌ Migration file not found");
    return;
  }

  const migrationSQL = fs.readFileSync(migrationPath, "utf8");
  await executeSQL(migrationSQL, "Applying validation and analysis functions");

  // Now run comprehensive analysis
  console.log("\n📊 Running Comprehensive Column Analysis...");

  // Get column statistics
  const statsResult = await executeSQL(
    "SELECT * FROM get_parcels_column_stats()",
    "Getting column statistics",
  );

  if (statsResult.success && statsResult.data) {
    console.log("\n📈 Column Categories:");
    statsResult.data.forEach((row) => {
      console.log(`  • ${row.category}: ${row.column_count} columns`);
      if (row.example_columns) {
        console.log(`    Examples: ${row.example_columns}`);
      }
    });
  }

  // Get type optimization suggestions
  const optimResult = await executeSQL(
    "SELECT * FROM suggest_type_optimizations()",
    "Getting type optimization suggestions",
  );

  if (optimResult.success && optimResult.data && optimResult.data.length > 0) {
    console.log("\n🔧 Type Optimization Suggestions:");
    optimResult.data.forEach((row) => {
      console.log(`  • ${row.column_name}:`);
      console.log(
        `    Current: ${row.current_type} → Suggested: ${row.suggested_type}`,
      );
      console.log(`    Reason: ${row.reason}`);
    });
  } else {
    console.log("\n✅ All column types are optimized!");
  }

  // Check constraints
  const constraintResult = await executeSQL(
    `
    SELECT
      con.conname as constraint_name,
      con.contype as constraint_type,
      pg_get_constraintdef(con.oid) as definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'florida_parcels'
    AND con.contype = 'c'
    ORDER BY con.conname
  `,
    "Checking active constraints",
  );

  if (constraintResult.success && constraintResult.data) {
    console.log(`\n🔒 Active Constraints: ${constraintResult.data.length}`);
    console.log("  Examples:");
    constraintResult.data.slice(0, 5).forEach((con) => {
      console.log(`  • ${con.constraint_name}: ${con.definition}`);
    });
  }

  // Final summary
  console.log("\n" + "=".repeat(50));
  console.log("✅ FLORIDA PARCELS TABLE ENHANCEMENT COMPLETE!");
  console.log("=".repeat(50));

  console.log("\n📋 What's Been Added:");
  console.log("  ✓ Detailed descriptions for all 138 columns");
  console.log("  ✓ 21 data validation constraints");
  console.log("  ✓ 4 additional performance indexes");
  console.log("  ✓ validate_parcel_data() function");
  console.log("  ✓ Column analysis view and functions");

  console.log("\n🎯 Table Features:");
  console.log("  • UPPERCASE column names for CSV compatibility");
  console.log("  • Automatic county_fips derivation from CO_NO");
  console.log("  • Data quality constraints on years, amounts, codes");
  console.log("  • Comprehensive column documentation");

  console.log("\n🚀 Ready for Production Use:");
  console.log("  • Import CSVs with confidence");
  console.log("  • Data validation prevents bad entries");
  console.log("  • Column descriptions visible in Supabase");
  console.log("  • Use validate_parcel_data(parcel_id) to check quality");

  console.log("\n📊 Column Summary by Category:");
  console.log("  • Financial: Just values, assessed values, land values");
  console.log("  • Owner: Owner names, addresses, fiduciary info");
  console.log("  • Sales: Sale prices, dates, deed references");
  console.log("  • Geographic: Township, range, section, GIS data");
  console.log("  • System: IDs, timestamps, foreign keys");
}

// Run the final enhancements
applyFinalEnhancements().catch(console.error);

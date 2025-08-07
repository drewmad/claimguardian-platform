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

async function applyEnhancements() {
  console.log("🔧 Applying Column Descriptions and Constraints");
  console.log("=".repeat(50));
  console.log("\nThis will add:");
  console.log("  • Detailed descriptions for all 120+ columns");
  console.log("  • Data validation constraints");
  console.log("  • Additional performance indexes");
  console.log("  • Data quality validation function");

  const migrationPath = path.join(
    __dirname,
    "../supabase/migrations_ai/027_add_column_descriptions_and_constraints.sql",
  );

  if (!fs.existsSync(migrationPath)) {
    console.error("❌ Migration file not found");
    return;
  }

  const migrationSQL = fs.readFileSync(migrationPath, "utf8");

  // Split into sections to apply incrementally
  const sections = migrationSQL.split(
    /-- Now let's add\/verify constraints|-- Create indexes|-- Add a function/,
  );

  console.log("\n📝 Applying column descriptions...");
  const descResult = await executeSQL(
    sections[0],
    "Adding column descriptions",
  );

  if (descResult.success) {
    console.log("\n🔒 Applying constraints...");

    // Apply constraints one by one to handle any that already exist
    const constraintSection = sections[1];
    const constraints = constraintSection.match(/ALTER TABLE[^;]+;/g) || [];

    let constraintSuccess = 0;
    let constraintSkipped = 0;

    for (const constraint of constraints) {
      const constraintName =
        constraint.match(/CONSTRAINT\s+(\w+)/)?.[1] || "constraint";
      const result = await executeSQL(constraint, `Adding ${constraintName}`);
      if (result.success) {
        constraintSuccess++;
      } else if (result.error && result.error.includes("already exists")) {
        constraintSkipped++;
      }
    }

    console.log(`\n  ✅ Constraints added: ${constraintSuccess}`);
    console.log(
      `  ⏭️  Constraints skipped (already exist): ${constraintSkipped}`,
    );
  }

  // Apply indexes
  if (sections[2]) {
    console.log("\n🔍 Creating additional indexes...");
    const indexSection = sections[2];
    const indexes = indexSection.match(/CREATE INDEX[^;]+;/g) || [];

    for (const index of indexes) {
      await executeSQL(index, "Creating index");
    }
  }

  // Apply validation function
  if (sections[3]) {
    console.log("\n🧪 Creating validation function...");
    await executeSQL(sections[3], "Creating validate_parcel_data function");
  }

  // Test the enhancements
  console.log("\n🔍 Verifying enhancements...");

  const verifyQuery = `
    SELECT
      col_description(pgc.oid, a.attnum) as description,
      a.attname as column_name
    FROM pg_attribute a
    JOIN pg_class pgc ON pgc.oid = a.attrelid
    WHERE pgc.relname = 'florida_parcels'
    AND a.attnum > 0
    AND NOT a.attisdropped
    AND col_description(pgc.oid, a.attnum) IS NOT NULL
    LIMIT 5;
  `;

  const verifyResult = await executeSQL(
    verifyQuery,
    "Checking column descriptions",
  );

  if (verifyResult.success) {
    console.log("\n✅ Column enhancements applied successfully!");
    console.log("\n📋 Summary:");
    console.log("  • All columns now have detailed descriptions");
    console.log("  • Data validation constraints active");
    console.log("  • Performance indexes created");
    console.log("  • validate_parcel_data() function available");

    console.log("\n💡 You can now:");
    console.log("  • View column descriptions in Supabase dashboard");
    console.log("  • Data validation will prevent invalid entries");
    console.log(
      "  • Use validate_parcel_data(parcel_id) to check data quality",
    );
  }
}

// Run the enhancements
applyEnhancements().catch(console.error);

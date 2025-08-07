#!/usr/bin/env node

/**
 * Apply the florida_parcels missing columns migration
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executeSql(sql) {
  const { data, error } = await supabase.rpc("exec_sql", {
    sql_query: sql,
  });

  if (error) {
    // Try alternative method
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql_query: sql }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SQL execution failed: ${errorText}`);
    }

    return await response.json();
  }

  return { data, error };
}

async function applyMigration() {
  try {
    console.log("Reading florida_parcels columns migration...");
    const migrationPath = path.join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "20250725_add_missing_florida_parcels_columns.sql",
    );
    const sqlContent = fs.readFileSync(migrationPath, "utf8");

    // Split by major SQL commands (ALTER TABLE, CREATE/DROP VIEW, CREATE OR REPLACE FUNCTION)
    const statements = [];

    // Extract ALTER TABLE statements
    const alterMatches = sqlContent.match(/ALTER TABLE[^;]+;/gs);
    if (alterMatches) statements.push(...alterMatches);

    // Extract CREATE INDEX statements
    const indexMatches = sqlContent.match(/CREATE INDEX[^;]+;/gs);
    if (indexMatches) statements.push(...indexMatches);

    // Extract COMMENT ON statements
    const commentMatches = sqlContent.match(/COMMENT ON[^;]+;/gs);
    if (commentMatches) statements.push(...commentMatches);

    // Extract DROP VIEW statement
    const dropViewMatch = sqlContent.match(/DROP VIEW[^;]+;/gs);
    if (dropViewMatch) statements.push(...dropViewMatch);

    // Extract CREATE VIEW statement (until the FROM clause)
    const createViewMatch = sqlContent.match(
      /CREATE VIEW[\s\S]+?FROM florida_parcels_staging;/g,
    );
    if (createViewMatch) statements.push(...createViewMatch);

    // Extract CREATE OR REPLACE FUNCTION (full function including $$ blocks)
    const functionMatch = sqlContent.match(
      /CREATE OR REPLACE FUNCTION[\s\S]+?\$\$ LANGUAGE plpgsql;/g,
    );
    if (functionMatch) statements.push(...functionMatch);

    console.log(`Found ${statements.length} SQL operations to execute`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();

      // Get operation type for logging
      const operationType =
        statement.match(
          /^(ALTER TABLE|CREATE INDEX|COMMENT ON|DROP VIEW|CREATE VIEW|CREATE OR REPLACE FUNCTION)/i,
        )?.[1] || "SQL";
      console.log(
        `\n[${i + 1}/${statements.length}] Executing ${operationType}...`,
      );

      try {
        await executeSql(statement);
        successCount++;
        console.log(`  ✓ Success`);
      } catch (error) {
        errorCount++;
        errors.push({
          operation: operationType,
          error: error.message,
        });
        console.error(`  ✗ Error: ${error.message}`);
      }
    }

    console.log("\n=== Migration Summary ===");
    console.log(`Total operations: ${statements.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${errorCount}`);

    if (errors.length > 0) {
      console.log("\n=== Errors ===");
      errors.forEach((err, index) => {
        console.log(`\n${index + 1}. Operation: ${err.operation}`);
        console.log(`   Error: ${err.error}`);
      });
    }

    if (errorCount === 0) {
      console.log(
        "\n✅ Florida parcels columns migration applied successfully!",
      );
      console.log("\nYour CSV import should now accept all required headers.");
    } else {
      console.log("\n⚠️  Migration completed with some errors.");
      console.log(
        "The errors might be due to columns already existing. You can verify the table structure in Supabase.",
      );
    }
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();

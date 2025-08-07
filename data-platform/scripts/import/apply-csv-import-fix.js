#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing required environment variables:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL");
  console.error("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applyMigration() {
  console.log("🔧 Applying CSV Import Fix for florida_parcels table...\n");

  try {
    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "..",
      "supabase",
      "migrations_ai",
      "029_fix_florida_parcels_csv_import.sql",
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    console.log("📝 Executing migration...");

    // Execute the migration
    const { data, error } = await supabase.rpc("execute_sql", {
      sql_query: sql,
    });

    if (error) {
      // If execute_sql doesn't exist, try direct execution
      const statements = sql.split(";").filter((s) => s.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          console.log("  Executing statement...");
          const { error: stmtError } = await supabase.rpc("query", {
            query_text: statement + ";",
          });

          if (stmtError) {
            throw stmtError;
          }
        }
      }
    }

    console.log("✅ Migration applied successfully!\n");

    console.log("📋 Instructions for CSV Upload:");
    console.log("1. Go to your Supabase dashboard");
    console.log("2. Navigate to Table Editor");
    console.log('3. Select the "florida_parcels_import" VIEW (not the table)');
    console.log('4. Click "Import data from CSV"');
    console.log("5. Upload your CSV file with uppercase column headers");
    console.log(
      "6. The import will automatically handle empty strings in numeric columns\n",
    );

    console.log("🎯 The following happens automatically:");
    console.log(
      '- Empty strings (" ") in numeric columns are converted to NULL',
    );
    console.log(
      "- Uppercase CSV headers are mapped to lowercase database columns",
    );
    console.log(
      "- Duplicate parcel_ids are updated instead of causing errors\n",
    );
  } catch (error) {
    console.error("❌ Error applying migration:", error.message);

    console.log("\n📋 Manual Application Instructions:");
    console.log(
      "1. Copy the contents of: supabase/migrations_ai/029_fix_florida_parcels_csv_import.sql",
    );
    console.log("2. Go to your Supabase SQL Editor");
    console.log("3. Paste and run the SQL");
    console.log(
      '4. Then use the "florida_parcels_import" view for CSV uploads\n',
    );

    process.exit(1);
  }
}

// Run the migration
applyMigration().then(() => {
  console.log(
    "✨ Done! You can now upload your CSV through the Supabase dashboard.",
  );
  process.exit(0);
});

#!/usr/bin/env node

// Script to apply AI foundation migrations sequentially

const fs = require("fs");
const path = require("path");

const PROJECT_ID = "tmlrvecuwgppbaynesji";
const API_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!API_TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN environment variable not set");
  process.exit(1);
}

// Migration files in order
const migrationFiles = [
  "001_enable_extensions.sql",
  "002_create_ai_models_table.sql",
  "003_create_ai_analyses_table.sql",
  "004_enhance_existing_tables.sql",
  "005_create_ai_insights_tables.sql",
  "006_create_document_ai_tables.sql",
  "007_create_conversations_feedback.sql",
  "008_create_ai_functions.sql",
  "009_create_triggers_policies.sql",
  "010_seed_ai_models.sql",
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
  console.log("🚀 Starting AI foundation migrations...");
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

    // Stop on critical errors
    if (!result.success && file.startsWith("00")) {
      console.error("\n⛔ Critical migration failed. Stopping execution.");
      break;
    }
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
    console.log("\n🎉 All AI foundation migrations completed successfully!");
    console.log("\n✨ Next steps:");
    console.log(
      "   1. Test vector similarity search with find_similar_properties()",
    );
    console.log("   2. Start generating embeddings for existing data");
    console.log("   3. Implement AI analysis pipelines");
    console.log("   4. Build AI-powered features");
  } else {
    console.log(
      "\n⚠️  Some migrations failed. Please review the errors above.",
    );
  }
}

// Run the migrations
applyMigrations().catch(console.error);

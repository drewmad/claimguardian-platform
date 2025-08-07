import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

console.log("🔗 Connecting to Supabase...");
console.log(`URL: ${supabaseUrl}`);

// SQL statements to execute
const migrations = [
  {
    name: "Create scraper_logs table",
    file: "../supabase/migrations/20250717009_fix_scraper_logs_table.sql",
  },
  {
    name: "Fix claims_overview security",
    file: "../supabase/migrations/20250717010_fix_claims_overview_security.sql",
  },
];

async function executeSQLFile(filePath, description) {
  try {
    const sql = fs.readFileSync(path.join(__dirname, filePath), "utf8");
    console.log(`\n📝 Executing: ${description}`);
    console.log(`File: ${filePath}`);

    // Execute via direct PostgreSQL connection
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Failed: ${error}`);
      return false;
    }

    console.log(`✅ Success: ${description}`);
    return true;
  } catch (error) {
    console.error(`❌ Error executing ${description}:`, error.message);
    return false;
  }
}

async function main() {
  console.log("🚀 Starting critical fixes...\n");

  // First, let's check if scraper_logs table exists
  console.log("🔍 Checking if scraper_logs table exists...");
  const checkResponse = await fetch(
    `${supabaseUrl}/rest/v1/scraper_logs?limit=1`,
    {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
    },
  );

  if (checkResponse.status === 404) {
    console.log("❌ Table scraper_logs does not exist");
    console.log("\n⚠️  MANUAL ACTION REQUIRED:");
    console.log("====================================");
    console.log("Please execute the following SQL in your Supabase dashboard:");
    console.log(
      "1. Go to https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql/new",
    );
    console.log("2. Copy and paste the contents of:");
    console.log(
      "   - supabase/migrations/20250717009_fix_scraper_logs_table.sql",
    );
    console.log(
      "   - supabase/migrations/20250717010_fix_claims_overview_security.sql",
    );
    console.log("3. Execute each one separately");
    console.log("====================================\n");

    // Output the SQL for easy copying
    console.log("\n--- SCRAPER LOGS TABLE SQL ---");
    const scraperLogsSql = fs.readFileSync(
      path.join(
        __dirname,
        "../supabase/migrations/20250717009_fix_scraper_logs_table.sql",
      ),
      "utf8",
    );
    console.log(scraperLogsSql);

    console.log("\n--- CLAIMS OVERVIEW SECURITY FIX SQL ---");
    const claimsSecuritySql = fs.readFileSync(
      path.join(
        __dirname,
        "../supabase/migrations/20250717010_fix_claims_overview_security.sql",
      ),
      "utf8",
    );
    console.log(claimsSecuritySql);
  } else if (checkResponse.ok) {
    console.log("✅ Table scraper_logs already exists");

    // Test inserting a log entry
    console.log("\n🧪 Testing scraper_logs table...");
    const testResponse = await fetch(`${supabaseUrl}/rest/v1/scraper_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        source: "fix-script",
        level: "INFO",
        message: "Test entry from fix script",
        metadata: { timestamp: new Date().toISOString() },
      }),
    });

    if (testResponse.ok) {
      const result = await testResponse.json();
      console.log("✅ Successfully inserted test entry:", result);
    } else {
      console.error(
        "❌ Failed to insert test entry:",
        await testResponse.text(),
      );
    }
  }

  console.log("\n✅ Fix script completed!");
  console.log("\n📋 Next steps:");
  console.log("1. If tables were created manually, run: supabase db pull");
  console.log("2. Test your scraper endpoints");
  console.log(
    "3. Check Supabase dashboard for any remaining security warnings",
  );
}

main().catch(console.error);

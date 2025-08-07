#!/usr/bin/env node

/**
 * Deploy property schema using direct HTTP requests
 * This avoids dependency issues and works from the project root
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const { URL } = require("url");

// Read environment variables
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing required environment variables");
  console.error("   Please ensure .env.local contains:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Parse Supabase URL
const supabaseUrl = new URL(SUPABASE_URL);

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: supabaseUrl.hostname,
      port: 443,
      path: "/rest/v1/rpc/query",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve({ success: true, data: responseData });
        } else {
          resolve({
            success: false,
            error: responseData,
            status: res.statusCode,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log("🚀 Property Schema Deployment\n");

  // Read schema file
  const schemaPath = path.join(
    __dirname,
    "..",
    "supabase",
    "migrations",
    "20250724_complete_property_schema.sql",
  );

  if (!fs.existsSync(schemaPath)) {
    console.error("❌ Schema file not found:", schemaPath);
    process.exit(1);
  }

  console.log("📄 Reading schema file...");
  const schemaContent = fs.readFileSync(schemaPath, "utf8");
  console.log(
    `📏 Schema size: ${(schemaContent.length / 1024).toFixed(2)} KB\n`,
  );

  // Since we can't execute the full schema via HTTP easily,
  // provide instructions for manual execution
  console.log("📋 Manual Deployment Instructions:");
  console.log("=".repeat(50));
  console.log("\n1. Open Supabase SQL Editor:");
  console.log(
    `   ${SUPABASE_URL.replace("/rest/v1", "")}/project/${supabaseUrl.hostname.split(".")[0]}/editor\n`,
  );

  console.log("2. Copy the schema file content from:");
  console.log(`   ${schemaPath}\n`);

  console.log('3. Paste into SQL editor and click "Run"\n');

  console.log("4. Verify deployment with these queries:\n");

  const verificationQueries = [
    "-- Check tables\nSELECT table_name FROM information_schema.tables WHERE table_name LIKE 'property%';",
    "-- Check RLS\nSELECT tablename, rowsecurity FROM pg_tables WHERE tablename LIKE 'property%';",
    "-- Check types\nSELECT typname FROM pg_type WHERE typname IN ('property_type', 'occupancy_status');",
  ];

  verificationQueries.forEach((query, idx) => {
    console.log(`Query ${idx + 1}:`);
    console.log(query);
    console.log();
  });

  // Save schema to clipboard if possible
  try {
    const { execSync } = require("child_process");
    execSync(`cat "${schemaPath}" | pbcopy`, { stdio: "ignore" });
    console.log("✅ Schema copied to clipboard!\n");
  } catch (e) {
    // Clipboard copy failed, ignore
  }

  // Try to open the Supabase dashboard
  const dashboardUrl = `${SUPABASE_URL.replace("/rest/v1", "")}/project/${supabaseUrl.hostname.split(".")[0]}/editor`;
  console.log("🌐 Opening Supabase dashboard...");
  console.log(`   ${dashboardUrl}\n`);

  try {
    const { execSync } = require("child_process");
    execSync(`open "${dashboardUrl}"`, { stdio: "ignore" });
  } catch (e) {
    console.log("   (Please open the URL manually)");
  }
}

main().catch(console.error);

#!/usr/bin/env node

/**
 * Fast property schema verification using SQL query
 */

const https = require("https");
const { URL } = require("url");
const fs = require("fs");
const path = require("path");

// Load environment variables
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value && !key.startsWith("#")) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

async function verifySchema() {
  console.log("🔍 Property Schema Verification\n");

  // SQL queries to check schema
  const checks = [
    {
      name: "Property Tables",
      query: `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE 'property%'
        ORDER BY table_name
      `,
      expected: 13,
    },
    {
      name: "Enum Types",
      query: `
        SELECT typname
        FROM pg_type
        WHERE typname IN ('property_type', 'occupancy_status', 'damage_severity', 'claim_status')
        ORDER BY typname
      `,
      expected: 4,
    },
    {
      name: "RLS Enabled",
      query: `
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename LIKE 'property%'
        AND rowsecurity = true
        ORDER BY tablename
      `,
      expected: 8,
    },
    {
      name: "History Tables",
      query: `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE 'property%_history'
        ORDER BY table_name
      `,
      expected: 5,
    },
  ];

  console.log("Running verification checks...\n");

  let allPassed = true;

  for (const check of checks) {
    console.log(`📋 ${check.name}:`);
    console.log(`Expected: ${check.expected} | Query to run:\n`);
    console.log(check.query.trim());
    console.log("\n" + "-".repeat(50) + "\n");
  }

  // Since we can't execute queries directly, provide manual verification
  console.log("📝 Manual Verification Steps:\n");
  console.log("1. Copy each query above into Supabase SQL Editor");
  console.log("2. Run and check the row count matches expected");
  console.log("3. If all counts match, schema is fully deployed\n");

  // Quick check using REST API for properties table
  try {
    const url = new URL(SUPABASE_URL);
    const checkUrl = `${SUPABASE_URL}/rest/v1/properties?select=count&limit=1`;

    console.log("🔍 Quick check for properties table...");

    const response = await new Promise((resolve, reject) => {
      https
        .get(
          checkUrl,
          {
            headers: {
              apikey: SUPABASE_SERVICE_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
          },
          (res) => {
            if (res.statusCode === 200) {
              resolve({ exists: true });
            } else if (res.statusCode === 404 || res.statusCode === 400) {
              resolve({ exists: false, status: res.statusCode });
            } else {
              resolve({ exists: false, status: res.statusCode });
            }
          },
        )
        .on("error", (err) => {
          reject(err);
        });
    });

    if (response.exists) {
      console.log("✅ Properties table exists!\n");
    } else {
      console.log(
        "❌ Properties table not found (status: " + response.status + ")\n",
      );
    }
  } catch (error) {
    console.log("❌ Error checking properties table:", error.message, "\n");
  }

  // Expected schema summary
  console.log("📊 Expected Schema Summary:");
  console.log("─".repeat(50));
  console.log("Core Tables (8):");
  console.log("  • properties");
  console.log("  • property_land");
  console.log("  • property_structures");
  console.log("  • property_systems");
  console.log("  • property_insurance");
  console.log("  • property_claims");
  console.log("  • property_damage");
  console.log("  • property_contractors\n");

  console.log("History Tables (5):");
  console.log("  • properties_history");
  console.log("  • property_land_history");
  console.log("  • property_structures_history");
  console.log("  • property_insurance_history");
  console.log("  • property_claims_history\n");

  console.log("Enum Types (4):");
  console.log("  • property_type");
  console.log("  • occupancy_status");
  console.log("  • damage_severity");
  console.log("  • claim_status\n");
}

verifySchema().catch(console.error);

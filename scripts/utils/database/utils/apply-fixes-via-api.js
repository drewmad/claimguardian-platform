const https = require("https");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
  process.exit(1);
}

// Read the SQL file
const sqlContent = fs.readFileSync(
  path.join(__dirname, "..", "fix-database.sql"),
  "utf8",
);

// Function to execute SQL via Supabase API
async function executeSql(sql) {
  const url = new URL("/rest/v1/rpc/exec_sql", SUPABASE_URL);

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  };

  const data = JSON.stringify({ query: sql });

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          resolve({ success: true, data: body });
        } else {
          reject({ success: false, status: res.statusCode, error: body });
        }
      });
    });

    req.on("error", (e) => {
      reject({ success: false, error: e.message });
    });

    req.write(data);
    req.end();
  });
}

// Alternative: Use direct database connection
async function applyFixesDirectly() {
  console.log("Attempting to apply database fixes...\n");

  // Split SQL into individual statements
  const statements = sqlContent
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => s + ";");

  console.log(`Found ${statements.length} SQL statements to execute.\n`);

  // Since we can't execute raw SQL via the API without a special function,
  // let's use the Supabase client library instead
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Test if scraper_logs exists
  console.log("Testing current state...");
  const { data: testData, error: testError } = await supabase
    .from("scraper_logs")
    .select("id")
    .limit(1);

  if (testError && testError.code === "42P01") {
    console.log("❌ Table scraper_logs does not exist\n");

    console.log("Creating the table using individual API calls...\n");

    // Since we can't execute raw DDL, we need to use Supabase's migration system
    // or execute via the dashboard
    console.log("⚠️  Direct SQL execution is not available via the API.");
    console.log("\nPlease use one of these methods:\n");
    console.log("Option 1: Supabase Dashboard");
    console.log(
      "1. Go to: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql/new",
    );
    console.log("2. Copy and paste the contents of fix-database.sql");
    console.log('3. Click "Run"\n');

    console.log("Option 2: Supabase CLI with direct connection");
    console.log('Run: psql "$DATABASE_URL" -f fix-database.sql\n');

    console.log("The DATABASE_URL would be:");
    console.log(
      "postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres",
    );
  } else if (!testError) {
    console.log("✅ Table scraper_logs already exists!\n");

    // Test inserting a record
    const { data: insertData, error: insertError } = await supabase
      .from("scraper_logs")
      .insert({
        source: "fix-script",
        level: "INFO",
        message: "Test from Node.js fix script",
        metadata: { timestamp: new Date().toISOString() },
      })
      .select();

    if (!insertError) {
      console.log("✅ Successfully inserted test record:", insertData);
    } else {
      console.log("❌ Failed to insert test record:", insertError);
    }
  } else {
    console.log("❌ Unexpected error:", testError);
  }
}

// Run the script
applyFixesDirectly().catch(console.error);

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [key, ...value] = line.split("=");
  if (key && value.length) {
    env[key.trim()] = value.join("=").trim();
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
  process.exit(1);
}

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https:\/\/(.+?)\.supabase\.co/)[1];
console.log("Project Reference:", projectRef);

// Read SQL file
const sqlContent = fs.readFileSync(
  path.join(__dirname, "..", "fix-database.sql"),
  "utf8",
);

// Function to execute SQL using pg protocol
async function executeSqlDirectly() {
  // For direct SQL execution, we need to use the connection string
  // However, we need the database password which is different from the service role key

  console.log("\n⚠️  Direct SQL execution requires database password\n");
  console.log("To apply the fixes, you have several options:\n");

  console.log("Option 1: Use Supabase Dashboard (Recommended)");
  console.log("=========================================");
  console.log(
    "1. Go to: https://supabase.com/dashboard/project/" +
      projectRef +
      "/sql/new",
  );
  console.log("2. Copy and paste the contents of fix-database.sql");
  console.log('3. Click "Run"\n');

  console.log("Option 2: Use Supabase CLI");
  console.log("==========================");
  console.log("1. Get your database password from:");
  console.log(
    "   https://supabase.com/dashboard/project/" +
      projectRef +
      "/settings/database",
  );
  console.log(
    "2. Run: PGPASSWORD=<your-db-password> psql -h db." +
      projectRef +
      ".supabase.co -U postgres -d postgres -f fix-database.sql\n",
  );

  console.log("Option 3: Create a database function");
  console.log("====================================");
  console.log("We can create a temporary function to execute the SQL...\n");

  // Try to create a function that we can call via RPC
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION apply_critical_fixes()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      ${sqlContent.replace(/\$/g, "\\$")}
    END;
    $$;
  `;

  console.log("Creating temporary function to apply fixes...");

  // We still can't execute this without direct DB access
  console.log("\n❌ Cannot execute DDL statements via REST API\n");

  // Final attempt - check if we can at least verify the current state
  console.log("Checking current database state...\n");

  const response = await fetch(`${SUPABASE_URL}/rest/v1/scraper_logs?limit=1`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });

  if (response.status === 404) {
    console.log("❌ scraper_logs table does not exist");
    console.log("\nPlease use Option 1 above to create it.");
  } else if (response.ok) {
    console.log("✅ scraper_logs table already exists!");

    // Test insert
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/scraper_logs`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        source: "api-test",
        level: "INFO",
        message: "Test from execute-sql-via-api script",
        metadata: { test: true },
      }),
    });

    if (insertResponse.status === 201) {
      const data = await insertResponse.json();
      console.log("✅ Successfully inserted test record:", data);
    } else {
      console.log("❌ Failed to insert test record:", insertResponse.status);
    }
  }

  // Also check claims_overview
  console.log("\nChecking claims_overview...");
  const claimsResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/claims_overview?limit=1`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    },
  );

  if (claimsResponse.ok) {
    console.log("✅ claims_overview is accessible");

    // Check if it still has the security issue by looking at columns
    const headResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/claims_overview?limit=0`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          Prefer: "count=exact",
        },
      },
    );

    // Try to detect if user_email column exists (which would indicate the security issue)
    console.log("   Note: Cannot verify if security fix is applied via API");
  } else {
    console.log("❌ claims_overview not accessible:", claimsResponse.status);
  }
}

executeSqlDirectly().catch(console.error);

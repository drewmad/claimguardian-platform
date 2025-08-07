import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tmlrvecuwgppbaynesji.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

const inventoryMigrations = [
  "20250717013_create_inventory_items.sql",
  "20250717014_create_inventory_documents.sql",
  "20250717015_create_inventory_import_batches.sql",
];

async function applyMigrations() {
  console.log("Applying inventory migrations...");

  for (const migrationFile of inventoryMigrations) {
    const migrationPath = path.join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      migrationFile,
    );

    try {
      const migrationSQL = await fs.readFile(migrationPath, "utf-8");

      console.log(`\nApplying migration: ${migrationFile}`);

      const { error } = await supabase
        .rpc("exec_sql", {
          sql: migrationSQL,
        })
        .catch(async (rpcError) => {
          console.log("RPC exec_sql not available, trying direct query...");

          const statements = migrationSQL
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s.length > 0 && !s.startsWith("--"));

          for (const statement of statements) {
            const { error } = await supabase
              .from("_migrations")
              .select("*")
              .limit(1);

            if (!error) {
              console.log("Executing statement...");
              const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: supabaseServiceKey,
                  Authorization: `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  query: statement,
                }),
              });

              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to execute: ${errorText}`);
              }
            }
          }

          return { error: null };
        });

      if (error) {
        console.error(`Error applying ${migrationFile}:`, error);

        console.log("\nTrying alternative approach with smaller chunks...");
        const statements = migrationSQL
          .split(/;\s*(?=CREATE|ALTER|INSERT|DROP|GRANT|COMMENT)/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        for (let i = 0; i < statements.length; i++) {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);

          try {
            await executeSQLViaAPI(statements[i] + ";");
          } catch (stmtError) {
            console.error(`Failed statement ${i + 1}:`, stmtError.message);
          }
        }
      } else {
        console.log(`✓ Successfully applied ${migrationFile}`);
      }
    } catch (error) {
      console.error(`Failed to read or apply ${migrationFile}:`, error);
    }
  }

  console.log("\nMigration process completed!");

  console.log("\nVerifying tables...");
  const { data: tables, error: tablesError } = await supabase
    .from("information_schema.tables")
    .select("table_name")
    .in("table_name", [
      "inventory_items",
      "inventory_documents",
      "inventory_import_batches",
    ])
    .eq("table_schema", "public");

  if (tablesError) {
    console.error("Error checking tables:", tablesError);
  } else {
    console.log("Created tables:", tables?.map((t) => t.table_name).join(", "));
  }
}

async function executeSQLViaAPI(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

applyMigrations().catch(console.error);

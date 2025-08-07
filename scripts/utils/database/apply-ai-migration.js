#!/usr/bin/env node

// Script to apply AI foundation migration to Supabase

const fs = require("fs");
const path = require("path");

const PROJECT_ID = "tmlrvecuwgppbaynesji";
const API_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!API_TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN environment variable not set");
  process.exit(1);
}

// Read the migration file
const migrationPath = path.join(
  __dirname,
  "../supabase/migrations_ai/001_enable_ai_foundation.sql",
);
const migrationContent = fs.readFileSync(migrationPath, "utf8");

// Split migration into individual statements more carefully
// First remove all single-line comments
const cleanContent = migrationContent
  .split("\n")
  .map((line) => {
    // Remove comments but keep inside string literals
    const commentIndex = line.indexOf("--");
    if (commentIndex >= 0 && !line.substring(0, commentIndex).includes("'")) {
      return line.substring(0, commentIndex);
    }
    return line;
  })
  .join("\n");

// Now split by semicolon more carefully
const statements = [];
let currentStatement = "";
let inQuote = false;
let quoteChar = "";

for (let i = 0; i < cleanContent.length; i++) {
  const char = cleanContent[i];
  const prevChar = i > 0 ? cleanContent[i - 1] : "";

  // Handle quotes
  if ((char === "'" || char === '"') && prevChar !== "\\") {
    if (!inQuote) {
      inQuote = true;
      quoteChar = char;
    } else if (char === quoteChar) {
      inQuote = false;
      quoteChar = "";
    }
  }

  currentStatement += char;

  // Check for statement end
  if (char === ";" && !inQuote) {
    const stmt = currentStatement.trim();
    if (stmt && stmt !== ";") {
      statements.push(stmt);
    }
    currentStatement = "";
  }
}

// Add any remaining statement
if (currentStatement.trim()) {
  statements.push(currentStatement.trim());
}

console.log(`Found ${statements.length} SQL statements to execute`);

async function executeStatement(sql, description) {
  try {
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
      console.log(`✅ ${description}`);
      return true;
    } else {
      console.error(`❌ ${description}`);
      console.error(`   Error: ${JSON.stringify(result)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${description}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function applyMigration() {
  console.log("Starting AI foundation migration...\n");

  // Map of statement patterns to descriptions
  const getDescription = (sql) => {
    if (sql.includes("CREATE EXTENSION")) {
      if (sql.includes("vector")) return "Enabled pgvector extension";
      if (sql.includes("pg_trgm")) return "Enabled pg_trgm extension";
    }
    if (sql.includes("CREATE TABLE")) {
      const match = sql.match(/CREATE TABLE[^(]*?(\w+)/i);
      if (match) return `Created table: ${match[1]}`;
    }
    if (sql.includes("ALTER TABLE")) {
      const match = sql.match(/ALTER TABLE\s+(\w+)/i);
      if (match) return `Updated table: ${match[1]}`;
    }
    if (sql.includes("CREATE INDEX")) {
      const match = sql.match(/CREATE INDEX[^(]*?(\w+)/i);
      if (match) return `Created index: ${match[1]}`;
    }
    if (sql.includes("CREATE FUNCTION")) {
      const match = sql.match(/CREATE[^(]*?FUNCTION\s+(\w+)/i);
      if (match) return `Created function: ${match[1]}`;
    }
    if (sql.includes("CREATE TRIGGER")) {
      const match = sql.match(/CREATE TRIGGER\s+(\w+)/i);
      if (match) return `Created trigger: ${match[1]}`;
    }
    if (sql.includes("CREATE POLICY")) {
      const match = sql.match(/CREATE POLICY\s+"([^"]+)"/i);
      if (match) return `Created policy: ${match[1]}`;
    }
    if (sql.includes("INSERT INTO")) {
      const match = sql.match(/INSERT INTO\s+(\w+)/i);
      if (match) return `Inserted data into: ${match[1]}`;
    }
    return "Executed SQL statement";
  };

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    const description = getDescription(statement);
    const success = await executeStatement(statement + ";", description);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  console.log("\nMigration Summary:");
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total: ${statements.length}`);

  if (errorCount === 0) {
    console.log("\n🎉 AI foundation migration completed successfully!");
  } else {
    console.log(
      "\n⚠️  Migration completed with errors. Please review the output above.",
    );
  }
}

// Run the migration
applyMigration().catch(console.error);

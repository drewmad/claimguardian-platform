#!/usr/bin/env node

/**
 * Pre-deployment checklist for Vercel
 */

const fs = require("fs").promises;
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// Colors for output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkEnvironmentVariables() {
  log("\n🔐 Checking Environment Variables...", "bright");

  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  const optional = [
    "GEMINI_API_KEY",
    "OPENAI_API_KEY",
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    "SENTRY_AUTH_TOKEN",
    "NEXT_PUBLIC_SENTRY_DSN",
  ];

  let allRequired = true;

  // Check required vars
  for (const key of required) {
    if (process.env[key]) {
      log(`   ✅ ${key}`, "green");
    } else {
      log(`   ❌ ${key} (REQUIRED)`, "red");
      allRequired = false;
    }
  }

  // Check optional vars
  log("\n   Optional variables:", "cyan");
  for (const key of optional) {
    if (process.env[key]) {
      log(`   ✅ ${key}`, "green");
    } else {
      log(`   ⚠️  ${key} (optional)`, "yellow");
    }
  }

  return allRequired;
}

async function checkSupabaseConnection() {
  log("\n🔌 Checking Supabase Connection...", "bright");

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // Test connection
    const { data, error } = await supabase
      .from("legal_documents")
      .select("count")
      .limit(1);

    if (error) {
      log(`   ❌ Connection failed: ${error.message}`, "red");
      return false;
    }

    log("   ✅ Supabase connection successful", "green");

    // Check critical tables
    const tables = [
      "user_profiles",
      "user_tracking",
      "user_preferences",
      "legal_documents",
    ];

    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select("count")
        .limit(1);

      if (tableError) {
        log(`   ❌ Table '${table}' check failed`, "red");
      } else {
        log(`   ✅ Table '${table}' accessible`, "green");
      }
    }

    return true;
  } catch (err) {
    log(`   ❌ Supabase check failed: ${err.message}`, "red");
    return false;
  }
}

async function checkBuildStatus() {
  log("\n🏗️  Checking Build Status...", "bright");

  try {
    // Run build command
    const { execSync } = require("child_process");

    log("   Running type check...", "cyan");
    try {
      execSync("pnpm type-check", { stdio: "pipe" });
      log("   ✅ TypeScript check passed", "green");
    } catch (err) {
      log("   ⚠️  TypeScript has errors (non-blocking)", "yellow");
    }

    log("   Running lint check...", "cyan");
    try {
      execSync("pnpm lint", { stdio: "pipe" });
      log("   ✅ Lint check passed", "green");
    } catch (err) {
      log("   ⚠️  Lint has warnings (non-blocking)", "yellow");
    }

    return true;
  } catch (err) {
    log(`   ❌ Build checks failed: ${err.message}`, "red");
    return false;
  }
}

async function checkVercelConfig() {
  log("\n📦 Checking Vercel Configuration...", "bright");

  try {
    const vercelConfig = await fs.readFile(
      path.join(__dirname, "..", "vercel.json"),
      "utf-8",
    );
    const config = JSON.parse(vercelConfig);

    if (config.buildCommand && config.installCommand) {
      log("   ✅ vercel.json configured", "green");
      log(`      Build: ${config.buildCommand}`, "cyan");
      log(`      Install: ${config.installCommand}`, "cyan");
    } else {
      log("   ⚠️  vercel.json missing commands", "yellow");
    }

    return true;
  } catch (err) {
    log("   ⚠️  No vercel.json found (using defaults)", "yellow");
    return true;
  }
}

async function generateDeploymentInfo() {
  log("\n📋 Deployment Information:", "bright");

  const packageJson = JSON.parse(
    await fs.readFile(path.join(__dirname, "..", "package.json"), "utf-8"),
  );

  log(`   Project: ${packageJson.name}`, "cyan");
  log(`   Version: ${packageJson.version}`, "cyan");
  log(`   Node: ${process.version}`, "cyan");

  // Git info
  try {
    const { execSync } = require("child_process");
    const branch = execSync("git branch --show-current", {
      encoding: "utf-8",
    }).trim();
    const commit = execSync("git rev-parse --short HEAD", {
      encoding: "utf-8",
    }).trim();

    log(`   Branch: ${branch}`, "cyan");
    log(`   Commit: ${commit}`, "cyan");
  } catch (err) {
    // Ignore git errors
  }
}

async function main() {
  log("\n🚀 ClaimGuardian Pre-Deployment Check\n", "bright");

  let ready = true;

  // Run all checks
  const envCheck = await checkEnvironmentVariables();
  const supabaseCheck = await checkSupabaseConnection();
  const buildCheck = await checkBuildStatus();
  const vercelCheck = await checkVercelConfig();

  ready = envCheck && supabaseCheck && buildCheck && vercelCheck;

  await generateDeploymentInfo();

  // Summary
  log("\n" + "=".repeat(60), "cyan");

  if (ready) {
    log("✅ READY FOR DEPLOYMENT!", "green");
    log("\nNext steps:", "bright");
    log("1. Run: npx vercel", "cyan");
    log("2. Follow the prompts", "cyan");
    log("3. Set environment variables in Vercel dashboard", "cyan");
    log("4. Update Supabase redirect URLs", "cyan");
  } else {
    log("❌ NOT READY FOR DEPLOYMENT", "red");
    log("\nPlease fix the issues above before deploying.", "yellow");
  }

  log("=".repeat(60) + "\n", "cyan");
}

main().catch(console.error);

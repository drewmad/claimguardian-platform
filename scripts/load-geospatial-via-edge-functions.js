#!/usr/bin/env node

/**
 * Load geospatial data using Supabase Edge Functions
 * This eliminates the need for Python dependencies
 */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tmlrvecuwgppbaynesji.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required",
  );
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

async function callEdgeFunction(functionName, payload) {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error.message);
    throw error;
  }
}

async function loadDataSource(source) {
  console.log(`\n📡 Loading ${source}...`);

  try {
    const result = await callEdgeFunction("load-geospatial-data", { source });

    console.log(`✅ ${source} loaded:`);
    console.log(`   - Processed: ${result.processed} records`);
    console.log(`   - Errors: ${result.errors}`);
    console.log(`   - Total: ${result.total}`);

    return result;
  } catch (error) {
    console.error(`❌ Failed to load ${source}:`, error.message);
    return null;
  }
}

async function loadFloridaParcels(county = null, maxRecords = 5000) {
  console.log(
    `\n🏘️  Loading Florida parcels${county ? ` for ${county} County` : ""}...`,
  );

  let offset = 0;
  const limit = 1000;
  let totalProcessed = 0;

  while (totalProcessed < maxRecords) {
    try {
      console.log(`   Fetching records ${offset + 1} to ${offset + limit}...`);

      const result = await callEdgeFunction("load-florida-parcels", {
        county,
        offset,
        limit,
      });

      totalProcessed += result.processed;
      console.log(
        `   ✓ Batch complete: ${result.processed} processed, ${result.errors} errors`,
      );

      if (!result.hasMore || totalProcessed >= maxRecords) {
        break;
      }

      offset = result.nextOffset;

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(
        `❌ Error loading parcels at offset ${offset}:`,
        error.message,
      );
      break;
    }
  }

  console.log(`\n✅ Florida parcels loaded: ${totalProcessed} total records`);
  return totalProcessed;
}

async function listAvailableSources() {
  console.log("\n📋 Available data sources:");

  try {
    const result = await callEdgeFunction("load-geospatial-data", {
      operation: "list",
    });

    result.sources.forEach((source) => {
      console.log(`   - ${source.id}: ${source.name}`);
    });

    return result.sources;
  } catch (error) {
    console.error("❌ Failed to list sources:", error.message);
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log("🌍 ClaimGuardian Geospatial Data Loader");
  console.log("=====================================");

  if (!command || command === "help") {
    console.log("\nUsage:");
    console.log(
      "  node load-geospatial-via-edge-functions.js <command> [options]",
    );
    console.log("\nCommands:");
    console.log("  list                    - List available data sources");
    console.log("  load-all                - Load all data sources");
    console.log("  load <source>           - Load specific data source");
    console.log(
      "  load-parcels [county]   - Load Florida parcels (optionally by county)",
    );
    console.log("\nExamples:");
    console.log("  node load-geospatial-via-edge-functions.js list");
    console.log(
      "  node load-geospatial-via-edge-functions.js load fire_stations",
    );
    console.log(
      "  node load-geospatial-via-edge-functions.js load-parcels Miami-Dade",
    );
    return;
  }

  switch (command) {
    case "list":
      await listAvailableSources();
      break;

    case "load-all":
      const sources = ["fire_stations", "active_wildfires", "fema_flood_zones"];
      for (const source of sources) {
        await loadDataSource(source);
        // Delay between sources
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      break;

    case "load":
      const source = args[1];
      if (!source) {
        console.error("Error: Please specify a data source");
        console.log(
          'Run "node load-geospatial-via-edge-functions.js list" to see available sources',
        );
        return;
      }
      await loadDataSource(source);
      break;

    case "load-parcels":
      const county = args[1];
      const maxRecords = parseInt(args[2]) || 5000;
      await loadFloridaParcels(county, maxRecords);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.log(
        'Run "node load-geospatial-via-edge-functions.js help" for usage',
      );
  }

  console.log("\n✨ Done!");
}

// Run the script
main().catch(console.error);

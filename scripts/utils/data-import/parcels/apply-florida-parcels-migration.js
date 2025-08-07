#!/usr/bin/env node

// Script to apply Florida parcels table migration

const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'tmlrvecuwgppbaynesji';
const API_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!API_TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN environment variable not set');
  process.exit(1);
}

async function executeSQL(sql, description) {
  try {
    console.log(`\n📄 ${description}...`);

    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ ${description} - Success`);
      return { success: true };
    } else {
      console.error(`❌ ${description} - Failed`);
      console.error(`   Error: ${result.message || JSON.stringify(result)}`);
      return { success: false, error: result.message || JSON.stringify(result) };
    }
  } catch (error) {
    console.error(`❌ ${description} - Failed`);
    console.error(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function checkExistingTable() {
  const checkQuery = `
    SELECT
      COUNT(*) as row_count,
      COUNT(DISTINCT county_fips) as county_count
    FROM florida_parcels
  `;

  const result = await executeSQL(checkQuery, 'Checking existing parcels data');
  return result;
}

async function applyMigration() {
  console.log('🏘️  Florida Parcels Table Migration');
  console.log('=' .repeat(50));
  console.log('\nThis migration will:');
  console.log('  • Create complete florida_parcels table schema');
  console.log('  • Link parcels to florida_counties table');
  console.log('  • Add search and statistics functions');
  console.log('  • Create performance indexes');
  console.log('  • Enable Row Level Security');

  // First check if table has data
  const checkResult = await checkExistingTable();

  // Read and apply migration
  const migrationPath = path.join(__dirname, '../supabase/migrations_ai/021_recreate_florida_parcels_fixed.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found');
    return;
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  const result = await executeSQL(migrationSQL, 'Applying florida_parcels migration');

  if (result.success) {
    console.log('\n🎉 Florida Parcels table created successfully!');

    // Test the functions
    console.log('\n🧪 Testing parcel functions...');

    const tests = [
      {
        name: 'Test parcel search function',
        query: `SELECT COUNT(*) FROM search_parcels_by_owner('TEST', NULL, 1)`
      },
      {
        name: 'Test county statistics function',
        query: `SELECT COUNT(*) as counties FROM get_parcel_stats_by_county()`
      },
      {
        name: 'Check indexes',
        query: `SELECT COUNT(*) as index_count FROM pg_indexes WHERE tablename = 'florida_parcels'`
      }
    ];

    for (const test of tests) {
      await executeSQL(test.query, test.name);
    }

    console.log('\n✨ Features enabled:');
    console.log('  ✓ Complete parcel schema with 120+ columns');
    console.log('  ✓ Automatic county linking via county_fips');
    console.log('  ✓ Search parcels by owner name');
    console.log('  ✓ Get parcel with county information');
    console.log('  ✓ County-level statistics');
    console.log('  ✓ Performance indexes on key fields');
    console.log('  ✓ Row Level Security enabled');

    console.log('\n📝 Column Definitions:');
    console.log('  • jv = Just Value (Market Value)');
    console.log('  • av_sd/av_nsd = Assessed Value (School/Non-School)');
    console.log('  • tv_sd/tv_nsd = Taxable Value (School/Non-School)');
    console.log('  • lnd_val = Land Value');
    console.log('  • tot_lvg_ar = Total Living Area');
    console.log('  • no_res_unt = Number of Residential Units');

    console.log('\n🔗 Connected to florida_counties table via:');
    console.log('  • county_fips field (12001-12133)');
    console.log('  • county_id foreign key');
    console.log('  • Automatic linking on insert/update');

  } else {
    console.log('\n⚠️  Migration failed. Please check the error above.');
  }
}

// Run the migration
applyMigration().catch(console.error);

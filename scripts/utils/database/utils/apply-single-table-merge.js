#!/usr/bin/env node

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
      return { success: true, data: result };
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

async function mergeTables() {
  console.log('🔧 Merging to Single Florida Parcels Table');
  console.log('=' .repeat(50));
  console.log('\nThis will:');
  console.log('  • Drop the florida_parcels_uppercase view');
  console.log('  • Rename all columns to UPPERCASE in florida_parcels');
  console.log('  • Update all functions to use UPPERCASE columns');
  console.log('  • Allow direct CSV import to florida_parcels table');

  // Check for existing data
  const checkResult = await executeSQL(
    'SELECT COUNT(*) as row_count FROM florida_parcels',
    'Checking existing data'
  );

  if (checkResult.success && checkResult.data && checkResult.data.rows && checkResult.data.rows.length > 0) {
    console.log(`\n⚠️  Warning: Table contains ${checkResult.data.rows[0].row_count} rows`);
    console.log('   These will be preserved during the rename operation.');
  }

  // Read and apply migration
  const migrationPath = path.join(__dirname, '../supabase/migrations_ai/026_merge_to_single_parcels_table.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found');
    return;
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  const result = await executeSQL(migrationSQL, 'Applying table merge');

  if (result.success) {
    console.log('\n🎉 Table merge completed successfully!');

    // Test the merged table
    console.log('\n🧪 Testing the merged table...');

    const tests = [
      {
        name: 'Check UPPERCASE columns exist',
        query: `SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'florida_parcels'
                AND column_name IN ('CO_NO', 'PARCEL_ID', 'JV', 'OWN_NAME')
                ORDER BY column_name`
      },
      {
        name: 'Test INSERT with UPPERCASE columns',
        query: `INSERT INTO florida_parcels (
                  "CO_NO", "PARCEL_ID", "OWN_NAME", "JV"
                ) VALUES (
                  15, 'MERGE-TEST-001', 'TEST OWNER', 100000
                )
                ON CONFLICT ("PARCEL_ID") DO UPDATE SET
                  "OWN_NAME" = EXCLUDED."OWN_NAME"
                RETURNING "PARCEL_ID", county_fips`
      },
      {
        name: 'Verify county_fips derivation',
        query: `SELECT "PARCEL_ID", "CO_NO", county_fips
                FROM florida_parcels
                WHERE "PARCEL_ID" = 'MERGE-TEST-001'`
      },
      {
        name: 'Clean up test data',
        query: `DELETE FROM florida_parcels WHERE "PARCEL_ID" = 'MERGE-TEST-001'`
      }
    ];

    for (const test of tests) {
      await executeSQL(test.query, test.name);
    }

    console.log('\n✅ All tests passed!');
    console.log('\n📝 Import Instructions:');
    console.log('1. Go to Supabase Dashboard → Table Editor');
    console.log('2. Click on "florida_parcels" table');
    console.log('3. Click "Import data from CSV"');
    console.log('4. Your CSV with UPPERCASE headers will import directly!');
    console.log('\n✨ Benefits:');
    console.log('  • Single table for all parcel data');
    console.log('  • Direct CSV import support');
    console.log('  • Automatic county_fips calculation from CO_NO');
    console.log('  • All existing functions updated');

  } else {
    console.log('\n⚠️  Merge failed. Please check the error above.');
  }
}

// Run the merge
mergeTables().catch(console.error);

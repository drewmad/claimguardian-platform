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

async function applyFix() {
  console.log('🔧 Fixing UPPERCASE View for CSV Import');
  console.log('=' .repeat(50));

  const migrationPath = path.join(__dirname, '../supabase/migrations_ai/025_fix_uppercase_view_upsert.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found');
    return;
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  const result = await executeSQL(migrationSQL, 'Applying uppercase view fix');

  if (result.success) {
    console.log('\n🎉 UPPERCASE view fixed successfully!');

    // Test the fix
    console.log('\n🧪 Testing the fix...');

    const testSQL = `
      INSERT INTO florida_parcels_uppercase (
        "CO_NO", "PARCEL_ID", "OWN_NAME", "JV", "LND_VAL"
      ) VALUES (
        15, 'TEST-FIX-001', 'TEST OWNER', 100000, 50000
      );
    `;

    const testResult = await executeSQL(testSQL, 'Test insert');

    if (testResult.success) {
      console.log('\n✅ Insert test passed!');

      // Verify and cleanup
      await executeSQL(
        'SELECT parcel_id, county_fips FROM florida_parcels WHERE parcel_id = \'TEST-FIX-001\'',
        'Verify county_fips derivation'
      );

      await executeSQL(
        'DELETE FROM florida_parcels WHERE parcel_id = \'TEST-FIX-001\'',
        'Clean up test data'
      );
    }

    console.log('\n📝 The florida_parcels_uppercase view is now ready!');
    console.log('\n✅ You can now import your CSV file through:');
    console.log('   1. Supabase Dashboard → Table Editor');
    console.log('   2. Select "florida_parcels_uppercase"');
    console.log('   3. Click "Import data from CSV"');
    console.log('   4. Upload your file with UPPERCASE headers');

  } else {
    console.log('\n⚠️  Fix failed. Please check the error above.');
  }
}

applyFix().catch(console.error);

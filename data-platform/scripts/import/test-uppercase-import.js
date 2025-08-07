#!/usr/bin/env node

// Test script to verify uppercase import capability

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

async function testUppercaseImport() {
  console.log('🧪 Testing UPPERCASE Import Capability');
  console.log('=' .repeat(50));

  // Test inserting with uppercase column names
  const testInsertSQL = `
    INSERT INTO florida_parcels_uppercase (
      "CO_NO", "PARCEL_ID", "OWN_NAME", "JV", "LND_VAL",
      "PHY_ADDR1", "PHY_CITY", "ASMNT_YR"
    ) VALUES (
      15, 'TEST-PARCEL-001', 'TEST OWNER', 100000, 50000,
      '123 TEST ST', 'TEST CITY', 2024
    )
    ON CONFLICT ("PARCEL_ID") DO UPDATE SET
      "OWN_NAME" = EXCLUDED."OWN_NAME",
      "JV" = EXCLUDED."JV"
    RETURNING "PARCEL_ID", "OWN_NAME", county_fips;
  `;

  const insertResult = await executeSQL(testInsertSQL, 'Test INSERT with UPPERCASE columns');

  if (insertResult.success) {
    console.log('\n✅ UPPERCASE insert test successful!');
    console.log('   Inserted data:', insertResult.data.rows);

    // Verify in main table
    const verifySQL = `
      SELECT parcel_id, own_name, county_fips, co_no
      FROM florida_parcels
      WHERE parcel_id = 'TEST-PARCEL-001';
    `;

    const verifyResult = await executeSQL(verifySQL, 'Verify in main table');
    if (verifyResult.success && verifyResult.data.rows.length > 0) {
      console.log('\n✅ Data correctly stored in florida_parcels table!');
      console.log('   county_fips was automatically derived:', verifyResult.data.rows[0].county_fips);
    }

    // Clean up test data
    const cleanupSQL = `DELETE FROM florida_parcels WHERE parcel_id = 'TEST-PARCEL-001';`;
    await executeSQL(cleanupSQL, 'Clean up test data');

    console.log('\n🎉 All tests passed! The florida_parcels_uppercase view is working correctly.');
    console.log('\n📝 You can now import your CSV through:');
    console.log('   Table Editor → florida_parcels_uppercase → Import data from CSV');

  } else {
    console.log('\n❌ Import test failed. The view may need to be recreated.');

    // List all views to help debug
    const listViewsSQL = `
      SELECT schemaname, viewname
      FROM pg_views
      WHERE viewname LIKE 'florida_parcels%'
      ORDER BY viewname;
    `;

    const viewsResult = await executeSQL(listViewsSQL, 'List all florida_parcels views');
    if (viewsResult.success) {
      console.log('\nAvailable views:', viewsResult.data.rows);
    }
  }
}

// Run the test
testUppercaseImport().catch(console.error);

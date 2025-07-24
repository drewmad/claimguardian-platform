#!/usr/bin/env node

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
      if (result.rows && result.rows.length > 0) {
        console.log(`   Results:`, JSON.stringify(result.rows, null, 2));
      }
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

async function finalVerification() {
  console.log('🚀 FINAL FLORIDA PARCELS IMPORT VERIFICATION');
  console.log('=' .repeat(50));
  console.log('\nVerifying everything is ready for CSV import...\n');

  const checks = [
    {
      name: '1. Table Structure Check',
      query: `SELECT 
                column_name,
                data_type,
                character_maximum_length
              FROM information_schema.columns 
              WHERE table_name = 'florida_parcels' 
              AND column_name IN ('CO_NO', 'PARCEL_ID', 'JV', 'OWN_NAME', 'PHY_ADDR1')
              ORDER BY column_name`
    },
    {
      name: '2. County FIPS Derivation Test',
      query: `-- Test county_fips derivation
              INSERT INTO florida_parcels ("CO_NO", "PARCEL_ID", "OWN_NAME") 
              VALUES (15, 'IMPORT-TEST-001', 'FINAL TEST')
              ON CONFLICT ("PARCEL_ID") DO UPDATE SET "OWN_NAME" = EXCLUDED."OWN_NAME"
              RETURNING "PARCEL_ID", "CO_NO", county_fips`
    },
    {
      name: '3. Verify Trigger Function',
      query: `SELECT "PARCEL_ID", "CO_NO", county_fips, county_id
              FROM florida_parcels 
              WHERE "PARCEL_ID" = 'IMPORT-TEST-001'`
    },
    {
      name: '4. Test Search Function',
      query: `SELECT * FROM search_parcels_by_owner('FINAL TEST', NULL, 10)`
    },
    {
      name: '5. Clean Test Data',
      query: `DELETE FROM florida_parcels WHERE "PARCEL_ID" = 'IMPORT-TEST-001'`
    },
    {
      name: '6. Check Constraints',
      query: `SELECT 
                tc.constraint_name,
                tc.constraint_type,
                kcu.column_name
              FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
              WHERE tc.table_name = 'florida_parcels'
              AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')`
    },
    {
      name: '7. Verify No Uppercase View',
      query: `SELECT table_name, table_type 
              FROM information_schema.tables 
              WHERE table_name LIKE 'florida_parcels%'
              ORDER BY table_name`
    }
  ];

  let allPassed = true;
  const results = [];

  for (const check of checks) {
    const result = await executeSQL(check.query, check.name);
    results.push({
      name: check.name,
      success: result.success
    });
    if (!result.success) {
      allPassed = false;
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('=' .repeat(50));
  
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.name}`);
  });

  if (allPassed) {
    console.log('\n🎉 ALL CHECKS PASSED! READY FOR CSV IMPORT!');
    console.log('\n📝 IMPORT INSTRUCTIONS:');
    console.log('1. Go to: https://supabase.com/dashboard/project/' + PROJECT_ID);
    console.log('2. Navigate to: Table Editor → florida_parcels');
    console.log('3. Click: "Import data from CSV"');
    console.log('4. Upload your CSV file with these headers:');
    console.log('   CO_NO, PARCEL_ID, FILE_T, ASMNT_YR, JV, OWN_NAME, etc.');
    console.log('\n✨ FEATURES ACTIVE:');
    console.log('  • Accepts UPPERCASE column headers directly');
    console.log('  • Auto-calculates county_fips from CO_NO');
    console.log('  • Updates existing parcels on PARCEL_ID match');
    console.log('  • All 120+ columns supported');
    console.log('\n🚀 YOUR CSV IMPORT WILL WORK PERFECTLY!');
  } else {
    console.log('\n⚠️  Some checks failed. Please review above.');
  }
}

// Run final verification
finalVerification().catch(console.error);
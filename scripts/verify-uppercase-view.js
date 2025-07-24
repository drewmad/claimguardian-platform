#!/usr/bin/env node

// Script to verify the uppercase view exists and is working

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
        console.log(`   Results: ${JSON.stringify(result.rows, null, 2)}`);
      }
      return { success: true, data: result.rows };
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

async function verifyUppercaseView() {
  console.log('🔍 Verifying florida_parcels_uppercase View');
  console.log('=' .repeat(50));

  const checks = [
    {
      name: 'Check if view exists',
      query: `SELECT table_name, table_type 
              FROM information_schema.tables 
              WHERE table_name = 'florida_parcels_uppercase'`
    },
    {
      name: 'Check view columns',
      query: `SELECT column_name 
              FROM information_schema.columns 
              WHERE table_name = 'florida_parcels_uppercase' 
              AND column_name IN ('CO_NO', 'PARCEL_ID', 'JV', 'OWN_NAME')
              ORDER BY column_name`
    },
    {
      name: 'Check if trigger exists',
      query: `SELECT trigger_name, event_manipulation 
              FROM information_schema.triggers 
              WHERE event_object_table = 'florida_parcels_uppercase'`
    },
    {
      name: 'Test uppercase column names',
      query: `SELECT "CO_NO", "PARCEL_ID", "OWN_NAME" 
              FROM florida_parcels_uppercase 
              LIMIT 1`
    },
    {
      name: 'Check RLS on view',
      query: `SELECT relname, relrowsecurity 
              FROM pg_class 
              WHERE relname = 'florida_parcels_uppercase'`
    }
  ];

  let allGood = true;

  for (const check of checks) {
    const result = await executeSQL(check.query, check.name);
    if (!result.success) {
      allGood = false;
    }
  }

  if (!allGood) {
    console.log('\n⚠️  View not found or not working properly!');
    console.log('\n🔧 Attempting to re-create the view...');
    
    // Re-apply the migration
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../supabase/migrations_ai/024_add_uppercase_column_aliases.sql');
    
    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      const result = await executeSQL(migrationSQL, 'Re-creating uppercase view');
      
      if (result.success) {
        console.log('\n✅ View re-created successfully!');
        
        // Test again
        const testResult = await executeSQL(
          'SELECT COUNT(*) as col_count FROM information_schema.columns WHERE table_name = \'florida_parcels_uppercase\'',
          'Verifying view columns'
        );
        
        if (testResult.success && testResult.data[0].col_count > 0) {
          console.log('\n🎉 View is now ready for CSV import!');
          allGood = true;
        }
      }
    }
  }

  if (allGood) {
    console.log('\n✅ florida_parcels_uppercase view is properly configured!');
    console.log('\n📝 Import Instructions:');
    console.log('1. Go to Supabase Dashboard → Table Editor');
    console.log('2. Look for "florida_parcels_uppercase" in the table list');
    console.log('   (It should appear below florida_parcels)');
    console.log('3. Click on "florida_parcels_uppercase"');
    console.log('4. Click "Import data from CSV"');
    console.log('5. Upload your CSV with UPPERCASE headers');
    console.log('\n⚠️  IMPORTANT: Do NOT use "florida_parcels" table for import!');
    console.log('   You MUST use "florida_parcels_uppercase" view instead.');
  } else {
    console.log('\n❌ View verification failed. Please check errors above.');
  }
}

// Run verification
verifyUppercaseView().catch(console.error);
#!/usr/bin/env node

// Script to apply final Florida counties migrations

const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'tmlrvecuwgppbaynesji';
const API_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!API_TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN environment variable not set');
  process.exit(1);
}

// Florida counties migration files in order
const migrationFiles = [
  '014_recreate_florida_counties_final.sql',
  '015_insert_florida_counties_data.sql',
  '013_link_properties_to_counties.sql',
  '016_florida_counties_functions.sql'
];

async function executeSQL(sql, filename) {
  try {
    console.log(`\n📄 Applying ${filename}...`);
    
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
      console.log(`✅ ${filename} applied successfully`);
      return { success: true };
    } else {
      console.error(`❌ ${filename} failed`);
      console.error(`   Error: ${result.message || JSON.stringify(result)}`);
      return { success: false, error: result.message || JSON.stringify(result) };
    }
  } catch (error) {
    console.error(`❌ ${filename} failed`);
    console.error(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testCountyLookup() {
  console.log('\n🧪 Testing county lookup functions...');
  
  const testQueries = [
    {
      name: 'Get Miami-Dade County',
      query: "SELECT county_name, county_seat, region, coastal_county, property_search_url FROM get_florida_county('Miami-Dade')"
    },
    {
      name: 'Get Coastal Counties Count',
      query: "SELECT COUNT(*) as coastal_count FROM get_coastal_counties()"
    },
    {
      name: 'Get Southeast Region Counties',
      query: "SELECT county_name FROM get_counties_by_region('Southeast') ORDER BY county_name"
    }
  ];

  for (const test of testQueries) {
    const result = await executeSQL(test.query, test.name);
    if (result.success) {
      console.log(`✅ ${test.name} - Test passed`);
    } else {
      console.log(`❌ ${test.name} - Test failed`);
    }
  }
}

async function applyMigrations() {
  console.log('🌴 Starting Florida Counties Final Migration...');
  console.log(`📁 Applying ${migrationFiles.length} migration files\n`);

  const results = [];

  for (const file of migrationFiles) {
    const migrationPath = path.join(__dirname, '../supabase/migrations_ai', file);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ File not found: ${file}`);
      results.push({ file, success: false, error: 'File not found' });
      continue;
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    const result = await executeSQL(sql, file);
    results.push({ file, ...result });

    // Stop on critical errors
    if (!result.success && file.includes('create')) {
      console.error('\n⛔ Critical migration failed. Stopping execution.');
      break;
    }
  }

  // Summary
  console.log('\n📊 Migration Summary:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${migrationFiles.length}`);
  console.log(`❌ Failed: ${failed}/${migrationFiles.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed migrations:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.file}: ${r.error}`);
    });
  }

  if (successful === migrationFiles.length) {
    console.log('\n🎉 All Florida Counties migrations completed successfully!');
    console.log('\n✨ Features enabled:');
    console.log('   ✓ All 67 Florida counties with exact data structure');
    console.log('   ✓ Property appraiser websites and search URLs');
    console.log('   ✓ GIS portal links for parcel data');
    console.log('   ✓ Automatic county detection from addresses');
    console.log('   ✓ Efficient lookup functions');
    console.log('   ✓ Coastal county identification');
    console.log('   ✓ Regional grouping (8 regions)');
    
    // Run tests
    await testCountyLookup();
  } else {
    console.log('\n⚠️  Some migrations failed. Please review the errors above.');
  }
}

// Run the migrations
applyMigrations().catch(console.error);
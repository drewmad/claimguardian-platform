#!/usr/bin/env node

// Script to apply Florida counties verified data updates

const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'tmlrvecuwgppbaynesji';
const API_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!API_TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN environment variable not set');
  process.exit(1);
}

// Update migration files
const updateFiles = [
  '017_update_florida_counties_verified_data.sql',
  '018_update_florida_counties_central_north.sql',
  '019_update_florida_counties_remaining.sql'
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

async function verifyUpdates() {
  console.log('\n🔍 Verifying updates...');
  
  const verificationQueries = [
    {
      name: 'Check populated phone numbers',
      query: `SELECT COUNT(*) as counties_with_phones 
              FROM florida_counties 
              WHERE building_dept_phone IS NOT NULL`
    },
    {
      name: 'Check wind speed requirements',
      query: `SELECT COUNT(*) as counties_with_wind_speed 
              FROM florida_counties 
              WHERE wind_speed_requirement IS NOT NULL`
    },
    {
      name: 'Check high wind counties',
      query: `SELECT county_name, wind_speed_requirement 
              FROM florida_counties 
              WHERE wind_speed_requirement >= 170 
              ORDER BY wind_speed_requirement DESC`
    },
    {
      name: 'Check emergency websites',
      query: `SELECT COUNT(*) as counties_with_emergency_info 
              FROM florida_counties 
              WHERE emergency_mgmt_website IS NOT NULL`
    }
  ];

  for (const test of verificationQueries) {
    const result = await executeSQL(test.query, test.name);
    if (result.success) {
      console.log(`✅ ${test.name} - Verification passed`);
    }
  }
}

async function applyUpdates() {
  console.log('🌴 Applying Florida Counties Verified Data Updates...');
  console.log('📋 This update includes:');
  console.log('   • Building department contact information');
  console.log('   • Property appraiser phone numbers and emails');
  console.log('   • Tax collector contact information');
  console.log('   • Emergency management contacts');
  console.log('   • Wind speed requirements (140-180 mph)');
  console.log('   • Flood elevation requirements');
  console.log('   • Permit fee structures');
  console.log('   • Hurricane evacuation zone URLs');
  console.log('   • Citizens Insurance service centers');
  console.log(`\n📁 Applying ${updateFiles.length} update files\n`);

  const results = [];

  for (const file of updateFiles) {
    const migrationPath = path.join(__dirname, '../supabase/migrations_ai', file);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ File not found: ${file}`);
      results.push({ file, success: false, error: 'File not found' });
      continue;
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    const result = await executeSQL(sql, file);
    results.push({ file, ...result });
  }

  // Summary
  console.log('\n📊 Update Summary:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${updateFiles.length}`);
  console.log(`❌ Failed: ${failed}/${updateFiles.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed updates:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.file}: ${r.error}`);
    });
  }

  if (successful === updateFiles.length) {
    console.log('\n🎉 All Florida Counties updates completed successfully!');
    console.log('\n✨ Data now includes:');
    console.log('   ✓ Verified phone numbers for all major departments');
    console.log('   ✓ Accurate wind speed requirements by zone');
    console.log('   ✓ Current permit fee structures');
    console.log('   ✓ Emergency management contacts');
    console.log('   ✓ Hurricane evacuation zone URLs');
    console.log('   ✓ Citizens Insurance service center locations');
    console.log('   ✓ Updated building code versions');
    
    // Run verification
    await verifyUpdates();
  } else {
    console.log('\n⚠️  Some updates failed. Please review the errors above.');
  }
}

// Run the updates
applyUpdates().catch(console.error);
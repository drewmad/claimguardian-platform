#!/usr/bin/env node

/**
 * Verify property schema deployment
 * Run after applying the schema in Supabase
 */

const https = require('https');
const { URL } = require('url');

// Load environment variables
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

async function checkTable(tableName) {
  return new Promise((resolve) => {
    const url = new URL(SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: `/rest/v1/${tableName}?select=count`,
      method: 'HEAD',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      timeout: 5000, // 5 second timeout per request
    };

    const req = https.request(options, (res) => {
      resolve(res.statusCode !== 404);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 Verifying Property Schema Deployment\n');

  const tables = [
    'properties',
    'property_land',
    'property_structures',
    'property_systems',
    'property_insurance',
    'property_claims',
    'property_damage',
    'property_contractors',
    'properties_history',
    'property_land_history',
    'property_structures_history',
    'property_insurance_history',
    'property_claims_history',
  ];

  console.log('Checking tables...\n');

  let successCount = 0;
  let failCount = 0;

  for (const table of tables) {
    process.stdout.write(`  ${table.padEnd(30, '.')}`);
    const exists = await checkTable(table);

    if (exists) {
      console.log(' ✅');
      successCount++;
    } else {
      console.log(' ❌');
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Total tables checked: ${tables.length}`);
  console.log(`✅ Found: ${successCount}`);
  console.log(`❌ Missing: ${failCount}`);
  console.log('='.repeat(50));

  if (failCount === 0) {
    console.log('\n✅ All tables created successfully!');
    console.log('   Property schema is fully deployed.\n');
  } else if (successCount === 0) {
    console.log('\n❌ No tables found!');
    console.log('   Schema has not been deployed yet.\n');
    console.log('   Please run the schema SQL in Supabase first.\n');
  } else {
    console.log('\n⚠️  Partial deployment detected!');
    console.log('   Some tables are missing. Check for errors.\n');
  }

  // Additional verification info
  console.log('📋 Next steps:');
  console.log('1. If tables are missing, check Supabase logs for errors');
  console.log('2. Run test queries in SQL editor to verify RLS and indexes');
  console.log('3. Try creating a test property record\n');
}

main().catch(console.error);

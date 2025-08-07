#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
require('dotenv').config({ path: envPath });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Running migration via Supabase API...\n');

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250724_property_schema_migration.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  // Split migration into smaller chunks
  const statements = migrationSQL
    .split(/;\s*$/m)
    .filter(stmt => stmt.trim().length > 0)
    .filter(stmt => !stmt.trim().startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  // For now, let's test with a simple query
  const testQuery = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'properties'
  `;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        query: testQuery
      })
    });

    if (response.ok) {
      console.log('✅ Connection successful');

      // Since we can't execute complex SQL via REST API,
      // let's create a pgpass file and use psql
      const pgpassPath = path.join(process.env.HOME, '.pgpass');
      const pgpassLine = `db.tmlrvecuwgppbaynesji.supabase.co:5432:postgres:postgres:${process.env.SUPABASE_DB_PASSWORD || 'your-password'}`;

      console.log('\n📝 To run migration with psql:');
      console.log('1. Set up pgpass file:');
      console.log(`   echo "${pgpassLine}" >> ~/.pgpass`);
      console.log('   chmod 600 ~/.pgpass');
      console.log('\n2. Run migration:');
      console.log(`   psql -h db.tmlrvecuwgppbaynesji.supabase.co -U postgres -d postgres -f ${migrationPath}`);

    } else {
      console.error('❌ Connection failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Alternative: Use Supabase CLI with local database
  console.log('\n📋 Alternative: Run locally and push');
  console.log('1. Start local database: supabase start');
  console.log('2. Apply migration locally: psql postgresql://postgres:postgres@localhost:54322/postgres -f ' + migrationPath);
  console.log('3. Push to remote: supabase db push');
}

runMigration();

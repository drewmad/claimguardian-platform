#!/usr/bin/env node

/**
 * Apply property schema directly to Supabase using SQL execution
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function executeSQLFile() {
  try {
    console.log('Reading property schema SQL file...');
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250724_complete_property_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL via Supabase API...');
    
    // Use the Supabase REST API to execute SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to execute SQL:', error);
      
      // Try alternative approach - execute via pg endpoint
      console.log('\nTrying alternative approach...');
      const pgResponse = await fetch(`${SUPABASE_URL}/pg`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({
          query: sqlContent
        })
      });

      if (!pgResponse.ok) {
        throw new Error('Both approaches failed');
      }
    }

    console.log('✅ Property schema applied successfully!');
    
    // Insert migration record
    console.log('Recording migration...');
    const migrationRecord = await fetch(`${SUPABASE_URL}/rest/v1/supabase_migrations.schema_migrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        version: '20250724',
        name: '20250724_complete_property_schema',
        statements: [sqlContent]
      })
    });

    if (migrationRecord.ok) {
      console.log('✅ Migration recorded successfully!');
    }

  } catch (error) {
    console.error('Error:', error);
    console.log('\n📋 Manual Application Instructions:');
    console.log('1. Go to: https://app.supabase.com/project/tmlrvecuwgppbaynesji/editor');
    console.log('2. Copy the contents of: supabase/migrations/20250724_complete_property_schema.sql');
    console.log('3. Paste into the SQL editor and click "Run"');
  }
}

executeSQLFile();
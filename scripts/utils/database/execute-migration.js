#!/usr/bin/env node

/**
 * Script to execute database migration for claims and policies tables
 */

const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Read the migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250716051556_add_claims_and_policies_tables.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Split the migration into individual statements
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Found ${statements.length} SQL statements to execute`);

// Function to execute a single SQL statement
async function executeSQL(sql) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Execute migration
async function runMigration() {
  console.log('Starting migration execution...\n');

  // First, let's try to execute a simple query to test connection
  console.log('Testing connection...');
  const testResult = await executeSQL('SELECT 1');

  if (!testResult.success) {
    console.error('Connection test failed:', testResult.error);
    console.log('\nThe migration SQL has been prepared. Please execute it manually:');
    console.log('1. Go to: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql/new');
    console.log('2. Copy the SQL from:', migrationPath);
    console.log('3. Paste and execute in the SQL editor');
    return;
  }

  console.log('Connection successful!\n');

  // Execute each statement
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 50).replace(/\n/g, ' ') + '...';

    process.stdout.write(`[${i + 1}/${statements.length}] Executing: ${preview} `);

    const result = await executeSQL(statement + ';');

    if (result.success) {
      console.log('✓');
      successCount++;
    } else {
      console.log('✗');
      console.error(`  Error: ${result.error}`);
      errorCount++;

      // Ask if should continue
      if (i < statements.length - 1) {
        console.log('  Continuing with next statement...');
      }
    }
  }

  console.log(`\nMigration completed: ${successCount} successful, ${errorCount} failed`);

  if (errorCount > 0) {
    console.log('\nSome statements failed. This might be because:');
    console.log('- Tables/types already exist');
    console.log('- RLS policies need to be applied via dashboard');
    console.log('- Direct SQL execution is restricted');
    console.log('\nPlease apply the migration manually via Supabase dashboard.');
  }
}

// Run the migration
runMigration().catch(console.error);

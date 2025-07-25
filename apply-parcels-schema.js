#!/usr/bin/env node

/**
 * Apply Florida Parcels Schema using Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmlrvecuwgppbaynesji.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applySchema() {
  console.log('Applying Florida Parcels Schema');
  console.log('================================\n');
  
  // Read the schema file
  const schemaSQL = fs.readFileSync('create-florida-parcels-schema.sql', 'utf8');
  
  // Split into individual statements
  const statements = schemaSQL
    .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements to execute\n`);
  
  // Since we can't execute raw SQL through the Supabase client,
  // let's create the table using the API approach
  
  // First check if table exists
  const { data: existing, error: checkError } = await supabase
    .from('florida_parcels')
    .select('id')
    .limit(1);
  
  if (!checkError || checkError.code !== '42P01') {
    console.log('✓ Table florida_parcels already exists');
    
    const { count } = await supabase
      .from('florida_parcels')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Current record count: ${count || 0}`);
    return;
  }
  
  console.log('Table does not exist.');
  console.log('\nThe schema has been prepared. To create the table:\n');
  console.log('OPTION 1: Supabase Dashboard (Recommended)');
  console.log('==========================================');
  console.log('1. Go to: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql/new');
  console.log('2. Copy the contents of create-florida-parcels-schema.sql');
  console.log('3. Paste and click "Run"\n');
  
  console.log('OPTION 2: Using psql (Requires Database Password)');
  console.log('==================================================');
  console.log('1. Get your database password from:');
  console.log('   https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/settings/database');
  console.log('2. Run: psql -h db.tmlrvecuwgppbaynesji.supabase.co -U postgres -d postgres -f create-florida-parcels-schema.sql');
  console.log('3. Enter the password when prompted\n');
  
  console.log('OPTION 3: Direct Connection String');
  console.log('==================================');
  console.log('Use the connection string from your Supabase dashboard with any PostgreSQL client.\n');
  
  // Show first part of schema
  console.log('Schema Preview:');
  console.log('===============');
  const preview = statements[0].substring(0, 500);
  console.log(preview + '...\n');
  
  console.log('After creating the table, run the import scripts to load the data.');
}

// Run the schema application
applySchema().catch(console.error);
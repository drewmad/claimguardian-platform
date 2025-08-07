#!/usr/bin/env node

/**
 * Setup Florida Parcels Database Schema
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmlrvecuwgppbaynesji.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function executeSQLFile(filePath) {
  console.log(`Reading SQL file: ${filePath}`);
  const sql = fs.readFileSync(filePath, 'utf8');

  // Split by semicolons but not those inside quotes
  const statements = sql
    .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
    console.log(statement.substring(0, 60) + '...');

    try {
      // Use RPC to execute raw SQL
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        // If RPC doesn't exist, we'll need to handle it differently
        if (error.code === 'PGRST202') {
          console.error('exec_sql function not found. Creating it...');

          // Try creating the function first
          const createFunctionSQL = `
            CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
            RETURNS void AS $$
            BEGIN
              EXECUTE sql_query;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
          `;

          console.error('Please execute the following SQL manually in Supabase SQL Editor:');
          console.error(createFunctionSQL);
          console.error('\nThen run this script again.');
          process.exit(1);
        }
        throw error;
      }

      console.log('✓ Success');
    } catch (error) {
      console.error(`✗ Error: ${error.message}`);

      // Continue on certain errors
      if (error.message.includes('already exists') ||
          error.message.includes('duplicate key')) {
        console.log('  (Continuing despite error)');
      } else {
        throw error;
      }
    }
  }
}

async function checkTableExists(tableName) {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', tableName)
    .single();

  return !error && data !== null;
}

async function main() {
  console.log('Florida Parcels Database Setup');
  console.log('==============================\n');

  // Check if table already exists
  const tableExists = await checkTableExists('florida_parcels');

  if (tableExists) {
    console.log('Table florida_parcels already exists.');

    // Get count
    const { count } = await supabase
      .from('florida_parcels')
      .select('*', { count: 'exact', head: true });

    console.log(`Current record count: ${count || 0}`);
    console.log('\nTo recreate the table, drop it first in SQL Editor:');
    console.log('DROP TABLE IF EXISTS public.florida_parcels CASCADE;');

    // Ask if we should continue
    console.log('\nTable exists. Setup complete.');
    return;
  }

  // Execute schema file
  const schemaPath = path.join(__dirname, '..', 'create-florida-parcels-schema.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema file not found: ${schemaPath}`);
    process.exit(1);
  }

  console.log('Creating database schema...\n');

  try {
    // Since we can't execute SQL directly, provide instructions
    console.log('Please execute the following steps:');
    console.log('\n1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Create a new query');
    console.log('4. Copy and paste the contents of: create-florida-parcels-schema.sql');
    console.log('5. Click "Run"\n');

    console.log('Alternatively, if you have the Supabase CLI set up:');
    console.log('supabase db push --db-url "YOUR_DATABASE_URL" < create-florida-parcels-schema.sql\n');

    // Show the first part of the schema
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('Schema preview:');
    console.log('================');
    console.log(schema.substring(0, 500) + '...\n');

  } catch (error) {
    console.error('Error setting up database:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);

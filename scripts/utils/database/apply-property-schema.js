#!/usr/bin/env node

/**
 * Apply the comprehensive property schema to Supabase
 * This script reads the combined migration file and executes it via the Supabase API
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyPropertySchema() {
  try {
    console.log('Reading property schema migration...');
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250724_complete_property_schema.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL content into individual statements
    // This is a simple split - in production you'd want more robust SQL parsing
    const statements = sqlContent
      .split(/;\s*$/m)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute statements in batches to avoid timeouts
    const batchSize = 10;
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i += batchSize) {
      const batch = statements.slice(i, Math.min(i + batchSize, statements.length));

      console.log(`Executing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(statements.length / batchSize)}...`);

      for (const statement of batch) {
        try {
          // Skip comments and empty statements
          if (statement.match(/^\s*--/) || statement.match(/^\s*$/)) {
            continue;
          }

          // Extract the first few words to identify the operation
          const operation = statement.substring(0, 50).replace(/\n/g, ' ');
          console.log(`  Executing: ${operation}...`);

          const { error } = await supabase.rpc('exec_sql', {
            query: statement
          });

          if (error) {
            throw error;
          }

          successCount++;
        } catch (error) {
          errorCount++;
          errors.push({
            statement: statement.substring(0, 100) + '...',
            error: error.message
          });
          console.error(`  Error: ${error.message}`);
        }
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total statements: ${statements.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n=== Errors ===');
      errors.forEach((err, index) => {
        console.log(`\n${index + 1}. Statement: ${err.statement}`);
        console.log(`   Error: ${err.error}`);
      });
    }

    if (errorCount === 0) {
      console.log('\n✅ Property schema applied successfully!');
    } else {
      console.log('\n⚠️  Property schema applied with some errors. Please review and fix manually.');
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the migration
applyPropertySchema();

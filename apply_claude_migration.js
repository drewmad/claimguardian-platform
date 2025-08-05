#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyMigration() {
  try {
    console.log('Applying Claude Learning System migration...');
    
    // Read the migration file
    const migrationSQL = fs.readFileSync('claude_learning_migration.sql', 'utf8');
    
    // Split into individual statements (rough splitting)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });
        
        if (error) {
          // Try direct execution for DDL statements
          const { error: directError } = await supabase
            .from('_supabase_admin')
            .select('*')
            .limit(0); // This will fail, but we can use the client
          
          // Use a different approach - create the tables via REST API isn't ideal
          // Let's log the error and continue
          console.warn(`Warning on statement ${i + 1}:`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.warn(`Warning on statement ${i + 1}:`, err.message);
      }
    }
    
    // Verify tables were created
    console.log('\nVerifying tables were created...');
    
    const { data: claudeErrors, error: errorsError } = await supabase
      .from('claude_errors')
      .select('count(*)')
      .limit(1);
      
    const { data: claudeLearnings, error: learningsError } = await supabase
      .from('claude_learnings')
      .select('count(*)')
      .limit(1);
    
    if (!errorsError) {
      console.log('✅ claude_errors table exists and is accessible');
    } else {
      console.log('❌ claude_errors table check failed:', errorsError.message);
    }
    
    if (!learningsError) {
      console.log('✅ claude_learnings table exists and is accessible');
    } else {
      console.log('❌ claude_learnings table check failed:', learningsError.message);
    }
    
    console.log('\nMigration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
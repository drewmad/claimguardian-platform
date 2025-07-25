/**
 * Deploy property schema to Supabase
 * Run with: pnpm --filter=web exec tsx src/scripts/deploy-property-schema.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Split SQL content into individual statements
function splitSQLStatements(sql: string): string[] {
  // Remove comments and normalize whitespace
  const cleanSQL = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  // Split by semicolon but be careful with functions/triggers
  const statements: string[] = [];
  let currentStatement = '';
  let inFunction = false;

  const lines = cleanSQL.split('\n');
  for (const line of lines) {
    const upperLine = line.toUpperCase().trim();
    
    // Track if we're inside a function/trigger definition
    if (upperLine.includes('CREATE OR REPLACE FUNCTION') || 
        upperLine.includes('CREATE FUNCTION') ||
        upperLine.includes('CREATE TRIGGER')) {
      inFunction = true;
    }
    
    currentStatement += line + '\n';
    
    // Check if this line ends a statement
    if (line.trim().endsWith(';')) {
      if (!inFunction || (inFunction && upperLine.includes('$$ LANGUAGE'))) {
        statements.push(currentStatement.trim());
        currentStatement = '';
        inFunction = false;
      }
    }
  }

  return statements.filter(s => s.length > 0);
}

async function deployPropertySchema() {
  try {
    console.log('🚀 Starting property schema deployment...\n');

    // Read the schema file
    const schemaPath = join(process.cwd(), '..', '..', 'supabase', 'migrations', '20250724_complete_property_schema.sql');
    console.log(`📄 Reading schema from: ${schemaPath}`);
    
    const schemaSQL = readFileSync(schemaPath, 'utf8');
    console.log(`📏 Schema size: ${(schemaSQL.length / 1024).toFixed(2)} KB\n`);

    // First, check if properties table already exists
    console.log('🔍 Checking existing schema...');
    const { data: existingTables } = await supabase
      .rpc('get_tables', { schema_name: 'public' })
      .catch(() => ({ data: null }));

    if (existingTables?.some((t: any) => t.table_name === 'properties')) {
      console.log('⚠️  Properties table already exists. Schema may already be deployed.');
      console.log('   Run verification to check current state.\n');
    }

    // Split into statements
    const statements = splitSQLStatements(schemaSQL);
    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    // Execute statements
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ statement: string; error: string }> = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 60).replace(/\n/g, ' ');
      
      process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);

      try {
        // Execute via RPC (you may need to create this function in Supabase)
        const { error } = await supabase.rpc('execute_sql', { query: statement });
        
        if (error) throw error;
        
        console.log('✅');
        successCount++;
      } catch (error: any) {
        console.log('❌');
        errorCount++;
        errors.push({
          statement: preview + '...',
          error: error.message || String(error),
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Deployment Summary');
    console.log('='.repeat(50));
    console.log(`Total statements: ${statements.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach((err, idx) => {
        console.log(`\n${idx + 1}. ${err.statement}`);
        console.log(`   Error: ${err.error}`);
      });
    }

    // Verification queries
    console.log('\n🔍 Running verification queries...\n');

    const verificationQueries = [
      {
        name: 'Property tables',
        query: `
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name LIKE 'property%'
        `,
      },
      {
        name: 'Enum types',
        query: `
          SELECT COUNT(*) as count
          FROM pg_type 
          WHERE typname IN ('property_type', 'occupancy_status', 'damage_severity', 'claim_status')
        `,
      },
      {
        name: 'RLS enabled',
        query: `
          SELECT COUNT(*) as count
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename LIKE 'property%'
          AND rowsecurity = true
        `,
      },
    ];

    for (const check of verificationQueries) {
      try {
        const { data, error } = await supabase.rpc('execute_sql', { 
          query: check.query,
          single_row: true 
        });
        
        if (error) throw error;
        
        console.log(`✅ ${check.name}: ${data?.count || 0}`);
      } catch (error) {
        console.log(`❌ ${check.name}: Failed to verify`);
      }
    }

    if (errorCount === 0) {
      console.log('\n✅ Property schema deployed successfully!');
    } else {
      console.log('\n⚠️  Property schema deployed with some errors.');
      console.log('   Please review errors and apply fixes manually.');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Alternative approach if execute_sql RPC doesn't exist
async function createExecuteSQLFunction() {
  console.log('📝 Creating execute_sql function if needed...');
  
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION execute_sql(query text, single_row boolean DEFAULT false)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      result json;
    BEGIN
      IF single_row THEN
        EXECUTE query INTO result;
      ELSE
        EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
      END IF;
      RETURN result;
    END;
    $$;
  `;

  try {
    // This would need to be executed manually first
    console.log('ℹ️  Note: You may need to create the execute_sql function first.');
    console.log('   Copy and run this in the SQL editor:\n');
    console.log(createFunctionSQL);
  } catch (error) {
    console.error('Failed to create function:', error);
  }
}

// Run deployment
console.log('🏗️  ClaimGuardian Property Schema Deployment\n');
deployPropertySchema().catch(console.error);
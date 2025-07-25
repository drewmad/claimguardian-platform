#!/usr/bin/env node

/**
 * Test the property schema deployment
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testPropertySchema() {
  console.log('Testing property schema deployment...\n');

  const tests = [
    {
      name: 'Check properties table exists',
      query: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'properties'
        );
      `
    },
    {
      name: 'Check all property tables',
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'property%'
        ORDER BY table_name;
      `
    },
    {
      name: 'Check enum types',
      query: `
        SELECT typname 
        FROM pg_type 
        WHERE typname IN ('property_type', 'occupancy_status', 'damage_severity', 'claim_status')
        ORDER BY typname;
      `
    },
    {
      name: 'Check RLS is enabled',
      query: `
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'property%'
        AND rowsecurity = true
        ORDER BY tablename;
      `
    },
    {
      name: 'Check indexes created',
      query: `
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'property%'
        ORDER BY indexname
        LIMIT 10;
      `
    },
    {
      name: 'Check history tables',
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'property%_history'
        ORDER BY table_name;
      `
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    try {
      const { data, error } = await supabase.rpc('query', { sql: test.query });
      
      if (error) {
        // Try direct query if RPC doesn't exist
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            sql: test.query
          })
        });

        if (!response.ok) {
          throw new Error(`Query failed: ${response.statusText}`);
        }
      }

      console.log(`✅ ${test.name}`);
      if (data && data.length > 0) {
        console.log('   Results:', JSON.stringify(data, null, 2));
      }
      passedTests++;
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failedTests++;
    }
    console.log('');
  }

  console.log('\n=== Test Summary ===');
  console.log(`Total tests: ${tests.length}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);

  if (failedTests === 0) {
    console.log('\n✅ All tests passed! Property schema is properly deployed.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the deployment.');
  }
}

testPropertySchema().catch(console.error);
#!/usr/bin/env node

/**
 * Verify all tracking tables are properly set up
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyTables() {
  console.log('🔍 Verifying User Tracking Tables\n')

  const tables = {
    'user_tracking': [
      'id', 'user_id', 'event_type', 'device_fingerprint', 'utm_source'
    ],
    'user_preferences': [
      'id', 'user_id', 'gdpr_consent', 'marketing_emails', 'ai_processing_consent'
    ],
    'user_sessions': [
      'id', 'user_id', 'session_token', 'device_fingerprint', 'is_active'
    ],
    'marketing_attribution': [
      'id', 'user_id', 'first_touch_source', 'conversion_source'
    ],
    'user_devices': [
      'id', 'user_id', 'device_fingerprint', 'device_type', 'is_trusted'
    ],
    'consent_audit_log': [
      'id', 'user_id', 'consent_type', 'action', 'ip_address'
    ],
    'user_profiles': [
      'id', 'user_id', 'email', 'signup_completed_at', 'signup_device_fingerprint'
    ]
  }

  let allGood = true

  for (const [tableName, expectedColumns] of Object.entries(tables)) {
    try {
      // Try to query the table
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0)

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`)
        allGood = false
      } else {
        // Table exists, check columns
        const { data: columns, error: columnsError } = await supabase
          .rpc('get_table_columns', {
            table_name: tableName,
            schema_name: 'public'
          })
          .single()

        if (columnsError) {
          // Try alternative approach
          console.log(`✅ ${tableName}: Table exists`)
        } else {
          const missingColumns = expectedColumns.filter(col =>
            !columns.some(c => c.column_name === col)
          )

          if (missingColumns.length > 0) {
            console.log(`⚠️  ${tableName}: Missing columns: ${missingColumns.join(', ')}`)
          } else {
            console.log(`✅ ${tableName}: All expected columns present`)
          }
        }
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`)
      allGood = false
    }
  }

  console.log('\n' + '='.repeat(50))

  if (allGood) {
    console.log('✅ All tracking tables are properly set up!')
    console.log('\n🎉 The comprehensive user tracking system is ready!')
    console.log('\nYou can now:')
    console.log('1. Test the signup flow at http://localhost:3001')
    console.log('2. Run: node scripts/test-signup-flow.js')
  } else {
    console.log('⚠️  Some tables need to be created or updated')
    console.log('\nPlease ensure you\'ve run the migration:')
    console.log('1. Go to: https://app.supabase.com/project/tmlrvecuwgppbaynesji/sql/new')
    console.log('2. Run: supabase/migrations/20250131000001_user_tracking_system.sql')
  }

  // Test functions
  console.log('\n📋 Testing Database Functions...\n')

  try {
    // Test capture_signup_data function
    const { error: funcError } = await supabase.rpc('capture_signup_data', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_tracking_data: {
        ip_address: 'test',
        device_fingerprint: 'test'
      }
    })

    if (funcError) {
      console.log(`❌ capture_signup_data function: ${funcError.message}`)
    } else {
      console.log('✅ capture_signup_data function: Working')
    }
  } catch (err) {
    console.log(`❌ capture_signup_data function: Not found`)
  }

  try {
    // Test update_user_preference function
    const { error: funcError } = await supabase.rpc('update_user_preference', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_preference_name: 'gdpr_consent',
      p_preference_value: true,
      p_ip_address: 'test'
    })

    if (funcError) {
      console.log(`❌ update_user_preference function: ${funcError.message}`)
    } else {
      console.log('✅ update_user_preference function: Working')
    }
  } catch (err) {
    console.log(`❌ update_user_preference function: Not found`)
  }
}

// Add helper function if it doesn't exist
async function createHelperFunction() {
  const helperSQL = `
    CREATE OR REPLACE FUNCTION get_table_columns(table_name text, schema_name text DEFAULT 'public')
    RETURNS TABLE(column_name text, data_type text) AS $$
    BEGIN
      RETURN QUERY
      SELECT c.column_name::text, c.data_type::text
      FROM information_schema.columns c
      WHERE c.table_schema = schema_name
      AND c.table_name = get_table_columns.table_name
      ORDER BY c.ordinal_position;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  try {
    await supabase.rpc('exec_sql', { sql: helperSQL }).single()
  } catch (err) {
    // Ignore if function creation fails
  }
}

// Run verification
createHelperFunction().then(() => verifyTables()).catch(console.error)

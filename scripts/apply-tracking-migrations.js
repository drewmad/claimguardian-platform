#!/usr/bin/env node

/**
 * Apply user tracking migrations directly via Supabase client
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQLFile(filePath, description) {
  try {
    console.log(`\n📝 ${description}...`)
    const sql = await fs.readFile(filePath, 'utf8')
    
    // Split by semicolons but preserve those within strings
    const statements = sql
      .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    let successCount = 0
    let errorCount = 0
    
    for (const statement of statements) {
      try {
        // Skip empty statements
        if (!statement || statement.match(/^\s*$/)) continue
        
        // Execute the statement
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        }).single()
        
        if (error) {
          // Try direct execution for non-RPC statements
          const { error: directError } = await supabase
            .from('_exec')
            .insert({ sql: statement + ';' })
          
          if (directError) {
            console.error(`❌ Failed to execute statement: ${directError.message}`)
            console.error(`   Statement: ${statement.substring(0, 100)}...`)
            errorCount++
          } else {
            successCount++
          }
        } else {
          successCount++
        }
      } catch (err) {
        console.error(`❌ Error executing statement: ${err.message}`)
        errorCount++
      }
    }
    
    if (errorCount === 0) {
      console.log(`✅ ${description} completed successfully (${successCount} statements)`)
    } else {
      console.log(`⚠️  ${description} completed with errors (${successCount} success, ${errorCount} errors)`)
    }
    
    return { success: errorCount === 0, successCount, errorCount }
  } catch (error) {
    console.error(`❌ Failed to read or execute ${filePath}: ${error.message}`)
    return { success: false, successCount: 0, errorCount: 1 }
  }
}

async function applyMigrations() {
  console.log('🚀 Applying User Tracking Migrations\n')
  
  const migrations = [
    {
      file: path.join(__dirname, '..', 'supabase', 'migrations', '20250130_comprehensive_user_tracking.sql'),
      description: 'Comprehensive User Tracking Tables'
    },
    {
      file: path.join(__dirname, '..', 'supabase', 'migrations', '20250130_enhance_user_profiles.sql'),
      description: 'Enhanced User Profiles'
    }
  ]
  
  let totalSuccess = 0
  let totalErrors = 0
  
  for (const migration of migrations) {
    const result = await executeSQLFile(migration.file, migration.description)
    totalSuccess += result.successCount
    totalErrors += result.errorCount
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 Migration Summary:')
  console.log(`   ✅ Successful statements: ${totalSuccess}`)
  console.log(`   ❌ Failed statements: ${totalErrors}`)
  console.log('='.repeat(50))
  
  if (totalErrors === 0) {
    console.log('\n🎉 All migrations applied successfully!')
    console.log('\n🧪 Run the test script to verify:')
    console.log('   node scripts/test-signup-tracking.js')
  } else {
    console.log('\n⚠️  Some migrations failed. This might be because:')
    console.log('   1. Tables/columns already exist (safe to ignore)')
    console.log('   2. RLS policies already exist (safe to ignore)')
    console.log('   3. Actual errors (check the output above)')
    console.log('\n💡 Try running the test script to see what\'s working:')
    console.log('   node scripts/test-signup-tracking.js')
  }
}

// Alternative approach: Direct SQL execution
async function directSQLApproach() {
  console.log('\n🔧 Using direct SQL approach...\n')
  
  // First, let's check what tables already exist
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', [
      'user_tracking', 
      'user_preferences', 
      'user_sessions',
      'marketing_attribution',
      'user_devices',
      'consent_audit_log'
    ])
  
  if (!tablesError && tables) {
    console.log('📋 Existing tables:')
    tables.forEach(t => console.log(`   ✓ ${t.table_name}`))
    
    const existingTables = tables.map(t => t.table_name)
    const requiredTables = [
      'user_tracking', 
      'user_preferences', 
      'user_sessions',
      'marketing_attribution',
      'user_devices',
      'consent_audit_log'
    ]
    
    const missingTables = requiredTables.filter(t => !existingTables.includes(t))
    
    if (missingTables.length === 0) {
      console.log('\n✅ All tracking tables already exist!')
      
      // Check if user_profiles has the enhanced columns
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'user_profiles')
        .in('column_name', ['signup_completed_at', 'signup_ip_address', 'signup_device_fingerprint'])
      
      if (!columnsError && columns) {
        if (columns.length === 3) {
          console.log('✅ User profiles table is already enhanced!')
          console.log('\n🎉 All migrations appear to be already applied!')
        } else {
          console.log('\n⚠️  User profiles table needs enhancement')
          console.log('   Please run the second migration manually in Supabase dashboard')
        }
      }
    } else {
      console.log('\n❌ Missing tables:', missingTables.join(', '))
      console.log('   Please apply the migrations manually in Supabase dashboard')
    }
  }
}

// Main execution
async function main() {
  // Try the direct approach first to check status
  await directSQLApproach()
  
  // Ask user if they want to proceed with migration attempt
  console.log('\n❓ The migrations may need to be applied manually.')
  console.log('   Visit: https://app.supabase.com/project/tmlrvecuwgppbaynesji/sql/new')
  console.log('   And run the SQL from:')
  console.log('   - supabase/migrations/20250130_comprehensive_user_tracking.sql')
  console.log('   - supabase/migrations/20250130_enhance_user_profiles.sql')
}

main().catch(console.error)
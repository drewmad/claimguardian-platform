#!/usr/bin/env node

/**
 * Check Supabase connection and database status
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

console.log('🔍 Checking Supabase connection...')
console.log('📍 URL:', supabaseUrl)
console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkConnection() {
  try {
    // Check if we can connect to the database
    console.log('\n📊 Testing database connection...')
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      
      // Try to check if the table exists
      const { error: testError } = await supabase
        .from('test_connection')
        .select('*')
        .limit(1)
      
      if (testError?.message?.includes('does not exist')) {
        console.log('ℹ️  Database is accessible but tables might not be set up')
      }
    } else {
      console.log('✅ Database connection successful!')
    }
    
    // Check auth configuration
    console.log('\n🔐 Checking auth configuration...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ Auth check failed:', authError.message)
    } else {
      console.log('✅ Auth service is accessible')
      console.log('   Session:', authData.session ? 'Active' : 'None')
    }
    
    // Check if email confirmations are required
    console.log('\n📧 Testing email confirmation settings...')
    try {
      const testEmail = `check-${Date.now()}@example.com`
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'CheckPassword123!'
      })
      
      if (signUpError) {
        console.log('❌ Could not test email settings:', signUpError.message)
      } else if (signUpData?.user) {
        const requiresConfirmation = !signUpData.user.email_confirmed_at
        console.log('✅ Email confirmation required:', requiresConfirmation ? 'Yes' : 'No')
        
        // Clean up test user
        await supabase.auth.admin?.deleteUser?.(signUpData.user.id).catch(() => {})
      }
    } catch (err) {
      console.log('⚠️  Could not test email settings')
    }
    
    // List available tables
    console.log('\n📋 Checking available tables...')
    const tableNames = ['profiles', 'user_profiles', 'properties', 'claims', 'error_logs']
    
    for (const tableName of tableNames) {
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0)
      
      if (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`)
      } else {
        console.log(`   ✅ ${tableName}: Accessible`)
      }
    }
    
    console.log('\n✅ Connection check complete!')
    
  } catch (err) {
    console.error('\n❌ Unexpected error:', err)
  }
}

// Run the check
checkConnection()
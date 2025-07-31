#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
config({ path: join(__dirname, '../apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  const email = 'test@claimguardian.com'
  const password = 'TestPass123!'
  
  console.log('Creating test user...')
  
  // First, try to delete existing user with this email
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(u => u.email === email)
  
  if (existingUser) {
    console.log('Deleting existing test user...')
    await supabase.auth.admin.deleteUser(existingUser.id)
  }
  
  // Create new user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      firstName: 'Test',
      lastName: 'User'
    }
  })
  
  if (error) {
    console.error('Error creating user:', error.message)
    return
  }
  
  console.log('✅ Test user created successfully!')
  console.log('📧 Email:', email)
  console.log('🔑 Password:', password)
  console.log('\nYou can now log in at http://localhost:3001/test-login')
}

createTestUser().catch(console.error)
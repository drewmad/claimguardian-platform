#!/usr/bin/env tsx

/**
 * Debug legal documents access issue
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, anonKey)

async function debugAccess() {
  console.log('🔍 Debugging legal documents access...\n')
  
  // Test 1: Direct query
  console.log('Test 1: Direct query to legal_documents')
  const { data: test1, error: error1 } = await supabase
    .from('legal_documents')
    .select('id, type, title')
    .eq('is_active', true)
    .eq('requires_acceptance', true)
    .order('type')
  
  console.log('Result:', { data: test1?.length, error: error1 })
  
  // Test 2: Check auth state
  console.log('\nTest 2: Check auth state')
  const { data: { session } } = await supabase.auth.getSession()
  console.log('Session:', session ? 'Authenticated' : 'Anonymous')
  
  // Test 3: Try without filters
  console.log('\nTest 3: Query without filters')
  const { data: test3, error: error3 } = await supabase
    .from('legal_documents')
    .select('id')
    .limit(1)
  
  console.log('Result:', { data: test3?.length, error: error3 })
  
  // Test 4: Check if it's a specific column issue
  console.log('\nTest 4: Select only id column')
  const { data: test4, error: error4 } = await supabase
    .from('legal_documents')
    .select('id')
    .eq('is_active', true)
  
  console.log('Result:', { data: test4?.length, error: error4 })
}

debugAccess().catch(console.error)
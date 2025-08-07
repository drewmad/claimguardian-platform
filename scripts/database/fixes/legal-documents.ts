#!/usr/bin/env tsx

/**
 * Fix legal documents loading error by ensuring seed data exists
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAndFixLegalDocuments() {
  console.log('🔍 Checking legal documents...')

  try {
    // First, check if legal documents exist
    const { data: existingDocs, error: checkError } = await supabase
      .from('legal_documents')
      .select('id, type, version, title, is_active')

    if (checkError) {
      console.error('❌ Error checking legal documents:', checkError.message)

      // Check if table exists
      if (checkError.message.includes('relation') && checkError.message.includes('does not exist')) {
        console.error('❌ The legal_documents table does not exist!')
        console.log('💡 Run the database migrations first:')
        console.log('   npx supabase db push')
        return
      }
      throw checkError
    }

    console.log(`📊 Found ${existingDocs?.length || 0} total legal documents`)
    const activeDocs = existingDocs?.filter(doc => doc.is_active) || []
    console.log(`📊 Active documents: ${activeDocs.length}`)

    if (activeDocs.length === 0) {
      console.log('⚠️  No active legal documents found. Inserting seed data...')

      const documents = [
        {
          type: 'privacy_policy',
          version: '1.0.0',
          title: 'Privacy Policy',
          slug: 'privacy-policy',
          content: 'Full privacy policy content available at /legal/privacy-policy',
          summary: 'We respect your privacy and protect your personal data. This policy explains how we collect, use, and safeguard your information.',
          effective_date: new Date().toISOString().split('T')[0],
          sha256_hash: 'privacy_policy_v1_0_0_hash_' + Date.now(),
          is_active: true,
          requires_acceptance: true
        },
        {
          type: 'terms_of_service',
          version: '1.0.0',
          title: 'Terms of Service',
          slug: 'terms-of-service',
          content: 'Full terms of service content available at /legal/terms-of-service',
          summary: 'Terms and conditions for using ClaimGuardian. By using our service, you agree to these terms.',
          effective_date: new Date().toISOString().split('T')[0],
          sha256_hash: 'terms_of_service_v1_0_0_hash_' + Date.now(),
          is_active: true,
          requires_acceptance: true
        },
        {
          type: 'ai_use_agreement',
          version: '1.0.0',
          title: 'AI Use Agreement',
          slug: 'ai-use-agreement',
          content: 'Full AI use agreement content available at /legal/ai-use-agreement',
          summary: 'How we use AI to help with your insurance claims. This agreement covers AI features, data processing, and limitations.',
          effective_date: new Date().toISOString().split('T')[0],
          sha256_hash: 'ai_use_agreement_v1_0_0_hash_' + Date.now(),
          is_active: true,
          requires_acceptance: true
        }
      ]

      const { data: insertedDocs, error: insertError } = await supabase
        .from('legal_documents')
        .insert(documents)
        .select()

      if (insertError) {
        console.error('❌ Error inserting legal documents:', insertError.message)
        console.error('Details:', insertError)
        throw insertError
      }

      console.log('✅ Successfully inserted', insertedDocs?.length || 0, 'legal documents')

      // Verify the documents were created
      const { data: verifyDocs, error: verifyError } = await supabase
        .from('legal_documents')
        .select('id, type, version, title')
        .eq('is_active', true)

      if (verifyError) {
        console.error('❌ Error verifying legal documents:', verifyError)
        throw verifyError
      }

      console.log('✅ Verification complete. Active documents:')
      verifyDocs?.forEach(doc => {
        console.log(`   - ${doc.title} (${doc.type} v${doc.version})`)
      })
    } else {
      console.log('✅ Active legal documents already exist:')
      activeDocs.forEach(doc => {
        console.log(`   - ${doc.title} (${doc.type} v${doc.version})`)
      })
    }

    // Also check if RLS is causing issues
    console.log('\n🔍 Checking RLS policies...')
    const { data: testQuery, error: rlsError } = await supabase
      .from('legal_documents')
      .select('id')
      .eq('is_active', true)
      .eq('requires_acceptance', true)
      .limit(1)

    if (rlsError) {
      console.error('⚠️  RLS might be blocking access:', rlsError.message)
      console.log('💡 Consider checking RLS policies for the legal_documents table')
    } else {
      console.log('✅ RLS check passed')
    }

  } catch (error) {
    console.error('❌ Failed to fix legal documents:', error)
    process.exit(1)
  }
}

// Run the fix
console.log('🚀 Legal Documents Fix Script')
console.log('============================')
console.log('Environment:', process.env.NODE_ENV || 'development')
console.log('Supabase URL:', supabaseUrl)
console.log('')

checkAndFixLegalDocuments()
  .then(() => {
    console.log('\n✅ Legal documents check complete')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

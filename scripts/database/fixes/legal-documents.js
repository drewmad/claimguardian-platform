#!/usr/bin/env node

/**
 * Fix legal documents loading error by ensuring seed data exists
 */

import { createServiceRoleClient } from '@claimguardian/db'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function checkAndFixLegalDocuments() {
  console.log('🔍 Checking legal documents...')

  const supabase = createServiceRoleClient()

  try {
    // First, check if legal documents exist
    const { data: existingDocs, error: checkError } = await supabase
      .from('legal_documents')
      .select('id, type, version, title')
      .eq('is_active', true)

    if (checkError) {
      console.error('❌ Error checking legal documents:', checkError)
      throw checkError
    }

    console.log(`📊 Found ${existingDocs?.length || 0} active legal documents`)

    if (!existingDocs || existingDocs.length === 0) {
      console.log('⚠️  No legal documents found. Applying seed data...')

      // Read and execute the seed SQL
      const seedPath = join(__dirname, '..', 'supabase', 'seeds', 'apply_legal_documents.sql')
      const seedSQL = readFileSync(seedPath, 'utf8')

      // Execute the seed SQL
      const { error: seedError } = await supabase.rpc('exec_sql', {
        sql: seedSQL
      })

      if (seedError) {
        // If exec_sql doesn't exist, try direct insert
        console.log('🔄 Using direct insert method...')

        const documents = [
          {
            type: 'privacy_policy',
            version: '1.0.0',
            title: 'Privacy Policy',
            slug: 'privacy-policy',
            content: 'Full privacy policy content available at /legal/privacy-policy',
            summary: 'We respect your privacy and protect your personal data. This policy explains how we collect, use, and safeguard your information.',
            effective_date: new Date().toISOString().split('T')[0],
            sha256_hash: 'privacy_policy_v1_hash',
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
            sha256_hash: 'terms_of_service_v1_hash',
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
            sha256_hash: 'ai_use_agreement_v1_hash',
            is_active: true,
            requires_acceptance: true
          }
        ]

        const { data: insertedDocs, error: insertError } = await supabase
          .from('legal_documents')
          .insert(documents)
          .select()

        if (insertError) {
          console.error('❌ Error inserting legal documents:', insertError)
          throw insertError
        }

        console.log('✅ Successfully inserted', insertedDocs.length, 'legal documents')
      }

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
      verifyDocs.forEach(doc => {
        console.log(`   - ${doc.title} (${doc.type} v${doc.version})`)
      })
    } else {
      console.log('✅ Legal documents already exist:')
      existingDocs.forEach(doc => {
        console.log(`   - ${doc.title} (${doc.type} v${doc.version})`)
      })
    }

  } catch (error) {
    console.error('❌ Failed to fix legal documents:', error)
    process.exit(1)
  }
}

// Run the fix
checkAndFixLegalDocuments()
  .then(() => {
    console.log('✅ Legal documents check complete')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

#!/usr/bin/env tsx

/**
 * Update legal documents with full content
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const documentContent = {
  'privacy_policy': `# Privacy Policy

**Last Updated: ${new Date().toLocaleDateString()}**

## Introduction

ClaimGuardian respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, disclose, and safeguard your information.

## Information We Collect

### Personal Information
- Name, email address, and phone number
- Property address and details  
- Insurance policy information
- Claim documentation and photos

### Automatically Collected Information
- Device information and IP address
- Usage data and analytics
- Cookies and tracking technologies
- Location data (with permission)

## How We Use Your Information

We use your information to:
- Provide and improve our services
- Assist with insurance claim management
- Generate AI-powered insights
- Communicate about your claims
- Comply with legal obligations

## Data Security

We implement industry-standard security measures including encryption, access controls, and regular security audits.

## Your Rights

You have the right to access, correct, delete, export your data, and control AI processing.

## Contact Us

Email: privacy@claimguardian.com`,

  'terms_of_service': `# Terms of Service

**Effective Date: ${new Date().toLocaleDateString()}**

## 1. Acceptance of Terms

By using ClaimGuardian's services, you agree to these Terms of Service.

## 2. Description of Services

ClaimGuardian provides AI-powered insurance claim assistance, document management, and property documentation tools.

## 3. User Accounts

You must be 18 or older, provide accurate information, and maintain account security.

## 4. Acceptable Use

Do not use our services for illegal purposes, fraud, or to harm others.

## 5. AI Services

Our AI provides assistance but is not a substitute for professional advice. Verify all AI-generated content.

## 6. Privacy

Your use is subject to our Privacy Policy. We protect your data and don't sell it.

## 7. Fees

Subscription plans with automatic renewal. Free trial available.

## 8. Disclaimers

Services provided "AS IS". We don't provide legal or insurance advice.

## 9. Contact

Email: legal@claimguardian.com`,

  'ai_use_agreement': `# AI Use Agreement

**Effective Date: ${new Date().toLocaleDateString()}**

## Introduction

This agreement governs your use of ClaimGuardian's AI features.

## 1. AI Services

We provide AI-powered features including Clara, Clarity Lite, Max, Sentinel, and document analysis.

## 2. Your Consent

By using AI features, you consent to automated processing and storage of AI interactions.

## 3. AI Limitations

AI suggestions are not guaranteed accurate. Not professional advice. Human verification required.

## 4. Responsible Use

Don't use AI for fraud or illegal purposes. We audit for bias and maintain transparency.

## 5. Data Privacy

Your data is encrypted and only used with consent. Opt-out of model improvement available.

## 6. Support

Email: ai-support@claimguardian.com

Remember: AI assists but human judgment remains essential.`
}

async function updateLegalContent() {
  console.log('📝 Updating legal document content...\n')
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    return
  }
  
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    
    // Update each document type
    for (const [type, content] of Object.entries(documentContent)) {
      console.log(`Updating ${type}...`)
      
      const { error } = await supabase
        .from('legal_documents')
        .update({ 
          content,
          updated_at: new Date().toISOString()
        })
        .eq('type', type)
        .eq('is_active', true)
      
      if (error) {
        console.error(`  ❌ Failed to update ${type}:`, error.message)
      } else {
        console.log(`  ✅ Successfully updated ${type}`)
      }
    }
    
    // Verify updates
    console.log('\n🔍 Verifying updates...')
    const { data, error } = await supabase
      .from('legal_documents')
      .select('type, title, content')
      .eq('is_active', true)
    
    if (data) {
      data.forEach(doc => {
        const hasContent = doc.content && doc.content.length > 100
        console.log(`  ${doc.type}: ${hasContent ? '✅ Has content' : '❌ Missing content'} (${doc.content?.length || 0} chars)`)
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

updateLegalContent().catch(console.error)
/**
 * Debug endpoint to test consent recording
 */
import { NextRequest, NextResponse } from 'next/server'

import { recordSignupConsent } from '@/actions/compliance-consent'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Debug consent request body:', JSON.stringify(body, null, 2))
    
    // Test consent data
    const testConsentData = {
      email: body.email || 'debug@test.com',
      gdprConsent: true,
      dataProcessingConsent: true,
      marketingConsent: false,
      termsAccepted: true,
      privacyAccepted: true,
      ageVerified: true,
      aiProcessingConsent: true,
      deviceFingerprint: 'debug-fingerprint'
    }
    
    console.log('Calling recordSignupConsent with:', JSON.stringify(testConsentData, null, 2))
    
    const result = await recordSignupConsent(testConsentData)
    
    console.log('recordSignupConsent result:', JSON.stringify(result, null, 2))
    
    return NextResponse.json({
      success: true,
      testData: testConsentData,
      result: result,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Debug consent error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
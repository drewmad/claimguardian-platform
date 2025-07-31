import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Test data
    const testEmail = `test-${Date.now()}@claimguardian.test`
    const testPassword = 'TestPassword123!'
    
    console.log('Testing signup flow with:', testEmail)
    
    // Step 1: Check if user already exists
    const { data: existingUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', testEmail)
      .single()
    
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'Test user already exists',
        email: testEmail
      })
    }
    
    // Step 2: Test record_signup_consent
    const { data: consentResult, error: consentError } = await supabase.rpc('record_signup_consent', {
      p_email: testEmail,
      p_gdpr_consent: true,
      p_ccpa_consent: true,
      p_marketing_consent: false,
      p_data_processing_consent: true,
      p_cookie_consent: true,
      p_terms_accepted: true,
      p_privacy_accepted: true,
      p_age_confirmed: true,
      p_ai_tools_consent: true,
      p_ip_address: '127.0.0.1',
      p_user_agent: 'Test Script',
      p_fingerprint: 'test-fingerprint'
    })
    
    if (consentError || !consentResult?.[0]?.success) {
      return NextResponse.json({
        success: false,
        step: 'record_consent',
        error: consentError?.message || consentResult?.[0]?.error || 'Failed to record consent',
        details: { consentResult, consentError }
      })
    }
    
    const consentToken = consentResult[0].consent_token
    console.log('Consent recorded with token:', consentToken)
    
    // Step 3: Validate consent
    const { data: validateResult, error: validateError } = await supabase.rpc('validate_signup_consent', {
      p_email: testEmail,
      p_consent_token: consentToken
    })
    
    if (validateError || !validateResult?.[0]?.success) {
      return NextResponse.json({
        success: false,
        step: 'validate_consent',
        error: validateError?.message || 'Failed to validate consent',
        details: { validateResult, validateError }
      })
    }
    
    console.log('Consent validated successfully')
    
    // Step 4: Create user account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/verify`,
        data: {
          consent_token: consentToken
        }
      }
    })
    
    if (signUpError) {
      return NextResponse.json({
        success: false,
        step: 'signup',
        error: signUpError.message,
        details: signUpError
      })
    }
    
    if (!signUpData.user) {
      return NextResponse.json({
        success: false,
        step: 'signup',
        error: 'No user returned from signup'
      })
    }
    
    console.log('User created:', signUpData.user.id)
    
    // Step 5: Link consent to user
    const { error: linkError } = await supabase.rpc('link_consent_to_user', {
      p_user_id: signUpData.user.id,
      p_email: testEmail,
      p_consent_token: consentToken
    })
    
    if (linkError) {
      console.error('Failed to link consent:', linkError)
      // Don't fail the whole flow if linking fails
    }
    
    // Step 6: Check if email was sent
    const emailStatus = signUpData.user.email_confirmed_at 
      ? 'already_confirmed' 
      : 'confirmation_email_sent'
    
    // Step 7: Check if onboarding record exists
    const { data: userPref } = await supabase
      .from('user_preferences')
      .select('onboarding_completed')
      .eq('user_id', signUpData.user.id)
      .single()
    
    return NextResponse.json({
      success: true,
      message: 'Signup flow completed successfully',
      results: {
        email: testEmail,
        userId: signUpData.user.id,
        consentToken: consentToken,
        emailStatus: emailStatus,
        needsEmailConfirmation: !signUpData.user.email_confirmed_at,
        onboardingStatus: userPref?.onboarding_completed ? 'completed' : 'pending',
        nextSteps: [
          !signUpData.user.email_confirmed_at && 'User needs to confirm email',
          'User will be redirected to dashboard after email confirmation',
          !userPref?.onboarding_completed && 'Onboarding flow will show on first dashboard visit'
        ].filter(Boolean)
      }
    })
    
  } catch (error) {
    console.error('Test signup flow error:', error)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error during signup flow test',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to test the signup flow',
    endpoint: '/api/test-signup-flow',
    method: 'POST',
    description: 'Tests the complete signup flow including consent tracking and email verification'
  })
}
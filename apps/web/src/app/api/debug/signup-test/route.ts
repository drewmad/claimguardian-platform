/**
 * @fileMetadata
 * @purpose Debug endpoint to test signup_consents table permissions
 * @owner backend-team
 * @status active
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test 1: Check if table exists and permissions
    const { data: tableCheck, error: tableError } = await supabase
      .from('signup_consents')
      .select('*')
      .limit(1)
    
    // Test 2: Try to insert a test record
    const testData = {
      email: 'test@example.com',
      terms_accepted: true,
      privacy_accepted: true,
      marketing_accepted: false,
      consent_timestamp: new Date().toISOString(),
      ip_address: '127.0.0.1',
      user_agent: 'Debug Test'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('signup_consents')
      .insert(testData)
      .select()
    
    // Test 3: Try to read the inserted record
    const { data: readData, error: readError } = await supabase
      .from('signup_consents')
      .select('*')
      .eq('email', 'test@example.com')
      .limit(1)
    
    // Test 4: Clean up - delete test record
    let cleanupResult = null
    if (insertData && insertData.length > 0) {
      const { error: deleteError } = await supabase
        .from('signup_consents')
        .delete()
        .eq('email', 'test@example.com')
      
      cleanupResult = { success: !deleteError, error: deleteError?.message }
    }
    
    return NextResponse.json({
      status: 'debug-signup-test',
      timestamp: new Date().toISOString(),
      tests: {
        tableAccess: {
          success: !tableError,
          error: tableError?.message,
          recordCount: tableCheck?.length || 0
        },
        insertTest: {
          success: !insertError,
          error: insertError?.message,
          insertedId: insertData?.[0]?.id || null
        },
        readTest: {
          success: !readError,
          error: readError?.message,
          recordFound: readData?.length > 0
        },
        cleanup: cleanupResult
      },
      summary: {
        allTestsPassed: !tableError && !insertError && !readError,
        permissionsWorking: !insertError,
        tableAccessible: !tableError
      }
    })
  } catch (error) {
    console.error('Signup test error:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Simulate actual signup consent creation
    const testSignupData = {
      email: `test-${Date.now()}@example.com`,
      terms_accepted: true,
      privacy_accepted: true,
      marketing_accepted: true,
      consent_timestamp: new Date().toISOString(),
      ip_address: '127.0.0.1',
      user_agent: 'POST Debug Test',
      metadata: {
        test: true,
        timestamp: Date.now()
      }
    }
    
    const { data, error } = await supabase
      .from('signup_consents')
      .insert(testSignupData)
      .select()
    
    return NextResponse.json({
      status: 'signup-consent-test',
      timestamp: new Date().toISOString(),
      success: !error,
      error: error?.message,
      data: data?.[0] || null,
      testEmail: testSignupData.email
    })
  } catch (error) {
    console.error('POST signup test error:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
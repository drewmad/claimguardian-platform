import { NextResponse } from 'next/server'
import { logger } from "@/lib/logger/production-logger"

import { createClient } from '@/lib/supabase/server'
import { logger } from "@/lib/logger/production-logger"

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Create a test account
    const testEmail = `test-${Date.now()}@claimguardian.com`
    const testPassword = 'TestPass123!'
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          firstName: 'Test',
          lastName: 'User'
        }
      }
    })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // For test accounts, we can auto-confirm them using the service role
    // This bypasses email verification for testing
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      data.user!.id,
      { email_confirm: true }
    )
    
    if (confirmError) {
      logger.error('Failed to auto-confirm user:', confirmError)
    }
    
    return NextResponse.json({
      success: true,
      credentials: {
        email: testEmail,
        password: testPassword
      },
      message: 'Test account created and confirmed!'
    })
  } catch (error) {
    logger.error('Error creating test account:', error)
    return NextResponse.json({ error: 'Failed to create test account' }, { status: 500 })
  }
}
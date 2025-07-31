/**
 * @fileMetadata
 * @purpose Server actions for sending emails
 * @owner communications-team
 * @status active
 */

'use server'

import { sendEmail, sendEmailWithRateLimit } from '@/lib/email/resend'
import {
  getWelcomeEmail,
  getPasswordResetEmail,
  getEmailVerificationEmail,
  getClaimUpdateEmail,
  getPropertyEnrichmentEmail
} from '@/lib/email/templates'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(userId: string) {
  try {
    const supabase = await createClient()
    
    // Get user details
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      logger.error('Failed to get user profile for welcome email', { userId, error })
      return { success: false, error: 'User not found' }
    }

    const name = profile.first_name || profile.email.split('@')[0]
    const template = getWelcomeEmail(name)

    const result = await sendEmailWithRateLimit({
      to: profile.email,
      ...template,
      tags: [
        { name: 'type', value: 'welcome' },
        { name: 'userId', value: userId }
      ]
    }, userId)

    if (result.success) {
      // Track email sent
      await supabase.from('email_logs').insert({
        user_id: userId,
        email_type: 'welcome',
        recipient: profile.email,
        status: 'sent',
        resend_id: result.id
      })
    }

    return result

  } catch (error) {
    logger.error('Error sending welcome email', { userId }, error as Error)
    return { success: false, error: 'Failed to send welcome email' }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetToken: string) {
  try {
    const supabase = await createClient()
    
    // Get user details
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, first_name')
      .eq('email', email)
      .single()

    if (error || !profile) {
      // Don't reveal if email exists
      logger.warn('Password reset requested for non-existent email', { email })
      return { success: true } // Return success anyway for security
    }

    const name = profile.first_name || email.split('@')[0]
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`
    const template = getPasswordResetEmail(name, resetLink)

    const result = await sendEmailWithRateLimit({
      to: email,
      ...template,
      tags: [
        { name: 'type', value: 'password_reset' },
        { name: 'userId', value: profile.id }
      ]
    }, profile.id)

    if (result.success) {
      // Track email sent
      await supabase.from('email_logs').insert({
        user_id: profile.id,
        email_type: 'password_reset',
        recipient: email,
        status: 'sent',
        resend_id: result.id
      })
    }

    return result

  } catch (error) {
    logger.error('Error sending password reset email', { email }, error as Error)
    return { success: false, error: 'Failed to send password reset email' }
  }
}

/**
 * Send email verification
 */
export async function sendVerificationEmail(userId: string, email: string, token: string) {
  try {
    const supabase = await createClient()
    
    // Get user name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', userId)
      .single()

    const name = profile?.first_name || email.split('@')[0]
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`
    const template = getEmailVerificationEmail(name, verificationLink)

    const result = await sendEmailWithRateLimit({
      to: email,
      ...template,
      tags: [
        { name: 'type', value: 'email_verification' },
        { name: 'userId', value: userId }
      ]
    }, userId)

    if (result.success) {
      // Track email sent
      await supabase.from('email_logs').insert({
        user_id: userId,
        email_type: 'email_verification',
        recipient: email,
        status: 'sent',
        resend_id: result.id
      })
    }

    return result

  } catch (error) {
    logger.error('Error sending verification email', { userId, email }, error as Error)
    return { success: false, error: 'Failed to send verification email' }
  }
}

/**
 * Send claim status update email
 */
export async function sendClaimUpdateEmail({
  userId,
  claimId,
  claimNumber,
  status,
  message
}: {
  userId: string
  claimId: string
  claimNumber: string
  status: string
  message: string
}) {
  try {
    const supabase = await createClient()
    
    // Get user details
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      logger.error('Failed to get user profile for claim update', { userId, error })
      return { success: false, error: 'User not found' }
    }

    const name = profile.first_name || profile.email.split('@')[0]
    const template = getClaimUpdateEmail(name, claimNumber, status, message)

    const result = await sendEmail({
      to: profile.email,
      ...template,
      tags: [
        { name: 'type', value: 'claim_update' },
        { name: 'userId', value: userId },
        { name: 'claimId', value: claimId },
        { name: 'status', value: status }
      ]
    })

    if (result.success) {
      // Track email sent
      await supabase.from('email_logs').insert({
        user_id: userId,
        email_type: 'claim_update',
        recipient: profile.email,
        status: 'sent',
        resend_id: result.id,
        metadata: { claim_id: claimId, claim_status: status }
      })
    }

    return result

  } catch (error) {
    logger.error('Error sending claim update email', { userId, claimId }, error as Error)
    return { success: false, error: 'Failed to send claim update email' }
  }
}

/**
 * Send property enrichment complete email
 */
export async function sendPropertyEnrichmentEmail({
  userId,
  propertyId,
  propertyAddress,
  enrichmentData
}: {
  userId: string
  propertyId: string
  propertyAddress: string
  enrichmentData: {
    floodZone: string
    elevation: number
    hurricaneZone: string
    protectionClass: number
  }
}) {
  try {
    const supabase = await createClient()
    
    // Get user details
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      logger.error('Failed to get user profile for enrichment email', { userId, error })
      return { success: false, error: 'User not found' }
    }

    const name = profile.first_name || profile.email.split('@')[0]
    const template = getPropertyEnrichmentEmail(name, propertyAddress, enrichmentData)

    const result = await sendEmail({
      to: profile.email,
      ...template,
      tags: [
        { name: 'type', value: 'property_enrichment' },
        { name: 'userId', value: userId },
        { name: 'propertyId', value: propertyId }
      ]
    })

    if (result.success) {
      // Track email sent
      await supabase.from('email_logs').insert({
        user_id: userId,
        email_type: 'property_enrichment',
        recipient: profile.email,
        status: 'sent',
        resend_id: result.id,
        metadata: { property_id: propertyId }
      })
    }

    return result

  } catch (error) {
    logger.error('Error sending property enrichment email', { userId, propertyId }, error as Error)
    return { success: false, error: 'Failed to send property enrichment email' }
  }
}
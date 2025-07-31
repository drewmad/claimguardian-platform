/**
 * @fileMetadata
 * @purpose Server action to track legal document acceptance
 * @owner compliance-team
 * @dependencies ["@supabase/supabase-js"]
 * @exports ["trackLegalAcceptance"]
 * @complexity medium
 * @tags ["legal", "compliance", "tracking"]
 * @status active
 */

'use server'

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

interface LegalAcceptanceData {
  userId: string
  documentType: 'terms' | 'privacy' | 'gdpr' | 'marketing' | 'data_processing'
  accepted: boolean
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
  sessionId?: string
  pageUrl?: string
  consentMethod?: 'checkbox' | 'button' | 'modal' | 'banner'
}

export async function trackLegalAcceptance(data: LegalAcceptanceData) {
  try {
    const supabase = await createClient()
    
    // Record in user_consents table
    const { error: consentError } = await supabase
      .from('user_consents')
      .insert({
        user_id: data.userId,
        action: data.accepted ? 'accepted' : 'rejected',
        consented_at: new Date().toISOString(),
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        device_fingerprint: data.deviceFingerprint,
        session_id: data.sessionId,
        consent_method: data.consentMethod || 'checkbox',
        is_current: true,
        page_url: data.pageUrl,
        metadata: {
          document_type: data.documentType,
          timestamp: new Date().toISOString(),
          source: 'signup_flow'
        }
      })

    if (consentError) {
      console.warn('Failed to record consent:', consentError)
      // Don't throw - this shouldn't break signup
    }

    // Also update user preferences for easy querying
    try {
      const { error: prefError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: data.userId,
          [`${data.documentType}_consent`]: data.accepted,
          updated_at: new Date().toISOString()
        })
      
      if (prefError) {
        console.warn('Failed to update user preferences:', prefError)
      }
    } catch (prefUpdateError) {
      console.warn('User preferences update failed:', prefUpdateError)
    }

    logger.info('Legal acceptance tracked', {
      userId: data.userId,
      documentType: data.documentType,
      accepted: data.accepted
    })

    return { success: true }
  } catch (error) {
    logger.error('Failed to track legal acceptance', { userId: data.userId }, error as Error)
    
    // Return success to avoid breaking signup flow
    return { success: true, warning: 'Tracking failed but signup continued' }
  }
}

/**
 * Track multiple legal document acceptances at once (for signup)
 */
export async function trackSignupConsents(data: {
  userId: string
  consents: {
    gdpr: boolean
    dataProcessing: boolean
    marketing: boolean
  }
  metadata: {
    ipAddress?: string
    userAgent?: string
    deviceFingerprint?: string
    sessionId?: string
  }
}) {
  const promises = []
  
  // Track GDPR consent
  promises.push(trackLegalAcceptance({
    userId: data.userId,
    documentType: 'gdpr',
    accepted: data.consents.gdpr,
    ...data.metadata,
    consentMethod: 'checkbox'
  }))
  
  // Track data processing consent
  promises.push(trackLegalAcceptance({
    userId: data.userId,
    documentType: 'data_processing',
    accepted: data.consents.dataProcessing,
    ...data.metadata,
    consentMethod: 'checkbox'
  }))
  
  // Track marketing consent
  promises.push(trackLegalAcceptance({
    userId: data.userId,
    documentType: 'marketing',
    accepted: data.consents.marketing,
    ...data.metadata,
    consentMethod: 'checkbox'
  }))
  
  // Execute all tracking in parallel, but don't fail if any fail
  try {
    await Promise.allSettled(promises)
    return { success: true }
  } catch (error) {
    console.warn('Some consent tracking failed:', error)
    return { success: true, warning: 'Partial consent tracking failure' }
  }
}
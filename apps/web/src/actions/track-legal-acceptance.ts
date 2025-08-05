/**
 * @fileMetadata
 * @purpose "Server action to track legal document acceptance"
 * @owner compliance-team
 * @dependencies ["@supabase/supabase-js"]
 * @exports ["trackLegalAcceptance"]
 * @complexity medium
 * @tags ["legal", "compliance", "tracking"]
 * @status stable
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
    const supabase = await await createClient()
    
    // Use security definer function to track consent
    const { error: consentError } = await supabase.rpc('track_user_consent', {
      p_user_id: data.userId,
      p_action: data.accepted ? 'accepted' : 'rejected',
      p_consented_at: new Date().toISOString(),
      p_ip_address: data.ipAddress,
      p_user_agent: data.userAgent,
      p_device_fingerprint: data.deviceFingerprint,
      p_session_id: data.sessionId,
      p_consent_method: data.consentMethod || 'checkbox',
      p_page_url: data.pageUrl,
      p_metadata: {
        document_type: data.documentType,
        timestamp: new Date().toISOString(),
        source: 'signup_flow'
      }
    })

    if (consentError) {
      logger.warn('Failed to record consent', { error: consentError.message, code: consentError.code })
      // Don't throw - this shouldn't break signup
    }

    // Also update user preferences using security definer function
    try {
      interface UpdateConsentParams {
        p_user_id: string
        p_gdpr_consent?: boolean
        p_data_processing_consent?: boolean
        p_marketing_consent?: boolean
      }
      
      const updateParams: UpdateConsentParams = {
        p_user_id: data.userId
      }
      
      // Map document type to consent field
      switch (data.documentType) {
        case 'gdpr':
          updateParams.p_gdpr_consent = data.accepted
          break
        case 'data_processing':
          updateParams.p_data_processing_consent = data.accepted
          break
        case 'marketing':
          updateParams.p_marketing_consent = data.accepted
          break
      }
      
      const { error: prefError } = await supabase.rpc('update_user_consent_preferences', updateParams)
      
      if (prefError) {
        logger.warn('Failed to update user preferences', { error: prefError.message, code: prefError.code })
      }
    } catch (prefUpdateError) {
      logger.error('User preferences update failed', {}, prefUpdateError instanceof Error ? prefUpdateError : new Error(String(prefUpdateError)))
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
  try {
    const supabase = await await createClient()
    
    // Use security definer function to update all consent preferences at once
    const { error } = await supabase.rpc('update_user_consent_preferences', {
      p_user_id: data.userId,
      p_gdpr_consent: data.consents.gdpr,
      p_data_processing_consent: data.consents.dataProcessing,
      p_marketing_consent: data.consents.marketing
    })
    
    if (error) {
      logger.warn('Failed to update consent preferences', { error: error.message, code: error.code })
    }
    
    // Track individual consents for audit trail
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
    await Promise.allSettled(promises)
    return { success: true }
  } catch (error) {
    logger.error('Some consent tracking failed', {}, error instanceof Error ? error : new Error(String(error)))
    return { success: true, warning: 'Partial consent tracking failure' }
  }
}
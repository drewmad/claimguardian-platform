/**
 * @fileMetadata
 * @purpose "Compliance-grade consent management for GDPR/CCPA"
 * @owner compliance-team
 * @dependencies ["@supabase/supabase-js"]
 * @exports ["recordSignupConsent", "validateConsent", "linkConsentToUser"]
 * @complexity high
 * @tags ["compliance", "gdpr", "consent", "critical"]
 * @status stable
 */

'use server'

import { headers } from 'next/headers'

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { getClientIPAddress } from '@/lib/utils/server-ip-detection'

interface ConsentData {
  email: string
  gdprConsent: boolean
  dataProcessingConsent: boolean
  marketingConsent: boolean
  termsAccepted: boolean
  privacyAccepted: boolean
  ageVerified: boolean
  aiProcessingConsent?: boolean
  deviceFingerprint?: string
}

interface ConsentValidation {
  isValid: boolean
  hasRequiredConsents: boolean
  consentId?: string
  errorMessage?: string
}

interface ConsentRecord {
  success: boolean
  consentToken?: string
  errorMessage?: string
}

/**
 * Record consent BEFORE account creation (compliance requirement)
 * This must succeed before allowing signup to proceed
 */
export async function recordSignupConsent(data: ConsentData): Promise<ConsentRecord> {
  try {
    const supabase = await await createClient()
    const headersList = await headers()
    
    // Get IP and user agent for audit trail using resilient detection
    const ipAddress = await getClientIPAddress()
    const userAgent = headersList.get('user-agent') || 'unknown'
    
    // Validate all required consents
    if (!data.gdprConsent || !data.dataProcessingConsent || !data.termsAccepted || !data.privacyAccepted || !data.ageVerified) {
      logger.warn('Signup attempted without required consents', { 
        email: data.email,
        gdprConsent: data.gdprConsent,
        dataProcessingConsent: data.dataProcessingConsent,
        termsAccepted: data.termsAccepted,
        privacyAccepted: data.privacyAccepted,
        ageVerified: data.ageVerified
      })
      
      return {
        success: false,
        errorMessage: 'All required consents must be accepted'
      }
    }
    
    // Prepare parameters with type safety
    const rpcParams = {
      p_email: data.email,
      p_gdpr_consent: Boolean(data.gdprConsent),
      p_ccpa_consent: true, // Default to true
      p_marketing_consent: Boolean(data.marketingConsent),
      p_data_processing_consent: Boolean(data.dataProcessingConsent),
      p_cookie_consent: true, // Default to true
      p_terms_accepted: Boolean(data.termsAccepted),
      p_privacy_accepted: Boolean(data.privacyAccepted),
      p_age_confirmed: Boolean(data.ageVerified),
      p_ai_tools_consent: Boolean(data.aiProcessingConsent ?? true),
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_fingerprint: data.deviceFingerprint || null
    }
    
    logger.info('Calling record_signup_consent with params', { 
      email: data.email,
      params: rpcParams 
    })
    
    // Record consent using RPC function (works for anonymous users)
    const { data: result, error } = await supabase.rpc('record_signup_consent', rpcParams)
    
    if (error) {
      logger.error('Failed to record consent', { 
        email: data.email,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        params: rpcParams
      }, error)
      return {
        success: false,
        errorMessage: `Failed to record consent: ${error.message}`
      }
    }
    
    // Handle both array and direct object responses from RPC function
    const resultData = Array.isArray(result) ? result[0] : result
    
    logger.info('RPC function processed result', {
      email: data.email,
      resultData: resultData,
      wasArray: Array.isArray(result),
      hasSuccess: resultData?.success,
      hasToken: !!resultData?.consent_token,
      errorMessage: resultData?.error_message
    })
    
    if (!resultData?.success || !resultData?.consent_token) {
      logger.error('Consent recording returned invalid response', { 
        email: data.email,
        resultData,
        detailedResult: JSON.stringify(resultData, null, 2)
      })
      return {
        success: false,
        errorMessage: resultData?.error_message || 'Failed to record consent'
      }
    }
    
    logger.info('Consent recorded successfully', {
      email: data.email,
      consentToken: resultData.consent_token,
      gdprConsent: data.gdprConsent,
      dataProcessingConsent: data.dataProcessingConsent,
      marketingConsent: data.marketingConsent,
      termsAccepted: data.termsAccepted,
      privacyAccepted: data.privacyAccepted,
      ageVerified: data.ageVerified
    })
    
    return {
      success: true,
      consentToken: resultData.consent_token
    }
  } catch (error) {
    logger.error('Unexpected error recording consent', { email: data.email }, error as Error)
    return {
      success: false,
      errorMessage: 'An unexpected error occurred. Please try again.'
    }
  }
}

/**
 * Validate consent token before allowing signup
 */
export async function validateConsent(
  email: string, 
  consentToken: string
): Promise<ConsentValidation> {
  try {
    const supabase = await await createClient()
    
    const { data: result, error } = await supabase.rpc('validate_signup_consent', {
      p_email: email,
      p_consent_token: consentToken
    })
    
    if (error) {
      logger.error('Failed to validate consent', { email, consentToken }, error)
      return {
        isValid: false,
        hasRequiredConsents: false,
        errorMessage: 'Failed to validate consent'
      }
    }
    
    const validation = result?.[0]
    if (!validation) {
      return {
        isValid: false,
        hasRequiredConsents: false,
        errorMessage: 'Invalid consent validation response'
      }
    }
    
    return {
      isValid: validation.is_valid,
      hasRequiredConsents: validation.has_required_consents,
      consentId: validation.consent_id,
      errorMessage: validation.error_message
    }
  } catch (error) {
    logger.error('Unexpected error validating consent', { email, consentToken }, error as Error)
    return {
      isValid: false,
      hasRequiredConsents: false,
      errorMessage: 'Failed to validate consent'
    }
  }
}

/**
 * Link consent record to user after successful signup
 */
export async function linkConsentToUser(
  consentToken: string,
  userId: string
): Promise<boolean> {
  try {
    const supabase = await await createClient()
    
    const { data, error } = await supabase.rpc('link_consent_to_user', {
      p_consent_token: consentToken,
      p_user_id: userId
    })
    
    if (error) {
      logger.error('Failed to link consent to user', { userId, consentToken }, error)
      return false
    }
    
    logger.info('Consent linked to user successfully', { userId, consentToken })
    return data === true
  } catch (error) {
    logger.error('Unexpected error linking consent', { userId, consentToken }, error as Error)
    return false
  }
}
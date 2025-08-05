/**
 * @fileMetadata
 * @purpose "Server actions for comprehensive user tracking and data capture"
 * @dependencies ["@/lib","@claimguardian/db","next"]
 * @owner analytics-team
 * @status stable
 */
'use server'

import { createServiceRoleClient } from '@claimguardian/db'
import { headers } from 'next/headers'
import { logger } from '@/lib/logger'

interface TrackingData {
  userId: string
  eventType: string
  eventData?: Record<string, unknown>
  sessionId?: string
  deviceInfo?: {
    fingerprint?: string
    type?: string
    browser?: string
    os?: string
    screenResolution?: string
  }
  location?: {
    country?: string
    region?: string
    city?: string
    postalCode?: string
    timezone?: string
    latitude?: number
    longitude?: number
  }
  utm?: {
    source?: string
    medium?: string
    campaign?: string
    term?: string
    content?: string
  }
}

interface SignupTrackingData extends TrackingData {
  preferences: {
    gdprConsent: boolean
    marketingConsent: boolean
    dataProcessingConsent: boolean
    aiProcessingConsent: boolean
  }
  referrer?: string
  landingPage?: string
}

/**
 * Track user events with comprehensive data capture
 */
export async function trackUserEvent(data: TrackingData) {
  try {
    const supabase = createServiceRoleClient()
    const headersList = await headers()
    
    // Get IP and user agent from headers
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'
    
    // Parse user agent for device info
    const deviceInfo = parseUserAgent(userAgent)
    
    // Insert tracking record
    const { error } = await supabase
      .from('user_tracking')
      .insert({
        user_id: data.userId,
        event_type: data.eventType,
        event_data: data.eventData || {},
        session_id: data.sessionId,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_type: data.deviceInfo?.type || deviceInfo.deviceType,
        device_fingerprint: data.deviceInfo?.fingerprint,
        browser_name: data.deviceInfo?.browser || deviceInfo.browser,
        browser_version: deviceInfo.browserVersion,
        os_name: data.deviceInfo?.os || deviceInfo.os,
        os_version: deviceInfo.osVersion,
        screen_resolution: data.deviceInfo?.screenResolution,
        country_code: data.location?.country,
        region: data.location?.region,
        city: data.location?.city,
        postal_code: data.location?.postalCode,
        timezone: data.location?.timezone,
        latitude: data.location?.latitude,
        longitude: data.location?.longitude,
        utm_source: data.utm?.source,
        utm_medium: data.utm?.medium,
        utm_campaign: data.utm?.campaign,
        utm_term: data.utm?.term,
        utm_content: data.utm?.content,
        page_url: headersList.get('referer'),
        referrer_url: data.eventData?.referrer
      })
    
    if (error) {
      logger.error('Failed to track user event', { userId: data.userId, eventType: data.eventType }, error)
      throw error
    }
    
    logger.info('User event tracked', { userId: data.userId, eventType: data.eventType })
    return { success: true }
    
  } catch (error) {
    logger.error('Error tracking user event', { userId: data.userId }, error instanceof Error ? error : new Error(String(error)))
    throw new Error('Failed to track user event')
  }
}

/**
 * Capture comprehensive signup data
 */
export async function captureSignupData(data: SignupTrackingData) {
  try {
    const supabase = createServiceRoleClient()
    const headersList = await headers()
    
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'
    
    // Prepare tracking data object
    const trackingData = {
      ip_address: ipAddress,
      user_agent: userAgent,
      device_fingerprint: data.deviceInfo?.fingerprint,
      referrer: data.referrer,
      landing_page: data.landingPage,
      utm_source: data.utm?.source,
      utm_medium: data.utm?.medium,
      utm_campaign: data.utm?.campaign,
      country: data.location?.country,
      region: data.location?.region,
      city: data.location?.city,
      postal_code: data.location?.postalCode,
      timezone: data.location?.timezone,
      latitude: data.location?.latitude,
      longitude: data.location?.longitude
    }
    
    // Try to call the database function, but don't fail if it doesn't exist
    try {
      const { error: captureError } = await supabase
        .rpc('capture_signup_data', {
          p_user_id: data.userId,
          p_tracking_data: trackingData
        })
      
      if (captureError) {
        logger.error('[USER TRACKING] RPC function error', { error: captureError.message, code: captureError.code })
        // If RPC doesn't exist, fall back to direct insert
        if (captureError.message?.includes('function') || captureError.code === 'PGRST202') {
          logger.info('[USER TRACKING] Falling back to direct user_profiles update')
          
          // Update user profile directly
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
              user_id: data.userId,
              signup_ip_address: trackingData.ip_address,
              signup_user_agent: trackingData.user_agent,
              signup_device_fingerprint: trackingData.device_fingerprint,
              signup_referrer: trackingData.referrer,
              signup_landing_page: trackingData.landing_page,
              signup_utm_source: trackingData.utm_source,
              signup_utm_medium: trackingData.utm_medium,
              signup_utm_campaign: trackingData.utm_campaign,
              signup_country: trackingData.country,
              signup_region: trackingData.region,
              signup_city: trackingData.city,
              signup_postal_code: trackingData.postal_code,
              signup_timezone: trackingData.timezone,
              signup_latitude: trackingData.latitude,
              signup_longitude: trackingData.longitude,
              signup_timestamp: new Date().toISOString()
            })
          
          if (profileError) {
            logger.error('[USER TRACKING] Profile update error', { error: profileError.message, code: profileError.code })
            // Don't throw - this is not critical for signup
          }
        } else {
          // For other RPC errors, log but don't throw
          logger.error('Failed to capture signup data via RPC', { userId: data.userId, error: captureError.message, code: captureError.code })
        }
      }
    } catch (rpcError) {
      logger.error('[USER TRACKING] Unexpected RPC error', {}, rpcError instanceof Error ? rpcError : new Error(String(rpcError)))
      // Don't throw - continue with signup
    }
    
    // Create user preferences record with consent data using security definer function
    try {
      const { error: prefsError } = await supabase.rpc('create_user_preferences', {
        p_user_id: data.userId,
        p_preferences: {
          gdpr_consent: data.preferences.gdprConsent,
          gdpr_consent_date: data.preferences.gdprConsent ? new Date().toISOString() : null,
          marketing_emails: data.preferences.marketingConsent,
          data_processing_consent: data.preferences.dataProcessingConsent,
          data_processing_consent_date: data.preferences.dataProcessingConsent ? new Date().toISOString() : null,
          ai_processing_consent: data.preferences.aiProcessingConsent,
          ai_processing_consent_date: data.preferences.aiProcessingConsent ? new Date().toISOString() : null,
          timezone: data.location?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      })
      
      if (prefsError) {
        logger.error('[USER TRACKING] Preferences error', { error: prefsError.message, code: prefsError.code })
        // Try direct insert as fallback
        const { error: directError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: data.userId,
            gdpr_consent: data.preferences.gdprConsent,
            gdpr_consent_date: data.preferences.gdprConsent ? new Date().toISOString() : null,
            marketing_emails: data.preferences.marketingConsent,
            data_processing_consent: data.preferences.dataProcessingConsent,
            data_processing_consent_date: data.preferences.dataProcessingConsent ? new Date().toISOString() : null,
            ai_processing_consent: data.preferences.aiProcessingConsent,
            ai_processing_consent_date: data.preferences.aiProcessingConsent ? new Date().toISOString() : null,
            timezone: data.location?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
          })
        if (directError) {
          logger.error('[USER TRACKING] Direct preferences insert also failed', { error: directError.message, code: directError.code })
        }
        logger.error('Failed to create user preferences', { userId: data.userId, error: prefsError.message, code: prefsError.code })
        // Don't throw - preferences are not critical for signup
      }
    } catch (prefsError) {
      logger.error('[USER TRACKING] Unexpected preferences error', {}, prefsError instanceof Error ? prefsError : new Error(String(prefsError)))
      // Don't throw - continue with signup
    }
    
    // Log consent changes in audit log
    try {
      const consentTypes = [
        { type: 'gdpr_consent', value: data.preferences.gdprConsent },
        { type: 'marketing_consent', value: data.preferences.marketingConsent },
        { type: 'data_processing_consent', value: data.preferences.dataProcessingConsent },
        { type: 'ai_processing_consent', value: data.preferences.aiProcessingConsent }
      ]
      
      for (const consent of consentTypes) {
        if (consent.value) {
          const { error: auditError } = await supabase
            .from('consent_audit_log')
            .insert({
              user_id: data.userId,
              consent_type: consent.type,
              action: 'granted',
              new_value: true,
              ip_address: ipAddress,
              user_agent: userAgent,
              method: 'signup_form'
            })
          
          if (auditError) {
            logger.error('[USER TRACKING] Consent audit error', { error: auditError.message, code: auditError.code })
            // Don't throw - audit logging is not critical
          }
        }
      }
    } catch (auditError) {
      logger.error('[USER TRACKING] Unexpected audit error', {}, auditError instanceof Error ? auditError : new Error(String(auditError)))
      // Don't throw - continue with signup
    }
    
    logger.info('Signup data captured successfully', { userId: data.userId })
    return { success: true }
    
  } catch (error) {
    logger.error('Error capturing signup data', { userId: data.userId }, error instanceof Error ? error : new Error(String(error)))
    throw new Error('Failed to capture signup data')
  }
}

/**
 * Update user preferences with consent tracking
 */
export async function updateUserPreference(
  userId: string,
  preferenceName: string,
  value: boolean
) {
  try {
    const supabase = createServiceRoleClient()
    const headersList = await headers()
    
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown'
    
    // Call the database function to update preference and log consent
    const { error } = await supabase
      .rpc('update_user_preference', {
        p_user_id: userId,
        p_preference_name: preferenceName,
        p_preference_value: value,
        p_ip_address: ipAddress
      })
    
    if (error) {
      logger.error('Failed to update user preference', { userId, preferenceName }, error)
      throw error
    }
    
    logger.info('User preference updated', { userId, preferenceName, value })
    return { success: true }
    
  } catch (error) {
    logger.error('Error updating user preference', { userId, preferenceName }, error instanceof Error ? error : new Error(String(error)))
    throw new Error('Failed to update user preference')
  }
}

/**
 * Create or update user session
 */
export async function createUserSession(
  userId: string,
  sessionToken: string,
  expiresIn: number = 7200 // 2 hours default
) {
  try {
    const supabase = createServiceRoleClient()
    const headersList = await headers()
    
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'
    
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)
    
    const { error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent
      })
    
    if (error) {
      logger.error('Failed to create user session', { userId }, error)
      throw error
    }
    
    logger.info('User session created', { userId })
    return { success: true }
    
  } catch (error) {
    logger.error('Error creating user session', { userId }, error instanceof Error ? error : new Error(String(error)))
    throw new Error('Failed to create user session')
  }
}

/**
 * Parse user agent string for device information
 */
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase()
  
  // Detect device type
  let deviceType = 'desktop'
  if (/mobile|android|iphone|ipad|tablet/i.test(ua)) {
    deviceType = /tablet|ipad/i.test(ua) ? 'tablet' : 'mobile'
  }
  
  // Detect browser
  let browser = 'Unknown'
  let browserVersion = ''
  if (ua.includes('chrome/')) {
    browser = 'Chrome'
    browserVersion = ua.match(/chrome\/(\d+\.\d+)/)?.[1] || ''
  } else if (ua.includes('firefox/')) {
    browser = 'Firefox'
    browserVersion = ua.match(/firefox\/(\d+\.\d+)/)?.[1] || ''
  } else if (ua.includes('safari/') && !ua.includes('chrome')) {
    browser = 'Safari'
    browserVersion = ua.match(/version\/(\d+\.\d+)/)?.[1] || ''
  } else if (ua.includes('edge/')) {
    browser = 'Edge'
    browserVersion = ua.match(/edge\/(\d+\.\d+)/)?.[1] || ''
  }
  
  // Detect OS
  let os = 'Unknown'
  let osVersion = ''
  if (ua.includes('windows')) {
    os = 'Windows'
    if (ua.includes('windows nt 10')) osVersion = '10'
    else if (ua.includes('windows nt 11')) osVersion = '11'
  } else if (ua.includes('mac os')) {
    os = 'macOS'
    osVersion = ua.match(/mac os x (\d+[._]\d+)/)?.[1]?.replace('_', '.') || ''
  } else if (ua.includes('android')) {
    os = 'Android'
    osVersion = ua.match(/android (\d+\.\d+)/)?.[1] || ''
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS'
    osVersion = ua.match(/os (\d+[._]\d+)/)?.[1]?.replace('_', '.') || ''
  } else if (ua.includes('linux')) {
    os = 'Linux'
  }
  
  return {
    deviceType,
    browser,
    browserVersion,
    os,
    osVersion
  }
}

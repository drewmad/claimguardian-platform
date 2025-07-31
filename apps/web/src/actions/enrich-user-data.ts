/**
 * @fileMetadata  
 * @purpose Async user data enrichment after successful signup
 * @owner analytics-team
 * @dependencies ["@supabase/supabase-js"]
 * @exports ["enrichUserData", "enrichDeviceData", "enrichLocationData"]
 * @complexity medium
 * @tags ["analytics", "enrichment", "async"]
 * @status active
 */

'use server'

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

interface EnrichmentData {
  userId: string
  sessionId?: string
  userAgent?: string
  ipAddress?: string
  deviceFingerprint?: string
  referrer?: string
  landingPage?: string
}

/**
 * Enrich device data after signup (non-blocking)
 */
export async function enrichDeviceData(data: EnrichmentData) {
  try {
    const supabase = await createClient()
    
    if (!data.deviceFingerprint || !data.userAgent) return { success: true }
    
    // Parse user agent for device details
    const deviceInfo = parseUserAgent(data.userAgent)
    
    const { error } = await supabase
      .from('user_devices')
      .insert({
        user_id: data.userId,
        device_fingerprint: data.deviceFingerprint,
        device_type: deviceInfo.deviceType,
        operating_system: deviceInfo.os,
        browser: deviceInfo.browser,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        is_trusted: true, // First device is trusted
        trust_score: 100,
        metadata: {
          user_agent: data.userAgent,
          session_id: data.sessionId,
          signup_device: true
        }
      })
      .select()
      .single()
    
    if (error && error.code !== '23505') { // Ignore duplicate errors
      console.warn('Device enrichment failed:', error)
    }
    
    return { success: true }
  } catch (error) {
    console.warn('Device enrichment error:', error)
    return { success: false, error }
  }
}

/**
 * Enrich location data from IP address (non-blocking)
 */
export async function enrichLocationData(data: EnrichmentData) {
  try {
    if (!data.ipAddress || data.ipAddress === '127.0.0.1') return { success: true }
    
    const supabase = await createClient()
    
    // Get location data from IP (using ipapi.co or similar)
    const locationData = await getLocationFromIP(data.ipAddress)
    
    if (locationData) {
      // Update user_tracking with location data
      const { error } = await supabase
        .from('user_tracking')
        .update({
          ip_country: locationData.country,
          ip_region: locationData.region,
          ip_city: locationData.city,
          ip_timezone: locationData.timezone
        })
        .eq('user_id', data.userId)
        .eq('session_id', data.sessionId)
      
      if (error) {
        console.warn('Location enrichment failed:', error)
      }
    }
    
    return { success: true }
  } catch (error) {
    console.warn('Location enrichment error:', error)
    return { success: false, error }
  }
}

/**
 * Main enrichment function - runs all enrichment processes
 */
export async function enrichUserData(data: EnrichmentData) {
  try {
    logger.info('Starting user data enrichment', { userId: data.userId })
    
    // Run enrichment processes in parallel (all non-blocking)
    const enrichmentPromises = [
      enrichDeviceData(data),
      enrichLocationData(data)
    ]
    
    // Use allSettled to ensure no failures break the process
    const results = await Promise.allSettled(enrichmentPromises)
    
    const successCount = results.filter(r => r.status === 'fulfilled').length
    
    logger.info('User data enrichment completed', {
      userId: data.userId,
      successCount,
      totalProcesses: enrichmentPromises.length
    })
    
    return { 
      success: true, 
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false })
    }
  } catch (error) {
    logger.error('User data enrichment failed', { userId: data.userId }, error as Error)
    return { success: false, error }
  }
}

/**
 * Parse user agent string for device information
 */
function parseUserAgent(userAgent: string) {
  const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) 
    ? (/iPad/.test(userAgent) ? 'tablet' : 'mobile')
    : 'desktop'
  
  let browser = 'Unknown'
  if (/Chrome/.test(userAgent)) browser = 'Chrome'
  else if (/Firefox/.test(userAgent)) browser = 'Firefox'
  else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) browser = 'Safari'
  else if (/Edge/.test(userAgent)) browser = 'Edge'
  
  let os = 'Unknown'
  if (/Windows/.test(userAgent)) os = 'Windows'
  else if (/Mac OS/.test(userAgent)) os = 'macOS'
  else if (/Linux/.test(userAgent)) os = 'Linux'
  else if (/Android/.test(userAgent)) os = 'Android'
  else if (/iOS/.test(userAgent)) os = 'iOS'
  
  return { deviceType, browser, os }
}

/**
 * Get location data from IP address
 */
async function getLocationFromIP(ipAddress: string) {
  try {
    // Use a reliable, free IP geolocation service
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`)
    
    if (!response.ok) return null
    
    const data = await response.json()
    
    return {
      country: data.country_name,
      region: data.region,
      city: data.city,
      timezone: data.timezone
    }
  } catch (error) {
    console.warn('IP geolocation failed:', error)
    return null
  }
}
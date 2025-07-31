/**
 * @fileMetadata
 * @purpose Utility functions for collecting user tracking data
 * @owner tracking-team
 * @dependencies ["ua-parser-js"]
 * @exports ["collectSignupTrackingData", "getDeviceFingerprint", "getGeolocation"]
 * @complexity medium
 * @tags ["tracking", "analytics", "signup"]
 * @status active
 */

import { UAParser } from 'ua-parser-js'

export interface SignupTrackingData {
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
  deviceType?: 'mobile' | 'tablet' | 'desktop'
  screenResolution?: string
  geolocation?: {
    latitude?: number
    longitude?: number
    accuracy?: number
  }
  referrer?: string
  utmParams?: {
    source?: string
    medium?: string
    campaign?: string
    term?: string
    content?: string
  }
  landingPage?: string
  browserInfo?: {
    name?: string
    version?: string
    os?: string
    osVersion?: string
  }
}

/**
 * Collects comprehensive tracking data for signup
 */
export async function collectSignupTrackingData(): Promise<SignupTrackingData> {
  const trackingData: SignupTrackingData = {}

  try {
    // User Agent and Device Info
    const userAgent = navigator.userAgent
    trackingData.userAgent = userAgent
    
    const parser = new UAParser(userAgent)
    const result = parser.getResult()
    
    trackingData.browserInfo = {
      name: result.browser.name,
      version: result.browser.version,
      os: result.os.name,
      osVersion: result.os.version
    }
    
    // Device Type
    if (result.device.type === 'mobile') {
      trackingData.deviceType = 'mobile'
    } else if (result.device.type === 'tablet') {
      trackingData.deviceType = 'tablet'
    } else {
      trackingData.deviceType = 'desktop'
    }
    
    // Screen Resolution
    trackingData.screenResolution = `${screen.width}x${screen.height}`
    
    // Referrer
    trackingData.referrer = document.referrer || undefined
    
    // Landing Page
    trackingData.landingPage = window.location.href
    
    // UTM Parameters
    const urlParams = new URLSearchParams(window.location.search)
    const utmParams = {
      source: urlParams.get('utm_source') || undefined,
      medium: urlParams.get('utm_medium') || undefined,
      campaign: urlParams.get('utm_campaign') || undefined,
      term: urlParams.get('utm_term') || undefined,
      content: urlParams.get('utm_content') || undefined
    }
    
    // Only include UTM params if at least one exists
    if (Object.values(utmParams).some(value => value !== undefined)) {
      trackingData.utmParams = utmParams
    }
    
    // Device Fingerprint (basic)
    trackingData.deviceFingerprint = generateDeviceFingerprint()
    
    // IP Address (fetch from external service)
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json')
      const ipData = await ipResponse.json()
      trackingData.ipAddress = ipData.ip
    } catch (error) {
      console.warn('Failed to fetch IP address:', error)
    }
    
    // Geolocation (with user permission)
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: false
          })
        })
        
        trackingData.geolocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
      } catch (error) {
        // Geolocation permission denied or failed - this is okay
        console.debug('Geolocation not available:', error)
      }
    }
    
  } catch (error) {
    console.error('Error collecting tracking data:', error)
  }
  
  return trackingData
}

/**
 * Generates a basic device fingerprint
 */
function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx?.fillText('fingerprint', 10, 10)
  const canvasData = canvas.toDataURL()
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    'deviceMemory' in navigator ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 0 : 0,
    canvasData.slice(-50) // Last 50 chars of canvas data
  ].join('|')
  
  // Simple hash
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36)
}

/**
 * Gets approximate geolocation (for privacy-conscious tracking)
 */
export async function getApproximateLocation(): Promise<{ country?: string; region?: string; city?: string } | null> {
  try {
    const response = await fetch('https://ipapi.co/json/')
    const data = await response.json()
    
    return {
      country: data.country_name,
      region: data.region,
      city: data.city
    }
  } catch (error) {
    console.warn('Failed to get approximate location:', error)
    return null
  }
}
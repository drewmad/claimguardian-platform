/**
 * @fileMetadata
 * @purpose Hook for capturing device and location information
 * @owner analytics-team
 * @status active
 */

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'

interface DeviceInfo {
  fingerprint: string
  type: 'mobile' | 'tablet' | 'desktop'
  screenResolution: string
  viewportSize: string
  colorDepth: number
  timezone: string
  language: string
  platform: string
  memory?: number
  cores?: number
}

interface LocationInfo {
  country?: string
  region?: string
  city?: string
  postalCode?: string
  timezone?: string
  latitude?: number
  longitude?: number
}

interface TrackingInfo {
  device: DeviceInfo
  location: LocationInfo | null
  isLoading: boolean
}

export function useDeviceTracking(): TrackingInfo {
  const [device, setDevice] = useState<DeviceInfo | null>(null)
  const [location, setLocation] = useState<LocationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const captureDeviceInfo = async () => {
      try {
        // Generate device fingerprint
        const fingerprint = await generateDeviceFingerprint()
        
        // Detect device type
        const deviceType = getDeviceType()
        
        // Get screen and viewport info
        const screenResolution = `${window.screen.width}x${window.screen.height}`
        const viewportSize = `${window.innerWidth}x${window.innerHeight}`
        
        // Get other device info
        const deviceInfo: DeviceInfo = {
          fingerprint,
          type: deviceType,
          screenResolution,
          viewportSize,
          colorDepth: window.screen.colorDepth,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
          memory: (navigator as any).deviceMemory,
          cores: navigator.hardwareConcurrency
        }
        
        setDevice(deviceInfo)
        
        // Capture location info
        await captureLocationInfo()
        
      } catch (error) {
        logger.error('Failed to capture device info', {}, error as Error)
      } finally {
        setIsLoading(false)
      }
    }
    
    captureDeviceInfo()
  }, [])
  
  const generateDeviceFingerprint = async (): Promise<string> => {
    // Create a fingerprint based on various browser characteristics
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('device fingerprint', 2, 2)
    }
    
    const canvasData = canvas.toDataURL()
    
    // Combine various characteristics
    const fingerPrintData = [
      navigator.userAgent,
      navigator.language,
      window.screen.colorDepth,
      window.screen.width,
      window.screen.height,
      new Date().getTimezoneOffset(),
      navigator.plugins.length,
      canvasData
    ].join('|')
    
    // Create hash
    const encoder = new TextEncoder()
    const data = encoder.encode(fingerPrintData)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    return hashHex.substring(0, 32) // Return first 32 chars
  }
  
  const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
    const ua = navigator.userAgent.toLowerCase()
    
    if (/tablet|ipad/i.test(ua)) {
      return 'tablet'
    } else if (/mobile|android|iphone/i.test(ua)) {
      return 'mobile'
    }
    
    return 'desktop'
  }
  
  const captureLocationInfo = async () => {
    try {
      // Try to get location from IP-based service
      const response = await fetch('https://ipapi.co/json/')
      if (response.ok) {
        const data = await response.json()
        setLocation({
          country: data.country_code,
          region: data.region,
          city: data.city,
          postalCode: data.postal,
          timezone: data.timezone,
          latitude: data.latitude,
          longitude: data.longitude
        })
      }
    } catch (error) {
      logger.warn('Failed to capture location info', error as Error)
      
      // Fallback to timezone-based location guess
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      setLocation({
        timezone,
        country: guessCountryFromTimezone(timezone)
      })
    }
  }
  
  const guessCountryFromTimezone = (timezone: string): string => {
    // Simple mapping of common US timezones
    const timezoneMap: Record<string, string> = {
      'America/New_York': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'America/Los_Angeles': 'US',
      'America/Phoenix': 'US',
      'America/Anchorage': 'US',
      'Pacific/Honolulu': 'US'
    }
    
    return timezoneMap[timezone] || 'US'
  }
  
  return {
    device: device || {
      fingerprint: '',
      type: 'desktop',
      screenResolution: '',
      viewportSize: '',
      colorDepth: 0,
      timezone: '',
      language: '',
      platform: ''
    },
    location,
    isLoading
  }
}
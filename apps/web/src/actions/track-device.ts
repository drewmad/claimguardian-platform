/**
 * @fileMetadata
 * @purpose "Server action to track user devices"
 * @owner security-team
 * @dependencies ["@supabase/supabase-js"]
 * @exports ["trackUserDevice"]
 * @complexity low
 * @tags ["device", "tracking", "security"]
 * @status stable
 */

'use server'

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

interface DeviceData {
  userId: string
  deviceFingerprint: string
  deviceType?: string
  browser?: string
  os?: string
  ipAddress?: string
}

export async function trackUserDevice(data: DeviceData) {
  try {
    const supabase = await await createClient()
    
    // Use security definer function to track device
    const { error } = await supabase.rpc('track_user_device', {
      p_user_id: data.userId,
      p_device_fingerprint: data.deviceFingerprint,
      p_device_type: data.deviceType,
      p_browser: data.browser,
      p_os: data.os,
      p_ip_address: data.ipAddress
    })

    if (error) {
      logger.warn('Failed to track device', { userId: data.userId, error })
      // Don't throw - this shouldn't break user flow
      return { success: true, warning: 'Device tracking failed but operation continued' }
    }

    logger.info('Device tracked successfully', {
      userId: data.userId,
      deviceFingerprint: data.deviceFingerprint
    })

    return { success: true }
  } catch (error) {
    logger.error('Failed to track device', { userId: data.userId }, error as Error)
    
    // Return success to avoid breaking user flow
    return { success: true, warning: 'Device tracking failed but operation continued' }
  }
}
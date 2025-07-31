/**
 * @fileMetadata
 * @purpose Login activity tracking and monitoring service
 * @owner auth-team
 * @dependencies ["@supabase/supabase-js", "ua-parser-js", "@/lib/logger"]
 * @exports ["loginActivityService"]
 * @complexity medium
 * @tags ["auth", "security", "monitoring", "activity"]
 * @status active
 */

import * as UAParser from 'ua-parser-js'

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'

export interface LoginActivity {
  id: string
  user_id: string
  ip_address: string
  user_agent: string
  device_type?: string
  browser?: string
  os?: string
  location_city?: string
  location_country?: string
  location_region?: string
  success: boolean
  failure_reason?: string
  created_at: string
}

export interface LoginActivityStats {
  totalLogins: number
  failedAttempts: number
  uniqueDevices: number
  lastLoginDate?: string
  suspiciousActivity: boolean
}

class LoginActivityService {
  private supabase = createClient()

  /**
   * Log a login attempt
   */
  async logLoginAttempt(
    userId: string,
    success: boolean,
    failureReason?: string
  ): Promise<void> {
    try {
      // Get user agent info
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : ''
      const parser = new UAParser.UAParser(userAgent)
      const device = parser.getDevice()
      const browser = parser.getBrowser()
      const os = parser.getOS()

      // Get IP address (in production, this would come from the server)
      const ipAddress = await this.getClientIP()

      const { error } = await this.supabase.rpc('log_login_activity', {
        p_user_id: userId,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_success: success,
        p_failure_reason: failureReason
      })

      if (error) {
        logger.error('Failed to log login activity', {}, error)
        throw error
      }

      // Parse and store additional device info asynchronously
      this.updateDeviceInfo(userId, {
        device_type: device.type || 'unknown',
        browser: browser.name || 'unknown',
        os: os.name || 'unknown'
      })

      logger.info('Login activity logged', { 
        userId, 
        success,
        device: device.type,
        browser: browser.name
      })
    } catch (err) {
      logger.error('Error logging login activity', { userId }, err instanceof Error ? err : new Error(String(err)))
      // Don't throw - we don't want login tracking failures to break login
    }
  }

  /**
   * Get login activity for a user
   */
  async getUserLoginActivity(
    userId: string,
    limit: number = 20
  ): Promise<LoginActivity[]> {
    try {
      const { data, error } = await this.supabase
        .from('login_activity')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        logger.error('Failed to fetch login activity', {}, error instanceof Error ? error : new Error(String(error)))
        throw error
      }

      return data || []
    } catch (error) {
      logger.error('Error fetching login activity', { userId }, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * Get login activity statistics
   */
  async getLoginStats(userId: string): Promise<LoginActivityStats> {
    try {
      const { data, error } = await this.supabase
        .from('recent_login_activity')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        logger.error('Failed to fetch login stats', {}, error instanceof Error ? error : new Error(String(error)))
        throw error
      }

      if (!data || data.length === 0) {
        return {
          totalLogins: 0,
          failedAttempts: 0,
          uniqueDevices: 0,
          suspiciousActivity: false
        }
      }

      // Calculate unique devices
      const uniqueDevices = new Set(
        data.map(activity => `${activity.device_type}-${activity.browser}-${activity.os}`)
      ).size

      // Check for suspicious activity
      const recentFailures = data.filter(
        activity => !activity.success && 
        new Date(activity.created_at).getTime() > Date.now() - 3600000 // Last hour
      ).length

      const suspiciousActivity = recentFailures >= 3

      return {
        totalLogins: data[0]?.total_logins || 0,
        failedAttempts: data[0]?.failed_attempts || 0,
        uniqueDevices,
        lastLoginDate: data[0]?.created_at,
        suspiciousActivity
      }
    } catch (error) {
      logger.error('Error fetching login stats', { userId }, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * Check for suspicious login patterns
   */
  async checkSuspiciousActivity(userId: string): Promise<{
    suspicious: boolean
    reasons: string[]
  }> {
    try {
      const recentActivity = await this.getUserLoginActivity(userId, 10)
      const reasons: string[] = []

      // Check for multiple failed attempts
      const recentFailures = recentActivity.filter(
        activity => !activity.success &&
        new Date(activity.created_at).getTime() > Date.now() - 3600000
      )

      if (recentFailures.length >= 3) {
        reasons.push('Multiple failed login attempts')
      }

      // Check for new device/location
      const uniqueIPs = new Set(recentActivity.map(a => a.ip_address))
      if (uniqueIPs.size > 3) {
        reasons.push('Logins from multiple IP addresses')
      }

      // Check for rapid succession logins
      const rapidLogins = recentActivity.filter((activity, index) => {
        if (index === 0) return false
        const timeDiff = new Date(recentActivity[index - 1].created_at).getTime() - 
                        new Date(activity.created_at).getTime()
        return timeDiff < 60000 // Less than 1 minute apart
      })

      if (rapidLogins.length >= 3) {
        reasons.push('Rapid login attempts detected')
      }

      return {
        suspicious: reasons.length > 0,
        reasons
      }
    } catch (err) {
      logger.error('Error checking suspicious activity', { userId }, err instanceof Error ? err : new Error(String(err)))
      return { suspicious: false, reasons: [] }
    }
  }

  /**
   * Get client IP address
   */
  private async getClientIP(): Promise<string> {
    try {
      // In production, this would come from the server
      // For now, we'll use a placeholder
      return '127.0.0.1'
    } catch {
      return '0.0.0.0'
    }
  }

  /**
   * Update device information
   */
  private async updateDeviceInfo(
    userId: string,
    deviceInfo: {
      device_type: string
      browser: string
      os: string
    }
  ): Promise<void> {
    try {
      // In production, this would update the last login record
      // For now, we'll just log it
      logger.info('Device info captured', { userId, ...deviceInfo })
    } catch (err) {
      logger.error('Error updating device info', { userId }, err instanceof Error ? err : new Error(String(err)))
    }
  }
}

export const loginActivityService = new LoginActivityService()
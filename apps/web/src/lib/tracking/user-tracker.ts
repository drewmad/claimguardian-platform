import { UAParser } from 'ua-parser-js'
import { logger } from "@/lib/logger/production-logger"
import { toError } from '@claimguardian/utils'

import { createClient } from '@/lib/supabase/client'

interface TrackingData {
  userId: string
  sessionId: string
  ipAddress?: string
  userAgent?: string
  referrer?: string
  utmParams?: {
    source?: string
    medium?: string
    campaign?: string
    term?: string
    content?: string
  }
  loginMethod?: string
}

interface ActivityData {
  userId: string
  sessionId: string
  activityType: string
  activityName: string
  activityCategory?: string
  activityValue?: string | number | boolean | Record<string, unknown>
  pageUrl?: string
  pageTitle?: string
}

class UserTracker {
  private supabase = createClient()
  private sessionId: string
  private ipAddress?: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.fetchIPAddress()
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private async fetchIPAddress() {
    try {
      // Use a reliable IP API service
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      this.ipAddress = data.ip
    } catch (error) {
      logger.error('Failed to fetch IP address:', toError(error))
    }
  }

  private parseUserAgent(userAgent: string) {
    const parser = new UAParser(userAgent)
    const result = parser.getResult()

    return {
      deviceType: result.device.type || 'desktop',
      deviceName: result.device.model || 'Unknown',
      browserName: result.browser.name || 'Unknown',
      browserVersion: result.browser.version || 'Unknown',
      osName: result.os.name || 'Unknown',
      osVersion: result.os.version || 'Unknown'
    }
  }

  private extractUTMParams(): Record<string, string> {
    if (typeof window === 'undefined') return {}

    const params = new URLSearchParams(window.location.search)
    const utmParams: Record<string, string> = {}

    // Extract UTM parameters
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
    utmKeys.forEach(key => {
      const value = params.get(key)
      if (value) {
        utmParams[key] = value
      }
    })

    return utmParams
  }

  async trackLogin(data: Partial<TrackingData>) {
    try {
      const userAgent = navigator.userAgent
      const deviceInfo = this.parseUserAgent(userAgent)
      const utmParams = this.extractUTMParams()

      // Call the database function to track login
      const { error } = await this.supabase
        .rpc('track_user_login', {
          p_user_id: data.userId,
          p_session_id: this.sessionId,
          p_ip_address: this.ipAddress || null,
          p_user_agent: userAgent,
          p_referrer_url: document.referrer || null,
          p_utm_source: utmParams.utm_source || null,
          p_utm_medium: utmParams.utm_medium || null,
          p_utm_campaign: utmParams.utm_campaign || null,
          p_login_method: data.loginMethod || 'email'
        })

      if (error) {
        logger.error('Error tracking login:', error)
        return
      }

      // Store additional device info in local storage for later use
      localStorage.setItem('userTracking', JSON.stringify({
        sessionId: this.sessionId,
        deviceInfo,
        loginTime: new Date().toISOString()
      }))

      // Log initial page view
      await this.logActivity({
        userId: data.userId!,
        sessionId: this.sessionId,
        activityType: 'page_view',
        activityName: 'Login',
        pageUrl: window.location.href,
        pageTitle: document.title
      })

    } catch (error) {
      logger.error('Error in trackLogin:', toError(error))
    }
  }

  async logActivity(data: ActivityData) {
    try {
      const { error } = await this.supabase
        .rpc('log_user_activity', {
          p_user_id: data.userId,
          p_session_id: data.sessionId || this.sessionId,
          p_activity_type: data.activityType,
          p_activity_name: data.activityName,
          p_activity_category: data.activityCategory || null,
          p_activity_value: data.activityValue || null,
          p_page_url: data.pageUrl || window.location.href,
          p_page_title: data.pageTitle || document.title
        })

      if (error) {
        logger.error('Error logging activity:', error)
      }
    } catch (error) {
      logger.error('Error in logActivity:', toError(error))
    }
  }

  // Track page views
  trackPageView(userId: string, pageName: string) {
    this.logActivity({
      userId,
      sessionId: this.sessionId,
      activityType: 'page_view',
      activityName: pageName,
      pageUrl: window.location.href,
      pageTitle: document.title
    })
  }

  // Track feature usage
  trackFeatureUse(userId: string, featureName: string, category?: string, value?: string | number | boolean | Record<string, unknown>) {
    this.logActivity({
      userId,
      sessionId: this.sessionId,
      activityType: 'feature_use',
      activityName: featureName,
      activityCategory: category,
      activityValue: value
    })
  }

  // Track button clicks
  trackButtonClick(userId: string, buttonName: string, category?: string) {
    this.logActivity({
      userId,
      sessionId: this.sessionId,
      activityType: 'button_click',
      activityName: buttonName,
      activityCategory: category
    })
  }

  // Track errors
  trackError(userId: string, errorMessage: string, errorDetails?: string | number | boolean | Record<string, unknown>) {
    this.logActivity({
      userId,
      sessionId: this.sessionId,
      activityType: 'error',
      activityName: errorMessage,
      activityCategory: 'error',
      activityValue: errorDetails
    })
  }

  // Get current session ID
  getSessionId(): string {
    return this.sessionId
  }
}

// Export singleton instance
export const userTracker = new UserTracker()

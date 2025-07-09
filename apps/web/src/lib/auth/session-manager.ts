/**
 * @fileMetadata
 * @purpose Session management with automatic token refresh
 * @owner auth-team
 * @dependencies ["@supabase/supabase-js", "@/lib/logger"]
 * @exports ["sessionManager"]
 * @complexity medium
 * @tags ["auth", "session", "token-refresh"]
 * @status active
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

interface SessionManagerConfig {
  refreshThresholdMinutes?: number
  warningThresholdMinutes?: number
  onSessionExpiring?: () => void
  onSessionExpired?: () => void
  onSessionRefreshed?: () => void
}

class SessionManager {
  private refreshTimer?: NodeJS.Timeout
  private warningTimer?: NodeJS.Timeout
  public config: SessionManagerConfig

  constructor(config: SessionManagerConfig = {}) {
    this.config = {
      refreshThresholdMinutes: 10, // Refresh 10 minutes before expiry
      warningThresholdMinutes: 5,   // Warn 5 minutes before expiry
      ...config
    }
  }

  /**
   * Get refresh threshold based on remember me preference
   */
  private getRefreshThreshold(): number {
    const rememberMe = localStorage.getItem('rememberMe') === 'true'
    // If remember me is enabled, refresh less frequently (30 minutes before expiry)
    // Otherwise, use the default threshold
    return rememberMe ? 30 : this.config.refreshThresholdMinutes!
  }

  /**
   * Start monitoring the session
   */
  async startMonitoring() {
    logger.info('Starting session monitoring')
    
    // Clear any existing timers
    this.stopMonitoring()
    
    // Check current session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      logger.error('Failed to get session for monitoring', error)
      return
    }
    
    this.scheduleRefresh(session.expires_at!)
  }

  /**
   * Stop monitoring the session
   */
  stopMonitoring() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = undefined
    }
    
    if (this.warningTimer) {
      clearTimeout(this.warningTimer)
      this.warningTimer = undefined
    }
    
    logger.info('Stopped session monitoring')
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleRefresh(expiresAt: number) {
    const now = Date.now() / 1000
    const expiryTime = expiresAt
    const timeUntilExpiry = expiryTime - now
    
    // Calculate when to refresh based on remember me preference
    const refreshThreshold = this.getRefreshThreshold() * 60
    const timeUntilRefresh = timeUntilExpiry - refreshThreshold
    
    // Calculate when to warn (default: 5 minutes before expiry)
    const warningThreshold = this.config.warningThresholdMinutes! * 60
    const timeUntilWarning = timeUntilExpiry - warningThreshold
    
    logger.info('Session expiry scheduled', {
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      refreshIn: `${Math.round(timeUntilRefresh / 60)} minutes`,
      warnIn: `${Math.round(timeUntilWarning / 60)} minutes`
    })
    
    // Schedule warning if configured
    if (timeUntilWarning > 0 && this.config.onSessionExpiring) {
      this.warningTimer = setTimeout(() => {
        logger.warn('Session expiring soon')
        this.config.onSessionExpiring?.()
      }, timeUntilWarning * 1000)
    }
    
    // Schedule refresh
    if (timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(async () => {
        await this.refreshSession()
      }, timeUntilRefresh * 1000)
    } else {
      // Session is already close to expiry, refresh immediately
      this.refreshSession()
    }
  }

  /**
   * Refresh the current session
   */
  private async refreshSession() {
    try {
      logger.info('Attempting to refresh session')
      
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        logger.error('Failed to refresh session', error)
        this.config.onSessionExpired?.()
        return
      }
      
      if (!session) {
        logger.error('No session returned after refresh')
        this.config.onSessionExpired?.()
        return
      }
      
      logger.info('Session refreshed successfully')
      this.config.onSessionRefreshed?.()
      
      // Schedule next refresh
      this.scheduleRefresh(session.expires_at!)
    } catch (err) {
      logger.error('Unexpected error refreshing session', err)
      this.config.onSessionExpired?.()
    }
  }

  /**
   * Manually trigger a session refresh
   */
  async forceRefresh() {
    logger.info('Force refreshing session')
    await this.refreshSession()
  }

  /**
   * Get time until session expiry in seconds
   */
  async getTimeUntilExpiry(): Promise<number | null> {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return null
    }
    
    const now = Date.now() / 1000
    return session.expires_at! - now
  }
}

export const sessionManager = new SessionManager()
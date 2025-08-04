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

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'

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
  private supabase = createClient()
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
    const { data: { user }, error } = await this.supabase.auth.getUser()
    
    if (error || !user) {
      logger.error('Failed to get user for monitoring', {}, error || undefined)
      return
    }
    
    const { data: { session } } = await this.supabase.auth.getSession()
    
    if (!session) {
      logger.error('No session found for monitoring')
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
    
    // Check if session is already expired
    if (timeUntilExpiry <= 0) {
      logger.warn('Session already expired, triggering immediate logout')
      this.config.onSessionExpired?.()
      return
    }
    
    // Calculate when to refresh based on remember me preference
    const refreshThreshold = this.getRefreshThreshold() * 60
    const timeUntilRefresh = timeUntilExpiry - refreshThreshold
    
    // Calculate when to warn (default: 5 minutes before expiry)
    const warningThreshold = this.config.warningThresholdMinutes! * 60
    const timeUntilWarning = timeUntilExpiry - warningThreshold
    
    logger.info('Session expiry scheduled', {
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      timeUntilExpiry: Math.round(timeUntilExpiry / 60),
      refreshIn: `${Math.round(timeUntilRefresh / 60)} minutes`,
      warnIn: `${Math.round(timeUntilWarning / 60)} minutes`
    })
    
    // Only schedule warning if there's enough time and configured
    if (timeUntilWarning > 60 && this.config.onSessionExpiring) {
      this.warningTimer = setTimeout(() => {
        logger.warn('Session expiring soon')
        this.config.onSessionExpiring?.()
      }, timeUntilWarning * 1000)
    }
    
    // Only schedule refresh if there's enough time (at least 2 minutes)
    if (timeUntilRefresh > 120) {
      this.refreshTimer = setTimeout(async () => {
        await this.refreshSession()
      }, timeUntilRefresh * 1000)
    } else if (timeUntilExpiry > 120) {
      // If we can't refresh with the normal threshold, try refreshing with a shorter threshold
      const shortRefreshTime = Math.max(60, timeUntilExpiry - 60) // 1 minute before expiry
      this.refreshTimer = setTimeout(async () => {
        await this.refreshSession()
      }, shortRefreshTime * 1000)
    } else {
      // Session will expire very soon, don't attempt refresh to avoid logout loops
      logger.warn('Session expires very soon, skipping refresh to avoid logout loop')
    }
  }

  /**
   * Refresh the current session
   */
  private async refreshSession() {
    try {
      logger.info('Attempting to refresh session')
      
      // First check if we have a current user
      const { data: { user: currentUser }, error: currentError } = await this.supabase.auth.getUser()
      
      if (currentError || !currentUser) {
        logger.error('No current user to refresh', {}, currentError || undefined)
        this.config.onSessionExpired?.()
        return
      }
      
      // Check if current session is still valid
      const { data: { session: currentSession } } = await this.supabase.auth.getSession()
      if (!currentSession) {
        logger.warn('No session found, cannot refresh')
        this.config.onSessionExpired?.()
        return
      }
      
      const now = Date.now() / 1000
      if (currentSession.expires_at! <= now) {
        logger.warn('Current session already expired, cannot refresh')
        this.config.onSessionExpired?.()
        return
      }
      
      const { data: { session }, error } = await this.supabase.auth.refreshSession()
      
      if (error) {
        logger.error('Failed to refresh session', {}, error)
        // Only trigger logout if the error is not recoverable
        if (error.message.includes('refresh_token_not_found') || 
            error.message.includes('Invalid refresh token')) {
          this.config.onSessionExpired?.()
        }
        return
      }
      
      if (!session) {
        logger.error('No session returned after refresh')
        this.config.onSessionExpired?.()
        return
      }
      
      logger.info('Session refreshed successfully', {
        newExpiresAt: new Date(session.expires_at! * 1000).toISOString()
      })
      this.config.onSessionRefreshed?.()
      
      // Schedule next refresh
      this.scheduleRefresh(session.expires_at!)
    } catch (err) {
      logger.error('Unexpected error refreshing session', {}, err instanceof Error ? err : new Error(String(err)))
      // Don't automatically logout on unexpected errors to avoid logout loops
      logger.warn('Session refresh failed, will retry on next scheduled refresh')
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
    const { data: { user }, error } = await this.supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    const { data: { session } } = await this.supabase.auth.getSession()
    
    if (!session) {
      return null
    }
    
    const now = Date.now() / 1000
    return session.expires_at! - now
  }
}

export const sessionManager = new SessionManager()
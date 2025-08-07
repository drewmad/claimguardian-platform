/**
 * @fileMetadata
 * @purpose "Enhanced authentication context provider with error handling and logging"
 * @owner frontend-team
 * @dependencies ["react", "@supabase/supabase-js", "@/lib/auth/auth-service", "@/lib/logger"]
 * @exports ["AuthProvider", "useAuth"]
 * @complexity high
 * @tags ["auth", "context", "provider", "error-handling"]
 * @status stable
 */
'use client'

import { createBrowserSupabaseClient } from '@claimguardian/db'
import { User } from '@supabase/supabase-js'
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

import { SessionMonitor } from './session-monitor'

import { authService, AuthError } from '@/lib/auth/auth-service'
import { sessionManager } from '@/lib/auth/session-manager'
import { logger } from '@/lib/logger'
import { handleAuthError } from '@/lib/supabase/auth-helpers'


interface AuthContextType {
  user: User | null
  loading: boolean
  error: AuthError | null
  sessionWarning: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (data: SignUpData) => Promise<boolean>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  clearError: () => void
  clearSessionWarning: () => void
}

interface SignUpData {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
  // Legal compliance
  acceptedDocuments?: string[]
  gdprConsent?: boolean
  marketingConsent?: boolean
  dataProcessingConsent?: boolean
  // Tracking data
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
  geolocation?: {
    lat?: number
    lng?: number
    city?: string
    region?: string
    country?: string
  }
  referrer?: string
  utmParams?: {
    source?: string
    medium?: string
    campaign?: string
    term?: string
    content?: string
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const [sessionWarning, setSessionWarning] = useState(false)
  const supabase = createBrowserSupabaseClient()

  // Use secure debug logging only in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('@/lib/logger').then(({ logger }) => {
        logger.authDebug('AuthProvider', {
          loading,
          hasUser: !!user,
          error: error?.message
        })
      })
    }
  }, [user, loading, error])

  // Initialize auth state - run only once
  useEffect(() => {
    let mounted = true
    let authSubscription: { unsubscribe: () => void } | null = null

    const initializeAuth = async () => {
      try {
        logger.info('Initializing authentication')
        logger.info('Authentication provider initializing')

        const { data: { user: validatedUser }, error: userError } = await supabase.auth.getUser()

        if (userError) {
          logger.error('Failed to get initial user', {}, userError)
          // Handle refresh token errors
          await handleAuthError(userError, supabase)
          if (mounted) {
            setUser(null)
            setLoading(false)
            setError(null)
          }
          return
        }

        if (!validatedUser) {
          logger.warn('No validated user found, session cleared')
          if (mounted) {
            setUser(null)
            setLoading(false)
            setError(null)
          }
          return
        }

        if (mounted) {
          // Batch state updates to prevent loops
          const { data: { session } } = await supabase.auth.getSession()
          const updates = {
            user: session?.user ?? null,
            loading: false,
            error: null
          }

          setUser(updates.user)
          setLoading(updates.loading)
          setError(updates.error)

          if (session?.user) {
            // Check if session is still valid before starting monitoring
            const now = Date.now() / 1000
            const timeUntilExpiry = session.expires_at! - now

            logger.setUser({
              id: session.user.id,
              email: session.user.email
            })
            logger.info('User session restored', {
              userId: session.user.id,
              timeUntilExpiry: Math.round(timeUntilExpiry / 60)
            })
            logger.info('Session started', { userId: session.user.id, event: 'session_start' })

            // Only start session monitoring if session has sufficient time left and not already monitoring
            if (timeUntilExpiry > 300) { // 5 minutes minimum to avoid rapid refresh cycles
              sessionManager.startMonitoring()
            } else {
              logger.warn('Session expires soon, skipping monitoring to avoid immediate logout', { timeUntilExpiry })
            }
          } else {
            logger.info('No active session found during initialization')
          }
        }
      } catch (err) {
        logger.error('Auth initialization failed', { userId: user?.id }, err instanceof Error ? err : new Error(String(err)))
        if (mounted) {
          setError(new AuthError(
            'Failed to initialize authentication',
            'AUTH_UNKNOWN_ERROR',
            err as Error
          ))
          setLoading(false)
        }
      }
    }

    // Configure session manager callbacks once
    const configureSessionManager = () => {
      sessionManager.config = {
        onSessionExpiring: () => {
          if (mounted) {
            setSessionWarning(true)
            logger.warn('Session expiring soon - showing warning')
          }
        },
        onSessionExpired: () => {
          if (mounted) {
            setUser(null)
            setSessionWarning(false)
            logger.warn('Session expired - logging out user')
            // Use window.location instead of router to avoid dependency
            if (typeof window !== 'undefined') {
              window.location.href = '/'
            }
          }
        },
        onSessionRefreshed: () => {
          if (mounted) {
            setSessionWarning(false)
            logger.info('Session refreshed - warning cleared')
          }
        }
      }
    }

    // Set up auth state listener
    const setupAuthListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          logger.info('Auth state changed', { event, userId: session?.user?.id })

          if (!mounted) return

          // Handle token errors in auth state changes
          if (event === 'TOKEN_REFRESHED' && session === null) {
            logger.error('Token refresh failed - session is null')
            await handleAuthError({ message: 'refresh_token_not_found' }, supabase)
            return
          }

          // Update user state
          setUser(session?.user ?? null)

          // Update logger context
          if (session?.user) {
            logger.setUser({
              id: session.user.id,
              email: session.user.email
            })
          } else {
            logger.setUser(null)
          }

          // Handle specific auth events without causing loops
          switch (event) {
            case 'SIGNED_IN':
              logger.track('user_signed_in', { userId: session?.user?.id })

              // Check session validity before starting monitoring - avoid duplicate monitoring
              if (session) {
                const now = Date.now() / 1000
                const timeUntilExpiry = session.expires_at! - now

                // Stop any existing monitoring first to prevent duplicates
                sessionManager.stopMonitoring()

                if (timeUntilExpiry > 300) { // 5 minutes minimum
                  sessionManager.startMonitoring()
                } else {
                  logger.warn('New session expires very soon, skipping monitoring', { timeUntilExpiry })
                }
              }

              setLoading(false)
              break
            case 'SIGNED_OUT':
              logger.track('user_signed_out')
              sessionManager.stopMonitoring()
              setLoading(false)
              break
            case 'TOKEN_REFRESHED':
              logger.info('Token refreshed successfully')
              break
            case 'PASSWORD_RECOVERY':
              logger.track('password_recovery_initiated')
              break
            case 'USER_UPDATED':
              logger.info('User data updated')
              break
            default:
              // Don't set loading for unknown events to prevent loops
              break
          }
        }
      )

      authSubscription = subscription
    }

    // Initialize everything
    configureSessionManager()
    setupAuthListener()
    initializeAuth()

    return () => {
      mounted = false
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
      sessionManager.stopMonitoring()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only once on mount - removing user?.id to prevent infinite loops

  // Sign in handler
  const handleSignIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data: userData, error } = await authService.signIn({ email, password })

      if (error) {
        setError(error)
        return false
      }

      if (userData) {
        logger.track('signin_success', { userId: userData.id })
        return true
      }

      return false
    } catch (err) {
      logger.error('Unexpected signin error', { userId: user?.id }, err instanceof Error ? err : new Error(String(err)))
      setError(new AuthError(
        'An unexpected error occurred',
        'AUTH_UNKNOWN_ERROR',
        err as Error
      ))
      return false
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Sign up handler
  const handleSignUp = useCallback(async (data: SignUpData) => {
    try {
      setLoading(true)
      setError(null)

      const { data: userData, error } = await authService.signUp(data)

      if (error) {
        setError(error)
        return false
      }

      if (userData) {
        logger.track('signup_success', { userId: userData.id })
        return true
      }

      return false
    } catch (err) {
      logger.error('Unexpected signup error', { userId: user?.id }, err instanceof Error ? err : new Error(String(err)))
      setError(new AuthError(
        'An unexpected error occurred',
        'AUTH_UNKNOWN_ERROR',
        err as Error
      ))
      return false
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Sign out handler
  const handleSignOut = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await authService.signOut()

      if (error) {
        setError(error)
        setLoading(false)
        return
      }

      logger.track('signout_success')
      setUser(null)
      // Use window.location to avoid router dependency issues
      window.location.href = '/'
    } catch (err) {
      logger.error('Unexpected signout error', { userId: user?.id }, err instanceof Error ? err : new Error(String(err)))
      setError(new AuthError(
        'An unexpected error occurred',
        'AUTH_UNKNOWN_ERROR',
        err as Error
      ))
      setLoading(false)
    }
  }, [user?.id])

  // Reset password handler
  const handleResetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await authService.resetPassword(email)

      if (error) {
        setError(error)
        return
      }

      logger.track('password_reset_requested', { email })
    } catch (err) {
      logger.error('Unexpected password reset error', { userId: user?.id }, err instanceof Error ? err : new Error(String(err)))
      setError(new AuthError(
        'An unexpected error occurred',
        'AUTH_UNKNOWN_ERROR',
        err as Error
      ))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Update password handler
  const handleUpdatePassword = useCallback(async (newPassword: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await authService.updatePassword(newPassword)

      if (error) {
        setError(error)
        return
      }

      if (data) {
        logger.track('password_updated', { userId: data.id })
      }
    } catch (err) {
      logger.error('Unexpected password update error', { userId: user?.id }, err instanceof Error ? err : new Error(String(err)))
      setError(new AuthError(
        'An unexpected error occurred',
        'AUTH_UNKNOWN_ERROR',
        err as Error
      ))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Clear error handler
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Clear session warning handler
  const clearSessionWarning = useCallback(() => {
    setSessionWarning(false)
  }, [])

  const value = {
    user,
    loading,
    error,
    sessionWarning,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    updatePassword: handleUpdatePassword,
    clearError,
    clearSessionWarning
  }

  return (
    <AuthContext.Provider value={value}>
      {user ? (
        <SessionMonitor inactivityTimeout={480} warningTime={5}>
          {children}
        </SessionMonitor>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

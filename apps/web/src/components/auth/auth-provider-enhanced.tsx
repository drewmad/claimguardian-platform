/**
 * @fileMetadata
 * @purpose "Enhanced authentication context provider with server state sync"
 * @dependencies ["@/app","@/lib","@supabase/supabase-js","next","react"]
 * @owner frontend-team
 * @status stable
 */
'use client'

import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'

import { validateSessionAction, refreshSessionAction } from '@/app/auth/actions'
import { authService, AuthError } from '@/lib/auth/auth-service'
import { sessionManager } from '@/lib/auth/session-manager'
import { logger } from '@/lib/logger'
import { handleAuthError, validateSession } from '@/lib/supabase/auth-helpers'
import { createClient } from '@/lib/supabase/client'

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
  refreshSession: () => Promise<void>
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
  aiProcessingConsent?: boolean
  // Tracking data
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
  deviceType?: 'mobile' | 'tablet' | 'desktop'
  screenResolution?: string
  geolocation?: {
    lat?: number
    lng?: number
    city?: string
    region?: string
    country?: string
  }
  referrer?: string
  landingPage?: string
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
  const supabase = createClient()
  const router = useRouter()
  const initializationRef = useRef(false)
  const serverSyncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Sync with server state periodically
  const syncWithServerState = useCallback(async () => {
    try {
      const isValid = await validateSessionAction()

      if (!isValid && user) {
        logger.warn('Server session invalid, logging out user')
        setUser(null)
        sessionManager.stopMonitoring()
        router.push('/')
      } else if (isValid && !user) {
        // Server has session but client doesn't - refresh client state
        const { data: { user: serverUser } } = await supabase.auth.getUser()
        if (serverUser) {
          setUser(serverUser)
          sessionManager.startMonitoring()
        }
      }
    } catch (error) {
      logger.error('Server sync failed', {}, error as Error)
    }
  }, [user, supabase.auth, router])

  // Initialize auth state - run only once
  useEffect(() => {
    if (initializationRef.current) return
    initializationRef.current = true

    let mounted = true
    let authSubscription: { unsubscribe: () => void } | null = null

    const initializeAuth = async () => {
      try {
        logger.info('Initializing authentication with server sync')

        // Get initial user
        const { data: { user: initialUser }, error: userError } = await supabase.auth.getUser()

        if (userError) {
          logger.error('Failed to get initial user', {}, userError)
          await handleAuthError(userError, supabase)
          if (mounted) {
            setUser(null)
            setLoading(false)
            setError(null)
          }
          return
        }

        // Validate session with server
        if (initialUser) {
          const isServerValid = await validateSessionAction()

          if (!isServerValid) {
            logger.warn('Server validation failed for initial session')
            await supabase.auth.signOut()
            if (mounted) {
              setUser(null)
              setLoading(false)
            }
            return
          }
        }

        // Validate session for security
        const validatedUser = await validateSession(supabase)

        if (!validatedUser && initialUser) {
          logger.warn('Client validation failed, clearing session')
          if (mounted) {
            setUser(null)
            setLoading(false)
            setError(null)
          }
          return
        }

        if (mounted) {
          setUser(validatedUser)
          setLoading(false)
          setError(null)

          if (validatedUser) {
            const { data: { session } } = await supabase.auth.getSession()
            const now = Date.now() / 1000
            const timeUntilExpiry = session!.expires_at! - now

            logger.setUser({
              id: validatedUser.id,
              email: validatedUser.email
            })

            if (timeUntilExpiry > 60) {
              sessionManager.startMonitoring()

              // Start server sync interval (every 5 minutes)
              serverSyncIntervalRef.current = setInterval(syncWithServerState, 5 * 60 * 1000)
            }
          }
        }
      } catch (err) {
        logger.error('Auth initialization failed', {}, err instanceof Error ? err : new Error(String(err)))
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

    // Configure session manager callbacks
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
            router.push('/')
          }
        },
        onSessionRefreshed: () => {
          if (mounted) {
            setSessionWarning(false)
            logger.info('Session refreshed - warning cleared')
            // Sync with server after refresh
            syncWithServerState()
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

          // Handle token errors
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

          // Handle specific auth events
          switch (event) {
            case 'SIGNED_IN':
              logger.track('user_signed_in', { userId: session?.user?.id })

              if (session) {
                const now = Date.now() / 1000
                const timeUntilExpiry = session.expires_at! - now

                if (timeUntilExpiry > 60) {
                  sessionManager.startMonitoring()

                  // Start server sync for new session
                  if (serverSyncIntervalRef.current) {
                    clearInterval(serverSyncIntervalRef.current)
                  }
                  serverSyncIntervalRef.current = setInterval(syncWithServerState, 5 * 60 * 1000)
                }
              }

              setLoading(false)
              router.refresh()
              break

            case 'SIGNED_OUT':
              logger.track('user_signed_out')
              sessionManager.stopMonitoring()

              // Stop server sync
              if (serverSyncIntervalRef.current) {
                clearInterval(serverSyncIntervalRef.current)
                serverSyncIntervalRef.current = null
              }

              setLoading(false)
              router.push('/')
              break

            case 'TOKEN_REFRESHED':
              logger.info('Token refreshed successfully')
              // Validate with server after token refresh
              syncWithServerState()
              break

            case 'PASSWORD_RECOVERY':
              logger.track('password_recovery_initiated')
              break

            case 'USER_UPDATED':
              logger.info('User data updated')
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
      if (serverSyncIntervalRef.current) {
        clearInterval(serverSyncIntervalRef.current)
      }
      sessionManager.stopMonitoring()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase.auth, syncWithServerState, router])

  // Manual session refresh
  const refreshSession = useCallback(async () => {
    try {
      setLoading(true)

      // Try server refresh first
      const serverSuccess = await refreshSessionAction()

      if (serverSuccess) {
        // Then refresh client
        const { data: { session }, error } = await supabase.auth.refreshSession()

        if (!error && session) {
          setUser(session.user)
          setSessionWarning(false)
          logger.info('Session manually refreshed')
        }
      } else {
        throw new Error('Server session refresh failed')
      }
    } catch (error) {
      logger.error('Manual session refresh failed', {}, error as Error)
      setError(new AuthError(
        'Failed to refresh session',
        'AUTH_SESSION_EXPIRED',
        error as Error
      ))
    } finally {
      setLoading(false)
    }
  }, [supabase.auth])

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
        // Let auth state change handler manage navigation
        return true
      }

      return false
    } catch (err) {
      logger.error('Unexpected signin error', {}, err instanceof Error ? err : new Error(String(err)))
      setError(new AuthError(
        'An unexpected error occurred',
        'AUTH_UNKNOWN_ERROR',
        err as Error
      ))
      return false
    } finally {
      setLoading(false)
    }
  }, [])

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
      logger.error('Unexpected signup error', {}, err instanceof Error ? err : new Error(String(err)))
      setError(new AuthError(
        'An unexpected error occurred',
        'AUTH_UNKNOWN_ERROR',
        err as Error
      ))
      return false
    } finally {
      setLoading(false)
    }
  }, [])

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

      // Clear server sync interval
      if (serverSyncIntervalRef.current) {
        clearInterval(serverSyncIntervalRef.current)
        serverSyncIntervalRef.current = null
      }

      // Router navigation will be handled by auth state change
    } catch (err) {
      logger.error('Unexpected signout error', {}, err instanceof Error ? err : new Error(String(err)))
      setError(new AuthError(
        'An unexpected error occurred',
        'AUTH_UNKNOWN_ERROR',
        err as Error
      ))
      setLoading(false)
    }
  }, [])

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
      logger.error('Unexpected password reset error', {}, err instanceof Error ? err : new Error(String(err)))
      setError(new AuthError(
        'An unexpected error occurred',
        'AUTH_UNKNOWN_ERROR',
        err as Error
      ))
    } finally {
      setLoading(false)
    }
  }, [])

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
      logger.error('Unexpected password update error', {}, err instanceof Error ? err : new Error(String(err)))
      setError(new AuthError(
        'An unexpected error occurred',
        'AUTH_UNKNOWN_ERROR',
        err as Error
      ))
    } finally {
      setLoading(false)
    }
  }, [])

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
    clearSessionWarning,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
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

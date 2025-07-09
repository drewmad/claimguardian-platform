/**
 * @fileMetadata
 * @purpose Enhanced authentication context provider with error handling and logging
 * @owner frontend-team
 * @dependencies ["react", "@supabase/supabase-js", "@/lib/auth/auth-service", "@/lib/logger"]
 * @exports ["AuthProvider", "useAuth"]
 * @complexity high
 * @tags ["auth", "context", "provider", "error-handling"]
 * @status active
 */
'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { authService, AuthError } from '@/lib/auth/auth-service'
import { logger } from '@/lib/logger'
import { useRouter } from 'next/navigation'
import { sessionManager } from '@/lib/auth/session-manager'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: AuthError | null
  sessionWarning: boolean
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const [sessionWarning, setSessionWarning] = useState(false)
  const router = useRouter()

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        logger.info('Initializing authentication')
        
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          logger.error('Failed to get initial session', sessionError)
          throw sessionError
        }

        if (mounted) {
          setUser(session?.user ?? null)
          
          if (session?.user) {
            logger.setUser({
              id: session.user.id,
              email: session.user.email
            })
            logger.info('User session restored', { userId: session.user.id })
            
            // Start session monitoring
            sessionManager.startMonitoring()
          }
        }
      } catch (err) {
        logger.error('Auth initialization failed', err)
        if (mounted) {
          setError(new AuthError(
            'Failed to initialize authentication',
            'AUTH_UNKNOWN_ERROR',
            err as Error
          ))
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()
    
    // Configure session manager callbacks
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
        }
      }
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.info('Auth state changed', { event, userId: session?.user?.id })
        
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
          
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
              sessionManager.startMonitoring()
              break
            case 'SIGNED_OUT':
              logger.track('user_signed_out')
              sessionManager.stopMonitoring()
              router.push('/')
              break
            case 'TOKEN_REFRESHED':
              logger.info('Token refreshed successfully')
              break
            case 'PASSWORD_RECOVERY':
              logger.track('password_recovery_initiated')
              break
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
      sessionManager.stopMonitoring()
    }
  }, [router])

  // Sign in handler
  const handleSignIn = useCallback(async (email: string, password: string, rememberMe?: boolean) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await authService.signIn({ email, password, rememberMe })
      
      if (error) {
        setError(error)
        return
      }

      if (data) {
        logger.track('signin_success', { userId: data.id, rememberMe })
        router.push('/dashboard')
      }
    } catch (err) {
      logger.error('Unexpected signin error', err)
      setError(new AuthError(
        'An unexpected error occurred',
        'AUTH_UNKNOWN_ERROR',
        err as Error
      ))
    } finally {
      setLoading(false)
    }
  }, [router])

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
      logger.error('Unexpected signup error', err)
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
        return
      }

      logger.track('signout_success')
      setUser(null)
      router.push('/')
    } catch (err) {
      logger.error('Unexpected signout error', err)
      setError(new AuthError(
        'An unexpected error occurred',
        'AUTH_UNKNOWN_ERROR',
        err as Error
      ))
    } finally {
      setLoading(false)
    }
  }, [router])

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
      logger.error('Unexpected password reset error', err)
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
      logger.error('Unexpected password update error', err)
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
    clearSessionWarning
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
/**
 * @fileMetadata
 * @purpose Centralized authentication service with comprehensive error handling
 * @owner auth-team
 * @dependencies ["@supabase/supabase-js", "@/lib/errors"]
 * @exports ["authService", "AuthError"]
 * @complexity high
 * @tags ["auth", "service", "error-handling"]
 * @status active
 */

import { createClient } from '@/lib/supabase/client'
import { User, AuthError as SupabaseAuthError } from '@supabase/supabase-js'
import { AppError, ErrorCode } from '@/lib/errors/app-error'
import { logger } from '@/lib/logger'
import { loginActivityService } from '@/lib/auth/login-activity-service'
import { getAuthCallbackURL } from '@/lib/utils/site-url'

export class AuthError extends AppError {
  constructor(message: string, code: ErrorCode, originalError?: Error) {
    super(message, code, originalError)
    this.name = 'AuthError'
  }
}

interface AuthResponse<T = unknown> {
  data?: T
  error?: AuthError
}

interface SignUpData {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
}

interface SignInData {
  email: string
  password: string
  rememberMe?: boolean
}

class AuthService {
  private supabase = createClient()

  /**
   * Sign up a new user
   */
  async signUp(data: SignUpData): Promise<AuthResponse<User>> {
    try {
      logger.info('Attempting user signup', { email: data.email })
      
      // Enhanced logging for debugging
      console.log('[AUTH DEBUG] Starting signup process', {
        email: data.email,
        hasFirstName: !!data.firstName,
        hasLastName: !!data.lastName,
        hasPhone: !!data.phone,
        timestamp: new Date().toISOString()
      })
      
      const { data: authData, error } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
          },
          emailRedirectTo: getAuthCallbackURL('/auth/verify')
        }
      })

      // Log detailed response
      console.log('[AUTH DEBUG] Supabase signup response', {
        hasUser: !!authData?.user,
        userId: authData?.user?.id,
        userEmail: authData?.user?.email,
        hasSession: !!authData?.session,
        error: error ? {
          message: error.message,
          status: error.status,
          code: error.code
        } : null,
        timestamp: new Date().toISOString()
      })

      if (error) {
        console.error('[AUTH DEBUG] Signup error details', {
          message: error.message,
          status: error.status,
          code: error.code,
          name: error.name,
          stack: error.stack
        })
        throw this.handleAuthError(error)
      }

      if (!authData.user) {
        console.error('[AUTH DEBUG] No user data returned despite successful signup')
        throw new AuthError(
          'Signup successful but no user data returned',
          'AUTH_INVALID_RESPONSE'
        )
      }

      // Check if user was created successfully
      console.log('[AUTH DEBUG] User created successfully', {
        userId: authData.user.id,
        email: authData.user.email,
        emailConfirmedAt: authData.user.email_confirmed_at,
        createdAt: authData.user.created_at,
        userMetadata: authData.user.user_metadata,
        appMetadata: authData.user.app_metadata
      })

      logger.info('User signup successful', { userId: authData.user.id })
      return { data: authData.user }
    } catch (error) {
      console.error('[AUTH DEBUG] Signup process failed', {
        error: error instanceof Error ? {
          message: error.message,
          name: error.name,
          stack: error.stack
        } : error,
        timestamp: new Date().toISOString()
      })
      
      logger.error('Signup failed', error)
      
      if (error instanceof AuthError) {
        return { error }
      }
      
      return {
        error: new AuthError(
          'An unexpected error occurred during signup',
          'AUTH_UNKNOWN_ERROR',
          error as Error
        )
      }
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn(data: SignInData): Promise<AuthResponse<User>> {
    try {
      logger.info('Attempting user signin', { email: data.email, rememberMe: data.rememberMe })
      
      // Debug logging for production
      if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true') {
        console.log('[ClaimGuardian Auth] Sign in attempt:', {
          email: data.email,
          url: typeof window !== 'undefined' ? window.location.href : 'server',
          timestamp: new Date().toISOString()
        })
      }
      
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        // Try to log failed login attempt, but don't let it break auth
        if (authData?.user?.id) {
          try {
            await loginActivityService.logLoginAttempt(
              authData.user.id,
              false,
              error.message
            )
          } catch (logError) {
            logger.warn('Failed to log login attempt:', logError)
          }
        }
        throw this.handleAuthError(error)
      }

      if (!authData.user) {
        throw new AuthError(
          'Signin successful but no user data returned',
          'AUTH_INVALID_RESPONSE'
        )
      }

      // Store remember me preference
      if (data.rememberMe !== undefined) {
        localStorage.setItem('rememberMe', data.rememberMe.toString())
        
        // If remember me is true, extend the session
        if (data.rememberMe && authData.session) {
          // Note: Supabase doesn't directly support extending sessions client-side
          // This is handled by the session refresh logic
          logger.info('Remember me enabled for user', { userId: authData.user.id })
        }
      }

      // Try to log successful login, but don't let it break auth
      try {
        await loginActivityService.logLoginAttempt(authData.user.id, true)
      } catch (logError) {
        logger.warn('Failed to log successful login:', logError)
      }

      logger.info('User signin successful', { userId: authData.user.id })
      return { data: authData.user }
    } catch (error) {
      logger.error('Signin failed', error)
      
      if (error instanceof AuthError) {
        return { error }
      }
      
      return {
        error: new AuthError(
          'An unexpected error occurred during signin',
          'AUTH_UNKNOWN_ERROR',
          error as Error
        )
      }
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<AuthResponse<void>> {
    try {
      logger.info('Attempting user signout')
      
      const { error } = await this.supabase.auth.signOut()

      if (error) {
        throw this.handleAuthError(error)
      }

      logger.info('User signout successful')
      return { data: undefined }
    } catch (error) {
      logger.error('Signout failed', error)
      
      if (error instanceof AuthError) {
        return { error }
      }
      
      return {
        error: new AuthError(
          'An unexpected error occurred during signout',
          'AUTH_UNKNOWN_ERROR',
          error as Error
        )
      }
    }
  }

  /**
   * Reset password for a user
   */
  async resetPassword(email: string): Promise<AuthResponse<void>> {
    try {
      logger.info('Attempting password reset', { email })
      
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthCallbackURL('/auth/reset-password'),
      })

      if (error) {
        throw this.handleAuthError(error)
      }

      logger.info('Password reset email sent', { email })
      return { data: undefined }
    } catch (error) {
      logger.error('Password reset failed', error)
      
      if (error instanceof AuthError) {
        return { error }
      }
      
      return {
        error: new AuthError(
          'An unexpected error occurred during password reset',
          'AUTH_UNKNOWN_ERROR',
          error as Error
        )
      }
    }
  }

  /**
   * Update password for authenticated user
   */
  async updatePassword(newPassword: string): Promise<AuthResponse<User>> {
    try {
      logger.info('Attempting password update')
      
      const { data, error } = await this.supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw this.handleAuthError(error)
      }

      if (!data.user) {
        throw new AuthError(
          'Password update successful but no user data returned',
          'AUTH_INVALID_RESPONSE'
        )
      }

      logger.info('Password update successful', { userId: data.user.id })
      return { data: data.user }
    } catch (error) {
      logger.error('Password update failed', error)
      
      if (error instanceof AuthError) {
        return { error }
      }
      
      return {
        error: new AuthError(
          'An unexpected error occurred during password update',
          'AUTH_UNKNOWN_ERROR',
          error as Error
        )
      }
    }
  }

  /**
   * Resend confirmation email
   */
  async resendConfirmationEmail(email: string): Promise<AuthResponse<void>> {
    try {
      logger.info('Attempting to resend confirmation email', { email })
      
      const { error } = await this.supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: getAuthCallbackURL('/auth/verify')
        }
      })

      if (error) {
        throw this.handleAuthError(error)
      }

      logger.info('Confirmation email resent', { email })
      return { data: undefined }
    } catch (error) {
      logger.error('Failed to resend confirmation email', error)
      
      if (error instanceof AuthError) {
        return { error }
      }
      
      return {
        error: new AuthError(
          'Failed to resend confirmation email',
          'AUTH_UNKNOWN_ERROR',
          error as Error
        )
      }
    }
  }

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<AuthResponse<User | null>> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()

      if (error) {
        throw this.handleAuthError(error)
      }

      return { data: user }
    } catch (error) {
      logger.error('Failed to get current user', error)
      
      if (error instanceof AuthError) {
        return { error }
      }
      
      return {
        error: new AuthError(
          'Failed to get current user',
          'AUTH_UNKNOWN_ERROR',
          error as Error
        )
      }
    }
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<AuthResponse<User>> {
    try {
      const { data: { session }, error } = await this.supabase.auth.refreshSession()

      if (error) {
        throw this.handleAuthError(error)
      }

      if (!session?.user) {
        throw new AuthError(
          'No active session found',
          'AUTH_SESSION_EXPIRED'
        )
      }

      return { data: session.user }
    } catch (error) {
      logger.error('Failed to refresh session', error)
      
      if (error instanceof AuthError) {
        return { error }
      }
      
      return {
        error: new AuthError(
          'Failed to refresh session',
          'AUTH_UNKNOWN_ERROR',
          error as Error
        )
      }
    }
  }

  /**
   * Handle Supabase auth errors and convert to our error format
   */
  private handleAuthError(error: SupabaseAuthError): AuthError {
    logger.error('Supabase auth error', { 
      message: error.message, 
      status: error.status,
      code: error.code 
    })

    // Enhanced error logging for production debugging
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true') {
      console.error('[ClaimGuardian Auth Error]', {
        message: error.message,
        status: error.status,
        code: error.code,
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        timestamp: new Date().toISOString()
      })
    }

    // Map Supabase error codes to our error codes
    switch (error.message) {
      case 'Invalid login credentials':
        return new AuthError(
          'Invalid email or password',
          'AUTH_INVALID_CREDENTIALS',
          error
        )
      
      case 'User already registered':
        return new AuthError(
          'An account with this email already exists',
          'AUTH_USER_EXISTS',
          error
        )
      
      case 'Email not confirmed':
        return new AuthError(
          'Please verify your email before signing in',
          'AUTH_EMAIL_NOT_VERIFIED',
          error
        )
      
      case 'Invalid email':
        return new AuthError(
          'Please enter a valid email address',
          'VALIDATION_ERROR',
          error
        )
      
      default:
        if (error.status === 429) {
          return new AuthError(
            'Too many attempts. Please try again later',
            'RATE_LIMIT_ERROR',
            error
          )
        }
        
        return new AuthError(
          error.message || 'Authentication failed',
          'AUTH_UNKNOWN_ERROR',
          error
        )
    }
  }
}

export const authService = new AuthService()
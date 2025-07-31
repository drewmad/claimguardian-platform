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

import { User, AuthError as SupabaseAuthError } from '@supabase/supabase-js'

import { loginActivityService } from '@/lib/auth/login-activity-service'
import { AppError, ErrorCode } from '@/lib/errors/app-error'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'
import { getAuthCallbackURL } from '@/lib/utils/site-url'

export class AuthError extends AppError {
  constructor(message: string, code: ErrorCode, originalError?: Error) {
    super(message, code, originalError)
    this.name = 'AuthError'
  }
}

export interface AuthResponse<T = unknown> {
  data?: T
  error?: AuthError
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
  over18?: boolean
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

interface SignInData {
  email: string
  password: string
  rememberMe?: boolean
}

class AuthService {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    try {
      this.supabase = createClient()
      console.log('[AUTH SERVICE] Supabase client created successfully')
    } catch (error) {
      console.error('[AUTH SERVICE] Failed to create Supabase client:', error)
      throw error
    }
  }

  /**
   * Sign up a new user with compliance-grade consent tracking
   */
  async signUp(data: SignUpData): Promise<AuthResponse<User>> {
    try {
      logger.info('Attempting user signup', { email: data.email })
      
      // SIMPLIFIED FLORIDA COMPLIANCE: Basic validation only
      console.log('[AUTH DEBUG] Step 1: Validating basic consent requirements')
      
      // Basic consent validation - just check required agreements
      if (!data.acceptedDocuments?.includes('terms') || !data.acceptedDocuments?.includes('privacy')) {
        console.error('[AUTH DEBUG] Missing required document acceptance')
        throw new AuthError(
          'You must accept the Terms of Service and Privacy Policy to create an account',
          'AUTH_CONSENT_REQUIRED'
        )
      }
      
      if (!data.over18) {
        console.error('[AUTH DEBUG] Age verification failed')
        throw new AuthError(
          'You must be 18 or older to create an account',
          'AUTH_AGE_REQUIRED'
        )
      }
      
      console.log('[AUTH DEBUG] Step 2: Creating user account - basic requirements met')
      
      const { data: authData, error } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            // Simplified compliance - just store what we need
            acceptedDocuments: data.acceptedDocuments,
            termsAccepted: true,
            privacyAccepted: true,
            ageVerified: data.over18,
            signup_timestamp: new Date().toISOString()
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
        
        // Check if this is a network/server error
        if (error.status === 500 || error.status === 503) {
          console.error('[AUTH DEBUG] Server error detected. Possible causes:')
          console.error('1. Supabase service is down')
          console.error('2. Network connectivity issues')
          console.error('3. Invalid Supabase URL or API key')
          console.error('4. Database migrations not applied')
          console.error('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
        }
        
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
      
      // SIMPLIFIED: Basic compliance data is already stored in user metadata
      logger.info('User created with basic compliance data', { 
        userId: authData.user.id,
        termsAccepted: true,
        privacyAccepted: true,
        ageVerified: data.over18
      })
      
      // Simple success logging
      console.log('[AUTH DEBUG] User signup completed successfully', {
        userId: authData.user.id,
        email: authData.user.email,
        emailConfirmationSent: !authData.user?.email_confirmed_at
      })

      
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
      
      logger.error('Signup failed', {}, error instanceof Error ? error : new Error(String(error)))
      
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
      logger.info('Attempting user signin', { email: data.email })
      
      // Enhanced debugging
      console.log('[AUTH DEBUG] SignIn attempt:', {
        email: data.email,
        hasPassword: !!data.password,
        passwordLength: data.password?.length,
        timestamp: new Date().toISOString(),
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
      })
      
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })
      
      console.log('[AUTH DEBUG] SignIn response:', {
        hasUser: !!authData?.user,
        hasSession: !!authData?.session,
        error: error ? {
          message: error.message,
          status: error.status,
          code: error.code
        } : null,
        timestamp: new Date().toISOString()
      })

      if (error) {
        throw this.handleAuthError(error)
      }

      if (!authData.user) {
        throw new AuthError(
          'Signin successful but no user data returned',
          'AUTH_INVALID_RESPONSE'
        )
      }

      logger.info('User signin successful', { userId: authData.user.id })
      
      // Track login activity
      try {
        await loginActivityService.logLoginAttempt(
          authData.user.id,
          true
        )
      } catch (trackingError) {
        console.warn('Failed to track login activity:', trackingError)
      }
      
      return { data: authData.user }
    } catch (error) {
      logger.error('Signin failed', {}, error instanceof Error ? error : new Error(String(error)))
      
      // Track failed login attempt
      try {
        await loginActivityService.logLoginAttempt(
          '', // No userId for failed login
          false,
          error instanceof Error ? error.message : 'Unknown error'
        )
      } catch (trackingError) {
        console.warn('Failed to track failed login:', trackingError)
      }
      
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
      logger.error('Signout failed', {}, error instanceof Error ? error : new Error(String(error)))
      
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
      logger.error('Password reset failed', {}, error instanceof Error ? error : new Error(String(error)))
      
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
      logger.error('Password update failed', {}, error instanceof Error ? error : new Error(String(error)))
      
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
      logger.error('Failed to resend confirmation email', {}, error instanceof Error ? error : new Error(String(error)))
      
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
      logger.error('Failed to get current user', {}, error instanceof Error ? error : new Error(String(error)))
      
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
      logger.error('Failed to refresh session', {}, error instanceof Error ? error : new Error(String(error)))
      
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
    // Comprehensive error logging
    const errorDetails = {
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name,
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      timestamp: new Date().toISOString(),
      rawError: JSON.stringify(error)
    }
    
    logger.error('Supabase auth error', errorDetails)

    // Always log auth errors for debugging
    console.error('[ClaimGuardian Auth Error] Full details:', errorDetails)
    
    // Log the raw error object
    console.error('[ClaimGuardian Auth Error] Raw error:', error)
    
    // If there's additional error info, log it
    if (error.stack) {
      console.error('[ClaimGuardian Auth Error] Stack trace:', error.stack)
    }

    // Map Supabase error codes to our error codes
    // Check both message and status for better error mapping
    if (error.message?.toLowerCase().includes('invalid login credentials') || 
        error.message?.toLowerCase().includes('invalid credentials')) {
      return new AuthError(
        'Invalid email or password',
        'AUTH_INVALID_CREDENTIALS',
        error
      )
    }
    
    if (error.message?.toLowerCase().includes('user already registered')) {
      return new AuthError(
        'An account with this email already exists',
        'AUTH_USER_EXISTS',
        error
      )
    }
    
    if (error.message?.toLowerCase().includes('email not confirmed')) {
      return new AuthError(
        'Please verify your email before signing in',
        'AUTH_EMAIL_NOT_VERIFIED',
        error
      )
    }
    
    if (error.message?.toLowerCase().includes('invalid email')) {
      return new AuthError(
        'Please enter a valid email address',
        'VALIDATION_ERROR',
        error
      )
    }
    
    // Handle status-based errors
    if (error.status === 400) {
      return new AuthError(
        'Invalid request. Please check your information and try again.',
        'VALIDATION_ERROR',
        error
      )
    }
    
    if (error.status === 401) {
      return new AuthError(
        'Authentication failed. Please check your credentials.',
        'AUTH_INVALID_CREDENTIALS',
        error
      )
    }
    
    if (error.status === 429) {
      return new AuthError(
        'Too many attempts. Please try again later',
        'RATE_LIMIT_ERROR',
        error
      )
    }
    
    if (error.status === 500 || error.status === 503) {
      return new AuthError(
        'Service temporarily unavailable. Please try again later.',
        'SERVICE_UNAVAILABLE',
        error
      )
    }
    
    // Default error with more helpful message
    return new AuthError(
      error.message || 'An unexpected error occurred. Please try again.',
      'AUTH_UNKNOWN_ERROR',
      error
    )
  }
}

export const authService = new AuthService()
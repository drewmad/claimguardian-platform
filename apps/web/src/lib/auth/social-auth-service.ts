/**
 * @fileMetadata
 * @purpose "Social authentication service with enhanced provider management"
 * @owner auth-team
 * @dependencies ["@supabase/supabase-js", "@/lib/logger"]
 * @exports ["socialAuthService", "SocialProvider", "SocialAccount"]
 * @complexity medium
 * @tags ["auth", "social-login", "oauth", "service"]
 * @status stable
 */

import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

export type SocialProvider = 'google' | 'microsoft' | 'linkedin'

export interface SocialAccount {
  provider: SocialProvider
  email: string
  name: string
  picture?: string
  isConnected: boolean
  linkedAt?: Date
  lastUsed?: Date
  providerId: string
}

export interface SocialLoginOptions {
  provider: SocialProvider
  redirectTo?: string
  scopes?: string
  queryParams?: Record<string, string>
}

export interface SocialAuthResult {
  success: boolean
  user?: any
  error?: string
  requiresEmailVerification?: boolean
}

class SocialAuthService {
  private supabase = createClient()

  /**
   * Initiate social login with specified provider
   */
  async signInWithProvider(options: SocialLoginOptions): Promise<SocialAuthResult> {
    try {
      const { provider, redirectTo, scopes, queryParams } = options
      
      logger.track('social_login_initiated', { provider })

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
          scopes: scopes || this.getDefaultScopes(provider),
          queryParams: queryParams || this.getDefaultQueryParams(provider)
        }
      })

      if (error) {
        logger.error('Social login failed', { provider }, error)
        return {
          success: false,
          error: this.formatAuthError(error.message)
        }
      }

      // OAuth redirect initiated successfully
      return {
        success: true
      }

    } catch (err) {
      logger.error('Unexpected social login error', { provider: options.provider }, err as Error)
      return {
        success: false,
        error: 'An unexpected error occurred during social login'
      }
    }
  }

  /**
   * Get connected social accounts for current user
   */
  async getConnectedAccounts(): Promise<SocialAccount[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user?.identities) {
        return []
      }

      const socialProviders = user.identities.filter(
        identity => ['google', 'microsoft', 'linkedin'].includes(identity.provider)
      )

      return socialProviders.map(identity => ({
        provider: identity.provider as SocialProvider,
        email: identity.identity_data?.email || '',
        name: identity.identity_data?.full_name || identity.identity_data?.name || '',
        picture: identity.identity_data?.picture || identity.identity_data?.avatar_url,
        isConnected: true,
        linkedAt: new Date(identity.created_at),
        lastUsed: new Date(identity.last_sign_in_at || identity.created_at),
        providerId: identity.id
      }))

    } catch (err) {
      logger.error('Failed to get connected accounts', {}, err as Error)
      return []
    }
  }

  /**
   * Check if a specific provider is connected
   */
  async isProviderConnected(provider: SocialProvider): Promise<boolean> {
    const accounts = await this.getConnectedAccounts()
    return accounts.some(account => account.provider === provider)
  }

  /**
   * Get account statistics
   */
  async getAccountStats(): Promise<{
    connectedCount: number
    totalProviders: number
    securityLevel: 'basic' | 'good' | 'high'
    hasMultipleProviders: boolean
  }> {
    const accounts = await this.getConnectedAccounts()
    const connectedCount = accounts.length
    const totalProviders = 3 // google, microsoft, linkedin
    
    let securityLevel: 'basic' | 'good' | 'high' = 'basic'
    if (connectedCount >= 2) securityLevel = 'high'
    else if (connectedCount === 1) securityLevel = 'good'

    return {
      connectedCount,
      totalProviders,
      securityLevel,
      hasMultipleProviders: connectedCount > 1
    }
  }

  /**
   * Get provider-specific configuration
   */
  getProviderConfig(provider: SocialProvider) {
    const configs = {
      google: {
        name: 'Google',
        color: 'bg-red-500 hover:bg-red-600',
        icon: 'Chrome',
        scopes: 'openid email profile',
        queryParams: { access_type: 'offline', prompt: 'consent' }
      },
      microsoft: {
        name: 'Microsoft',
        color: 'bg-blue-600 hover:bg-blue-700',
        icon: 'Building2',
        scopes: 'openid email profile',
        queryParams: { prompt: 'select_account' }
      },
      linkedin: {
        name: 'LinkedIn',
        color: 'bg-blue-700 hover:bg-blue-800',
        icon: 'Linkedin',
        scopes: 'openid email profile',
        queryParams: { prompt: 'consent' }
      }
    }

    return configs[provider]
  }

  /**
   * Handle OAuth callback and extract user data
   */
  async handleCallback(): Promise<SocialAuthResult> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()

      if (error) {
        logger.error('OAuth callback error', {}, error)
        return {
          success: false,
          error: this.formatAuthError(error.message)
        }
      }

      if (!session?.user) {
        return {
          success: false,
          error: 'No user session found'
        }
      }

      const user = session.user
      const provider = this.extractProviderFromUser(user)
      
      logger.track('social_login_completed', {
        provider,
        userId: user.id,
        email: user.email,
        isNewConnection: this.isNewConnection(user)
      })

      return {
        success: true,
        user,
        requiresEmailVerification: !user.email_confirmed_at
      }

    } catch (err) {
      logger.error('OAuth callback processing failed', {}, err as Error)
      return {
        success: false,
        error: 'Failed to process authentication callback'
      }
    }
  }

  /**
   * Link additional social account to existing user
   */
  async linkProvider(provider: SocialProvider): Promise<SocialAuthResult> {
    try {
      // Check if user is already authenticated
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        return {
          success: false,
          error: 'Must be signed in to link accounts'
        }
      }

      // Check if provider is already linked
      const isConnected = await this.isProviderConnected(provider)
      if (isConnected) {
        return {
          success: false,
          error: `${this.getProviderConfig(provider).name} account is already connected`
        }
      }

      // Initiate OAuth link
      return this.signInWithProvider({
        provider,
        redirectTo: `${window.location.origin}/auth/social-connect`
      })

    } catch (err) {
      logger.error('Provider linking failed', { provider }, err as Error)
      return {
        success: false,
        error: 'Failed to link social account'
      }
    }
  }

  // Private helper methods

  private getDefaultScopes(provider: SocialProvider): string {
    return this.getProviderConfig(provider).scopes
  }

  private getDefaultQueryParams(provider: SocialProvider): Record<string, string> {
    return this.getProviderConfig(provider).queryParams
  }

  private extractProviderFromUser(user: any): string {
    const identities = user.identities || []
    const lastIdentity = identities[identities.length - 1]
    
    if (lastIdentity?.provider) {
      const config = this.getProviderConfig(lastIdentity.provider as SocialProvider)
      return config?.name || lastIdentity.provider
    }
    
    return 'Social Provider'
  }

  private isNewConnection(user: any): boolean {
    const identities = user.identities || []
    return identities.length > 1
  }

  private formatAuthError(message: string): string {
    // Map common OAuth error messages to user-friendly text
    const errorMappings: Record<string, string> = {
      'access_denied': 'You cancelled the login process. Please try again.',
      'invalid_request': 'There was an issue with the login request. Please try again.',
      'server_error': 'The authentication service is temporarily unavailable. Please try again later.',
      'temporarily_unavailable': 'The service is temporarily unavailable. Please try again later.',
      'invalid_grant': 'The authentication session has expired. Please try again.',
      'unauthorized_client': 'There was a configuration issue. Please contact support.'
    }

    // Check for specific error codes
    for (const [code, friendlyMessage] of Object.entries(errorMappings)) {
      if (message.toLowerCase().includes(code)) {
        return friendlyMessage
      }
    }

    // Return original message if no mapping found
    return message || 'An error occurred during social login'
  }
}

export const socialAuthService = new SocialAuthService()
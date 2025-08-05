/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
/**
 * Simplified auth service - just the basics
 */

import { createBrowserSupabaseClient } from '@claimguardian/db'
import { User } from '@supabase/supabase-js'

interface AuthResponse<T = unknown> {
  data?: T
  error?: Error
}

interface SignUpData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

interface SignInData {
  email: string
  password: string
}

class SimpleAuthService {
  private supabase = createBrowserSupabaseClient()

  /**
   * Sign up a new user - SIMPLE VERSION
   */
  async signUp(data: SignUpData): Promise<AuthResponse<User>> {
    try {
      const { data: authData, error } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            firstName: data.firstName || '',
            lastName: data.lastName || ''
          }
        }
      })

      if (error) {
        return { error }
      }

      if (!authData.user) {
        return { error: new Error('Signup failed') }
      }

      return { data: authData.user }
    } catch (error) {
      return { error: error as Error }
    }
  }

  /**
   * Sign in a user - SIMPLE VERSION
   */
  async signIn(data: SignInData): Promise<AuthResponse<User>> {
    try {
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (error) {
        return { error }
      }

      if (!authData.user) {
        return { error: new Error('Login failed') }
      }

      return { data: authData.user }
    } catch (error) {
      return { error: error as Error }
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<AuthResponse<void>> {
    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) {
        return { error }
      }
      return { data: undefined }
    } catch (error) {
      return { error: error as Error }
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<AuthResponse<User | null>> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      if (error) {
        return { error }
      }
      return { data: user }
    } catch (error) {
      return { error: error as Error }
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<AuthResponse<void>> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email)
      if (error) {
        return { error }
      }
      return { data: undefined }
    } catch (error) {
      return { error: error as Error }
    }
  }
}

export const simpleAuthService = new SimpleAuthService()
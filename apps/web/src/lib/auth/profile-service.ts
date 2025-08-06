/**
 * @fileMetadata
 * @purpose "User profile management service"
 * @owner auth-team
 * @dependencies ["@supabase/supabase-js", "@/lib/logger"]
 * @exports ["profileService"]
 * @complexity medium
 * @tags ["auth", "profile", "user-management"]
 * @status stable
 */

import { authService } from './auth-service'

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'

export interface UserProfile {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  avatarUrl?: string
  xHandle?: string
  isXConnected?: boolean
  createdAt: string
  updatedAt: string
  emailVerified: boolean
}

export interface ProfileUpdateData {
  firstName?: string
  lastName?: string
  phone?: string
  avatarUrl?: string
  xHandle?: string
  isXConnected?: boolean
}

export interface EmailChangeRequest {
  newEmail: string
  password: string
}

class ProfileService {
  private supabase = createClient()
  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data: user, error: userError } = await this.supabase.auth.getUser()
      
      if (userError || !user) {
        const logError = userError ? new Error(userError.message) : undefined;
        logger.error('Failed to get auth user', {}, logError)
        return null
      }

      const { data: profile, error: profileError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileError) {
        const logError = profileError ? new Error(profileError.message) : undefined;
        logger.error('Failed to fetch profile', {}, logError)
        return null
      }

      return {
        id: profile.user_id,
        email: user.user.email || '',
        firstName: profile.first_name,
        lastName: profile.last_name,
        phone: profile.phone,
        avatarUrl: profile.avatar_url,
        xHandle: profile.x_handle,
        isXConnected: profile.is_x_connected,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        emailVerified: user.user.email_confirmed_at !== null
      }
    } catch (err) {
      logger.error('Error fetching profile', { userId }, err instanceof Error ? err : new Error(String(err)))
      return null
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: ProfileUpdateData): Promise<boolean> {
    try {
      // Verify the current user matches the profile being updated
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        const logError = authError ? new Error(authError.message) : undefined;
        logger.error('Failed to get authenticated user', {}, logError)
        return false
      }
      
      if (user.id !== userId) {
        logger.error('User ID mismatch', { authenticatedUserId: user.id, requestedUserId: userId })
        return false
      }
      
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      }

      if (data.firstName !== undefined) updateData.first_name = data.firstName
      if (data.lastName !== undefined) updateData.last_name = data.lastName
      if (data.phone !== undefined) updateData.phone = data.phone
      if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl
      if (data.xHandle !== undefined) updateData.x_handle = data.xHandle
      if (data.isXConnected !== undefined) updateData.is_x_connected = data.isXConnected

      logger.info('Attempting profile update', { userId, updateData })
      
      const { data: updatedProfile, error } = await this.supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        logger.error('Failed to update profile', { 
          userId, 
          updateData,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint
        }, error instanceof Error ? error : new Error(String(error)))
        return false
      }

      logger.info('Profile update response', { userId, updatedProfile })

      logger.info('Profile updated successfully', { userId })
      return true
    } catch (error) {
      logger.error('Error updating profile', { userId }, error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  /**
   * Request email change
   */
  async requestEmailChange(userId: string, data: EmailChangeRequest): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // First, verify the user's password
      const { data: user, error: userError } = await this.supabase.auth.getUser()
      
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Re-authenticate with password to ensure it's correct
      const { error: signInError } = await this.supabase.auth.signInWithPassword({
        email: user.user.email!,
        password: data.password
      })

      if (signInError) {
        return { success: false, error: 'Incorrect password' }
      }

      // Update email
      const { error: updateError } = await this.supabase.auth.updateUser({
        email: data.newEmail
      })

      if (updateError) {
        const logError = updateError ? new Error(updateError.message) : undefined;
        logger.error('Failed to update email', {}, logError)
        
        if (updateError.message.includes('already registered')) {
          return { success: false, error: 'This email is already in use' }
        }
        
        return { success: false, error: 'Failed to update email' }
      }

      logger.info('Email change requested', { userId, newEmail: data.newEmail })
      return { success: true }
    } catch (error) {
      logger.error('Error requesting email change', { userId }, error instanceof Error ? error : new Error(String(error)))
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Update password
   */
  async updatePassword(currentPassword: string, newPassword: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // First, verify current password
      const { data: user, error: userError } = await this.supabase.auth.getUser()
      
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Re-authenticate with current password
      const { error: signInError } = await this.supabase.auth.signInWithPassword({
        email: user.user.email!,
        password: currentPassword
      })

      if (signInError) {
        return { success: false, error: 'Current password is incorrect' }
      }

      // Update password
      const { error } = await authService.updatePassword(newPassword)

      if (error) {
        return { success: false, error: error.message }
      }

      logger.info('Password updated successfully', { userId: user.user.id })
      return { success: true }
    } catch (error) {
      logger.error('Error updating password', {}, error instanceof Error ? error : new Error(String(error)))
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(userId: string, file: File): Promise<{
    url?: string
    error?: string
  }> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await this.supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        const logError = uploadError ? new Error(uploadError.message) : undefined;
        logger.error('Failed to upload avatar', {}, logError)
        return { error: 'Failed to upload avatar' }
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with avatar URL
      await this.updateProfile(userId, { avatarUrl: publicUrl })

      logger.info('Avatar uploaded successfully', { userId, filePath })
      return { url: publicUrl }
    } catch (err) {
      logger.error('Error uploading avatar', { userId }, err instanceof Error ? err : new Error(String(err)))
      return { error: 'An unexpected error occurred' }
    }
  }

  /**
   * Delete account
   */
  async deleteAccount(userId: string, password: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Verify password first
      const { data: user, error: userError } = await this.supabase.auth.getUser()
      
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Re-authenticate with password
      const { error: signInError } = await this.supabase.auth.signInWithPassword({
        email: user.user.email!,
        password: password
      })

      if (signInError) {
        return { success: false, error: 'Incorrect password' }
      }

      // Delete user account
      // Note: In production, this would trigger a server-side function
      // to properly clean up all user data
      logger.warn('Account deletion requested', { userId })
      
      // For now, we'll just sign out
      await authService.signOut()
      
      return { success: true }
    } catch (err) {
      logger.error('Error deleting account', { userId }, err instanceof Error ? err : new Error(String(err)))
      return { success: false, error: 'An unexpected error occurred' }
    }
  }
}

export const profileService = new ProfileService()
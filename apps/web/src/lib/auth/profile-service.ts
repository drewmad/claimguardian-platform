/**
 * @fileMetadata
 * @purpose User profile management service
 * @owner auth-team
 * @dependencies ["@supabase/supabase-js", "@/lib/logger"]
 * @exports ["profileService"]
 * @complexity medium
 * @tags ["auth", "profile", "user-management"]
 * @status active
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { authService } from './auth-service'

export interface UserProfile {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
  emailVerified: boolean
}

export interface ProfileUpdateData {
  firstName?: string
  lastName?: string
  phone?: string
  avatarUrl?: string
}

export interface EmailChangeRequest {
  newEmail: string
  password: string
}

class ProfileService {
  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data: user, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        logger.error('Failed to get auth user', userError)
        return null
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        logger.error('Failed to fetch profile', profileError)
        return null
      }

      return {
        id: profile.id,
        email: user.user.email || '',
        firstName: profile.first_name,
        lastName: profile.last_name,
        phone: profile.phone,
        avatarUrl: profile.avatar_url,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        emailVerified: user.user.email_confirmed_at !== null
      }
    } catch (err) {
      logger.error('Error fetching profile', err)
      return null
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: ProfileUpdateData): Promise<boolean> {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      }

      if (data.firstName !== undefined) updateData.first_name = data.firstName
      if (data.lastName !== undefined) updateData.last_name = data.lastName
      if (data.phone !== undefined) updateData.phone = data.phone
      if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (error) {
        logger.error('Failed to update profile', error)
        return false
      }

      logger.info('Profile updated successfully', { userId })
      return true
    } catch (err) {
      logger.error('Error updating profile', err)
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
      const { data: user, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Re-authenticate with password to ensure it's correct
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.user.email!,
        password: data.password
      })

      if (signInError) {
        return { success: false, error: 'Incorrect password' }
      }

      // Update email
      const { error: updateError } = await supabase.auth.updateUser({
        email: data.newEmail
      })

      if (updateError) {
        logger.error('Failed to update email', updateError)
        
        if (updateError.message.includes('already registered')) {
          return { success: false, error: 'This email is already in use' }
        }
        
        return { success: false, error: 'Failed to update email' }
      }

      logger.info('Email change requested', { userId, newEmail: data.newEmail })
      return { success: true }
    } catch (err) {
      logger.error('Error requesting email change', err)
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
      const { data: user, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Re-authenticate with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
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
    } catch (err) {
      logger.error('Error updating password', err)
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
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        logger.error('Failed to upload avatar', uploadError)
        return { error: 'Failed to upload avatar' }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with avatar URL
      await this.updateProfile(userId, { avatarUrl: publicUrl })

      logger.info('Avatar uploaded successfully', { userId, filePath })
      return { url: publicUrl }
    } catch (err) {
      logger.error('Error uploading avatar', err)
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
      const { data: user, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Re-authenticate with password
      const { error: signInError } = await supabase.auth.signInWithPassword({
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
      logger.error('Error deleting account', err)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }
}

export const profileService = new ProfileService()
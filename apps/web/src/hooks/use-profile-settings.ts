/**
 * @fileMetadata
 * @purpose Custom hook for managing user profile settings and updates
 * @owner platform-team
 * @complexity medium
 * @tags ["hooks", "profile", "settings", "user-management"]
 * @status active
 */

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { profileService, type UserProfile } from '@/lib/auth/profile-service'
import { inputSanitizer } from '@/lib/security/input-sanitizer'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'

export type ProfileFormData = {
  firstName: string
  lastName: string
  phone: string
  bio?: string
  location?: string
}

export type ProfileSettingsState = {
  profile: UserProfile | null
  formData: ProfileFormData
  loading: boolean
  saving: boolean
  hasChanges: boolean
  errors: Record<string, string>
}

export function useProfileSettings() {
  const { user } = useAuth()
  
  const [state, setState] = useState<ProfileSettingsState>({
    profile: null,
    formData: {
      firstName: '',
      lastName: '',
      phone: '',
      bio: '',
      location: '',
    },
    loading: false,
    saving: false,
    hasChanges: false,
    errors: {},
  })

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!user?.id) return

    setState(prev => ({ ...prev, loading: true, errors: {} }))

    try {
      const profile = await profileService.getProfile(user.id)
      
      const formData: ProfileFormData = {
        firstName: profile?.first_name || user.user_metadata?.firstName || '',
        lastName: profile?.last_name || user.user_metadata?.lastName || '',
        phone: profile?.phone || '',
        bio: profile?.bio || '',
        location: profile?.location || '',
      }

      setState(prev => ({
        ...prev,
        profile,
        formData,
        loading: false,
        hasChanges: false,
      }))

      logger.info('Profile loaded successfully', { userId: user.id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile'
      setState(prev => ({
        ...prev,
        loading: false,
        errors: { general: errorMessage },
      }))

      logger.error('Failed to load profile', { error, userId: user.id })
      toast.error('Failed to load profile settings')
    }
  }, [user])

  // Update form field
  const updateField = useCallback((field: keyof ProfileFormData, value: string) => {
    setState(prev => {
      // Sanitize input based on field type
      let sanitizedValue = value
      switch (field) {
        case 'firstName':
        case 'lastName':
          sanitizedValue = inputSanitizer.sanitizeText(value, 50)
          break
        case 'phone':
          sanitizedValue = inputSanitizer.sanitizePhone(value)
          break
        case 'bio':
          sanitizedValue = inputSanitizer.sanitizeText(value, 500)
          break
        case 'location':
          sanitizedValue = inputSanitizer.sanitizeText(value, 100)
          break
      }

      const newFormData = { ...prev.formData, [field]: sanitizedValue }
      
      // Check for changes
      const originalData = {
        firstName: prev.profile?.first_name || user?.user_metadata?.firstName || '',
        lastName: prev.profile?.last_name || user?.user_metadata?.lastName || '',
        phone: prev.profile?.phone || '',
        bio: prev.profile?.bio || '',
        location: prev.profile?.location || '',
      }
      
      const hasChanges = Object.keys(newFormData).some(
        key => newFormData[key as keyof ProfileFormData] !== originalData[key as keyof ProfileFormData]
      )

      return {
        ...prev,
        formData: newFormData,
        hasChanges,
        errors: { ...prev.errors, [field]: '' }, // Clear field error
      }
    })
  }, [user])

  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {}

    // Required fields validation
    if (!state.formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    }

    if (!state.formData.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }

    // Phone validation (if provided)
    if (state.formData.phone && !inputSanitizer.sanitizePhone(state.formData.phone)) {
      errors.phone = 'Please enter a valid phone number'
    }

    // Update errors
    setState(prev => ({ ...prev, errors }))

    return Object.keys(errors).length === 0
  }, [state.formData])

  // Save profile changes
  const saveProfile = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !validateForm()) {
      return false
    }

    setState(prev => ({ ...prev, saving: true, errors: {} }))

    try {
      // Prepare update data
      const updateData = {
        first_name: state.formData.firstName.trim(),
        last_name: state.formData.lastName.trim(),
        phone: state.formData.phone.trim() || null,
        bio: state.formData.bio?.trim() || null,
        location: state.formData.location?.trim() || null,
      }

      // Update profile
      const updatedProfile = await profileService.updateProfile(user.id, updateData)

      setState(prev => ({
        ...prev,
        profile: updatedProfile,
        saving: false,
        hasChanges: false,
      }))

      logger.info('Profile updated successfully', { userId: user.id, changes: updateData })
      toast.success('Profile updated successfully')

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
      setState(prev => ({
        ...prev,
        saving: false,
        errors: { general: errorMessage },
      }))

      logger.error('Failed to update profile', { error, userId: user.id })
      toast.error('Failed to update profile')

      return false
    }
  }, [user, state.formData, validateForm])

  // Reset form to original values
  const resetForm = useCallback(() => {
    if (!state.profile && !user) return

    const originalData: ProfileFormData = {
      firstName: state.profile?.first_name || user?.user_metadata?.firstName || '',
      lastName: state.profile?.last_name || user?.user_metadata?.lastName || '',
      phone: state.profile?.phone || '',
      bio: state.profile?.bio || '',
      location: state.profile?.location || '',
    }

    setState(prev => ({
      ...prev,
      formData: originalData,
      hasChanges: false,
      errors: {},
    }))
  }, [state.profile, user])

  // Load profile on user change
  useEffect(() => {
    if (user?.id) {
      loadProfile()
    }
  }, [user?.id, loadProfile])

  return {
    // State
    profile: state.profile,
    formData: state.formData,
    loading: state.loading,
    saving: state.saving,
    hasChanges: state.hasChanges,
    errors: state.errors,

    // Actions
    updateField,
    saveProfile,
    resetForm,
    loadProfile,
    validateForm,

    // Computed values
    isValid: Object.keys(state.errors).length === 0,
    canSave: state.hasChanges && !state.saving,
  }
}
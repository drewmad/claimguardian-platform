/**
 * @fileMetadata
 * @purpose Custom hook for managing user preferences and application settings
 * @owner platform-team
 * @complexity medium
 * @tags ["hooks", "preferences", "settings", "theme", "notifications"]
 * @status active
 */

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'

export type UserPreferences = {
  // Appearance
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  
  // Notifications
  emailNotifications: boolean
  pushNotifications: boolean
  soundEnabled: boolean
  
  // Security
  twoFactorEnabled: boolean
  sessionTimeout: number // in minutes
  
  // Privacy
  analyticsEnabled: boolean
  dataSharingEnabled: boolean
  marketingEnabled: boolean
  
  // Application
  autoSaveEnabled: boolean
  compactMode: boolean
  showTips: boolean
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  emailNotifications: true,
  pushNotifications: true,
  soundEnabled: true,
  twoFactorEnabled: false,
  sessionTimeout: 30,
  analyticsEnabled: true,
  dataSharingEnabled: false,
  marketingEnabled: false,
  autoSaveEnabled: true,
  compactMode: false,
  showTips: true,
}

export type PreferencesState = {
  preferences: UserPreferences
  loading: boolean
  saving: boolean
  hasChanges: boolean
  lastSaved: Date | null
}

export function useUserPreferences() {
  const { user } = useAuth()
  
  const [state, setState] = useState<PreferencesState>({
    preferences: DEFAULT_PREFERENCES,
    loading: false,
    saving: false,
    hasChanges: false,
    lastSaved: null,
  })

  // Load preferences from localStorage or API
  const loadPreferences = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))

    try {
      let preferences = DEFAULT_PREFERENCES

      // Try to load from localStorage first (for client-side persistence)
      if (typeof window !== 'undefined') {
        const storageKey = user?.id ? `preferences_${user.id}` : 'preferences_guest'
        const saved = localStorage.getItem(storageKey)
        
        if (saved) {
          try {
            const parsedPreferences = JSON.parse(saved)
            preferences = { ...DEFAULT_PREFERENCES, ...parsedPreferences }
          } catch (error) {
            logger.warn('Failed to parse saved preferences', { error })
          }
        }
      }

      // TODO: Load from API/database for authenticated users
      // if (user?.id) {
      //   const apiPreferences = await preferencesService.getPreferences(user.id)
      //   preferences = { ...preferences, ...apiPreferences }
      // }

      setState(prev => ({
        ...prev,
        preferences,
        loading: false,
        hasChanges: false,
      }))

      // Apply theme preference
      applyThemePreference(preferences.theme)

      logger.info('Preferences loaded', { userId: user?.id })
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }))
      logger.error('Failed to load preferences', { error, userId: user?.id })
      toast.error('Failed to load preferences')
    }
  }, [user?.id])

  // Apply theme to document
  const applyThemePreference = useCallback((theme: UserPreferences['theme']) => {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    
    switch (theme) {
      case 'light':
        root.classList.remove('dark')
        break
      case 'dark':
        root.classList.add('dark')
        break
      case 'system':
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (prefersDark) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
        break
    }
  }, [])

  // Update a single preference
  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setState(prev => {
      const newPreferences = { ...prev.preferences, [key]: value }
      
      // Apply theme changes immediately
      if (key === 'theme') {
        applyThemePreference(value as UserPreferences['theme'])
      }

      return {
        ...prev,
        preferences: newPreferences,
        hasChanges: true,
      }
    })
  }, [applyThemePreference])

  // Update multiple preferences
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setState(prev => {
      const newPreferences = { ...prev.preferences, ...updates }
      
      // Apply theme changes if theme was updated
      if (updates.theme) {
        applyThemePreference(updates.theme)
      }

      return {
        ...prev,
        preferences: newPreferences,
        hasChanges: true,
      }
    })
  }, [applyThemePreference])

  // Save preferences
  const savePreferences = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, saving: true }))

    try {
      // Save to localStorage
      if (typeof window !== 'undefined') {
        const storageKey = user?.id ? `preferences_${user.id}` : 'preferences_guest'
        localStorage.setItem(storageKey, JSON.stringify(state.preferences))
      }

      // TODO: Save to API/database for authenticated users
      // if (user?.id) {
      //   await preferencesService.updatePreferences(user.id, state.preferences)
      // }

      setState(prev => ({
        ...prev,
        saving: false,
        hasChanges: false,
        lastSaved: new Date(),
      }))

      logger.info('Preferences saved', { userId: user?.id, preferences: state.preferences })
      toast.success('Preferences saved successfully')

      return true
    } catch (error) {
      setState(prev => ({ ...prev, saving: false }))
      logger.error('Failed to save preferences', { error, userId: user?.id })
      toast.error('Failed to save preferences')

      return false
    }
  }, [user?.id, state.preferences])

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setState(prev => ({
      ...prev,
      preferences: DEFAULT_PREFERENCES,
      hasChanges: true,
    }))
    
    applyThemePreference(DEFAULT_PREFERENCES.theme)
    toast.info('Preferences reset to defaults')
  }, [applyThemePreference])

  // Auto-save functionality
  useEffect(() => {
    if (!state.hasChanges || state.saving) return

    const autoSaveTimer = setTimeout(() => {
      if (state.preferences.autoSaveEnabled) {
        savePreferences()
      }
    }, 2000) // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer)
  }, [state.hasChanges, state.saving, state.preferences.autoSaveEnabled, savePreferences])

  // Listen for system theme changes
  useEffect(() => {
    if (state.preferences.theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      applyThemePreference('system')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [state.preferences.theme, applyThemePreference])

  // Load preferences on mount
  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  // Computed values
  const isDarkMode = state.preferences.theme === 'dark' || 
    (state.preferences.theme === 'system' && 
     typeof window !== 'undefined' && 
     window.matchMedia('(prefers-color-scheme: dark)').matches)

  return {
    // State
    preferences: state.preferences,
    loading: state.loading,
    saving: state.saving,
    hasChanges: state.hasChanges,
    lastSaved: state.lastSaved,

    // Actions
    updatePreference,
    updatePreferences,
    savePreferences,
    resetToDefaults,
    loadPreferences,

    // Utilities
    applyThemePreference,

    // Computed values
    isDarkMode,
    canSave: state.hasChanges && !state.saving,
  }
}
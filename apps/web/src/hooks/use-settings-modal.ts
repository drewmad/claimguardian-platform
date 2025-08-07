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
'use client'

import { useState } from 'react'

export function useSettingsModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [defaultTab, setDefaultTab] = useState<'profile' | 'preferences' | 'notifications' | 'security' | 'privacy' | 'warranty'>('profile')

  const openSettings = (tab?: 'profile' | 'preferences' | 'notifications' | 'security' | 'privacy' | 'warranty') => {
    if (tab) {
      setDefaultTab(tab)
    }
    setIsOpen(true)
  }

  const closeSettings = () => {
    setIsOpen(false)
  }

  return {
    isOpen,
    defaultTab,
    openSettings,
    closeSettings,
  }
}

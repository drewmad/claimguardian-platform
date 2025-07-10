'use client'

import { Settings } from 'lucide-react'
import { useSettingsModal } from '@/hooks/use-settings-modal'
import { Button } from '@/components/ui/button'
import { SettingsModal } from '@/components/modals/settings-modal'

interface QuickSettingsButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showLabel?: boolean
  defaultTab?: 'profile' | 'preferences' | 'notifications' | 'security' | 'privacy' | 'warranty'
}

export function QuickSettingsButton({ 
  variant = 'ghost', 
  size = 'sm', 
  className = '', 
  showLabel = false,
  defaultTab = 'profile' 
}: QuickSettingsButtonProps) {
  const { isOpen, openSettings, closeSettings } = useSettingsModal()

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => openSettings(defaultTab)}
        className={className}
        title={showLabel ? undefined : 'Settings'}
      >
        <Settings className="h-4 w-4" />
        {showLabel && <span className="ml-2">Settings</span>}
      </Button>
      
      <SettingsModal isOpen={isOpen} onClose={closeSettings} defaultTab={defaultTab} />
    </>
  )
}
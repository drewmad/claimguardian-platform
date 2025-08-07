/**
 * @fileMetadata
 * @purpose "Sign out button component with loading state"
 * @dependencies ["@/components","@/lib","@claimguardian/ui","lucide-react","react"]
 * @owner frontend-team
 * @status stable
 */
'use client'

import { Button } from '@claimguardian/ui'
import { LogOut, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { logger } from "@/lib/logger/production-logger"

import { useAuth } from '@/components/auth/auth-provider'

interface SignOutButtonProps {
  variant?: 'default' | 'ghost' | 'secondary' | 'link'
  size?: 'sm' | 'default' | 'lg' | 'icon'
  showIcon?: boolean
  className?: string
}

export function SignOutButton({
  variant = 'ghost',
  size = 'sm',
  showIcon = true,
  className = ''
}: SignOutButtonProps) {
  const { signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
    } catch (error) {
      logger.error('Sign out error:', error)
      // Even if sign out fails, try to redirect
      window.location.href = '/'
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing out...
        </>
      ) : (
        <>
          {showIcon && <LogOut className="mr-2 h-4 w-4" />}
          Sign Out
        </>
      )}
    </Button>
  )
}

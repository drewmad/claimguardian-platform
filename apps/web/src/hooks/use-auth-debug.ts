/**
 * @fileMetadata
 * @purpose "Debug hook for authentication issues"
 * @owner platform-team
 * @dependencies ["react", "@/components/auth/auth-provider"]
 * @exports ["useAuthDebug"]
 * @complexity low
 * @tags ["auth", "debug", "hook"]
 * @status development
 */

'use client'

import { useEffect } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { createClient } from '@/lib/supabase/client'

export function useAuthDebug(componentName: string) {
  const { user, loading, error } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    // Only enable debug logging in development
    if (process.env.NODE_ENV !== 'development') return
    
    const checkAuthState = async () => {
      const { logger } = await import('@/lib/logger')
      
      // Check Supabase user directly
      const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser()
      
      logger.authDebug(componentName, {
        loading,
        hasUser: !!user,
        error: error?.message,
        sessionValid: !!supabaseUser,
        sessionError: userError?.message
      })
    }

    checkAuthState()
  }, [componentName, user, loading, error, supabase])

  return { user, loading, error }
}
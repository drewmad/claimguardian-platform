/**
 * @fileMetadata
 * @purpose Debug hook for authentication issues
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
    const checkAuthState = async () => {
      console.group(`[${componentName}] Auth Debug`)
      console.log('Component:', componentName)
      console.log('Loading:', loading)
      console.log('User:', user?.id || 'null')
      console.log('Error:', error?.message || 'none')
      
      // Check Supabase session directly
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Direct session check:', {
        hasSession: !!session,
        sessionUser: session?.user?.id || 'null',
        sessionError: sessionError?.message || 'none'
      })
      
      // Check cookies
      if (typeof window !== 'undefined') {
        console.log('Cookies:', document.cookie)
        console.log('Location:', window.location.pathname)
      }
      
      console.groupEnd()
    }

    checkAuthState()
  }, [componentName, user, loading, error, supabase])

  return { user, loading, error }
}
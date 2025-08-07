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

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'

interface SessionMonitorProps {
  children: React.ReactNode
  inactivityTimeout?: number // in minutes, default 480 (8 hours)
  warningTime?: number // in minutes before timeout, default 5
}

export function SessionMonitor({
  children,
  inactivityTimeout = 480, // 8 hours
  warningTime = 5
}: SessionMonitorProps) {
  const router = useRouter()
  const supabase = createClient()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<Date>(new Date())

  // Reset activity timer
  const resetTimer = useCallback(() => {
    lastActivityRef.current = new Date()

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
    }

    // Set warning timer
    const warningMs = (inactivityTimeout - warningTime) * 60 * 1000
    warningRef.current = setTimeout(() => {
      toast.warning(`Your session will expire in ${warningTime} minutes due to inactivity`, {
        duration: 10000,
        action: {
          label: 'Stay logged in',
          onClick: async () => {
            // Refresh the session
            const { error } = await supabase.auth.refreshSession()
            if (!error) {
              resetTimer()
              toast.success('Session refreshed')
            }
          }
        }
      })
    }, warningMs)

    // Set logout timer
    const timeoutMs = inactivityTimeout * 60 * 1000
    timeoutRef.current = setTimeout(async () => {
      // Auto logout
      await supabase.auth.signOut()
      toast.error('You have been logged out due to inactivity')
      router.push('/auth/signin?message=Session expired due to inactivity')
    }, timeoutMs)
  }, [inactivityTimeout, warningTime, router, supabase])

  // Monitor user activity
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    const handleActivity = () => {
      const now = new Date()
      const timeSinceLastActivity = now.getTime() - lastActivityRef.current.getTime()

      // Only reset timer if more than 1 minute has passed since last activity
      // This prevents excessive timer resets
      if (timeSinceLastActivity > 60000) {
        resetTimer()
      }
    }

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity)
    })

    // Start the timer
    resetTimer()

    // Check session on focus
    const handleFocus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin?message=Session expired')
      } else {
        resetTimer()
      }
    }

    window.addEventListener('focus', handleFocus)

    // Monitor auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // Clear timers on sign out
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (warningRef.current) clearTimeout(warningRef.current)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Reset timer on sign in or token refresh
        resetTimer()
      }
    })

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      window.removeEventListener('focus', handleFocus)
      subscription.unsubscribe()

      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
    }
  }, [resetTimer, router, supabase])

  return <>{children}</>
}

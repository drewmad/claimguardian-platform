/**
 * @fileMetadata
 * @purpose Auth callback page for handling Supabase redirects
 * @owner auth-team
 * @status active
 */

'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient()
        
        // Get the code from the URL
        const code = new URLSearchParams(window.location.search).get('code')
        
        if (code) {
          // Exchange the code for a session
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            logger.error('Failed to exchange code for session', {}, error)
            setError(error.message)
            return
          }
          
          logger.info('Auth callback successful')
          
          // Redirect to dashboard
          router.push('/dashboard')
        } else {
          // No code, check if we're already authenticated
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            logger.info('User already authenticated in callback')
            router.push('/dashboard')
          } else {
            logger.warn('No code or session in auth callback')
            router.push('/')
          }
        }
      } catch (err) {
        logger.error('Auth callback error', {}, err instanceof Error ? err : new Error(String(err)))
        setError('An error occurred during authentication')
      }
    }

    handleCallback()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-slate-800 rounded-lg shadow-xl p-8 text-center">
            <h1 className="text-2xl font-bold mb-4 text-red-400">Authentication Error</h1>
            <p className="text-slate-300 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="btn-primary"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800 rounded-lg shadow-xl p-8 text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Completing Authentication...</h1>
          <p className="text-slate-400">Please wait while we sign you in.</p>
        </div>
      </div>
    </div>
  )
}
/**
 * @fileMetadata
 * @purpose Email verification callback page
 * @owner auth-team
 * @dependencies ["react", "next", "@supabase/supabase-js"]
 * @exports ["default"]
 * @complexity medium
 * @tags ["auth", "verification", "page"]
 * @status active
 */
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { CheckCircle, XCircle, Loader2, Home, LogIn } from 'lucide-react'
import Link from 'next/link'

type VerificationStatus = 'verifying' | 'success' | 'error' | 'invalid'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<VerificationStatus>('verifying')
  const [errorMessage, setErrorMessage] = useState('')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the token from URL
        const token = searchParams.get('token')
        const type = searchParams.get('type')
        
        if (!token || !type) {
          setStatus('invalid')
          setErrorMessage('Invalid verification link')
          logger.error('Invalid verification link', { token: !!token, type })
          return
        }

        logger.info('Attempting email verification', { type })

        // Exchange the token for a session
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as 'signup' | 'recovery' | 'invite'
        })

        if (error) {
          setStatus('error')
          setErrorMessage(error.message || 'Verification failed')
          logger.error('Email verification failed', error)
          return
        }

        if (data.user) {
          setStatus('success')
          logger.track('email_verified', { userId: data.user.id })
          
          // Start countdown for auto-redirect
          const timer = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(timer)
                router.push('/dashboard')
              }
              return prev - 1
            })
          }, 1000)

          return () => clearInterval(timer)
        }
      } catch (err) {
        setStatus('error')
        setErrorMessage('An unexpected error occurred')
        logger.error('Unexpected verification error', err)
      }
    }

    verifyEmail()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800 rounded-lg shadow-xl p-8">
          {status === 'verifying' && (
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Verifying your email...</h1>
              <p className="text-slate-400">Please wait while we verify your email address.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
              <p className="text-slate-400 mb-6">
                Your email has been successfully verified.
              </p>
              <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-300">
                  Redirecting to dashboard in <span className="font-bold text-white">{countdown}</span> seconds...
                </p>
              </div>
              <Link
                href="/dashboard"
                className="btn-primary inline-flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Go to Dashboard
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
              <p className="text-slate-400 mb-6">
                {errorMessage || 'We couldn\'t verify your email address.'}
              </p>
              <div className="space-y-3">
                <p className="text-sm text-slate-400">
                  Common reasons for verification failure:
                </p>
                <ul className="text-left text-sm text-slate-500 space-y-1">
                  <li>• The verification link has expired</li>
                  <li>• The link has already been used</li>
                  <li>• The link is invalid or corrupted</li>
                </ul>
              </div>
              <div className="mt-6 space-y-3">
                <Link
                  href="/auth/resend-verification"
                  className="btn-primary w-full"
                >
                  Request New Verification Email
                </Link>
                <Link
                  href="/"
                  className="btn-secondary w-full inline-flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Back to Home
                </Link>
              </div>
            </div>
          )}

          {status === 'invalid' && (
            <div className="text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Invalid Link</h1>
              <p className="text-slate-400 mb-6">
                This verification link appears to be invalid.
              </p>
              <Link
                href="/"
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
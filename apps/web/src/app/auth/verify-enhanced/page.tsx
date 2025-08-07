/**
 * @fileMetadata
 * @purpose "Enhanced email verification page with modern UI and better UX"
 * @owner auth-team
 * @dependencies ["react", "next", "@supabase/supabase-js", "@/components/auth"]
 * @exports ["default"]
 * @complexity high
 * @tags ["auth", "verification", "page", "enhanced"]
 * @status stable
 */
'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  Loader2,
  Home,
  LogIn,
  RefreshCw,
  Mail,
  AlertTriangle,
  Clock,
  Shield,
  ExternalLink,
  Zap
} from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/notifications/toast-system'
import { useNotifications } from '@/components/notifications/notification-center'
import { EmailVerificationWizard, VerificationStatus } from '@/components/auth/email-verification-enhanced'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'

interface VerificationState {
  status: VerificationStatus
  message: string
  user: any | null
  countdown: number
  canRetry: boolean
  retryCount: number
  errorDetails?: {
    code?: string
    description?: string
    suggestion?: string
  }
}

function EnhancedVerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<VerificationState>({
    status: 'verifying',
    message: 'Verifying your email address...',
    user: null,
    countdown: 0,
    canRetry: false,
    retryCount: 0
  })

  const { success, error: showError, info } = useToast()
  const { addNotification } = useNotifications()

  // Enhanced error mapping for better user experience
  const mapSupabaseError = useCallback((error: any, errorCode?: string, errorDescription?: string) => {
    const errorMappings: Record<string, {
      status: VerificationStatus
      message: string
      suggestion: string
    }> = {
      'invalid_request': {
        status: 'expired',
        message: 'Verification link has expired or is invalid',
        suggestion: 'Please request a new verification email'
      },
      'access_denied': {
        status: 'error',
        message: 'Email verification was cancelled or denied',
        suggestion: 'Please try the verification process again'
      },
      'token_not_found': {
        status: 'error',
        message: 'Invalid verification token',
        suggestion: 'The verification link appears to be malformed'
      },
      'expired_token': {
        status: 'expired',
        message: 'Verification link has expired',
        suggestion: 'Verification links are valid for 24 hours'
      },
      'already_verified': {
        status: 'success',
        message: 'Email address is already verified',
        suggestion: 'You can proceed to your dashboard'
      }
    }

    const mapping = errorMappings[error] || errorMappings[errorCode || ''] || {
      status: 'error' as VerificationStatus,
      message: errorDescription || error?.message || 'Verification failed',
      suggestion: 'Please try again or contact support if the problem persists'
    }

    return {
      ...mapping,
      errorDetails: {
        code: errorCode,
        description: errorDescription,
        suggestion: mapping.suggestion
      }
    }
  }, [])

  const verifyEmail = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        status: 'verifying',
        message: 'Verifying your email address...'
      }))

      const supabase = createClient()

      // Check for error parameters first
      const errorParam = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')
      const errorCode = searchParams.get('error_code')

      if (errorParam) {
        const errorInfo = mapSupabaseError(errorParam, errorCode || undefined, errorDescription || undefined)
        setState(prev => ({
          ...prev,
          ...errorInfo,
          canRetry: true
        }))

        logger.error('Email verification URL error', { error: errorParam, errorDescription, errorCode })
        return
      }

      // Handle different token formats
      const token = searchParams.get('token')
      const type = searchParams.get('type') || 'signup'

      // Check hash fragment for newer format
      const hash = window.location.hash
      let tokenHash = token
      let verificationType = type

      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1))
        tokenHash = hashParams.get('token') || token
        verificationType = hashParams.get('type') || type
      }

      if (!tokenHash) {
        // Check if user is already verified
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email_confirmed_at) {
          setState(prev => ({
            ...prev,
            status: 'success',
            message: 'Email address is already verified',
            user,
            countdown: 5
          }))

          success('Email already verified! You can proceed to your dashboard')
          router.push('/dashboard')

          // Auto-redirect countdown
          let countdownValue = 5
          const countdownInterval = setInterval(() => {
            countdownValue--
            setState(prev => ({ ...prev, countdown: countdownValue }))

            if (countdownValue <= 0) {
              clearInterval(countdownInterval)
              router.push('/dashboard')
            }
          }, 1000)

          return
        }

        setState(prev => ({
          ...prev,
          status: 'error',
          message: 'No verification token found in the URL',
          canRetry: false,
          errorDetails: {
            suggestion: 'Please check that you used the complete verification link from your email'
          }
        }))
        return
      }

      logger.info('Processing email verification', {
        type: verificationType,
        hasToken: !!tokenHash,
        retryAttempt: state.retryCount
      })

      // Verify the token
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: verificationType as 'signup' | 'recovery' | 'invite'
      })

      if (verifyError) {
        const errorInfo = mapSupabaseError(verifyError.message, undefined, verifyError.message)
        setState(prev => ({
          ...prev,
          ...errorInfo,
          canRetry: true,
          retryCount: prev.retryCount + 1
        }))

        showError(errorInfo.message || 'Verification failed: Unknown error')
        if (errorInfo.status === 'expired') {
          setTimeout(() => router.push('/auth/resend-verification'), 2000)
        }

        logger.error('Email verification failed', { type: verificationType }, verifyError)
        return
      }

      if (data.user) {
        setState(prev => ({
          ...prev,
          status: 'success',
          message: 'Email verified successfully!',
          user: data.user,
          countdown: 3
        }))

        success('Email verified successfully! Welcome to ClaimGuardian')
        setTimeout(() => router.push('/dashboard'), 1500)

        addNotification({
          title: 'Welcome to ClaimGuardian!',
          message: 'Your email has been verified. You can now access all features and start managing your property portfolio.',
          type: 'success',
          priority: 'high',
          source: 'system',
          actionable: true,
          read: false,
          archived: false,
          actions: [{
            id: 'get-started',
            label: 'Get Started',
            type: 'primary',
            handler: () => router.push('/dashboard')
          }]
        })

        logger.track('email_verified_success', {
          userId: data.user.id,
          verificationType,
          retryCount: state.retryCount
        })

        // Auto-redirect with countdown
        let countdownValue = 3
        const countdownInterval = setInterval(() => {
          countdownValue--
          setState(prev => ({ ...prev, countdown: countdownValue }))

          if (countdownValue <= 0) {
            clearInterval(countdownInterval)
            router.push('/dashboard')
          }
        }, 1000)
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        status: 'error',
        message: 'An unexpected error occurred during verification',
        canRetry: true,
        retryCount: prev.retryCount + 1,
        errorDetails: {
          suggestion: 'Please try again or contact support if the problem persists'
        }
      }))

      showError('Verification failed: An unexpected error occurred')

      logger.error('Unexpected verification error', {}, err as Error)
    }
  }, [searchParams, mapSupabaseError, router, success, showError, addNotification, state.retryCount])

  const retryVerification = useCallback(() => {
    verifyEmail()
  }, [verifyEmail])

  useEffect(() => {
    verifyEmail()
  }, [verifyEmail])

  const getStatusIcon = () => {
    switch (state.status) {
      case 'verifying':
        return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />
      case 'expired':
        return <Clock className="w-16 h-16 text-orange-500" />
      default:
        return <Mail className="w-16 h-16 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (state.status) {
      case 'success':
        return 'border-green-500 bg-green-50 dark:bg-green-900/10'
      case 'error':
        return 'border-red-500 bg-red-50 dark:bg-red-900/10'
      case 'expired':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
      case 'verifying':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/10'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.status}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Card className={cn(
              "border-l-4 shadow-2xl backdrop-blur-sm bg-white/95 dark:bg-gray-900/95",
              getStatusColor()
            )}>
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-6">
                  {getStatusIcon()}
                </div>

                <CardTitle className="text-3xl font-bold mb-2">
                  {state.status === 'verifying' && 'Verifying Email'}
                  {state.status === 'success' && 'Email Verified!'}
                  {state.status === 'error' && 'Verification Failed'}
                  {state.status === 'expired' && 'Link Expired'}
                </CardTitle>

                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {state.message}
                </p>

                {state.user?.email && (
                  <Badge variant="outline" className="mt-3 text-sm">
                    {state.user.email}
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Progress bar for verification in progress */}
                {state.status === 'verifying' && (
                  <div className="space-y-3">
                    <Progress value={66} className="h-2" />
                    <p className="text-sm text-center text-gray-500">
                      Processing verification token...
                    </p>
                  </div>
                )}

                {/* Success state with countdown */}
                {state.status === 'success' && (
                  <div className="space-y-4">
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-900/10">
                      <Shield className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        Your account is now fully activated and secure!
                      </AlertDescription>
                    </Alert>

                    {state.countdown > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Redirecting to dashboard in{' '}
                          <span className="font-bold text-blue-900 dark:text-blue-100">
                            {state.countdown}
                          </span>
                          {' '}seconds...
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={() => router.push('/dashboard')}
                      className="w-full bg-green-600 hover:bg-green-700 text-lg h-12"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Go to Dashboard
                    </Button>
                  </div>
                )}

                {/* Error states with helpful information */}
                {(state.status === 'error' || state.status === 'expired') && (
                  <div className="space-y-4">
                    {state.errorDetails?.suggestion && (
                      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/10">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <AlertDescription className="text-orange-800 dark:text-orange-200">
                          {state.errorDetails.suggestion}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-3 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                        Common Solutions:
                      </h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Check your spam/junk folder for the email</li>
                        <li>• Verification links expire after 24 hours</li>
                        <li>• Make sure you're using the complete link</li>
                        <li>• Try requesting a fresh verification email</li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {state.canRetry && (
                        <Button
                          onClick={retryVerification}
                          variant="outline"
                          className="flex items-center justify-center"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry Verification
                        </Button>
                      )}

                      <Button
                        onClick={() => router.push('/auth/resend-verification')}
                        className="flex items-center justify-center"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Get New Email
                      </Button>
                    </div>
                  </div>
                )}

                {/* Additional help and navigation */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => router.push('/')}
                      className="flex-1 flex items-center justify-center"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Back to Home
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => window.open('mailto:support@claimguardianai.com', '_blank')}
                      className="flex-1 flex items-center justify-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Contact Support
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Troubleshooting tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-xs text-center text-gray-500">
                Having trouble?{' '}
                <Link
                  href="/help/verification"
                  className="text-blue-600 hover:underline"
                >
                  View verification troubleshooting guide
                </Link>
                {' '}or{' '}
                <Link
                  href="/contact"
                  className="text-blue-600 hover:underline"
                >
                  contact our support team
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default function EnhancedVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <Card className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10 shadow-2xl backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
            <CardContent className="p-8 text-center">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Loading Verification</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we prepare your email verification...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <EnhancedVerifyContent />
    </Suspense>
  )
}

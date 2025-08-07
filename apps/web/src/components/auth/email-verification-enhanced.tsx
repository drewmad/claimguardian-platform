/**
 * @fileMetadata
 * @purpose "Enhanced email verification system with rich UI and improved UX"
 * @owner auth-team
 * @dependencies ["react", "framer-motion", "@/components/notifications"]
 * @exports ["EmailVerificationWizard", "VerificationStatusCard", "ResendVerificationForm"]
 * @complexity high
 * @tags ["auth", "verification", "email", "enhanced"]
 * @status stable
 */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  Clock,
  RefreshCw,
  ExternalLink,
  Shield,
  Zap,
  AlertTriangle,
  Info,
  Send
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/notifications/toast-system'
import { useNotifications } from '@/components/notifications/notification-center'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'

export type VerificationStatus =
  | 'pending'
  | 'verifying'
  | 'success'
  | 'error'
  | 'expired'
  | 'resent'
  | 'rate_limited'

export interface VerificationState {
  status: VerificationStatus
  message: string
  timestamp: number
  attempts: number
  canResend: boolean
  nextResendTime?: number
  userEmail?: string
  verificationType?: 'signup' | 'email_change' | 'recovery'
}

interface EmailVerificationWizardProps {
  initialEmail?: string
  verificationType?: 'signup' | 'email_change' | 'recovery'
  onSuccess?: () => void
  onCancel?: () => void
  showSkipOption?: boolean
}

export function EmailVerificationWizard({
  initialEmail = '',
  verificationType = 'signup',
  onSuccess,
  onCancel,
  showSkipOption = false
}: EmailVerificationWizardProps) {
  const [state, setState] = useState<VerificationState>({
    status: 'pending',
    message: '',
    timestamp: Date.now(),
    attempts: 0,
    canResend: true,
    userEmail: initialEmail,
    verificationType
  })

  const [countdown, setCountdown] = useState(0)
  const [isPolling, setIsPolling] = useState(false)
  const pollingInterval = useRef<NodeJS.Timeout>()
  const countdownInterval = useRef<NodeJS.Timeout>()

  const { success, error, info, loading } = useToast()
  const { addNotification } = useNotifications()

  // Auto-polling for verification status
  const startPolling = useCallback(() => {
    if (isPolling) return

    setIsPolling(true)
    pollingInterval.current = setInterval(async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
          logger.error('Polling error during verification check', {}, error)
          return
        }

        if (user && user.email_confirmed_at) {
          setState(prev => ({ ...prev, status: 'success' }))
          setIsPolling(false)
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current)
          }

          success('Email verified successfully!', {
            actions: [
              {
                label: 'Continue to Dashboard',
                onClick: () => onSuccess?.()
              }
            ]
          })

          addNotification({
            title: 'Email Verification Complete',
            message: 'Your email has been successfully verified. You can now access all features.',
            type: 'success',
            priority: 'high',
            source: 'system',
            actionable: false,
            read: false,
            archived: false
          })
        }
      } catch (err) {
        logger.error('Unexpected error during verification polling', {}, err as Error)
      }
    }, 5000) // Poll every 5 seconds
  }, [isPolling, success, addNotification, onSuccess])

  const stopPolling = useCallback(() => {
    setIsPolling(false)
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
    }
  }, [])

  // Countdown timer for resend button
  const startCountdown = useCallback((seconds: number) => {
    setCountdown(seconds)

    countdownInterval.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setState(current => ({ ...current, canResend: true }))
          if (countdownInterval.current) {
            clearInterval(countdownInterval.current)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  // Send verification email
  const sendVerificationEmail = useCallback(async (email: string) => {
    try {
      setState(prev => ({
        ...prev,
        status: 'verifying',
        canResend: false,
        attempts: prev.attempts + 1
      }))

      const toastId = loading('Sending verification email...', { persistent: true })

      const supabase = createClient()

      // Handle resend based on verification type
      let resendError = null
      if (verificationType === 'recovery') {
        // For password recovery, use the resetPasswordForEmail method
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`
        })
        resendError = error
      } else {
        // For signup and email_change, use the resend method
        const { error } = await supabase.auth.resend({
          type: verificationType as 'signup' | 'email_change',
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/verify`
          }
        })
        resendError = error
      }

      if (resendError) {
        if (resendError.message.includes('rate limit') || resendError.message.includes('too many')) {
          setState(prev => ({
            ...prev,
            status: 'rate_limited',
            message: 'Too many attempts. Please wait before requesting another email.',
            nextResendTime: Date.now() + 60000 // 1 minute
          }))
          startCountdown(60)
          error('Rate limited. Please wait before requesting another verification email.')
        } else {
          setState(prev => ({
            ...prev,
            status: 'error',
            message: resendError.message || 'Failed to send verification email'
          }))
          error(`Failed to send verification email: ${resendError.message}`)
        }
        return false
      }

      setState(prev => ({
        ...prev,
        status: 'resent',
        message: 'Verification email sent successfully',
        timestamp: Date.now()
      }))

      startCountdown(30) // 30 second cooldown
      startPolling()

      success('Verification email sent!', {
        subtitle: 'Check your inbox and spam folder',
        actions: [
          {
            label: 'Open Email Client',
            onClick: () => {
              const emailDomain = email.split('@')[1]?.toLowerCase() || ''
              const emailUrls: Record<string, string> = {
                'gmail.com': 'https://gmail.com',
                'yahoo.com': 'https://mail.yahoo.com',
                'outlook.com': 'https://outlook.live.com',
                'hotmail.com': 'https://outlook.live.com',
                'icloud.com': 'https://icloud.com/mail'
              }
              const url = emailUrls[emailDomain] || `mailto:${email}`
              window.open(url, '_blank')
            }
          }
        ]
      })

      logger.track('verification_email_sent', {
        email,
        type: verificationType,
        attempt: state.attempts + 1
      })

      return true
    } catch (err) {
      setState(prev => ({
        ...prev,
        status: 'error',
        message: 'An unexpected error occurred while sending verification email'
      }))
      error('Failed to send verification email')
      logger.error('Unexpected error sending verification email', {}, err as Error)
      return false
    }
  }, [verificationType, state.attempts, loading, error, success, startCountdown, startPolling])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current)
      }
    }
  }, [])

  const getStatusConfig = (status: VerificationStatus) => {
    switch (status) {
      case 'pending':
        return {
          icon: Mail,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-900/10',
          borderColor: 'border-blue-200 dark:border-blue-800',
          title: 'Email Verification Required',
          description: 'We need to verify your email address to continue.'
        }
      case 'verifying':
        return {
          icon: Loader2,
          color: 'text-purple-500 animate-spin',
          bgColor: 'bg-purple-50 dark:bg-purple-900/10',
          borderColor: 'border-purple-200 dark:border-purple-800',
          title: 'Sending Verification Email',
          description: 'Please wait while we send your verification email...'
        }
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/10',
          borderColor: 'border-green-200 dark:border-green-800',
          title: 'Email Verified Successfully!',
          description: 'Your email has been verified. You can now access all features.'
        }
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/10',
          borderColor: 'border-red-200 dark:border-red-800',
          title: 'Verification Failed',
          description: state.message || 'There was an error verifying your email.'
        }
      case 'expired':
        return {
          icon: Clock,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50 dark:bg-orange-900/10',
          borderColor: 'border-orange-200 dark:border-orange-800',
          title: 'Verification Link Expired',
          description: 'Your verification link has expired. Please request a new one.'
        }
      case 'resent':
        return {
          icon: Send,
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/10',
          borderColor: 'border-green-200 dark:border-green-800',
          title: 'Verification Email Sent!',
          description: 'Check your inbox and spam folder for the verification email.'
        }
      case 'rate_limited':
        return {
          icon: AlertTriangle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50 dark:bg-orange-900/10',
          borderColor: 'border-orange-200 dark:border-orange-800',
          title: 'Too Many Attempts',
          description: 'Please wait before requesting another verification email.'
        }
      default:
        return {
          icon: Info,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-900/10',
          borderColor: 'border-gray-200 dark:border-gray-800',
          title: 'Email Verification',
          description: 'Please verify your email address.'
        }
    }
  }

  const statusConfig = getStatusConfig(state.status)
  const Icon = statusConfig.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto"
    >
      <Card className={cn(
        "border-l-4 shadow-lg",
        statusConfig.borderColor,
        statusConfig.bgColor
      )}>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-md">
            <Icon className={cn("w-8 h-8", statusConfig.color)} />
          </div>

          <CardTitle className="text-xl font-semibold">
            {statusConfig.title}
          </CardTitle>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            {statusConfig.description}
          </p>

          {state.userEmail && (
            <Badge variant="outline" className="mt-2">
              {state.userEmail}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress indicator for active states */}
          {(state.status === 'verifying' || isPolling) && (
            <div className="space-y-2">
              <Progress value={state.status === 'verifying' ? 30 : 70} className="h-2" />
              <p className="text-xs text-center text-gray-500">
                {state.status === 'verifying' ? 'Sending email...' : 'Waiting for verification...'}
              </p>
            </div>
          )}

          {/* Success state */}
          {state.status === 'success' && (
            <div className="space-y-3">
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/10">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Your email has been successfully verified!
                </AlertDescription>
              </Alert>

              <Button
                onClick={onSuccess}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Continue to Dashboard
              </Button>
            </div>
          )}

          {/* Pending/Error/Expired states - show resend form */}
          {(['pending', 'error', 'expired', 'resent', 'rate_limited'].includes(state.status)) && (
            <ResendVerificationForm
              email={state.userEmail || ''}
              canResend={state.canResend && countdown === 0}
              countdown={countdown}
              attempts={state.attempts}
              onResend={sendVerificationEmail}
              status={state.status}
            />
          )}

          {/* Additional help */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <Info className="w-4 h-4 mr-2 text-blue-500" />
              Need Help?
            </h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Check your spam/junk folder</li>
              <li>• Make sure your email address is correct</li>
              <li>• Verification links expire after 24 hours</li>
              <li>• Contact support if you continue having issues</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}

            {showSkipOption && state.status !== 'success' && (
              <Button variant="ghost" onClick={onSuccess} className="flex-1">
                Skip for Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface ResendVerificationFormProps {
  email: string
  canResend: boolean
  countdown: number
  attempts: number
  onResend: (email: string) => Promise<boolean>
  status: VerificationStatus
}

function ResendVerificationForm({
  email: initialEmail,
  canResend,
  countdown,
  attempts,
  onResend,
  status
}: ResendVerificationFormProps) {
  const [email, setEmail] = useState(initialEmail)
  const [isLoading, setIsLoading] = useState(false)

  const handleResend = async () => {
    if (!email || !canResend) return

    setIsLoading(true)
    try {
      await onResend(email)
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonText = () => {
    if (isLoading) return 'Sending...'
    if (countdown > 0) return `Resend in ${countdown}s`
    if (attempts === 0) return 'Send Verification Email'
    return 'Resend Verification Email'
  }

  const canSubmit = email && canResend && !isLoading && countdown === 0

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="verification-email" className="text-sm font-medium">
          Email Address
        </Label>
        <Input
          id="verification-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="w-full"
        />
      </div>

      <Button
        onClick={handleResend}
        disabled={!canSubmit}
        className="w-full"
        variant={status === 'error' ? 'destructive' : 'default'}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4 mr-2" />
        )}
        {getButtonText()}
      </Button>

      {attempts > 0 && (
        <p className="text-xs text-center text-gray-500">
          Attempt {attempts}/5
        </p>
      )}
    </div>
  )
}

// Verification status card for use in other components
export function VerificationStatusCard({
  user,
  onRequestVerification
}: {
  user: any
  onRequestVerification?: () => void
}) {
  const isVerified = user?.email_confirmed_at
  const email = user?.email

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "border-l-4",
        isVerified
          ? "border-green-500 bg-green-50 dark:bg-green-900/10"
          : "border-orange-500 bg-orange-50 dark:bg-orange-900/10"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isVerified ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Mail className="w-5 h-5 text-orange-600" />
              )}

              <div>
                <p className="font-medium text-sm">
                  {isVerified ? 'Email Verified' : 'Email Verification Required'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {email}
                </p>
              </div>
            </div>

            {!isVerified && onRequestVerification && (
              <Button size="sm" onClick={onRequestVerification}>
                Verify
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/**
 * @fileMetadata
 * @purpose "Enhanced social login modal with comprehensive provider support"
 * @owner auth-team
 * @dependencies ["react", "framer-motion", "@/components/auth"]
 * @exports ["EnhancedSocialLoginModal"]
 * @complexity high
 * @tags ["auth", "modal", "social-login", "enhanced"]
 * @status stable
 */
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Shield,
  Users,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SocialLoginPanel, type SocialProvider } from '@/components/auth/social-login-enhanced'
import { useModalStore } from '@/stores/modal-store'
import { useToast } from '@/components/notifications/toast-system'
import { logger } from '@/lib/logger'

type ModalStep = 'selection' | 'connecting' | 'success' | 'error'

interface ModalState {
  step: ModalStep
  selectedProvider?: SocialProvider
  error?: string
  user?: any
}

export function EnhancedSocialLoginModal() {
  const { activeModal, closeModal, openModal } = useModalStore()
  const [state, setState] = useState<ModalState>({ step: 'selection' })

  const { success, error, info } = useToast()

  // Reset state when modal opens/closes
  useEffect(() => {
    if (activeModal === 'socialLogin') {
      setState({ step: 'selection' })
      logger.track('social_login_modal_opened')
    }
  }, [activeModal])

  if (activeModal !== 'socialLogin') return null

  const handleSocialSuccess = (provider: SocialProvider, userData: any) => {
    setState({
      step: 'success',
      selectedProvider: provider,
      user: userData
    })

    success(`Signed in with ${getProviderName(provider)}!`, {
      subtitle: 'Welcome to ClaimGuardian',
      actions: [{
        label: 'Continue',
        onClick: () => {
          closeModal()
          // Navigation handled by auth provider
        }
      }]
    })

    logger.track('social_login_modal_success', { provider })

    // Auto-close after success
    setTimeout(() => {
      closeModal()
    }, 2000)
  }

  const handleSocialError = (errorMessage: string) => {
    setState({
      step: 'error',
      error: errorMessage
    })

    error('Social login failed', {
      subtitle: errorMessage,
      actions: [{
        label: 'Try Again',
        onClick: () => setState({ step: 'selection' })
      }]
    })

    logger.track('social_login_modal_error', { error: errorMessage })
  }

  const getProviderName = (provider: SocialProvider): string => {
    switch (provider) {
      case 'google': return 'Google'
      case 'azure': return 'Microsoft'
      case 'linkedin': return 'LinkedIn'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-cyan-600/5 pointer-events-none" />

        <div className="relative">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>

          <AnimatePresence mode="wait">
            {state.step === 'selection' && (
              <SelectionStep
                onSuccess={handleSocialSuccess}
                onError={handleSocialError}
                onEmailSignIn={() => {
                  closeModal()
                  openModal('login')
                }}
              />
            )}

            {state.step === 'success' && (
              <SuccessStep
                provider={state.selectedProvider!}
                user={state.user}
                onContinue={() => closeModal()}
              />
            )}

            {state.step === 'error' && (
              <ErrorStep
                error={state.error!}
                onRetry={() => setState({ step: 'selection' })}
                onCancel={() => closeModal()}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

interface SelectionStepProps {
  onSuccess: (provider: SocialProvider, user: any) => void
  onError: (error: string) => void
  onEmailSignIn: () => void
}

function SelectionStep({ onSuccess, onError, onEmailSignIn }: SelectionStepProps) {
  return (
    <motion.div
      key="selection"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Shield className="w-8 h-8 text-white" />
        </div>

        <CardTitle className="text-2xl text-white">
          Choose Your Sign In Method
        </CardTitle>

        <p className="text-gray-400">
          Select your preferred way to access ClaimGuardian
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Social Login Options */}
        <div className="space-y-4">
          <SocialLoginPanel
            mode="login"
            onSuccess={onSuccess}
            onError={onError}
          />
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-800 px-2 text-slate-400">
              Or continue with
            </span>
          </div>
        </div>

        {/* Email Sign In */}
        <Button
          onClick={onEmailSignIn}
          variant="outline"
          className="w-full py-3 border-slate-600 hover:bg-slate-700/50 text-white"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Email & Password
        </Button>

        {/* Benefits Section */}
        <Card className="bg-slate-700/30 border-slate-600/50">
          <CardContent className="p-4">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Why Use Social Login?
            </h4>
            <ul className="text-sm text-gray-400 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                One-click access without remembering passwords
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                Enhanced security with OAuth 2.0 protection
              </li>
              <li className="flex items-start gap-2">
                <Users className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                Automatic profile synchronization
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Alert>
          <Shield className="w-4 h-4" />
          <AlertDescription className="text-xs">
            <strong>Privacy Protected:</strong> We never access your social media posts or contacts.
            Only basic profile information (name, email) is shared securely.
          </AlertDescription>
        </Alert>
      </CardContent>
    </motion.div>
  )
}

interface SuccessStepProps {
  provider: SocialProvider
  user: any
  onContinue: () => void
}

function SuccessStep({ provider, user, onContinue }: SuccessStepProps) {
  const getProviderName = (p: SocialProvider): string => {
    switch (p) {
      case 'google': return 'Google'
      case 'azure': return 'Microsoft'
      case 'linkedin': return 'LinkedIn'
    }
  }

  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>

        <CardTitle className="text-2xl text-white">
          Welcome to ClaimGuardian!
        </CardTitle>

        <p className="text-gray-400">
          Successfully signed in with {getProviderName(provider)}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert className="border-green-500/20 bg-green-500/10">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <AlertDescription className="text-green-300">
            Your account is secure and ready to use. You'll be redirected to your dashboard shortly.
          </AlertDescription>
        </Alert>

        {user?.email && (
          <div className="bg-slate-700/30 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Account Details</h4>
            <p className="text-gray-400 text-sm">Email: {user.email}</p>
            {user.user_metadata?.full_name && (
              <p className="text-gray-400 text-sm">Name: {user.user_metadata.full_name}</p>
            )}
          </div>
        )}

        <Button onClick={onContinue} className="w-full bg-green-600 hover:bg-green-700">
          <ArrowRight className="w-4 h-4 mr-2" />
          Continue to Dashboard
        </Button>
      </CardContent>
    </motion.div>
  )
}

interface ErrorStepProps {
  error: string
  onRetry: () => void
  onCancel: () => void
}

function ErrorStep({ error, onRetry, onCancel }: ErrorStepProps) {
  return (
    <motion.div
      key="error"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <AlertTriangle className="w-8 h-8 text-white" />
        </div>

        <CardTitle className="text-2xl text-white">
          Sign In Failed
        </CardTitle>

        <p className="text-gray-400">
          We couldn't complete your social login
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="bg-slate-700/30 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Common Solutions</h4>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• Make sure you allow ClaimGuardian to access your account</li>
            <li>• Check that your social account email is verified</li>
            <li>• Try clearing your browser cache and cookies</li>
            <li>• Disable popup blockers for this site</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1 border-slate-600">
            Cancel
          </Button>
          <Button onClick={onRetry} className="flex-1">
            Try Again
          </Button>
        </div>

        <div className="text-center">
          <button
            onClick={() => window.open('mailto:support@claimguardianai.com?subject=Social Login Help', '_blank')}
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mx-auto"
          >
            <ExternalLink className="w-3 h-3" />
            Contact Support
          </button>
        </div>
      </CardContent>
    </motion.div>
  )
}

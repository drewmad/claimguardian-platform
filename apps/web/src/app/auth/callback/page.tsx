/**
 * @fileMetadata
 * @purpose "OAuth callback handler for social login providers"
 * @owner auth-team
 * @dependencies ["react", "next", "@/lib/supabase"]
 * @exports ["default"]
 * @complexity medium
 * @tags ["auth", "oauth", "callback", "social-login"]
 * @status stable
 */
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Home,
  ExternalLink,
  Shield
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/notifications/toast-system'
import { useNotifications } from '@/components/notifications/notification-center'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'

type CallbackState = 'loading' | 'success' | 'error' | 'account-merge'

interface CallbackResult {
  state: CallbackState
  user?: any
  error?: string
  provider?: string
  needsAccountMerge?: boolean
  existingEmail?: string
}

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [result, setResult] = useState<CallbackResult>({ state: 'loading' })
  
  const { success, error, info } = useToast()
  const { addNotification } = useNotifications()

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    try {
      const supabase = createClient()
      
      // Get the current session after OAuth callback
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }

      if (session?.user) {
        const user = session.user
        const provider = getProviderFromUser(user)
        
        // Check if this is a new social account connection
        const isNewConnection = checkIfNewConnection(user)
        
        // Log successful social login
        logger.track('social_login_completed', { 
          provider,
          userId: user.id,
          email: user.email,
          isNewConnection
        })

        // Add success notification
        addNotification({
          title: 'Social Login Successful',
          message: `Successfully signed in with ${provider}. Welcome to ClaimGuardian!`,
          type: 'success',
          priority: 'high',
          source: 'system',
          read: false,
          archived: false,
          actionable: false
        })

        setResult({ 
          state: 'success', 
          user, 
          provider 
        })

        // Show success toast
        success(`Signed in with ${provider}!`, {
          subtitle: 'Redirecting to your dashboard...',
          actions: [{
            label: 'Go to Dashboard',
            onClick: () => router.push('/dashboard')
          }]
        })

        // Redirect after brief delay
        setTimeout(() => {
          const redirectTo = searchParams.get('redirect') || '/dashboard'
          router.push(redirectTo)
        }, 2000)

      } else {
        // No session found - likely an error occurred
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        throw new Error(errorDescription || errorParam || 'Authentication failed')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Social login failed'
      
      // Log error
      logger.error('Social login callback failed', {
        error: errorMessage,
        searchParams: Object.fromEntries(searchParams.entries())
      }, err instanceof Error ? err : new Error(errorMessage))

      // Set error state
      setResult({ 
        state: 'error', 
        error: errorMessage 
      })

      // Show error toast
      error('Social login failed', {
        subtitle: errorMessage,
        actions: [{
          label: 'Try Again',
          onClick: () => router.push('/auth/signin')
        }]
      })
    }
  }

  const getProviderFromUser = (user: any): string => {
    // Extract provider from user metadata or identities
    const identities = user.identities || []
    const lastIdentity = identities[identities.length - 1]
    
    if (lastIdentity?.provider) {
      switch (lastIdentity.provider) {
        case 'google': return 'Google'
        case 'microsoft': return 'Microsoft'
        case 'linkedin': return 'LinkedIn'
        default: return lastIdentity.provider
      }
    }
    
    return 'Social Provider'
  }

  const checkIfNewConnection = (user: any): boolean => {
    // Check if this is a new social connection to existing account
    const identities = user.identities || []
    return identities.length > 1
  }

  const retryCallback = () => {
    setResult({ state: 'loading' })
    handleCallback()
  }

  if (result.state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Completing Sign In</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please wait while we finish setting up your account...
            </p>
            <div className="text-sm text-gray-500">
              This may take a few moments
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (result.state === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-l-4 border-green-500 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              
              <CardTitle className="text-xl text-green-800 dark:text-green-200">
                Sign In Successful!
              </CardTitle>
              
              <p className="text-green-600 dark:text-green-300">
                Successfully signed in with {result.provider}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <Shield className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Your account is secure and ready to use. Redirecting to dashboard...
                </AlertDescription>
              </Alert>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Redirecting in 2 seconds...
                </p>
                
                <Button 
                  onClick={() => router.push('/dashboard')} 
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Continue to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (result.state === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-l-4 border-red-500 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              
              <CardTitle className="text-xl text-red-800 dark:text-red-200">
                Sign In Failed
              </CardTitle>
              
              <p className="text-red-600 dark:text-red-300">
                There was an issue completing your social login
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  {result.error || 'An unexpected error occurred during sign in'}
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-medium mb-3">What can you do?</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>• Try signing in again with a different method</li>
                  <li>• Check your internet connection</li>
                  <li>• Clear your browser cache and cookies</li>
                  <li>• Contact support if the issue persists</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={retryCallback} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={() => router.push('/auth/signin')} 
                  className="flex-1"
                >
                  Back to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return null
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Loading...</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Processing authentication callback...
            </p>
          </CardContent>
        </Card>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
/**
 * @fileMetadata
 * @purpose "Social account connection and management page"
 * @owner auth-team
 * @dependencies ["react", "next", "@/components/auth"]
 * @exports ["default"]
 * @complexity medium
 * @tags ["auth", "social-login", "account-management", "page"]
 * @status stable
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Link2,
  ArrowLeft,
  Shield,
  Users,
  Settings,
  Home,
  ExternalLink,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SocialLoginPanel, type SocialAccount } from '@/components/auth/social-login-enhanced'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@/components/notifications/toast-system'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'

export default function SocialConnectPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [connectedCount, setConnectedCount] = useState(0)
  
  const { success, info } = useToast()

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push('/auth/signin?redirect=/auth/social-connect')
      return
    }

    if (user) {
      loadAccountStats()
    }
  }, [user, authLoading, router])

  const loadAccountStats = async () => {
    try {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (currentUser?.identities) {
        const socialProviders = currentUser.identities.filter(
          identity => ['google', 'microsoft', 'linkedin'].includes(identity.provider)
        )
        setConnectedCount(socialProviders.length)
      }
    } catch (err) {
      logger.error('Failed to load account stats', {}, err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSuccess = (provider: string, userData: any) => {
    success('Account connected successfully!', {
      subtitle: `Your ${provider} account is now linked to ClaimGuardian`,
      actions: [{
        label: 'View Dashboard',
        onClick: () => router.push('/dashboard')
      }]
    })
    
    // Reload stats
    loadAccountStats()
    
    logger.track('social_account_connected', { provider })
  }

  const handleSocialError = (error: string) => {
    logger.error('Social connection failed', { error })
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Link2 className="w-8 h-8 text-blue-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Loading Account Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we prepare your account connection page...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
              <Link2 className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold text-white mb-2">
                Connect Your Accounts
              </h1>
              <p className="text-xl text-gray-300">
                Link your social accounts for faster access
              </p>
            </div>
          </div>
        </motion.div>

        {/* Account Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-white font-medium mb-1">Connected Accounts</h3>
                  <p className="text-2xl font-bold text-blue-400">{connectedCount}</p>
                  <p className="text-sm text-gray-400">of 3 providers</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-white font-medium mb-1">Security Level</h3>
                  <p className="text-2xl font-bold text-green-400">
                    {connectedCount === 0 ? 'Basic' : connectedCount === 1 ? 'Good' : 'High'}
                  </p>
                  <p className="text-sm text-gray-400">OAuth 2.0 protected</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-white font-medium mb-1">Account Status</h3>
                  <p className="text-2xl font-bold text-purple-400">Verified</p>
                  <p className="text-sm text-gray-400">Primary account</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm mb-8">
              <CardHeader>
                <CardTitle className="text-white text-2xl text-center">
                  Social Account Connections
                </CardTitle>
                <p className="text-gray-300 text-center">
                  Connect your social accounts to enable quick sign-in and enhanced security
                </p>
              </CardHeader>
              <CardContent>
                <SocialLoginPanel
                  mode="connect"
                  showConnectedAccounts={true}
                  onSuccess={handleSocialSuccess}
                  onError={handleSocialError}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Benefits Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-8"
          >
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  Why Connect Social Accounts?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Faster Sign-In</h4>
                        <p className="text-gray-400 text-sm">
                          Skip typing passwords with one-click authentication
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Enhanced Security</h4>
                        <p className="text-gray-400 text-sm">
                          OAuth 2.0 protection without sharing passwords
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Profile Sync</h4>
                        <p className="text-gray-400 text-sm">
                          Automatically sync name and profile information
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Settings className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Easy Management</h4>
                        <p className="text-gray-400 text-sm">
                          Connect or disconnect accounts anytime
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mb-8"
          >
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                <strong>Privacy & Security:</strong> ClaimGuardian never stores your social media passwords. 
                All connections use secure OAuth 2.0 tokens that can be revoked at any time.
              </AlertDescription>
            </Alert>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                  <Link 
                    href="/dashboard"
                    className="flex items-center text-white hover:text-gray-300 transition-colors"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Link>
                  
                  <div className="hidden sm:block w-px h-4 bg-white/20" />
                  
                  <Link 
                    href="/dashboard/settings"
                    className="flex items-center text-white hover:text-gray-300 transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Link>
                  
                  <div className="hidden sm:block w-px h-4 bg-white/20" />
                  
                  <button 
                    onClick={() => window.open('https://docs.claimguardianai.com/auth/social-login', '_blank')}
                    className="flex items-center text-white hover:text-gray-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Help Guide
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
/**
 * @fileMetadata
 * @purpose "Enhanced social login system with comprehensive provider support and modern UX"
 * @owner auth-team
 * @dependencies ["react", "framer-motion", "@/components/notifications"]
 * @exports ["SocialLoginPanel", "SocialLoginButton", "SocialConnectionManager"]
 * @complexity high
 * @tags ["auth", "social-login", "oauth", "enhanced"]
 * @status stable
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Chrome,
  Linkedin,
  Building2,
  Link2,
  Unlink,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Shield,
  Zap,
  User,
  Mail,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/notifications/toast-system'
import { useNotifications } from '@/components/notifications/notification-center'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'

export type SocialProvider = 'google' | 'microsoft' | 'linkedin'

export interface SocialAccount {
  provider: SocialProvider
  email: string
  name: string
  picture?: string
  isConnected: boolean
  linkedAt?: Date
  lastUsed?: Date
}

export interface SocialLoginState {
  isLoading: boolean
  loadingProvider?: SocialProvider
  error: string | null
  connectedAccounts: SocialAccount[]
  showAccountMerge: boolean
  pendingConnection?: SocialAccount
}

interface SocialLoginPanelProps {
  mode?: 'login' | 'signup' | 'connect'
  onSuccess?: (provider: SocialProvider, user: any) => void
  onError?: (error: string) => void
  showConnectedAccounts?: boolean
  className?: string
}

export function SocialLoginPanel({
  mode = 'login',
  onSuccess,
  onError,
  showConnectedAccounts = false,
  className
}: SocialLoginPanelProps) {
  const [state, setState] = useState<SocialLoginState>({
    isLoading: false,
    error: null,
    connectedAccounts: [],
    showAccountMerge: false
  })

  const { success, error, info, loading } = useToast()
  const { addNotification } = useNotifications()

  // Load connected accounts on mount
  useEffect(() => {
    if (showConnectedAccounts) {
      loadConnectedAccounts()
    }
  }, [showConnectedAccounts])

  const loadConnectedAccounts = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Get connected social accounts from user metadata
      const connectedProviders = user.app_metadata?.providers || []
      const identities = user.identities || []
      
      const accounts: SocialAccount[] = identities
        .filter(identity => ['google', 'microsoft', 'linkedin'].includes(identity.provider))
        .map(identity => ({
          provider: identity.provider as SocialProvider,
          email: identity.identity_data?.email || '',
          name: identity.identity_data?.full_name || identity.identity_data?.name || '',
          picture: identity.identity_data?.picture || identity.identity_data?.avatar_url,
          isConnected: true,
          linkedAt: identity.created_at ? new Date(identity.created_at) : new Date(),
          lastUsed: new Date(identity.last_sign_in_at || identity.created_at || new Date().toISOString())
        }))

      setState(prev => ({ ...prev, connectedAccounts: accounts }))
    } catch (err) {
      logger.error('Failed to load connected accounts', {}, err as Error)
    }
  }

  const handleSocialLogin = async (provider: SocialProvider) => {
    setState(prev => ({ ...prev, isLoading: true, loadingProvider: provider, error: null }))

    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/auth/callback`
      
      // Configure provider-specific options
      const options = {
        redirectTo,
        scopes: getProviderScopes(provider),
        queryParams: getProviderParams(provider)
      }

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options
      })

      if (authError) {
        throw authError
      }

      // Track social login attempt
      logger.track('social_login_initiated', { 
        provider, 
        mode,
        hasRedirect: !!data?.url 
      })

      // Success notification
      info(`Redirecting to ${getProviderName(provider)}...`, {
        subtitle: 'You will be redirected back after authentication',
        actions: [{
          label: 'Cancel',
          onClick: () => {
            setState(prev => ({ ...prev, isLoading: false, loadingProvider: undefined }))
          }
        }]
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Social login failed'
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        loadingProvider: undefined,
        error: errorMessage 
      }))
      
      error('Social login failed', {
        subtitle: errorMessage,
        actions: [{
          label: 'Try Again',
          onClick: () => handleSocialLogin(provider)
        }]
      })

      logger.error('Social login failed', { provider, mode }, err as Error)
      onError?.(errorMessage)
    }
  }

  const handleSocialDisconnect = async (provider: SocialProvider) => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const supabase = createClient()
      
      // Note: Supabase doesn't have direct unlink functionality
      // This would typically be handled by a server-side endpoint
      // For now, we'll show a warning about manual disconnect
      
      info('Account disconnection', {
        subtitle: 'Social account disconnection requires contacting support for security reasons',
        actions: [{
          label: 'Contact Support',
          onClick: () => window.open('mailto:support@claimguardianai.com?subject=Social Account Disconnect Request', '_blank')
        }]
      })

      logger.track('social_disconnect_requested', { provider })
      
    } catch (err) {
      error('Failed to disconnect account')
      logger.error('Social disconnect failed', { provider }, err as Error)
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const getProviderName = (provider: SocialProvider): string => {
    switch (provider) {
      case 'google': return 'Google'
      case 'microsoft': return 'Microsoft'
      case 'linkedin': return 'LinkedIn'
    }
  }

  const getProviderIcon = (provider: SocialProvider) => {
    switch (provider) {
      case 'google': return Chrome
      case 'microsoft': return Building2
      case 'linkedin': return Linkedin
    }
  }

  const getProviderColor = (provider: SocialProvider): string => {
    switch (provider) {
      case 'google': return 'bg-red-500 hover:bg-red-600'
      case 'microsoft': return 'bg-blue-600 hover:bg-blue-700'
      case 'linkedin': return 'bg-blue-700 hover:bg-blue-800'
    }
  }

  const getProviderScopes = (provider: SocialProvider): string => {
    switch (provider) {
      case 'google': return 'openid email profile'
      case 'microsoft': return 'openid email profile'
      case 'linkedin': return 'openid email profile'
    }
  }

  const getProviderParams = (provider: SocialProvider) => {
    switch (provider) {
      case 'google': 
        return { access_type: 'offline', prompt: 'consent' }
      case 'microsoft':
        return { prompt: 'select_account' }
      case 'linkedin':
        return { prompt: 'consent' }
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Social Login Buttons */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-center mb-4">
          {mode === 'signup' && 'Sign up with'}
          {mode === 'login' && 'Sign in with'}
          {mode === 'connect' && 'Connect your account'}
        </h3>

        {(['google', 'microsoft', 'linkedin'] as SocialProvider[]).map((provider) => (
          <SocialLoginButton
            key={provider}
            provider={provider}
            isLoading={state.isLoading && state.loadingProvider === provider}
            disabled={state.isLoading}
            onClick={() => handleSocialLogin(provider)}
            mode={mode}
            className="w-full"
          />
        ))}
      </div>

      {/* Error Display */}
      {state.error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Connected Accounts Section */}
      {showConnectedAccounts && state.connectedAccounts.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Connected Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.connectedAccounts.map((account) => (
              <ConnectedAccountItem
                key={account.provider}
                account={account}
                onDisconnect={() => handleSocialDisconnect(account.provider)}
                isLoading={state.isLoading}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Security Information */}
      <Alert>
        <Shield className="w-4 h-4" />
        <AlertDescription>
          Social login uses industry-standard OAuth 2.0 security. Your login credentials are never shared with ClaimGuardian.
        </AlertDescription>
      </Alert>
    </div>
  )
}

interface SocialLoginButtonProps {
  provider: SocialProvider
  isLoading?: boolean
  disabled?: boolean
  onClick: () => void
  mode: 'login' | 'signup' | 'connect'
  className?: string
}

export function SocialLoginButton({
  provider,
  isLoading = false,
  disabled = false,
  onClick,
  mode,
  className
}: SocialLoginButtonProps) {
  const Icon = getProviderIcon(provider)
  const providerName = getProviderName(provider)
  const colorClass = getProviderColor(provider)

  const getButtonText = () => {
    switch (mode) {
      case 'signup': return `Sign up with ${providerName}`
      case 'login': return `Sign in with ${providerName}`
      case 'connect': return `Connect ${providerName}`
    }
  }

  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        colorClass,
        "text-white font-medium py-3 h-auto",
        "hover:scale-[1.02] hover:shadow-lg",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        className
      )}
    >
      <div className="flex items-center justify-center gap-3">
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
        <span>{isLoading ? 'Connecting...' : getButtonText()}</span>
      </div>
    </Button>
  )
}

interface ConnectedAccountItemProps {
  account: SocialAccount
  onDisconnect: () => void
  isLoading: boolean
}

function ConnectedAccountItem({
  account,
  onDisconnect,
  isLoading
}: ConnectedAccountItemProps) {
  const Icon = getProviderIcon(account.provider)
  const providerName = getProviderName(account.provider)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="font-medium text-sm">{providerName}</p>
          <p className="text-xs text-gray-400">{account.email}</p>
          {account.lastUsed && (
            <p className="text-xs text-gray-500">
              Last used {account.lastUsed.toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Connected
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDisconnect}
          disabled={isLoading}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Unlink className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// Helper functions (moved outside component for better performance)
function getProviderName(provider: SocialProvider): string {
  switch (provider) {
    case 'google': return 'Google'
    case 'microsoft': return 'Microsoft'
    case 'linkedin': return 'LinkedIn'
  }
}

function getProviderIcon(provider: SocialProvider) {
  switch (provider) {
    case 'google': return Chrome
    case 'microsoft': return Building2
    case 'linkedin': return Linkedin
  }
}

function getProviderColor(provider: SocialProvider): string {
  switch (provider) {
    case 'google': return 'bg-red-500 hover:bg-red-600'
    case 'microsoft': return 'bg-blue-600 hover:bg-blue-700'
    case 'linkedin': return 'bg-blue-700 hover:bg-blue-800'
  }
}

// Account Merge Component for handling conflicting accounts
interface AccountMergeModalProps {
  isOpen: boolean
  existingAccount: SocialAccount
  newAccount: SocialAccount
  onMerge: (keepExisting: boolean) => void
  onCancel: () => void
}

export function AccountMergeModal({
  isOpen,
  existingAccount,
  newAccount,
  onMerge,
  onCancel
}: AccountMergeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl"
      >
        <Card className="border-0">
          <CardHeader>
            <CardTitle className="text-xl text-center">
              Account Already Connected
            </CardTitle>
            <p className="text-sm text-gray-400 text-center">
              You already have an account with this email address. How would you like to proceed?
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <h4 className="font-medium text-blue-300">Existing Account</h4>
                <p className="text-sm text-gray-400">{existingAccount.email}</p>
                <p className="text-xs text-gray-500">
                  Connected via {getProviderName(existingAccount.provider)}
                </p>
              </div>
              
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <h4 className="font-medium text-green-300">New Connection</h4>
                <p className="text-sm text-gray-400">{newAccount.email}</p>
                <p className="text-xs text-gray-500">
                  Connecting via {getProviderName(newAccount.provider)}
                </p>
              </div>
            </div>

            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                Linking accounts will combine your data and preferences. This cannot be undone.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => onMerge(true)} 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Link2 className="w-4 h-4 mr-2" />
                Link Accounts
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
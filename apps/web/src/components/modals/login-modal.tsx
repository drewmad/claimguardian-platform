/**
 * @fileMetadata
 * @purpose Login modal component
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/stores/modal-store", "@/lib/supabase"]
 * @exports ["LoginModal"]
 * @complexity medium
 * @tags ["modal", "auth", "login"]
 * @status active
 */
'use client'

import { X, AlertCircle, Mail, Shield, Lock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { toError } from '@claimguardian/utils'

import { useAuth } from '@/components/auth/auth-provider'
import { useRateLimit } from '@/hooks/use-rate-limit'
import { authService } from '@/lib/auth/auth-service'
import { useModalStore } from '@/stores/modal-store'

export function LoginModal() {
  const { activeModal, closeModal, openModal } = useModalStore()
  const { signIn, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [honeypot, setHoneypot] = useState('') // Bot trap field
  const { isLimited, secondsRemaining, checkLimit } = useRateLimit({
    cooldownMs: 60000, // 60 seconds
    key: 'login-resend'
  })

  // Clear error when modal opens/closes
  useEffect(() => {
    if (activeModal === 'login') {
      clearError()
      logger.track('login_modal_opened')
    }
  }, [activeModal, clearError])

  if (activeModal !== 'login') return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check honeypot field - if filled, it's likely a bot
    if (honeypot) {
      logger.warn('Honeypot triggered on login', {
        email,
        honeypotValue: honeypot
      })
      // Silently fail to not alert the bot
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
      }, 2000)
      return
    }
    
    setLoading(true)
    try {
      await signIn(email, password)
      
      // The auth provider will handle the redirect on success
      // We'll only reach here if there's an error
      // Modal will close automatically on successful redirect
    } catch (err) {
      // Error is handled by auth provider and will be shown in UI
      logger.error('Login error:', undefined, toError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!checkLimit()) {
      return
    }
    
    try {
      setResending(true)
      setResendSuccess(false)
      
      const { error } = await authService.resendConfirmationEmail(email)
      
      if (error) {
        logger.error('Failed to resend verification email', {}, error instanceof Error ? error : new Error(String(error)))
        return
      }
      
      setResendSuccess(true)
      logger.track('verification_email_resent', { email })
      
      // Reset success state after 5 seconds
      setTimeout(() => {
        setResendSuccess(false)
      }, 5000)
    } catch (err) {
      logger.error('Unexpected error resending verification email', {}, err instanceof Error ? err : new Error(String(err)))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
      
      <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-cyan-600/5 pointer-events-none" />
        <div className="relative p-6">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Welcome Back</h2>
            <p className="text-sm text-gray-400 mt-2">Sign in to access your ClaimGuardian account</p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="group">
            <label className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-blue-400 transition-colors flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-slate-700/70"
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="group">
            <label className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-blue-400 transition-colors flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-slate-700/70"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Honeypot field - hidden from users, visible to bots */}
          <input
            type="text"
            name="website_url"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            style={{
              position: 'absolute',
              left: '-9999px',
              width: '1px',
              height: '1px',
              overflow: 'hidden'
            }}
            aria-hidden="true"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 bg-slate-700 border border-slate-600 rounded text-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-slate-400">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => {
                closeModal()
                openModal('forgotPassword')
              }}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Forgot password?
            </button>
          </div>

          {error && (
            <div className={`border rounded-lg p-3 ${
              error.code === 'AUTH_EMAIL_NOT_VERIFIED' 
                ? 'bg-yellow-500/10 border-yellow-500/20' 
                : 'bg-red-500/10 border-red-500/20'
            }`}>
              {error.code === 'AUTH_EMAIL_NOT_VERIFIED' ? (
                <div>
                  <div className="flex items-start gap-2 mb-3">
                    <Mail className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-yellow-400 text-sm font-medium">{error.message}</p>
                      <p className="text-yellow-400/80 text-xs mt-1">
                        We sent a verification link to {email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending || resendSuccess || !email || isLimited}
                    className="w-full text-sm text-yellow-400 hover:text-yellow-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                  >
                    {resending ? (
                      'Sending...'
                    ) : resendSuccess ? (
                      <span className="text-green-400">✓ Verification email sent!</span>
                    ) : isLimited ? (
                      `Wait ${secondsRemaining}s to resend`
                    ) : (
                      'Resend verification email'
                    )}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error.message}</p>
                  </div>
                  {error.message.includes('refresh_token_not_found') || 
                   error.message.includes('Invalid Refresh Token') ? (
                    <div className="mt-2">
                      <p className="text-xs text-red-300 mb-2">
                        This may be due to expired session cookies. Try clearing your cookies:
                      </p>
                      <a 
                        href="/api/auth/clear-cookies" 
                        onClick={(e) => {
                          e.preventDefault()
                          window.location.href = '/api/auth/clear-cookies'
                          setTimeout(() => window.location.reload(), 100)
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        Clear authentication cookies
                      </a>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full relative py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing In...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gradient-to-b from-slate-800 to-slate-900 px-2 text-slate-400">New to ClaimGuardian?</span>
            </div>
          </div>
          <button
            onClick={() => {
              closeModal()
              openModal('signup')
            }}
            className="w-full py-3 px-4 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg"
          >
            Create an Account
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}

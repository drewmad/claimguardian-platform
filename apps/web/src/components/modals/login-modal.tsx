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

import { useState, useEffect } from 'react'
import { X, AlertCircle, Mail } from 'lucide-react'
import { useModalStore } from '@/stores/modal-store'
import { useAuth } from '@/components/auth/auth-provider'
import { logger } from '@/lib/logger'
import { authService } from '@/lib/auth/auth-service'
import { useRateLimit } from '@/hooks/use-rate-limit'

export function LoginModal() {
  const { activeModal, closeModal, openModal } = useModalStore()
  const { signIn, loading, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
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
    
    await signIn(email, password, rememberMe)
    
    // If no error, the auth provider will handle the redirect
    if (!error) {
      closeModal()
      setEmail('')
      setPassword('')
      setRememberMe(false)
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
        logger.error('Failed to resend verification email', error)
        return
      }
      
      setResendSuccess(true)
      logger.track('verification_email_resent', { email })
      
      // Reset success state after 5 seconds
      setTimeout(() => {
        setResendSuccess(false)
      }, 5000)
    } catch (err) {
      logger.error('Unexpected error resending verification email', err)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
      
      <div className="relative bg-slate-800 rounded-lg w-full max-w-md p-6 shadow-xl">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Welcome Back</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

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
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error.message}</p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 font-semibold disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Don&apos;t have an account?{' '}
            <button
              onClick={() => {
                closeModal()
                openModal('signup')
              }}
              className="text-blue-400 hover:text-blue-300"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
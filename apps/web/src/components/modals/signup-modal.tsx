/**
 * @fileMetadata
 * @purpose Signup modal component
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/stores/modal-store", "@/lib/supabase"]
 * @exports ["SignupModal"]
 * @complexity high
 * @tags ["modal", "auth", "signup"]
 * @status active
 */
'use client'

import { X, Eye, EyeOff, AlertCircle, Shield, Check } from 'lucide-react'
import { useState, useEffect } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { LegalConsentForm } from '@/components/legal/legal-consent-form'
import { authService } from '@/lib/auth/auth-service'
import { logger } from '@/lib/logger'
import { collectSignupTrackingData } from '@/lib/utils/tracking-utils'
import { useModalStore } from '@/stores/modal-store'

export function SignupModal() {
  const { activeModal, closeModal, openModal } = useModalStore()
  const { signUp, error, clearError } = useAuth()
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  // Temporarily disable rate limiting for testing
  const { isLimited, secondsRemaining, checkLimit } = {
    isLimited: false,
    secondsRemaining: 0,
    checkLimit: () => false
  }
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    agree: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [validationError, setValidationError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Clear errors when modal opens/closes
  useEffect(() => {
    if (activeModal === 'signup') {
      clearError()
      setValidationError('')
      logger.track('signup_modal_opened')
    }
  }, [activeModal, clearError])

  if (activeModal !== 'signup') return null

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName) {
      setValidationError('Please enter your full name')
      return false
    }
    if (!formData.email || !formData.email.includes('@')) {
      setValidationError('Please enter a valid email address')
      return false
    }
    if (!formData.password || formData.password.length < 8) {
      setValidationError('Password must be at least 8 characters')
      return false
    }
    // Note: Password mismatch validation removed as requested - let server handle it
    if (!formData.phone || formData.phone.replace(/\D/g, '').length < 10) {
      setValidationError('Please enter a valid phone number')
      return false
    }
    if (!formData.agree) {
      setValidationError('You must agree to the terms')
      return false
    }
    return true
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setValidationError('')
    
    if (!validateForm()) return
    
    setLoading(true)
    try {
      // Collect tracking data safely (with fallbacks)
      let trackingData = {}
      try {
        trackingData = await collectSignupTrackingData()
      } catch (error) {
        console.warn('Tracking data collection failed, using defaults:', error)
        trackingData = {
          ipAddress: '127.0.0.1',
          userAgent: navigator.userAgent,
          deviceType: 'unknown'
        }
      }
      
      const signupData = {
        ...formData,
        // Safely merge tracking data
        ...trackingData,
        // Generate session ID for tracking
        sessionId: `signup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        // Legal compliance defaults
        gdprConsent: formData.agree,
        dataProcessingConsent: formData.agree,
        marketingConsent: false // User can opt-in later
      }
      
      const success = await signUp(signupData)
      
      if (success) {
        setIsSubmitted(true)
        // Success modal now stays open until user takes action
        // Reset form immediately since we're showing success
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: '',
          agree: false
        })
      }
    } catch (error) {
      console.error('Signup error:', error)
      setValidationError('An error occurred during signup. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value))
    }
  }

  const calculatePasswordStrength = (password: string) => {
    let score = 0
    if (password.length > 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').substring(0, 10)
    if (digits.length >= 6) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`
    } else if (digits.length >= 3) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3)}`
    } else {
      return digits
    }
  }

  const handleResendEmail = async () => {
    if (!checkLimit()) {
      return
    }
    
    try {
      setResending(true)
      setResendSuccess(false)
      
      const { error } = await authService.resendConfirmationEmail(formData.email)
      
      if (error) {
        logger.error('Failed to resend confirmation email', {}, error)
        // Could show error toast here
        return
      }
      
      setResendSuccess(true)
      logger.track('confirmation_email_resent', { email: formData.email })
      
      // Reset success state after 5 seconds
      setTimeout(() => {
        setResendSuccess(false)
      }, 5000)
    } catch (err) {
      logger.error('Unexpected error resending email', {}, err instanceof Error ? err : new Error(String(err)))
    } finally {
      setResending(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative bg-slate-800 rounded-lg w-full max-w-md p-8 shadow-xl">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Check Your Email!</h2>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <p className="text-blue-300 font-medium mb-2">
                ✉️ We&apos;ve sent a confirmation email to:
              </p>
              <p className="text-white font-semibold">
                {formData.email}
              </p>
            </div>
            
            <div className="text-left space-y-3 mb-6">
              <p className="text-slate-300">
                <span className="font-semibold">Important:</span> You must confirm your email before you can sign in.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-400">
                <li>Check your inbox for an email from ClaimGuardian</li>
                <li>Click the confirmation link in the email</li>
                <li>Once confirmed, return here to sign in</li>
              </ol>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-3 mb-6">
              <p className="text-xs text-slate-400">
                Can&apos;t find the email? Check your spam folder or click below to resend.
              </p>
              <button
                onClick={handleResendEmail}
                disabled={resending || resendSuccess || isLimited}
                className="mt-3 w-full text-sm text-blue-400 hover:text-blue-300 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                {resending ? (
                  'Sending...'
                ) : resendSuccess ? (
                  <span className="text-green-400">✓ Email sent!</span>
                ) : isLimited ? (
                  `Wait ${secondsRemaining}s to resend`
                ) : (
                  'Resend confirmation email'
                )}
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsSubmitted(false)
                  closeModal()
                  openModal('login')
                }}
                className="w-full btn-primary py-3"
              >
                Go to Sign In
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={handleResendEmail}
                  disabled={resending || isLimited}
                  className="flex-1 btn-secondary py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? 'Sending...' : 'Resend Email'}
                  {isLimited && ` (${secondsRemaining}s)`}
                </button>
                <button
                  onClick={() => {
                    closeModal()
                    setIsSubmitted(false)
                  }}
                  className="flex-1 btn-outline py-2"
                >
                  Close
                </button>
              </div>
              
              {resendSuccess && (
                <p className="text-green-400 text-sm text-center">
                  Verification email sent successfully!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
      
      <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-cyan-600/5 pointer-events-none" />
        <div className="relative p-6 overflow-y-auto max-h-[90vh]">
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
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Create Your Account</h2>
            <p className="text-sm text-gray-400 mt-2">Join ClaimGuardian to protect your property</p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="group">
              <label className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-blue-400 transition-colors">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-slate-700/70"
                placeholder="John"
                required
              />
            </div>
            <div className="group">
              <label className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-blue-400 transition-colors">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-slate-700/70"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-blue-400 transition-colors">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-slate-700/70"
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="group">
            <label className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-blue-400 transition-colors">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 transition-all duration-200 hover:bg-slate-700/70"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.password && (
              <div className="mt-3 space-y-2">
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      passwordStrength >= 4 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                      passwordStrength >= 2 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 
                      'bg-gradient-to-r from-red-500 to-pink-500'
                    }`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Strength: <span className={`font-medium ${
                      passwordStrength >= 4 ? 'text-green-400' : 
                      passwordStrength >= 2 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{passwordStrength >= 4 ? 'Strong' : passwordStrength >= 2 ? 'Medium' : 'Weak'}</span>
                  </p>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Check 
                        key={i} 
                        className={`w-3 h-3 transition-colors ${
                          i < passwordStrength ? 'text-blue-400' : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="group">
            <label className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-blue-400 transition-colors">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 transition-all duration-200 hover:bg-slate-700/70"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="group">
            <label className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-blue-400 transition-colors">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formatPhoneNumber(formData.phone)}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '')
                handleChange({ ...e, target: { ...e.target, name: 'phone', value: digits } })
              }}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-slate-700/70"
              placeholder="(555) 123-4567"
              required
            />
          </div>

          <LegalConsentForm
            onConsentChange={(hasAllConsents) => {
              setFormData(prev => ({ ...prev, agree: hasAllConsents }))
            }}
            showSubmitButton={false}
            mode="signup"
          />

          {(error || validationError) && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error?.message || validationError}</p>
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
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gradient-to-b from-slate-800 to-slate-900 px-2 text-slate-400">Already have an account?</span>
            </div>
          </div>
          <button
            onClick={() => {
              closeModal()
              openModal('login')
            }}
            className="w-full py-3 px-4 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg"
          >
            Sign In Instead
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
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

import { useState, useEffect } from 'react'
import { X, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useModalStore } from '@/stores/modal-store'
import { useAuth } from '@/components/auth/auth-provider'
import { logger } from '@/lib/logger'
import { authService } from '@/lib/auth/auth-service'
import { useRateLimit } from '@/hooks/use-rate-limit'
import { LegalConsentForm } from '@/components/legal/legal-consent-form'

export function SignupModal() {
  const { activeModal, closeModal, openModal } = useModalStore()
  const { signUp, loading, error, clearError } = useAuth()
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const { isLimited, secondsRemaining, checkLimit } = useRateLimit({
    cooldownMs: 60000, // 60 seconds
    key: 'signup-resend'
  })
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
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match')
      return false
    }
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
    
    const success = await signUp(formData)
    
    if (success) {
      setIsSubmitted(true)
      setTimeout(() => {
        closeModal()
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: '',
          agree: false
        })
        setIsSubmitted(false)
      }, 2000)
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
        logger.error('Failed to resend confirmation email', error)
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
      logger.error('Unexpected error resending email', err)
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
                ✉️ We've sent a confirmation email to:
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
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsSubmitted(false)
                  closeModal()
                  openModal('login')
                }}
                className="flex-1 btn-primary py-2"
              >
                Go to Login
              </button>
              <button
                onClick={() => {
                  closeModal()
                  setIsSubmitted(false)
                }}
                className="flex-1 btn-secondary py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
      
      <div className="relative bg-slate-800 rounded-lg w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Create Your Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.password && (
              <div className="mt-2">
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      passwordStrength >= 4 ? 'bg-green-500' : 
                      passwordStrength >= 2 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Strength: {passwordStrength >= 4 ? 'Strong' : passwordStrength >= 2 ? 'Medium' : 'Weak'}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formatPhoneNumber(formData.phone)}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '')
                handleChange({ ...e, target: { ...e.target, name: 'phone', value: digits } })
              }}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full btn-primary py-3 font-semibold disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-400 text-sm">
          Already have an account?{' '}
          <button
            onClick={() => {
              closeModal()
              openModal('login')
            }}
            className="text-blue-400 hover:text-blue-300"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  )
}
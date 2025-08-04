/**
 * @fileMetadata
 * @purpose Simplified signup modal with proper consent tracking
 * @owner frontend-team
 * @status active
 */
'use client'

import { X, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { logger } from '@/lib/logger'
import { collectSignupTrackingData } from '@/lib/utils/tracking-utils'
import { useModalStore } from '@/stores/modal-store'

export function SignupModalSimple() {
  const { activeModal, closeModal, openModal } = useModalStore()
  const { signUp, error, clearError } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // Separate consent checkboxes for compliance
    termsAccepted: false,
    privacyAccepted: false,
    gdprConsent: false,
    marketingConsent: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

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
    // COMPLIANCE: All required consents must be checked
    if (!formData.termsAccepted) {
      setValidationError('You must accept the Terms of Service')
      return false
    }
    if (!formData.privacyAccepted) {
      setValidationError('You must accept the Privacy Policy')
      return false
    }
    if (!formData.gdprConsent) {
      setValidationError('You must consent to data processing (GDPR)')
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
      // Collect tracking data
      let trackingData = {}
      try {
        trackingData = await collectSignupTrackingData()
      } catch (error) {
        console.warn('Tracking data collection failed:', error)
        trackingData = { ipAddress: '127.0.0.1', userAgent: navigator.userAgent }
      }
      
      const signupData = {
        ...formData,
        ...trackingData,
        sessionId: `signup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        // Map to expected format
        gdprConsent: formData.gdprConsent,
        dataProcessingConsent: formData.gdprConsent, // Same as GDPR for now
        marketingConsent: formData.marketingConsent,
        // CRITICAL: Include acceptedDocuments array
        acceptedDocuments: [
          ...(formData.termsAccepted ? ['terms'] : []),
          ...(formData.privacyAccepted ? ['privacy'] : [])
        ]
      }
      
      logger.info('Submitting signup with consents', {
        email: signupData.email,
        termsAccepted: formData.termsAccepted,
        privacyAccepted: formData.privacyAccepted,
        gdprConsent: formData.gdprConsent,
        acceptedDocuments: signupData.acceptedDocuments
      })
      
      const success = await signUp(signupData)
      
      if (success) {
        setIsSubmitted(true)
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
  }

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').substring(0, 10)
    if (digits.length >= 6) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`
    } else if (digits.length >= 3) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3)}`
    }
    return digits
  }

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Check Your Email!</h2>
          <p className="text-slate-400 mb-6">
            We&apos;ve sent a verification link to <strong className="text-white">{formData.email}</strong>
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Please check your inbox and click the link to verify your account.
          </p>
          <button
            onClick={() => {
              closeModal()
              setIsSubmitted(false)
              setFormData({
                firstName: '', lastName: '', email: '', password: '', 
                confirmPassword: '', phone: '', termsAccepted: false,
                privacyAccepted: false, gdprConsent: false, marketingConsent: false
              })
            }}
            className="btn-primary w-full"
          >
            Got it!
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Create Your Account</h2>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formatPhoneNumber(formData.phone)}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '')
                handleChange({ ...e, target: { ...e.target, name: 'phone', value: digits } })
              }}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="(555) 123-4567"
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
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
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
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* COMPLIANCE: Separate consent checkboxes */}
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Legal Agreements (Required)</h3>
            
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-300">
                I accept the <a href="/legal/terms" target="_blank" className="text-blue-400 hover:underline">Terms of Service</a>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="privacyAccepted"
                checked={formData.privacyAccepted}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-300">
                I accept the <a href="/legal/privacy" target="_blank" className="text-blue-400 hover:underline">Privacy Policy</a>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="gdprConsent"
                checked={formData.gdprConsent}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-300">
                I consent to the processing of my personal data in accordance with GDPR
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="marketingConsent"
                checked={formData.marketingConsent}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-300">
                I agree to receive marketing communications (optional)
              </span>
            </label>
          </div>

          {(error || validationError) && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error?.message || validationError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full relative"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                closeModal()
                openModal('login')
              }}
              className="text-blue-400 hover:underline"
            >
              Sign In
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
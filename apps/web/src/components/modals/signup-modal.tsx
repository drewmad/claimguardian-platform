/**
 * @fileMetadata
 * @purpose "Enhanced signup modal with progressive form and UX improvements"
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/stores/modal-store", "@/lib/supabase"]
 * @exports ["SignupModal"]
 * @complexity high
 * @tags ["modal", "auth", "signup", "progressive-form", "ux-enhanced"]
 * @status stable
 */
'use client'

import { X, Eye, EyeOff, AlertCircle, Shield, Home, Building, Key, Users, Check, Scale, ExternalLink, Brain, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { toError } from '@claimguardian/utils'

import { useAuth } from '@/components/auth/auth-provider'
import { authService } from '@/lib/auth/auth-service'
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
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'homeowner', // Pre-select homeowner as majority use case
    agreeTerms: false,
    over18: false,
    agreeAI: false,
    acceptedDocuments: [] as string[]
  })
  
  // Password strength tracking
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [] as string[],
    isStrong: false
  })
  const [showPassword, setShowPassword] = useState(false)
  
  const [validationError, setValidationError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [shakeButton, setShakeButton] = useState(false)

  // Role options with icons and descriptions
  const roleOptions = [
    {
      id: 'homeowner',
      icon: Home,
      label: 'Homeowner',
      description: 'Manage your home insurance claims'
    },
    {
      id: 'renter',
      icon: Key,
      label: 'Renter',
      description: 'Protect your personal property'
    },
    {
      id: 'landlord',
      icon: Building,
      label: 'Landlord',
      description: 'Manage multiple rental properties'
    },
    {
      id: 'property-manager',
      icon: Users,
      label: 'Property Manager',
      description: 'Oversee client properties'
    }
  ]

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    const feedback = []
    let score = 0

    if (password.length >= 8) {
      score += 1
    } else {
      feedback.push('At least 8 characters')
    }

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      score += 1
    } else {
      feedback.push('Upper & lowercase letters')
    }

    if (/\d/.test(password)) {
      score += 1
    } else {
      feedback.push('At least 1 number')
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1
    } else {
      feedback.push('At least 1 symbol (!@#$%)')
    }

    const isStrong = score >= 3
    return { score, feedback, isStrong }
  }

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
    // Step 1 validation
    if (!formData.role) {
      setValidationError('Please select your role')
      return false
    }
    
    // Step 2 validation
    if (!formData.firstName?.trim()) {
      setValidationError('Please enter your first name')
      return false
    }
    if (!formData.lastName?.trim()) {
      setValidationError('Please enter your last name')
      return false
    }
    if (!formData.phone?.trim()) {
      setValidationError('Please enter your phone number')
      return false
    }
    
    // Step 3 validation
    if (!formData.email || !formData.email.includes('@')) {
      setValidationError('Please enter a valid email address')
      return false
    }
    if (!formData.password || !passwordStrength.isStrong) {
      setValidationError('Please create a strong password')
      return false
    }
    
    // Step 4 validation
    if (!formData.over18) {
      setValidationError('You must be 18 or older to use ClaimGuardian')
      return false
    }
    if (!formData.agreeTerms) {
      setValidationError('Please accept the Terms of Service and Privacy Policy')
      return false
    }
    
    // Step 5 validation
    if (!formData.agreeAI) {
      setValidationError('Please acknowledge how our AI assistance works')
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
      // Enhanced signup data with role and phone
      const signupData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role
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
          role: 'homeowner',
          agreeTerms: false,
          over18: false,
          agreeAI: false,
          acceptedDocuments: []
        })
        setCurrentStep(1)
        setPasswordStrength({ score: 0, feedback: [], isStrong: false })
      }
    } catch (error) {
      logger.error('Signup error:', undefined, toError(error))
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
    
    // Real-time password strength checking
    if (name === 'password') {
      const strength = checkPasswordStrength(value)
      setPasswordStrength(strength)
    }
    
    // Clear validation errors on change
    if (validationError) {
      setValidationError('')
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
        logger.error('Failed to resend confirmation email', undefined, toError(error))
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
      logger.error('Unexpected error resending email', undefined, toError(err))
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
            {/* Enhanced Success Icon with Animation */}
            <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4 relative">
              <svg className="w-11 h-11 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {/* Confetti Animation */}
              <div className="absolute inset-0 animate-ping">
                <Sparkles className="w-6 h-6 text-green-400 absolute -top-2 -right-2 animate-bounce" />
                <Sparkles className="w-4 h-4 text-blue-400 absolute -bottom-1 -left-1 animate-pulse" />
                <Sparkles className="w-5 h-5 text-yellow-400 absolute top-1 -left-3 animate-bounce delay-150" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">🎉 Account Created!</h2>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <p className="text-blue-300 font-medium mb-2">
                We've sent a verification link to:
              </p>
              <p className="text-white font-semibold text-lg">
                {formData.email}
              </p>
            </div>
            
            <div className="text-left space-y-4 mb-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <p className="text-slate-300 pt-1">Open your inbox</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <p className="text-slate-300 pt-1">Click "Verify your email"</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <p className="text-slate-300 pt-1">Return here → Start protecting your property</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-3 mb-6">
              <p className="text-xs text-slate-400">
                Can't find the email? Check your spam folder or click below to resend.
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
            
            <div className="flex gap-3 mb-4">
              <button
                onClick={handleResendEmail}
                disabled={resending || isLimited}
                className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-white font-medium py-3 rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? 'Sending...' : 'Resend Email'}
                {isLimited && ` (${secondsRemaining}s)`}
              </button>
              <button
                onClick={() => {
                  // Note: In real implementation, this would check email verification status
                  // For now, it's disabled as requested
                  closeModal()
                  setIsSubmitted(false)
                  // Navigate to dashboard - disabled until email verified
                }}
                disabled={true} // Disabled until email verified
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Available after email verification"
              >
                Go to Dashboard
              </button>
            </div>
            
            <div className="text-center">
              <button
                onClick={() => {
                  setIsSubmitted(false)
                  closeModal()
                  openModal('login')
                }}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Already verified? Sign in →
              </button>
            </div>
              
            {resendSuccess && (
              <p className="text-green-400 text-sm text-center mt-2">
                Verification email sent successfully!
              </p>
            )}
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
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Create Your ClaimGuardian Account</h2>
            <p className="text-sm text-gray-400 mt-2">
              Step {currentStep} of 5 • <span className="text-blue-400">≈2 min</span>
            </p>
            
            {/* Progress bar */}
            <div className="w-full bg-slate-700/50 rounded-full h-2 mt-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">Tell us who you are</h3>
                <p className="text-sm text-gray-400">We'll tailor your dashboard to your needs</p>
              </div>
              
              {/* Role Selection with Icons */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300 mb-3">I am a *</label>
                <div className="grid gap-3">
                  {roleOptions.map((role) => {
                    const Icon = role.icon
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: role.id }))}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-left flex items-center gap-3 hover:shadow-lg ${
                          formData.role === role.id
                            ? 'border-blue-500 bg-blue-500/10 text-white'
                            : 'border-slate-600 bg-slate-700/30 text-gray-300 hover:border-slate-500 hover:bg-slate-700/50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${formData.role === role.id ? 'text-blue-400' : 'text-gray-400'}`} />
                        <div className="flex-1">
                          <div className="font-medium">{role.label}</div>
                          <div className="text-sm text-gray-400">{role.description}</div>
                        </div>
                        {formData.role === role.id && (
                          <Check className="w-5 h-5 text-blue-400" />
                        )}
                      </button>
                    )
                  })}
                </div>
                
                {/* Contextual role blurb */}
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-300">
                    {formData.role === 'homeowner' && "Perfect! We'll focus on home protection, maintenance tracking, and claims optimization."}
                    {formData.role === 'renter' && "Great! We'll help you protect your belongings and understand your renter insurance coverage."}
                    {formData.role === 'landlord' && "Excellent! We'll help you manage multiple properties and streamline tenant-related claims."}
                    {formData.role === 'property-manager' && "Wonderful! We'll provide tools to efficiently manage client properties and documentation."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">Contact Information</h3>
                <p className="text-sm text-gray-400">How we'll reach you about your claims</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-blue-400 transition-colors">First Name *</label>
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
                  <label className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-blue-400 transition-colors">Last Name *</label>
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
                <label className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-blue-400 transition-colors">Mobile for claim updates *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-slate-700/70"
                  placeholder="(555) 123-4567"
                  required
                />
                <p className="mt-1 text-xs text-slate-400 contrast-[4.5]">We'll text you important claim status updates</p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">Secure Your Account</h3>
                <p className="text-sm text-gray-400">Create your login credentials</p>
              </div>

              <div className="group">
                <label className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-blue-400 transition-colors">Primary login email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-slate-700/70"
                  placeholder="john@example.com"
                  required
                />
                <p className="mt-1 text-xs text-slate-400 contrast-[4.5]">This email will be your username</p>
              </div>

              <div className="group">
                <label className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-blue-400 transition-colors">Password *</label>
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
                
                {/* Password Strength Meter */}
                {formData.password && !passwordStrength.isStrong && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-600 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            passwordStrength.score <= 1 ? 'bg-red-400 w-1/4' :
                            passwordStrength.score === 2 ? 'bg-yellow-400 w-1/2' :
                            passwordStrength.score === 3 ? 'bg-blue-400 w-3/4' :
                            'bg-green-400 w-full'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength.score <= 1 ? 'text-red-400' :
                        passwordStrength.score === 2 ? 'text-yellow-400' :
                        passwordStrength.score === 3 ? 'text-blue-400' :
                        'text-green-400'
                      }`}>
                        {passwordStrength.score <= 1 ? 'Weak' :
                         passwordStrength.score === 2 ? 'Fair' :
                         passwordStrength.score === 3 ? 'Good' :
                         'Strong'}
                      </span>
                    </div>
                    
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-xs text-slate-400 space-y-1">
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-slate-500 rounded-full" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {passwordStrength.isStrong && formData.password && (
                  <div className="mt-2 flex items-center gap-2 text-green-400 text-sm">
                    <Check className="w-4 h-4" />
                    <span>Strong password!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Scale className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-white">Legal Agreements</h3>
                </div>
                <p className="text-sm text-gray-400">Please review and accept the required policies</p>
              </div>

              <div className="space-y-4">
                {/* Age Verification */}
                <div className="bg-amber-500/5 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        name="over18"
                        checked={formData.over18}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-white font-medium">
                        I am at least 18 years old (required in Florida)
                      </label>
                      <p className="text-sm text-gray-400 mt-1">
                        Legal requirement to file insurance claims
                      </p>
                    </div>
                  </div>
                </div>

                {/* Terms and Privacy */}
                <div className="bg-amber-500/5 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-white font-medium">
                        I accept the Terms of Service and Privacy Policy
                      </label>
                      <div className="flex items-center gap-4 mt-2">
                        <button
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Terms
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPrivacyModal(true)}
                          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Privacy Policy
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Read summary of our terms and privacy practices
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">AI Disclaimer</h3>
                </div>
                <p className="text-sm text-gray-400">Understand how our AI assistance works</p>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-200 mb-2">How Our AI Helps</h4>
                    <ul className="space-y-2 text-sm text-orange-100">
                      <li className="flex items-start gap-2">
                        <span className="w-1 h-1 bg-orange-400 rounded-full flex-shrink-0 mt-2"></span>
                        <span>Reads your documents and suggests next steps</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1 h-1 bg-orange-400 rounded-full flex-shrink-0 mt-2"></span>
                        <span>95%+ accuracy, but may miss context</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1 h-1 bg-orange-400 rounded-full flex-shrink-0 mt-2"></span>
                        <span>Always cross-check big decisions</span>
                      </li>
                    </ul>
                    <button
                      type="button"
                      onClick={() => setShowAIModal(true)}
                      className="text-xs text-orange-300 hover:text-orange-200 mt-2 flex items-center gap-1"
                    >
                      Learn more about our AI
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      name="agreeAI"
                      checked={formData.agreeAI}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                  <label className="text-white font-medium flex-1">
                    I understand how ClaimGuardian AI works and will verify critical details *
                  </label>
                </div>
              </div>
            </div>
          )}

          {(error || validationError) && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error?.message || validationError}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 md:flex-none md:px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                ← Back
              </button>
            )}
            
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => {
                  // Basic validation before proceeding
                  if (currentStep === 1 && !formData.role) return
                  if (currentStep === 2 && (!formData.firstName || !formData.lastName || !formData.phone)) return
                  if (currentStep === 3 && (!formData.email || !passwordStrength.isStrong)) return
                  if (currentStep === 4 && (!formData.over18 || !formData.agreeTerms)) {
                    // Add shake animation for disabled button
                    setShakeButton(true)
                    setTimeout(() => setShakeButton(false), 500)
                    return
                  }
                  setCurrentStep(currentStep + 1)
                }}
                disabled={
                  (currentStep === 4 && (!formData.over18 || !formData.agreeTerms)) ||
                  (currentStep === 5 && !formData.agreeAI)
                }
                className={`flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/25 md:ml-auto disabled:opacity-50 disabled:cursor-not-allowed ${
                  shakeButton ? 'animate-[shake_0.5s_ease-in-out]' : ''
                }`}
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !passwordStrength.isStrong || !formData.agreeAI}
                className="flex-1 relative py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/25 md:ml-auto"
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
                  'Create Account →'
                )}
              </button>
            )}
          </div>
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
            className="w-full py-3 px-4 bg-slate-700/30 hover:bg-slate-700/50 text-gray-300 hover:text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg opacity-60 hover:opacity-100 border border-slate-600/50 hover:border-slate-500"
          >
            Sign In Instead
          </button>
        </div>
        </div>
      </div>

      {/* Policy Modals */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowTermsModal(false)} />
          <div className="relative bg-slate-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Terms of Service Summary</h3>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4 text-gray-300">
                <p><strong>Service Overview:</strong> ClaimGuardian provides AI-powered insurance claim assistance and property management tools.</p>
                <p><strong>User Responsibilities:</strong> Provide accurate information, verify AI suggestions, maintain account security.</p>
                <p><strong>Privacy:</strong> We protect your data with bank-level security and never sell personal information.</p>
                <p><strong>AI Disclaimer:</strong> Our AI provides suggestions, not legal advice. Always verify with your insurer.</p>
                <p><strong>Cancellation:</strong> Cancel anytime. No long-term commitments.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowPrivacyModal(false)} />
          <div className="relative bg-slate-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Privacy Policy Summary</h3>
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4 text-gray-300">
                <p><strong>Data Collection:</strong> We collect only what's needed for claim assistance (property info, documents, communications).</p>
                <p><strong>Data Usage:</strong> Information is used solely to provide our services. AI analysis stays private to you.</p>
                <p><strong>Data Security:</strong> Bank-grade encryption, secure storage, regular security audits.</p>
                <p><strong>Data Sharing:</strong> We never sell data. Only shared with your explicit consent or legal requirements.</p>
                <p><strong>Your Rights:</strong> Access, modify, or delete your data anytime. Full control over your information.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAIModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowAIModal(false)} />
          <div className="relative bg-slate-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">How Our AI Works</h3>
                <button
                  onClick={() => setShowAIModal(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4 text-gray-300">
                <p><strong>Document Analysis:</strong> Our AI reads insurance policies, claim forms, and property documents to identify key information.</p>
                <p><strong>Claim Optimization:</strong> Suggests documentation improvements, identifies coverage gaps, and recommends next steps.</p>
                <p><strong>Accuracy:</strong> 95%+ accuracy on standard documents, but context and nuances may be missed.</p>
                <p><strong>Limitations:</strong> AI provides suggestions, not legal advice. Always verify critical decisions with your insurer.</p>
                <p><strong>Privacy:</strong> All AI processing happens securely. Your data never trains other models or leaves our system.</p>
                <p><strong>Human Oversight:</strong> Complex cases are reviewed by insurance professionals when needed.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

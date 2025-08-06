/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
'use client'

import { createBrowserSupabaseClient } from '@claimguardian/db'
import { Shield, ArrowLeft, ArrowRight, Loader2, AlertCircle, Check, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useCallback, useMemo } from 'react'
import { logger } from "../../../lib/logger/production-logger"

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type Step = 'welcome' | 'account' | 'legal' | 'ai-disclaimer' | 'success'

// Constants moved outside component to prevent recreation
const STEPS: readonly Step[] = ['welcome', 'account', 'legal', 'ai-disclaimer', 'success'] as const
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_DIGITS_REGEX = /^\d{10}$/

// Password strength cache to avoid repeated calculations
type PasswordStrengthResult = {
  strength: string
  score: number
  color: string
  feedback: string[]
}
const passwordStrengthCache = new Map<string, PasswordStrengthResult>()

export function MultiStepSignupForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('welcome')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Account Security
    password: '',
    confirmPassword: '',
    
    // Legal
    over18: false,
    legalAgreements: false,
    
    // AI Disclaimer
    aiDisclaimerAccepted: false,
    
    // Residency
    residencyType: '' as '' | 'renter' | 'homeowner' | 'landlord' | 'real_estate_pro',
  })
  
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  
  const formatPhone = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }, [])
  
  const validateEmail = useCallback((email: string) => {
    return EMAIL_REGEX.test(email)
  }, [])
  
  const validatePhone = useCallback((phone: string) => {
    const digits = phone.replace(/\D/g, '')
    return PHONE_DIGITS_REGEX.test(digits)
  }, [])
  
  const getPasswordStrength = useCallback((password: string) => {
    if (passwordStrengthCache.has(password)) {
      return passwordStrengthCache.get(password)!
    }

    let score = 0
    const feedback = []
    
    if (password.length >= 8) score += 1
    else feedback.push('At least 8 characters')
    
    if (/[a-z]/.test(password)) score += 1
    else feedback.push('A lowercase letter')
    
    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('An uppercase letter')
    
    if (/\d/.test(password)) score += 1
    else feedback.push('A number')
    
    if (/[^a-zA-Z0-9]/.test(password)) score += 1
    else feedback.push('A special character')
    
    const strength = score <= 2 ? 'weak' : score <= 3 ? 'medium' : score <= 4 ? 'strong' : 'very-strong'
    const color = {
      weak: 'text-red-400',
      medium: 'text-yellow-400', 
      strong: 'text-blue-400',
      'very-strong': 'text-green-400'
    }[strength]
    
    const result = { score, strength, feedback, color }
    
    // Cache result but limit cache size
    if (passwordStrengthCache.size > 100) {
      const firstKey = passwordStrengthCache.keys().next().value
      if (firstKey) passwordStrengthCache.delete(firstKey)
    }
    passwordStrengthCache.set(password, result)
    
    return result
  }, [])
  
  const stepProgress = useMemo(() => {
    const currentIndex = STEPS.indexOf(currentStep)
    return {
      currentStep: currentIndex + 1,
      totalSteps: STEPS.length,
      percentage: ((currentIndex + 1) / STEPS.length) * 100
    }
  }, [currentStep])

  const isStepValid = useMemo((): boolean => {
    switch (currentStep) {
      case 'welcome':
        return true
      case 'account':
        return !!(
          formData.firstName &&
          formData.lastName &&
          formData.email &&
          validateEmail(formData.email) &&
          formData.phone &&
          validatePhone(formData.phone) &&
          formData.password &&
          formData.password.length >= 8 &&
          formData.confirmPassword &&
          formData.password === formData.confirmPassword &&
          formData.residencyType
        )
      case 'legal':
        return formData.over18 && formData.legalAgreements
      case 'ai-disclaimer':
        return formData.aiDisclaimerAccepted
      case 'success':
        return true
      default:
        return false
    }
  }, [currentStep, formData, validateEmail, validatePhone])
  
  const handleNext = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep)
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1])
      setError(null)
    }
  }, [currentStep])
  
  const handleBack = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1])
      setError(null)
    }
  }, [currentStep])
  
  const handleSubmit = useCallback(async () => {
    logger.info('🔵 handleSubmit called - starting signup process')
    logger.info('📱 User agent:', navigator.userAgent)
    logger.info('📋 Form data:', formData)
    console.log('🔍 Step validation check:', {
      currentStep,
      isValid: isStepValid,
      validationBreakdown: {
        over18: formData.over18,
        legalAgreements: formData.legalAgreements,
        aiDisclaimerAccepted: formData.aiDisclaimerAccepted
      }
    })
    
    // Double-check all validations before proceeding
    if (!isStepValid) {
      logger.info('⚠️ Step validation failed, aborting submission')
      setError('Please complete all required fields before continuing.')
      return
    }
    
    setIsLoading(true)
    setError(null)
    logger.info('🔄 Loading state set to true, error cleared')
    
    try {
      logger.info('🔐 Attempting signup with Supabase...')
      logger.info('🔗 Supabase client initialized:', !!supabase)
      console.log('📧 Signup payload:', {
        email: formData.email,
        password: formData.password ? '[PROVIDED]' : '[MISSING]',
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
          }
        }
      })
      
      // Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
          }
        }
      })
      
      logger.info('📨 Supabase signup response:', { signUpData, signUpError })
      logger.info('👤 User data received:', signUpData?.user ? 'YES' : 'NO')
      logger.info('🔑 Session data received:', signUpData?.session ? 'YES' : 'NO')
      
      if (signUpError) throw signUpError
      
      if (signUpData?.user) {
        logger.info('✅ User created successfully:', signUpData.user.id)
        
        // Check if email confirmation is required
        if (!signUpData.session && signUpData.user && !signUpData.user.email_confirmed_at) {
          logger.info('📧 Email confirmation required - showing success page')
          
          // Log consent data for audit trail
          console.log('User consents recorded:', {
            terms_accepted: formData.legalAgreements,
            ai_disclaimer_accepted: formData.aiDisclaimerAccepted,
            residency_type: formData.residencyType,
            over_18: formData.over18,
            signup_timestamp: new Date().toISOString(),
            signup_user_agent: navigator.userAgent,
            signup_referrer: document.referrer || null,
            signup_landing_page: window.location.href
          })
          
          // Show success message for email verification
          setCurrentStep('success')
        } else {
          // Profile will be automatically created by database trigger
          logger.info('User profile will be created automatically by database trigger')
          
          // Log consent data for audit trail
          console.log('User consents recorded:', {
            terms_accepted: formData.legalAgreements,
            ai_disclaimer_accepted: formData.aiDisclaimerAccepted,
            residency_type: formData.residencyType,
            over_18: formData.over18,
            signup_timestamp: new Date().toISOString(),
            signup_user_agent: navigator.userAgent,
            signup_referrer: document.referrer || null,
            signup_landing_page: window.location.href
          })
          
          logger.info('🚀 Redirecting to onboarding...')
          // Redirect to property setup
          router.push('/onboarding/property-setup')
        }
      } else {
        logger.info('❌ No user data received from signup')
        setError('Signup completed but no user data received. Please try signing in.')
      }
    } catch (err) {
      logger.error('❌ Signup error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
    } finally {
      logger.info('🏁 Signup process completed, setting loading to false')
      setIsLoading(false)
    }
  }, [isStepValid, supabase, formData, router, currentStep])
  
  // Optimized form data updater - uses functional update to avoid recreation
  const updateFormData = useCallback(<K extends keyof typeof formData>(
    key: K,
    value: typeof formData[K]
  ) => {
    setFormData(prev => {
      if (prev[key] === value) return prev // Prevent unnecessary updates
      return { ...prev, [key]: value }
    })
  }, [])

  const renderStepContent = useMemo(() => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="space-y-8">
            {/* Welcome Message */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome to ClaimGuardian</h1>
              <p className="text-gray-400">Your Digital Guardian</p>
            </div>
            
            {/* Visual Divider */}
            <div className="border-t border-slate-700/50"></div>
            
            {/* Compliance Message - Simplified */}
            <div className="text-center">
              <p className="text-sm text-gray-400">
                We follow Florida law and safeguard your data with advanced security standards.
              </p>
            </div>
            
            {/* Visual Divider */}
            <div className="border-t border-slate-700/50"></div>
            
            {/* What to Expect - Enhanced with emoji and bullets */}
            <Alert className="bg-blue-950/50 border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-100">
                <div className="space-y-2">
                  <div className="font-semibold text-blue-100">📘 What to Expect</div>
                  <ul className="space-y-1 text-sm">
                    <li>• <strong>Duration:</strong> About 2 minutes</li>
                    <li>• <strong>Includes:</strong> Legal disclosures required by Florida law</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )
        
      case 'account':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">Create Account</h2>
              <p className="text-gray-400 mt-1">Sign up to get started</p>
            </div>
            
            {/* Personal Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    className="mt-1 bg-slate-800 border-slate-700 text-white"
                    placeholder="Enter your first name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    className="mt-1 bg-slate-800 border-slate-700 text-white"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className={cn(
                    "mt-1 bg-slate-800 border-slate-700 text-white",
                    formData.email && !validateEmail(formData.email) && "border-red-500"
                  )}
                  placeholder="Enter your email address"
                />
                {formData.email && !validateEmail(formData.email) && (
                  <p className="text-xs text-red-500 mt-1">Please enter a valid email</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value)
                    updateFormData('phone', formatted)
                  }}
                  className={cn(
                    "mt-1 bg-slate-800 border-slate-700 text-white",
                    formData.phone && !validatePhone(formData.phone) && "border-red-500"
                  )}
                  placeholder="Enter your phone number"
                />
                {formData.phone && !validatePhone(formData.phone) && (
                  <p className="text-xs text-red-500 mt-1">Please enter a valid 10-digit phone number</p>
                )}
              </div>
            </div>
            
            {/* Account Security */}
            <div className="border-t border-slate-700 pt-4 space-y-4">
              <h3 className="font-medium text-white">Account Security</h3>
              
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  className={cn(
                    "mt-1 bg-slate-800 border-slate-700 text-white",
                    formData.password && formData.password.length < 8 && "border-red-500"
                  )}
                  placeholder="••••••••"
                />
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400">Password strength:</span>
                      <span className={`text-xs font-medium ${getPasswordStrength(formData.password).color}`}>
                        {getPasswordStrength(formData.password).strength.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 w-full rounded ${
                            i < getPasswordStrength(formData.password).score
                              ? getPasswordStrength(formData.password).strength === 'weak'
                                ? 'bg-red-400'
                                : getPasswordStrength(formData.password).strength === 'medium'
                                ? 'bg-yellow-400'
                                : getPasswordStrength(formData.password).strength === 'strong'
                                ? 'bg-blue-400'
                                : 'bg-green-400'
                              : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    {getPasswordStrength(formData.password).feedback.length > 0 && (
                      <p className="text-xs text-gray-400">
                        Add: {getPasswordStrength(formData.password).feedback.join(', ')}
                      </p>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  className={cn(
                    "mt-1 bg-slate-800 border-slate-700 text-white",
                    formData.confirmPassword && formData.password !== formData.confirmPassword && "border-red-500"
                  )}
                  placeholder="••••••••"
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                )}
              </div>
            </div>
            
            {/* Residency Type */}
            <div className="border-t border-slate-700 pt-4">
              <Label className="text-base font-medium mb-3 block">I am a... *</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateFormData('residencyType', 'renter')}
                  className={cn(
                    "p-3 rounded-lg border text-sm font-medium transition-all",
                    formData.residencyType === 'renter'
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-slate-700 bg-slate-800 text-gray-300 hover:border-slate-600"
                  )}
                >
                  Renter
                </button>
                <button
                  type="button"
                  onClick={() => updateFormData('residencyType', 'homeowner')}
                  className={cn(
                    "p-3 rounded-lg border text-sm font-medium transition-all",
                    formData.residencyType === 'homeowner'
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-slate-700 bg-slate-800 text-gray-300 hover:border-slate-600"
                  )}
                >
                  Homeowner
                </button>
                <button
                  type="button"
                  onClick={() => updateFormData('residencyType', 'landlord')}
                  className={cn(
                    "p-3 rounded-lg border text-sm font-medium transition-all",
                    formData.residencyType === 'landlord'
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-slate-700 bg-slate-800 text-gray-300 hover:border-slate-600"
                  )}
                >
                  Landlord
                </button>
                <button
                  type="button"
                  onClick={() => updateFormData('residencyType', 'real_estate_pro')}
                  className={cn(
                    "p-3 rounded-lg border text-sm font-medium transition-all",
                    formData.residencyType === 'real_estate_pro'
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-slate-700 bg-slate-800 text-gray-300 hover:border-slate-600"
                  )}
                >
                  Real Estate Pro
                </button>
              </div>
            </div>
          </div>
        )
        
      case 'legal':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">Legal Agreements</h2>
              <p className="text-gray-400 mt-1">Please review and accept our policies</p>
            </div>
            
            {/* Age Verification */}
            <div className="bg-slate-800/50 rounded-lg p-6 space-y-4">
              <h3 className="font-medium text-white">Age Verification</h3>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="over18"
                  checked={formData.over18}
                  onCheckedChange={(checked: boolean) => updateFormData('over18', !!checked)}
                  className="mt-1"
                />
                <Label htmlFor="over18" className="text-sm cursor-pointer">
                  I confirm that I am 18 years or older *
                </Label>
              </div>
            </div>
            
            {/* Legal Agreements */}
            <div className="bg-slate-800/50 rounded-lg p-6 space-y-4">
              <h3 className="font-medium text-white">Terms & Privacy</h3>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="legal"
                  checked={formData.legalAgreements}
                  onCheckedChange={(checked: boolean) => updateFormData('legalAgreements', !!checked)}
                  className="mt-1"
                />
                <Label htmlFor="legal" className="text-sm cursor-pointer">
                  I accept the{' '}
                  <Link href="/legal/terms-of-service" target="_blank" className="text-blue-400 hover:text-blue-300">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/legal/privacy-policy" target="_blank" className="text-blue-400 hover:text-blue-300">
                    Privacy Policy
                  </Link> *
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-7">
                By accepting, you agree to our terms of use and how we handle your data
              </p>
            </div>
          </div>
        )
        
      case 'ai-disclaimer':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">AI Disclaimer</h2>
              <p className="text-gray-400 mt-1">Important information about our AI tools</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-6 space-y-4">
              <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-200">
                  ClaimGuardian uses artificial intelligence to help analyze documents, provide suggestions, and guide you through the claims process. While our AI is designed to be helpful and accurate, it's important to understand its limitations.
                </p>
              </div>
              
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  AI can make mistakes and may occasionally provide incorrect information
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  Always verify important information with your insurance company or legal advisor
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  AI suggestions are not a substitute for professional advice
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  Final decisions about your claim should be made by you
                </li>
              </ul>
              
              <div className="flex items-start space-x-3 pt-4 border-t border-slate-700">
                <Checkbox
                  id="ai-disclaimer"
                  checked={formData.aiDisclaimerAccepted}
                  onCheckedChange={(checked: boolean) => updateFormData('aiDisclaimerAccepted', !!checked)}
                  className="mt-1"
                />
                <Label htmlFor="ai-disclaimer" className="text-sm cursor-pointer">
                  I understand that AI can make mistakes and I should verify important information *
                </Label>
              </div>
            </div>
          </div>
        )
        
      case 'success':
        return (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 bg-green-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Account Created Successfully!</h2>
              <p className="text-gray-400 mb-6">
                We've sent a verification email to <strong className="text-white">{formData.email}</strong>
              </p>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-white">Next Steps:</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">1</div>
                  <div>
                    <p className="text-white font-medium">Check your email</p>
                    <p className="text-gray-400 text-sm">Look for an email from ClaimGuardian with the subject "Verify your email address"</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">2</div>
                  <div>
                    <p className="text-white font-medium">Click the verification link</p>
                    <p className="text-gray-400 text-sm">This will confirm your email address and activate your account</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">3</div>
                  <div>
                    <p className="text-white font-medium">Start managing your property</p>
                    <p className="text-gray-400 text-sm">Once verified, you'll be redirected to complete your property setup</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Didn't receive an email? Check your spam folder or contact support.</p>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }, [currentStep, formData, getPasswordStrength, updateFormData, formatPhone])
  
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Step {stepProgress.currentStep} of {stepProgress.totalSteps}</span>
              <span>{Math.round(stepProgress.percentage)}% complete</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${stepProgress.percentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {['Welcome', 'Account', 'Legal', 'AI Terms', 'Success'].map((stepName, index) => {
                const isCompleted = index < stepProgress.currentStep - 1
                const isCurrent = index === stepProgress.currentStep - 1
                
                return (
                  <div key={stepName} className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full border-2 transition-colors ${
                      isCompleted 
                        ? 'bg-blue-600 border-blue-600' 
                        : isCurrent 
                        ? 'border-blue-600 bg-slate-900' 
                        : 'border-slate-600 bg-slate-800'
                    }`}>
                      {isCompleted && (
                        <Check className="w-2 h-2 text-white m-0.5" />
                      )}
                    </div>
                    <span className={`text-xs mt-1 ${
                      isCompleted || isCurrent ? 'text-blue-400' : 'text-gray-500'
                    }`}>
                      {stepName}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          
          {renderStepContent}
          
          {/* Navigation */}
          {currentStep !== 'success' && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
            {currentStep === 'welcome' ? (
              <>
                <Link
                  href="/"
                  className="text-sm text-gray-400 hover:text-white flex items-center"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Back to Home
                </Link>
                <Button
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  className="text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                
                {currentStep === 'ai-disclaimer' ? (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    onTouchStart={(e) => {
                      logger.info('👆 Touch start event:', e.type)
                    }}
                    onTouchEnd={(e) => {
                      logger.info('👆 Touch end event:', e.type)
                    }}
                    disabled={!isStepValid || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 a11y-touch-target w-full"
                    style={{ 
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      userSelect: 'none' 
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <Check className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepValid}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
          )}
          
          {/* Footer Links */}
          {currentStep !== 'welcome' && (
            <div className="text-center mt-6">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300">
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

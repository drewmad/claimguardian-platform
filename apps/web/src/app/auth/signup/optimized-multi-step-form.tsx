'use client'

import { createBrowserSupabaseClient } from '@claimguardian/db'
import { Shield, ArrowLeft, ArrowRight, Loader2, AlertCircle, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useCallback, useMemo, useRef } from 'react'
import { logger } from "@/lib/logger/production-logger"

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type Step = 'welcome' | 'account' | 'legal' | 'ai-disclaimer'

// Constants moved outside component to prevent recreation
const STEPS: readonly Step[] = ['welcome', 'account', 'legal', 'ai-disclaimer'] as const
const PHONE_FORMATTER = /(\d{3})(\d{3})(\d{4})/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_DIGITS_REGEX = /^\d{10}$/

// Password strength result interface
interface PasswordStrengthResult {
  score: number
  feedback: string[]
  strength: string
  color: string
}

// Password strength cache to avoid repeated calculations
const passwordStrengthCache = new Map<string, PasswordStrengthResult>()

function calculatePasswordStrength(password: string): PasswordStrengthResult {
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
}

export function OptimizedMultiStepSignupForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('welcome')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    over18: false,
    legalAgreements: false,
    aiDisclaimerAccepted: false,
    residencyType: '' as '' | 'renter' | 'homeowner' | 'landlord' | 'real_estate_pro',
  })
  
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  
  // Debounced validation to reduce computation
  const validationTimeoutRef = useRef<NodeJS.Timeout>()
  const [validationState, setValidationState] = useState({
    emailValid: false,
    phoneValid: false,
    passwordValid: false,
    passwordsMatch: false
  })

  // Memoized formatters and validators
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

  // Debounced validation update
  const updateValidation = useCallback(() => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }
    
    validationTimeoutRef.current = setTimeout(() => {
      setValidationState({
        emailValid: validateEmail(formData.email),
        phoneValid: validatePhone(formData.phone),
        passwordValid: formData.password.length >= 8,
        passwordsMatch: formData.password === formData.confirmPassword && formData.password.length > 0
      })
    }, 300)
  }, [formData.email, formData.phone, formData.password, formData.confirmPassword, validateEmail, validatePhone])

  // Memoized step validation
  const isStepValid = useMemo((): boolean => {
    switch (currentStep) {
      case 'welcome':
        return true
      case 'account':
        return !!(
          formData.firstName &&
          formData.lastName &&
          formData.email &&
          validationState.emailValid &&
          formData.phone &&
          validationState.phoneValid &&
          formData.password &&
          validationState.passwordValid &&
          validationState.passwordsMatch &&
          formData.residencyType
        )
      case 'legal':
        return formData.over18 && formData.legalAgreements
      case 'ai-disclaimer':
        return formData.aiDisclaimerAccepted
      default:
        return false
    }
  }, [currentStep, formData, validationState])

  // Memoized step progress
  const stepProgress = useMemo(() => {
    const currentIndex = STEPS.indexOf(currentStep)
    return {
      currentStep: currentIndex + 1,
      totalSteps: STEPS.length,
      percentage: ((currentIndex + 1) / STEPS.length) * 100
    }
  }, [currentStep])

  // Memoized password strength (only calculate when password changes)
  const passwordStrength = useMemo(() => {
    return formData.password ? calculatePasswordStrength(formData.password) : null
  }, [formData.password])

  // Optimized form data updater - uses functional update to avoid recreation
  const updateFormData = useCallback(<K extends keyof typeof formData>(
    key: K,
    value: typeof formData[K]
  ) => {
    setFormData(prev => {
      if (prev[key] === value) return prev // Prevent unnecessary updates
      return { ...prev, [key]: value }
    })
    
    // Trigger validation update for relevant fields
    if (['email', 'phone', 'password', 'confirmPassword'].includes(key)) {
      updateValidation()
    }
  }, [updateValidation])

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
    if (!isStepValid) {
      setError('Please complete all required fields before continuing.')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
          }
        }
      })
      
      if (signUpError) throw signUpError
      
      if (signUpData?.user) {
        // Log consent data for audit trail (minimal logging in production)
        if (process.env.NODE_ENV === 'development') {
          logger.info('User signup completed', {
            userId: signUpData.user.id,
            termsAccepted: formData.legalAgreements,
            aiDisclaimerAccepted: formData.aiDisclaimerAccepted,
            residencyType: formData.residencyType
          })
        }
        
        router.push('/onboarding/property-setup')
      } else {
        setError('Signup completed but no user data received. Please try signing in.')
      }
    } catch (err) {
      logger.error('Signup error', err instanceof Error ? err : new Error(String(err)))
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
    } finally {
      setIsLoading(false)
    }
  }, [isStepValid, supabase, formData, router])

  // Render optimized step content
  const renderStepContent = useMemo(() => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome to ClaimGuardian</h1>
              <p className="text-gray-400">Your AI-powered insurance claim advocate for Florida property owners</p>
              <p className="text-sm text-gray-500 mt-4">
                This signup process ensures we comply with all Florida insurance regulations and protects your data according to the highest standards.
              </p>
            </div>
            
            <Alert className="bg-blue-950/50 border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-100">
                <strong>What to expect:</strong> This process takes about 2 minutes and includes important legal disclosures required by Florida law.
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
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className={cn(
                    "mt-1 bg-slate-800 border-slate-700 text-white",
                    formData.email && !validationState.emailValid && "border-red-500"
                  )}
                  placeholder="Enter your email address"
                />
                {formData.email && !validationState.emailValid && (
                  <p className="text-red-400 text-sm mt-1">Please enter a valid email address</p>
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
                    formData.phone && !validationState.phoneValid && "border-red-500"
                  )}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                />
                {formData.phone && !validationState.phoneValid && (
                  <p className="text-red-400 text-sm mt-1">Please enter a valid 10-digit phone number</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  className="mt-1 bg-slate-800 border-slate-700 text-white"
                  placeholder="Create a strong password"
                />
                {passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div 
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            passwordStrength.strength === 'weak' ? 'bg-red-400 w-1/4' :
                            passwordStrength.strength === 'medium' ? 'bg-yellow-400 w-2/4' :
                            passwordStrength.strength === 'strong' ? 'bg-blue-400 w-3/4' :
                            'bg-green-400 w-full'
                          )}
                        />
                      </div>
                      <span className={cn("text-xs font-medium", passwordStrength.color)}>
                        {passwordStrength.strength.replace('-', ' ')}
                      </span>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <p className="text-gray-400 text-xs mt-1">
                        Missing: {passwordStrength.feedback.join(', ')}
                      </p>
                    )}
                  </div>
                )}
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
                    formData.confirmPassword && !validationState.passwordsMatch && "border-red-500"
                  )}
                  placeholder="Confirm your password"
                />
                {formData.confirmPassword && !validationState.passwordsMatch && (
                  <p className="text-red-400 text-sm mt-1">Passwords do not match</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="residencyType">Property Relationship *</Label>
                <select
                  id="residencyType"
                  value={formData.residencyType}
                  onChange={(e) => updateFormData('residencyType', e.target.value as any)}
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select your relationship to property</option>
                  <option value="homeowner">Homeowner</option>
                  <option value="renter">Renter/Tenant</option>
                  <option value="landlord">Landlord/Property Owner</option>
                  <option value="real_estate_pro">Real Estate Professional</option>
                </select>
              </div>
            </div>
          </div>
        )
        
      case 'legal':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">Legal Requirements</h2>
              <p className="text-gray-400 mt-1">Required by Florida law</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="over18"
                  checked={formData.over18}
                  onCheckedChange={(checked) => updateFormData('over18', !!checked)}
                  className="mt-1 border-slate-600 data-[state=checked]:bg-blue-600"
                />
                <div className="space-y-1">
                  <Label htmlFor="over18" className="text-white cursor-pointer">
                    I am 18 years of age or older *
                  </Label>
                  <p className="text-sm text-gray-400">
                    You must be at least 18 years old to use ClaimGuardian services.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="legalAgreements"
                  checked={formData.legalAgreements}
                  onCheckedChange={(checked) => updateFormData('legalAgreements', !!checked)}
                  className="mt-1 border-slate-600 data-[state=checked]:bg-blue-600"
                />
                <div className="space-y-1">
                  <Label htmlFor="legalAgreements" className="text-white cursor-pointer">
                    I agree to the Terms of Service and Privacy Policy *
                  </Label>
                  <p className="text-sm text-gray-400">
                    By checking this box, you agree to our{' '}
                    <Link href="/legal/terms-of-service" className="text-blue-400 hover:underline">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/legal/privacy-policy" className="text-blue-400 hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
            
            <Alert className="bg-yellow-950/50 border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-100">
                <strong>Important:</strong> These agreements are required by Florida insurance regulations and cannot be skipped.
              </AlertDescription>
            </Alert>
          </div>
        )
        
      case 'ai-disclaimer':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">AI Technology Disclosure</h2>
              <p className="text-gray-400 mt-1">Required disclosure about AI usage</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">How ClaimGuardian Uses AI</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• AI helps analyze property damage from photos</li>
                <li>• AI assists in reviewing insurance policy documents</li>
                <li>• AI provides claim guidance and recommendations</li>
                <li>• All AI recommendations are reviewed by licensed professionals</li>
                <li>• You maintain full control over all claim decisions</li>
              </ul>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox
                id="aiDisclaimer"
                checked={formData.aiDisclaimerAccepted}
                onCheckedChange={(checked) => updateFormData('aiDisclaimerAccepted', !!checked)}
                className="mt-1 border-slate-600 data-[state=checked]:bg-blue-600"
              />
              <div className="space-y-1">
                <Label htmlFor="aiDisclaimer" className="text-white cursor-pointer">
                  I understand and accept the use of AI technology *
                </Label>
                <p className="text-sm text-gray-400">
                  I understand that ClaimGuardian uses artificial intelligence to assist with claim analysis and that all final decisions remain with me and licensed professionals.
                </p>
              </div>
            </div>
            
            <Alert className="bg-blue-950/50 border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-100">
                <strong>Note:</strong> This disclosure is required by Florida AI transparency regulations.
              </AlertDescription>
            </Alert>
          </div>
        )
        
      default:
        return null
    }
  }, [currentStep, formData, validationState, passwordStrength, updateFormData, formatPhone])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Step {stepProgress.currentStep} of {stepProgress.totalSteps}</span>
            <span className="text-sm text-gray-400">{Math.round(stepProgress.percentage)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${stepProgress.percentage}%` }}
            />
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-slate-700">
          {error && (
            <Alert className="mb-6 bg-red-950/50 border-red-800">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-100">{error}</AlertDescription>
            </Alert>
          )}

          {renderStepContent}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-700">
            <Button
              onClick={handleBack}
              variant="ghost"
              disabled={currentStep === 'welcome' || isLoading}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep === 'ai-disclaimer' ? (
              <Button
                onClick={handleSubmit}
                disabled={!isStepValid || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Complete Signup
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isStepValid || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Sign In Link */}
          <div className="text-center mt-6 pt-4 border-t border-slate-700">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-blue-400 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
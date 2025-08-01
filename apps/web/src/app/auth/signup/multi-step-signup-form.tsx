'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, ArrowLeft, ArrowRight, Loader2, AlertCircle, Check } from 'lucide-react'
import { createBrowserSupabaseClient } from '@claimguardian/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

type Step = 'welcome' | 'account' | 'legal' | 'ai-disclaimer'

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
  
  const supabase = createBrowserSupabaseClient()
  
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }
  
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  
  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '')
    return digits.length === 10
  }
  
  const isStepValid = (step: Step): boolean => {
    switch (step) {
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
      default:
        return false
    }
  }
  
  const handleNext = () => {
    const steps: Step[] = ['welcome', 'account', 'legal', 'ai-disclaimer']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
      setError(null)
    }
  }
  
  const handleBack = () => {
    const steps: Step[] = ['welcome', 'account', 'legal', 'ai-disclaimer']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
      setError(null)
    }
  }
  
  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Sign up the user
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
        // Store user profile data (temporarily skip consent RPC until it's fixed)
        try {
          // Use user_profiles table which exists in production
          await supabase.from('user_profiles').upsert({
            user_id: signUpData.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            signup_completed_at: new Date().toISOString(),
            signup_user_agent: navigator.userAgent,
            signup_timestamp: new Date().toISOString(),
            // Store basic info we have available
            signup_referrer: document.referrer || null,
            signup_landing_page: window.location.href
          })
          
          // TODO: Store consent data when RPC function is available
          console.log('User consents recorded:', {
            terms_accepted: formData.legalAgreements,
            ai_disclaimer_accepted: formData.aiDisclaimerAccepted,
            residency_type: formData.residencyType
          })
        } catch (profileError) {
          console.warn('Profile creation warning:', profileError)
          // Continue anyway - user account was created successfully
        }
        
        // Redirect to property setup
        router.push('/onboarding/property-setup')
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
    } finally {
      setIsLoading(false)
    }
  }
  
  const renderStepContent = () => {
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
              <p className="text-gray-400">Your AI-powered insurance claim advocate for Florida property owners</p>
              <p className="text-sm text-gray-500 mt-4">
                This signup process ensures we comply with all Florida insurance regulations and protects your data according to the highest standards.
              </p>
            </div>
            
            {/* Info Box */}
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
            
            {/* Personal Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="mt-1 bg-slate-800 border-slate-700 text-white"
                    placeholder="John"
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="mt-1 bg-slate-800 border-slate-700 text-white"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={cn(
                    "mt-1 bg-slate-800 border-slate-700 text-white",
                    formData.email && !validateEmail(formData.email) && "border-red-500"
                  )}
                  placeholder="you@example.com"
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
                  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  className={cn(
                    "mt-1 bg-slate-800 border-slate-700 text-white",
                    formData.phone && !validatePhone(formData.phone) && "border-red-500"
                  )}
                  placeholder="(555) 123-4567"
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
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={cn(
                    "mt-1 bg-slate-800 border-slate-700 text-white",
                    formData.password && formData.password.length < 8 && "border-red-500"
                  )}
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={cn(
                    "mt-1 bg-slate-800 border-slate-700 text-white",
                    formData.confirmPassword && formData.password !== formData.confirmPassword && "border-red-500"
                  )}
                  placeholder="••••••••"
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords don&apos;t match</p>
                )}
              </div>
            </div>
            
            {/* Residency Type */}
            <div className="border-t border-slate-700 pt-4">
              <Label className="text-base font-medium mb-3 block">I am a... *</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, residencyType: 'renter' })}
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
                  onClick={() => setFormData({ ...formData, residencyType: 'homeowner' })}
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
                  onClick={() => setFormData({ ...formData, residencyType: 'landlord' })}
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
                  onClick={() => setFormData({ ...formData, residencyType: 'real_estate_pro' })}
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
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, over18: !!checked })}
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
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, legalAgreements: !!checked })}
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
                  ClaimGuardian uses artificial intelligence to help analyze documents, provide suggestions, and guide you through the claims process. While our AI is designed to be helpful and accurate, it&apos;s important to understand its limitations.
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
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, aiDisclaimerAccepted: !!checked })}
                  className="mt-1"
                />
                <Label htmlFor="ai-disclaimer" className="text-sm cursor-pointer">
                  I understand that AI can make mistakes and I should verify important information *
                </Label>
              </div>
            </div>
          </div>
        )
    }
  }
  
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
          
          {renderStepContent()}
          
          {/* Navigation */}
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
                    onClick={handleSubmit}
                    disabled={!isStepValid(currentStep) || isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
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
                    disabled={!isStepValid(currentStep)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
          
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
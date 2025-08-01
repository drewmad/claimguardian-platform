'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield, 
  ArrowLeft, 
  ArrowRight,
  Loader2, 
  AlertCircle, 
  Check, 
  FileText, 
  Brain, 
  Lock,
  User,
  Mail,
  Phone,
  ChevronRight,
  Info
} from 'lucide-react'
import { createBrowserSupabaseClient } from '@claimguardian/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type Step = 
  | 'welcome'
  | 'account-setup'  // Combines personal info + password
  | 'legal-agreements'  // Combines terms + privacy + AI disclaimer + age
  | 'review'
  | 'success'

interface StepConfig {
  id: Step
  title: string
  icon: React.ElementType
  description: string
}

const STEPS: StepConfig[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    icon: Shield,
    description: 'Get started with ClaimGuardian'
  },
  {
    id: 'account-setup',
    title: 'Create Account',
    icon: User,
    description: 'Your account information'
  },
  {
    id: 'legal-agreements',
    title: 'Legal & Privacy',
    icon: FileText,
    description: 'Terms, privacy, and disclosures'
  },
  {
    id: 'review',
    title: 'Review',
    icon: Check,
    description: 'Confirm and submit'
  }
]

export function StreamlinedSignupFlow() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('welcome')
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    // Account Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Legal Agreements
    ageVerified: false,
    termsAccepted: false,
    privacyAccepted: false,
    aiDisclaimerAccepted: false,
    
    // Optional Preferences
    marketingEmails: false,
    smsNotifications: false,
  })
  
  const supabase = createBrowserSupabaseClient()
  
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }
  
  const isStepValid = (step: Step): boolean => {
    switch (step) {
      case 'welcome':
        return true
      case 'account-setup':
        return !!(
          formData.firstName && 
          formData.lastName && 
          formData.email && 
          formData.phone && 
          formData.password && 
          formData.confirmPassword && 
          formData.password === formData.confirmPassword && 
          formData.password.length >= 8
        )
      case 'legal-agreements':
        return formData.ageVerified && 
               formData.termsAccepted && 
               formData.privacyAccepted && 
               formData.aiDisclaimerAccepted
      case 'review':
        return true
      default:
        return false
    }
  }
  
  const getCurrentStepIndex = () => STEPS.findIndex(s => s.id === currentStep)
  
  const goToNextStep = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex < STEPS.length - 1) {
      setCompletedSteps(prev => new Set(prev).add(currentStep))
      setCurrentStep(STEPS[currentIndex + 1].id)
      setError(null)
    }
  }
  
  const goToPreviousStep = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id)
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
        // Store consent data
        await supabase.rpc('link_consent_to_user', {
          p_user_id: signUpData.user.id,
          p_consents: {
            terms_of_service: formData.termsAccepted,
            privacy_policy: formData.privacyAccepted,
            ai_disclaimer: formData.aiDisclaimerAccepted,
            marketing_emails: formData.marketingEmails,
            sms_notifications: formData.smsNotifications,
          },
          p_ip_address: null,
          p_user_agent: navigator.userAgent
        })
        
        setCurrentStep('success')
        setCompletedSteps(prev => new Set(prev).add('review'))
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
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto">
              <Shield className="w-10 h-10 text-blue-600" />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Welcome to ClaimGuardian
              </h2>
              <p className="text-lg text-gray-400 max-w-md mx-auto">
                Let&apos;s get you set up in just 2 minutes. We&apos;ll help you protect your property and maximize your insurance coverage.
              </p>
            </div>
            
            <div className="space-y-3 text-left max-w-sm mx-auto">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300">AI-powered claim assistance</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300">Document organization & tracking</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300">Expert guidance through the process</p>
              </div>
            </div>
          </div>
        )
        
      case 'account-setup':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Create Your Account</h2>
              <p className="text-gray-400">We&apos;ll use this to personalize your experience</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="mt-1 bg-slate-800 border-slate-600 text-white"
                  placeholder="John"
                />
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="mt-1 bg-slate-800 border-slate-600 text-white"
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 bg-slate-800 border-slate-600 text-white"
                placeholder="john@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                className="mt-1 bg-slate-800 border-slate-600 text-white"
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 bg-slate-800 border-slate-600 text-white"
                  placeholder="••••••••"
                />
                {formData.password && formData.password.length < 8 && (
                  <p className="text-xs text-amber-500 mt-1">Must be at least 8 characters</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="mt-1 bg-slate-800 border-slate-600 text-white"
                  placeholder="••••••••"
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords don&apos;t match</p>
                )}
              </div>
            </div>
          </div>
        )
        
      case 'legal-agreements':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Legal Agreements & Privacy</h2>
              <p className="text-gray-400">Please review and accept our policies</p>
            </div>
            
            {/* Age Verification */}
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="age-verification"
                  checked={formData.ageVerified}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, ageVerified: !!checked })}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="age-verification" className="text-base cursor-pointer">
                    I confirm that I am 18 years or older
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    You must be at least 18 years old to use ClaimGuardian
                  </p>
                </div>
              </div>
            </Card>
            
            {/* Terms of Service */}
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, termsAccepted: !!checked })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="terms" className="text-base cursor-pointer">
                    I accept the Terms of Service
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    By accepting, you agree to our{' '}
                    <Link href="/legal/terms-of-service" target="_blank" className="text-blue-400 hover:text-blue-300">
                      Terms of Service
                    </Link>
                  </p>
                </div>
              </div>
            </Card>
            
            {/* Privacy Policy */}
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="privacy"
                  checked={formData.privacyAccepted}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, privacyAccepted: !!checked })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="privacy" className="text-base cursor-pointer">
                    I accept the Privacy Policy
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Learn how we protect your data in our{' '}
                    <Link href="/legal/privacy-policy" target="_blank" className="text-blue-400 hover:text-blue-300">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </div>
            </Card>
            
            {/* AI Disclaimer */}
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="ai-disclaimer"
                  checked={formData.aiDisclaimerAccepted}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, aiDisclaimerAccepted: !!checked })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="ai-disclaimer" className="text-base cursor-pointer flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-500" />
                    I understand AI limitations
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Our AI provides guidance and suggestions, but may occasionally make mistakes. 
                    Always verify important information and consult professionals for legal or insurance advice.
                  </p>
                </div>
              </div>
            </Card>
            
            {/* Optional Communications */}
            <div className="border-t border-slate-700 pt-4">
              <p className="text-sm font-medium text-gray-300 mb-3">Communication Preferences (Optional)</p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="marketing"
                    checked={formData.marketingEmails}
                    onCheckedChange={(checked: boolean) => setFormData({ ...formData, marketingEmails: !!checked })}
                  />
                  <Label htmlFor="marketing" className="text-sm cursor-pointer">
                    Send me helpful tips and updates via email
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="sms"
                    checked={formData.smsNotifications}
                    onCheckedChange={(checked: boolean) => setFormData({ ...formData, smsNotifications: !!checked })}
                  />
                  <Label htmlFor="sms" className="text-sm cursor-pointer">
                    Send me claim status updates via SMS
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Review Your Information</h2>
              <p className="text-gray-400">Please confirm everything looks correct</p>
            </div>
            
            <div className="space-y-4">
              <Card className="p-4 bg-slate-800/50 border-slate-700">
                <h3 className="font-medium text-white mb-3">Account Information</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Name:</dt>
                    <dd className="text-white">{formData.firstName} {formData.lastName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Email:</dt>
                    <dd className="text-white">{formData.email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Phone:</dt>
                    <dd className="text-white">{formData.phone}</dd>
                  </div>
                </dl>
              </Card>
              
              <Card className="p-4 bg-slate-800/50 border-slate-700">
                <h3 className="font-medium text-white mb-3">Agreements Accepted</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-300">Age verification (18+)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-300">Terms of Service</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-300">Privacy Policy</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-300">AI Disclaimer</span>
                  </li>
                  {formData.marketingEmails && (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-gray-300">Email updates</span>
                    </li>
                  )}
                  {formData.smsNotifications && (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-gray-300">SMS notifications</span>
                    </li>
                  )}
                </ul>
              </Card>
            </div>
            
            <Alert className="bg-blue-950 border-blue-800">
              <Info className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200">
                Florida-specific insurance disclosures will be shown when you create your first claim.
              </AlertDescription>
            </Alert>
          </div>
        )
        
      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-600/10 rounded-2xl flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Welcome to ClaimGuardian!
              </h2>
              <p className="text-lg text-gray-400 max-w-md mx-auto">
                Your account has been created successfully. Check your email to verify your account, then you can start protecting your property.
              </p>
            </div>
            
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
        
      default:
        return null
    }
  }
  
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="px-4 py-4 border-b border-slate-800">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-white">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="font-semibold">ClaimGuardian</span>
            </Link>
            
            {currentStep !== 'success' && (
              <Link
                href="/auth/signin"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Already have an account? Sign in
              </Link>
            )}
          </div>
        </header>
        
        {/* Progress Bar */}
        {currentStep !== 'success' && (
          <div className="px-4 py-6 border-b border-slate-800">
            <div className="max-w-2xl mx-auto">
              <Progress 
                value={(getCurrentStepIndex() / (STEPS.length - 1)) * 100} 
                className="h-2"
              />
              <p className="text-sm text-gray-400 mt-2">
                Step {getCurrentStepIndex() + 1} of {STEPS.length}
              </p>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4">
            <div className="grid lg:grid-cols-3 gap-8 h-full">
              {/* Steps Navigation */}
              {currentStep !== 'success' && (
                <div className="lg:col-span-1">
                  <div className="sticky top-0 space-y-2">
                    {STEPS.map((step, index) => {
                      const isActive = step.id === currentStep
                      const isCompleted = completedSteps.has(step.id)
                      const Icon = step.icon
                      
                      return (
                        <div
                          key={step.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg transition-colors",
                            isActive && "bg-slate-800",
                            isCompleted && !isActive && "opacity-50"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            isActive && "bg-blue-600 text-white",
                            isCompleted && !isActive && "bg-green-600/20 text-green-600",
                            !isActive && !isCompleted && "bg-slate-800 text-gray-400"
                          )}>
                            {isCompleted && !isActive ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <Icon className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className={cn(
                              "font-medium text-sm",
                              isActive && "text-white",
                              !isActive && "text-gray-400"
                            )}>
                              {step.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {/* Form Content */}
              <div className={cn(
                "lg:col-span-2",
                currentStep === 'success' && "lg:col-span-3 max-w-2xl mx-auto"
              )}>
                <Card className="p-8 bg-slate-900 border-slate-800">
                  {error && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {renderStepContent()}
                  
                  {/* Navigation Buttons */}
                  {currentStep !== 'success' && (
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={goToPreviousStep}
                        disabled={getCurrentStepIndex() === 0}
                        className="text-gray-400 hover:text-white"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous
                      </Button>
                      
                      {currentStep === 'review' ? (
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
                          onClick={goToNextStep}
                          disabled={!isStepValid(currentStep)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Next
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
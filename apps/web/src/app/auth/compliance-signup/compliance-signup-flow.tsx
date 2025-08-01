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
  MapPin,
  Calendar,
  Scale,
  Users,
  Cookie,
  Bell,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type Step = 
  | 'welcome'
  | 'personal-info'
  | 'account-security'
  | 'age-verification'
  | 'florida-residency'
  | 'legal-agreements'
  | 'ai-disclaimer'
  | 'privacy-preferences'
  | 'florida-disclosures'
  | 'review'
  | 'success'

interface StepConfig {
  id: Step
  title: string
  icon: React.ElementType
  description: string
  required: boolean
}

const STEPS: StepConfig[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    icon: Shield,
    description: 'Get started with ClaimGuardian',
    required: true
  },
  {
    id: 'personal-info',
    title: 'Personal Information',
    icon: User,
    description: 'Basic information we need',
    required: true
  },
  {
    id: 'account-security',
    title: 'Account Security',
    icon: Lock,
    description: 'Create a secure password',
    required: true
  },
  {
    id: 'age-verification',
    title: 'Age Verification',
    icon: Calendar,
    description: 'Confirm you are 18 or older',
    required: true
  },
  {
    id: 'florida-residency',
    title: 'Florida Residency',
    icon: MapPin,
    description: 'Verify service eligibility',
    required: true
  },
  {
    id: 'legal-agreements',
    title: 'Legal Agreements',
    icon: FileText,
    description: 'Terms and Privacy Policy',
    required: true
  },
  {
    id: 'ai-disclaimer',
    title: 'AI Disclaimer',
    icon: Brain,
    description: 'Understanding AI limitations',
    required: true
  },
  {
    id: 'privacy-preferences',
    title: 'Privacy Preferences',
    icon: Cookie,
    description: 'Control your data',
    required: false
  },
  {
    id: 'florida-disclosures',
    title: 'Florida Disclosures',
    icon: Scale,
    description: 'State-specific requirements',
    required: true
  },
  {
    id: 'review',
    title: 'Review & Submit',
    icon: Check,
    description: 'Confirm your information',
    required: true
  }
]

export function ComplianceSignupFlow() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('welcome')
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Account Security
    password: '',
    confirmPassword: '',
    
    // Age Verification
    ageVerified: false,
    
    // Florida Residency
    isFloridaResident: false,
    zipCode: '',
    address: '',
    city: '',
    
    // Legal Agreements
    termsAccepted: false,
    privacyAccepted: false,
    dataProcessingAccepted: false,
    
    // AI Disclaimer
    aiDisclaimerAccepted: false,
    
    // Privacy Preferences
    marketingEmails: false,
    smsNotifications: false,
    analyticsTracking: true,
    
    // Florida Disclosures
    publicAdjusterNotice: false,
    legalAdviceDisclaimer: false,
    insuranceCooperation: false
  })
  
  const supabase = createBrowserSupabaseClient()
  
  const currentStepIndex = STEPS.findIndex(step => step.id === currentStep)
  const progressPercentage = ((currentStepIndex + 1) / STEPS.length) * 100
  
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }
  
  const validateFloridaZip = (zip: string) => {
    const cleanZip = zip.replace(/\D/g, '')
    return /^3[234]\d{3}$/.test(cleanZip)
  }
  
  const canProceedFromStep = (step: Step): boolean => {
    switch (step) {
      case 'welcome':
        return true
      case 'personal-info':
        return !!(formData.firstName && formData.lastName && formData.email && formData.phone)
      case 'account-security':
        return !!(formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 8)
      case 'age-verification':
        return formData.ageVerified
      case 'florida-residency':
        return formData.isFloridaResident && validateFloridaZip(formData.zipCode) && !!formData.address && !!formData.city
      case 'legal-agreements':
        return formData.termsAccepted && formData.privacyAccepted && formData.dataProcessingAccepted
      case 'ai-disclaimer':
        return formData.aiDisclaimerAccepted
      case 'privacy-preferences':
        return true // Optional step
      case 'florida-disclosures':
        return formData.publicAdjusterNotice && formData.legalAdviceDisclaimer && formData.insuranceCooperation
      case 'review':
        return true
      default:
        return false
    }
  }
  
  const goToStep = (step: Step) => {
    // Mark current step as completed if it can be
    if (canProceedFromStep(currentStep)) {
      setCompletedSteps(prev => new Set(prev).add(currentStep))
    }
    setCurrentStep(step)
    setError(null)
  }
  
  const goToNextStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep)
    if (currentIndex < STEPS.length - 1) {
      goToStep(STEPS[currentIndex + 1].id)
    }
  }
  
  const goToPreviousStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep)
    if (currentIndex > 0) {
      goToStep(STEPS[currentIndex - 1].id)
    }
  }
  
  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Create user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            zip_code: formData.zipCode
          }
        }
      })
      
      if (signUpError) throw signUpError
      
      if (signUpData?.user) {
        // Link all consents
        const consents = {
          terms_of_service: formData.termsAccepted,
          privacy_policy: formData.privacyAccepted,
          ai_disclaimer: formData.aiDisclaimerAccepted,
          data_processing: formData.dataProcessingAccepted,
          age_verification: formData.ageVerified,
          public_adjuster_notice: formData.publicAdjusterNotice,
          legal_advice_disclaimer: formData.legalAdviceDisclaimer,
          insurance_cooperation: formData.insuranceCooperation,
          marketing_emails: formData.marketingEmails,
          sms_notifications: formData.smsNotifications,
          analytics_cookies: formData.analyticsTracking
        }
        
        await supabase.rpc('link_consent_to_user', {
          p_user_id: signUpData.user.id,
          p_consents: consents,
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
            <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-12 h-12 text-blue-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Welcome to ClaimGuardian</h2>
              <p className="text-lg text-slate-300 mb-2">
                Your AI-powered insurance claim advocate for Florida property owners
              </p>
              <p className="text-slate-400">
                This signup process ensures we comply with all Florida insurance regulations 
                and protects your data according to the highest standards.
              </p>
            </div>
            <Alert className="bg-blue-900/20 border-blue-800 text-left">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>What to expect:</strong> This process takes about 5 minutes and includes 
                important legal disclosures required by Florida law. Have your Florida address ready.
              </AlertDescription>
            </Alert>
          </div>
        )
        
      case 'personal-info':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Personal Information</h2>
              <p className="text-slate-400">We need this information to create your account and contact you about your claims.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
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
              <p className="text-xs text-slate-500 mt-1">We'll use this for account access and important updates</p>
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
              <p className="text-xs text-slate-500 mt-1">For account recovery and urgent claim notifications</p>
            </div>
          </div>
        )
        
      case 'account-security':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Secure Your Account</h2>
              <p className="text-slate-400">Create a strong password to protect your claim information.</p>
            </div>
            
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
              <div className="mt-2 space-y-1">
                <p className={cn(
                  "text-xs",
                  formData.password.length >= 8 ? "text-green-500" : "text-slate-500"
                )}>
                  <Check className="inline h-3 w-3 mr-1" />
                  At least 8 characters
                </p>
                <p className={cn(
                  "text-xs",
                  /[A-Z]/.test(formData.password) ? "text-green-500" : "text-slate-500"
                )}>
                  <Check className="inline h-3 w-3 mr-1" />
                  One uppercase letter
                </p>
                <p className={cn(
                  "text-xs",
                  /[0-9]/.test(formData.password) ? "text-green-500" : "text-slate-500"
                )}>
                  <Check className="inline h-3 w-3 mr-1" />
                  One number
                </p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={cn(
                  "mt-1 bg-slate-800 border-slate-600 text-white",
                  formData.confirmPassword && formData.password !== formData.confirmPassword && "border-red-500"
                )}
                placeholder="••••••••"
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
          </div>
        )
        
      case 'age-verification':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Age Verification</h2>
              <p className="text-slate-400">
                Federal and state regulations require users to be at least 18 years old.
              </p>
            </div>
            
            <Alert className="bg-yellow-900/20 border-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Why we ask:</strong> Insurance claims involve legal contracts and financial 
                decisions that require adult consent under Florida law.
              </AlertDescription>
            </Alert>
            
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="age-verification"
                  checked={formData.ageVerified}
                  onCheckedChange={(checked) => setFormData({ ...formData, ageVerified: !!checked })}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="age-verification" className="text-base cursor-pointer">
                    I confirm that I am 18 years of age or older
                  </Label>
                  <p className="text-sm text-slate-500 mt-1">
                    By checking this box, you certify that you meet the minimum age requirement 
                    to use ClaimGuardian's services.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'florida-residency':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Florida Residency Verification</h2>
              <p className="text-slate-400">
                ClaimGuardian services are currently available only to Florida residents due to 
                state-specific insurance regulations.
              </p>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="florida-resident"
                  checked={formData.isFloridaResident}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFloridaResident: !!checked })}
                />
                <Label htmlFor="florida-resident" className="cursor-pointer">
                  I am a Florida resident with property in Florida
                </Label>
              </div>
            </div>
            
            {formData.isFloridaResident && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                    placeholder="123 Main Street"
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="mt-1 bg-slate-800 border-slate-600 text-white"
                      placeholder="Miami"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                      className={cn(
                        "mt-1 bg-slate-800 border-slate-600 text-white",
                        formData.zipCode.length === 5 && !validateFloridaZip(formData.zipCode) && "border-red-500"
                      )}
                      placeholder="33139"
                    />
                    {formData.zipCode.length === 5 && !validateFloridaZip(formData.zipCode) && (
                      <p className="text-xs text-red-500 mt-1">Please enter a valid Florida ZIP code</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {!formData.isFloridaResident && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  We're working on expanding to other states. Join our waitlist to be notified 
                  when we launch in your area.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )
        
      case 'legal-agreements':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Legal Agreements</h2>
              <p className="text-slate-400">
                Please review and accept our terms of service and privacy policy.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={formData.termsAccepted}
                    onCheckedChange={(checked) => setFormData({ ...formData, termsAccepted: !!checked })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="terms" className="cursor-pointer">
                      I accept the Terms of Service
                    </Label>
                    <p className="text-sm text-slate-500 mt-1">
                      I agree to ClaimGuardian's{' '}
                      <Link href="/legal/terms-of-service" target="_blank" className="text-blue-400 hover:text-blue-300">
                        Terms of Service
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="privacy"
                    checked={formData.privacyAccepted}
                    onCheckedChange={(checked) => setFormData({ ...formData, privacyAccepted: !!checked })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="privacy" className="cursor-pointer">
                      I accept the Privacy Policy
                    </Label>
                    <p className="text-sm text-slate-500 mt-1">
                      I agree to ClaimGuardian's{' '}
                      <Link href="/legal/privacy-policy" target="_blank" className="text-blue-400 hover:text-blue-300">
                        Privacy Policy
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="data-processing"
                    checked={formData.dataProcessingAccepted}
                    onCheckedChange={(checked) => setFormData({ ...formData, dataProcessingAccepted: !!checked })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="data-processing" className="cursor-pointer">
                      I consent to data processing
                    </Label>
                    <p className="text-sm text-slate-500 mt-1">
                      I consent to ClaimGuardian processing my personal data as described in the 
                      Privacy Policy (GDPR compliance)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'ai-disclaimer':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">AI Tools Disclaimer</h2>
              <p className="text-slate-400">
                Understanding the capabilities and limitations of our AI assistance.
              </p>
            </div>
            
            <Alert className="bg-yellow-900/20 border-yellow-800">
              <Brain className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Our AI tools are designed to assist and guide you, 
                but they are not infallible and should not replace professional judgment.
              </AlertDescription>
            </Alert>
            
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <h3 className="font-semibold text-white mb-3">Please understand that:</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  AI-generated content may contain errors and should be reviewed
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  AI tools provide guidance only, not professional advice
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  You remain responsible for all decisions regarding your claim
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  AI cannot replace licensed professionals (lawyers, adjusters)
                </li>
              </ul>
              
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="ai-disclaimer"
                    checked={formData.aiDisclaimerAccepted}
                    onCheckedChange={(checked) => setFormData({ ...formData, aiDisclaimerAccepted: !!checked })}
                    className="mt-1"
                  />
                  <Label htmlFor="ai-disclaimer" className="cursor-pointer">
                    I understand and acknowledge the AI tools disclaimer
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'privacy-preferences':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Privacy Preferences</h2>
              <p className="text-slate-400">
                Control how we communicate with you and use your data. You can change these anytime.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-white flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Marketing Emails
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Receive tips, updates, and special offers via email
                    </p>
                  </div>
                  <Checkbox
                    checked={formData.marketingEmails}
                    onCheckedChange={(checked) => setFormData({ ...formData, marketingEmails: !!checked })}
                  />
                </div>
              </div>
              
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-white flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      SMS Notifications
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Get text alerts for important claim updates
                    </p>
                  </div>
                  <Checkbox
                    checked={formData.smsNotifications}
                    onCheckedChange={(checked) => setFormData({ ...formData, smsNotifications: !!checked })}
                  />
                </div>
              </div>
              
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-white flex items-center gap-2">
                      <Cookie className="h-4 w-4" />
                      Analytics Tracking
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Help us improve by allowing anonymous usage analytics
                    </p>
                  </div>
                  <Checkbox
                    checked={formData.analyticsTracking}
                    onCheckedChange={(checked) => setFormData({ ...formData, analyticsTracking: !!checked })}
                  />
                </div>
              </div>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Essential cookies and security features are always enabled to protect your account.
              </AlertDescription>
            </Alert>
          </div>
        )
        
      case 'florida-disclosures':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Florida Insurance Disclosures</h2>
              <p className="text-slate-400">
                Florida law requires these specific disclosures before we can assist with insurance claims.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-yellow-900/10 border border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-yellow-500 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-2">Public Adjuster Notice</h3>
                    <p className="text-sm text-slate-300 mb-3">
                      <strong>Florida Statute 626.854:</strong> ClaimGuardian is NOT a licensed 
                      public adjuster. We cannot negotiate with insurance companies on your behalf 
                      for a fee. Our AI tools provide information and document organization only.
                    </p>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="public-adjuster"
                        checked={formData.publicAdjusterNotice}
                        onCheckedChange={(checked) => setFormData({ ...formData, publicAdjusterNotice: !!checked })}
                      />
                      <Label htmlFor="public-adjuster" className="text-sm cursor-pointer">
                        I understand ClaimGuardian is not a public adjuster
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-900/10 border border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Scale className="h-5 w-5 text-yellow-500 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-2">Legal Advice Disclaimer</h3>
                    <p className="text-sm text-slate-300 mb-3">
                      ClaimGuardian does not provide legal advice. For legal matters regarding 
                      your insurance claim, consult with a licensed Florida attorney.
                    </p>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="legal-advice"
                        checked={formData.legalAdviceDisclaimer}
                        onCheckedChange={(checked) => setFormData({ ...formData, legalAdviceDisclaimer: !!checked })}
                      />
                      <Label htmlFor="legal-advice" className="text-sm cursor-pointer">
                        I understand this is not legal advice
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-900/10 border border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-500 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-2">Insurance Cooperation</h3>
                    <p className="text-sm text-slate-300 mb-3">
                      You must continue to cooperate with your insurance company as required by 
                      your policy. Using ClaimGuardian does not change your policy obligations.
                    </p>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="insurance-cooperation"
                        checked={formData.insuranceCooperation}
                        onCheckedChange={(checked) => setFormData({ ...formData, insuranceCooperation: !!checked })}
                      />
                      <Label htmlFor="insurance-cooperation" className="text-sm cursor-pointer">
                        I will cooperate with my insurance company
                      </Label>
                    </div>
                  </div>
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
              <p className="text-slate-400">
                Please confirm everything is correct before creating your account.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </h3>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Name:</dt>
                    <dd className="text-white">{formData.firstName} {formData.lastName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Email:</dt>
                    <dd className="text-white">{formData.email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Phone:</dt>
                    <dd className="text-white">{formData.phone}</dd>
                  </div>
                </dl>
              </div>
              
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Florida Address
                </h3>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Address:</dt>
                    <dd className="text-white">{formData.address}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">City, ZIP:</dt>
                    <dd className="text-white">{formData.city}, FL {formData.zipCode}</dd>
                  </div>
                </dl>
              </div>
              
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Agreements & Consents
                </h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <span className="text-slate-300">Age verified (18+)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <span className="text-slate-300">Terms of Service accepted</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <span className="text-slate-300">Privacy Policy accepted</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <span className="text-slate-300">AI Disclaimer acknowledged</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <span className="text-slate-300">Florida disclosures acknowledged</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )
        
      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Welcome to ClaimGuardian!</h2>
              <p className="text-lg text-slate-300 mb-2">
                Your account has been created successfully.
              </p>
              <p className="text-slate-400">
                Check your email for a verification link, then you can start protecting your property.
              </p>
            </div>
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to Dashboard
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
        
      default:
        return null
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-400" />
            <span className="text-xl font-bold text-white">ClaimGuardian</span>
          </Link>
          
          {currentStep !== 'success' && (
            <Link
              href="/"
              className="text-slate-400 hover:text-slate-300 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Exit
            </Link>
          )}
        </div>
      </header>
      
      {/* Progress Bar */}
      {currentStep !== 'success' && (
        <div className="px-4 py-6 border-b border-slate-800">
          <div className="max-w-6xl mx-auto">
            <Progress value={progressPercentage} className="h-2 bg-slate-800" />
            <p className="text-sm text-slate-400 mt-2">
              Step {currentStepIndex + 1} of {STEPS.length}
            </p>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Steps Navigation */}
            {currentStep !== 'success' && (
              <div className="lg:col-span-1">
                <nav className="space-y-2">
                  {STEPS.map((step, index) => {
                    const Icon = step.icon
                    const isActive = step.id === currentStep
                    const isCompleted = completedSteps.has(step.id)
                    const canNavigate = isCompleted || (index === 0) || completedSteps.has(STEPS[index - 1].id)
                    
                    return (
                      <button
                        key={step.id}
                        onClick={() => canNavigate && goToStep(step.id)}
                        disabled={!canNavigate}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3",
                          isActive && "bg-slate-800 border border-slate-700",
                          !isActive && canNavigate && "hover:bg-slate-800/50",
                          !canNavigate && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                          isActive && "bg-blue-500/20 text-blue-400",
                          isCompleted && !isActive && "bg-green-500/20 text-green-400",
                          !isActive && !isCompleted && "bg-slate-700 text-slate-400"
                        )}>
                          {isCompleted && !isActive ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={cn(
                            "font-medium",
                            isActive ? "text-white" : "text-slate-300"
                          )}>
                            {step.title}
                          </p>
                          <p className="text-xs text-slate-500">{step.description}</p>
                        </div>
                        {step.required && (
                          <span className="text-xs text-red-400">Required</span>
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>
            )}
            
            {/* Step Content */}
            <div className={cn(
              "lg:col-span-2",
              currentStep === 'success' && "lg:col-span-3 max-w-2xl mx-auto"
            )}>
              <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700">
                <div className="p-6 lg:p-8">
                  {renderStepContent()}
                  
                  {/* Navigation Buttons */}
                  {currentStep !== 'success' && (
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goToPreviousStep}
                        disabled={currentStepIndex === 0}
                        className="gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      {currentStep === 'review' ? (
                        <Button
                          onClick={handleSubmit}
                          disabled={isLoading || !canProceedFromStep(currentStep)}
                          className="bg-blue-600 hover:bg-blue-700 gap-2"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Creating Account...
                            </>
                          ) : (
                            <>
                              Create Account
                              <Check className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={goToNextStep}
                          disabled={!canProceedFromStep(currentStep)}
                          className="bg-blue-600 hover:bg-blue-700 gap-2"
                        >
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
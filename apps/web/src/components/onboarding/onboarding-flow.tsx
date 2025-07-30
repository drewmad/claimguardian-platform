'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase/client'
import { 
  Home, Shield, CheckCircle, ArrowRight, 
  User, FileText, Sparkles, X, Loader2,
  Building, MapPin, Phone, Camera,
  UserCheck, Briefcase, Key, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { PropertyWizard } from '@/components/property/property-wizard'
import { saveOnboardingProgress, completeOnboarding, trackOnboardingStep } from '@/actions/onboarding'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  completed: boolean
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'user-profile',
    title: 'Your Profile',
    description: 'Tell us about yourself',
    icon: UserCheck,
    completed: false
  },
  {
    id: 'insurance-status',
    title: 'Insurance Coverage',
    description: 'Your protection needs',
    icon: Shield,
    completed: false
  },
  {
    id: 'quick-start',
    title: 'Get Started',
    description: 'Start using ClaimGuardian',
    icon: Sparkles,
    completed: false
  }
]

type UserType = 'renter' | 'homeowner' | 'landlord' | 'real-estate-professional' | 'insurance-professional' | null

interface OnboardingData {
  // Step 1: User Profile
  userType: UserType
  propertyAddress?: string
  addressVerified?: boolean
  professionalRole?: string
  
  // Step 2: Insurance Status
  hasInsurance: boolean | null
  insuranceProvider?: string
  
  // Completion tracking
  profileComplete: boolean
  insuranceComplete: boolean
  onboardingComplete: boolean
  completedAt?: string
}

export function OnboardingFlow() {
  const { user } = useAuth()
  const router = useRouter()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState(ONBOARDING_STEPS)
  const [showPropertyWizard, setShowPropertyWizard] = useState(false)
  const [preferences, setPreferences] = useState<{ email_notifications?: boolean; sms_notifications?: boolean; marketing_emails?: boolean; dark_mode?: boolean } | null>(null)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    userType: null,
    hasInsurance: null,
    profileComplete: false,
    insuranceComplete: false,
    onboardingComplete: false
  })

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return

      try {
        // Check user preferences
        const { data: prefs, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching preferences:', error)
          return
        }

        if (prefs?.onboarding_completed) {
          // User has completed onboarding, redirect to dashboard
          router.push('/dashboard')
          return
        }

        setPreferences(prefs)

        // Update step completion status
        const updatedSteps = [...ONBOARDING_STEPS]
        
        // Check user profile completion
        if (prefs?.user_type && (prefs?.property_address || prefs?.professional_role)) {
          updatedSteps[0].completed = true
          setOnboardingData(prev => ({
            ...prev,
            userType: prefs.user_type,
            propertyAddress: prefs.property_address,
            professionalRole: prefs.professional_role,
            profileComplete: true
          }))
        }

        // Check insurance status completion
        if (prefs?.has_insurance !== undefined) {
          updatedSteps[1].completed = true
          setOnboardingData(prev => ({
            ...prev,
            hasInsurance: prefs.has_insurance,
            insuranceProvider: prefs.insurance_provider,
            insuranceComplete: true
          }))
        }

        // Check onboarding completion
        if (prefs?.onboarding_completed) {
          updatedSteps[2].completed = true
          setOnboardingData(prev => ({
            ...prev,
            onboardingComplete: true,
            completedAt: prefs.onboarding_completed_at
          }))
        }

        setSteps(updatedSteps)
        
        // Find first incomplete step
        const firstIncomplete = updatedSteps.findIndex(step => !step.completed)
        setCurrentStep(firstIncomplete !== -1 ? firstIncomplete : 0)
        
      } catch (error) {
        console.error('Error checking onboarding status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkOnboardingStatus()
  }, [user, router, supabase])


  const updatePreferences = async (updates: Partial<{ 
    email_notifications?: boolean
    sms_notifications?: boolean
    marketing_emails?: boolean
    dark_mode?: boolean
    onboarding_completed?: boolean
    onboarding_current_step?: string
    onboarding_skipped_at?: string
  }>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setPreferences({ ...preferences, ...updates })
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Failed to save preferences')
    }
  }

  const completeStep = async (stepId: string) => {
    if (!user) return
    
    const stepIndex = steps.findIndex(s => s.id === stepId)
    if (stepIndex === -1) return

    const updatedSteps = [...steps]
    updatedSteps[stepIndex].completed = true
    setSteps(updatedSteps)

    // Save progress to database
    try {
      await saveOnboardingProgress(user.id, onboardingData)
      
      // Track step completion for analytics
      await trackOnboardingStep(
        user.id, 
        stepIndex + 1, 
        stepId
      )
    } catch (error) {
      console.error('Failed to save onboarding progress:', error)
      // Continue anyway - don't block user flow
    }

    // Move to next step or complete onboarding
    if (stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1)
    } else {
      await handleOnboardingComplete()
    }
  }

  const handleOnboardingComplete = async () => {
    if (!user) return
    
    try {
      const finalData = {
        ...onboardingData,
        onboardingComplete: true,
        completedAt: new Date().toISOString()
      }
      
      await completeOnboarding(user.id, finalData)
      
      toast.success('Welcome to ClaimGuardian! Your account is all set up.')
      // Don't redirect here - let QuickStartStep handle navigation
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      toast.error('Failed to save setup. Please try again.')
    }
  }

  const skipOnboarding = async () => {
    if (!user) return
    
    try {
      const skippedData = {
        ...onboardingData,
        onboardingComplete: true,
        completedAt: new Date().toISOString()
      }
      
      await completeOnboarding(user.id, skippedData)
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to skip onboarding:', error)
      // Still redirect even if save fails
      router.push('/dashboard')
    }
  }

  const renderStepContent = () => {
    const step = steps[currentStep]

    switch (step.id) {
      case 'user-profile':
        return (
          <UserProfileStep 
            data={onboardingData}
            onUpdate={setOnboardingData}
            onComplete={() => completeStep('user-profile')} 
          />
        )
        
      case 'insurance-status':
        return (
          <InsuranceStatusStep 
            data={onboardingData}
            onUpdate={setOnboardingData}
            onComplete={() => completeStep('insurance-status')} 
          />
        )
        
      case 'quick-start':
        return (
          <QuickStartStep
            data={onboardingData}
            onComplete={() => completeStep('quick-start')}
          />
        )
        
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Welcome to ClaimGuardian</h1>
            <p className="text-gray-400 mt-2">Let&apos;s set up your account in just a few steps</p>
          </div>
          <button
            onClick={skipOnboarding}
            className="text-gray-400 hover:text-white flex items-center gap-2"
          >
            Skip for now
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${step.completed 
                      ? 'bg-green-500 text-white' 
                      : index === currentStep 
                        ? 'bg-cyan-500 text-white' 
                        : 'bg-gray-700 text-gray-400'
                    }
                  `}
                >
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`
                      w-full h-1 mx-2
                      ${step.completed ? 'bg-green-500' : 'bg-gray-700'}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            {steps.map((step) => (
              <span key={step.id} className="text-gray-400">
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>
      </div>

      {/* Property Wizard Modal */}
      <PropertyWizard
        open={showPropertyWizard}
        onClose={() => setShowPropertyWizard(false)}
        onComplete={() => {
          setShowPropertyWizard(false)
          completeStep('property')
        }}
      />
    </div>
  )
}

// Step Components
function UserProfileStep({ 
  data, 
  onUpdate, 
  onComplete 
}: { 
  data: OnboardingData
  onUpdate: (data: OnboardingData) => void
  onComplete: () => void 
}) {
  const [selectedType, setSelectedType] = useState<UserType>(data.userType)
  const [propertyAddress, setPropertyAddress] = useState(data.propertyAddress || '')
  const [addressVerified, setAddressVerified] = useState(data.addressVerified || false)
  const [professionalRole, setProfessionalRole] = useState(data.professionalRole || '')

  const userTypes = [
    { value: 'renter', label: 'Renter', icon: '🏠' },
    { value: 'homeowner', label: 'Homeowner', icon: '🏡' },
    { value: 'landlord', label: 'Landlord', icon: '🏘️' },
    { value: 'real-estate-professional', label: 'Real Estate Professional', icon: '💼' },
    { value: 'insurance-professional', label: 'Insurance Professional', icon: '💼' }
  ] as const

  const professionalRoles = [
    'Agent/Broker',
    'Claims Adjuster',
    'Attorney',
    'Other'
  ]

  const handleTypeSelect = (type: UserType) => {
    setSelectedType(type)
    // Clear address/role when switching types
    if (type === 'real-estate-professional' || type === 'insurance-professional') {
      setPropertyAddress('')
      setAddressVerified(false)
    } else {
      setProfessionalRole('')
    }
    
    onUpdate({ 
      ...data, 
      userType: type,
      propertyAddress: type !== 'real-estate-professional' && type !== 'insurance-professional' ? propertyAddress : undefined,
      professionalRole: (type === 'real-estate-professional' || type === 'insurance-professional') ? professionalRole : undefined
    })
  }

  const handleAddressChange = (address: string) => {
    setPropertyAddress(address)
    setAddressVerified(false)
    onUpdate({ 
      ...data, 
      propertyAddress: address,
      addressVerified: false
    })
  }

  const handleAddressVerify = async () => {
    // TODO: Implement Google Places API verification
    if (propertyAddress.trim()) {
      setAddressVerified(true)
      onUpdate({ 
        ...data, 
        propertyAddress,
        addressVerified: true
      })
    }
  }

  const handleRoleSelect = (role: string) => {
    setProfessionalRole(role)
    onUpdate({ 
      ...data, 
      professionalRole: role
    })
  }

  const canProceed = selectedType && (
    (selectedType === 'real-estate-professional' || selectedType === 'insurance-professional') 
      ? professionalRole
      : propertyAddress
  )

  const handleContinue = () => {
    if (!canProceed) return
    onUpdate({ ...data, profileComplete: true })
    onComplete()
  }

  const isProfessional = selectedType === 'real-estate-professional' || selectedType === 'insurance-professional'

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to ClaimGuardian</h2>
        <p className="text-gray-400">Let's personalize your experience</p>
      </div>

      <div className="space-y-6">
        {/* User Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            I am a...
          </label>
          <div className="grid grid-cols-1 gap-3">
            {userTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTypeSelect(type.value)}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedType === type.value
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{type.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{type.label}</h3>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedType === type.value
                      ? 'border-cyan-500 bg-cyan-500' 
                      : 'border-gray-500'
                  }`}>
                    {selectedType === type.value && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Property Address (for non-professionals) */}
        {selectedType && !isProfessional && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Property Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={propertyAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder="Start typing your address..."
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
              />
              <Button
                onClick={handleAddressVerify}
                disabled={!propertyAddress.trim()}
                className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 px-6"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Verify
              </Button>
            </div>
            {addressVerified && (
              <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Address verified
              </p>
            )}
          </div>
        )}

        {/* Professional Role (for professionals only) */}
        {selectedType && isProfessional && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              My Role
            </label>
            <div className="grid grid-cols-1 gap-2">
              {professionalRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                    professionalRole === role
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                      : 'border-gray-600 hover:border-gray-500 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{role}</span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      professionalRole === role
                        ? 'border-cyan-400 bg-cyan-400'
                        : 'border-gray-500'
                    }`}>
                      {professionalRole === role && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <div></div>
        <Button
          onClick={handleContinue}
          disabled={!canProceed}
          className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function InsuranceStatusStep({ 
  data,
  onUpdate,
  onComplete 
}: { 
  data: OnboardingData
  onUpdate: (data: OnboardingData) => void
  onComplete: () => void
}) {
  const [hasInsurance, setHasInsurance] = useState<boolean | null>(data.hasInsurance)
  const [insuranceProvider, setInsuranceProvider] = useState(data.insuranceProvider || '')

  const commonProviders = [
    'State Farm',
    'Allstate',
    'Progressive',
    'GEICO',
    'Other'
  ]

  const handleInsuranceStatusChange = (status: boolean) => {
    setHasInsurance(status)
    if (!status) {
      setInsuranceProvider('')
    }
    onUpdate({ 
      ...data, 
      hasInsurance: status,
      insuranceProvider: status ? insuranceProvider : undefined
    })
  }

  const handleProviderChange = (provider: string) => {
    setInsuranceProvider(provider)
    onUpdate({ 
      ...data, 
      insuranceProvider: provider
    })
  }

  const handleContinue = () => {
    onUpdate({ ...data, insuranceComplete: true })
    onComplete()
  }

  const getInsuranceType = () => {
    switch (data.userType) {
      case 'renter': return 'renters'
      case 'homeowner': return 'homeowners'
      case 'landlord': return 'landlord'
      default: return 'property'
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Insurance Coverage</h2>
        <p className="text-gray-400">Help us understand your protection needs</p>
      </div>

      <div className="space-y-6">
        {/* Insurance Status */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-4">
            Do you currently have insurance?
          </label>
          <div className="space-y-3">
            <button
              onClick={() => handleInsuranceStatusChange(true)}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                hasInsurance === true
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">✓</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Yes, I'm covered</h3>
                  <p className="text-gray-400 text-sm">I have {getInsuranceType()} insurance</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  hasInsurance === true
                    ? 'border-green-500 bg-green-500' 
                    : 'border-gray-500'
                }`}>
                  {hasInsurance === true && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </div>
            </button>

            <button
              onClick={() => handleInsuranceStatusChange(false)}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                hasInsurance === false
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">!</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">No, I need coverage</h3>
                  <p className="text-gray-400 text-sm">I don't have insurance yet</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  hasInsurance === false
                    ? 'border-yellow-500 bg-yellow-500' 
                    : 'border-gray-500'
                }`}>
                  {hasInsurance === false && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Insurance Provider (if has insurance) */}
        {hasInsurance === true && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Insurance Provider (Optional)
            </label>
            <div className="flex gap-2">
              <select
                value={insuranceProvider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="">Select or type provider name</option>
                {commonProviders.map((provider) => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>
            <p className="text-gray-400 text-xs mt-2">
              We'll help you maximize your coverage benefits
            </p>
          </div>
        )}

        {/* Helpful message based on selection */}
        {hasInsurance === false && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-blue-400 text-lg">💡</span>
              <div>
                <h4 className="font-medium text-blue-400 mb-1">We'll help you find the right coverage</h4>
                <p className="text-blue-300/80 text-sm">
                  ClaimGuardian can help you find affordable {getInsuranceType()} insurance that fits your needs.
                </p>
              </div>
            </div>
          </div>
        )}

        {hasInsurance === true && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-green-400 text-lg">🎉</span>
              <div>
                <h4 className="font-medium text-green-400 mb-1">Great! We'll help you maximize your coverage</h4>
                <p className="text-green-300/80 text-sm">
                  We'll help you understand your policy and ensure you're getting the most from your coverage.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <div></div>
        <Button
          onClick={handleContinue}
          disabled={hasInsurance === null}
          className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function QuickStartStep({
  data,
  onComplete
}: {
  data: OnboardingData
  onComplete: () => void
}) {
  const router = useRouter()

  const getQuickActions = () => {
    switch (data.userType) {
      case 'renter':
        return [
          {
            title: 'Document Your Belongings',
            description: 'Take photos and track valuables',
            icon: '📸',
            action: '/inventory/add',
            priority: 'high' as const
          },
          {
            title: 'Upload Insurance Policy',
            description: 'Keep your documents safe',
            icon: '📄',
            action: '/documents/upload',
            priority: 'medium' as const
          }
        ]
      case 'homeowner':
        return [
          {
            title: 'Property Walkthrough',
            description: 'Document current condition',
            icon: '🎥',
            action: '/property/walkthrough',
            priority: 'high' as const
          },
          {
            title: 'Set Up Monitoring',
            description: 'Track weather and risks',
            icon: '🌦️',
            action: '/monitoring/setup',
            priority: 'medium' as const
          }
        ]
      case 'landlord':
        return [
          {
            title: 'Add Your Properties',
            description: 'Manage your rental portfolio',
            icon: '🏘️',
            action: '/properties/add',
            priority: 'high' as const
          },
          {
            title: 'Set Up Tenant Portal',
            description: 'Enable tenant reporting',
            icon: '👥',
            action: '/tenants/setup',
            priority: 'medium' as const
          }
        ]
      case 'real-estate-professional':
      case 'insurance-professional':
        return [
          {
            title: 'Add First Client',
            description: 'Start managing properties',
            icon: '👥',
            action: '/clients/add',
            priority: 'high' as const
          },
          {
            title: 'Generate Report Template',
            description: 'Create professional reports',
            icon: '📊',
            action: '/reports/templates',
            priority: 'medium' as const
          }
        ]
      default:
        return []
    }
  }

  const quickActions = getQuickActions()

  const handleActionClick = (action: string) => {
    onComplete() // Mark onboarding as complete
    router.push(action)
  }

  const handleSkipToDashboard = () => {
    onComplete()
    router.push('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
        <p className="text-gray-400">Here's what you can do right now</p>
      </div>

      <div className="space-y-4">
        {quickActions.map((action, index) => {
          const priorityColor = action.priority === 'high' ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-gray-600'
          
          return (
            <button
              key={index}
              onClick={() => handleActionClick(action.action)}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left hover:border-cyan-400 ${priorityColor}`}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl">{action.icon}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{action.title}</h3>
                  <p className="text-gray-400 text-sm">{action.description}</p>
                  {action.priority === 'high' && (
                    <span className="inline-block mt-2 px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-400" />
              </div>
            </button>
          )
        })}
      </div>

      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <h3 className="font-semibold text-green-400 mb-1">Setup Complete!</h3>
        <p className="text-green-300/80 text-sm">
          Your ClaimGuardian account is ready to help protect what matters most to you.
        </p>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={handleSkipToDashboard}
          className="text-gray-400 hover:text-white underline"
        >
          Skip and explore on my own
        </button>
      </div>
    </div>
  )
}


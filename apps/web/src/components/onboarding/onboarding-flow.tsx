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

import {
  UserCheck,
  UserPlus,
  Shield,
  Sparkles,
  X,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { logger } from "@/lib/logger/production-logger"

import { saveOnboardingProgress, completeOnboarding, trackOnboardingStep } from '@/actions/onboarding'
import { useAuth } from '@/components/auth/auth-provider'
import { PropertyWizard } from '@/components/property/property-wizard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useSupabase } from '@/lib/supabase/client'
import { useGooglePlaces } from '@/hooks/use-google-maps'

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

type UserType = 'renter' | 'homeowner' | 'landlord' | 'property-professional' | null

interface OnboardingData {
  // Step 1: User Profile
  userType: UserType
  propertyAddress?: string
  addressVerified?: boolean
  propertyLatitude?: number
  propertyLongitude?: number
  propertyPlaceId?: string
  professionalRole?: string
  landlordUnits?: string

  // Property Details
  propertyStories?: number
  propertyBedrooms?: number
  propertyBathrooms?: number
  roomsPerFloor?: { [floor: number]: number }
  propertyStructures?: string[]

  // Step 2: Insurance Status
  hasPropertyInsurance?: boolean
  hasFloodInsurance?: boolean
  hasOtherInsurance?: boolean
  insuranceProvider?: string
  otherInsuranceType?: string
  otherInsuranceDescription?: string

  // Completion tracking
  profileComplete: boolean
  insuranceComplete: boolean
  onboardingComplete: boolean
  completedAt?: string
}

interface OnboardingFlowProps {
  onComplete?: () => void
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps = {}) {
  const { user } = useAuth()
  const router = useRouter()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState(ONBOARDING_STEPS)
  const [showPropertyWizard, setShowPropertyWizard] = useState(false)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    userType: null,
    hasPropertyInsurance: undefined,
    hasFloodInsurance: undefined,
    hasOtherInsurance: undefined,
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
          logger.error('Error fetching preferences:', error)
          return
        }

        if (prefs?.onboarding_completed) {
          // User has completed onboarding, redirect to dashboard
          router.push('/dashboard')
          return
        }

        // Initialize user preferences if they don't exist
        if (!prefs) {
          await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              onboarding_completed: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
        }



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
        logger.error('Error checking onboarding status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkOnboardingStatus()
  }, [user, router, supabase])


  // const updatePreferences = async (updates: Partial<{
  //   email_notifications?: boolean
  //   sms_notifications?: boolean
  //   marketing_emails?: boolean
  //   dark_mode?: boolean
  //   onboarding_completed?: boolean
  //   onboarding_current_step?: string
  //   onboarding_skipped_at?: string
  // }>) => {
  //   if (!user) return

  //   try {
  //     const { error } = await supabase
  //       .from('user_preferences')
  //       .upsert({
  //         user_id: user.id,
  //         ...updates,
  //         updated_at: new Date().toISOString()
  //       })

  //     if (error) throw error

  //     setPreferences({ ...preferences, ...updates })
  //   } catch (error) {
  //     logger.error('Error updating preferences:', error)
  //     toast.error('Failed to save preferences')
  //   }
  // }

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
      logger.error('Failed to save onboarding progress:', error)
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

      // If we're in modal mode (onComplete provided), close the modal
      // Otherwise let QuickStartStep handle navigation
      if (onComplete && currentStep === steps.length - 1) {
        setTimeout(() => {
          onComplete()
        }, 1500) // Give time for success message
      }
    } catch (error) {
      logger.error('Failed to complete onboarding:', error)
      toast.error('Failed to save setup. Please try again.')
    }
  }

  const skipOnboarding = async () => {
    if (!user) return

    try {
      // Mark onboarding as skipped in user preferences
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          onboarding_completed: true,
          onboarding_skipped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        logger.error('Failed to skip onboarding:', error)
      }

      // Call onComplete callback if provided, otherwise redirect
      if (onComplete) {
        onComplete()
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      logger.error('Failed to skip onboarding:', error)
      // Still handle completion even if save fails
      if (onComplete) {
        onComplete()
      } else {
        router.push('/dashboard')
      }
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
            onBack={currentStep > 0 ? () => setCurrentStep(currentStep - 1) : undefined}
          />
        )

      case 'insurance-status':
        return (
          <InsuranceStatusStep
            data={onboardingData}
            onUpdate={setOnboardingData}
            onComplete={() => completeStep('insurance-status')}
            onBack={() => setCurrentStep(currentStep - 1)}
          />
        )

      case 'quick-start':
        return (
          <QuickStartStep
            data={onboardingData}
            onComplete={() => completeStep('quick-start')}
            onFlowComplete={onComplete}
          />
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-2xl p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
      <div className="p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Welcome to ClaimGuardian</h1>
            <p className="text-text-secondary mt-2">Let's set up your account in just a few steps</p>
          </div>
          <button
            onClick={skipOnboarding}
            className="text-text-secondary hover:text-text-primary flex items-center gap-2 transition-colors duration-200"
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
                    w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm border-2 transition-all duration-300
                    ${step.completed
                      ? 'bg-success border-success text-text-primary shadow-lg'
                      : index === currentStep
                        ? 'bg-accent border-accent-border text-text-primary shadow-lg'
                        : 'bg-panel border-border text-text-secondary'
                    }
                  `}
                >
                  {step.completed ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <UserPlus className="w-6 h-6" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`
                      w-full h-1 mx-4 rounded-full transition-all duration-300
                      ${step.completed ? 'bg-success' : 'bg-border'}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            {steps.map((step) => (
              <span key={step.id} className="text-text-secondary font-medium">
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <Card>
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
  onComplete,
  onBack
}: {
  data: OnboardingData
  onUpdate: (data: OnboardingData) => void
  onComplete: () => void
  onBack?: () => void
}) {
  const [selectedType, setSelectedType] = useState<UserType>(data.userType)
  const [propertyAddress, setPropertyAddress] = useState(data.propertyAddress || '')
  const [addressVerified, setAddressVerified] = useState(data.addressVerified || false)
  const addressInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [professionalRole, setProfessionalRole] = useState(data.professionalRole || '')
  const [landlordUnits, setLandlordUnits] = useState(data.landlordUnits || '')

  // Property details state
  const [propertyStories, setPropertyStories] = useState(data.propertyStories || 1)
  const [propertyBedrooms, setPropertyBedrooms] = useState(data.propertyBedrooms || 1)
  const [propertyBathrooms, setPropertyBathrooms] = useState(data.propertyBathrooms || 1)
  const [propertyStructures, setPropertyStructures] = useState<string[]>(data.propertyStructures || [])
  const [roomsPerFloor, setRoomsPerFloor] = useState<Record<number, number>>(data.roomsPerFloor || { 1: 4 })

  // Use centralized Google Maps hook
  const { isLoaded: isGoogleLoaded, isLoading: isGoogleLoading, error: googleError } = useGooglePlaces()

  // Computed values - declare early to avoid hoisting issues
  const isProfessional = selectedType === 'property-professional'
  const isLandlord = selectedType === 'landlord'

  const userTypes = [
    { value: 'renter', label: 'Renter', icon: '🏠', description: 'I rent my home' },
    { value: 'homeowner', label: 'Homeowner', icon: '🏡', description: 'I own my home' },
    { value: 'landlord', label: 'Landlord', icon: '🏘️', description: 'I rent properties to others' },
    { value: 'property-professional', label: 'Property Professional', icon: '💼', description: 'I work in real estate/property' }
  ] as const

  const professionalRoles = [
    'Real Estate Agent',
    'Property Manager',
    'Insurance Agent',
    'Public Adjuster',
    'Contractor',
    'Attorney',
    'Other'
  ]

  const landlordUnitRanges = [
    '1-2 units',
    '3-5 units',
    '6-10 units',
    '11-25 units',
    '26-50 units',
    '50+ units'
  ]

  const handleTypeSelect = (type: UserType) => {
    setSelectedType(type)
    // Clear fields when switching types
    if (type === 'property-professional') {
      setPropertyAddress('')
      setAddressVerified(false)
      setLandlordUnits('')
    } else if (type === 'landlord') {
      setProfessionalRole('')
    } else {
      setProfessionalRole('')
      setLandlordUnits('')
    }

    onUpdate({
      ...data,
      userType: type,
      propertyAddress: type !== 'property-professional' ? propertyAddress : undefined,
      professionalRole: type === 'property-professional' ? professionalRole : undefined,
      landlordUnits: type === 'landlord' ? landlordUnits : undefined
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

  // Google Maps loading is now handled by useGooglePlaces hook

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!isGoogleLoaded || !addressInputRef.current || autocompleteRef.current) return

    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          componentRestrictions: { country: 'us' },
          fields: ['address_components', 'formatted_address', 'geometry', 'place_id'],
          types: ['address']
        }
      )

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace()
        if (place?.formatted_address && place.geometry?.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()

          setPropertyAddress(place.formatted_address)
          setAddressVerified(true)
          onUpdate({
            ...data,
            propertyAddress: place.formatted_address,
            addressVerified: true,
            propertyLatitude: lat,
            propertyLongitude: lng,
            propertyPlaceId: (place as { place_id?: string }).place_id
          })

          logger.info('Address coordinates:', { lat, lng, placeId: (place as { place_id?: string }).place_id })
        }
      })
    } catch (error) {
      logger.warn('Google Places API not available:', error)
    }

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners?.(autocompleteRef.current)
      }
    }
  }, [isGoogleLoaded, selectedType, data, onUpdate])

  // Remove manual verification - only Google autocomplete can verify

  const handleRoleSelect = (role: string) => {
    setProfessionalRole(role)
    onUpdate({
      ...data,
      professionalRole: role
    })
  }

  const handleUnitsSelect = (units: string) => {
    setLandlordUnits(units)
    onUpdate({
      ...data,
      landlordUnits: units
    })
  }

  const handlePropertyDetailsUpdate = () => {
    onUpdate({
      ...data,
      propertyStories,
      propertyBedrooms,
      propertyBathrooms,
      propertyStructures
    })
  }

  const toggleStructure = (structure: string) => {
    const newStructures = propertyStructures.includes(structure)
      ? propertyStructures.filter(s => s !== structure)
      : [...propertyStructures, structure]
    setPropertyStructures(newStructures)
    onUpdate({
      ...data,
      propertyStructures: newStructures
    })
  }

  const canProceed = selectedType && (
    selectedType === 'property-professional'
      ? professionalRole
      : selectedType === 'landlord'
        ? (addressVerified && landlordUnits)
        : addressVerified
  )

  const needsPropertyDetails = selectedType && !isProfessional && addressVerified
  const commonStructures = [
    // Climate Control
    'Central Air/Heat', 'Window AC Units', 'Heat Pump', 'Radiant Floor Heating',
    // Outdoor Features
    'Pool', 'Hot Tub/Spa', 'Deck/Patio', 'Outdoor Kitchen', 'Fire Pit',
    'Pergola/Gazebo', 'Shed/Storage Building', 'Greenhouse',
    // Parking & Access
    'Attached Garage', 'Detached Garage', 'Carport', 'Circular Driveway',
    'RV/Boat Parking', 'Workshop',
    // Security & Safety
    'Security System', 'Security Cameras', 'Smart Doorbell', 'Gate/Gated Entry',
    'Fence', 'Storm Shutters', 'Impact Windows', 'Safe Room',
    // Utilities & Energy
    'Solar Panels', 'Generator', 'Well Water', 'Septic System',
    'Water Softener', 'Sump Pump', 'French Drain',
    // Interior Features
    'Fireplace', 'Wet Bar', 'Home Theater', 'Elevator',
    'Central Vacuum', 'Intercom System', 'Smart Home System',
    // Roofing & Structure
    'Metal Roof', 'Tile Roof', 'New Roof (< 5 years)', 'Skylights'
  ]

  const handleContinue = () => {
    if (!canProceed) return
    onUpdate({ ...data, profileComplete: true })
    onComplete()
  }

  return (
    <Card>
      <CardContent className="p-8">
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-text-primary mb-3">Welcome to ClaimGuardian</h2>
            <p className="text-text-secondary text-lg">Let's personalize your experience</p>
          </div>

          <div className="space-y-6">
            {/* User Type Selection */}
            <div>
              <label className="block text-lg font-semibold text-text-primary mb-4">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-4">
                {userTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleTypeSelect(type.value)}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 text-center aspect-square flex flex-col items-center justify-center backdrop-blur-sm hover:scale-105 hover:shadow-xl ${
                      selectedType === type.value
                        ? 'border-accent-border bg-accent/20 shadow-lg'
                        : 'border-border hover:border-accent-border bg-panel/30'
                    }`}
                  >
                    <span className="text-5xl mb-3">{type.icon}</span>
                    <h3 className="text-xl font-bold text-text-primary mb-2">{type.label}</h3>
                    <p className="text-sm text-text-secondary text-center mb-3">{type.description}</p>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      selectedType === type.value
                        ? 'border-accent bg-accent shadow-lg'
                        : 'border-border'
                    }`}>
                      {selectedType === type.value && <div className="w-2 h-2 bg-text-primary rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Property Address (for non-professionals) */}
            {selectedType && !isProfessional && (
              <div>
                <label className="block text-lg font-semibold text-text-primary mb-3">
                  Property Address
                </label>
                <div className="relative">
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={propertyAddress}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    placeholder={isGoogleLoaded ? "Start typing and select from dropdown..." : isGoogleLoading ? "Loading address verification..." : "Enter address manually"}
                    className="w-full px-4 py-3 bg-panel/30 backdrop-blur-sm border border-border rounded-lg text-text-primary placeholder-text-secondary focus:border-accent-border focus:outline-none transition-all duration-200"
                    disabled={addressVerified}
                  />
                  {isGoogleLoading && (
                    <p className="text-warning text-xs mt-2">
                      Address verification is loading...
                    </p>
                  )}
                  {googleError && (
                    <p className="text-gray-400 text-xs mt-2">
                      Manual entry only ({googleError})
                    </p>
                  )}
                  {isGoogleLoaded && !addressVerified && propertyAddress && (
                    <p className="text-warning text-xs mt-2">
                      Please select an address from the dropdown to verify
                    </p>
                  )}
                </div>
                {addressVerified && (
                  <p className="text-success text-sm mt-3 flex items-center gap-2 font-medium">
                    <CheckCircle className="w-5 h-5" />
                    Address verified
                  </p>
                )}
              </div>
            )}

            {/* Professional Role (for professionals only) */}
            {selectedType && isProfessional && (
              <div>
                <label className="block text-lg font-semibold text-text-primary mb-4">
                  My Role
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {professionalRoles.map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleSelect(role)}
                      className={`p-4 rounded-lg border text-left transition-all duration-300 backdrop-blur-sm hover:scale-[1.02] ${
                        professionalRole === role
                          ? 'border-accent-border bg-accent/20 text-text-primary shadow-lg'
                          : 'border-border hover:border-accent-border text-text-primary bg-panel/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{role}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          professionalRole === role
                            ? 'border-accent bg-accent shadow-lg'
                            : 'border-border'
                        }`}>
                          {professionalRole === role && (
                            <div className="w-2 h-2 bg-text-primary rounded-full" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Landlord Units (for landlords only) */}
            {selectedType && isLandlord && (
              <div>
                <label className="block text-lg font-semibold text-text-primary mb-4">
                  How many units do you manage?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {landlordUnitRanges.map((range) => (
                    <button
                      key={range}
                      onClick={() => handleUnitsSelect(range)}
                      className={`p-4 rounded-lg border text-center transition-all duration-300 backdrop-blur-sm hover:scale-105 ${
                        landlordUnits === range
                          ? 'border-accent-border bg-accent/20 text-text-primary shadow-lg'
                          : 'border-border hover:border-accent-border text-text-primary bg-panel/30'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-semibold">{range}</span>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-2 transition-all duration-200 ${
                          landlordUnits === range
                            ? 'border-accent bg-accent shadow-lg'
                            : 'border-border'
                        }`}>
                          {landlordUnits === range && (
                            <div className="w-1.5 h-1.5 bg-text-primary rounded-full" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Property Details (for homeowners/landlords with verified address) */}
            {needsPropertyDetails && (
              <div className="border-t border-border pt-8 mt-8">
                <h3 className="text-2xl font-bold text-text-primary mb-6">Tell us about your property</h3>

                {/* Property basics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-3">
                      Stories
                    </label>
                    <select
                      value={propertyStories}
                      onChange={(e) => {
                        const stories = parseInt(e.target.value)
                        setPropertyStories(stories)
                        handlePropertyDetailsUpdate()
                      }}
                      className="w-full px-4 py-3 bg-panel/30 backdrop-blur-sm border border-border rounded-lg text-text-primary focus:border-accent-border focus:outline-none transition-all duration-200"
                    >
                      {[1, 2, 3, 4].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-3">
                      Bedrooms
                    </label>
                    <select
                      value={propertyBedrooms}
                      onChange={(e) => {
                        const bedrooms = parseInt(e.target.value)
                        setPropertyBedrooms(bedrooms)
                        handlePropertyDetailsUpdate()
                      }}
                      className="w-full px-4 py-3 bg-panel/30 backdrop-blur-sm border border-border rounded-lg text-text-primary focus:border-accent-border focus:outline-none transition-all duration-200"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-3">
                      Bathrooms
                    </label>
                    <select
                      value={propertyBathrooms}
                      onChange={(e) => {
                        const bathrooms = parseFloat(e.target.value)
                        setPropertyBathrooms(bathrooms)
                        handlePropertyDetailsUpdate()
                      }}
                      className="w-full px-4 py-3 bg-panel/30 backdrop-blur-sm border border-border rounded-lg text-text-primary focus:border-accent-border focus:outline-none transition-all duration-200"
                    >
                      <option value={1}>1</option>
                      {[1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rooms per floor */}
                {propertyStories > 0 && (
                  <div className="mb-6">
                    <label className="block text-lg font-semibold text-text-primary mb-4">
                      Rooms per floor
                    </label>
                    <div className="space-y-3">
                      {Array.from({ length: propertyStories }, (_, i) => i + 1).map((floor) => (
                        <div key={floor} className="flex items-center gap-4">
                          <span className="text-text-secondary w-24">
                            {floor === 1 ? '1st Floor' : floor === 2 ? '2nd Floor' : floor === 3 ? '3rd Floor' : `${floor}th Floor`}
                          </span>
                          <select
                            value={roomsPerFloor[floor] || 4}
                            onChange={(e) => {
                              const rooms = parseInt(e.target.value)
                              setRoomsPerFloor(prev => ({ ...prev, [floor]: rooms }))
                              onUpdate({
                                ...data,
                                roomsPerFloor: { ...roomsPerFloor, [floor]: rooms }
                              })
                            }}
                            className="flex-1 px-4 py-2 bg-panel/30 backdrop-blur-sm border border-border rounded-lg text-text-primary focus:border-accent-border focus:outline-none transition-all duration-200"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                              <option key={num} value={num}>{num} rooms</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Property structures */}
                <div>
                  <label className="block text-lg font-semibold text-text-primary mb-4">
                    Property Features (select all that apply)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto p-1">
                    {commonStructures.map((structure) => (
                      <button
                        key={structure}
                        onClick={() => toggleStructure(structure)}
                        className={`p-2.5 rounded-lg border text-xs transition-all duration-300 backdrop-blur-sm hover:scale-[1.02] ${
                          propertyStructures.includes(structure)
                            ? 'border-accent-border bg-accent/20 text-text-primary shadow-lg'
                            : 'border-border hover:border-accent-border text-text-primary bg-panel/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-left">{structure}</span>
                          <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                            propertyStructures.includes(structure)
                              ? 'border-accent bg-accent shadow-lg'
                              : 'border-border'
                          }`}>
                            {propertyStructures.includes(structure) && (
                              <div className="w-1.5 h-1.5 bg-text-primary rounded" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-8">
            {onBack ? (
              <Button
                onClick={onBack}
                variant="outline"
              >
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Back
              </Button>
            ) : (
              <div></div>
            )}
            <Button
              onClick={handleContinue}
              disabled={!canProceed}
              size="lg"
            >
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function InsuranceStatusStep({
  data,
  onUpdate,
  onComplete,
  onBack
}: {
  data: OnboardingData
  onUpdate: (data: OnboardingData) => void
  onComplete: () => void
  onBack?: () => void
}) {
  const [hasPropertyInsurance, setHasPropertyInsurance] = useState<boolean | null>(data.hasPropertyInsurance || null)
  const [hasFloodInsurance, setHasFloodInsurance] = useState<boolean | null>(data.hasFloodInsurance || null)
  const [hasOtherInsurance, setHasOtherInsurance] = useState<boolean | null>(data.hasOtherInsurance || null)
  const [insuranceProvider, setInsuranceProvider] = useState(data.insuranceProvider || '')
  const [otherInsuranceType, setOtherInsuranceType] = useState(data.otherInsuranceType || '')
  const [currentStep, setCurrentStep] = useState<number>(0)

  // const commonProviders = [
  //   'State Farm',
  //   'Allstate',
  //   'Progressive',
  //   'GEICO',
  //   'Other'
  // ]

  const handlePropertyInsuranceChange = (status: boolean) => {
    setHasPropertyInsurance(status)
    onUpdate({
      ...data,
      hasPropertyInsurance: status
    })
  }

  const handleFloodInsuranceChange = (status: boolean) => {
    setHasFloodInsurance(status)
    onUpdate({
      ...data,
      hasFloodInsurance: status
    })
  }

  const handleOtherInsuranceChange = (status: boolean) => {
    setHasOtherInsurance(status)
    if (!status) {
      setOtherInsuranceType('')
    }
    onUpdate({
      ...data,
      hasOtherInsurance: status,
      otherInsuranceType: status ? otherInsuranceType : ''
    })
  }

  const handleOtherInsuranceTypeChange = (type: string) => {
    setOtherInsuranceType(type)
    onUpdate({
      ...data,
      otherInsuranceType: type
    })
    if (currentStep < getSteps().length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleProviderChange = (provider: string) => {
    setInsuranceProvider(provider)
    onUpdate({
      ...data,
      insuranceProvider: provider
    })
  }

  const handleContinue = () => {
    if (currentStep < getSteps().length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onUpdate({ ...data, insuranceComplete: true })
      onComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getSteps = () => {
    const steps = []

    if (data.userType === 'homeowner' || data.userType === 'landlord') {
      steps.push('property', 'flood', 'other')
    } else {
      steps.push('renters')
    }

    return steps
  }

  const getCurrentStepData = () => {
    const steps = getSteps()
    const stepType = steps[currentStep]

    switch (stepType) {
      case 'property':
        return {
          title: 'Property Insurance',
          subtitle: 'Do you have property/homeowners insurance?',
          value: hasPropertyInsurance,
          onChange: handlePropertyInsuranceChange
        }
      case 'flood':
        return {
          title: 'Flood Insurance',
          subtitle: 'Do you have flood insurance?',
          value: hasFloodInsurance,
          onChange: handleFloodInsuranceChange
        }
      case 'other':
        return {
          title: 'Other Insurance',
          subtitle: 'Do you have any other property-related insurance?',
          value: hasOtherInsurance,
          onChange: handleOtherInsuranceChange
        }
      case 'renters':
        return {
          title: 'Renters Insurance',
          subtitle: 'Do you have renters insurance?',
          value: hasPropertyInsurance,
          onChange: handlePropertyInsuranceChange
        }
      default:
        return null
    }
  }

  const canProceed = () => {
    const stepData = getCurrentStepData()
    return stepData && stepData.value !== null
  }

  const stepData = getCurrentStepData()
  const steps = getSteps()

  if (!stepData) return null

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-text-primary mb-3">Insurance Coverage</h2>
        <p className="text-text-secondary text-lg">Step {currentStep + 1} of {steps.length}</p>
      </div>

      <div className="space-y-6">
        {/* Current Insurance Step */}
        <div>
          <label className="block text-xl font-semibold text-text-primary mb-6 text-center">
            {stepData.subtitle}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => stepData.onChange(true)}
              className={`p-8 rounded-xl border-2 transition-all duration-300 text-center backdrop-blur-sm hover:scale-105 hover:shadow-xl ${
                stepData.value === true
                  ? 'border-success bg-success/20 shadow-lg'
                  : 'border-border hover:border-accent-border bg-panel/30'
              }`}
            >
              <span className="text-6xl mb-4 block">✓</span>
              <h3 className="text-xl font-bold text-text-primary mb-3">Yes</h3>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mx-auto transition-all duration-200 ${
                stepData.value === true
                  ? 'border-success bg-success shadow-lg'
                  : 'border-border'
              }`}>
                {stepData.value === true && <div className="w-2.5 h-2.5 bg-text-primary rounded-full" />}
              </div>
            </button>

            <button
              onClick={() => stepData.onChange(false)}
              className={`p-8 rounded-xl border-2 transition-all duration-300 text-center backdrop-blur-sm hover:scale-105 hover:shadow-xl ${
                stepData.value === false
                  ? 'border-error bg-error/20 shadow-lg'
                  : 'border-border hover:border-accent-border bg-panel/30'
              }`}
            >
              <span className="text-6xl mb-4 block">✗</span>
              <h3 className="text-xl font-bold text-text-primary mb-3">No</h3>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mx-auto transition-all duration-200 ${
                stepData.value === false
                  ? 'border-error bg-error shadow-lg'
                  : 'border-border'
              }`}>
                {stepData.value === false && <div className="w-2.5 h-2.5 bg-text-primary rounded-full" />}
              </div>
            </button>
          </div>
        </div>

        {/* Insurance Provider Input */}
        {hasPropertyInsurance && currentStep === 0 && (
          <div className="pt-4">
            <label className="block text-lg font-semibold text-text-primary mb-3">
              Insurance Provider (Optional)
            </label>
            <input
              type="text"
              value={insuranceProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
              placeholder="e.g., State Farm, Allstate..."
              className="w-full px-4 py-3 bg-panel/30 backdrop-blur-sm border border-border rounded-lg text-text-primary focus:border-accent-border focus:outline-none transition-all duration-200"
            />
          </div>
        )}

        {/* Other Insurance Type Dropdown */}
        {hasOtherInsurance && currentStep === 2 && (
          <div className="pt-4 space-y-4">
            <label className="block text-lg font-semibold text-text-primary mb-3">
              What type of property-related insurance?
            </label>
            <select
              value={otherInsuranceType}
              onChange={(e) => handleOtherInsuranceTypeChange(e.target.value)}
              className="w-full px-4 py-3 bg-panel/30 backdrop-blur-sm border border-border rounded-lg text-text-primary focus:border-accent-border focus:outline-none transition-all duration-200"
            >
              <option value="">Select insurance type...</option>
              <option value="windstorm">Windstorm Insurance</option>
              <option value="earthquake">Earthquake Insurance</option>
              <option value="sinkhole">Sinkhole Insurance</option>
              <option value="ordinance-law">Ordinance or Law Coverage</option>
              <option value="umbrella">Umbrella Policy</option>
              <option value="equipment-breakdown">Equipment Breakdown Coverage</option>
              <option value="service-line">Service Line Coverage</option>
              <option value="identity-theft">Identity Theft Protection</option>
              <option value="water-backup">Water Backup Coverage</option>
              <option value="cyber">Cyber Insurance</option>
              <option value="vacant-property">Vacant Property Insurance</option>
              <option value="loss-assessment">Loss Assessment Coverage</option>
              <option value="other">Other (please specify)</option>
            </select>
            {otherInsuranceType === 'other' && (
              <textarea
                className="w-full px-4 py-3 bg-panel/30 backdrop-blur-sm border border-border rounded-lg text-text-primary focus:border-accent-border focus:outline-none transition-all duration-200"
                rows={2}
                placeholder="Please describe your insurance type..."
                value={data.otherInsuranceDescription || ''}
                onChange={(e) => onUpdate({ ...data, otherInsuranceDescription: e.target.value })}
              />
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-8">
        {currentStep > 0 ? (
          <Button
            onClick={handleBack}
            variant="outline"
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Back
          </Button>
        ) : onBack ? (
          <Button
            onClick={onBack}
            variant="outline"
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Back to Profile
          </Button>
        ) : (
          <div></div>
        )}
        <Button
          onClick={handleContinue}
          disabled={!canProceed()}
          size="lg"
        >
          {currentStep < steps.length - 1 ? 'Next' : 'Continue'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function QuickStartStep({
  data,
  onComplete,
  onFlowComplete
}: {
  data: OnboardingData
  onComplete: () => void
  onFlowComplete?: () => void
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
      case 'property-professional':
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
    if (onFlowComplete) {
      onFlowComplete() // Close the modal if in modal mode
    } else {
      router.push(action)
    }
  }

  const handleSkipToDashboard = () => {
    onComplete() // Mark onboarding as complete
    if (onFlowComplete) {
      onFlowComplete() // Close the modal if in modal mode
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-text-primary mb-3">You're all set!</h2>
        <p className="text-text-secondary text-lg">Here's what you can do right now</p>
      </div>

      <div className="space-y-4">
        {quickActions.map((action, index) => {
          const priorityColor = action.priority === 'high' ? 'border-accent/30 bg-accent/10' : 'border-border bg-panel/30'

          return (
            <button
              key={index}
              onClick={() => handleActionClick(action.action)}
              className={`w-full p-6 rounded-xl border-2 transition-all duration-300 text-left hover:border-accent-border backdrop-blur-sm hover:scale-[1.02] hover:shadow-xl ${priorityColor}`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{action.icon}</span>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-text-primary mb-2">{action.title}</h3>
                  <p className="text-text-secondary text-sm">{action.description}</p>
                  {action.priority === 'high' && (
                    <span className="inline-block mt-3 px-3 py-1 bg-accent/20 text-accent text-xs rounded-full font-medium">
                      Recommended
                    </span>
                  )}
                </div>
                <ArrowRight className="w-6 h-6 text-text-secondary group-hover:text-accent transition-colors duration-200" />
              </div>
            </button>
          )
        })}
      </div>

      <div className="bg-success/10 border border-success/20 rounded-xl p-6 text-center backdrop-blur-sm">
        <CheckCircle className="w-10 h-10 text-success mx-auto mb-3" />
        <h3 className="font-bold text-success mb-2 text-lg">Setup Complete!</h3>
        <p className="text-success/80 text-sm">
          Your ClaimGuardian account is ready to help protect what matters most to you.
        </p>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={handleSkipToDashboard}
          className="text-text-secondary hover:text-text-primary underline transition-colors duration-200 font-medium"
        >
          Skip and explore on my own
        </button>
      </div>
    </div>
  )
}

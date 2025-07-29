'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase/client'
import { 
  Home, Shield, CheckCircle, ArrowRight, 
  User, FileText, Sparkles, X, Loader2 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { PropertyWizard } from '@/components/property/property-wizard'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  completed: boolean
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Add your personal information for a personalized experience',
    icon: User,
    completed: false
  },
  {
    id: 'property',
    title: 'Add Your Property',
    description: 'Set up your primary residence to start protecting it',
    icon: Home,
    completed: false
  },
  {
    id: 'insurance',
    title: 'Add Insurance Policy',
    description: 'Upload your homeowners insurance for complete coverage tracking',
    icon: Shield,
    completed: false
  },
  {
    id: 'ai-setup',
    title: 'Enable AI Features',
    description: 'Set up AI-powered tools to maximize your protection',
    icon: Sparkles,
    completed: false
  }
]

export function OnboardingFlow() {
  const { user } = useAuth()
  const router = useRouter()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState(ONBOARDING_STEPS)
  const [showPropertyWizard, setShowPropertyWizard] = useState(false)
  const [preferences, setPreferences] = useState<{ email_notifications?: boolean; sms_notifications?: boolean; marketing_emails?: boolean; dark_mode?: boolean } | null>(null)

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
        
        // Check profile completion
        if (user.user_metadata?.firstName && user.user_metadata?.lastName) {
          updatedSteps[0].completed = true
        }

        // Check property setup
        if (prefs?.has_primary_property) {
          updatedSteps[1].completed = true
        }

        // Check insurance setup
        if (prefs?.has_insurance_policy) {
          updatedSteps[2].completed = true
        }

        // Check AI setup
        if (prefs?.ai_features_enabled !== undefined) {
          updatedSteps[3].completed = true
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
    const stepIndex = steps.findIndex(s => s.id === stepId)
    if (stepIndex === -1) return

    const updatedSteps = [...steps]
    updatedSteps[stepIndex].completed = true
    setSteps(updatedSteps)

    // Update preferences based on step
    const updates: Record<string, unknown> = {
      onboarding_current_step: stepId
    }

    switch (stepId) {
      case 'property':
        updates.has_primary_property = true
        updates.property_setup_completed = true
        break
      case 'insurance':
        updates.has_insurance_policy = true
        updates.insurance_setup_completed = true
        break
      case 'ai-setup':
        updates.ai_features_enabled = true
        break
    }

    await updatePreferences(updates)

    // Move to next step or complete onboarding
    if (stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1)
    } else {
      await completeOnboarding()
    }
  }

  const completeOnboarding = async () => {
    await updatePreferences({
      onboarding_completed: true,
      onboarding_current_step: 'completed'
    })

    toast.success('Welcome to ClaimGuardian! Your account is all set up.')
    router.push('/dashboard')
  }

  const skipOnboarding = async () => {
    await updatePreferences({
      onboarding_completed: true,
      onboarding_skipped_at: new Date().toISOString()
    })

    router.push('/dashboard')
  }

  const renderStepContent = () => {
    const step = steps[currentStep]

    switch (step.id) {
      case 'profile':
        return <ProfileStep onComplete={() => completeStep('profile')} />
        
      case 'property':
        return (
          <PropertyStep 
            onComplete={() => completeStep('property')}
            onOpenWizard={() => setShowPropertyWizard(true)}
          />
        )
        
      case 'insurance':
        return <InsuranceStep onComplete={() => completeStep('insurance')} />
        
      case 'ai-setup':
        return <AISetupStep onComplete={() => completeStep('ai-setup')} />
        
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
function ProfileStep({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.user_metadata?.firstName || '',
    lastName: user?.user_metadata?.lastName || '',
    phone: user?.user_metadata?.phone || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone
        }
      })

      if (error) throw error

      toast.success('Profile updated successfully')
      onComplete()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h2>
        <p className="text-gray-400">Tell us a bit about yourself</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(555) 123-4567"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

function PropertyStep({ 
  onComplete, 
  onOpenWizard 
}: { 
  onComplete: () => void
  onOpenWizard: () => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Add Your Property</h2>
        <p className="text-gray-400">Let&apos;s set up your primary residence</p>
      </div>

      <div className="bg-gray-700/50 rounded-lg p-6 text-center">
        <Home className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Set up your first property
        </h3>
        <p className="text-gray-400 mb-6">
          Add your home details to start tracking maintenance, inventory, and insurance coverage
        </p>
        <Button
          onClick={onOpenWizard}
          className="bg-cyan-500 hover:bg-cyan-600"
        >
          <Home className="w-4 h-4 mr-2" />
          Add Property
        </Button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onComplete}
          className="text-gray-400 hover:text-white"
        >
          I&apos;ll do this later
        </button>
      </div>
    </div>
  )
}

function InsuranceStep({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Add Insurance Policy</h2>
        <p className="text-gray-400">Upload your homeowners insurance for complete protection</p>
      </div>

      <div className="bg-gray-700/50 rounded-lg p-6 text-center">
        <Shield className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Upload your policy documents
        </h3>
        <p className="text-gray-400 mb-6">
          We&apos;ll extract key information and help you understand your coverage
        </p>
        <Button
          onClick={() => {
            toast.info('Insurance upload feature coming soon!')
            onComplete()
          }}
          className="bg-cyan-500 hover:bg-cyan-600"
        >
          <FileText className="w-4 h-4 mr-2" />
          Upload Policy
        </Button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onComplete}
          className="text-gray-400 hover:text-white"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

function AISetupStep({ onComplete }: { onComplete: () => void }) {
  const [preferences, setPreferences] = useState({
    enableAI: true,
    preferredModel: 'openai'
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Enable AI Features</h2>
        <p className="text-gray-400">Unlock powerful AI tools to protect your property</p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="font-medium text-white">Enable AI Features</p>
                <p className="text-sm text-gray-400">
                  Get AI-powered damage analysis, policy insights, and more
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.enableAI}
              onChange={(e) => setPreferences({ ...preferences, enableAI: e.target.checked })}
              className="w-5 h-5 text-cyan-500"
            />
          </label>
        </div>

        {preferences.enableAI && (
          <div className="bg-gray-700/50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Preferred AI Model
            </label>
            <select
              value={preferences.preferredModel}
              onChange={(e) => setPreferences({ ...preferences, preferredModel: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="openai">OpenAI GPT-4</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={onComplete}
          className="bg-cyan-500 hover:bg-cyan-600"
        >
          Complete Setup
          <CheckCircle className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
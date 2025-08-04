'use client'

import { createBrowserSupabaseClient } from '@claimguardian/db'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle,
  DollarSign,
  Home,
  Loader2,
  Shield
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { logger } from "@/lib/logger/production-logger"

import { EvidenceManager } from './evidence-manager'
import { logger } from "@/lib/logger/production-logger"

import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { logger } from "@/lib/logger/production-logger"


interface ClaimData {
  // Step 1: Basic Info
  damageType: string
  dateOfLoss: string
  timeOfLoss: string
  discoveredDate: string
  
  // Step 2: Property & Location
  propertyId?: string
  propertyAddress: string
  damageLocation: string[] // Multiple rooms/areas
  
  // Step 3: Damage Details
  description: string
  causeOfLoss: string
  immediateActions: string
  emergencyRepairs: boolean
  emergencyRepairCost?: number
  
  // Step 4: Insurance Info
  policyId?: string
  policyNumber: string
  insuranceCompany: string
  reportedToInsurance: boolean
  reportedDate?: string
  claimNumber?: string
  adjusterName?: string
  adjusterPhone?: string
  adjusterEmail?: string
  
  // Step 5: Documentation
  photos: File[]
  documents: File[]
  
  // Step 6: Review & Estimate
  estimatedCost?: number
  deductible?: number
  notes?: string
}

interface WizardStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'When did the damage occur?',
    icon: Calendar
  },
  {
    id: 'property-location',
    title: 'Property & Location',
    description: 'Where did the damage occur?',
    icon: Home
  },
  {
    id: 'damage-details',
    title: 'Damage Details',
    description: 'Describe what happened',
    icon: AlertCircle
  },
  {
    id: 'insurance-info',
    title: 'Insurance Information',
    description: 'Your policy and adjuster details',
    icon: Shield
  },
  {
    id: 'documentation',
    title: 'Documentation',
    description: 'Upload photos and documents',
    icon: Camera
  },
  {
    id: 'review-submit',
    title: 'Review & Submit',
    description: 'Review your claim details',
    icon: CheckCircle
  }
]

const DAMAGE_TYPES = [
  'Water Damage',
  'Wind Damage',
  'Fire Damage',
  'Hail Damage',
  'Theft/Vandalism',
  'Lightning Strike',
  'Tree Damage',
  'Flood Damage',
  'Mold Damage',
  'Other'
]

const PROPERTY_AREAS = [
  'Kitchen',
  'Living Room',
  'Master Bedroom',
  'Bedroom',
  'Bathroom',
  'Basement',
  'Attic',
  'Garage',
  'Roof',
  'Exterior',
  'Foundation',
  'HVAC System',
  'Plumbing System',
  'Electrical System'
]

interface ClaimCreationWizardProps {
  propertyId?: string
  onComplete?: (claimId: string) => void
  onCancel?: () => void
}

export function ClaimCreationWizard({ propertyId, onComplete, onCancel }: ClaimCreationWizardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [claimData, setClaimData] = useState<Partial<ClaimData>>({
    propertyId,
    damageLocation: [],
    photos: [],
    documents: [],
    emergencyRepairs: false,
    reportedToInsurance: false
  })

  const updateClaimData = (updates: Partial<ClaimData>) => {
    setClaimData(prev => ({ ...prev, ...updates }))
  }

  const handleNext = async () => {
    // Validate current step
    if (!validateStep(currentStep)) {
      return
    }

    // Save draft after each step
    if (currentStep < WIZARD_STEPS.length - 1) {
      await saveDraft()
      setCurrentStep(prev => prev + 1)
    } else {
      // Submit claim on final step
      await submitClaim()
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Info
        if (!claimData.damageType || !claimData.dateOfLoss) {
          toast.error('Please fill in all required fields')
          return false
        }
        break
      case 1: // Property & Location
        if (!claimData.propertyAddress || claimData.damageLocation?.length === 0) {
          toast.error('Please select property and damage locations')
          return false
        }
        break
      case 2: // Damage Details
        if (!claimData.description || !claimData.causeOfLoss) {
          toast.error('Please provide damage description and cause')
          return false
        }
        break
      case 3: // Insurance Info
        if (!claimData.policyNumber || !claimData.insuranceCompany) {
          toast.error('Please provide insurance information')
          return false
        }
        break
    }
    return true
  }

  const saveDraft = async () => {
    setSaving(true)
    try {
      const supabase = createBrowserSupabaseClient()
      
      // Save claim draft
      const { error } = await supabase
        .from('claims')
        .upsert({
          user_id: user!.id,
          property_id: claimData.propertyId,
          status: 'draft',
          damage_type: claimData.damageType,
          date_of_loss: claimData.dateOfLoss,
          description: claimData.description,
          metadata: claimData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      
      toast.success('Draft saved')
    } catch (error) {
      logger.error('Error saving draft:', error)
      toast.error('Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const submitClaim = async () => {
    setLoading(true)
    try {
      const supabase = createBrowserSupabaseClient()
      
      // Create claim
      const { data: claim, error: claimError } = await supabase
        .from('claims')
        .insert({
          user_id: user!.id,
          property_id: claimData.propertyId,
          claim_number: `CLM-${Date.now()}`, // Generate unique claim number
          status: 'submitted',
          damage_type: claimData.damageType,
          date_of_loss: claimData.dateOfLoss,
          description: claimData.description,
          cause_of_loss: claimData.causeOfLoss,
          estimated_amount: claimData.estimatedCost,
          deductible: claimData.deductible,
          policy_number: claimData.policyNumber,
          insurance_company: claimData.insuranceCompany,
          adjuster_name: claimData.adjusterName,
          adjuster_phone: claimData.adjusterPhone,
          adjuster_email: claimData.adjusterEmail,
          metadata: claimData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (claimError) throw claimError

      // Upload photos
      if (claimData.photos && claimData.photos.length > 0) {
        for (const photo of claimData.photos) {
          const fileName = `${claim.id}/${Date.now()}-${photo.name}`
          const { error: uploadError } = await supabase.storage
            .from('claim-photos')
            .upload(fileName, photo)

          if (uploadError) {
            logger.error('Photo upload error:', uploadError)
          }
        }
      }

      toast.success('Claim submitted successfully!')
      
      if (onComplete) {
        onComplete(claim.id)
      } else {
        router.push(`/dashboard/claims/${claim.id}`)
      }
    } catch (error) {
      logger.error('Error submitting claim:', error)
      toast.error('Failed to submit claim')
    } finally {
      setLoading(false)
    }
  }


  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="damage-type">Type of Damage*</Label>
              <Select
                value={claimData.damageType}
                onValueChange={(value) => updateClaimData({ damageType: value })}
              >
                <SelectTrigger id="damage-type">
                  <SelectValue placeholder="Select damage type" />
                </SelectTrigger>
                <SelectContent>
                  {DAMAGE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-of-loss">Date of Loss*</Label>
                <Input
                  id="date-of-loss"
                  type="date"
                  value={claimData.dateOfLoss}
                  onChange={(e) => updateClaimData({ dateOfLoss: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="time-of-loss">Time of Loss</Label>
                <Input
                  id="time-of-loss"
                  type="time"
                  value={claimData.timeOfLoss}
                  onChange={(e) => updateClaimData({ timeOfLoss: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="discovered-date">When did you discover the damage?</Label>
              <Input
                id="discovered-date"
                type="date"
                value={claimData.discoveredDate}
                onChange={(e) => updateClaimData({ discoveredDate: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        )

      case 1: // Property & Location
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="property-address">Property Address*</Label>
              <Input
                id="property-address"
                value={claimData.propertyAddress || ''}
                onChange={(e) => updateClaimData({ propertyAddress: e.target.value })}
                placeholder="123 Main St, City, State ZIP"
              />
            </div>

            <div>
              <Label>Areas Affected*</Label>
              <p className="text-sm text-gray-400 mb-3">Select all areas with damage</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PROPERTY_AREAS.map(area => (
                  <label
                    key={area}
                    className={`
                      flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                      ${claimData.damageLocation?.includes(area)
                        ? 'bg-blue-600/20 border-blue-600 text-blue-400'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={claimData.damageLocation?.includes(area)}
                      onChange={(e) => {
                        const locations = claimData.damageLocation || []
                        if (e.target.checked) {
                          updateClaimData({ damageLocation: [...locations, area] })
                        } else {
                          updateClaimData({ 
                            damageLocation: locations.filter(l => l !== area) 
                          })
                        }
                      }}
                    />
                    <span className="text-sm">{area}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 2: // Damage Details
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="description">Describe the Damage*</Label>
              <Textarea
                id="description"
                value={claimData.description || ''}
                onChange={(e) => updateClaimData({ description: e.target.value })}
                placeholder="Please provide a detailed description of the damage..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="cause">What caused the damage?*</Label>
              <Input
                id="cause"
                value={claimData.causeOfLoss || ''}
                onChange={(e) => updateClaimData({ causeOfLoss: e.target.value })}
                placeholder="e.g., Burst pipe, tree fell on roof, etc."
              />
            </div>

            <div>
              <Label htmlFor="immediate-actions">Immediate Actions Taken</Label>
              <Textarea
                id="immediate-actions"
                value={claimData.immediateActions || ''}
                onChange={(e) => updateClaimData({ immediateActions: e.target.value })}
                placeholder="What did you do to prevent further damage?"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={claimData.emergencyRepairs}
                  onChange={(e) => updateClaimData({ emergencyRepairs: e.target.checked })}
                  className="rounded border-gray-600"
                />
                <span>Emergency repairs were made</span>
              </label>

              {claimData.emergencyRepairs && (
                <div className="ml-6">
                  <Label htmlFor="repair-cost">Emergency Repair Cost</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="repair-cost"
                      type="number"
                      value={claimData.emergencyRepairCost || ''}
                      onChange={(e) => updateClaimData({ 
                        emergencyRepairCost: parseFloat(e.target.value) 
                      })}
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 3: // Insurance Info
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="policy-number">Policy Number*</Label>
                <Input
                  id="policy-number"
                  value={claimData.policyNumber || ''}
                  onChange={(e) => updateClaimData({ policyNumber: e.target.value })}
                  placeholder="HO-12345678"
                />
              </div>
              <div>
                <Label htmlFor="insurance-company">Insurance Company*</Label>
                <Input
                  id="insurance-company"
                  value={claimData.insuranceCompany || ''}
                  onChange={(e) => updateClaimData({ insuranceCompany: e.target.value })}
                  placeholder="State Farm, Allstate, etc."
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={claimData.reportedToInsurance}
                  onChange={(e) => updateClaimData({ reportedToInsurance: e.target.checked })}
                  className="rounded border-gray-600"
                />
                <span>I have already reported this to my insurance company</span>
              </label>

              {claimData.reportedToInsurance && (
                <div className="ml-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reported-date">Date Reported</Label>
                      <Input
                        id="reported-date"
                        type="date"
                        value={claimData.reportedDate || ''}
                        onChange={(e) => updateClaimData({ reportedDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="claim-number">Claim Number</Label>
                      <Input
                        id="claim-number"
                        value={claimData.claimNumber || ''}
                        onChange={(e) => updateClaimData({ claimNumber: e.target.value })}
                        placeholder="CLM-123456"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Adjuster Information</h4>
                    <div className="space-y-3">
                      <Input
                        placeholder="Adjuster Name"
                        value={claimData.adjusterName || ''}
                        onChange={(e) => updateClaimData({ adjusterName: e.target.value })}
                      />
                      <Input
                        placeholder="Adjuster Phone"
                        value={claimData.adjusterPhone || ''}
                        onChange={(e) => updateClaimData({ adjusterPhone: e.target.value })}
                      />
                      <Input
                        placeholder="Adjuster Email"
                        type="email"
                        value={claimData.adjusterEmail || ''}
                        onChange={(e) => updateClaimData({ adjusterEmail: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 4: // Documentation
        return (
          <div className="space-y-6">
            <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-400">
                Upload all evidence to support your claim. You can add more files later from the claim details page.
              </p>
            </div>
            
            {/* Use the EvidenceManager component for a better experience */}
            <EvidenceManager 
              claimId={`draft-${Date.now()}`} // Temporary ID for draft
              onUpdate={(evidence) => {
                // Note: This is a simplified conversion - in production you'd handle this better
                logger.info('Evidence updated:', evidence)
              }}
            />
          </div>
        )

      case 5: // Review & Submit
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg mb-4">Claim Summary</h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Damage Type:</span>
                  <p className="font-medium">{claimData.damageType}</p>
                </div>
                <div>
                  <span className="text-gray-400">Date of Loss:</span>
                  <p className="font-medium">{claimData.dateOfLoss}</p>
                </div>
                <div>
                  <span className="text-gray-400">Property:</span>
                  <p className="font-medium">{claimData.propertyAddress}</p>
                </div>
                <div>
                  <span className="text-gray-400">Insurance:</span>
                  <p className="font-medium">{claimData.insuranceCompany}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <span className="text-gray-400 text-sm">Affected Areas:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {claimData.damageLocation?.map(location => (
                    <span key={location} className="px-3 py-1 bg-gray-700 rounded-full text-sm">
                      {location}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <span className="text-gray-400 text-sm">Description:</span>
                <p className="mt-1 text-sm">{claimData.description}</p>
              </div>

              <div className="pt-4 border-t border-gray-700 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Photos:</span>
                  <p className="font-medium">{claimData.photos?.length || 0} uploaded</p>
                </div>
                <div>
                  <span className="text-gray-400">Documents:</span>
                  <p className="font-medium">{claimData.documents?.length || 0} uploaded</p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="estimated-cost">Estimated Repair Cost</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="estimated-cost"
                  type="number"
                  value={claimData.estimatedCost || ''}
                  onChange={(e) => updateClaimData({ 
                    estimatedCost: parseFloat(e.target.value) 
                  })}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={claimData.notes || ''}
                onChange={(e) => updateClaimData({ notes: e.target.value })}
                placeholder="Any additional information..."
                rows={3}
              />
            </div>

            <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-4">
              <p className="text-sm text-blue-400">
                By submitting this claim, you confirm that all information provided is accurate 
                and complete to the best of your knowledge.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={onCancel || (() => router.back())}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Create New Claim</h1>
          <p className="text-gray-400">
            Follow the steps below to document and submit your insurance claim
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={(currentStep + 1) / WIZARD_STEPS.length * 100} className="mb-4" />
          <div className="flex justify-between">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-gray-600'
                  }`}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2
                    ${isActive ? 'bg-blue-600' : isCompleted ? 'bg-green-600' : 'bg-gray-800'}
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs text-center hidden md:block">{step.title}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>{WIZARD_STEPS[currentStep].title}</CardTitle>
            <CardDescription>{WIZARD_STEPS[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="border-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-3">
            {currentStep < WIZARD_STEPS.length - 1 && (
              <Button
                variant="outline"
                onClick={saveDraft}
                disabled={saving}
                className="border-gray-700"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save Draft'
                )}
              </Button>
            )}

            <Button
              onClick={handleNext}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : currentStep === WIZARD_STEPS.length - 1 ? (
                <>
                  Submit Claim
                  <CheckCircle className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
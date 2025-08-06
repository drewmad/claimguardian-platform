/**
 * @fileMetadata
 * @purpose "Streamlined property setup wizard for new user onboarding"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion", "lucide-react"]
 * @exports ["PropertySetupWizard"]
 * @complexity high
 * @tags ["onboarding", "wizard", "property", "setup"]
 * @status stable
 */
'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, MapPin, Shield, DollarSign, Camera, FileText,
  ChevronRight, ChevronLeft, Check, AlertCircle, Upload,
  Building, Briefcase, Info, Sparkles, ArrowRight,
  X, Loader2, CheckCircle, Plus, Trash2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { useAuth } from '@/components/auth/auth-provider'
import { useSupabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'

interface PropertyData {
  // Basic Info
  propertyType: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | ''
  propertyName: string
  yearBuilt: string
  squareFootage: string
  bedrooms: string
  bathrooms: string
  
  // Location
  street: string
  city: string
  state: string
  zipCode: string
  
  // Value & Insurance
  estimatedValue: string
  purchasePrice: string
  purchaseDate: string
  insuranceCarrier: string
  policyNumber: string
  coverageAmount: string
  
  // Documents
  photos: File[]
  documents: File[]
}

interface WizardStep {
  id: string
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  fields: string[]
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'property-type',
    title: 'Property Type',
    subtitle: 'Let\'s start with the basics',
    icon: Home,
    fields: ['propertyType', 'propertyName', 'yearBuilt', 'squareFootage', 'bedrooms', 'bathrooms']
  },
  {
    id: 'location',
    title: 'Location',
    subtitle: 'Where is your property located?',
    icon: MapPin,
    fields: ['street', 'city', 'state', 'zipCode']
  },
  {
    id: 'value',
    title: 'Value & Purchase',
    subtitle: 'Help us understand your investment',
    icon: DollarSign,
    fields: ['estimatedValue', 'purchasePrice', 'purchaseDate']
  },
  {
    id: 'insurance',
    title: 'Insurance',
    subtitle: 'Current coverage information',
    icon: Shield,
    fields: ['insuranceCarrier', 'policyNumber', 'coverageAmount']
  },
  {
    id: 'documents',
    title: 'Photos & Documents',
    subtitle: 'Upload property photos and insurance documents',
    icon: Camera,
    fields: ['photos', 'documents']
  }
]

interface PropertySetupWizardProps {
  onComplete?: (data: PropertyData) => void
  onSkip?: () => void
  isModal?: boolean
}

export function PropertySetupWizard({ onComplete, onSkip, isModal = true }: PropertySetupWizardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { supabase } = useSupabase()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  
  const [propertyData, setPropertyData] = useState<PropertyData>({
    propertyType: '',
    propertyName: '',
    yearBuilt: '',
    squareFootage: '',
    bedrooms: '',
    bathrooms: '',
    street: '',
    city: '',
    state: 'FL', // Default to Florida
    zipCode: '',
    estimatedValue: '',
    purchasePrice: '',
    purchaseDate: '',
    insuranceCarrier: '',
    policyNumber: '',
    coverageAmount: '',
    photos: [],
    documents: []
  })

  const currentStepData = WIZARD_STEPS[currentStep]
  const StepIcon = currentStepData.icon
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100

  // Validate current step fields
  const validateStep = useCallback((stepIndex: number): boolean => {
    const step = WIZARD_STEPS[stepIndex]
    const stepErrors: Record<string, string> = {}
    let isValid = true

    step.fields.forEach(field => {
      if (field === 'photos' || field === 'documents') {
        // Optional file fields
        return
      }

      const value = propertyData[field as keyof PropertyData]
      
      // Required field validation
      if (!value || value.toString().trim() === '') {
        if (field !== 'propertyName') { // Property name is optional
          stepErrors[field] = 'This field is required'
          isValid = false
        }
      }

      // Specific field validation
      if (field === 'zipCode' && value) {
        if (!/^\d{5}(-\d{4})?$/.test(value.toString())) {
          stepErrors[field] = 'Invalid ZIP code format'
          isValid = false
        }
      }

      if (field === 'yearBuilt' && value) {
        const year = parseInt(value.toString())
        const currentYear = new Date().getFullYear()
        if (year < 1800 || year > currentYear) {
          stepErrors[field] = `Year must be between 1800 and ${currentYear}`
          isValid = false
        }
      }
    })

    setErrors(stepErrors)
    return isValid
  }, [propertyData])

  const handleNext = () => {
    // Mark all fields in current step as touched
    const touchedFields: Record<string, boolean> = { ...touched }
    WIZARD_STEPS[currentStep].fields.forEach(field => {
      touchedFields[field] = true
    })
    setTouched(touchedFields)

    if (!validateStep(currentStep)) {
      toast.error('Please fill in all required fields')
      return
    }

    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
      logger.track('property_wizard_step', { step: WIZARD_STEPS[currentStep + 1].id })
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setPropertyData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleFileUpload = (field: 'photos' | 'documents', files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    setPropertyData(prev => ({
      ...prev,
      [field]: [...prev[field], ...fileArray]
    }))

    toast.success(`${fileArray.length} file(s) added`)
  }

  const handleRemoveFile = (field: 'photos' | 'documents', index: number) => {
    setPropertyData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    logger.track('property_wizard_submit_started')

    try {
      // Create property in database
      const { data: property, error } = await supabase
        .from('properties')
        .insert({
          user_id: user?.id,
          name: propertyData.propertyName || `${propertyData.street} Property`,
          property_type: propertyData.propertyType,
          address: {
            street: propertyData.street,
            city: propertyData.city,
            state: propertyData.state,
            zip: propertyData.zipCode
          },
          details: {
            year_built: parseInt(propertyData.yearBuilt),
            square_footage: parseInt(propertyData.squareFootage),
            bedrooms: parseInt(propertyData.bedrooms),
            bathrooms: parseFloat(propertyData.bathrooms),
            estimated_value: parseFloat(propertyData.estimatedValue),
            purchase_price: parseFloat(propertyData.purchasePrice),
            purchase_date: propertyData.purchaseDate
          },
          insurance: {
            carrier: propertyData.insuranceCarrier,
            policy_number: propertyData.policyNumber,
            coverage_amount: parseFloat(propertyData.coverageAmount)
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Upload photos if any
      if (propertyData.photos.length > 0) {
        for (const photo of propertyData.photos) {
          const fileName = `${user?.id}/${property.id}/photos/${Date.now()}-${photo.name}`
          await supabase.storage
            .from('property-photos')
            .upload(fileName, photo)
        }
      }

      // Upload documents if any
      if (propertyData.documents.length > 0) {
        for (const doc of propertyData.documents) {
          const fileName = `${user?.id}/${property.id}/documents/${Date.now()}-${doc.name}`
          await supabase.storage
            .from('property-documents')
            .upload(fileName, doc)
        }
      }

      logger.track('property_wizard_completed', { propertyId: property.id })
      toast.success('Property added successfully!')
      
      onComplete?.(propertyData)
      
      // Navigate to property page
      router.push(`/dashboard/property/${property.id}`)
    } catch (error) {
      logger.error('Failed to create property', { error })
      toast.error('Failed to save property. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Property Type
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { value: 'single_family', label: 'Single Family', icon: Home },
                { value: 'condo', label: 'Condo', icon: Building },
                { value: 'townhouse', label: 'Townhouse', icon: Home },
                { value: 'multi_family', label: 'Multi-Family', icon: Building }
              ].map(type => (
                <button
                  key={type.value}
                  onClick={() => handleFieldChange('propertyType', type.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    propertyData.propertyType === type.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                  }`}
                >
                  <type.icon className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-300">{type.label}</p>
                </button>
              ))}
            </div>

            {errors.propertyType && touched.propertyType && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.propertyType}
              </p>
            )}

            <div>
              <Label htmlFor="propertyName">Property Name (Optional)</Label>
              <Input
                id="propertyName"
                placeholder="e.g., Beach House, Main Residence"
                value={propertyData.propertyName}
                onChange={(e) => handleFieldChange('propertyName', e.target.value)}
                className="bg-gray-700 border-gray-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="yearBuilt">Year Built*</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  placeholder="e.g., 2005"
                  value={propertyData.yearBuilt}
                  onChange={(e) => handleFieldChange('yearBuilt', e.target.value)}
                  className={`bg-gray-700 border-gray-600 ${
                    errors.yearBuilt && touched.yearBuilt ? 'border-red-500' : ''
                  }`}
                />
                {errors.yearBuilt && touched.yearBuilt && (
                  <p className="text-red-400 text-xs mt-1">{errors.yearBuilt}</p>
                )}
              </div>

              <div>
                <Label htmlFor="squareFootage">Square Footage*</Label>
                <Input
                  id="squareFootage"
                  type="number"
                  placeholder="e.g., 2500"
                  value={propertyData.squareFootage}
                  onChange={(e) => handleFieldChange('squareFootage', e.target.value)}
                  className={`bg-gray-700 border-gray-600 ${
                    errors.squareFootage && touched.squareFootage ? 'border-red-500' : ''
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedrooms">Bedrooms*</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  placeholder="e.g., 3"
                  value={propertyData.bedrooms}
                  onChange={(e) => handleFieldChange('bedrooms', e.target.value)}
                  className={`bg-gray-700 border-gray-600 ${
                    errors.bedrooms && touched.bedrooms ? 'border-red-500' : ''
                  }`}
                />
              </div>

              <div>
                <Label htmlFor="bathrooms">Bathrooms*</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  step="0.5"
                  placeholder="e.g., 2.5"
                  value={propertyData.bathrooms}
                  onChange={(e) => handleFieldChange('bathrooms', e.target.value)}
                  className={`bg-gray-700 border-gray-600 ${
                    errors.bathrooms && touched.bathrooms ? 'border-red-500' : ''
                  }`}
                />
              </div>
            </div>
          </div>
        )

      case 1: // Location
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="street">Street Address*</Label>
              <Input
                id="street"
                placeholder="123 Main Street"
                value={propertyData.street}
                onChange={(e) => handleFieldChange('street', e.target.value)}
                className={`bg-gray-700 border-gray-600 ${
                  errors.street && touched.street ? 'border-red-500' : ''
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City*</Label>
                <Input
                  id="city"
                  placeholder="Miami"
                  value={propertyData.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  className={`bg-gray-700 border-gray-600 ${
                    errors.city && touched.city ? 'border-red-500' : ''
                  }`}
                />
              </div>

              <div>
                <Label htmlFor="state">State*</Label>
                <Input
                  id="state"
                  value={propertyData.state}
                  disabled
                  className="bg-gray-800 border-gray-700 text-gray-400"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="zipCode">ZIP Code*</Label>
              <Input
                id="zipCode"
                placeholder="33101"
                value={propertyData.zipCode}
                onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                className={`bg-gray-700 border-gray-600 ${
                  errors.zipCode && touched.zipCode ? 'border-red-500' : ''
                }`}
              />
              {errors.zipCode && touched.zipCode && (
                <p className="text-red-400 text-xs mt-1">{errors.zipCode}</p>
              )}
            </div>

            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-300 font-medium">Florida Properties Only</p>
                  <p className="text-xs text-gray-400 mt-1">
                    ClaimGuardian currently serves Florida property owners. 
                    We'll be expanding to other states soon!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 2: // Value
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="estimatedValue">Current Estimated Value*</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <Input
                  id="estimatedValue"
                  type="number"
                  placeholder="500000"
                  value={propertyData.estimatedValue}
                  onChange={(e) => handleFieldChange('estimatedValue', e.target.value)}
                  className={`bg-gray-700 border-gray-600 pl-8 ${
                    errors.estimatedValue && touched.estimatedValue ? 'border-red-500' : ''
                  }`}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="purchasePrice">Purchase Price*</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <Input
                  id="purchasePrice"
                  type="number"
                  placeholder="450000"
                  value={propertyData.purchasePrice}
                  onChange={(e) => handleFieldChange('purchasePrice', e.target.value)}
                  className={`bg-gray-700 border-gray-600 pl-8 ${
                    errors.purchasePrice && touched.purchasePrice ? 'border-red-500' : ''
                  }`}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="purchaseDate">Purchase Date*</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={propertyData.purchaseDate}
                onChange={(e) => handleFieldChange('purchaseDate', e.target.value)}
                className={`bg-gray-700 border-gray-600 ${
                  errors.purchaseDate && touched.purchaseDate ? 'border-red-500' : ''
                }`}
              />
            </div>

            {propertyData.estimatedValue && propertyData.purchasePrice && (
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Appreciation</span>
                  <span className="text-lg font-semibold text-green-400">
                    +${(parseFloat(propertyData.estimatedValue) - parseFloat(propertyData.purchasePrice)).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-400">ROI</span>
                  <span className="text-lg font-semibold text-green-400">
                    {(
                      ((parseFloat(propertyData.estimatedValue) - parseFloat(propertyData.purchasePrice)) /
                        parseFloat(propertyData.purchasePrice)) *
                      100
                    ).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )

      case 3: // Insurance
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="insuranceCarrier">Insurance Carrier*</Label>
              <Input
                id="insuranceCarrier"
                placeholder="e.g., State Farm, Allstate"
                value={propertyData.insuranceCarrier}
                onChange={(e) => handleFieldChange('insuranceCarrier', e.target.value)}
                className={`bg-gray-700 border-gray-600 ${
                  errors.insuranceCarrier && touched.insuranceCarrier ? 'border-red-500' : ''
                }`}
              />
            </div>

            <div>
              <Label htmlFor="policyNumber">Policy Number*</Label>
              <Input
                id="policyNumber"
                placeholder="e.g., HO-123456789"
                value={propertyData.policyNumber}
                onChange={(e) => handleFieldChange('policyNumber', e.target.value)}
                className={`bg-gray-700 border-gray-600 ${
                  errors.policyNumber && touched.policyNumber ? 'border-red-500' : ''
                }`}
              />
            </div>

            <div>
              <Label htmlFor="coverageAmount">Coverage Amount*</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <Input
                  id="coverageAmount"
                  type="number"
                  placeholder="500000"
                  value={propertyData.coverageAmount}
                  onChange={(e) => handleFieldChange('coverageAmount', e.target.value)}
                  className={`bg-gray-700 border-gray-600 pl-8 ${
                    errors.coverageAmount && touched.coverageAmount ? 'border-red-500' : ''
                  }`}
                />
              </div>
            </div>

            {propertyData.estimatedValue && propertyData.coverageAmount && (
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Coverage Ratio</span>
                  <span className={`text-lg font-semibold ${
                    parseFloat(propertyData.coverageAmount) >= parseFloat(propertyData.estimatedValue)
                      ? 'text-green-400'
                      : 'text-yellow-400'
                  }`}>
                    {((parseFloat(propertyData.coverageAmount) / parseFloat(propertyData.estimatedValue)) * 100).toFixed(0)}%
                  </span>
                </div>
                {parseFloat(propertyData.coverageAmount) < parseFloat(propertyData.estimatedValue) && (
                  <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Consider increasing coverage to match property value
                  </p>
                )}
              </div>
            )}
          </div>
        )

      case 4: // Documents
        return (
          <div className="space-y-6">
            {/* Photos Upload */}
            <div>
              <Label>Property Photos</Label>
              <div className="mt-2">
                <label className="block">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload('photos', e.target.files)}
                    className="hidden"
                  />
                  <div className="p-8 border-2 border-dashed border-gray-600 rounded-lg hover:border-gray-500 transition-colors cursor-pointer bg-gray-700/30">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-300">Click to upload photos</p>
                      <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                    </div>
                  </div>
                </label>
              </div>
              
              {propertyData.photos.length > 0 && (
                <div className="mt-3 space-y-2">
                  {propertyData.photos.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                      <span className="text-sm text-gray-300 truncate">{file.name}</span>
                      <button
                        onClick={() => handleRemoveFile('photos', index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Documents Upload */}
            <div>
              <Label>Insurance Documents</Label>
              <div className="mt-2">
                <label className="block">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('documents', e.target.files)}
                    className="hidden"
                  />
                  <div className="p-8 border-2 border-dashed border-gray-600 rounded-lg hover:border-gray-500 transition-colors cursor-pointer bg-gray-700/30">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-300">Click to upload documents</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, or images</p>
                    </div>
                  </div>
                </label>
              </div>
              
              {propertyData.documents.length > 0 && (
                <div className="mt-3 space-y-2">
                  {propertyData.documents.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                      <span className="text-sm text-gray-300 truncate">{file.name}</span>
                      <button
                        onClick={() => handleRemoveFile('documents', index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-300 font-medium">Optional but Recommended</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Upload photos to document your property's condition and insurance policies 
                    for quick reference during claims.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const content = (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-blue-600/20 rounded-full mb-3">
              <StepIcon className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">{currentStepData.title}</h2>
            <p className="text-gray-400">{currentStepData.subtitle}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Step {currentStep + 1} of {WIZARD_STEPS.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={currentStep === 0 ? onSkip : handlePrevious}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-white"
            >
              {currentStep === 0 ? (
                <>
                  Skip for Now
                </>
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </>
              )}
            </Button>

            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : currentStep === WIZARD_STEPS.length - 1 ? (
                <>
                  Complete Setup
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onSkip} />
        <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          {content}
        </div>
      </div>
    )
  }

  return content
}
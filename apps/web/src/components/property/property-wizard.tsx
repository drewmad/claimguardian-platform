/**
 * @fileMetadata
 * @purpose Multi-step property creation wizard
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@claimguardian/ui"]
 * @exports ["PropertyWizard"]
 * @complexity high
 * @tags ["property", "wizard", "form", "multi-step"]
 * @status active
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Home, MapPin, DollarSign, Info, Check, 
  ChevronRight, ChevronLeft, X, Loader2,
  Building, Building2, TreePine, Warehouse,
  Calendar, Ruler, BedDouble, Bath, Trees,
  Shield, Camera, Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createProperty } from '@/actions/properties'
import { FloridaAddressForm } from '@/components/forms/florida-address-form'
import { PropertyImage } from '@/components/ui/property-image'

interface PropertyWizardProps {
  open: boolean
  onClose: () => void
  onComplete?: (propertyId: string) => void
}

interface PropertyData {
  // Step 1: Basic Info
  name: string
  type: string
  isPrimary: boolean
  
  // Step 2: Address
  address: {
    street1: string
    street2?: string
    city: string
    state: string
    zip: string
    county: string
    latitude?: number
    longitude?: number
    googlePlaceId?: string
  }
  
  // Step 3: Details
  yearBuilt: number
  squareFeet: number
  bedrooms: number
  bathrooms: number
  lotSize: number
  
  // Step 4: Value & Insurance
  value: number
  purchasePrice?: number
  purchaseDate?: string
  insuranceCarrier?: string
  policyNumber?: string
  
  // Step 5: Features
  features: string[]
  roofType?: string
  roofAge?: number
  hvacAge?: number
  hasPool?: boolean
  hasGarage?: boolean
  garageSpaces?: number
}

const propertyTypes = [
  { value: 'Single Family Home', label: 'Single Family Home', icon: Home },
  { value: 'Condo', label: 'Condo', icon: Building },
  { value: 'Townhouse', label: 'Townhouse', icon: Building2 },
  { value: 'Multi-Family', label: 'Multi-Family', icon: Warehouse },
  { value: 'Vacant Land', label: 'Vacant Land', icon: TreePine },
]

const wizardSteps = [
  { id: 1, title: 'Basic Info', icon: Home, description: 'Property name and type' },
  { id: 2, title: 'Location', icon: MapPin, description: 'Property address' },
  { id: 3, title: 'Details', icon: Info, description: 'Size and specifications' },
  { id: 4, title: 'Value', icon: DollarSign, description: 'Value and insurance' },
  { id: 5, title: 'Review', icon: Check, description: 'Review and confirm' },
]

export function PropertyWizard({ open, onClose, onComplete }: PropertyWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [propertyData, setPropertyData] = useState<PropertyData>({
    name: '',
    type: 'Single Family Home',
    isPrimary: false,
    address: {
      street1: '',
      street2: '',
      city: '',
      state: 'FL',
      zip: '',
      county: ''
    },
    yearBuilt: new Date().getFullYear(),
    squareFeet: 0,
    bedrooms: 0,
    bathrooms: 0,
    lotSize: 0,
    value: 0,
    features: []
  })

  // Reset wizard when opened
  useEffect(() => {
    if (open) {
      setCurrentStep(1)
      setErrors({})
      setPropertyData({
        name: '',
        type: 'Single Family Home',
        isPrimary: false,
        address: {
          street1: '',
          street2: '',
          city: '',
          state: 'FL',
          zip: '',
          county: ''
        },
        yearBuilt: new Date().getFullYear(),
        squareFeet: 0,
        bedrooms: 0,
        bathrooms: 0,
        lotSize: 0,
        value: 0,
        features: []
      })
    }
  }, [open])

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (step) {
      case 1:
        if (!propertyData.name.trim()) {
          newErrors.name = 'Property name is required'
        }
        break
      case 2:
        if (!propertyData.address.street1.trim()) {
          newErrors.street1 = 'Street address is required'
        }
        if (!propertyData.address.city.trim()) {
          newErrors.city = 'City is required'
        }
        if (!propertyData.address.zip.trim()) {
          newErrors.zip = 'ZIP code is required'
        }
        if (!propertyData.address.county.trim()) {
          newErrors.county = 'County is required'
        }
        break
      case 3:
        if (propertyData.squareFeet <= 0) {
          newErrors.squareFeet = 'Square footage must be greater than 0'
        }
        if (propertyData.yearBuilt < 1800 || propertyData.yearBuilt > new Date().getFullYear()) {
          newErrors.yearBuilt = 'Invalid year built'
        }
        break
      case 4:
        if (propertyData.value <= 0) {
          newErrors.value = 'Property value must be greater than 0'
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, wizardSteps.length))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return
    
    setIsSubmitting(true)
    try {
      const { data, error } = await createProperty({
        name: propertyData.name,
        type: propertyData.type,
        is_primary: propertyData.isPrimary,
        address: propertyData.address,
        year_built: propertyData.yearBuilt,
        square_feet: propertyData.squareFeet,
        value: propertyData.value,
        details: {
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          lot_size: propertyData.lotSize,
          purchase_price: propertyData.purchasePrice,
          purchase_date: propertyData.purchaseDate,
          insurance_carrier: propertyData.insuranceCarrier,
          policy_number: propertyData.policyNumber,
          roof_type: propertyData.roofType,
          roof_age: propertyData.roofAge,
          hvac_age: propertyData.hvacAge,
          has_pool: propertyData.hasPool,
          has_garage: propertyData.hasGarage,
          garage_spaces: propertyData.garageSpaces,
          features: propertyData.features
        }
      })
      
      if (error) throw error
      
      toast.success('Property created successfully!')
      onClose()
      if (onComplete && data?.id) {
        onComplete(data.id)
      }
      router.push(`/dashboard/property/${data?.id}`)
    } catch (error) {
      console.error('Error creating property:', error)
      toast.error('Failed to create property')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Property Name *</Label>
              <Input
                id="name"
                value={propertyData.name}
                onChange={(e) => setPropertyData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Main Residence, Beach House"
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                error={errors.name}
              />
              <p className="text-xs text-gray-400 mt-1">Give your property a memorable name</p>
            </div>

            <div>
              <Label>Property Type *</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {propertyTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      onClick={() => setPropertyData(prev => ({ ...prev, type: type.value }))}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                        propertyData.type === type.value
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPrimary"
                checked={propertyData.isPrimary}
                onChange={(e) => setPropertyData(prev => ({ ...prev, isPrimary: e.target.checked }))}
                className="w-4 h-4 bg-gray-700 border-gray-600 rounded text-blue-500 focus:ring-blue-500"
              />
              <Label htmlFor="isPrimary" className="cursor-pointer">
                This is my primary residence
              </Label>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <FloridaAddressForm
              value={propertyData.address}
              onChange={(address) => setPropertyData(prev => ({ ...prev, address }))}
              errors={errors}
            />
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="yearBuilt">Year Built *</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  value={propertyData.yearBuilt}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, yearBuilt: parseInt(e.target.value) || 0 }))}
                  min="1800"
                  max={new Date().getFullYear()}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  error={errors.yearBuilt}
                />
              </div>
              <div>
                <Label htmlFor="squareFeet">Square Feet *</Label>
                <Input
                  id="squareFeet"
                  type="number"
                  value={propertyData.squareFeet || ''}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, squareFeet: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g., 2500"
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  error={errors.squareFeet}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={propertyData.bedrooms || ''}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 0 }))}
                  min="0"
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  step="0.5"
                  value={propertyData.bathrooms || ''}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, bathrooms: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="lotSize">Lot Size (acres)</Label>
                <Input
                  id="lotSize"
                  type="number"
                  step="0.01"
                  value={propertyData.lotSize || ''}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, lotSize: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            <div>
              <Label>Quick Features</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={propertyData.hasPool}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, hasPool: e.target.checked }))}
                    className="w-4 h-4 bg-gray-700 border-gray-600 rounded text-blue-500"
                  />
                  <span className="text-sm text-gray-300">Swimming Pool</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={propertyData.hasGarage}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, hasGarage: e.target.checked }))}
                    className="w-4 h-4 bg-gray-700 border-gray-600 rounded text-blue-500"
                  />
                  <span className="text-sm text-gray-300">Garage</span>
                </label>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="value">Estimated Property Value *</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="value"
                  type="number"
                  value={propertyData.value || ''}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                  placeholder="450000"
                  className="pl-9 bg-gray-700 border-gray-600 text-white"
                  error={errors.value}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Current market value of your property</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="purchasePrice"
                    type="number"
                    value={propertyData.purchasePrice || ''}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, purchasePrice: parseInt(e.target.value) || undefined }))}
                    placeholder="400000"
                    className="pl-9 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={propertyData.purchaseDate || ''}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="insuranceCarrier">Insurance Carrier</Label>
              <Input
                id="insuranceCarrier"
                value={propertyData.insuranceCarrier || ''}
                onChange={(e) => setPropertyData(prev => ({ ...prev, insuranceCarrier: e.target.value }))}
                placeholder="e.g., State Farm, Citizens"
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <PropertyImage
                propertyType={propertyData.type}
                propertyName={propertyData.name}
                location={`${propertyData.address.city}, Florida`}
                width={200}
                height={150}
                className="mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold text-white">{propertyData.name}</h3>
              <p className="text-gray-400">{propertyData.type}</p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Location</h4>
                <p className="text-white">
                  {propertyData.address.street1}
                  {propertyData.address.street2 && <>, {propertyData.address.street2}</>}
                </p>
                <p className="text-white">
                  {propertyData.address.city}, {propertyData.address.state} {propertyData.address.zip}
                </p>
                <p className="text-gray-400 text-sm">{propertyData.address.county} County</p>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Property Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Year Built:</span>
                    <span className="text-white ml-2">{propertyData.yearBuilt}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Size:</span>
                    <span className="text-white ml-2">{propertyData.squareFeet.toLocaleString()} sqft</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Bedrooms:</span>
                    <span className="text-white ml-2">{propertyData.bedrooms}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Bathrooms:</span>
                    <span className="text-white ml-2">{propertyData.bathrooms}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Value & Insurance</h4>
                <div className="text-sm">
                  <div>
                    <span className="text-gray-400">Estimated Value:</span>
                    <span className="text-white ml-2">${propertyData.value.toLocaleString()}</span>
                  </div>
                  {propertyData.insuranceCarrier && (
                    <div className="mt-1">
                      <span className="text-gray-400">Insurance:</span>
                      <span className="text-white ml-2">{propertyData.insuranceCarrier}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                <strong>Ready to create your property?</strong> Review the details above and click "Create Property" to continue.
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Add New Property
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Let's set up your property in a few simple steps
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {wizardSteps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      isActive ? "bg-blue-600 text-white" : 
                      isCompleted ? "bg-green-600 text-white" : 
                      "bg-gray-700 text-gray-400"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs mt-2 font-medium",
                    isActive ? "text-white" : "text-gray-400"
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < wizardSteps.length - 1 && (
                  <div className={cn(
                    "w-16 h-0.5 mx-2 -mt-6",
                    isCompleted ? "bg-green-600" : "bg-gray-700"
                  )} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-700">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isSubmitting}
            className="text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            
            {currentStep < wizardSteps.length ? (
              <Button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Create Property
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
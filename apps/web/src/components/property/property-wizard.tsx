/**
 * @fileMetadata
 * @purpose Enhanced multi-step property creation wizard with Google API integration
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@claimguardian/ui"]
 * @exports ["PropertyWizard"]
 * @complexity high
 * @tags ["property", "wizard", "form", "multi-step", "google-api"]
 * @status active
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Home, MapPin, DollarSign, Info, Check, ChevronRight, ChevronLeft, X, Loader2, Building, Building2, TreePine, Warehouse, Shield, Camera, Upload, Wrench, Wind, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createProperty } from '@/actions/properties'
import { createPolicy } from '@/actions/policies'
import { createDocumentRecord } from '@/actions/documents'
import { FloridaAddressForm } from '@/components/forms/florida-address-form'
import { PropertyImage } from '@/components/ui/property-image'
import { sortedFloridaInsuranceCarriers, insuranceTypes } from '@/data/florida-insurance-carriers'
import { propertyDataService } from '@/lib/services/property-data-service'
import { fileUploadService, POLICY_DOCUMENT_VALIDATION } from '@/lib/services/file-upload-service'
import { logger } from '@/lib/logger'

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
  
  // Step 3: Details (auto-populated + manual)
  yearBuilt: number
  squareFeet: number
  bedrooms: number
  bathrooms: number
  lotSize: number
  
  // Home Systems & Structures
  roofType?: string
  roofAge?: number
  roofMaterial?: string
  hvacType?: string
  hvacAge?: number
  electricalPanelType?: string
  electricalPanelAge?: number
  plumbingType?: string
  plumbingAge?: number
  hasPool?: boolean
  poolAge?: number
  hasGarage?: boolean
  garageSpaces?: number
  hasHurricaneShutters?: boolean
  hasImpactWindows?: boolean
  hasGeneratorHookup?: boolean
  hasSolarPanels?: boolean
  
  // Step 4: Insurance
  insuranceCarrier?: string
  insuranceTypes?: string[] // Changed to array for multiple selections
  policyNumber?: string
  coverageAmount?: number
  deductible?: number
  windDeductible?: number
  customCarrierName?: string // For 'Other' carrier option
  policyDocuments?: File[] // For PDF/image uploads
  uploadedDocuments?: { fileName: string; filePath: string; uploadResult: unknown; documentId?: string }[] // Successfully uploaded docs
  
  // Auto-populated Value Info
  estimatedValue?: number
  taxAssessedValue?: number
  lastSalePrice?: number
  lastSaleDate?: string
  
  // Additional Info
  floodZone?: string
  features: string[]
}

const propertyTypes = [
  { value: 'Single Family Home', label: 'Single Family Home', icon: Home },
  { value: 'Condo', label: 'Condo', icon: Building },
  { value: 'Townhouse', label: 'Townhouse', icon: Building2 },
  { value: 'Multi-Family', label: 'Multi-Family', icon: Warehouse },
  { value: 'Vacant Land', label: 'Vacant Land', icon: TreePine },
]

const roofMaterials = [
  'Shingle', 'Tile', 'Metal', 'Flat/Built-up', 'Other'
]

const hvacTypes = [
  'Central AC', 'Heat Pump', 'Window Units', 'Split System', 'Other'
]

const electricalPanelTypes = [
  '100 Amp', '150 Amp', '200 Amp', '400 Amp', 'Other'
]

const plumbingTypes = [
  'Copper', 'PVC', 'PEX', 'Galvanized', 'Mixed', 'Other'
]

const wizardSteps = [
  { id: 1, title: 'Basic Info', icon: Home, description: 'Property name and type' },
  { id: 2, title: 'Location', icon: MapPin, description: 'Property address' },
  { id: 3, title: 'Details', icon: Info, description: 'Home systems & features' },
  { id: 4, title: 'Insurance', icon: Shield, description: 'Insurance information' },
  { id: 5, title: 'Review', icon: Check, description: 'Review and confirm' },
]

export function PropertyWizard({ open, onClose, onComplete }: PropertyWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingData, setIsFetchingData] = useState(false)
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
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
    features: [],
    insuranceTypes: [] // Initialize as empty array
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
        features: [],
        insuranceTypes: [] // Reset insurance types array
      })
    }
  }, [open])

  // Fetch property data when address is complete
  const fetchPropertyData = useCallback(async () => {
    if (!propertyData.address.street1 || !propertyData.address.city || !propertyData.address.zip) {
      return
    }

    setIsFetchingData(true)
    try {
      const data = await propertyDataService.fetchPropertyData({
        street: propertyData.address.street1,
        city: propertyData.address.city,
        state: propertyData.address.state,
        zip: propertyData.address.zip
      })

      if (data) {
        setPropertyData(prev => ({
          ...prev,
          // Only update if values are not already set by user
          yearBuilt: prev.yearBuilt === new Date().getFullYear() ? data.yearBuilt || prev.yearBuilt : prev.yearBuilt,
          squareFeet: prev.squareFeet === 0 ? data.squareFeet || prev.squareFeet : prev.squareFeet,
          bedrooms: prev.bedrooms === 0 ? data.bedrooms || prev.bedrooms : prev.bedrooms,
          bathrooms: prev.bathrooms === 0 ? data.bathrooms || prev.bathrooms : prev.bathrooms,
          lotSize: prev.lotSize === 0 ? data.lotSize || prev.lotSize : prev.lotSize,
          estimatedValue: data.estimatedValue,
          taxAssessedValue: data.taxAssessedValue,
          lastSalePrice: data.lastSalePrice,
          lastSaleDate: data.lastSaleDate,
          floodZone: data.floodZone
        }))

        toast.success('Property data loaded from public records')
      }
    } catch (error) {
      logger.error('Failed to fetch property data', { error })
    } finally {
      setIsFetchingData(false)
    }
  }, [propertyData.address])

  // Auto-fetch when moving to step 3
  useEffect(() => {
    if (currentStep === 3 && !propertyData.estimatedValue) {
      fetchPropertyData()
    }
  }, [currentStep, propertyData.estimatedValue, fetchPropertyData])

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
        // Insurance is optional
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

  const handleExtractedDataApplied = (extractedData: unknown) => {
    // Apply extracted data to form fields
    setPropertyData(prev => ({
      ...prev,
      insuranceCarrier: extractedData.carrierName || prev.insuranceCarrier,
      policyNumber: extractedData.policyNumber || prev.policyNumber,
      coverageAmount: extractedData.coverageAmount || prev.coverageAmount,
      deductible: extractedData.deductible || prev.deductible,
      windDeductible: extractedData.windDeductible ? 
        (typeof extractedData.windDeductible === 'string' ? 
          parseInt(extractedData.windDeductible.replace('%', '')) : 
          extractedData.windDeductible
        ) : prev.windDeductible,
      // Add insurance type if not already selected
      insuranceTypes: extractedData.policyType && !prev.insuranceTypes?.includes(extractedData.policyType) ?
        [...(prev.insuranceTypes || []), extractedData.policyType] :
        prev.insuranceTypes
    }))
    
    toast.success('Policy data applied to form!')
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return
    
    setIsSubmitting(true)
    try {
      // First create the property without insurance info
      const { data: createdProperty, error: propertyError } = await createProperty({
        name: propertyData.name,
        type: propertyData.type,
        is_primary: propertyData.isPrimary,
        address: propertyData.address,
        year_built: propertyData.yearBuilt,
        square_feet: propertyData.squareFeet,
        value: propertyData.estimatedValue || 0,
        details: {
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          lot_size: propertyData.lotSize,
          
          // Home systems
          roof_type: propertyData.roofType,
          roof_age: propertyData.roofAge,
          roof_material: propertyData.roofMaterial,
          hvac_type: propertyData.hvacType,
          hvac_age: propertyData.hvacAge,
          electrical_panel_type: propertyData.electricalPanelType,
          electrical_panel_age: propertyData.electricalPanelAge,
          plumbing_type: propertyData.plumbingType,
          plumbing_age: propertyData.plumbingAge,
          
          // Features
          has_pool: propertyData.hasPool,
          pool_age: propertyData.poolAge,
          has_garage: propertyData.hasGarage,
          garage_spaces: propertyData.garageSpaces,
          has_hurricane_shutters: propertyData.hasHurricaneShutters,
          has_impact_windows: propertyData.hasImpactWindows,
          has_generator_hookup: propertyData.hasGeneratorHookup,
          has_solar_panels: propertyData.hasSolarPanels,
          
          // Values
          tax_assessed_value: propertyData.taxAssessedValue,
          last_sale_price: propertyData.lastSalePrice,
          last_sale_date: propertyData.lastSaleDate,
          flood_zone: propertyData.floodZone,
          
          features: propertyData.features
        }
      })
      
      if (propertyError) throw propertyError
      
      // Then create policies if insurance info was provided
      if (propertyData.insuranceCarrier && createdProperty?.id) {
        // Determine the actual carrier name (handle custom carrier case)
        const carrierName = propertyData.insuranceCarrier === 'Other (Not Listed)' 
          ? propertyData.customCarrierName || 'Other'
          : propertyData.insuranceCarrier

        // Create a policy for each selected insurance type
        const selectedTypes = propertyData.insuranceTypes || []
        
        if (selectedTypes.length > 0) {
          for (const insuranceType of selectedTypes) {
            const policyInfo = {
              property_id: createdProperty.id,
              carrier_name: carrierName,
              policy_number: propertyData.policyNumber || `POLICY-${insuranceType}-${Date.now()}`,
              policy_type: insuranceType as unknown,
              effective_date: new Date().toISOString().split('T')[0],
              expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              coverage_details: {
                coverage_amount: propertyData.coverageAmount,
                deductible: propertyData.deductible,
                wind_deductible: propertyData.windDeductible,
                documents: propertyData.policyDocuments?.map(f => f.name) || []
              },
              deductible_amount: propertyData.deductible,
              wind_deductible_percentage: propertyData.windDeductible
            }
            
            const { error: policyError } = await createPolicy(policyInfo)
            
            if (policyError) {
              console.error('Failed to create policy:', policyError)
              toast.warning(`Could not save ${insuranceType} policy`)
            }
          }
          
          // Create document records for uploaded files
          if (propertyData.uploadedDocuments && propertyData.uploadedDocuments.length > 0) {
            for (const uploadedDoc of propertyData.uploadedDocuments) {
              try {
                const { data: documentRecord, error: docError } = await createDocumentRecord({
                  propertyId: createdProperty.id,
                  filePath: uploadedDoc.filePath,
                  fileName: uploadedDoc.fileName,
                  fileSize: uploadedDoc.file.size,
                  fileType: uploadedDoc.file.type,
                  documentType: 'policy',
                  description: `Policy document: ${uploadedDoc.fileName}`
                })
                
                if (docError) {
                  console.error('Failed to create document record:', docError)
                  toast.warning(`Could not save document record for ${uploadedDoc.fileName}`)
                } else {
                  logger.info('Document record created', { 
                    documentId: documentRecord?.id,
                    fileName: uploadedDoc.fileName 
                  })
                  // Update the local data with the document ID for potential AI processing
                  uploadedDoc.documentId = documentRecord?.id
                }
              } catch (error) {
                console.error('Error creating document record:', error)
              }
            }
          }
        }
      }
      
      const data = createdProperty
      const error = propertyError
      
      const hasDocuments = propertyData.uploadedDocuments && propertyData.uploadedDocuments.length > 0
      
      if (hasDocuments) {
        toast.success('Property created! Visit the property page to process your uploaded documents with AI.')
      } else {
        toast.success('Property created successfully!')
      }
      
      // Force refresh the property list
      if (onComplete && data?.id) {
        onComplete(data.id)
      }
      
      onClose()
      
      // Navigate to the new property
      setTimeout(() => {
        router.push(`/dashboard/property/${data?.id}`)
      }, 100)
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
            {propertyData.address.street1 && propertyData.address.city && propertyData.address.zip && (
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
                <p className="text-sm text-blue-300">
                  <strong>Note:</strong> We'll automatically fetch property details from public records in the next step.
                </p>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            {isFetchingData && (
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <p className="text-sm text-blue-300">Fetching property data from public records...</p>
              </div>
            )}

            {/* Auto-populated data section */}
            {propertyData.estimatedValue && (
              <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Data from Public Records
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {propertyData.estimatedValue && (
                    <div>
                      <span className="text-gray-400">Estimated Value:</span>
                      <span className="text-white ml-2">${propertyData.estimatedValue.toLocaleString()}</span>
                    </div>
                  )}
                  {propertyData.taxAssessedValue && (
                    <div>
                      <span className="text-gray-400">Tax Assessed:</span>
                      <span className="text-white ml-2">${propertyData.taxAssessedValue.toLocaleString()}</span>
                    </div>
                  )}
                  {propertyData.lastSalePrice && (
                    <div>
                      <span className="text-gray-400">Last Sale:</span>
                      <span className="text-white ml-2">${propertyData.lastSalePrice.toLocaleString()}</span>
                    </div>
                  )}
                  {propertyData.floodZone && (
                    <div>
                      <span className="text-gray-400">Flood Zone:</span>
                      <span className="text-white ml-2">{propertyData.floodZone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Basic Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Basic Information</h4>
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

              <div className="grid grid-cols-3 gap-4 mt-4">
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
            </div>

            {/* Home Systems */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Home Systems
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Roof Material</Label>
                  <select
                    value={propertyData.roofMaterial || ''}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, roofMaterial: e.target.value }))}
                    className="w-full mt-1 bg-gray-700 border-gray-600 text-white rounded px-3 py-2"
                  >
                    <option value="">Select Material</option>
                    {roofMaterials.map(material => (
                      <option key={material} value={material}>{material}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Roof Age (years)</Label>
                  <Input
                    type="number"
                    value={propertyData.roofAge || ''}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, roofAge: parseInt(e.target.value) || undefined }))}
                    min="0"
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>HVAC Type</Label>
                  <select
                    value={propertyData.hvacType || ''}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, hvacType: e.target.value }))}
                    className="w-full mt-1 bg-gray-700 border-gray-600 text-white rounded px-3 py-2"
                  >
                    <option value="">Select Type</option>
                    {hvacTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>HVAC Age (years)</Label>
                  <Input
                    type="number"
                    value={propertyData.hvacAge || ''}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, hvacAge: parseInt(e.target.value) || undefined }))}
                    min="0"
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Electrical Panel</Label>
                  <select
                    value={propertyData.electricalPanelType || ''}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, electricalPanelType: e.target.value }))}
                    className="w-full mt-1 bg-gray-700 border-gray-600 text-white rounded px-3 py-2"
                  >
                    <option value="">Select Type</option>
                    {electricalPanelTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Plumbing Type</Label>
                  <select
                    value={propertyData.plumbingType || ''}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, plumbingType: e.target.value }))}
                    className="w-full mt-1 bg-gray-700 border-gray-600 text-white rounded px-3 py-2"
                  >
                    <option value="">Select Type</option>
                    {plumbingTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Florida-specific Features */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Wind className="w-4 h-4" />
                Florida Features
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={propertyData.hasHurricaneShutters}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, hasHurricaneShutters: e.target.checked }))}
                    className="w-4 h-4 bg-gray-700 border-gray-600 rounded text-blue-500"
                  />
                  <span className="text-sm text-gray-300">Hurricane Shutters</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={propertyData.hasImpactWindows}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, hasImpactWindows: e.target.checked }))}
                    className="w-4 h-4 bg-gray-700 border-gray-600 rounded text-blue-500"
                  />
                  <span className="text-sm text-gray-300">Impact Windows</span>
                </label>
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
                    checked={propertyData.hasGeneratorHookup}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, hasGeneratorHookup: e.target.checked }))}
                    className="w-4 h-4 bg-gray-700 border-gray-600 rounded text-blue-500"
                  />
                  <span className="text-sm text-gray-300">Generator Hookup</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={propertyData.hasSolarPanels}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, hasSolarPanels: e.target.checked }))}
                    className="w-4 h-4 bg-gray-700 border-gray-600 rounded text-blue-500"
                  />
                  <span className="text-sm text-gray-300">Solar Panels</span>
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
            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
              <p className="text-sm text-blue-300">
                <strong>Optional:</strong> Add insurance information to help track coverage and claims.
              </p>
            </div>

            <div>
              <Label>Insurance Carrier</Label>
              <select
                value={propertyData.insuranceCarrier || ''}
                onChange={(e) => {
                  const value = e.target.value
                  setPropertyData(prev => ({ 
                    ...prev, 
                    insuranceCarrier: value,
                    customCarrierName: value === 'Other (Not Listed)' ? prev.customCarrierName || '' : undefined
                  }))
                }}
                className="w-full mt-1 bg-gray-700 border-gray-600 text-white rounded px-3 py-2"
              >
                <option value="">Select Insurance Carrier</option>
                <optgroup label="State-Backed">
                  {sortedFloridaInsuranceCarriers
                    .filter(c => c.type === 'state')
                    .map(carrier => (
                      <option key={carrier.id} value={carrier.name}>{carrier.name}</option>
                    ))}
                </optgroup>
                <optgroup label="Private Carriers">
                  {sortedFloridaInsuranceCarriers
                    .filter(c => c.type === 'private' && c.id !== 'self-insured' && c.id !== 'other')
                    .map(carrier => (
                      <option key={carrier.id} value={carrier.name}>{carrier.name}</option>
                    ))}
                </optgroup>
                <optgroup label="Surplus Lines">
                  {sortedFloridaInsuranceCarriers
                    .filter(c => c.type === 'surplus')
                    .map(carrier => (
                      <option key={carrier.id} value={carrier.name}>{carrier.name}</option>
                    ))}
                </optgroup>
                <optgroup label="Other">
                  {sortedFloridaInsuranceCarriers
                    .filter(c => c.id === 'self-insured' || c.id === 'other')
                    .map(carrier => (
                      <option key={carrier.id} value={carrier.name}>{carrier.name}</option>
                    ))}
                </optgroup>
              </select>
            </div>

            {propertyData.insuranceCarrier === 'Other (Not Listed)' && (
              <div>
                <Label>Custom Carrier Name</Label>
                <Input
                  value={propertyData.customCarrierName || ''}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, customCarrierName: e.target.value }))}
                  placeholder="Enter carrier name"
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            )}

            <div>
              <Label>Insurance Types</Label>
              <p className="text-xs text-gray-400 mb-3">Select all that apply for this property</p>
              <div className="grid grid-cols-2 gap-3">
                {insuranceTypes.map(type => (
                  <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={propertyData.insuranceTypes?.includes(type.value) || false}
                      onChange={(e) => {
                        const currentTypes = propertyData.insuranceTypes || []
                        if (e.target.checked) {
                          setPropertyData(prev => ({ 
                            ...prev, 
                            insuranceTypes: [...currentTypes, type.value]
                          }))
                        } else {
                          setPropertyData(prev => ({ 
                            ...prev, 
                            insuranceTypes: currentTypes.filter(t => t !== type.value)
                          }))
                        }
                      }}
                      className="w-4 h-4 bg-gray-700 border-gray-600 rounded text-blue-500"
                    />
                    <span className="text-sm text-gray-300">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>Policy Number</Label>
              <Input
                value={propertyData.policyNumber || ''}
                onChange={(e) => setPropertyData(prev => ({ ...prev, policyNumber: e.target.value }))}
                placeholder="e.g., HO-123456789"
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Coverage Amount</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    value={propertyData.coverageAmount || ''}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, coverageAmount: parseInt(e.target.value) || undefined }))}
                    placeholder="500000"
                    className="pl-9 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div>
                <Label>Deductible</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    value={propertyData.deductible || ''}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, deductible: parseInt(e.target.value) || undefined }))}
                    placeholder="2500"
                    className="pl-9 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div>
                <Label>Wind Deductible</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                  <Input
                    type="number"
                    value={propertyData.windDeductible || ''}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, windDeductible: parseInt(e.target.value) || undefined }))}
                    placeholder="2"
                    min="1"
                    max="10"
                    className="pl-8 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Percentage of coverage</p>
              </div>
            </div>

            {/* Policy Documents Upload */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4" />
                Policy Documents
              </Label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="policy-upload"
                  accept=".pdf,.png,.jpg,.jpeg"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || [])
                    if (files.length === 0) return

                    setIsUploadingFiles(true)
                    
                    try {
                      // Upload files immediately when selected
                      const uploadResults = await fileUploadService.uploadMultipleFiles(
                        files, 
                        'policies', // folder name
                        POLICY_DOCUMENT_VALIDATION
                      )

                      const successfulUploads = uploadResults
                        .map((result, index) => ({
                          fileName: files[index].name,
                          filePath: result.path || '',
                          uploadResult: result,
                          file: files[index]
                        }))
                        .filter(upload => upload.uploadResult.success)

                      const failedUploads = uploadResults.filter(result => !result.success)

                      if (successfulUploads.length > 0) {
                        setPropertyData(prev => ({
                          ...prev,
                          uploadedDocuments: [...(prev.uploadedDocuments || []), ...successfulUploads]
                        }))
                        
                        toast.success(`Uploaded ${successfulUploads.length} document${successfulUploads.length > 1 ? 's' : ''} successfully`)
                      }

                      if (failedUploads.length > 0) {
                        failedUploads.forEach(result => {
                          toast.error(`Upload failed: ${result.error}`)
                        })
                      }
                    } catch (error) {
                      console.error('Upload error:', error)
                      toast.error('Failed to upload documents')
                    } finally {
                      setIsUploadingFiles(false)
                      // Clear the input so the same file can be selected again
                      e.target.value = ''
                    }
                  }}
                  className="hidden"
                  disabled={isUploadingFiles}
                />
                <label htmlFor="policy-upload" className={cn("cursor-pointer", isUploadingFiles && "pointer-events-none opacity-50")}>
                  {isUploadingFiles ? (
                    <Loader2 className="w-8 h-8 mx-auto mb-2 text-blue-400 animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  )}
                  <p className="text-sm text-gray-300 mb-1">
                    {isUploadingFiles ? 'Uploading documents...' : 'Upload policy documents'}
                  </p>
                  <p className="text-xs text-gray-400">PDF or images (PNG, JPG) supported</p>
                  <Button type="button" size="sm" className="mt-3" disabled={isUploadingFiles}>
                    {isUploadingFiles ? 'Uploading...' : 'Choose Files'}
                  </Button>
                </label>
              </div>
              
              {propertyData.uploadedDocuments && propertyData.uploadedDocuments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {propertyData.uploadedDocuments.map((upload, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700 rounded p-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-sm text-gray-300 truncate">{upload.fileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          // Delete from storage
                          const deleted = await fileUploadService.deleteFile(upload.filePath)
                          if (deleted) {
                            setPropertyData(prev => ({
                              ...prev,
                              uploadedDocuments: prev.uploadedDocuments?.filter((_, i) => i !== index)
                            }))
                            toast.success('Document deleted')
                          } else {
                            toast.error('Failed to delete document')
                          }
                        }}
                        className="text-red-400 hover:text-red-300 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <div className="text-xs text-blue-300 mt-2 p-3 bg-blue-900/20 border border-blue-600/30 rounded">
                    <Database className="w-3 h-3 inline mr-1" />
                    Documents uploaded successfully! After creating your property, you can use AI to extract policy data from these documents and auto-populate your insurance information.
                  </div>
                </div>
              )}
            </div>

            {propertyData.insuranceCarrier && (
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Carrier Information</h4>
                {sortedFloridaInsuranceCarriers.find(c => c.name === propertyData.insuranceCarrier)?.phone && (
                  <p className="text-sm text-gray-400">
                    Phone: {sortedFloridaInsuranceCarriers.find(c => c.name === propertyData.insuranceCarrier)?.phone}
                  </p>
                )}
                {sortedFloridaInsuranceCarriers.find(c => c.name === propertyData.insuranceCarrier)?.website && (
                  <p className="text-sm text-gray-400">
                    Website: {sortedFloridaInsuranceCarriers.find(c => c.name === propertyData.insuranceCarrier)?.website}
                  </p>
                )}
              </div>
            )}
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
                width={400}
                height={250}
                className="mx-auto mb-4 rounded-lg shadow-lg"
                generateAI={true}
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
                  {propertyData.lotSize > 0 && (
                    <div>
                      <span className="text-gray-400">Lot Size:</span>
                      <span className="text-white ml-2">{propertyData.lotSize} acres</span>
                    </div>
                  )}
                  {propertyData.floodZone && (
                    <div>
                      <span className="text-gray-400">Flood Zone:</span>
                      <span className="text-white ml-2">{propertyData.floodZone}</span>
                    </div>
                  )}
                </div>
              </div>

              {(propertyData.roofMaterial || propertyData.hvacType || propertyData.electricalPanelType) && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Home Systems</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {propertyData.roofMaterial && (
                      <div>
                        <span className="text-gray-400">Roof:</span>
                        <span className="text-white ml-2">
                          {propertyData.roofMaterial}
                          {propertyData.roofAge && ` (${propertyData.roofAge} years)`}
                        </span>
                      </div>
                    )}
                    {propertyData.hvacType && (
                      <div>
                        <span className="text-gray-400">HVAC:</span>
                        <span className="text-white ml-2">
                          {propertyData.hvacType}
                          {propertyData.hvacAge && ` (${propertyData.hvacAge} years)`}
                        </span>
                      </div>
                    )}
                    {propertyData.electricalPanelType && (
                      <div>
                        <span className="text-gray-400">Electrical:</span>
                        <span className="text-white ml-2">{propertyData.electricalPanelType}</span>
                      </div>
                    )}
                    {propertyData.plumbingType && (
                      <div>
                        <span className="text-gray-400">Plumbing:</span>
                        <span className="text-white ml-2">{propertyData.plumbingType}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {propertyData.insuranceCarrier && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Insurance</h4>
                  <div className="text-sm">
                    <div>
                      <span className="text-gray-400">Carrier:</span>
                      <span className="text-white ml-2">{propertyData.insuranceCarrier}</span>
                    </div>
                    {propertyData.insuranceTypes && propertyData.insuranceTypes.length > 0 && (
                      <div className="mt-1">
                        <span className="text-gray-400">Types:</span>
                        <span className="text-white ml-2">
                          {propertyData.insuranceTypes
                            .map(type => insuranceTypes.find(t => t.value === type)?.label || type)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                    {propertyData.coverageAmount && (
                      <div className="mt-1">
                        <span className="text-gray-400">Coverage:</span>
                        <span className="text-white ml-2">${propertyData.coverageAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {propertyData.estimatedValue && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Value Information</h4>
                  <div className="text-sm">
                    <div>
                      <span className="text-gray-400">Estimated Value:</span>
                      <span className="text-white ml-2">${propertyData.estimatedValue.toLocaleString()}</span>
                    </div>
                    {propertyData.taxAssessedValue && (
                      <div className="mt-1">
                        <span className="text-gray-400">Tax Assessed:</span>
                        <span className="text-white ml-2">${propertyData.taxAssessedValue.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
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
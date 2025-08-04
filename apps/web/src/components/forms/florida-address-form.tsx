/**
 * @fileMetadata
 * @purpose Florida-specific address form with dependent dropdowns
 * @owner frontend-team
 * @dependencies ["react", "@types/google.maps", "geographic actions"]
 * @exports ["FloridaAddressForm"]
 * @complexity medium
 * @tags ["forms", "address", "florida", "dependent-dropdowns"]
 * @status active
 */
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { logger } from "@/lib/logger/production-logger"

import { getFloridaCountiesFallback, validateAddress } from '@/actions/geographic'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGooglePlaces } from '@/hooks/use-google-maps'
import { logger } from "@/lib/logger/production-logger"

interface AddressComponents {
  street1: string
  street2?: string
  city: string
  state: string
  zip: string
  county: string
}

interface FloridaAddressFormProps {
  value: AddressComponents
  onChange: (address: AddressComponents) => void
  disabled?: boolean
  className?: string
}

interface CountyOption {
  id: number
  name: string
  fips_code: string
}

export function FloridaAddressForm({ value, onChange, disabled, className }: FloridaAddressFormProps) {
  const street1Ref = useRef<HTMLInputElement>(null)
  const [autocomplete, setAutocomplete] = useState<unknown>(null)
  const [counties, setCounties] = useState<CountyOption[]>([])
  const [validationMessage, setValidationMessage] = useState('')
  
  // Use centralized Google Maps hook
  const { isLoaded: isGoogleLoaded, isLoading: isGoogleLoading, error: googleError } = useGooglePlaces()
  
  // Infer county from city name
  const inferCountyFromCity = useCallback(async (cityName: string): Promise<string | null> => {
    const cityCountyMap: Record<string, string> = {
      'Port Charlotte': 'Charlotte County',
      'Punta Gorda': 'Charlotte County',
      'Miami': 'Miami-Dade County',
      'Jacksonville': 'Duval County',
      'Tampa': 'Hillsborough County',
      'Orlando': 'Orange County',
      'St. Petersburg': 'Pinellas County',
      'Hialeah': 'Miami-Dade County',
      'Tallahassee': 'Leon County',
      'Fort Lauderdale': 'Broward County',
      'Cape Coral': 'Lee County',
      'Pembroke Pines': 'Broward County',
      'Hollywood': 'Broward County',
      'Gainesville': 'Alachua County',
      'Coral Springs': 'Broward County',
      'Clearwater': 'Pinellas County',
      'Miami Beach': 'Miami-Dade County',
      'Pompano Beach': 'Broward County',
      'West Palm Beach': 'Palm Beach County',
      'Lakeland': 'Polk County',
      'Davie': 'Broward County',
      'Miami Gardens': 'Miami-Dade County',
      'Boca Raton': 'Palm Beach County',
      'Sunrise': 'Broward County',
      'Brandon': 'Hillsborough County',
      'Palm Bay': 'Brevard County',
      'Deerfield Beach': 'Broward County',
      'Melbourne': 'Brevard County',
      'Boynton Beach': 'Palm Beach County',
      'Lauderhill': 'Broward County',
      'Weston': 'Broward County',
      'Kissimmee': 'Osceola County',
      'Homestead': 'Miami-Dade County',
      'Delray Beach': 'Palm Beach County',
      'Tamarac': 'Broward County',
      'Daytona Beach': 'Volusia County',
      'North Miami': 'Miami-Dade County',
      'Wellington': 'Palm Beach County',
      'Jupiter': 'Palm Beach County',
      'North Port': 'Sarasota County',
      'Ocala': 'Marion County'
    }
    
    return cityCountyMap[cityName] || null
  }, [])
  
  // Load Florida counties on mount
  useEffect(() => {
    const loadCounties = async () => {
      try {
        const { data } = await getFloridaCountiesFallback()
        if (data) {
          setCounties(data)
        }
      } catch (error) {
        logger.error('Error loading counties:', error)
      }
    }
    
    loadCounties()
  }, [])

  // Google Maps loading is now handled by useGooglePlaces hook

  // Initialize autocomplete when Google is loaded - Florida only
  useEffect(() => {
    if (!isGoogleLoaded || !street1Ref.current || autocomplete) return

    const autocompleteInstance = new window.google.maps.places.Autocomplete(
      street1Ref.current,
      {
        types: ['address'],
        componentRestrictions: { country: 'us', administrativeArea: 'FL' },
        fields: ['address_components', 'formatted_address', 'geometry']
      }
    )

    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace()
      
      if (!place.address_components) return

      const components: AddressComponents = {
        street1: '',
        street2: '',
        city: '',
        state: 'FL', // Always Florida
        zip: '',
        county: ''
      }

      // Parse address components
      place.address_components.forEach((component: { types: string[]; long_name: string; short_name: string }) => {
        const types = component.types

        if (types.includes('street_number')) {
          components.street1 = component.long_name + ' '
        }
        if (types.includes('route')) {
          components.street1 += component.long_name
        }
        if (types.includes('subpremise')) {
          components.street2 = component.long_name
        }
        if (types.includes('locality')) {
          components.city = component.long_name
        }
        if (types.includes('administrative_area_level_1')) {
          // Always ensure it's Florida
          if (component.short_name === 'FL') {
            components.state = 'FL'
          }
        }
        if (types.includes('postal_code')) {
          components.zip = component.long_name
        }
        if (types.includes('administrative_area_level_2')) {
          // County name from Google Places
          components.county = component.long_name.replace(' County', '')
        }
      })

      // If no county from Google, try to infer from city
      if (!components.county && components.city) {
        inferCountyFromCity(components.city).then(inferredCounty => {
          if (inferredCounty) {
            components.county = inferredCounty
          }
          onChange(components)
        })
      } else {
        onChange(components)
      }
    })

    setAutocomplete(autocompleteInstance)

    return () => {
      if (autocompleteInstance) {
        window.google.maps.event.clearInstanceListeners(autocompleteInstance)
      }
    }
  }, [isGoogleLoaded, onChange, autocomplete, inferCountyFromCity])

  // Validate ZIP code and auto-populate fields
  const handleZipChange = useCallback(async (zipCode: string) => {
    if (zipCode.length === 5) {
      try {
        const { data } = await validateAddress({ zipCode, state: 'FL' })
        if (data?.exactMatch) {
          const match = data.exactMatch
          onChange({
            ...value,
            zip: zipCode,
            city: match.city,
            county: match.county,
            state: 'FL'
          })
          setValidationMessage(`✓ Valid ZIP code for ${match.city}, ${match.county}`)
        } else if (data?.suggestions && data.suggestions.length > 0) {
          setValidationMessage(`Multiple matches found for ZIP ${zipCode}`)
        } else {
          setValidationMessage(`ZIP code ${zipCode} not found in Florida`)
        }
      } catch (error) {
        logger.error('Error validating ZIP:', error)
        setValidationMessage('')
      }
    } else {
      setValidationMessage('')
    }
  }, [value, onChange])

  const handleManualChange = (field: keyof AddressComponents, fieldValue: string) => {
    const newValue = {
      ...value,
      [field]: fieldValue
    }
    
    // Special handling for ZIP code validation
    if (field === 'zip') {
      handleZipChange(fieldValue)
    }
    
    onChange(newValue)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Label className="text-gray-300 text-lg font-semibold">Florida Address</Label>
      
      <div>
        <Label className="text-gray-300">Street Address</Label>
        <Input
          ref={street1Ref}
          value={value.street1}
          onChange={(e) => handleManualChange('street1', e.target.value)}
          className="bg-gray-700 border-gray-600 text-white"
          placeholder="Start typing your Florida address..."
          disabled={disabled}
        />
        {isGoogleLoaded && (
          <p className="text-xs text-green-400 mt-1">
            ✓ Google Places autocomplete enabled (Florida only)
          </p>
        )}
        {isGoogleLoading && (
          <p className="text-xs text-yellow-400 mt-1">
            Loading address autocomplete...
          </p>
        )}
        {googleError && (
          <p className="text-xs text-gray-400 mt-1">
            Manual entry only ({googleError})
          </p>
        )}
      </div>

      <div>
        <Label className="text-gray-300">Address Line 2 (Optional)</Label>
        <Input
          value={value.street2}
          onChange={(e) => handleManualChange('street2', e.target.value)}
          className="bg-gray-700 border-gray-600 text-white"
          placeholder="Apt, Suite, Unit, etc."
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300">City</Label>
          <Input
            value={value.city}
            onChange={(e) => handleManualChange('city', e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
            placeholder="Port Charlotte"
            disabled={disabled}
          />
        </div>
        <div>
          <Label className="text-gray-300">ZIP Code</Label>
          <Input
            value={value.zip}
            onChange={(e) => handleManualChange('zip', e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
            placeholder="33948"
            maxLength={5}
            pattern="[0-9]{5}"
            disabled={disabled}
          />
          {validationMessage && (
            <p className={`text-xs mt-1 ${validationMessage.startsWith('✓') ? 'text-green-400' : 'text-yellow-400'}`}>
              {validationMessage}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300">State</Label>
          <div className="relative">
            <Input
              value="Florida"
              className="bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed"
              disabled={true}
              readOnly
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-xs text-blue-400">FL Only</span>
            </div>
          </div>
        </div>
        <div>
          <Label className="text-gray-300">County</Label>
          <select
            value={value.county}
            onChange={(e) => handleManualChange('county', e.target.value)}
            className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2"
            disabled={disabled}
          >
            <option value="">Select County</option>
            {counties.map((county) => (
              <option key={county.id} value={county.name}>
                {county.name}
              </option>
            ))}
          </select>
          {value.county && (
            <p className="text-xs text-gray-400 mt-1">
              FIPS: {counties.find(c => c.name === value.county)?.fips_code}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
/**
 * @fileMetadata
 * @purpose Google Places API address autocomplete component
 * @owner frontend-team
 * @dependencies ["react", "@types/google.maps"]
 * @exports ["AddressAutocomplete"]
 * @complexity medium
 * @tags ["forms", "address", "google-places", "autocomplete"]
 * @status active
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AddressComponents {
  street1: string
  street2: string
  city: string
  state: string
  zip: string
  county: string
}

interface AddressAutocompleteProps {
  value: AddressComponents
  onChange: (address: AddressComponents) => void
  disabled?: boolean
  className?: string
}

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (input: HTMLInputElement, options: Record<string, unknown>) => {
            addListener: (event: string, callback: () => void) => void
            getPlace: () => { address_components?: Array<{ types: string[]; long_name: string; short_name: string }> }
          }
        }
        event: {
          clearInstanceListeners: (instance: unknown) => void
        }
      }
    }
    initGooglePlaces: () => void
  }
}

export function AddressAutocomplete({ value, onChange, disabled, className }: AddressAutocompleteProps) {
  const street1Ref = useRef<HTMLInputElement>(null)
  const [autocomplete, setAutocomplete] = useState<unknown>(null)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)

  // Load Google Places API
  useEffect(() => {
    const loadGooglePlaces = () => {
      if (window.google?.maps?.places) {
        setIsGoogleLoaded(true)
        return
      }

      // Check if API key is available
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        console.warn('Google Maps API key not found. Address autocomplete will not be available.')
        return
      }

      // Load the script
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`
      script.async = true
      script.defer = true

      window.initGooglePlaces = () => {
        setIsGoogleLoaded(true)
      }

      document.head.appendChild(script)

      return () => {
        document.head.removeChild(script)
        delete window.initGooglePlaces
      }
    }

    loadGooglePlaces()
  }, [])

  // Initialize autocomplete when Google is loaded
  useEffect(() => {
    if (!isGoogleLoaded || !street1Ref.current || autocomplete) return

    const autocompleteInstance = new window.google.maps.places.Autocomplete(
      street1Ref.current,
      {
        types: ['address'],
        componentRestrictions: { country: 'us' },
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
        state: '',
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
          components.state = component.short_name
        }
        if (types.includes('postal_code')) {
          components.zip = component.long_name
        }
        if (types.includes('administrative_area_level_2')) {
          components.county = component.long_name
        }
      })

      onChange(components)
    })

    setAutocomplete(autocompleteInstance)

    return () => {
      if (autocompleteInstance) {
        window.google.maps.event.clearInstanceListeners(autocompleteInstance)
      }
    }
  }, [isGoogleLoaded, onChange, autocomplete])

  const handleManualChange = (field: keyof AddressComponents, fieldValue: string) => {
    onChange({
      ...value,
      [field]: fieldValue
    })
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Label className="text-gray-300 text-lg font-semibold">Address</Label>
      
      <div>
        <Label className="text-gray-300">Street Address</Label>
        <Input
          ref={street1Ref}
          value={value.street1}
          onChange={(e) => handleManualChange('street1', e.target.value)}
          className="bg-gray-700 border-gray-600 text-white"
          placeholder="Start typing your address..."
          disabled={disabled}
        />
        {isGoogleLoaded && (
          <p className="text-xs text-green-400 mt-1">
            ✓ Google Places autocomplete enabled
          </p>
        )}
        {!isGoogleLoaded && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <p className="text-xs text-yellow-400 mt-1">
            Loading address autocomplete...
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
          <Label className="text-gray-300">County</Label>
          <Input
            value={value.county}
            onChange={(e) => handleManualChange('county', e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
            placeholder="Charlotte County"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300">State</Label>
          <select
            value={value.state}
            onChange={(e) => handleManualChange('state', e.target.value)}
            className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2"
            disabled={disabled}
          >
            <option value="">Select State</option>
            <option value="AL">Alabama</option>
            <option value="FL">Florida</option>
            <option value="GA">Georgia</option>
            <option value="SC">South Carolina</option>
            <option value="NC">North Carolina</option>
            <option value="TX">Texas</option>
            <option value="LA">Louisiana</option>
            <option value="MS">Mississippi</option>
            <option value="CA">California</option>
            <option value="NY">New York</option>
            {/* Add more states as needed */}
          </select>
        </div>
        <div>
          <Label className="text-gray-300">ZIP Code</Label>
          <Input
            value={value.zip}
            onChange={(e) => handleManualChange('zip', e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
            placeholder="33948"
            maxLength={10}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}
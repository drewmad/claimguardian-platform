'use client'

import { createBrowserSupabaseClient } from '@claimguardian/db'
import { Shield, Home, MapPin, Search, Loader2, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { logger } from "@/lib/logger/production-logger"

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGooglePlaces } from '@/hooks/use-google-maps'

// Google Maps types are declared in types/globals.d.ts

export default function PropertySetupPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [residencyType, setResidencyType] = useState<string>('')
  const addressInputRef = useRef<HTMLInputElement>(null)
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  
  // Use centralized Google Maps hook
  const { isLoaded: isGoogleLoaded, isLoading: isGoogleLoading, error: googleError } = useGooglePlaces()
  
  const [propertyData, setPropertyData] = useState({
    address: '',
    city: '',
    state: 'FL',
    zipCode: '',
    unit: '',
  })
  
  useEffect(() => {
    // Get user's residency type from profile
    async function fetchUserProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('residency_type')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setResidencyType(profile.residency_type)
        }
      }
    }
    fetchUserProfile()
  }, [supabase])

  // Google Maps loading is now handled by useGooglePlaces hook

  // Initialize autocomplete when Google is loaded
  useEffect(() => {
    if (!isGoogleLoaded || !addressInputRef.current || autocomplete) return

    const autocompleteInstance = new google.maps.places.Autocomplete(
      addressInputRef.current,
      {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'formatted_address', 'geometry']
      }
    )

    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace()
      
      if (place.formatted_address && place.address_components) {
        // Parse address components
        let address = ''
        let city = ''
        let state = ''
        let zipCode = ''

        place.address_components.forEach((component) => {
          const types = component.types
          if (types.includes('street_number') || types.includes('route')) {
            address = address ? `${address} ${component.long_name}` : component.long_name
          }
          if (types.includes('locality')) {
            city = component.long_name
          }
          if (types.includes('administrative_area_level_1')) {
            state = component.short_name
          }
          if (types.includes('postal_code')) {
            zipCode = component.long_name
          }
        })

        setPropertyData({
          address: address,
          city: city,
          state: state || 'FL',
          zipCode: zipCode,
          unit: propertyData.unit,
        })
        setSearchQuery(place.formatted_address)
      }
    })

    setAutocomplete(autocompleteInstance)

    return () => {
      if (autocompleteInstance) {
        google.maps.event.clearInstanceListeners(autocompleteInstance)
      }
    }
  }, [isGoogleLoaded, autocomplete, propertyData.unit])
  
  const handleManualAddressChange = (value: string) => {
    setSearchQuery(value)
    // If user types manually and autocomplete isn't working, allow manual entry
    if (!isGoogleLoaded) {
      const parts = value.split(',').map(p => p.trim())
      if (parts.length >= 2) {
        setPropertyData({
          address: parts[0],
          city: parts[1] || '',
          state: 'FL',
          zipCode: parts[2] || '',
          unit: propertyData.unit,
        })
      }
    }
  }
  
  const handleSubmit = async () => {
    if (!propertyData.address || !propertyData.city) {
      setError('Please enter a valid address')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      // Create property - store unit in metadata if provided
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert({
          user_id: user.id,
          address: propertyData.address,
          city: propertyData.city,
          state: propertyData.state,
          zip_code: propertyData.zipCode,
          metadata: propertyData.unit ? { unit: propertyData.unit } : {},
          property_type: 'residential',
          occupancy_status: 'owner_occupied',
        })
        .select()
        .single()
      
      if (propertyError) throw propertyError
      
      // Update user profile with primary property
      await supabase.from('profiles').update({
        primary_property_id: property.id
      }).eq('id', user.id)
      
      // Check if user is in Florida - if so, show disclosures
      if (propertyData.state === 'FL') {
        router.push('/dashboard?showFloridaDisclosures=true')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      logger.error('Error creating property:', err)
      setError(err instanceof Error ? err.message : 'Failed to save property')
    } finally {
      setIsLoading(false)
    }
  }
  
  const getResidencyMessage = () => {
    switch (residencyType) {
      case 'renter':
        return "Let's add your rental property so we can help protect your belongings"
      case 'homeowner':
        return "Let's add your home so we can help protect your investment"
      case 'landlord':
        return "Let's add your first property. You can add more properties later"
      case 'real_estate_pro':
        return "Let's add a property you manage or represent"
      default:
        return "Let's add your property to get started"
    }
  }
  
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white">Welcome to ClaimGuardian!</h1>
          <p className="text-gray-400 mt-2">{getResidencyMessage()}</p>
        </div>
        
        <Card className="p-8 bg-slate-900 border-slate-800">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="search" className="text-lg flex items-center gap-2 mb-3">
                <Home className="w-5 h-5 text-blue-500" />
                Property Address
              </Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  ref={addressInputRef}
                  value={searchQuery}
                  onChange={(e) => handleManualAddressChange(e.target.value)}
                  placeholder="Enter your address (e.g., 123 Main St, Miami, FL 33101)"
                  className="flex-1 bg-slate-800 border-slate-700 text-white"
                />
                <div className="flex items-center px-3 py-2 bg-slate-800 border border-slate-700 rounded-md">
                  {isGoogleLoaded ? (
                    <div className="flex items-center gap-1 text-green-400 text-xs">
                      <Check className="w-3 h-3" />
                      <span>Auto</span>
                    </div>
                  ) : isGoogleLoading ? (
                    <div className="flex items-center gap-1 text-yellow-400 text-xs">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Loading</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>Manual</span>
                    </div>
                  )}
                </div>
              </div>
              {isGoogleLoaded ? (
                <p className="text-xs text-green-400 mt-2">
                  ✓ Address autocomplete enabled - start typing your address
                </p>
              ) : isGoogleLoading ? (
                <p className="text-xs text-yellow-400 mt-2">
                  Loading address autocomplete...
                </p>
              ) : googleError ? (
                <p className="text-xs text-gray-400 mt-2">
                  Enter your address manually ({googleError})
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-2">
                  Enter your address manually (autocomplete not available)
                </p>
              )}
            </div>
            
            {(propertyData.address || propertyData.city) && (
              <div className="border-t border-slate-700 pt-6 space-y-4">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  Confirm Property Details
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={propertyData.address}
                      onChange={(e) => setPropertyData({ ...propertyData, address: e.target.value })}
                      className="mt-1 bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="unit">Unit/Apt (Optional)</Label>
                    <Input
                      id="unit"
                      value={propertyData.unit}
                      onChange={(e) => setPropertyData({ ...propertyData, unit: e.target.value })}
                      className="mt-1 bg-slate-800 border-slate-700 text-white"
                      placeholder="Apt 2B"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={propertyData.city}
                      onChange={(e) => setPropertyData({ ...propertyData, city: e.target.value })}
                      className="mt-1 bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={propertyData.state}
                      disabled
                      className="mt-1 bg-slate-800 border-slate-700 text-gray-400"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={propertyData.zipCode}
                      onChange={(e) => setPropertyData({ ...propertyData, zipCode: e.target.value })}
                      className="mt-1 bg-slate-800 border-slate-700 text-white"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-white"
            >
              Skip for now
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={!propertyData.address || !propertyData.city || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue to Dashboard
                  <Check className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </Card>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            You can add more properties and update details anytime from your dashboard
          </p>
        </div>
      </div>
    </div>
  )
}
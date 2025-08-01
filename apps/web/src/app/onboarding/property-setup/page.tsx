'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Home, MapPin, Search, Loader2, Check, AlertCircle } from 'lucide-react'
import { createBrowserSupabaseClient } from '@claimguardian/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export default function PropertySetupPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [residencyType, setResidencyType] = useState<string>('')
  
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
  }, [])
  
  const handleAddressSearch = async () => {
    // TODO: Integrate Google Places API for address autocomplete
    // For now, just use the search query
    if (searchQuery) {
      // Parse address (simple implementation)
      const parts = searchQuery.split(',').map(p => p.trim())
      if (parts.length >= 3) {
        setPropertyData({
          address: parts[0],
          city: parts[1],
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
      
      // Create property
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert({
          user_id: user.id,
          address: propertyData.address,
          city: propertyData.city,
          state: propertyData.state,
          zip_code: propertyData.zipCode,
          unit: propertyData.unit || null,
          is_primary: true,
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
      console.error('Error creating property:', err)
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter your address (e.g., 123 Main St, Miami, FL 33101)"
                  className="flex-1 bg-slate-800 border-slate-700 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
                />
                <Button
                  type="button"
                  onClick={handleAddressSearch}
                  variant="outline"
                  className="border-slate-700 hover:bg-slate-800"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Start typing and we'll help find your address
              </p>
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
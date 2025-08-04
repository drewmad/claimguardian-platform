/**
 * @fileMetadata
 * @purpose Property overview and management dashboard
 * @owner frontend-team
 * @dependencies ["react", "next", "lucide-react"]
 * @exports ["default"]
 * @complexity high
 * @tags ["dashboard", "property", "page"]
 * @status active
 */
'use client'

import { MapPin, Shield, Plus, ChevronRight, Loader2, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { getProperties } from '@/actions/properties'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { PropertyWizard } from '@/components/property/property-wizard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PropertyAvatar } from '@/components/ui/property-image'

interface DisplayProperty {
  id: string
  name: string
  address: string
  type: string
  value: number
  sqft: number
  yearBuilt: number
  bedrooms: number
  bathrooms: number
  lotSize: number
  insurabilityScore: number
  isPrimary: boolean
}

interface PropertyRecord {
  id: string;
  user_id: string;
  name: string;
  address: string;
  type: string;
  year_built: number;
  square_feet: number;
  value: number | null;
  insurability_score: number | null;
  is_primary: boolean | null;
  details: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function NoPropertyState({ onAddProperty }: { onAddProperty: () => void }) {
  return (
    <div className="text-center">
      <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <Home className="w-12 h-12 text-gray-500" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Welcome to Your Home Dashboard</h2>
      <p className="text-gray-400 mb-6">
        It looks like you haven't added your property yet.
      </p>
      <Button onClick={onAddProperty} size="lg">
        <Plus className="w-5 h-5 mr-2" />
        Add Your Home
      </Button>
    </div>
  )
}

function PropertyOverviewContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [property, setProperty] = useState<DisplayProperty | null>(null)
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    const loadProperty = async () => {
      setLoading(true)
      try {
        const result = await getProperties()
        if (result.error) throw result.error
        
        const propertiesData = result.data?.data || []
        
        if (propertiesData.length > 0) {
          const prop = propertiesData[0] as PropertyRecord
          const transformedData: DisplayProperty = {
            id: prop.id,
            name: prop.name || 'Unnamed Property',
            address: prop.address || 'Address not set',
            type: prop.type || 'Single Family Home',
            value: prop.value || 0,
            sqft: prop.square_feet || 0,
            yearBuilt: prop.year_built || new Date().getFullYear(),
            bedrooms: (prop.details?.bedrooms as number) || 0,
            bathrooms: (prop.details?.bathrooms as number) || 0,
            lotSize: (prop.details?.lot_size as number) || 0,
            insurabilityScore: prop.insurability_score || 0,
            isPrimary: prop.is_primary || false
          }
          setProperty(transformedData)
        } else {
          setProperty(null)
        }
      } catch (error) {
        console.error('Error loading property:', error)
        toast.error('Failed to load your property.')
        setProperty(null)
      } finally {
        setLoading(false)
      }
    }
    
    loadProperty()
  }, [])

  const handlePropertyClick = (propertyId: string | number) => {
    router.push(`/dashboard/property/${propertyId}`)
  }
  
  const handleWizardComplete = () => {
    setShowWizard(false)
    // Reload data
    const loadProperty = async () => {
      setLoading(true)
      try {
        const result = await getProperties()
        if (result.error) throw result.error
        
        const propertiesData = result.data?.data || []
        
        if (propertiesData.length > 0) {
          const prop = propertiesData[0] as PropertyRecord
          const transformedData: DisplayProperty = {
            id: prop.id,
            name: prop.name || 'Unnamed Property',
            address: prop.address || 'Address not set',
            type: prop.type || 'Single Family Home',
            value: prop.value || 0,
            sqft: prop.square_feet || 0,
            yearBuilt: prop.year_built || new Date().getFullYear(),
            bedrooms: (prop.details?.bedrooms as number) || 0,
            bathrooms: (prop.details?.bathrooms as number) || 0,
            lotSize: (prop.details?.lot_size as number) || 0,
            insurabilityScore: prop.insurability_score || 0,
            isPrimary: prop.is_primary || false
          }
          setProperty(transformedData)
        }
      } catch (error) {
        console.error('Error reloading property:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProperty()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-400">Loading your home...</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">My Home</h1>
            <p className="text-gray-400">
              Manage your property details and components
            </p>
          </div>

          {property ? (
            <Card 
              key={property.id} 
              className="bg-gray-800 border-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => handlePropertyClick(property.id)}
            >
              <div className="h-48 relative rounded-t-lg overflow-hidden">
                <PropertyAvatar
                  propertyType={property.type}
                  className="w-full h-full"
                />
              </div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-semibold text-white">{property.name}</h2>
                      {property.isPrimary && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">Primary</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {property.address}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Value</p>
                    <p className="text-lg font-bold text-cyan-300">${(property.value / 1000).toFixed(0)}k</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Type</p>
                    <p className="text-sm text-white font-medium">{property.type}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Size</p>
                    <p className="text-sm text-white font-medium">{property.sqft.toLocaleString()} sqft</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Built</p>
                    <p className="text-sm text-white font-medium">{property.yearBuilt}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-300">Insurability Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-cyan-500 rounded-full"
                        style={{ width: `${property.insurabilityScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white">{property.insurabilityScore}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-12">
                <NoPropertyState onAddProperty={() => setShowWizard(true)} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <PropertyWizard 
        open={showWizard} 
        onClose={() => setShowWizard(false)}
        onComplete={handleWizardComplete}
      />
    </DashboardLayout>
  )
}

export default function PropertyOverviewPage() {
  return (
    <ProtectedRoute>
      <PropertyOverviewContent />
    </ProtectedRoute>
  )
}
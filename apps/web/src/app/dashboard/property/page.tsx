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

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MapPin, Shield, CheckCircle, Plus, ChevronRight, Edit, Camera, Building, Loader2
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@claimguardian/ui'
import { getProperties } from '@/actions/properties'
import { toast } from 'sonner'
import { PropertyAvatar } from '@/components/ui/property-image'
import { PropertyWizard } from '@/components/property/property-wizard'

function PropertyOverviewContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<any[]>([])
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const { data, error } = await getProperties()
        if (error) throw error
        
        if (data && data.length > 0) {
          // Transform database data to display format with full address
          const transformedData = data.map((prop: any) => ({
            id: prop.id,
            name: prop.name || 'Unnamed Property',
            address: prop.address ? [
              prop.address.street1,
              prop.address.street2,
              prop.address.city,
              prop.address.state,
              prop.address.zip
            ].filter(Boolean).join(', ') : 'Address not set',
            type: prop.type || 'Single Family Home',
            value: prop.value || 0,
            sqft: prop.square_feet || 0,
            yearBuilt: prop.year_built || new Date().getFullYear(),
            bedrooms: prop.details?.bedrooms || 0,
            bathrooms: prop.details?.bathrooms || 0,
            lotSize: prop.details?.lot_size || 0,
            insurabilityScore: prop.insurability_score || 0,
            isPrimary: prop.is_primary || false
          }))
          setProperties(transformedData)
        } else {
          // If no properties, use mock data for demo
          setProperties([
            {
              id: 'demo-property-uuid',
              name: 'Main Residence',
              address: '1234 Main Street, Austin, TX 78701',
              type: 'Single Family Home',
              value: 450000,
              sqft: 2800,
              yearBuilt: 2010,
              bedrooms: 4,
              bathrooms: 3,
              lotSize: 0.25,
              insurabilityScore: 92,
              isPrimary: true
            }
          ])
        }
      } catch (error) {
        console.error('Error loading properties:', error)
        toast.error('Failed to load properties')
        // Use mock data as fallback
        setProperties([
          {
            id: 'demo-property-uuid',
            name: 'Main Residence',
            address: '1234 Main Street, Austin, TX 78701',
            type: 'Single Family Home',
            value: 450000,
            sqft: 2800,
            yearBuilt: 2010,
            bedrooms: 4,
            bathrooms: 3,
            lotSize: 0.25,
            insurabilityScore: 92,
            isPrimary: true
          }
        ])
      } finally {
        setLoading(false)
      }
    }
    
    loadProperties()
  }, [])

  // Refresh properties when returning to this page
  useEffect(() => {
    const handleFocus = () => {
      if (!loading) {
        const loadProperties = async () => {
          try {
            const { data, error } = await getProperties()
            if (error) throw error
            
            if (data && data.length > 0) {
              const transformedData = data.map((prop: any) => ({
                id: prop.id,
                name: prop.name || 'Unnamed Property',
                address: prop.address ? [
                  prop.address.street1,
                  prop.address.street2,
                  prop.address.city,
                  prop.address.state,
                  prop.address.zip
                ].filter(Boolean).join(', ') : 'Address not set',
                type: prop.type || 'Single Family Home',
                value: prop.value || 0,
                sqft: prop.square_feet || 0,
                yearBuilt: prop.year_built || new Date().getFullYear(),
                bedrooms: prop.details?.bedrooms || 0,
                bathrooms: prop.details?.bathrooms || 0,
                lotSize: prop.details?.lot_size || 0,
                insurabilityScore: prop.insurability_score || 0,
                isPrimary: prop.is_primary || false
              }))
              setProperties(transformedData)
            }
          } catch (error) {
            console.error('Error refreshing properties:', error)
          }
        }
        loadProperties()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loading])

  const pageTitle = properties.length === 1 ? 'My Home' : 'My Properties'

  const handlePropertyClick = (propertyId: string | number) => {
    router.push(`/dashboard/property/${propertyId}`)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-400">Loading properties...</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">{pageTitle}</h1>
            <p className="text-gray-400">
              {properties.length === 1 ? 'Manage your property details and components' : 'Overview of all your properties'}
            </p>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {properties.map((property) => (
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
            ))}

            {/* Add Property Card */}
            <Card 
              className="bg-gray-800/50 border-gray-700 border-dashed cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => setShowWizard(true)}
            >
              <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Add Property</h3>
                <p className="text-sm text-gray-400">
                  Add another property to track and manage
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          {properties.length > 1 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <Card className="bg-gray-800 border-gray-700 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{properties.length}</p>
                  <p className="text-xs text-gray-400">Properties</p>
                </div>
              </Card>
              <Card className="bg-gray-800 border-gray-700 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-cyan-300">
                    ${(properties.reduce((sum, p) => sum + p.value, 0) / 1000).toFixed(0)}k
                  </p>
                  <p className="text-xs text-gray-400">Total Value</p>
                </div>
              </Card>
              <Card className="bg-gray-800 border-gray-700 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {Math.round(properties.reduce((sum, p) => sum + p.insurabilityScore, 0) / properties.length)}%
                  </p>
                  <p className="text-xs text-gray-400">Avg. Score</p>
                </div>
              </Card>
              <Card className="bg-gray-800 border-gray-700 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {properties.reduce((sum, p) => sum + p.sqft, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">Total Sqft</p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Property Creation Wizard */}
      <PropertyWizard 
        open={showWizard} 
        onClose={() => setShowWizard(false)}
        onComplete={(propertyId) => {
          // Refresh properties list
          window.location.reload()
        }}
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
/**
 * @fileMetadata
 * @purpose Property overview and management dashboard with React Query
 * @owner frontend-team
 * @dependencies ["react", "next", "lucide-react", "@tanstack/react-query"]
 * @exports ["default"]
 * @complexity medium
 * @tags ["dashboard", "property", "page", "react-query"]
 * @status active
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Plus, ChevronRight, Building } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PropertyAvatar } from '@/components/ui/property-image'
import { PropertyWizard } from '@/components/property/property-wizard'
import { useProperties } from '@/hooks/queries/use-properties'
import { Skeleton } from '@/components/ui/skeleton'

function PropertyOverviewContent() {
  const router = useRouter()
  const [showWizard, setShowWizard] = useState(false)
  
  // Use React Query hook
  const { data: properties = [], isLoading, error } = useProperties()

  // Transform data for display
  const displayProperties = properties.map((prop) => ({
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

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <Card key={n} className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-3/4 bg-gray-700" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full bg-gray-700" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <p className="text-red-400">Failed to load properties. Please try again.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-white">Property Portfolio</h1>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Property
          </button>
        </div>
        <p className="text-gray-400 max-w-3xl">
          Manage your property portfolio and maintain digital records for insurance claims. 
          Keep important documents, photos, and maintenance records all in one secure place.
        </p>
      </div>

      {/* Properties Grid */}
      {displayProperties.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayProperties.map((property) => (
            <Card 
              key={property.id} 
              className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer overflow-hidden"
              onClick={() => router.push(`/dashboard/property/${property.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                      <Building className="w-5 h-5 text-gray-400" />
                      {property.name}
                      {property.isPrimary && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          Primary
                        </span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {property.address}
                    </p>
                  </div>
                  <PropertyAvatar 
                    propertyType={property.type}
                    className="w-12 h-12"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Value</p>
                    <p className="text-lg font-semibold text-white">
                      ${property.value.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Size</p>
                    <p className="text-lg font-semibold text-white">
                      {property.sqft.toLocaleString()} sqft
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Insurability Score</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2 w-24">
                        <div 
                          className={`h-2 rounded-full ${
                            property.insurabilityScore >= 80 ? 'bg-green-500' : 
                            property.insurabilityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${property.insurabilityScore}%` }}
                        />
                      </div>
                      <span className="text-white font-medium">{property.insurabilityScore}%</span>
                    </div>
                  </div>
                  
                  <div className="pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{property.bedrooms} bed</span>
                      <span>•</span>
                      <span>{property.bathrooms} bath</span>
                      <span>•</span>
                      <span>Built {property.yearBuilt}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="text-center py-12">
            <Building className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Properties Yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Add your first property to start building your digital property portfolio and protect your assets.
            </p>
            <button
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Property
            </button>
          </CardContent>
        </Card>
      )}

      {/* Property Wizard Modal */}
      {showWizard && (
        <PropertyWizard
          open={showWizard}
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            setShowWizard(false)
            // React Query will automatically refetch due to invalidation in the mutation
          }}
        />
      )}
    </div>
  )
}

export default function PropertyOverviewPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PropertyOverviewContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
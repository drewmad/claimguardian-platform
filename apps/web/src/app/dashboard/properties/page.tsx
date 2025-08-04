/**
 * @fileMetadata
 * @purpose Properties dashboard page showing all user properties with enrichment status
 * @owner property-team
 * @status active
 */

'use client'

import { Card } from '@claimguardian/ui'
import { Button } from '@claimguardian/ui'
import { 
  Plus, 
  Home, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  MoreVertical,
  Shield
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { logger } from "@/lib/logger/production-logger"

import { PropertyEnrichmentStatus } from '@/components/property/property-enrichment-status'
import { Badge } from '@/components/ui/badge'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { logger } from "@/lib/logger/production-logger"

interface Property {
  id: string
  name: string
  address: {
    street?: string
    city?: string
    state?: string
    zip?: string
    unit?: string
  }
  latitude?: number
  longitude?: number
  type: string
  is_primary: boolean
  created_at: string
  updated_at: string
  details?: {
    square_footage?: number
    year_built?: number
    bedrooms?: number
    bathrooms?: number
    lot_size?: number
    construction_type?: string
    roof_type?: string
    stories?: number
  }
  enrichment?: {
    version?: number
    enriched_at?: string
    flood_zone?: string
    elevation_meters?: number
    hurricane_evacuation_zone?: string
  }
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const supabase = createClient()

  const fetchProperties = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch properties with enrichment data
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          enrichment:property_enrichments(
            version,
            enriched_at,
            flood_zone,
            elevation_meters,
            hurricane_evacuation_zone
          )
        `)
        .eq('user_id', user.id)
        .eq('property_enrichments.is_current', true)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Error fetching properties:', error)
        toast.error('Failed to load properties')
        return
      }

      // Transform the data to include enrichment
      const transformedData = data?.map(property => ({
        ...property,
        enrichment: property.enrichment?.[0] || null
      })) || []

      setProperties(transformedData)
    } catch (error) {
      logger.error('Error:', error)
      toast.error('An error occurred while loading properties')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Properties</h1>
          <p className="text-gray-600 mt-1">
            Manage your properties and view enrichment data
          </p>
        </div>
        <Link href="/dashboard/properties/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No properties yet</h3>
            <p className="text-gray-600 mb-4">
              Add your first property to get started with ClaimGuardian
            </p>
            <Link href="/dashboard/properties/add">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Property
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Properties Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {properties.map(property => (
              <Card 
                key={property.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedProperty(property)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Home className="h-5 w-5" />
                        {property.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        {property.is_primary && (
                          <Badge variant="default" className="text-xs">Primary</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {property.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{property.address?.street || 'No address'}</span>
                    </div>
                    
                    {/* Enrichment Status */}
                    <div className="border-t pt-3">
                      {property.enrichment ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium">Data Enriched</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              v{property.enrichment.version}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>
                              <span className="font-medium">Flood:</span> {property.enrichment.flood_zone || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Elev:</span> {
                                property.enrichment.elevation_meters 
                                  ? `${property.enrichment.elevation_meters.toFixed(1)}m`
                                  : 'N/A'
                              }
                            </div>
                            <div>
                              <span className="font-medium">Hurricane:</span> {
                                property.enrichment.hurricane_evacuation_zone || 'None'
                              }
                            </div>
                            <div>
                              <span className="font-medium">Updated:</span> {
                                property.enrichment.enriched_at ? new Date(property.enrichment.enriched_at).toLocaleDateString() : 'N/A'
                              }
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-gray-600">Not enriched</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedProperty(property)
                        }}
                      >
                        <Eye className="mr-2 h-3 w-3" />
                        View Details
                      </Button>
                      <Link href={`/dashboard/claims/new?property=${property.id}`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Shield className="mr-2 h-3 w-3" />
                          New Claim
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Property Details */}
          {selectedProperty && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">
                Property Details: {selectedProperty.name}
              </h2>
              <PropertyEnrichmentStatus
                propertyId={selectedProperty.id}
                latitude={selectedProperty.latitude}
                longitude={selectedProperty.longitude}
                address={selectedProperty.address?.street}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
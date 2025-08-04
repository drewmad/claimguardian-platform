/**
 * @fileMetadata
 * @purpose Display property enrichment status and captured data
 * @owner property-team
 * @status active
 */

'use client'

import { Card } from '@claimguardian/ui'
import { Button } from '@claimguardian/ui'
import { 
  AlertCircle, 
  MapPin, 
  Mountain, 
  Shield, 
  Home,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'

import { enrichPropertyData } from '@/actions/property-enrichment'
import { Badge } from '@/components/ui/badge'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

interface PropertyEnrichmentData {
  id: string
  version: number
  is_current: boolean
  
  // Location
  plus_code?: string
  neighborhood?: string
  census_tract?: string
  county: string
  state_code: string
  formatted_address: string
  address_components?: Record<string, unknown>
  
  // Elevation & Risk
  elevation_meters?: number
  elevation_resolution?: number
  flood_zone?: string
  flood_risk_score?: number
  
  // Visual Documentation
  street_view_data?: {
    front?: string
    left?: string
    right?: string
    rear?: string
    available?: boolean
  }
  aerial_view_data?: {
    url?: string
    zoom?: number
    available?: boolean
  }
  imagery_captured_at?: string
  
  // Emergency Services
  fire_protection?: {
    protection_class?: string | number
    department_name?: string
    distance_miles?: number
    response_time_minutes?: number
    nearest_station?: {
      name: string
      distance_meters: number
    }
  }
  medical_services?: {
    nearest_hospital?: {
      name: string
      distance_meters: number
    }
    distance_miles?: number
    trauma_level?: string
  }
  police_services?: {
    department_name?: string
    distance_miles?: number
    response_time_minutes?: number
    nearest_station?: {
      name: string
      distance_meters: number
    }
  }
  
  // Risk Assessment
  distance_to_coast_meters?: number
  hurricane_evacuation_zone?: string
  storm_surge_zone?: string
  wind_zone?: string
  
  // Insurance Factors
  insurance_risk_factors?: {
    overall_score?: number
    flood_risk?: number
    wind_risk?: number
    fire_risk?: number
    crime_risk?: number
    fire_score?: number
    flood_score?: number
    wind_score?: number
  }
  insurance_territory_code?: string
  
  // Metadata
  source_apis?: Record<string, unknown>
  api_costs?: {
    total?: number
    [key: string]: number | undefined
  }
  enriched_at: string
  expires_at?: string
}

interface PropertyEnrichmentStatusProps {
  propertyId: string
  latitude?: number
  longitude?: number
  address?: string
  placeId?: string
}

export function PropertyEnrichmentStatus({
  propertyId,
  latitude,
  longitude,
  address,
  placeId
}: PropertyEnrichmentStatusProps) {
  const [enrichmentData, setEnrichmentData] = useState<PropertyEnrichmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [enriching, setEnriching] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showImages, setShowImages] = useState(false)
  const supabase = createClient()

  const fetchEnrichmentData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('property_enrichments')
        .select('*')
        .eq('property_id', propertyId)
        .eq('is_current', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching enrichment data:', error)
      }

      setEnrichmentData(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [propertyId, supabase])

  useEffect(() => {
    fetchEnrichmentData()
  }, [fetchEnrichmentData])

  async function handleEnrich() {
    if (!latitude || !longitude || !address) {
      toast.error('Missing property location data')
      return
    }

    setEnriching(true)
    try {
      const result = await enrichPropertyData({
        propertyId,
        latitude,
        longitude,
        address,
        placeId
      })

      if (result.success) {
        toast.success(result.message || 'Property enriched successfully')
        await fetchEnrichmentData()
      } else {
        toast.error(result.error || 'Failed to enrich property')
      }
    } catch {
      toast.error('An error occurred while enriching property')
    } finally {
      setEnriching(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isEnriched = !!enrichmentData
  const isExpired = enrichmentData?.expires_at && new Date(enrichmentData.expires_at) < new Date()

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Property Data Enrichment
            </CardTitle>
            <div className="flex items-center gap-2">
              {isEnriched ? (
                <>
                  <Badge variant={isExpired ? 'outline' : 'default'}>
                    {isExpired ? 'Data Expired' : 'Enriched'}
                  </Badge>
                  <Badge variant="outline">v{enrichmentData.version}</Badge>
                </>
              ) : (
                <Badge variant="secondary">Not Enriched</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isEnriched ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Property data has not been enriched yet. Enrich now to get comprehensive risk assessment and documentation.
              </p>
              <Button 
                onClick={handleEnrich}
                disabled={enriching || !latitude || !longitude}
              >
                {enriching ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Enriching...
                  </>
                ) : (
                  'Enrich Property Data'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Mountain className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Elevation</p>
                  <p className="text-lg font-semibold">
                    {enrichmentData.elevation_meters?.toFixed(1)}m
                  </p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Home className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Flood Zone</p>
                  <p className="text-lg font-semibold">
                    {enrichmentData.flood_zone || 'N/A'}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Shield className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Hurricane Zone</p>
                  <p className="text-lg font-semibold">
                    {enrichmentData.hurricane_evacuation_zone || 'None'}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <MapPin className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Protection Class</p>
                  <p className="text-lg font-semibold">
                    {enrichmentData.fire_protection?.protection_class || 'N/A'}/10
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="mr-2 h-4 w-4" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2 h-4 w-4" />
                      Show Details
                    </>
                  )}
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowImages(!showImages)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {showImages ? 'Hide' : 'View'} Images
                </Button>
                
                {isExpired && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleEnrich}
                    disabled={enriching}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Data
                  </Button>
                )}
              </div>

              {/* Detailed Data */}
              {showDetails && (
                <div className="border-t pt-4 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Location Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">County:</span> {enrichmentData.county}
                      </div>
                      <div>
                        <span className="text-gray-600">Neighborhood:</span> {enrichmentData.neighborhood || 'N/A'}
                      </div>
                      <div>
                        <span className="text-gray-600">Plus Code:</span> {enrichmentData.plus_code || 'N/A'}
                      </div>
                      <div>
                        <span className="text-gray-600">Census Tract:</span> {enrichmentData.census_tract || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Risk Assessment</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Flood Risk Score:</span> {enrichmentData.flood_risk_score}/10
                      </div>
                      <div>
                        <span className="text-gray-600">Wind Zone:</span> {enrichmentData.wind_zone || 'N/A'}
                      </div>
                      <div>
                        <span className="text-gray-600">Storm Surge Zone:</span> {enrichmentData.storm_surge_zone || 'None'}
                      </div>
                      <div>
                        <span className="text-gray-600">Distance to Coast:</span> {
                          enrichmentData.distance_to_coast_meters 
                            ? `${(enrichmentData.distance_to_coast_meters / 1000).toFixed(1)} km`
                            : 'N/A'
                        }
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Emergency Services</h4>
                    <div className="space-y-1 text-sm">
                      {enrichmentData.fire_protection?.nearest_station && (
                        <div>
                          <span className="text-gray-600">Fire Station:</span> {enrichmentData.fire_protection.nearest_station.name} 
                          ({(enrichmentData.fire_protection.nearest_station.distance_meters / 1000).toFixed(1)} km)
                        </div>
                      )}
                      {enrichmentData.medical_services?.nearest_hospital && (
                        <div>
                          <span className="text-gray-600">Hospital:</span> {enrichmentData.medical_services.nearest_hospital.name}
                          ({(enrichmentData.medical_services.nearest_hospital.distance_meters / 1000).toFixed(1)} km)
                        </div>
                      )}
                      {enrichmentData.police_services?.nearest_station && (
                        <div>
                          <span className="text-gray-600">Police:</span> {enrichmentData.police_services.nearest_station.name}
                          ({(enrichmentData.police_services.nearest_station.distance_meters / 1000).toFixed(1)} km)
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Insurance Factors</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Fire Score:</span> {enrichmentData.insurance_risk_factors?.fire_score}/10
                      </div>
                      <div>
                        <span className="text-gray-600">Flood Score:</span> {enrichmentData.insurance_risk_factors?.flood_score}/10
                      </div>
                      <div>
                        <span className="text-gray-600">Wind Score:</span> {enrichmentData.insurance_risk_factors?.wind_score}/10
                      </div>
                      <div>
                        <span className="text-gray-600">Overall Score:</span> {enrichmentData.insurance_risk_factors?.overall_score}/10
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-gray-600 text-sm">Territory Code:</span> {enrichmentData.insurance_territory_code}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    <p>Data enriched on: {new Date(enrichmentData.enriched_at).toLocaleDateString()}</p>
                    <p>Total API cost: ${enrichmentData.api_costs?.total || 0}</p>
                  </div>
                </div>
              )}

              {/* Image Gallery */}
              {showImages && enrichmentData.street_view_data && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Property Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(enrichmentData.street_view_data).map(([direction, data]) => {
                      if (direction === 'available') return null
                      return (
                        <div key={direction} className="text-center">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                            <Image 
                              src={typeof data === 'string' ? data : ''} 
                              alt={`Street view ${direction}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <p className="text-xs text-gray-600 mt-1 capitalize">{direction}</p>
                        </div>
                      )
                    })}
                  </div>
                  
                  {enrichmentData.aerial_view_data && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Aerial Views</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {Object.entries(enrichmentData.aerial_view_data).map(([zoom, url]) => (
                          <div key={zoom} className="text-center">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                              <Image 
                                src={url as string} 
                                alt={`Aerial view ${zoom}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <p className="text-xs text-gray-600 mt-1">Zoom: {zoom.replace('zoom_', '')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
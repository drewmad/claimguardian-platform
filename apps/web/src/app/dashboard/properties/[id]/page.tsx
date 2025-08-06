/**
 * @fileMetadata
 * @purpose "Individual property detail page with location map, information, and editing capabilities"
 * @dependencies ["@/actions","@/components","@/lib","@claimguardian/db","@claimguardian/ui","@/components/maps"]
 * @owner property-team
 * @status stable
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PropertyLocationMap } from '@/components/maps'
import { 
  MapPin, 
  Home, 
  Edit, 
  Calendar,
  DollarSign,
  Ruler,
  Building,
  Shield,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Save,
  X
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger/production-logger'

interface Property {
  id: string
  street_address: string
  city: string
  state: string
  zip_code: string
  county_name?: string
  full_address: string
  location?: { coordinates?: [number, number] } | null
  property_type: string
  occupancy_status?: string
  year_built?: number
  square_footage?: number
  lot_size_acres?: number
  bedrooms?: number
  bathrooms?: number
  stories: number
  garage_spaces: number
  pool: boolean
  current_value?: number
  purchase_price?: number
  purchase_date?: string
  metadata: Record<string, unknown>
  version: number
  created_at: string
  updated_at: string
  enrichment?: {
    version?: number
    enriched_at?: string
    flood_zone?: string
    elevation_meters?: number
    hurricane_evacuation_zone?: string
  }
}

export default function PropertyDetailPage() {
  const params = useParams()
  const propertyId = params.id as string
  
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditingLocation, setIsEditingLocation] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const supabase = createClient()

  const fetchProperty = useCallback(async () => {
    if (!propertyId) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to view property details')
        return
      }

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
        .eq('id', propertyId)
        .eq('user_id', user.id)
        .eq('is_current', true)
        .eq('property_enrichments.is_current', true)
        .single()

      if (error) {
        logger.error('Error fetching property:', error)
        toast.error('Failed to load property details')
        return
      }

      if (data) {
        setProperty({
          ...data,
          enrichment: data.enrichment?.[0] || null
        })
      }
    } catch (error) {
      logger.error('Error:', error)
      toast.error('An error occurred while loading property details')
    } finally {
      setLoading(false)
    }
  }, [propertyId, supabase])

  useEffect(() => {
    fetchProperty()
  }, [fetchProperty])

  const handleLocationConfirm = async (coordinates: [number, number]) => {
    if (!property) return
    
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Update the property location
      const { error } = await supabase
        .from('properties')
        .update({
          location: {
            type: 'Point',
            coordinates: coordinates
          }
        })
        .eq('id', property.id)
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      setProperty(prev => prev ? {
        ...prev,
        location: { coordinates }
      } : null)

      setIsEditingLocation(false)
      toast.success('Property location confirmed successfully')
      
    } catch (error) {
      logger.error('Error updating location:', error)
      toast.error('Failed to update property location')
    } finally {
      setSaving(false)
    }
  }

  const handleLocationEdit = () => {
    setIsEditingLocation(true)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Property Not Found</h3>
            <p className="text-gray-600 mb-4">
              The property you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link href="/dashboard/properties">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Properties
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const propertyName = (property.metadata as { name?: string })?.name || 'Property Details'
  const coordinates = property.location?.coordinates as [number, number] | undefined

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/properties">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Properties
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{propertyName}</h1>
            <div className="flex items-center gap-2 text-gray-600 mt-1">
              <MapPin className="h-4 w-4" />
              <span>{property.street_address}, {property.city}, {property.state} {property.zip_code}</span>
            </div>
          </div>
        </div>

        {/* Location Status */}
        <div className="flex items-center gap-2">
          {coordinates ? (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Location Confirmed
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-orange-600 border-orange-600">
              <AlertCircle className="mr-1 h-3 w-3" />
              Location Estimated
            </Badge>
          )}
          {property.enrichment && (
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              <Shield className="mr-1 h-3 w-3" />
              AI Enriched
            </Badge>
          )}
        </div>
      </div>

      {/* Property Location Map */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Property Location
            </div>
            {!isEditingLocation && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLocationEdit}
                disabled={saving}
              >
                <Edit className="mr-2 h-4 w-4" />
                {coordinates ? 'Edit Location' : 'Confirm Location'}
              </Button>
            )}
            {isEditingLocation && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditingLocation(false)}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyLocationMap
            property={{
              id: property.id,
              name: propertyName,
              address: property.full_address,
              coordinates: coordinates,
              type: property.property_type,
              value: property.current_value || 0,
              insuranceStatus: 'active',
              lastUpdated: new Date(property.updated_at)
            }}
            isEditing={isEditingLocation}
            onLocationConfirm={handleLocationConfirm}
            onLocationEdit={handleLocationEdit}
            showNeighborhood={true}
            height="500px"
          />
        </CardContent>
      </Card>

      {/* Property Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Property Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Property Type:</span>
                <span className="font-medium capitalize">
                  {property.property_type.replace(/_/g, ' ')}
                </span>
              </div>
              
              {property.year_built && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Year Built:</span>
                  <span className="font-medium">{property.year_built}</span>
                </div>
              )}
              
              {property.square_footage && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Square Footage:</span>
                  <span className="font-medium">{property.square_footage.toLocaleString()} sq ft</span>
                </div>
              )}
              
              {property.lot_size_acres && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Lot Size:</span>
                  <span className="font-medium">{property.lot_size_acres} acres</span>
                </div>
              )}
              
              {property.bedrooms && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Bedrooms:</span>
                  <span className="font-medium">{property.bedrooms}</span>
                </div>
              )}
              
              {property.bathrooms && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Bathrooms:</span>
                  <span className="font-medium">{property.bathrooms}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Stories:</span>
                <span className="font-medium">{property.stories}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Garage Spaces:</span>
                <span className="font-medium">{property.garage_spaces}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Pool:</span>
                <span className="font-medium">{property.pool ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {property.current_value && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Value:</span>
                  <span className="font-medium">${property.current_value.toLocaleString()}</span>
                </div>
              )}
              
              {property.purchase_price && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Purchase Price:</span>
                  <span className="font-medium">${property.purchase_price.toLocaleString()}</span>
                </div>
              )}
              
              {property.purchase_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Purchase Date:</span>
                  <span className="font-medium">
                    {new Date(property.purchase_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Added to ClaimGuardian:</span>
                <span className="font-medium">
                  {new Date(property.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">
                  {new Date(property.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enrichment Information */}
        {property.enrichment && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                AI Property Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {property.enrichment.flood_zone && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Flood Zone</div>
                    <div className="font-medium">{property.enrichment.flood_zone}</div>
                  </div>
                )}
                
                {property.enrichment.elevation_meters && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Elevation</div>
                    <div className="font-medium">{property.enrichment.elevation_meters}m</div>
                  </div>
                )}
                
                {property.enrichment.hurricane_evacuation_zone && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Hurricane Zone</div>
                    <div className="font-medium">{property.enrichment.hurricane_evacuation_zone}</div>
                  </div>
                )}
              </div>
              
              {property.enrichment.enriched_at && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Analysis completed on {new Date(property.enrichment.enriched_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
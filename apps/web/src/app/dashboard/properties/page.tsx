/**
 * @fileMetadata
 * @purpose "Properties dashboard page showing all user properties with enrichment status"
 * @dependencies ["@/actions","@/components","@/lib","@claimguardian/db","@claimguardian/ui"]
 * @owner property-team
 * @status stable
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
  Shield,
  Lock,
  Users,
  TrendingUp,
  Crown
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { logger } from "@/lib/logger/production-logger"

import { PropertyEnrichmentStatus } from '@/components/property/property-enrichment-status'
import { PropertyLimitModal } from '@/components/property/property-limit-modal'
import { Badge } from '@/components/ui/badge'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/auth-provider'
import { checkPropertyLimit, getPropertyPricing } from '@/actions/user-tiers'
import { UserTier } from '@/lib/permissions/permission-checker'
type Json = Record<string, unknown> | unknown[] | string | number | boolean | null

interface Property {
  id: string
  street_address: string
  city: string
  state: string
  zip_code: string
  county_name?: string
  full_address: string
  location?: Json
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
  // Temporal fields
  version_id: string
  valid_from: string
  valid_to: string
  is_current: boolean
  enrichment?: {
    version?: number
    enriched_at?: string
    flood_zone?: string
    elevation_meters?: number
    hurricane_evacuation_zone?: string
  }
}

interface PropertyLimitInfo {
  canAdd: boolean
  currentCount: number
  limit: number
  remaining: number
  tier: UserTier
  requiresUpgrade: boolean
}

interface PropertyPricing {
  currentTier: UserTier
  pricePerProperty: number
  freeLimit: number
  currentCount: number
  additionalPropertiesNeeded: number
  monthlyAdditionalCost: number
  nextPropertyCost: number
  isUnlimited: boolean
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [limitInfo, setLimitInfo] = useState<PropertyLimitInfo | null>(null)
  const [pricing, setPricing] = useState<PropertyPricing | null>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [limitLoading, setLimitLoading] = useState(true)
  
  const { user } = useAuth()
  const supabase = createClient()

  const fetchProperties = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch current properties with enrichment data
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
        .eq('is_current', true) // Only get current versions
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

  const fetchLimitInfo = useCallback(async () => {
    if (!user) return

    try {
      setLimitLoading(true)
      
      const [limitResult, pricingResult] = await Promise.all([
        checkPropertyLimit(user.id),
        getPropertyPricing(user.id)
      ])

      if (limitResult.data) {
        setLimitInfo(limitResult.data)
      }

      if (pricingResult.data) {
        setPricing(pricingResult.data)
      }
    } catch (error) {
      logger.error('Error fetching limit info:', error)
    } finally {
      setLimitLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchProperties()
    fetchLimitInfo()
  }, [fetchProperties, fetchLimitInfo])

  const getTierIcon = (tier: UserTier) => {
    switch (tier) {
      case 'free': return <Users className="h-4 w-4" />
      case 'renter': return <Home className="h-4 w-4" />
      case 'essential': return <Shield className="h-4 w-4" />
      case 'plus': return <TrendingUp className="h-4 w-4" />
      case 'pro': return <Crown className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getTierColor = (tier: UserTier) => {
    switch (tier) {
      case 'free': return 'border-gray-500 text-gray-500'
      case 'renter': return 'border-blue-500 text-blue-500'
      case 'essential': return 'border-green-500 text-green-500'
      case 'plus': return 'border-purple-500 text-purple-500'
      case 'pro': return 'border-yellow-500 text-yellow-500'
      default: return 'border-gray-500 text-gray-500'
    }
  }

  const handleAddProperty = () => {
    if (!limitInfo || !user) {
      toast.error('Unable to check property limits')
      return
    }

    if (limitInfo.canAdd) {
      // User can add more properties within their tier
      window.location.href = '/dashboard/properties/add'
    } else {
      // Show limit modal
      setShowLimitModal(true)
    }
  }

  const handleUpgrade = () => {
    setShowLimitModal(false)
    window.location.href = '/pricing'
  }

  const handlePayPerProperty = () => {
    setShowLimitModal(false)
    toast.success('Additional property slot added! You can now add another property.')
    // Refresh limits after payment
    fetchLimitInfo()
  }

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
        <div className="flex items-center gap-4">
          {!limitLoading && limitInfo && (
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getTierColor(limitInfo.tier)}>
                  <div className="flex items-center gap-1">
                    {getTierIcon(limitInfo.tier)}
                    <span className="capitalize">{limitInfo.tier}</span>
                  </div>
                </Badge>
                <span>{limitInfo.currentCount} of {limitInfo.limit === 999999 ? '∞' : limitInfo.limit} properties</span>
              </div>
              {limitInfo.limit !== 999999 && (
                <div className="mt-1">
                  <Progress 
                    value={(limitInfo.currentCount / limitInfo.limit) * 100} 
                    className="h-2 w-32"
                  />
                </div>
              )}
            </div>
          )}
          <Button onClick={handleAddProperty} disabled={limitLoading}>
            {limitInfo?.canAdd ? (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Add Property
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Property Limits Info Card */}
      {!limitLoading && limitInfo && pricing && !limitInfo.canAdd && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Lock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Property Limit Reached</h3>
                  <p className="text-sm text-gray-600">
                    Your {limitInfo.tier} plan includes {limitInfo.limit} properties. 
                    {pricing.pricePerProperty > 0 && (
                      <span> Additional properties are ${pricing.pricePerProperty}/month each.</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setShowLimitModal(true)}
                >
                  View Options
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                        {(property.metadata as { name?: string })?.name || property.full_address}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        {property.occupancy_status === 'owner_occupied' && (
                          <Badge variant="default" className="text-xs">Primary</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {property.property_type.replace('_', ' ')}
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
                      <span>{property.full_address}</span>
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
                Property Details: {(selectedProperty.metadata as { name?: string })?.name || selectedProperty.full_address}
              </h2>
              <PropertyEnrichmentStatus
                propertyId={selectedProperty.id}
                latitude={selectedProperty.location ? (JSON.parse(selectedProperty.location) as { coordinates: [number, number] }).coordinates[1] : undefined}
                longitude={selectedProperty.location ? (JSON.parse(selectedProperty.location) as { coordinates: [number, number] }).coordinates[0] : undefined}
                address={selectedProperty.street_address}
              />
            </div>
          )}
        </div>
      )}

      {/* Property Limit Modal */}
      <PropertyLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onUpgrade={handleUpgrade}
        onPayPerProperty={handlePayPerProperty}
        userId={user?.id || ''}
      />
    </div>
  )
}

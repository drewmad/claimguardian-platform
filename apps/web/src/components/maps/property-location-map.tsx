/**
 * @fileMetadata
 * @purpose "Property location map showing single property with neighborhood context and location confirmation"
 * @owner frontend-team
 * @dependencies ["react", "mapbox-gl", "@/components/maps/florida-property-map"]
 * @exports ["PropertyLocationMap"]
 * @complexity medium
 * @tags ["maps", "property", "location", "address-confirmation"]
 * @status stable
 */
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { MapPin, Navigation, Home, Info, Edit, Check, X } from 'lucide-react'
import { FloridaPropertyMap } from './florida-property-map'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PropertyLocationMapProps {
  property: {
    id: string
    name: string
    address: string
    coordinates?: [number, number]
    type: string
    value: number
    insuranceStatus?: 'active' | 'expired' | 'pending' | 'none'
    lastUpdated?: Date
  }
  isEditing?: boolean
  onLocationConfirm?: (coordinates: [number, number]) => void
  onLocationEdit?: () => void
  showNeighborhood?: boolean
  height?: string
  className?: string
}

interface NearbyProperty {
  id: string
  name: string
  address: string
  coordinates: [number, number]
  type: 'single_family' | 'condo' | 'townhouse' | 'commercial' | 'multi_family'
  value: number
  insuranceStatus: 'active' | 'expired' | 'pending' | 'none'
  claimsCount: number
  riskLevel: 'low' | 'medium' | 'high'
  county: string
  lastUpdated: Date
  isMainProperty?: boolean
}

export function PropertyLocationMap({
  property,
  isEditing = false,
  onLocationConfirm,
  onLocationEdit,
  showNeighborhood = true,
  height = '400px',
  className = ''
}: PropertyLocationMapProps) {
  const [tempCoordinates, setTempCoordinates] = useState<[number, number] | null>(null)
  const [isConfirmingLocation, setIsConfirmingLocation] = useState(false)
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets')

  // Default coordinates based on address parsing or fallback to Florida center
  const defaultCoordinates = useMemo((): [number, number] => {
    if (property.coordinates) {
      return property.coordinates
    }

    // Simple geocoding fallback for common Florida cities
    const addressLower = property.address.toLowerCase()
    
    if (addressLower.includes('port charlotte')) {
      return [-82.0907, 26.9762]
    } else if (addressLower.includes('miami')) {
      return [-80.1918, 25.7617]
    } else if (addressLower.includes('tampa')) {
      return [-82.4572, 27.9506]
    } else if (addressLower.includes('orlando')) {
      return [-81.3792, 28.5383]
    } else if (addressLower.includes('jacksonville')) {
      return [-81.6557, 30.3322]
    } else if (addressLower.includes('fort lauderdale')) {
      return [-80.1373, 26.1224]
    } else if (addressLower.includes('naples')) {
      return [-81.7948, 26.1420]
    }
    
    // Default to center of Florida
    return [-82.4572, 27.9506]
  }, [property.coordinates, property.address])

  // Generate nearby properties for context (mock data)
  const nearbyProperties = useMemo((): NearbyProperty[] => {
    const baseCoords = tempCoordinates || property.coordinates || defaultCoordinates
    const mainProperty: NearbyProperty = {
      id: property.id,
      name: property.name,
      address: property.address,
      coordinates: baseCoords,
      type: 'single_family',
      value: property.value,
      insuranceStatus: property.insuranceStatus || 'active',
      claimsCount: 0,
      riskLevel: 'low',
      county: 'Unknown',
      lastUpdated: new Date(),
      isMainProperty: true
    }

    if (!showNeighborhood) {
      return [mainProperty]
    }

    // Generate mock nearby properties
    const nearby: NearbyProperty[] = []
    for (let i = 0; i < 8; i++) {
      // Generate coordinates within ~0.01 degree radius (roughly 1 mile)
      const offsetLat = (Math.random() - 0.5) * 0.02
      const offsetLng = (Math.random() - 0.5) * 0.02
      
      nearby.push({
        id: `nearby-${i}`,
        name: `Nearby Property ${i + 1}`,
        address: `${1234 + i * 12} ${['Oak St', 'Pine Ave', 'Maple Dr', 'Cedar Ln'][i % 4]}, ${property.address.split(',').slice(-2).join(',')}`,
        coordinates: [baseCoords[0] + offsetLng, baseCoords[1] + offsetLat],
        type: ['single_family', 'condo', 'townhouse'][i % 3] as any,
        value: Math.round((200000 + Math.random() * 400000) / 10000) * 10000,
        insuranceStatus: ['active', 'active', 'expired', 'pending'][i % 4] as any,
        claimsCount: Math.floor(Math.random() * 3),
        riskLevel: ['low', 'medium', 'high'][i % 3] as any,
        county: 'Unknown',
        lastUpdated: new Date()
      })
    }

    return [mainProperty, ...nearby]
  }, [property, tempCoordinates, defaultCoordinates, showNeighborhood])

  const handleMapClick = useCallback((coordinates: [number, number]) => {
    if (isEditing) {
      setTempCoordinates(coordinates)
      setIsConfirmingLocation(true)
    }
  }, [isEditing])

  const confirmLocation = () => {
    if (tempCoordinates && onLocationConfirm) {
      onLocationConfirm(tempCoordinates)
    }
    setIsConfirmingLocation(false)
    setTempCoordinates(null)
  }

  const cancelLocationEdit = () => {
    setTempCoordinates(null)
    setIsConfirmingLocation(false)
  }

  const currentCoordinates = tempCoordinates || property.coordinates || defaultCoordinates

  return (
    <div className={`relative ${className}`}>
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-white font-medium">Property Location</span>
            {!property.coordinates && (
              <Badge variant="secondary" className="text-xs">
                Estimated
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-neighborhood"
                checked={showNeighborhood}
                onChange={(e) => {
                  // This would need to be controlled by parent component
                  // For now, just show the checkbox state
                }}
                className="rounded border-gray-600 bg-gray-700 text-green-500"
              />
              <label htmlFor="show-neighborhood" className="text-xs text-gray-300">
                Show Neighborhood
              </label>
            </div>
          </div>
        </div>

        {/* Map Style Toggle */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 border border-gray-600">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={mapStyle === 'streets' ? 'default' : 'outline'}
              onClick={() => setMapStyle('streets')}
              className="text-xs h-7"
            >
              Streets
            </Button>
            <Button
              size="sm"
              variant={mapStyle === 'satellite' ? 'default' : 'outline'}
              onClick={() => setMapStyle('satellite')}
              className="text-xs h-7"
            >
              Satellite
            </Button>
          </div>
        </div>
      </div>

      {/* Location Editing Panel */}
      {isEditing && (
        <div className="absolute top-4 right-4 z-10 w-80">
          <Card className="bg-gray-800/95 backdrop-blur-sm border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Confirm Property Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Current Address:</div>
                  <div className="text-sm text-white">{property.address}</div>
                </div>
                
                {isConfirmingLocation && tempCoordinates && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1">New Location:</div>
                    <div className="text-sm text-white">
                      {tempCoordinates[1].toFixed(6)}, {tempCoordinates[0].toFixed(6)}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-400">
                  {isConfirmingLocation 
                    ? "Click 'Confirm' to save the new location, or 'Cancel' to keep the current one."
                    : "Click anywhere on the map to set the exact property location."
                  }
                </div>

                {isConfirmingLocation ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={confirmLocation}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelLocationEdit}
                      className="flex-1 text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onLocationEdit}
                    className="w-full text-xs"
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    Use GPS Location
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Property Details Panel */}
      {!isEditing && (
        <div className="absolute bottom-4 right-4 z-10 w-72">
          <Card className="bg-gray-800/95 backdrop-blur-sm border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-medium text-sm">{property.name}</h3>
                  <p className="text-xs text-gray-400">{property.address}</p>
                </div>
                <Home className="w-5 h-5 text-blue-400" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Property Type:</span>
                  <span className="text-white">{property.type}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Estimated Value:</span>
                  <span className="text-white">${(property.value / 1000).toFixed(0)}K</span>
                </div>
                
                {property.insuranceStatus && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Insurance:</span>
                    <Badge 
                      variant={property.insuranceStatus === 'active' ? 'outline' : 'destructive'} 
                      className="text-xs"
                    >
                      {property.insuranceStatus}
                    </Badge>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Location:</span>
                  <span className={`text-xs ${property.coordinates ? 'text-green-400' : 'text-orange-400'}`}>
                    {property.coordinates ? 'Confirmed' : 'Estimated'}
                  </span>
                </div>
              </div>

              {!property.coordinates && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <Button
                    size="sm"
                    onClick={onLocationEdit}
                    className="w-full text-xs h-7"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Confirm Location
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Map */}
      <FloridaPropertyMap
        properties={nearbyProperties}
        center={currentCoordinates}
        zoom={showNeighborhood ? 15 : 17}
        onPropertyClick={() => {}} // Handle clicks in parent
        height={height}
        mapStyle={
          mapStyle === 'streets' 
            ? 'mapbox://styles/mapbox/streets-v12' 
            : 'mapbox://styles/mapbox/satellite-streets-v12'
        }
        onClick={handleMapClick}
        showPropertyDetails={false}
      />

      {/* Accuracy Notice */}
      {!property.coordinates && !isEditing && (
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-orange-900/90 backdrop-blur-sm rounded-lg p-3 border border-orange-600 max-w-xs">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-medium text-orange-200">Estimated Location</div>
                <div className="text-xs text-orange-300 mt-1">
                  This location is estimated from the address. Click "Confirm Location" to set the exact position.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
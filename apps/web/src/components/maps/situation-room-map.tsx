/**
 * @fileMetadata
 * @purpose "Situation Room specialized map showing property threats, incidents, and real-time intelligence"
 * @owner frontend-team
 * @dependencies ["react", "mapbox-gl", "@/components/maps/florida-property-map", "@/types/situation-room"]
 * @exports ["SituationRoomMap"]
 * @complexity medium
 * @tags ["maps", "situation-room", "threats", "real-time"]
 * @status stable
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, Users, Shield, Zap, Phone, Radio, Navigation } from 'lucide-react'
import { FloridaPropertyMap } from './florida-property-map'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { 
  ThreatAssessment, 
  CommunityIncident,
  PropertyStatus
} from '@/types/situation-room'
import { ThreatLevel } from '@/types/situation-room'

interface Property {
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
  // Situation Room specific fields
  threatLevel?: ThreatLevel
  hasActiveThreats?: boolean
  emergencyMode?: boolean
  systemsOnline?: number
  totalSystems?: number
}

interface ThreatMarker {
  id: string
  coordinates: [number, number]
  threat: ThreatAssessment
  severity: ThreatLevel
  radius?: number // threat radius in meters
}

interface IncidentMarker {
  id: string
  coordinates: [number, number]
  incident: CommunityIncident
  verified: boolean
  type: 'weather' | 'crime' | 'infrastructure' | 'emergency'
}

interface SituationRoomMapProps {
  properties?: Property[]
  threats?: ThreatAssessment[]
  incidents?: CommunityIncident[]
  propertyStatus?: PropertyStatus | null
  emergencyMode?: boolean
  onPropertyClick?: (property: Property) => void
  onThreatClick?: (threat: ThreatAssessment) => void
  onIncidentClick?: (incident: CommunityIncident) => void
  height?: string
  className?: string
}

export function SituationRoomMap({
  properties = [],
  threats = [],
  incidents = [],
  propertyStatus,
  emergencyMode = false,
  onPropertyClick,
  onThreatClick,
  onIncidentClick,
  height = '500px',
  className = ''
}: SituationRoomMapProps) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [selectedThreat, setSelectedThreat] = useState<ThreatAssessment | null>(null)
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite'>('dark')
  const [showThreats, setShowThreats] = useState(true)
  const [showIncidents, setShowIncidents] = useState(true)
  const [showProperties, setShowProperties] = useState(true)

  // Convert threats to map markers
  const threatMarkers = useMemo(() => {
    return threats
      .filter(threat => threat.isActive && threat.location?.coordinates)
      .map((threat): ThreatMarker => ({
        id: threat.id,
        coordinates: threat.location!.coordinates as [number, number],
        threat,
        severity: threat.severity,
        radius: threat.radius || 1000 // default 1km radius
      }))
  }, [threats])

  // Convert incidents to map markers
  const incidentMarkers = useMemo(() => {
    const mapIncidentType = (type: 'damage' | 'outage' | 'emergency' | 'advisory'): 'weather' | 'crime' | 'infrastructure' | 'emergency' => {
      switch (type) {
        case 'damage': return 'weather'
        case 'outage': return 'infrastructure'
        case 'advisory': return 'emergency'
        case 'emergency': return 'emergency'
        default: return 'emergency'
      }
    }

    return incidents
      .filter(incident => incident.location?.lat && incident.location?.lng)
      .map((incident): IncidentMarker => ({
        id: incident.id,
        coordinates: [incident.location!.lng, incident.location!.lat] as [number, number],
        incident,
        verified: incident.verified,
        type: mapIncidentType(incident.type)
      }))
  }, [incidents])

  // Enhance properties with situation room data
  const enhancedProperties = useMemo(() => {
    return properties.map(property => {
      // Find threats near this property
      const nearbyThreats = threatMarkers.filter(threatMarker => {
        const distance = calculateDistance(
          property.coordinates,
          threatMarker.coordinates
        )
        return distance <= (threatMarker.radius || 1000) / 1000 // convert to km
      })

      const maxThreatLevel = nearbyThreats.reduce((max, threat) => {
        const levels: ThreatLevel[] = [ThreatLevel.LOW, ThreatLevel.MEDIUM, ThreatLevel.HIGH, ThreatLevel.CRITICAL, ThreatLevel.EMERGENCY]
        const currentLevel = levels.indexOf(threat.severity)
        const maxLevel = levels.indexOf(max)
        return currentLevel > maxLevel ? threat.severity : max
      }, ThreatLevel.LOW)

      return {
        ...property,
        threatLevel: nearbyThreats.length > 0 ? maxThreatLevel : ThreatLevel.LOW,
        hasActiveThreats: nearbyThreats.length > 0,
        emergencyMode: nearbyThreats.some(t => t.severity === ThreatLevel.EMERGENCY),
        // Mock systems data - in real app would come from property status
        systemsOnline: propertyStatus?.systems?.online || 12,
        totalSystems: propertyStatus?.systems?.total || 15
      }
    })
  }, [properties, threatMarkers, propertyStatus])

  // Calculate center point for map
  const mapCenter = useMemo((): [number, number] => {
    if (enhancedProperties.length === 0 && threatMarkers.length === 0) {
      return [-82.4572, 27.9506] // Tampa, FL default
    }

    const allPoints = [
      ...enhancedProperties.map(p => p.coordinates),
      ...threatMarkers.map(t => t.coordinates)
    ]

    const avgLng = allPoints.reduce((sum, coord) => sum + coord[0], 0) / allPoints.length
    const avgLat = allPoints.reduce((sum, coord) => sum + coord[1], 0) / allPoints.length

    return [avgLng, avgLat]
  }, [enhancedProperties, threatMarkers])

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property)
    onPropertyClick?.(property)
  }

  const handleThreatClick = (threat: ThreatAssessment) => {
    setSelectedThreat(threat)
    onThreatClick?.(threat)
  }

  const handleIncidentClick = (incident: CommunityIncident) => {
    onIncidentClick?.(incident)
  }

  // Helper function to calculate distance between coordinates
  function calculateDistance(
    coord1: [number, number], 
    coord2: [number, number]
  ): number {
    const [lon1, lat1] = coord1
    const [lon2, lat2] = coord2
    
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-4 h-4 text-green-400" />
            <span className="text-sm text-white font-medium">Situation Room</span>
            {emergencyMode && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                EMERGENCY
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-properties"
                checked={showProperties}
                onChange={(e) => setShowProperties(e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-green-500"
              />
              <label htmlFor="show-properties" className="text-xs text-gray-300">
                Properties ({enhancedProperties.length})
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-threats"
                checked={showThreats}
                onChange={(e) => setShowThreats(e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-red-500"
              />
              <label htmlFor="show-threats" className="text-xs text-gray-300">
                Threats ({threatMarkers.length})
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-incidents"
                checked={showIncidents}
                onChange={(e) => setShowIncidents(e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-orange-500"
              />
              <label htmlFor="show-incidents" className="text-xs text-gray-300">
                Incidents ({incidentMarkers.length})
              </label>
            </div>
          </div>
        </div>

        {/* Map Style Toggle */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 border border-gray-600">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={mapStyle === 'dark' ? 'default' : 'outline'}
              onClick={() => setMapStyle('dark')}
              className="text-xs h-7"
            >
              Dark
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

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-gray-600">
          <div className="text-xs text-white font-medium mb-2">Legend</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">Low Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-300">Medium Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-gray-300">High Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-gray-300">Critical/Emergency</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map */}
      <FloridaPropertyMap
        properties={showProperties ? enhancedProperties : []}
        center={mapCenter}
        zoom={12}
        onPropertyClick={handlePropertyClick}
        height={height}
        mapStyle={mapStyle === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/satellite-streets-v12'}
        showPropertyDetails={false} // We'll handle details in situation room context
      />

      {/* Selected Property Details */}
      {selectedProperty && (
        <div className="absolute top-4 right-4 z-10 w-80">
          <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg p-4 border border-gray-600">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-medium">{selectedProperty.name}</h3>
                <p className="text-sm text-gray-400">{selectedProperty.address}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedProperty(null)}
                className="text-xs h-7"
              >
                ×
              </Button>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Threat Level:</span>
                <Badge variant={
                  selectedProperty.threatLevel === ThreatLevel.EMERGENCY || selectedProperty.threatLevel === ThreatLevel.CRITICAL 
                    ? 'destructive' 
                    : selectedProperty.threatLevel === ThreatLevel.HIGH || selectedProperty.threatLevel === ThreatLevel.MEDIUM
                    ? 'secondary'
                    : 'outline'
                } className="text-xs capitalize">
                  {selectedProperty.threatLevel}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Systems Status:</span>
                <span className="text-xs text-white">
                  {selectedProperty.systemsOnline}/{selectedProperty.totalSystems} Online
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Insurance:</span>
                <Badge variant={selectedProperty.insuranceStatus === 'active' ? 'outline' : 'destructive'} className="text-xs">
                  {selectedProperty.insuranceStatus}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="flex-1 text-xs h-7">
                <Shield className="w-3 h-3 mr-1" />
                Details
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs h-7">
                <Phone className="w-3 h-3 mr-1" />
                Emergency
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Threat Details */}
      {selectedThreat && (
        <div className="absolute bottom-4 right-4 z-10 w-80">
          <div className="bg-red-900/95 backdrop-blur-sm rounded-lg p-4 border border-red-600">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-medium">{selectedThreat.title}</h3>
                <p className="text-sm text-red-200">{selectedThreat.type}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedThreat(null)}
                className="text-xs h-7"
              >
                ×
              </Button>
            </div>

            <p className="text-sm text-red-100 mb-3">{selectedThreat.description}</p>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between">
                <span className="text-xs text-red-200">Severity:</span>
                <Badge variant="destructive" className="text-xs capitalize">
                  {selectedThreat.severity}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-xs text-red-200">Timeline:</span>
                <span className="text-xs text-white">{selectedThreat.timeline}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-xs text-red-200">Confidence:</span>
                <span className="text-xs text-white">{selectedThreat.confidence}%</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="destructive" className="flex-1 text-xs h-7">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Take Action
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs h-7">
                <Navigation className="w-3 h-3 mr-1" />
                Navigate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
/**
 * @fileMetadata
 * @purpose "Interactive Mapbox map component for visualizing Florida properties and insurance data"
 * @owner frontend-team
 * @dependencies ["react", "mapbox-gl", "@types/mapbox-gl", "lucide-react"]
 * @exports ["FloridaPropertyMap"]
 * @complexity high
 * @tags ["maps", "mapbox", "florida", "properties", "geospatial"]
 * @status stable
 */
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { MapPin, Home, AlertTriangle, Layers, Search, Filter } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'

// Types
interface Property {
  id: string
  name: string
  address: string
  coordinates: [number, number] // [longitude, latitude]
  type: 'single_family' | 'condo' | 'townhouse' | 'commercial' | 'multi_family'
  value: number
  insuranceStatus: 'active' | 'expired' | 'pending' | 'none'
  claimsCount: number
  riskLevel: 'low' | 'medium' | 'high'
  county: string
  lastUpdated: Date
}

interface MapLayer {
  id: string
  name: string
  visible: boolean
  color: string
}

interface FloridaPropertyMapProps {
  properties?: Property[]
  center?: [number, number]
  zoom?: number
  showControls?: boolean
  showSearch?: boolean
  onPropertyClick?: (property: Property) => void
  className?: string
  height?: string
  mapStyle?: string
}

// Florida-specific map configuration
const FLORIDA_CENTER: [number, number] = [-82.4572, 27.9506]
const FLORIDA_BOUNDS: [[number, number], [number, number]] = [
  [-87.6349, 24.3963], // Southwest coordinates
  [-79.9743, 31.0007]  // Northeast coordinates
]

// Map layers configuration
const DEFAULT_LAYERS: MapLayer[] = [
  { id: 'properties', name: 'Properties', visible: true, color: '#10b981' },
  { id: 'claims', name: 'Claims', visible: true, color: '#f59e0b' },
  { id: 'risk-zones', name: 'Risk Zones', visible: false, color: '#ef4444' },
  { id: 'flood-zones', name: 'Flood Zones', visible: false, color: '#3b82f6' },
  { id: 'hurricane-tracks', name: 'Hurricane History', visible: false, color: '#8b5cf6' }
]

export function FloridaPropertyMap({
  properties = [],
  center = FLORIDA_CENTER,
  zoom = 7,
  showControls = true,
  showSearch = true,
  onPropertyClick,
  className = '',
  height = '500px',
  mapStyle = 'mapbox://styles/mapbox/dark-v11'
}: FloridaPropertyMapProps) {
  // Refs
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])

  // State
  const [mapLoaded, setMapLoaded] = useState(false)
  const [layers, setLayers] = useState<MapLayer[]>(DEFAULT_LAYERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [showLayerControls, setShowLayerControls] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return

    // Set Mapbox access token (should be in environment variables)
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

    if (!mapboxgl.accessToken) {
      console.warn('Mapbox access token not found. Add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables.')
      return
    }

    // Create map instance
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center,
      zoom,
      maxBounds: FLORIDA_BOUNDS,
      attributionControl: false
    })

    // Add navigation controls
    if (showControls) {
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right')
      map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')
    }

    // Map load event
    map.current.on('load', () => {
      setMapLoaded(true)
      
      // Add data sources and layers
      addMapSources()
      addMapLayers()
    })

    // Cleanup
    return () => {
      markers.current.forEach(marker => marker.remove())
      markers.current = []
      map.current?.remove()
    }
  }, [center, zoom, mapStyle, showControls])

  // Add property markers when properties change
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Clear existing markers
    markers.current.forEach(marker => marker.remove())
    markers.current = []

    // Add markers for each property
    properties.forEach(property => {
      const marker = createPropertyMarker(property)
      markers.current.push(marker)
    })
  }, [properties, mapLoaded])

  // Create property marker
  const createPropertyMarker = useCallback((property: Property) => {
    if (!map.current) return new mapboxgl.Marker()

    // Create custom marker element
    const markerElement = document.createElement('div')
    markerElement.className = 'property-marker'
    markerElement.style.cssText = `
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      cursor: pointer;
      transition: transform 0.2s ease;
      background-color: ${getPropertyColor(property)};
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `

    // Hover effects
    markerElement.addEventListener('mouseenter', () => {
      markerElement.style.transform = 'scale(1.5)'
      markerElement.style.zIndex = '1000'
    })

    markerElement.addEventListener('mouseleave', () => {
      markerElement.style.transform = 'scale(1)'
      markerElement.style.zIndex = 'auto'
    })

    // Create marker
    const marker = new mapboxgl.Marker(markerElement)
      .setLngLat(property.coordinates)
      .addTo(map.current!)

    // Create popup
    const popup = new mapboxgl.Popup({ 
      offset: 15,
      className: 'property-popup'
    }).setHTML(createPopupHTML(property))

    // Add click event
    markerElement.addEventListener('click', () => {
      setSelectedProperty(property)
      onPropertyClick?.(property)
      marker.setPopup(popup).togglePopup()
    })

    return marker
  }, [onPropertyClick])

  // Get property marker color based on status
  const getPropertyColor = (property: Property): string => {
    switch (property.insuranceStatus) {
      case 'active': return '#10b981' // Green
      case 'expired': return '#ef4444' // Red
      case 'pending': return '#f59e0b' // Orange
      case 'none': return '#6b7280' // Gray
      default: return '#6b7280'
    }
  }

  // Create popup HTML
  const createPopupHTML = (property: Property): string => {
    const formatCurrency = (value: number) => 
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

    return `
      <div class="p-3 min-w-64">
        <div class="flex items-start justify-between mb-2">
          <h3 class="font-semibold text-white text-sm">${property.name}</h3>
          <span class="px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(property.insuranceStatus)}">
            ${property.insuranceStatus.toUpperCase()}
          </span>
        </div>
        <p class="text-gray-300 text-xs mb-2">${property.address}</p>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span class="text-gray-400">Type:</span>
            <span class="text-white ml-1">${property.type.replace('_', ' ')}</span>
          </div>
          <div>
            <span class="text-gray-400">Value:</span>
            <span class="text-white ml-1">${formatCurrency(property.value)}</span>
          </div>
          <div>
            <span class="text-gray-400">Claims:</span>
            <span class="text-white ml-1">${property.claimsCount}</span>
          </div>
          <div>
            <span class="text-gray-400">Risk:</span>
            <span class="text-white ml-1 ${getRiskColorClass(property.riskLevel)}">${property.riskLevel.toUpperCase()}</span>
          </div>
        </div>
      </div>
    `
  }

  // Get status badge CSS class
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-600 text-white'
      case 'expired': return 'bg-red-600 text-white'
      case 'pending': return 'bg-orange-600 text-white'
      case 'none': return 'bg-gray-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  // Get risk level color class
  const getRiskColorClass = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-orange-400'
      case 'high': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  // Add map data sources
  const addMapSources = useCallback(() => {
    if (!map.current) return

    // Add GeoJSON source for Florida counties (placeholder)
    map.current.addSource('florida-counties', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [] // Would be populated with actual county data
      }
    })

    // Add source for flood zones
    map.current.addSource('flood-zones', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [] // Would be populated with FEMA flood zone data
      }
    })
  }, [])

  // Add map layers
  const addMapLayers = useCallback(() => {
    if (!map.current) return

    // Add county boundaries layer
    map.current.addLayer({
      id: 'county-boundaries',
      type: 'line',
      source: 'florida-counties',
      paint: {
        'line-color': '#374151',
        'line-width': 1,
        'line-opacity': 0.5
      }
    })

    // Add flood zones layer
    map.current.addLayer({
      id: 'flood-zones-layer',
      type: 'fill',
      source: 'flood-zones',
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.2
      }
    })

    // Initially hide flood zones
    map.current.setLayoutProperty('flood-zones-layer', 'visibility', 'none')
  }, [])

  // Filter properties based on search
  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.county.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Toggle layer visibility
  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ))

    if (map.current && layerId === 'flood-zones') {
      const visibility = layers.find(l => l.id === layerId)?.visible ? 'none' : 'visible'
      map.current.setLayoutProperty('flood-zones-layer', 'visibility', visibility)
    }
  }

  // Fly to property
  const flyToProperty = (property: Property) => {
    if (!map.current) return

    map.current.flyTo({
      center: property.coordinates,
      zoom: 14,
      duration: 1000
    })

    setSelectedProperty(property)
    onPropertyClick?.(property)
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border border-gray-700 ${className}`}>
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="w-full"
        style={{ height }}
      />

      {/* Search Bar */}
      {showSearch && (
        <div className="absolute top-4 left-4 right-16 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/90 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm"
            />
          </div>
        </div>
      )}

      {/* Layer Controls */}
      {showControls && (
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setShowLayerControls(!showLayerControls)}
            className="p-2 bg-gray-800/90 border border-gray-600 rounded-lg text-white hover:bg-gray-700 backdrop-blur-sm"
            title="Toggle Layers"
          >
            <Layers className="w-4 h-4" />
          </button>
          
          {showLayerControls && (
            <div className="absolute top-12 right-0 bg-gray-800/95 border border-gray-600 rounded-lg p-3 min-w-48 backdrop-blur-sm">
              <h3 className="font-medium text-white mb-2 text-sm">Map Layers</h3>
              {layers.map(layer => (
                <label key={layer.id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-300">{layer.name}</span>
                  <input
                    type="checkbox"
                    checked={layer.visible}
                    onChange={() => toggleLayer(layer.id)}
                    className="ml-2 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500"
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Property List Sidebar (when searching) */}
      {searchQuery && filteredProperties.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gray-800/95 border-t border-gray-600 max-h-48 overflow-y-auto backdrop-blur-sm">
          <div className="p-3">
            <h3 className="font-medium text-white mb-2 text-sm">
              {filteredProperties.length} Properties Found
            </h3>
            <div className="space-y-2">
              {filteredProperties.slice(0, 5).map(property => (
                <button
                  key={property.id}
                  onClick={() => flyToProperty(property)}
                  className="w-full text-left p-2 rounded bg-gray-700/50 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{property.name}</p>
                      <p className="text-xs text-gray-400">{property.address}</p>
                    </div>
                    <div className="flex items-center ml-2">
                      <span className={`w-2 h-2 rounded-full ${
                        property.insuranceStatus === 'active' ? 'bg-green-400' :
                        property.insuranceStatus === 'expired' ? 'bg-red-400' :
                        property.insuranceStatus === 'pending' ? 'bg-orange-400' : 'bg-gray-400'
                      }`} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-800/95 border border-gray-600 rounded-lg p-3 backdrop-blur-sm">
        <h4 className="font-medium text-white mb-2 text-xs">Insurance Status</h4>
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-400 mr-2" />
            <span className="text-xs text-gray-300">Active</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-400 mr-2" />
            <span className="text-xs text-gray-300">Pending</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-400 mr-2" />
            <span className="text-xs text-gray-300">Expired</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-400 mr-2" />
            <span className="text-xs text-gray-300">None</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-2"></div>
            <p className="text-sm text-gray-300">Loading map...</p>
          </div>
        </div>
      )}

      {/* No Token Warning */}
      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
        <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center backdrop-blur-sm">
          <div className="text-center p-6">
            <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">Mapbox Token Required</h3>
            <p className="text-sm text-gray-300">
              Add your Mapbox access token to NEXT_PUBLIC_MAPBOX_TOKEN environment variable
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
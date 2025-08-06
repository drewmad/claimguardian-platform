/**
 * @fileMetadata
 * @purpose "Dashboard component integrating FloridaPropertyMap with property management features"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion", "@/components/maps/florida-property-map", "@/lib/animations"]
 * @exports ["PropertyMapDashboard"]
 * @complexity medium
 * @tags ["maps", "dashboard", "properties", "florida"]
 * @status stable
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Home, Building, TrendingUp, AlertCircle, Filter, Download, Eye, EyeOff } from 'lucide-react'
import { FloridaPropertyMap } from './florida-property-map'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { Card, CardContent, CardTitle, CardDescription, CardHeader } from '@/components/ui/card-variants'
import { InsuranceBadge } from '@/components/ui/insurance-badges'

// Types
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
}

interface FilterState {
  insuranceStatus: string[]
  propertyTypes: string[]
  riskLevels: string[]
  counties: string[]
  valueRange: [number, number]
}

interface PropertyMapDashboardProps {
  properties?: Property[]
  onPropertySelect?: (property: Property) => void
  className?: string
}

// Mock data for demonstration
const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    name: 'Sunset Villa',
    address: '123 Ocean Drive, Miami Beach, FL 33139',
    coordinates: [-80.1300, 25.7907],
    type: 'single_family',
    value: 850000,
    insuranceStatus: 'active',
    claimsCount: 0,
    riskLevel: 'medium',
    county: 'Miami-Dade',
    lastUpdated: new Date('2025-08-01')
  },
  {
    id: '2',
    name: 'Tampa Bay Condo',
    address: '456 Harbor View, Tampa, FL 33602',
    coordinates: [-82.4572, 27.9506],
    type: 'condo',
    value: 425000,
    insuranceStatus: 'pending',
    claimsCount: 1,
    riskLevel: 'low',
    county: 'Hillsborough',
    lastUpdated: new Date('2025-07-28')
  },
  {
    id: '3',
    name: 'Orlando Investment Property',
    address: '789 Theme Park Blvd, Orlando, FL 32819',
    coordinates: [-81.3792, 28.5383],
    type: 'multi_family',
    value: 1200000,
    insuranceStatus: 'expired',
    claimsCount: 3,
    riskLevel: 'high',
    county: 'Orange',
    lastUpdated: new Date('2025-07-15')
  },
  {
    id: '4',
    name: 'Jacksonville Townhouse',
    address: '321 River Walk, Jacksonville, FL 32207',
    coordinates: [-81.6557, 30.3322],
    type: 'townhouse',
    value: 320000,
    insuranceStatus: 'active',
    claimsCount: 0,
    riskLevel: 'low',
    county: 'Duval',
    lastUpdated: new Date('2025-08-05')
  },
  {
    id: '5',
    name: 'Coastal Commercial Plaza',
    address: '555 Gulf Shore Dr, Naples, FL 34102',
    coordinates: [-81.7948, 26.1420],
    type: 'commercial',
    value: 2500000,
    insuranceStatus: 'active',
    claimsCount: 2,
    riskLevel: 'high',
    county: 'Collier',
    lastUpdated: new Date('2025-08-03')
  }
]

const DEFAULT_FILTERS: FilterState = {
  insuranceStatus: [],
  propertyTypes: [],
  riskLevels: [],
  counties: [],
  valueRange: [0, 5000000]
}

export function PropertyMapDashboard({
  properties = MOCK_PROPERTIES,
  onPropertySelect,
  className = ''
}: PropertyMapDashboardProps) {
  // State
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [mapView, setMapView] = useState<'satellite' | 'streets' | 'dark'>('dark')

  // Filtered properties based on current filters
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Insurance status filter
      if (filters.insuranceStatus.length > 0 && !filters.insuranceStatus.includes(property.insuranceStatus)) {
        return false
      }

      // Property type filter
      if (filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(property.type)) {
        return false
      }

      // Risk level filter
      if (filters.riskLevels.length > 0 && !filters.riskLevels.includes(property.riskLevel)) {
        return false
      }

      // County filter
      if (filters.counties.length > 0 && !filters.counties.includes(property.county)) {
        return false
      }

      // Value range filter
      if (property.value < filters.valueRange[0] || property.value > filters.valueRange[1]) {
        return false
      }

      return true
    })
  }, [properties, filters])

  // Statistics
  const stats = useMemo(() => {
    const totalValue = filteredProperties.reduce((sum, prop) => sum + prop.value, 0)
    const totalClaims = filteredProperties.reduce((sum, prop) => sum + prop.claimsCount, 0)
    
    const statusCounts = filteredProperties.reduce((acc, prop) => {
      acc[prop.status] = (acc[prop.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const riskCounts = filteredProperties.reduce((acc, prop) => {
      acc[prop.riskLevel] = (acc[prop.riskLevel] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalProperties: filteredProperties.length,
      totalValue,
      totalClaims,
      averageValue: filteredProperties.length > 0 ? totalValue / filteredProperties.length : 0,
      statusCounts,
      riskCounts
    }
  }, [filteredProperties])

  // Handle property selection
  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property)
    onPropertySelect?.(property)
  }

  // Handle filter changes
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  // Export data
  const exportData = () => {
    const dataStr = JSON.stringify(filteredProperties, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = 'properties.json'
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  // Format currency
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Property Map Dashboard</h1>
          <p className="text-gray-400 mt-1">Interactive map of Florida properties and insurance data</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            {Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f !== DEFAULT_FILTERS.valueRange) && (
              <span className="w-2 h-2 bg-green-400 rounded-full" />
            )}
          </button>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div variants={fadeInUp}>
          <Card variant="default" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Properties</p>
                <p className="text-2xl font-bold text-white">{stats.totalProperties}</p>
              </div>
              <Home className="w-8 h-8 text-green-400" />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card variant="default" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Value</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalValue)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card variant="default" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Claims</p>
                <p className="text-2xl font-bold text-white">{stats.totalClaims}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-400" />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card variant="default" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Value</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.averageValue)}</p>
              </div>
              <Building className="w-8 h-8 text-purple-400" />
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div variants={fadeInUp}>
          <Card variant="default" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Filters</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {/* Insurance Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Insurance Status
                </label>
                <div className="space-y-2">
                  {['active', 'pending', 'expired', 'none'].map(status => (
                    <label key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.insuranceStatus.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFilter('insuranceStatus', [...filters.insuranceStatus, status])
                          } else {
                            updateFilter('insuranceStatus', filters.insuranceStatus.filter(s => s !== status))
                          }
                        }}
                        className="rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-300 capitalize">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Property Types Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Property Type
                </label>
                <div className="space-y-2">
                  {['single_family', 'condo', 'townhouse', 'commercial', 'multi_family'].map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.propertyTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFilter('propertyTypes', [...filters.propertyTypes, type])
                          } else {
                            updateFilter('propertyTypes', filters.propertyTypes.filter(t => t !== type))
                          }
                        }}
                        className="rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-300">
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Risk Levels Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Risk Level
                </label>
                <div className="space-y-2">
                  {['low', 'medium', 'high'].map(risk => (
                    <label key={risk} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.riskLevels.includes(risk)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFilter('riskLevels', [...filters.riskLevels, risk])
                          } else {
                            updateFilter('riskLevels', filters.riskLevels.filter(r => r !== risk))
                          }
                        }}
                        className="rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-300 capitalize">{risk}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Counties Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Counties
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {Array.from(new Set(properties.map(p => p.county))).sort().map(county => (
                    <label key={county} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.counties.includes(county)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFilter('counties', [...filters.counties, county])
                          } else {
                            updateFilter('counties', filters.counties.filter(c => c !== county))
                          }
                        }}
                        className="rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-300">{county}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Map Style */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Map Style
                </label>
                <select
                  value={mapView}
                  onChange={(e) => setMapView(e.target.value as any)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-green-500"
                >
                  <option value="dark">Dark</option>
                  <option value="streets">Streets</option>
                  <option value="satellite">Satellite</option>
                </select>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Map and Property Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <Card variant="default" className="p-0 overflow-hidden">
            <FloridaPropertyMap
              properties={filteredProperties}
              onPropertyClick={handlePropertyClick}
              height="600px"
              mapStyle={
                mapView === 'dark' ? 'mapbox://styles/mapbox/dark-v11' :
                mapView === 'streets' ? 'mapbox://styles/mapbox/streets-v12' :
                'mapbox://styles/mapbox/satellite-streets-v12'
              }
            />
          </Card>
        </motion.div>

        {/* Property Details */}
        <motion.div variants={fadeInUp}>
          <Card variant="default" className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Property Details</h2>
            
            {selectedProperty ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-white">{selectedProperty.name}</h3>
                  <p className="text-sm text-gray-400">{selectedProperty.address}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Type:</span>
                    <span className="text-sm text-white capitalize">
                      {selectedProperty.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Value:</span>
                    <span className="text-sm text-white font-medium">
                      {formatCurrency(selectedProperty.value)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Insurance:</span>
                    <InsuranceBadge variant={selectedProperty.insuranceStatus}>
                      {selectedProperty.insuranceStatus}
                    </InsuranceBadge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Claims:</span>
                    <span className="text-sm text-white">{selectedProperty.claimsCount}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Risk Level:</span>
                    <span className={`text-sm font-medium ${
                      selectedProperty.riskLevel === 'low' ? 'text-green-400' :
                      selectedProperty.riskLevel === 'medium' ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {selectedProperty.riskLevel.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">County:</span>
                    <span className="text-sm text-white">{selectedProperty.county}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
                    View Full Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Click on a property marker to view details</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
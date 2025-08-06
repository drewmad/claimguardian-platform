/**
 * @fileMetadata
 * @purpose "Developer portal parcel search map with Florida parcel data integration and search functionality"
 * @owner frontend-team
 * @dependencies ["react", "mapbox-gl", "@/components/maps/florida-property-map"]
 * @exports ["ParcelSearchMap"]
 * @complexity high
 * @tags ["maps", "parcels", "search", "developer", "florida-data"]
 * @status stable
 */
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, MapPin, Info, Download, Filter, Layers, BarChart, Database } from 'lucide-react'
import { FloridaPropertyMap } from './florida-property-map'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

interface FloridaParcel {
  id: string
  parcelId: string
  folio: string
  coordinates: [number, number]
  
  // Owner Information
  ownerName: string
  ownerAddress: string
  
  // Property Information
  propertyAddress: string
  propertyUse: string
  propertyType: string
  
  // Assessment Information
  justValue: number
  assessedValue: number
  taxableValue: number
  
  // Physical Characteristics
  lotSize: number // acres
  squareFootage: number
  yearBuilt: number
  bedrooms?: number
  bathrooms?: number
  
  // Location Information
  county: string
  municipality?: string
  subdvName?: string
  
  // Legal Description
  legalDescription: string
  
  // Sales Information
  lastSalePrice?: number
  lastSaleDate?: string
  
  // Additional Fields
  exemptions: string[]
  schoolDistrict?: string
  floodZone?: string
}

interface SearchFilters {
  county: string
  municipality: string
  ownerName: string
  propertyUse: string
  minValue: number
  maxValue: number
  minLotSize: number
  maxLotSize: number
  yearBuiltMin: number
  yearBuiltMax: number
}

interface ParcelSearchMapProps {
  height?: string
  className?: string
  onParcelSelect?: (parcel: FloridaParcel) => void
  initialFilters?: Partial<SearchFilters>
}

export function ParcelSearchMap({
  height = '600px',
  className = '',
  onParcelSelect,
  initialFilters = {}
}: ParcelSearchMapProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedParcel, setSelectedParcel] = useState<FloridaParcel | null>(null)
  const [searchResults, setSearchResults] = useState<FloridaParcel[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>('streets')
  const [selectedCounty, setSelectedCounty] = useState<string>('')
  
  const [filters, setFilters] = useState<Partial<SearchFilters>>({
    county: '',
    municipality: '',
    ownerName: '',
    propertyUse: '',
    minValue: 0,
    maxValue: 5000000,
    minLotSize: 0,
    maxLotSize: 100,
    yearBuiltMin: 1900,
    yearBuiltMax: new Date().getFullYear(),
    ...initialFilters
  })

  // Florida counties for filter dropdown
  const floridaCounties = [
    'Alachua', 'Baker', 'Bay', 'Bradford', 'Brevard', 'Broward', 'Calhoun', 'Charlotte',
    'Citrus', 'Clay', 'Collier', 'Columbia', 'DeSoto', 'Dixie', 'Duval', 'Escambia',
    'Flagler', 'Franklin', 'Gadsden', 'Gilchrist', 'Glades', 'Gulf', 'Hamilton',
    'Hardee', 'Hendry', 'Hernando', 'Highlands', 'Hillsborough', 'Holmes', 'Indian River',
    'Jackson', 'Jefferson', 'Lafayette', 'Lake', 'Lee', 'Leon', 'Levy', 'Liberty',
    'Madison', 'Manatee', 'Marion', 'Martin', 'Miami-Dade', 'Monroe', 'Nassau',
    'Okaloosa', 'Okeechobee', 'Orange', 'Osceola', 'Palm Beach', 'Pasco', 'Pinellas',
    'Polk', 'Putnam', 'Santa Rosa', 'Sarasota', 'Seminole', 'St. Johns', 'St. Lucie',
    'Sumter', 'Suwannee', 'Taylor', 'Union', 'Volusia', 'Wakulla', 'Walton', 'Washington'
  ]

  // Mock parcel data for demonstration
  const mockParcels = useMemo((): FloridaParcel[] => [
    {
      id: '1',
      parcelId: '15-41-20-00012.000',
      folio: '15412000012000',
      coordinates: [-82.0907, 26.9762] as [number, number],
      ownerName: 'SMITH, JOHN & JANE',
      ownerAddress: '123 MAIN ST, PORT CHARLOTTE FL 33948',
      propertyAddress: '3407 KNOX TERRACE, PORT CHARLOTTE FL 33948',
      propertyUse: 'SINGLE FAMILY',
      propertyType: 'RESIDENTIAL',
      justValue: 485000,
      assessedValue: 485000,
      taxableValue: 460000,
      lotSize: 0.20,
      squareFootage: 2800,
      yearBuilt: 2005,
      bedrooms: 4,
      bathrooms: 3,
      county: 'CHARLOTTE',
      municipality: 'PORT CHARLOTTE',
      subdvName: 'BURNT STORE MEADOWS',
      legalDescription: 'BURNT STORE MEADOWS LOT 12 BLK 20',
      lastSalePrice: 380000,
      lastSaleDate: '2019-06-15',
      exemptions: ['HOMESTEAD'],
      schoolDistrict: 'CHARLOTTE',
      floodZone: 'X'
    },
    {
      id: '2',
      parcelId: '15-41-20-00013.000',
      folio: '15412000013000',
      coordinates: [-82.0910, 26.9765] as [number, number],
      ownerName: 'JOHNSON, ROBERT M',
      ownerAddress: '456 OAK ST, PORT CHARLOTTE FL 33948',
      propertyAddress: '3409 KNOX TERRACE, PORT CHARLOTTE FL 33948',
      propertyUse: 'SINGLE FAMILY',
      propertyType: 'RESIDENTIAL',
      justValue: 425000,
      assessedValue: 425000,
      taxableValue: 400000,
      lotSize: 0.22,
      squareFootage: 2650,
      yearBuilt: 2003,
      bedrooms: 3,
      bathrooms: 2,
      county: 'CHARLOTTE',
      municipality: 'PORT CHARLOTTE',
      subdvName: 'BURNT STORE MEADOWS',
      legalDescription: 'BURNT STORE MEADOWS LOT 13 BLK 20',
      exemptions: ['HOMESTEAD', 'VETERAN'],
      schoolDistrict: 'CHARLOTTE',
      floodZone: 'X'
    },
    {
      id: '3',
      parcelId: '12-34-56-78910.000',
      folio: '12345678910000',
      coordinates: [-80.1918, 25.7617] as [number, number],
      ownerName: 'MARTINEZ, CARLOS & MARIA',
      ownerAddress: '789 PALM AVE, MIAMI FL 33101',
      propertyAddress: '789 PALM AVENUE, MIAMI FL 33101',
      propertyUse: 'SINGLE FAMILY',
      propertyType: 'RESIDENTIAL',
      justValue: 850000,
      assessedValue: 850000,
      taxableValue: 825000,
      lotSize: 0.15,
      squareFootage: 3200,
      yearBuilt: 2010,
      bedrooms: 4,
      bathrooms: 4,
      county: 'MIAMI-DADE',
      municipality: 'MIAMI',
      subdvName: 'BRICKELL HEIGHTS',
      legalDescription: 'BRICKELL HEIGHTS LOT 15 BLK 5',
      lastSalePrice: 720000,
      lastSaleDate: '2018-03-22',
      exemptions: ['HOMESTEAD'],
      schoolDistrict: 'MIAMI-DADE',
      floodZone: 'AE'
    }
  ], [])

  // Filter parcels based on current filters
  const filteredParcels = useMemo(() => {
    return mockParcels.filter(parcel => {
      if (filters.county && !parcel.county.toLowerCase().includes(filters.county.toLowerCase())) {
        return false
      }
      if (filters.ownerName && !parcel.ownerName.toLowerCase().includes(filters.ownerName.toLowerCase())) {
        return false
      }
      if (filters.minValue && parcel.justValue < filters.minValue) {
        return false
      }
      if (filters.maxValue && parcel.justValue > filters.maxValue) {
        return false
      }
      if (filters.minLotSize && parcel.lotSize < filters.minLotSize) {
        return false
      }
      if (filters.maxLotSize && parcel.lotSize > filters.maxLotSize) {
        return false
      }
      if (filters.yearBuiltMin && parcel.yearBuilt < filters.yearBuiltMin) {
        return false
      }
      if (filters.yearBuiltMax && parcel.yearBuilt > filters.yearBuiltMax) {
        return false
      }
      return true
    })
  }, [mockParcels, filters])

  // Convert parcels to properties for the map component
  const mapProperties = useMemo(() => {
    return filteredParcels.map(parcel => ({
      id: parcel.id,
      name: parcel.propertyAddress,
      address: parcel.propertyAddress,
      coordinates: parcel.coordinates,
      type: parcel.propertyUse.toLowerCase().includes('single') ? 'single_family' as const :
            parcel.propertyUse.toLowerCase().includes('condo') ? 'condo' as const :
            parcel.propertyUse.toLowerCase().includes('commercial') ? 'commercial' as const : 'single_family' as const,
      value: parcel.justValue,
      insuranceStatus: 'active' as const,
      claimsCount: 0,
      riskLevel: 'low' as const,
      county: parcel.county,
      lastUpdated: new Date()
    }))
  }, [filteredParcels])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    
    // Mock search - in real app would query Supabase florida_parcels table
    const results = mockParcels.filter(parcel => 
      parcel.parcelId.includes(searchQuery) ||
      parcel.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parcel.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    setSearchResults(results)
    setIsSearching(false)
  }, [searchQuery, mockParcels])

  const handlePropertyClick = (property: any) => {
    const parcel = filteredParcels.find(p => p.id === property.id)
    if (parcel) {
      setSelectedParcel(parcel)
      onParcelSelect?.(parcel)
    }
  }

  const exportResults = () => {
    const dataStr = JSON.stringify(filteredParcels, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `florida_parcels_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const clearFilters = () => {
    setFilters({
      county: '',
      municipality: '',
      ownerName: '',
      propertyUse: '',
      minValue: 0,
      maxValue: 5000000,
      minLotSize: 0,
      maxLotSize: 100,
      yearBuiltMin: 1900,
      yearBuiltMax: new Date().getFullYear()
    })
    setSearchQuery('')
    setSearchResults([])
    setSelectedParcel(null)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Search Controls */}
      <div className="absolute top-4 left-4 z-10 w-80">
        <Card className="bg-gray-800/95 backdrop-blur-sm border-gray-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Database className="w-4 h-4" />
              Florida Parcel Search
              <Badge variant="outline" className="text-xs">
                {filteredParcels.length} results
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Search by parcel ID, owner, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-gray-700 border-gray-600 text-white text-xs"
              />
              <Button
                size="sm"
                onClick={handleSearch}
                disabled={isSearching}
                className="text-xs"
              >
                <Search className="w-3 h-3" />
              </Button>
            </div>

            {/* Quick County Filter */}
            <div>
              <Label className="text-xs text-gray-400">County</Label>
              <select
                value={filters.county || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, county: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
              >
                <option value="">All Counties</option>
                {floridaCounties.map(county => (
                  <option key={county} value={county}>
                    {county} County
                  </option>
                ))}
              </select>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-1 text-xs"
              >
                <Filter className="w-3 h-3 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={exportResults}
                className="text-xs"
              >
                <Download className="w-3 h-3" />
              </Button>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="space-y-3 pt-3 border-t border-gray-700">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-400">Min Value</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.minValue || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, minValue: parseInt(e.target.value) || 0 }))}
                      className="bg-gray-700 border-gray-600 text-white text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Max Value</Label>
                    <Input
                      type="number"
                      placeholder="5000000"
                      value={filters.maxValue || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxValue: parseInt(e.target.value) || 5000000 }))}
                      className="bg-gray-700 border-gray-600 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-400">Year Built From</Label>
                    <Input
                      type="number"
                      placeholder="1900"
                      value={filters.yearBuiltMin || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, yearBuiltMin: parseInt(e.target.value) || 1900 }))}
                      className="bg-gray-700 border-gray-600 text-white text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Year Built To</Label>
                    <Input
                      type="number"
                      placeholder="2024"
                      value={filters.yearBuiltMax || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, yearBuiltMax: parseInt(e.target.value) || new Date().getFullYear() }))}
                      className="bg-gray-700 border-gray-600 text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-400">Owner Name</Label>
                  <Input
                    placeholder="Search by owner name..."
                    value={filters.ownerName || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, ownerName: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white text-xs"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Map Style Controls */}
      <div className="absolute top-4 right-4 z-10">
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
            <Button
              size="sm"
              variant={mapStyle === 'dark' ? 'default' : 'outline'}
              onClick={() => setMapStyle('dark')}
              className="text-xs h-7"
            >
              Dark
            </Button>
          </div>
        </div>
      </div>

      {/* Selected Parcel Details */}
      {selectedParcel && (
        <div className="absolute bottom-4 right-4 z-10 w-80">
          <Card className="bg-gray-800/95 backdrop-blur-sm border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm flex items-center justify-between">
                <span>Parcel Details</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedParcel(null)}
                  className="text-xs h-7"
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="space-y-1">
                <div className="font-medium text-white">{selectedParcel.propertyAddress}</div>
                <div className="text-gray-400">Parcel ID: {selectedParcel.parcelId}</div>
                <div className="text-gray-400">Owner: {selectedParcel.ownerName}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-700">
                <div>
                  <div className="text-gray-400">Just Value</div>
                  <div className="text-white font-medium">${selectedParcel.justValue.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-400">Lot Size</div>
                  <div className="text-white font-medium">{selectedParcel.lotSize} acres</div>
                </div>
                <div>
                  <div className="text-gray-400">Year Built</div>
                  <div className="text-white font-medium">{selectedParcel.yearBuilt}</div>
                </div>
                <div>
                  <div className="text-gray-400">County</div>
                  <div className="text-white font-medium">{selectedParcel.county}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-700">
                <div className="text-gray-400 mb-1">Legal Description</div>
                <div className="text-white text-xs">{selectedParcel.legalDescription}</div>
              </div>

              {selectedParcel.exemptions.length > 0 && (
                <div className="pt-2 border-t border-gray-700">
                  <div className="text-gray-400 mb-1">Exemptions</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedParcel.exemptions.map(exemption => (
                      <Badge key={exemption} variant="outline" className="text-xs">
                        {exemption}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Panel */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <BarChart className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-white font-medium">Search Statistics</span>
          </div>
          <div className="space-y-1 text-xs text-gray-300">
            <div>Total Parcels: {filteredParcels.length}</div>
            <div>Avg Value: ${Math.round(filteredParcels.reduce((sum, p) => sum + p.justValue, 0) / filteredParcels.length).toLocaleString()}</div>
            <div>Counties: {new Set(filteredParcels.map(p => p.county)).size}</div>
          </div>
        </div>
      </div>

      {/* Main Map */}
      <FloridaPropertyMap
        properties={mapProperties}
        onPropertyClick={handlePropertyClick}
        height={height}
        mapStyle={
          mapStyle === 'dark' ? 'mapbox://styles/mapbox/dark-v11' :
          mapStyle === 'satellite' ? 'mapbox://styles/mapbox/satellite-streets-v12' :
          'mapbox://styles/mapbox/streets-v12'
        }
      />
    </div>
  )
}
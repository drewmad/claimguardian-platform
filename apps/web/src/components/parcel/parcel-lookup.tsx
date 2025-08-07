/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "AI-powered parcel lookup interface leveraging 9.6M Florida dataset"
 * @dependencies ["react", "lucide-react", "@claimguardian/ui"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context properties
 * @florida-specific true
 */
'use client'

import { useState } from 'react'
import { Search, MapPin, Home, AlertTriangle } from 'lucide-react'
import { Button } from '@claimguardian/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { searchParcels, assessPropertyRisk } from '@/actions/parcel-lookup'

interface ParcelSearchParams {
  address?: string
  owner?: string
  parcelId?: string
  county?: string
}

interface ParcelData {
  id: string
  parcelId: string
  address: string
  owner: string
  county: string
  landUse: string
  totalValue: number
  buildingValue: number
  landValue: number
  yearBuilt?: number
  squareFeet?: number
  acreage?: number
  floodZone?: string
  hurricaneZone?: string
  riskFactors?: string[]
}

export function ParcelLookup() {
  const [searchParams, setSearchParams] = useState<ParcelSearchParams>({})
  const [results, setResults] = useState<ParcelData[]>([])
  const [selectedParcel, setSelectedParcel] = useState<ParcelData | null>(null)
  const [riskAssessment, setRiskAssessment] = useState<{
    parcelId: string
    riskFactors: {
      floodRisk: number
      hurricaneRisk: number
      ageRisk: number
      valueRisk: number
      locationRisk: number
    }
    overallRisk: number
    recommendations: string[]
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchParams.address && !searchParams.owner && !searchParams.parcelId) {
      setError('Please provide at least one search criteria')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await searchParcels(searchParams)

      if (result.error) {
        setError(result.error.message)
        return
      }

      setResults(result.data || [])
    } catch (err) {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleParcelSelect = async (parcel: ParcelData) => {
    setSelectedParcel(parcel)
    setLoading(true)

    try {
      const riskResult = await assessPropertyRisk(parcel.parcelId)
      if (riskResult.data) {
        setRiskAssessment(riskResult.data)
      }
    } catch (err) {
      console.error('Risk assessment failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (risk: number) => {
    if (risk > 0.7) return 'bg-red-500'
    if (risk > 0.5) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value || 0)
  }

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Search className="w-5 h-5" />
            Florida Parcel Lookup
            <Badge variant="secondary">9.6M Records</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Address
              </label>
              <Input
                placeholder="123 Main St"
                value={searchParams.address || ''}
                onChange={(e) => setSearchParams(prev => ({ ...prev, address: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Owner Name
              </label>
              <Input
                placeholder="Smith, John"
                value={searchParams.owner || ''}
                onChange={(e) => setSearchParams(prev => ({ ...prev, owner: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Parcel ID
              </label>
              <Input
                placeholder="1234567890"
                value={searchParams.parcelId || ''}
                onChange={(e) => setSearchParams(prev => ({ ...prev, parcelId: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Searching...' : 'Search Parcels'}
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                setSearchParams({})
                setResults([])
                setSelectedParcel(null)
                setRiskAssessment(null)
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Clear
            </Button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {results.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              Search Results ({results.length} found)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((parcel) => (
                <div
                  key={parcel.parcelId}
                  className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => handleParcelSelect(parcel)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">
                          {parcel.address}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-300">
                        <Home className="w-4 h-4" />
                        <span>Owner: {parcel.owner}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Parcel: {parcel.parcelId}</span>
                        <span>Built: {parcel.yearBuilt || 'Unknown'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-white font-semibold">
                        {formatCurrency(parcel.totalValue)}
                      </div>
                      <div className="text-sm text-gray-400">
                        Total Value
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Parcel Details & Risk Assessment */}
      {selectedParcel && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Property Details */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Address:</span>
                  <p className="text-white">{selectedParcel.address}</p>
                </div>
                <div>
                  <span className="text-gray-400">County:</span>
                  <p className="text-white">{selectedParcel.county}</p>
                </div>
                <div>
                  <span className="text-gray-400">Owner:</span>
                  <p className="text-white">{selectedParcel.owner}</p>
                </div>
                <div>
                  <span className="text-gray-400">Year Built:</span>
                  <p className="text-white">{selectedParcel.yearBuilt || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Land Use:</span>
                  <p className="text-white">{selectedParcel.landUse}</p>
                </div>
                <div>
                  <span className="text-gray-400">Living Area:</span>
                  <p className="text-white">{selectedParcel.squareFeet ? `${selectedParcel.squareFeet.toLocaleString()} sqft` : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Land Value:</span>
                  <p className="text-white">{formatCurrency(selectedParcel.landValue)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Building Value:</span>
                  <p className="text-white">{formatCurrency(selectedParcel.buildingValue)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Total Value:</span>
                  <p className="text-white font-semibold">{formatCurrency(selectedParcel.totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Risk Assessment */}
          {riskAssessment && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <AlertTriangle className="w-5 h-5" />
                  AI Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">
                    {(riskAssessment.overallRisk * 100).toFixed(0)}%
                  </div>
                  <div className="text-gray-400">Overall Risk Score</div>
                </div>

                <div className="space-y-3">
                  {Object.entries(riskAssessment.riskFactors).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getRiskColor(value as number)}`}
                            style={{ width: `${(value as number) * 100}%` }}
                          />
                        </div>
                        <span className="text-white text-sm w-12">
                          {((value as number) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {riskAssessment.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-2">Recommendations:</h4>
                    <ul className="space-y-1">
                      {riskAssessment.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm text-gray-400 flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

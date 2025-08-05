/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { searchParcels, linkPropertyToParcel } from '@/actions/geospatial'
import { 
  Search, 
  Link2, 
  MapPin,
  User,
  Home,
  Calendar
} from 'lucide-react'

interface ParcelData {
  id: string
  parcelId: string
  address: string
  city: string
  county: string
  state: string
  zipCode: string
  ownerName: string
  propertyType: string
  landUse: string
  totalValue: number
  landValue: number
  buildingValue: number
  yearBuilt?: number
  lotSize?: number
  livingArea?: number
  coordinates?: {
    latitude: number
    longitude: number
  }
}

interface ParcelSearchProps {
  propertyId: string
  currentParcelId?: string
  onParcelLinked?: (parcelId: string) => void
}

export function ParcelSearch({ 
  propertyId, 
  currentParcelId,
  onParcelLinked 
}: ParcelSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [linking, setLinking] = useState(false)
  const [results, setResults] = useState<ParcelData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await searchParcels({ 
        query: searchQuery,
        limit: 10 
      })

      if (result.error) {
        setError(result.error)
        setResults([])
      } else {
        setResults(result.data || [])
        if (result.data?.length === 0) {
          setError('No parcels found matching your search')
        }
      }
    } catch (err) {
      setError('Failed to search parcels')
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleLinkParcel = async (parcelId: string) => {
    setLinking(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await linkPropertyToParcel({ propertyId, parcelId })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Property successfully linked to parcel!')
        onParcelLinked?.(parcelId)
        setResults([])
        setSearchQuery('')
      }
    } catch (err) {
      setError('Failed to link parcel')
    } finally {
      setLinking(false)
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Search className="h-5 w-5" />
          Find & Link Property Parcel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentParcelId ? (
          <Alert className="bg-green-900/20 border-green-600/50">
            <AlertDescription className="text-green-200">
              This property is linked to parcel: <strong>{currentParcelId}</strong>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-yellow-900/20 border-yellow-600/50">
            <AlertDescription className="text-yellow-200">
              Link this property to a Florida parcel to enable risk assessment
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="parcel-search" className="text-gray-300">
            Search by address or owner name
          </Label>
          <div className="flex gap-2">
            <Input
              id="parcel-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g., 123 Main St or John Smith"
              className="bg-gray-900 border-gray-700 text-white"
            />
            <Button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {searching ? (
                <Search className="h-4 w-4 animate-pulse" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="bg-red-900/20 border-red-600/50">
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-900/20 border-green-600/50">
            <AlertDescription className="text-green-200">{success}</AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Found {results.length} parcel{results.length > 1 ? 's' : ''}:
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((parcel) => (
                <div
                  key={parcel.parcelId}
                  className="p-4 bg-gray-900 rounded-lg border border-gray-700 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-white text-sm">
                        Parcel ID: {parcel.parcelId}
                      </p>
                      <div className="space-y-1 text-sm text-gray-400">
                        {parcel.propertyAddress && (
                          <p className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {parcel.propertyAddress}
                          </p>
                        )}
                        {parcel.ownerName && (
                          <p className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {parcel.ownerName}
                          </p>
                        )}
                        <p className="flex items-center gap-1">
                          <Home className="h-3 w-3" />
                          {parcel.countyName} County
                        </p>
                        {parcel.yearBuilt && (
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Built {parcel.yearBuilt}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleLinkParcel(parcel.parcelId)}
                      disabled={linking || parcel.parcelId === currentParcelId}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Link2 className="h-4 w-4 mr-1" />
                      {parcel.parcelId === currentParcelId ? 'Linked' : 'Link'}
                    </Button>
                  </div>
                  
                  {parcel.totalValue && (
                    <div className="pt-2 border-t border-gray-800 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Assessed Value</p>
                        <p className="text-gray-300">
                          ${parcel.totalValue.toLocaleString()}
                        </p>
                      </div>
                      {parcel.livingArea && (
                        <div>
                          <p className="text-gray-500">Living Area</p>
                          <p className="text-gray-300">
                            {parcel.livingArea.toLocaleString()} sq ft
                          </p>
                        </div>
                      )}
                      {parcel.landArea && (
                        <div>
                          <p className="text-gray-500">Land Area</p>
                          <p className="text-gray-300">
                            {parcel.landArea} acres
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
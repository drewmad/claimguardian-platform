'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@claimguardian/ui'
import { Badge } from '@claimguardian/ui'
import { Button } from '@claimguardian/ui'
import { Input } from '@claimguardian/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@claimguardian/ui'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, 
  ExternalLink, 
  Loader2, 
  FileText, 
  AlertTriangle, 
  MapPin, 
  Home,
  Building,
  Filter
} from 'lucide-react'

interface UnifiedSearchResult {
  type: 'floir' | 'property'
  id: string
  title: string
  description: string
  similarity?: number
  metadata: unknown
  source_url?: string
}

interface UnifiedSearchResponse {
  query: string
  results: UnifiedSearchResult[]
  answer?: string
  total_results: number
  search_time_ms: number
  floir_results: number
  property_results: number
}

export default function UnifiedFloridaSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UnifiedSearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchType, setSearchType] = useState<'all' | 'regulation' | 'property'>('all')

  const supabase = createClient()

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const startTime = Date.now()
      
      // Perform parallel searches
      const searches = []
      
      if (searchType === 'all' || searchType === 'regulation') {
        searches.push(
          supabase.functions.invoke('floir-rag-search', {
            body: {
              query: query.trim(),
              limit: 10,
              threshold: 0.3,
              include_context: false
            }
          })
        )
      } else {
        searches.push(Promise.resolve({ data: { results: [] } }))
      }
      
      if (searchType === 'all' || searchType === 'property') {
        searches.push(searchProperties(query.trim()))
      } else {
        searches.push(Promise.resolve({ results: [] }))
      }

      const [floirResponse, propertyResponse] = await Promise.all(searches)
      
      if (floirResponse.error) throw new Error(`FLOIR search failed: ${floirResponse.error.message}`)
      if (propertyResponse.error) throw new Error(`Property search failed: ${propertyResponse.error}`)

      // Combine and rank results
      const combinedResults = combineResults(
        floirResponse.data?.results || [],
        propertyResponse.results || []
      )

      // Generate unified answer if we have both types of results
      let unifiedAnswer
      if (searchType === 'all' && combinedResults.length > 0) {
        unifiedAnswer = await generateUnifiedAnswer(query, combinedResults)
      }

      const response: UnifiedSearchResponse = {
        query,
        results: combinedResults,
        answer: unifiedAnswer,
        total_results: combinedResults.length,
        search_time_ms: Date.now() - startTime,
        floir_results: floirResponse.data?.results?.length || 0,
        property_results: propertyResponse.results?.length || 0
      }

      setResults(response)
    } catch (err: unknown) {
      console.error('Unified search error:', err)
      setError(err.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const searchProperties = async (searchQuery: string) => {
    try {
      // Use full-text search on properties
      const { data, error } = await supabase
        .from('properties_ai_ready')
        .select(`
          id,
          parcel_id,
          address,
          city,
          county,
          owner_name,
          property_type,
          property_value,
          latitude,
          longitude,
          location_type,
          hurricane_risk,
          flood_risk
        `)
        .or(`address.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,county.ilike.%${searchQuery}%,owner_name.ilike.%${searchQuery}%`)
        .limit(15)

      if (error) throw error

      const results = (data || []).map(property => ({
        type: 'property' as const,
        id: property.id,
        title: property.address || `Parcel ${property.parcel_id}`,
        description: `${property.property_type || 'Property'} in ${property.city}, ${property.county} County`,
        metadata: property,
        similarity: calculatePropertyRelevance(property, searchQuery)
      }))

      return { results, error: null }
    } catch (error: unknown) {
      return { results: [], error: error.message }
    }
  }

  const combineResults = (floirResults: unknown[], propertyResults: unknown[]): UnifiedSearchResult[] => {
    const combined = [
      ...floirResults.map((result: unknown) => ({
        type: 'floir' as const,
        id: result.id,
        title: `${formatDataType(result.data_type)} - ${result.primary_key}`,
        description: result.content_snippet || 'Florida insurance regulation data',
        similarity: result.similarity,
        metadata: result,
        source_url: result.source_url
      })),
      ...propertyResults
    ]

    // Sort by relevance (similarity score)
    return combined.sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
  }

  const generateUnifiedAnswer = async (searchQuery: string, results: UnifiedSearchResult[]): Promise<string | undefined> => {
    if (results.length === 0) return undefined

    try {
      const context = results.slice(0, 5).map((result, index) => 
        `[${index + 1}] ${result.type.toUpperCase()}: ${result.title}\n${result.description}`
      ).join('\n\n')

      // Use a simple summary instead of calling OpenAI again
      const floirCount = results.filter(r => r.type === 'floir').length
      const propertyCount = results.filter(r => r.type === 'property').length

      return `Found ${results.length} results for "${searchQuery}": ${floirCount} insurance regulation records and ${propertyCount} property records. The results show relevant Florida insurance data and property information that may help with your inquiry.`
    } catch (error) {
      console.error('Failed to generate unified answer:', error)
      return undefined
    }
  }

  const calculatePropertyRelevance = (property: unknown, searchQuery: string): number => {
    const query = searchQuery.toLowerCase()
    let score = 0

    // Exact matches get higher scores
    if (property.address?.toLowerCase().includes(query)) score += 0.8
    if (property.city?.toLowerCase().includes(query)) score += 0.6
    if (property.county?.toLowerCase().includes(query)) score += 0.4
    if (property.owner_name?.toLowerCase().includes(query)) score += 0.7
    if (property.property_type?.toLowerCase().includes(query)) score += 0.3

    return Math.min(score, 1.0)
  }

  const formatDataType = (dataType: string) => {
    return dataType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'floir':
        return <FileText className="h-5 w-5 text-blue-500" />
      case 'property':
        return <Home className="h-5 w-5 text-green-500" />
      default:
        return <Building className="h-5 w-5 text-gray-500" />
    }
  }

  const getResultTypeColor = (type: string) => {
    switch (type) {
      case 'floir':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'property':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Unified Florida Data Search
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Search across Florida insurance regulation data and property records simultaneously
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Search for properties, insurance data, companies, regulations..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <div className="flex space-x-1">
                  <Button
                    variant={searchType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSearchType('all')}
                  >
                    All Data
                  </Button>
                  <Button
                    variant={searchType === 'regulation' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSearchType('regulation')}
                  >
                    Regulation
                  </Button>
                  <Button
                    variant={searchType === 'property' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSearchType('property')}
                  >
                    Property
                  </Button>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={loading || !query.trim()}
              className="self-start"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {results && (
        <div className="space-y-6">
          {/* AI Summary */}
          {results.answer && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-900 dark:text-blue-100">
                  Search Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-800 dark:text-blue-200">
                  {results.answer}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Search Results Summary */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Found {results.total_results} results in {results.search_time_ms}ms
                  </p>
                  <Badge variant="outline">
                    {results.floir_results} regulation
                  </Badge>
                  <Badge variant="outline">
                    {results.property_results} property
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Results */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Results ({results.total_results})</TabsTrigger>
              <TabsTrigger value="regulation">Regulation ({results.floir_results})</TabsTrigger>
              <TabsTrigger value="property">Property ({results.property_results})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {results.results.map((result, index) => (
                <Card 
                  key={`${result.type}-${result.id}`}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getResultIcon(result.type)}
                        <Badge className={getResultTypeColor(result.type)}>
                          {result.type === 'floir' ? 'Regulation' : 'Property'}
                        </Badge>
                        {result.similarity && (
                          <span className="text-sm text-gray-500">
                            {Math.round(result.similarity * 100)}% match
                          </span>
                        )}
                      </div>
                      {result.source_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(result.source_url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Source
                        </Button>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {result.title}
                    </h3>

                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {result.description}
                    </p>

                    {/* Type-specific metadata */}
                    {result.type === 'property' && result.metadata && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Location:</span>
                          <p className="font-medium">{result.metadata.city}, {result.metadata.county}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <p className="font-medium">{result.metadata.property_type || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Value:</span>
                          <p className="font-medium">
                            {result.metadata.property_value 
                              ? `$${result.metadata.property_value.toLocaleString()}`
                              : 'N/A'
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Risk:</span>
                          <p className="font-medium">
                            Hurricane: {Math.round((result.metadata.hurricane_risk || 0) * 100)}%
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="regulation">
              {results.results
                .filter(r => r.type === 'floir')
                .map((result, index) => (
                  <Card 
                    key={result.id}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            {formatDataType(result.metadata.data_type)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {Math.round((result.similarity || 0) * 100)}% match
                          </span>
                        </div>
                        {result.source_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(result.source_url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Source
                          </Button>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {result.title}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        {result.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="property">
              {results.results
                .filter(r => r.type === 'property')
                .map((result, index) => (
                  <Card 
                    key={result.id}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Home className="h-5 w-5 text-green-500" />
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Property
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {Math.round((result.similarity || 0) * 100)}% match
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {result.metadata.latitude?.toFixed(4)}, {result.metadata.longitude?.toFixed(4)}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {result.title}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {result.description}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Owner:</span>
                          <p className="font-medium">{result.metadata.owner_name || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <p className="font-medium">{result.metadata.property_type || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Value:</span>
                          <p className="font-medium">
                            {result.metadata.property_value 
                              ? `$${result.metadata.property_value.toLocaleString()}`
                              : 'N/A'
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Hurricane Risk:</span>
                          <p className="font-medium">
                            {Math.round((result.metadata.hurricane_risk || 0) * 100)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          </Tabs>

          {results.results.length === 0 && (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms or using different keywords.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
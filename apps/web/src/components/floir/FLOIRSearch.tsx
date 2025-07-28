'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@claimguardian/ui'
import { Badge } from '@claimguardian/ui'
import { Button } from '@claimguardian/ui'
import { Input } from '@claimguardian/ui'
import { createClient } from '@/lib/supabase/client'
import { Search, ExternalLink, Loader2, FileText, AlertTriangle } from 'lucide-react'

interface SearchResult {
  id: string
  data_type: string
  primary_key: string
  normalized_data: any
  source_url: string
  similarity: number
  content_snippet?: string
}

interface SearchResponse {
  query: string
  results: SearchResult[]
  context: string
  answer?: string
  total_results: number
  search_time_ms: number
}

const DATA_TYPE_COLORS = {
  catastrophe: 'bg-red-100 text-red-800 border-red-200',
  rate_filings: 'bg-blue-100 text-blue-800 border-blue-200',
  professional_liability: 'bg-purple-100 text-purple-800 border-purple-200',
  news_bulletins: 'bg-green-100 text-green-800 border-green-200',
  receivership: 'bg-orange-100 text-orange-800 border-orange-200',
  industry_reports: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  financial_reports: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  data_call: 'bg-pink-100 text-pink-800 border-pink-200',
  licensee_search: 'bg-teal-100 text-teal-800 border-teal-200',
  surplus_lines: 'bg-gray-100 text-gray-800 border-gray-200',
}

export default function FLOIRSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: funcError } = await supabase.functions.invoke('floir-rag-search', {
        body: {
          query: query.trim(),
          limit: 20,
          threshold: 0.3,
          include_context: true
        }
      })

      if (funcError) throw funcError

      setResults(data)
    } catch (err: any) {
      console.error('Search error:', err)
      setError(err.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const formatDataType = (dataType: string) => {
    return dataType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getDataTypeColor = (dataType: string) => {
    return DATA_TYPE_COLORS[dataType as keyof typeof DATA_TYPE_COLORS] || DATA_TYPE_COLORS.surplus_lines
  }

  const formatSimilarity = (similarity: number) => {
    return `${(similarity * 100).toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            FLOIR Data Search
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Search across Florida Office of Insurance Regulation data using AI-powered semantic search
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Search for catastrophe losses, rate filings, company information..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={loading || !query.trim()}
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
          {/* AI Answer */}
          {results.answer && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-900 dark:text-blue-100">
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                    {results.answer}
                  </p>
                </div>
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
                    Query: "{results.query}"
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          <div className="space-y-4">
            {results.results.map((result, index) => (
              <Card 
                key={result.id}
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge className={getDataTypeColor(result.data_type)}>
                        {formatDataType(result.data_type)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Match: {formatSimilarity(result.similarity)}
                      </span>
                      <span className="text-sm font-mono text-gray-400">
                        #{result.primary_key}
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

                  {result.content_snippet && (
                    <div className="mb-3">
                      <p className="text-gray-700 dark:text-gray-300">
                        {result.content_snippet}
                      </p>
                    </div>
                  )}

                  {/* Detailed Data */}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                      <FileText className="h-4 w-4 inline mr-1" />
                      View detailed data
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded border">
                      <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                        {JSON.stringify(result.normalized_data, null, 2)}
                      </pre>
                    </div>
                  </details>
                </CardContent>
              </Card>
            ))}
          </div>

          {results.results.length === 0 && (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms or using different keywords related to Florida insurance regulation.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@claimguardian/ui'
import { Badge } from '@claimguardian/ui'
import { Button } from '@claimguardian/ui'
import { createClient } from '@/lib/supabase/client'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database, 
  Loader2, 
  RefreshCw, 
  MapPin, 
  Home,
  Activity,
  TrendingUp
} from 'lucide-react'

interface ParcelStats {
  data_source: string
  county: string
  property_type: string
  property_count: number
  avg_property_value: number
  total_acres: number
  last_updated: string
}

interface ImportBatch {
  id: string
  data_source: string
  status: string
  total_records: number
  processed_records: number
  valid_records: number
  invalid_records: number
  started_at: string
  completed_at: string | null
  duration_seconds: number | null
}

export default function ParcelDashboard() {
  const [stats, setStats] = useState<ParcelStats[]>([])
  const [recentBatches, setRecentBatches] = useState<ImportBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const supabase = createClient()

  const fetchData = async () => {
    try {
      // Fetch parcel statistics
      const { data: statsData, error: statsError } = await supabase
        .from('properties_summary')
        .select('*')
        .order('property_count', { ascending: false })
      
      if (statsError) throw statsError
      
      // Fetch recent import batches
      const { data: batchesData, error: batchesError } = await supabase
        .from('parcel_import_batches')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10)
      
      if (batchesError) throw batchesError
      
      setStats(statsData || [])
      setRecentBatches(batchesData || [])
    } catch (error) {
      console.error('Error fetching parcel data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const triggerIngest = async (dataSource: string) => {
    try {
      setRefreshing(true)
      
      const { error } = await supabase.functions.invoke('florida-parcel-monitor', {
        body: {
          action: 'trigger_ingest',
          data_source: dataSource,
          force_refresh: false
        }
      })
      
      if (error) throw error
      
      // Refresh data after triggering ingest
      setTimeout(fetchData, 2000)
    } catch (error) {
      console.error('Error triggering ingest:', error)
    }
  }

  const enrichProperties = async (dataSource?: string) => {
    try {
      setRefreshing(true)
      
      const { error } = await supabase.functions.invoke('property-ai-enrichment', {
        body: {
          action: 'batch_enrich',
          data_source: dataSource,
          batch_size: 1000,
          include_embeddings: true,
          include_relationships: true
        }
      })
      
      if (error) throw error
      
      setTimeout(fetchData, 2000)
    } catch (error) {
      console.error('Error enriching properties:', error)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'importing':
      case 'transforming':
      case 'validating':
      case 'downloading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'importing':
      case 'transforming':
      case 'validating':
      case 'downloading':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDataSource = (dataSource: string) => {
    return dataSource
      .replace(/^fl_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const totalProperties = stats.reduce((sum, stat) => sum + stat.property_count, 0)
  const totalAcres = stats.reduce((sum, stat) => sum + stat.total_acres, 0)
  const avgPropertyValue = stats.length > 0 
    ? stats.reduce((sum, stat) => sum + (stat.avg_property_value * stat.property_count), 0) / totalProperties
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Florida Parcel Data
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Statewide property parcel information and analysis
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => enrichProperties()}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <Activity className="h-4 w-4 mr-2" />
            Enrich All
          </Button>
          <Button
            onClick={() => {
              setRefreshing(true)
              fetchData()
            }}
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Home className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Properties
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalProperties.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Area
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(totalAcres).toLocaleString()}
                  <span className="text-sm font-normal"> acres</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Property Value
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${Math.round(avgPropertyValue).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Data Sources
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Set(stats.map(s => s.data_source)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Sources Breakdown */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Data Sources Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(
              stats.reduce((acc, stat) => {
                if (!acc[stat.data_source]) {
                  acc[stat.data_source] = {
                    total_properties: 0,
                    total_acres: 0,
                    counties: new Set(),
                    last_updated: stat.last_updated
                  }
                }
                acc[stat.data_source].total_properties += stat.property_count
                acc[stat.data_source].total_acres += stat.total_acres
                acc[stat.data_source].counties.add(stat.county)
                return acc
              }, {} as Record<string, any>)
            ).map(([source, data]) => (
              <div
                key={source}
                className="flex items-center justify-between p-4 border rounded-lg border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <Database className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDataSource(source)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {data.total_properties.toLocaleString()} properties • {data.counties.size} counties
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {Math.round(data.total_acres).toLocaleString()} acres
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Updated {new Date(data.last_updated).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => triggerIngest(source)}
                    disabled={refreshing}
                  >
                    Import
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Import Batches */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Recent Import Batches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentBatches.map((batch) => (
              <div
                key={batch.id}
                className="flex items-center justify-between p-3 border rounded border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(batch.status)}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDataSource(batch.data_source)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Started {new Date(batch.started_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusColor(batch.status)}>
                    {batch.status}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {batch.valid_records?.toLocaleString() || 0} / {batch.total_records?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {formatDuration(batch.duration_seconds)}
                      {batch.invalid_records > 0 && (
                        <span className="text-red-500 ml-2">
                          ({batch.invalid_records} errors)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {recentBatches.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No import batches found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
/**
 * @fileMetadata
 * @purpose Monitoring dashboard for Florida parcels ETL pipeline
 * @owner data-team
 * @dependencies ["react", "lucide-react", "@supabase/supabase-js"]
 * @exports ["ParcelETLMonitor"]
 * @complexity high
 * @tags ["component", "admin", "monitoring", "etl"]
 * @status active
 */
'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, AlertCircle, CheckCircle, Clock, Database,
  Download, MapPin, RefreshCw, TrendingUp, Calendar,
  FileText, Info, Play, Pause
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@claimguardian/ui'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

interface IngestEvent {
  id: string
  ingest_batch_id: string
  source: string
  status: 'started' | 'completed' | 'failed'
  record_count: number | null
  error_message: string | null
  started_at: string
  completed_at: string | null
  metadata: any
}

interface ParcelStats {
  total_parcels: number
  by_source: Record<string, number>
  by_county: Record<string, number>
  last_updated: string
}

export function ParcelETLMonitor() {
  const [events, setEvents] = useState<IngestEvent[]>([])
  const [stats, setStats] = useState<ParcelStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    loadData()
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('ingest_events')
      .on('postgres_changes', {
        event: '*',
        schema: 'external',
        table: 'fl_parcel_ingest_events'
      }, () => {
        loadData()
      })
      .subscribe()
      
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    try {
      // Load recent ingest events
      const { data: eventsData, error: eventsError } = await supabase
        .from('fl_parcel_ingest_events')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10)
        
      if (eventsError) throw eventsError
      setEvents(eventsData || [])
      
      // Load parcel statistics
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_parcel_stats')
        
      if (statsError) throw statsError
      setStats(statsData)
      
    } catch (error) {
      console.error('Error loading ETL data:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerManualSync = async (source: string) => {
    setRefreshing(true)
    
    try {
      const { error } = await supabase.functions.invoke(`${source}-sync`)
      if (error) throw error
      
      // Reload data after triggering sync
      await loadData()
    } catch (error) {
      console.error(`Error triggering ${source} sync:`, error)
    } finally {
      setRefreshing(false)
    }
  }

  const refreshMaterializedView = async () => {
    setRefreshing(true)
    
    try {
      const { error } = await supabase.rpc('refresh_parcels_view')
      if (error) throw error
      
      await loadData()
    } catch (error) {
      console.error('Error refreshing materialized view:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return CheckCircle
      case 'started': return Clock
      case 'failed': return AlertCircle
      default: return Info
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'text-green-400'
      case 'started': return 'text-yellow-400'
      case 'failed': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getSourceColor = (source: string) => {
    switch(source) {
      case 'fgio': return 'bg-blue-600'
      case 'fdot': return 'bg-green-600'
      case 'fgdl': return 'bg-purple-600'
      case 'dor': return 'bg-orange-600'
      default: return 'bg-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Parcel ETL Monitor</h2>
          <p className="text-gray-400">Florida parcels data pipeline status</p>
        </div>
        <button
          onClick={refreshMaterializedView}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh View
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Database className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-gray-400">Total</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {(stats.total_parcels / 1000000).toFixed(2)}M
              </p>
              <p className="text-sm text-gray-400">Parcels</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-5 h-5 text-green-400" />
                <span className="text-xs text-gray-400">Counties</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {Object.keys(stats.by_county).length}
              </p>
              <p className="text-sm text-gray-400">Covered</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-purple-400" />
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {Object.keys(stats.by_source).length}
              </p>
              <p className="text-sm text-gray-400">Sources Active</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <span className="text-xs text-gray-400">Updated</span>
              </div>
              <p className="text-lg font-bold text-white">
                {formatDistanceToNow(new Date(stats.last_updated), { addSuffix: true })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Source Controls */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Data Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-white">FGIO</h4>
                  <p className="text-sm text-gray-400">Quarterly</p>
                </div>
                <Badge className={getSourceColor('fgio')}>
                  {stats?.by_source.fgio || 0}
                </Badge>
              </div>
              <button
                onClick={() => triggerManualSync('fgio')}
                disabled={refreshing}
                className="w-full bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white py-2 rounded flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Manual Sync
              </button>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-white">FDOT</h4>
                  <p className="text-sm text-gray-400">Weekly Delta</p>
                </div>
                <Badge className={getSourceColor('fdot')}>
                  {stats?.by_source.fdot || 0}
                </Badge>
              </div>
              <button
                onClick={() => triggerManualSync('fdot')}
                disabled={refreshing}
                className="w-full bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white py-2 rounded flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Manual Sync
              </button>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-white">FGDL</h4>
                  <p className="text-sm text-gray-400">Yearly</p>
                </div>
                <Badge className={getSourceColor('fgdl')}>
                  {stats?.by_source.fgdl || 0}
                </Badge>
              </div>
              <button
                disabled
                className="w-full bg-gray-700 text-gray-500 py-2 rounded flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Calendar className="w-4 h-4" />
                March 1st
              </button>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-white">DOR</h4>
                  <p className="text-sm text-gray-400">Annual</p>
                </div>
                <Badge className={getSourceColor('dor')}>
                  {stats?.by_source.dor || 0}
                </Badge>
              </div>
              <button
                disabled
                className="w-full bg-gray-700 text-gray-500 py-2 rounded flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <FileText className="w-4 h-4" />
                Manual URL
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Ingest Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.map((event) => {
              const StatusIcon = getStatusIcon(event.status)
              const duration = event.completed_at 
                ? new Date(event.completed_at).getTime() - new Date(event.started_at).getTime()
                : null
                
              return (
                <div key={event.id} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <StatusIcon className={`w-5 h-5 mt-0.5 ${getStatusColor(event.status)}`} />
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium text-white">
                            {event.source.toUpperCase()} Sync
                          </h4>
                          <Badge className={getSourceColor(event.source)}>
                            {event.metadata?.sync_type || 'full'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">
                          Started {formatDistanceToNow(new Date(event.started_at), { addSuffix: true })}
                        </p>
                        {event.error_message && (
                          <p className="text-sm text-red-400 mt-2">{event.error_message}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {event.record_count !== null && (
                        <p className="text-lg font-semibold text-white">
                          {event.record_count.toLocaleString()}
                        </p>
                      )}
                      {duration && (
                        <p className="text-xs text-gray-400">
                          {Math.round(duration / 1000 / 60)} min
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
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

import { Button } from '@claimguardian/ui'
import { AlertCircle, CheckCircle, Clock, Database, Loader2, RefreshCw } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { logger } from "@/lib/logger/production-logger"

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'


interface FLOIRStats {
  data_type: string
  total_records: number
  last_crawl_at: string | null
  last_crawl_status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  records_today: number
  avg_crawl_duration_seconds: number | null
}

interface CrawlRun {
  id: string
  data_type: string
  status: string
  records_processed: number
  records_created: number
  records_updated: number
  error_count: number
  started_at: string
  completed_at: string | null
  duration_seconds: number | null
}

export default function FLOIRDashboard() {
  const [stats, setStats] = useState<FLOIRStats[]>([])
  const [recentRuns, setRecentRuns] = useState<CrawlRun[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    try {
      // Fetch FLOIR statistics
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_floir_crawl_stats')
      
      if (statsError) throw statsError
      
      // Fetch recent crawl runs
      const { data: runsData, error: runsError } = await supabase
        .from('crawl_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10)
      
      if (runsError) throw runsError
      
      setStats(statsData || [])
      setRecentRuns(runsData || [])
    } catch (error) {
      logger.error('Error fetching FLOIR data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase])

  const triggerCrawl = async (dataType: string) => {
    try {
      setRefreshing(true)
      
      const { error } = await supabase
        .rpc('trigger_floir_crawl', {
          p_data_type: dataType,
          p_force_refresh: false
        })
      
      if (error) throw error
      
      // Refresh data after triggering crawl
      setTimeout(fetchData, 2000)
    } catch (error) {
      logger.error('Error triggering crawl:', error)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Set up real-time subscriptions for crawl updates
    Object.values(DATA_TYPE_CONFIG).forEach(config => {
      supabase.channel(`floir:${config.key}`)
        .on('broadcast', { event: 'crawl_complete' }, (payload) => {
          logger.info('Crawl completed:', payload)
          fetchData()
        })
        .subscribe()
    })
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    
    return () => {
      clearInterval(interval)
      supabase.removeAllChannels()
    }
  }, [fetchData, supabase])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'running':
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
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDataType = (dataType: string) => {
    return dataType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            FLOIR Data Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Florida Office of Insurance Regulation data monitoring
          </p>
        </div>
        <Button
          onClick={() => {
            setRefreshing(true)
            fetchData()
          }}
          disabled={refreshing}
          variant="secondary"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Records
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.reduce((sum, stat) => sum + stat.total_records, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Sources
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.filter(s => s.last_crawl_status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Records Today
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.reduce((sum, stat) => sum + stat.records_today, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Failed Sources
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.filter(s => s.last_crawl_status === 'failed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Sources Status */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Data Sources Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.data_type}
                className="flex items-center justify-between p-4 border rounded-lg border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(stat.last_crawl_status)}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDataType(stat.data_type)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.total_records.toLocaleString()} records
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(stat.last_crawl_status)}>
                    {stat.last_crawl_status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => triggerCrawl(stat.data_type)}
                    disabled={refreshing}
                  >
                    Crawl Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Crawl Runs */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Recent Crawl Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between p-3 border rounded border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(run.status)}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDataType(run.data_type)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Started {new Date(run.started_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {run.records_processed} processed
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDuration(run.duration_seconds)}
                    {run.error_count > 0 && (
                      <span className="text-red-500 ml-2">
                        ({run.error_count} errors)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const DATA_TYPE_CONFIG = {
  catastrophe: { key: 'catastrophe', name: 'Catastrophe Reports' },
  industry_reports: { key: 'industry_reports', name: 'Industry Reports' },
  professional_liability: { key: 'professional_liability', name: 'Professional Liability' },
  data_call: { key: 'data_call', name: 'Data Call Reports' },
  licensee_search: { key: 'licensee_search', name: 'Licensee Search' },
  rate_filings: { key: 'rate_filings', name: 'Rate Filings' },
  receivership: { key: 'receivership', name: 'Receivership' },
  financial_reports: { key: 'financial_reports', name: 'Financial Reports' },
  news_bulletins: { key: 'news_bulletins', name: 'News Bulletins' },
  surplus_lines: { key: 'surplus_lines', name: 'Surplus Lines' }
}

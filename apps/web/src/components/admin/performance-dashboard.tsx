/**
 * @fileMetadata
 * @purpose "Performance monitoring dashboard with real-time metrics and system health"
 * @dependencies ["react", "@/lib/utils", "lucide-react"]
 * @owner performance-team
 * @status stable
 */

'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  Database, 
  Zap, 
  Server, 
  Brain, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Trash2,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface PerformanceMetrics {
  timestamp: string
  status: string
  uptime: number
  version: string
  metrics: {
    database: {
      status: 'healthy' | 'warning' | 'error'
      responseTime: number
      activeConnections: number
      slowQueries: number
    }
    cache: {
      status: 'healthy' | 'warning' | 'error'
      hitRate: string
      memoryUsage: string
      entries: number
      costSaved: string
    }
    api: {
      totalRequests: number
      avgResponseTime: string
      errorRate: string
      rateLimit: {
        current: number
        limit: number
        window: string
      }
    }
    ai: {
      totalCost: number
      totalRequests: number
      avgCostPerRequest: number
      modelsUsed: string[]
      cacheHitRate: string
    }
  }
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/performance')
      if (!response.ok) throw new Error('Failed to fetch metrics')
      
      const data = await response.json()
      setMetrics(data)
      setLastUpdated(new Date())
      
    } catch (error) {
      console.error('Error fetching metrics:', error)
      toast.error('Failed to load performance metrics')
    } finally {
      setLoading(false)
    }
  }

  const clearCache = async (type: 'all' | 'expired') => {
    try {
      const response = await fetch('/api/admin/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      if (!response.ok) throw new Error('Failed to clear cache')
      
      const result = await response.json()
      toast.success(result.message)
      fetchMetrics() // Refresh metrics
      
    } catch (error) {
      console.error('Error clearing cache:', error)
      toast.error('Failed to clear cache')
    }
  }

  useEffect(() => {
    fetchMetrics()
    
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchMetrics, 30000) // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />
      default: return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60))
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((seconds % (60 * 60)) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Performance Dashboard</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-gray-400">Failed to load performance metrics</p>
        <Button onClick={fetchMetrics} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Performance Dashboard</h2>
          <p className="text-gray-400 mt-1">
            System uptime: {formatUptime(metrics.uptime)}
            {lastUpdated && (
              <span className="ml-4">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button
            onClick={fetchMetrics}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Database Health */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Database
            </CardTitle>
            <Database className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(metrics.metrics.database.status)}
              <Badge 
                className={`${getStatusColor(metrics.metrics.database.status)} text-white`}
              >
                {metrics.metrics.database.status}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {metrics.metrics.database.responseTime}ms
            </div>
            <p className="text-xs text-gray-400">
              {metrics.metrics.database.activeConnections} active connections
            </p>
          </CardContent>
        </Card>

        {/* Cache Health */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Cache Performance
            </CardTitle>
            <Zap className="w-4 h-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(metrics.metrics.cache.status)}
              <Badge 
                className={`${getStatusColor(metrics.metrics.cache.status)} text-white`}
              >
                {metrics.metrics.cache.status}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {metrics.metrics.cache.hitRate}
            </div>
            <p className="text-xs text-gray-400">
              {metrics.metrics.cache.entries} entries • {metrics.metrics.cache.memoryUsage}
            </p>
          </CardContent>
        </Card>

        {/* API Performance */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              API Performance
            </CardTitle>
            <Server className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">
              {metrics.metrics.api.avgResponseTime}
            </div>
            <p className="text-xs text-gray-400 mb-2">
              {metrics.metrics.api.totalRequests.toLocaleString()} total requests
            </p>
            <Progress 
              value={(metrics.metrics.api.rateLimit.current / metrics.metrics.api.rateLimit.limit) * 100}
              className="h-2"
            />
            <p className="text-xs text-gray-400 mt-1">
              Rate limit: {metrics.metrics.api.rateLimit.current}/{metrics.metrics.api.rateLimit.limit}
            </p>
          </CardContent>
        </Card>

        {/* AI Performance */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              AI Performance
            </CardTitle>
            <Brain className="w-4 h-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">
              {metrics.metrics.ai.cacheHitRate}
            </div>
            <p className="text-xs text-gray-400 mb-2">
              ${metrics.metrics.ai.totalCost.toFixed(4)} total cost
            </p>
            <p className="text-xs text-gray-400">
              {metrics.metrics.ai.totalRequests} requests • avg ${metrics.metrics.ai.avgCostPerRequest.toFixed(4)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Cache Management */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Cache Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Memory Usage:</span>
              <span className="text-white font-mono">{metrics.metrics.cache.memoryUsage}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Cost Saved:</span>
              <span className="text-green-400 font-mono">{metrics.metrics.cache.costSaved}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Entries:</span>
              <span className="text-white font-mono">{metrics.metrics.cache.entries}</span>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => clearCache('expired')}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Clock className="w-4 h-4 mr-2" />
                Clear Expired
              </Button>
              <Button
                onClick={() => clearCache('all')}
                variant="destructive"
                size="sm"
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Models Usage */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              AI Models Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Requests (24h):</span>
              <span className="text-white font-mono">{metrics.metrics.ai.totalRequests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Average Cost:</span>
              <span className="text-white font-mono">${metrics.metrics.ai.avgCostPerRequest.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Models Used:</span>
              <div className="flex flex-wrap gap-1 mt-2">
                {metrics.metrics.ai.modelsUsed.map((model, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {model}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status Summary */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            System Health Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${getStatusColor(metrics.metrics.database.status)}`} />
              <p className="text-sm text-gray-400">Database</p>
              <p className="text-xs text-gray-500">{metrics.metrics.database.slowQueries} slow queries</p>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${getStatusColor(metrics.metrics.cache.status)}`} />
              <p className="text-sm text-gray-400">Cache</p>
              <p className="text-xs text-gray-500">Hit rate: {metrics.metrics.cache.hitRate}</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 rounded-full mx-auto mb-2 bg-green-500" />
              <p className="text-sm text-gray-400">Overall</p>
              <p className="text-xs text-gray-500">All systems operational</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PerformanceDashboard
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

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database, HardDrive, Zap, AlertTriangle, CheckCircle, Trash2, Download, DollarSign, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { redisAICacheService } from '@/lib/ai/redis-cache-service'
import type { CacheStats } from '@/lib/ai/redis-cache-service'
import { toast } from 'sonner'

const FEATURE_COLORS = {
  'damage-analyzer': '#8B5CF6',
  'policy-chat': '#F59E0B',
  'settlement-analyzer': '#06B6D4',
  'claim-assistant': '#10B981',
  'document-generator': '#EF4444',
  'communication-helper': '#F97316'
}

export function RedisCacheDashboard() {
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [cacheInfo, setCacheInfo] = useState<any>(null)
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const updateData = async () => {
      try {
        const [currentStats, currentInfo, currentHealth] = await Promise.all([
          redisAICacheService.getStats(),
          redisAICacheService.getCacheInfo(),
          redisAICacheService.healthCheck()
        ])

        setStats(currentStats)
        setCacheInfo(currentInfo)
        setHealthStatus(currentHealth)

        // Add to historical data for charts
        setHistoricalData(prev => {
          const newData = {
            time: new Date().toLocaleTimeString('en-US', {
              hour12: false,
              minute: '2-digit',
              second: '2-digit'
            }),
            hitRate: parseFloat(currentStats.hitRate.toFixed(1)),
            totalSize: Math.round(currentInfo.totalSize / 1024), // KB
            totalKeys: currentInfo.totalKeys,
            avgResponseTime: Math.round(currentStats.avgResponseTime),
            costSaved: parseFloat(currentStats.costSaved.toFixed(2))
          }

          return [...prev, newData].slice(-30) // Keep last 30 data points
        })

        setLoading(false)
      } catch (error) {
        console.error('Error updating Redis cache data:', error)
        toast.error('Failed to update Redis cache data')
      }
    }

    updateData()
    const interval = setInterval(updateData, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const handleClearAll = async () => {
    try {
      const cleared = await redisAICacheService.clearAll()
      toast.success(`Cleared ${cleared} cache entries`)
    } catch (error) {
      toast.error('Failed to clear cache')
    }
  }

  const handleClearFeature = async (featureId: string) => {
    try {
      const cleared = await redisAICacheService.clearFeatureCache(featureId)
      toast.success(`Cleared ${cleared} entries for ${featureId}`)
    } catch (error) {
      toast.error(`Failed to clear cache for ${featureId}`)
    }
  }

  const handleExportData = async () => {
    try {
      const exportData = await redisAICacheService.exportData()
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `redis-cache-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Cache data exported successfully')
    } catch (error) {
      toast.error('Failed to export cache data')
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading Redis cache data...</p>
        </div>
      </div>
    )
  }

  const topFeatureData = stats?.topFeatures.map(feature => ({
    name: feature.featureId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: feature.hits,
    savings: feature.savings,
    color: FEATURE_COLORS[feature.featureId as keyof typeof FEATURE_COLORS] || '#6B7280'
  })) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Database className="h-7 w-7 text-red-400" />
            Redis Cache Monitor
          </h2>
          <p className="text-gray-400">Monitor persistent AI response caching system</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={!cacheInfo?.totalKeys}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={!cacheInfo?.totalKeys}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
          <Badge variant={healthStatus?.status === 'healthy' ? "default" : "destructive"}>
            {healthStatus?.status === 'healthy' ? (
              <>
                <CheckCircle className="mr-1 h-3 w-3" />
                Healthy
              </>
            ) : (
              <>
                <AlertTriangle className="mr-1 h-3 w-3" />
                {healthStatus?.status || 'Unknown'}
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Health Alert */}
      {healthStatus?.status !== 'healthy' && (
        <Alert className="bg-red-900/20 border-red-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Redis cache is {healthStatus?.status}: {healthStatus?.error || 'Unknown issue'}
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Cache Hit Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.hitRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.hits} hits / {stats?.totalRequests} requests
            </p>
            <Progress value={stats?.hitRate || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Cache Size</CardTitle>
            <HardDrive className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatBytes(cacheInfo?.totalSize || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {cacheInfo?.totalKeys || 0} entries
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Avg: {formatBytes(cacheInfo?.avgEntrySize || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Cost Saved</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${stats?.costSaved.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total savings from cache hits
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.avgResponseTime.toFixed(0)}ms
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Average response time
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Latency: {healthStatus?.latency || 0}ms
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hit Rate Trend */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Hit Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="time"
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      labelStyle={{ color: '#9CA3AF' }}
                      formatter={(value: number) => [`${value}%`, 'Hit Rate']}
                    />
                    <Line
                      type="monotone"
                      dataKey="hitRate"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cache Size Growth */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Cache Size Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="time"
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      labelStyle={{ color: '#9CA3AF' }}
                      formatter={(value: number) => [`${value} KB`, 'Cache Size']}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalSize"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Cache Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Cache Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Requests:</span>
                  <span className="text-white font-medium">{stats?.totalRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cache Hits:</span>
                  <span className="text-green-400 font-medium">{stats?.hits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cache Misses:</span>
                  <span className="text-red-400 font-medium">{stats?.misses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Hit Rate:</span>
                  <span className="text-white font-medium">{stats?.hitRate.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Storage Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Keys:</span>
                  <span className="text-white font-medium">{cacheInfo?.totalKeys}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Size:</span>
                  <span className="text-white font-medium">{formatBytes(cacheInfo?.totalSize || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Entry Size:</span>
                  <span className="text-white font-medium">{formatBytes(cacheInfo?.avgEntrySize || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Health Status:</span>
                  <Badge variant={healthStatus?.status === 'healthy' ? "default" : "destructive"}>
                    {healthStatus?.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Age Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Oldest Entry:</span>
                  <span className="text-white font-medium">
                    {cacheInfo?.oldestEntry
                      ? formatDuration(Date.now() - cacheInfo.oldestEntry) + ' ago'
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Newest Entry:</span>
                  <span className="text-white font-medium">
                    {cacheInfo?.newestEntry
                      ? formatDuration(Date.now() - cacheInfo.newestEntry) + ' ago'
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Response:</span>
                  <span className="text-white font-medium">{stats?.avgResponseTime.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Redis Latency:</span>
                  <span className="text-white font-medium">{healthStatus?.latency || 0}ms</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Features by Cache Hits */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Top Features by Cache Hits</CardTitle>
              </CardHeader>
              <CardContent>
                {topFeatureData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={topFeatureData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) =>
                          `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {topFeatureData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    <div className="text-center">
                      <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No feature data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feature Cache Management */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Feature Cache Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.topFeatures.map((feature, index) => (
                    <div key={feature.featureId} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          {feature.featureId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-sm text-gray-400">
                          {feature.hits} hits • ${feature.savings.toFixed(2)} saved
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClearFeature(feature.featureId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )) || (
                    <div className="text-center text-gray-400 py-8">
                      No feature cache data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Savings Trend */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Cost Savings Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="time"
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      labelStyle={{ color: '#9CA3AF' }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost Saved']}
                    />
                    <Line
                      type="monotone"
                      dataKey="costSaved"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Response Time Analysis */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Response Time Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="time"
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      labelStyle={{ color: '#9CA3AF' }}
                      formatter={(value: number) => [`${value}ms`, 'Avg Response Time']}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgResponseTime"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Cache Operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  disabled={!cacheInfo?.totalKeys}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Cache ({cacheInfo?.totalKeys || 0} entries)
                </Button>

                <Button
                  variant="outline"
                  onClick={handleExportData}
                  disabled={!cacheInfo?.totalKeys}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Cache Data
                </Button>

                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <h5 className="font-medium text-white mb-2">Cache Configuration</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• TTL: 1 hour (3600 seconds)</li>
                    <li>• Prefix: claimguardian:ai:</li>
                    <li>• Compression: Enabled</li>
                    <li>• Serialization: JSON</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Redis Status:</span>
                  <Badge variant={healthStatus?.status === 'healthy' ? "default" : "destructive"}>
                    {healthStatus?.status}
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Connection Latency:</span>
                  <span className="text-white font-medium">{healthStatus?.latency || 0}ms</span>
                </div>

                {healthStatus?.error && (
                  <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span className="text-red-400 font-medium">Error</span>
                    </div>
                    <p className="text-sm text-gray-300">{healthStatus.error}</p>
                  </div>
                )}

                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <h5 className="font-medium text-white mb-2">Cache Benefits</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Persistent across server restarts</li>
                    <li>• Shared across multiple instances</li>
                    <li>• Semantic similarity matching</li>
                    <li>• Automatic TTL management</li>
                    <li>• Compression for space efficiency</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

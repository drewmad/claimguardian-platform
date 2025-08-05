'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Database, 
  Zap, 
  TrendingUp, 
  Clock, 
  DollarSign,
  RotateCcw,
  Trash2,
  Settings,
  BarChart3,
  Activity,
  HardDrive,
  Timer
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { aiCacheManager } from '@/lib/ai/ai-cache-manager'
import type { CacheMetrics } from '@/lib/ai/ai-cache-manager'
import { toast } from 'sonner'

const FEATURE_COLORS = {
  'damage-analyzer': '#3B82F6',
  'policy-chat': '#8B5CF6',
  'settlement-analyzer': '#10B981',
  'claim-assistant': '#F59E0B',
  'document-generator': '#EF4444',
  'communication-helper': '#06B6D4',
  'evidence-organizer': '#84CC16',
  'ar-damage-documenter': '#F97316'
}

export function AICacheDashboard() {
  const [metrics, setMetrics] = useState<CacheMetrics & { hitRate: number } | null>(null)
  const [featureStats, setFeatureStats] = useState<Record<string, any>>({})
  const [cacheData, setCacheData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadCacheData()
    const interval = setInterval(loadCacheData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadCacheData = async () => {
    try {
      setRefreshing(true)
      
      // Get cache metrics
      const currentMetrics = aiCacheManager.getCacheMetrics()
      setMetrics(currentMetrics)
      
      // Get feature-specific statistics
      const stats = aiCacheManager.getFeatureStats()
      setFeatureStats(stats)
      
      // Get cache export data for charts
      const exportData = aiCacheManager.exportCacheData()
      setCacheData(exportData)
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading cache data:', error)
      toast.error('Failed to load cache data')
    } finally {
      setRefreshing(false)
    }
  }

  const handleClearExpired = async () => {
    try {
      const removedCount = aiCacheManager.clearExpiredCache()
      toast.success(`Cleared ${removedCount} expired cache entries`)
      await loadCacheData()
    } catch (error) {
      toast.error('Failed to clear expired cache')
    }
  }

  const handleClearFeatureCache = async (featureId: string) => {
    try {
      const removedCount = aiCacheManager.clearFeatureCache(featureId)
      toast.success(`Cleared ${removedCount} cache entries for ${featureId}`)
      await loadCacheData()
    } catch (error) {
      toast.error(`Failed to clear cache for ${featureId}`)
    }
  }

  // Prepare chart data
  const hitRateData = metrics ? [
    { name: 'Cache Hits', value: metrics.hits, color: '#10B981' },
    { name: 'Cache Misses', value: metrics.misses, color: '#EF4444' }
  ] : []

  const featureUsageData = Object.entries(featureStats).map(([feature, stats]) => ({
    feature: feature.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count: stats.count,
    cost: stats.totalCost,
    avgAge: Math.round(stats.avgAge / (1000 * 60 * 60)) // Convert to hours
  }))

  const costSavingsData = cacheData
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-24) // Last 24 entries
    .reduce((acc, item, index) => {
      const existing = acc.find(d => d.hour === Math.floor(index / 4))
      const costSaved = item.cost * (item.accessCount - 1) // Saved cost from cache hits
      
      if (existing) {
        existing.saved += costSaved
      } else {
        acc.push({
          hour: Math.floor(index / 4),
          saved: costSaved,
          label: `${Math.floor(index / 4)}h ago`
        })
      }
      return acc
    }, [] as any[])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading cache analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Database className="h-7 w-7 text-blue-400" />
            AI Cache Analytics
          </h2>
          <p className="text-gray-400">Monitor intelligent caching performance and cost savings</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearExpired}
            disabled={refreshing}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Clear Expired
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadCacheData}
            disabled={refreshing}
          >
            <Activity className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Cache Hit Rate</CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics?.hitRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics?.hits} hits / {metrics?.totalRequests} requests
            </p>
            <Progress value={metrics?.hitRate || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Cost Saved</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${metrics?.costSaved.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              From {metrics?.hits} cache hits
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Cache Size</CardTitle>
            <HardDrive className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics?.cacheSize}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Cached responses
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Response Time</CardTitle>
            <Timer className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics?.avgResponseTime.toFixed(0)}ms
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Including cache hits
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">By Feature</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hit Rate Breakdown */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Cache Hit Rate Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={hitRateData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => 
                        `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {hitRateData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Savings Over Time */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Cost Savings Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={costSavingsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="label" 
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      formatter={(value: number) => [`$${value.toFixed(3)}`, 'Cost Saved']}
                    />
                    <Line
                      type="monotone"
                      dataKey="saved"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Usage */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Cache Usage by Feature</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={featureUsageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="feature" 
                      stroke="#9CA3AF"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                    />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Feature Details */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Feature Cache Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(featureStats).map(([feature, stats]) => (
                    <div key={feature} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <div>
                        <div className="font-medium text-white capitalize">
                          {feature.replace('-', ' ')}
                        </div>
                        <div className="text-sm text-gray-400">
                          {stats.count} cached • ${stats.totalCost.toFixed(3)} saved
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {Math.round(stats.avgAge / (1000 * 60))}min avg age
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleClearFeatureCache(feature)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Performance Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Cache Hit Rate:</span>
                  <span className="text-green-400 font-medium">
                    {metrics?.hitRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Requests:</span>
                  <span className="text-white">{metrics?.totalRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cache Size:</span>
                  <span className="text-white">{metrics?.cacheSize} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cost Savings:</span>
                  <span className="text-green-400 font-medium">
                    ${metrics?.costSaved.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Response Time Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Average:</span>
                  <span className="text-white">{metrics?.avgResponseTime.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cache Hits:</span>
                  <span className="text-green-400">~5ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cache Misses:</span>
                  <span className="text-yellow-400">~2000ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Speed Improvement:</span>
                  <span className="text-green-400 font-medium">
                    {metrics?.hitRate ? (400 * (metrics.hitRate / 100)).toFixed(0) : 0}x faster
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Efficiency Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Hit/Miss Ratio:</span>
                  <span className="text-white">
                    {metrics?.hits}:{metrics?.misses}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cost per Request:</span>
                  <span className="text-white">
                    ${((metrics?.costSaved || 0) / (metrics?.totalRequests || 1)).toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cache Efficiency:</span>
                  <span className="text-green-400 font-medium">
                    {metrics?.hitRate && metrics.hitRate > 50 ? 'Excellent' : 
                     metrics?.hitRate && metrics.hitRate > 25 ? 'Good' : 'Improving'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Management Tab */}
        <TabsContent value="management" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Cache Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleClearExpired}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Clear Expired Entries
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={loadCacheData}
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Refresh Analytics
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => toast.info('Configuration panel coming soon')}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Cache Settings
                  </Button>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <h4 className="font-medium text-white mb-3">Quick Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Memory Usage:</span>
                      <span className="text-white">~{(metrics?.cacheSize || 0) * 0.5}KB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Active Features:</span>
                      <span className="text-white">{Object.keys(featureStats).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cache Age:</span>
                      <span className="text-white">
                        {cacheData.length > 0 
                          ? Math.round((Date.now() - Math.min(...cacheData.map(d => d.timestamp))) / (1000 * 60 * 60))
                          : 0}h
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Optimization Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.hitRate && metrics.hitRate < 30 && (
                    <div className="p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-yellow-400" />
                        <span className="text-yellow-400 font-medium">Low Hit Rate</span>
                      </div>
                      <p className="text-sm text-gray-300">
                        Consider adjusting cache TTL settings or improving semantic similarity matching.
                      </p>
                    </div>
                  )}

                  {metrics?.cacheSize && metrics.cacheSize > 800 && (
                    <div className="p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4 text-blue-400" />
                        <span className="text-blue-400 font-medium">High Cache Usage</span>
                      </div>
                      <p className="text-sm text-gray-300">
                        Cache is approaching capacity. Consider clearing expired entries.
                      </p>
                    </div>
                  )}

                  {metrics?.hitRate && metrics.hitRate > 70 && (
                    <div className="p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-green-400" />
                        <span className="text-green-400 font-medium">Excellent Performance</span>
                      </div>
                      <p className="text-sm text-gray-300">
                        Cache is performing optimally with high hit rate and cost savings.
                      </p>
                    </div>
                  )}

                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <h5 className="font-medium text-white mb-2">Next Steps</h5>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Monitor cache performance during peak usage</li>
                      <li>• Adjust TTL based on feature requirements</li>
                      <li>• Enable semantic similarity for better matching</li>
                      <li>• Consider Redis integration for persistent caching</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
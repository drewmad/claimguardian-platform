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

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, TrendingUp, TrendingDown, Clock, Users, Zap, AlertTriangle, BarChart3, RefreshCw, Download } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { analyticsStream } from '@/lib/analytics/stream-processor'
import type { AggregatedMetrics } from '@/lib/analytics/stream-processor'
import { toast } from 'sonner'

const FEATURE_COLORS = {
  'damage-analyzer': '#8B5CF6',
  'policy-chat': '#F59E0B',
  'settlement-analyzer': '#06B6D4',
  'claim-assistant': '#10B981',
  'document-generator': '#EF4444',
  'communication-helper': '#F97316',
  'evidence-organizer': '#EC4899',
  '3d-model-generator': '#6366F1'
}

const MODEL_COLORS = {
  'gpt-4-turbo': '#10B981',
  'gpt-3.5-turbo': '#3B82F6',
  'gemini-1.5-pro': '#F59E0B',
  'gemini-1.5-flash': '#FBBF24',
  'claude-3-opus': '#8B5CF6',
  'claude-3-sonnet': '#A78BFA',
  'claude-3-haiku': '#C4B5FD'
}

export function RealTimeAnalyticsDashboard() {
  const [selectedInterval, setSelectedInterval] = useState<'1m' | '5m' | '1h' | '1d'>('5m')
  const [currentMetrics, setCurrentMetrics] = useState<AggregatedMetrics | null>(null)
  const [historicalData, setHistoricalData] = useState<AggregatedMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch current metrics
  const fetchCurrentMetrics = useCallback(() => {
    const metrics = analyticsStream.getRealTimeMetrics(selectedInterval)
    setCurrentMetrics(metrics)
  }, [selectedInterval])

  // Fetch historical data
  const fetchHistoricalData = useCallback(async () => {
    try {
      const endTime = new Date()
      const startTime = new Date()

      // Set start time based on interval
      switch (selectedInterval) {
        case '1m':
          startTime.setHours(startTime.getHours() - 1) // Last hour
          break
        case '5m':
          startTime.setHours(startTime.getHours() - 6) // Last 6 hours
          break
        case '1h':
          startTime.setDate(startTime.getDate() - 7) // Last 7 days
          break
        case '1d':
          startTime.setDate(startTime.getDate() - 30) // Last 30 days
          break
      }

      const data = await analyticsStream.getHistoricalMetrics(
        selectedInterval,
        startTime,
        endTime
      )

      setHistoricalData(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch historical data:', error)
      toast.error('Failed to load analytics data')
    }
  }, [selectedInterval])

  // Update data periodically
  useEffect(() => {
    fetchCurrentMetrics()
    fetchHistoricalData()

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchCurrentMetrics()
        fetchHistoricalData()
      }, 5000) // Update every 5 seconds

      return () => clearInterval(interval)
    }

    return undefined
  }, [selectedInterval, autoRefresh, fetchCurrentMetrics, fetchHistoricalData])

  // Calculate trend
  const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
    if (current > previous * 1.1) return 'up'
    if (current < previous * 0.9) return 'down'
    return 'stable'
  }

  // Export data
  const handleExportData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      interval: selectedInterval,
      currentMetrics,
      historicalData
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Analytics data exported')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading real-time analytics...</p>
        </div>
      </div>
    )
  }

  const currentStats = currentMetrics?.metrics || {
    totalRequests: 0,
    cacheHitRate: 0,
    avgResponseTime: 0,
    totalCost: 0,
    errorRate: 0,
    activeUsers: 0,
    topFeatures: [],
    modelPerformance: []
  }

  // Prepare chart data
  const timeSeriesData = historicalData.map(metric => ({
    time: new Date(metric.timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    }),
    requests: metric.metrics.totalRequests,
    cacheHitRate: metric.metrics.cacheHitRate,
    responseTime: metric.metrics.avgResponseTime,
    cost: metric.metrics.totalCost,
    errorRate: metric.metrics.errorRate,
    users: metric.metrics.activeUsers
  }))

  const featureDistribution = currentStats.topFeatures.map(feature => ({
    name: feature.featureId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: feature.requests,
    cost: feature.cost,
    fill: FEATURE_COLORS[feature.featureId as keyof typeof FEATURE_COLORS] || '#6B7280'
  }))

  const modelPerformanceData = currentStats.modelPerformance.map(model => ({
    name: model.model,
    requests: model.requests,
    responseTime: model.avgTime,
    errorRate: model.errorRate,
    fill: MODEL_COLORS[model.model as keyof typeof MODEL_COLORS] || '#6B7280'
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="h-7 w-7 text-blue-400" />
            Real-Time Analytics
          </h2>
          <p className="text-gray-400">Live AI operations monitoring and insights</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Interval Selector */}
      <div className="flex gap-2">
        {(['1m', '5m', '1h', '1d'] as const).map(interval => (
          <Button
            key={interval}
            variant={selectedInterval === interval ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedInterval(interval)}
          >
            {interval === '1m' && 'Real-time (1min)'}
            {interval === '5m' && 'Near Real-time (5min)'}
            {interval === '1h' && 'Hourly'}
            {interval === '1d' && 'Daily'}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Request Volume</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {currentStats.totalRequests.toLocaleString()}
            </div>
            {historicalData.length > 1 && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                {calculateTrend(
                  currentStats.totalRequests,
                  historicalData[historicalData.length - 2].metrics.totalRequests
                ) === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : calculateTrend(
                  currentStats.totalRequests,
                  historicalData[historicalData.length - 2].metrics.totalRequests
                ) === 'down' ? (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                ) : null}
                vs previous {selectedInterval}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Cache Performance</CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {currentStats.cacheHitRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Hit rate this {selectedInterval}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {currentStats.avgResponseTime.toFixed(0)}ms
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Average this {selectedInterval}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Users</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {currentStats.activeUsers}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Unique users this {selectedInterval}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeseries" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="timeseries">Time Series</TabsTrigger>
          <TabsTrigger value="features">Feature Usage</TabsTrigger>
          <TabsTrigger value="models">Model Performance</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
        </TabsList>

        {/* Time Series Tab */}
        <TabsContent value="timeseries" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request Volume Chart */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Request Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
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
                    />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
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
                    />
                    <Line
                      type="monotone"
                      dataKey="cacheHitRate"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Cache Hit %"
                    />
                    <Line
                      type="monotone"
                      dataKey="errorRate"
                      stroke="#EF4444"
                      strokeWidth={2}
                      name="Error Rate %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Response Time and Cost */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Response Time Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={timeSeriesData}>
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
                      formatter={(value: number) => [`${value}ms`, 'Response Time']}
                    />
                    <Line
                      type="monotone"
                      dataKey="responseTime"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={timeSeriesData}>
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
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Feature Usage Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Distribution */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Feature Usage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {featureDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={featureDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) =>
                          `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {featureDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                        formatter={(value: number, name: string, props: { payload?: { cost?: number } }) => [
                          `Requests: ${value}`,
                          `Cost: $${props.payload?.cost?.toFixed(2) || '0.00'}`
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    No feature data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feature Performance Table */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Feature Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentStats.topFeatures.slice(0, 5).map((feature, index) => (
                    <div key={feature.featureId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: FEATURE_COLORS[feature.featureId as keyof typeof FEATURE_COLORS] || '#6B7280'
                          }}
                        />
                        <span className="text-white">
                          {feature.featureId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">{feature.requests} requests</div>
                        <div className="text-sm text-gray-400">${feature.cost.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Model Performance Tab */}
        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Model Usage Distribution */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Model Usage</CardTitle>
              </CardHeader>
              <CardContent>
                {modelPerformanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={modelPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="name"
                        stroke="#9CA3AF"
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      />
                      <Bar dataKey="requests" name="Requests">
                        {modelPerformanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    No model data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Model Performance Metrics */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Model Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentStats.modelPerformance.map((model, index) => (
                    <div key={model.model} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{model.model}</span>
                        <Badge variant={model.errorRate > 5 ? "destructive" : "default"}>
                          {model.errorRate.toFixed(1)}% errors
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{model.requests} requests</span>
                        <span>{model.avgTime.toFixed(0)}ms avg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Over Time */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Cost Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
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
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                    />
                    <Area
                      type="monotone"
                      dataKey="cost"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Summary */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Cost ({selectedInterval})</span>
                  <span className="text-2xl font-bold text-white">
                    ${currentStats.totalCost.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Cache Savings</span>
                    <span className="text-green-400">
                      ${(currentStats.totalCost * (currentStats.cacheHitRate / 100)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Per Request</span>
                    <span className="text-white">
                      ${currentStats.totalRequests > 0
                        ? (currentStats.totalCost / currentStats.totalRequests).toFixed(4)
                        : '0.0000'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Per User</span>
                    <span className="text-white">
                      ${currentStats.activeUsers > 0
                        ? (currentStats.totalCost / currentStats.activeUsers).toFixed(2)
                        : '0.00'
                      }
                    </span>
                  </div>
                </div>

                {currentStats.errorRate > 5 && (
                  <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span className="text-red-400 font-medium">High Error Rate</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      {currentStats.errorRate.toFixed(1)}% of requests are failing
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

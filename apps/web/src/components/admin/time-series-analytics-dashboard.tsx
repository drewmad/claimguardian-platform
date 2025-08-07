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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Clock, DollarSign, Target, BarChart3, LineChart as LineChartIcon, Filter, Download, RefreshCw, Eye, AlertCircle } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { aiTimeSeriesAnalyzer } from '@/lib/analytics/time-series-analyzer'
import type {
  AIPerformanceAnalysis,
  AnomalyPoint,
  PerformanceTrend,
  ComparisonAnalysis
} from '@/lib/analytics/time-series-analyzer'
import { toast } from 'sonner'
import type { TooltipFormatter } from './types'

const METRIC_COLORS = {
  responseTime: '#3B82F6',
  throughput: '#10B981',
  errorRate: '#EF4444',
  cost: '#F59E0B',
  accuracy: '#8B5CF6'
}

const TREND_ICONS = {
  improving: TrendingUp,
  degrading: TrendingDown,
  stable: Activity
}

const SEVERITY_COLORS = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#D97706',
  low: '#65A30D'
}

export function TimeSeriesAnalyticsDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h')
  const [selectedResolution, setSelectedResolution] = useState<'1m' | '5m' | '15m' | '1h' | '1d'>('15m')
  const [analysis, setAnalysis] = useState<AIPerformanceAnalysis | null>(null)
  const [comparison, setComparison] = useState<ComparisonAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [showAnomalies, setShowAnomalies] = useState(true)
  const [showForecasts, setShowForecasts] = useState(false)
  const [comparisonMode, setComparisonMode] = useState(false)

  useEffect(() => {
    loadAnalytics()
    const interval = setInterval(loadAnalytics, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [selectedTimeframe, selectedResolution, selectedFeatures, selectedModels])

  const loadAnalytics = async () => {
    try {
      setLoading(true)

      const endTime = new Date()
      const startTime = new Date()

      // Calculate start time based on timeframe
      switch (selectedTimeframe) {
        case '1h':
          startTime.setHours(startTime.getHours() - 1)
          break
        case '6h':
          startTime.setHours(startTime.getHours() - 6)
          break
        case '24h':
          startTime.setDate(startTime.getDate() - 1)
          break
        case '7d':
          startTime.setDate(startTime.getDate() - 7)
          break
        case '30d':
          startTime.setDate(startTime.getDate() - 30)
          break
      }

      const analysisResult = await aiTimeSeriesAnalyzer.analyzeAIPerformance({
        startTime,
        endTime,
        resolution: selectedResolution,
        features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
        models: selectedModels.length > 0 ? selectedModels : undefined,
        includeForecasting: showForecasts,
        includeAnomalyDetection: showAnomalies
      })

      setAnalysis(analysisResult)

      // Load comparison if in comparison mode
      if (comparisonMode) {
        const comparisonStart = new Date(startTime)
        const comparisonEnd = new Date(endTime)

        // Compare with previous period
        const periodDuration = endTime.getTime() - startTime.getTime()
        comparisonStart.setTime(startTime.getTime() - periodDuration)
        comparisonEnd.setTime(endTime.getTime() - periodDuration)

        const comparisonResult = await aiTimeSeriesAnalyzer.comparePerformance(
          comparisonStart,
          comparisonEnd,
          startTime,
          endTime,
          {
            features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
            models: selectedModels.length > 0 ? selectedModels : undefined
          }
        )

        setComparison(comparisonResult)
      }

      setLoading(false)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      toast.error('Failed to load analytics data')
      setLoading(false)
    }
  }

  const handleExportData = () => {
    if (!analysis) return

    const exportData = {
      timeframe: analysis.timeframe,
      metrics: analysis.metrics,
      trends: analysis.trends,
      anomalies: analysis.anomalies,
      recommendations: analysis.recommendations,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ai-analytics-${analysis.timeframe.start.toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Analytics data exported')
  }

  const formatMetricValue = (metric: string, value: number): string => {
    switch (metric) {
      case 'responseTime':
        return `${value.toFixed(0)}ms`
      case 'throughput':
        return `${value.toFixed(1)}/min`
      case 'errorRate':
        return `${value.toFixed(2)}%`
      case 'cost':
        return `$${value.toFixed(4)}`
      case 'accuracy':
        return `${(value * 100).toFixed(1)}%`
      default:
        return value.toString()
    }
  }

  const prepareChartData = (metric: string) => {
    if (!analysis) return []

    // This would be populated from the actual time series data
    // For now, returning mock data structure
    return Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      value: Math.random() * 100 + 50,
      forecast: showForecasts ? Math.random() * 100 + 50 : undefined
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading time-series analytics...</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-500">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-blue-400" />
            Time-Series Analytics
          </h2>
          <p className="text-gray-400">Advanced AI performance tracking and forecasting</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForecasts(!showForecasts)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Forecasts: {showForecasts ? 'On' : 'Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setComparisonMode(!comparisonMode)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Compare: {comparisonMode ? 'On' : 'Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalytics}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Time Controls */}
      <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex gap-2">
          <span className="text-gray-400 text-sm">Timeframe:</span>
          {(['1h', '6h', '24h', '7d', '30d'] as const).map(timeframe => (
            <Button
              key={timeframe}
              variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe(timeframe)}
            >
              {timeframe}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <span className="text-gray-400 text-sm">Resolution:</span>
          {(['1m', '5m', '15m', '1h', '1d'] as const).map(resolution => (
            <Button
              key={resolution}
              variant={selectedResolution === resolution ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedResolution(resolution)}
            >
              {resolution}
            </Button>
          ))}
        </div>
      </div>

      {/* Recommendations Alert */}
      {analysis.recommendations.length > 0 && (
        <Alert className="bg-yellow-900/20 border-yellow-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Performance Recommendations:</div>
            <ul className="list-disc list-inside space-y-1">
              {analysis.recommendations.slice(0, 3).map((rec, index) => (
                <li key={index} className="text-sm">{rec}</li>
              ))}
              {analysis.recommendations.length > 3 && (
                <li className="text-sm text-gray-400">
                  +{analysis.recommendations.length - 3} more recommendations
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {Object.entries(analysis.metrics).map(([metricName, metrics]) => {
          const Icon = metricName === 'responseTime' ? Clock :
                     metricName === 'throughput' ? Activity :
                     metricName === 'errorRate' ? AlertTriangle :
                     metricName === 'cost' ? DollarSign : Target

          const trendKey = metrics.trend === 'increasing' ? 'improving' :
                           metrics.trend === 'decreasing' ? 'degrading' : 'stable'
          const TrendIcon = TREND_ICONS[trendKey as keyof typeof TREND_ICONS]

          return (
            <Card key={metricName} className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400 capitalize">
                  {metricName.replace(/([A-Z])/g, ' $1').trim()}
                </CardTitle>
                <Icon className="h-4 w-4" style={{ color: METRIC_COLORS[metricName as keyof typeof METRIC_COLORS] }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatMetricValue(metricName, metrics.mean)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <TrendIcon className={`h-3 w-3 ${
                    metrics.trend === 'increasing' ? 'text-green-500' :
                    metrics.trend === 'decreasing' ? 'text-red-500' :
                    'text-gray-500'
                  }`} />
                  <span className="text-xs text-gray-500">
                    P99: {formatMetricValue(metricName, metrics.percentile99)}
                  </span>
                </div>
                <Badge
                  variant={metrics.trend === 'increasing' ? 'default' :
                          metrics.trend === 'decreasing' ? 'destructive' : 'secondary'}
                  className="text-xs mt-2"
                >
                  {metrics.trend}
                </Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="timeseries" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="timeseries">Time Series</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          {comparisonMode && <TabsTrigger value="comparison">Comparison</TabsTrigger>}
        </TabsList>

        {/* Time Series Charts */}
        <TabsContent value="timeseries" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.keys(analysis.metrics).map(metricName => (
              <Card key={metricName} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white capitalize">
                    {metricName.replace(/([A-Z])/g, ' $1').trim()} Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={prepareChartData(metricName)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="time"
                        stroke="#9CA3AF"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickFormatter={(value) => formatMetricValue(metricName, value)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '6px'
                        }}
                        formatter={(value: number) => [formatMetricValue(metricName, value), 'Value']}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={METRIC_COLORS[metricName as keyof typeof METRIC_COLORS]}
                        fill={METRIC_COLORS[metricName as keyof typeof METRIC_COLORS]}
                        fillOpacity={0.3}
                      />
                      {showForecasts && (
                        <Area
                          type="monotone"
                          dataKey="forecast"
                          stroke={METRIC_COLORS[metricName as keyof typeof METRIC_COLORS]}
                          strokeDasharray="5 5"
                          fill="none"
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trends Analysis */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.trends.map((trend, index) => {
                    const TrendIcon = TREND_ICONS[trend.direction]
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <TrendIcon className={`h-5 w-5 ${
                            trend.direction === 'improving' ? 'text-green-500' :
                            trend.direction === 'degrading' ? 'text-red-500' :
                            'text-gray-500'
                          }`} />
                          <div>
                            <div className="text-white font-medium capitalize">
                              {trend.metric.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="text-gray-400 text-sm">
                              {trend.rate.toFixed(2)}% change rate
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            trend.direction === 'improving' ? 'default' :
                            trend.direction === 'degrading' ? 'destructive' :
                            'secondary'
                          }>
                            {trend.direction}
                          </Badge>
                          <div className="text-gray-400 text-xs mt-1">
                            Confidence: {(trend.significance * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Trend Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analysis.trends.map((trend, index) => ({
                    metric: trend.metric,
                    rate: trend.rate,
                    significance: trend.significance * 100
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="metric"
                      stroke="#9CA3AF"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="rate" fill="#3B82F6" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Anomalies */}
        <TabsContent value="anomalies" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Detected Anomalies ({analysis.anomalies.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.anomalies.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No anomalies detected in the selected timeframe
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.anomalies.slice(0, 10).map((anomaly, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: SEVERITY_COLORS[anomaly.severity] }}
                        />
                        <div>
                          <div className="text-white font-medium">
                            {anomaly.type.replace(/_/g, ' ')} - {formatMetricValue('value', anomaly.value)}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {anomaly.timestamp.toLocaleString()} • Expected: {formatMetricValue('value', anomaly.expectedValue)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          anomaly.severity === 'critical' ? 'destructive' :
                          anomaly.severity === 'high' ? 'destructive' :
                          anomaly.severity === 'medium' ? 'secondary' : 'outline'
                        }>
                          {anomaly.severity}
                        </Badge>
                        <div className="text-gray-400 text-xs mt-1">
                          {(anomaly.confidence * 100).toFixed(0)}% confidence
                        </div>
                      </div>
                    </div>
                  ))}
                  {analysis.anomalies.length > 10 && (
                    <div className="text-center text-gray-400 text-sm">
                      +{analysis.anomalies.length - 10} more anomalies
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forecasts */}
        <TabsContent value="forecasts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {['nextHour', 'nextDay', 'nextWeek'].map(timeHorizon => (
              <Card key={timeHorizon} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white capitalize">
                    {timeHorizon.replace(/([A-Z])/g, ' $1').trim()} Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analysis.forecast[timeHorizon as keyof typeof analysis.forecast].map((point, index) => ({
                      time: index,
                      value: point.value
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '6px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Comparison */}
        {comparisonMode && comparison && (
          <TabsContent value="comparison" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Period Comparison Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-white">
                      {comparison.overallImprovement.toFixed(1)}%
                    </div>
                    <div className="text-gray-400">Overall Improvement Score</div>
                  </div>

                  <div className="space-y-3">
                    {comparison.significantChanges.map((change, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div>
                          <div className="text-white font-medium capitalize">
                            {change.metric.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {formatMetricValue(change.metric, change.baselineValue)} → {formatMetricValue(change.metric, change.comparisonValue)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${
                            change.percentChange > 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {change.percentChange > 0 ? '+' : ''}{change.percentChange.toFixed(1)}%
                          </div>
                          {change.isSignificant && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Significant
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {comparison.recommendations.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-white font-medium mb-3">Recommendations:</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm">
                        {comparison.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

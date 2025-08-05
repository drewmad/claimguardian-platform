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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Activity, Zap, Clock, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown, Gauge, Server, RotateCcw, Play, Pause } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

interface RealTimeMetrics {
  timestamp: number
  responseTime: number
  requestsPerSecond: number
  errorRate: number
  cacheHitRate: number
  activeConnections: number
  memoryUsage: number
  cpuUsage: number
}

interface PerformanceAlert {
  id: string
  level: 'info' | 'warning' | 'critical'
  message: string
  timestamp: number
  metric: string
  value: number
  threshold: number
}

interface FeaturePerformance {
  featureId: string
  name: string
  status: 'healthy' | 'warning' | 'critical'
  avgResponseTime: number
  requestCount: number
  errorRate: number
  trend: 'up' | 'down' | 'stable'
}

// Mock real-time data generator
const generateMockMetrics = (): RealTimeMetrics => ({
  timestamp: Date.now(),
  responseTime: 800 + Math.random() * 1200,
  requestsPerSecond: 5 + Math.random() * 15,
  errorRate: Math.random() * 3,
  cacheHitRate: 70 + Math.random() * 25,
  activeConnections: 50 + Math.random() * 100,
  memoryUsage: 40 + Math.random() * 30,
  cpuUsage: 20 + Math.random() * 40
})

const MOCK_FEATURES: FeaturePerformance[] = [
  {
    featureId: 'damage-analyzer',
    name: 'Damage Analyzer',
    status: 'healthy',
    avgResponseTime: 1850,
    requestCount: 342,
    errorRate: 1.2,
    trend: 'stable'
  },
  {
    featureId: 'policy-chat',
    name: 'Policy Chat',
    status: 'healthy',
    avgResponseTime: 1240,
    requestCount: 678,
    errorRate: 0.8,
    trend: 'up'
  },
  {
    featureId: 'settlement-analyzer',
    name: 'Settlement Analyzer',
    status: 'warning',
    avgResponseTime: 2650,
    requestCount: 156,
    errorRate: 4.2,
    trend: 'down'
  },
  {
    featureId: 'claim-assistant',
    name: 'Claim Assistant',
    status: 'healthy',
    avgResponseTime: 980,
    requestCount: 234,
    errorRate: 0.5,
    trend: 'up'
  }
]

export function AIPerformanceMonitor() {
  const [metrics, setMetrics] = useState<RealTimeMetrics[]>([])
  const [currentMetrics, setCurrentMetrics] = useState<RealTimeMetrics | null>(null)
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [featurePerformance, setFeaturePerformance] = useState<FeaturePerformance[]>(MOCK_FEATURES)
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Thresholds for alerts
  const thresholds = {
    responseTime: 3000,
    errorRate: 5.0,
    cacheHitRate: 50,
    memoryUsage: 80,
    cpuUsage: 70
  }

  const generateAlert = useCallback((metric: string, value: number, threshold: number): PerformanceAlert => ({
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    level: value > threshold * 1.5 ? 'critical' : 'warning',
    message: `${metric} is ${value > threshold ? 'above' : 'below'} threshold (${value.toFixed(1)} vs ${threshold})`,
    timestamp: Date.now(),
    metric,
    value,
    threshold
  }), [])

  const checkThresholds = useCallback((newMetrics: RealTimeMetrics) => {
    const newAlerts: PerformanceAlert[] = []

    if (newMetrics.responseTime > thresholds.responseTime) {
      newAlerts.push(generateAlert('Response Time', newMetrics.responseTime, thresholds.responseTime))
    }
    if (newMetrics.errorRate > thresholds.errorRate) {
      newAlerts.push(generateAlert('Error Rate', newMetrics.errorRate, thresholds.errorRate))
    }
    if (newMetrics.cacheHitRate < thresholds.cacheHitRate) {
      newAlerts.push(generateAlert('Cache Hit Rate', newMetrics.cacheHitRate, thresholds.cacheHitRate))
    }
    if (newMetrics.memoryUsage > thresholds.memoryUsage) {
      newAlerts.push(generateAlert('Memory Usage', newMetrics.memoryUsage, thresholds.memoryUsage))
    }
    if (newMetrics.cpuUsage > thresholds.cpuUsage) {
      newAlerts.push(generateAlert('CPU Usage', newMetrics.cpuUsage, thresholds.cpuUsage))
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 10)) // Keep last 10 alerts
    }
  }, [generateAlert, thresholds])

  const updateMetrics = useCallback(() => {
    if (!isMonitoring) return

    const newMetrics = generateMockMetrics()
    setCurrentMetrics(newMetrics)
    setMetrics(prev => [...prev, newMetrics].slice(-50)) // Keep last 50 data points
    checkThresholds(newMetrics)
  }, [isMonitoring, checkThresholds])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(updateMetrics, 2000) // Update every 2 seconds
    return () => clearInterval(interval)
  }, [autoRefresh, updateMetrics])

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }

  const toggleMonitoring = () => {
    setIsMonitoring(prev => !prev)
    if (!isMonitoring && metrics.length === 0) {
      updateMetrics() // Initialize with first data point
    }
  }

  const getStatusColor = (status: FeaturePerformance['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'critical': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: FeaturePerformance['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      case 'critical': return <XCircle className="h-4 w-4 text-red-400" />
      default: return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const getTrendIcon = (trend: FeaturePerformance['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-400" />
      case 'down': return <TrendingDown className="h-3 w-3 text-red-400" />
      default: return <Activity className="h-3 w-3 text-gray-400" />
    }
  }

  // Prepare chart data
  const chartData = metrics.map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      minute: '2-digit', 
      second: '2-digit' 
    }),
    responseTime: Math.round(m.responseTime),
    errorRate: parseFloat(m.errorRate.toFixed(1)),
    cacheHitRate: parseFloat(m.cacheHitRate.toFixed(1)),
    requestsPerSecond: parseFloat(m.requestsPerSecond.toFixed(1))
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Gauge className="h-7 w-7 text-blue-400" />
            Real-Time Performance Monitor
          </h2>
          <p className="text-gray-400">Live monitoring of AI operations performance</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <Pause className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={updateMetrics}
            disabled={!isMonitoring}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant={isMonitoring ? "default" : "outline"}
            size="sm"
            onClick={toggleMonitoring}
          >
            <Activity className="mr-2 h-4 w-4" />
            {isMonitoring ? 'Monitoring' : 'Stopped'}
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert) => (
            <Alert key={alert.id} className={`${
              alert.level === 'critical' ? 'bg-red-900/20 border-red-900' :
              alert.level === 'warning' ? 'bg-yellow-900/20 border-yellow-900' :
              'bg-blue-900/20 border-blue-900'
            }`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{alert.message}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissAlert(alert.id)}
                >
                  ×
                </Button>
              </AlertDescription>
            </Alert>
          ))}
          {alerts.length > 3 && (
            <p className="text-sm text-gray-400 text-center">
              +{alerts.length - 3} more alerts
            </p>
          )}
        </div>
      )}

      {/* Real-time Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {currentMetrics ? Math.round(currentMetrics.responseTime) : 0}ms
            </div>
            <Progress 
              value={currentMetrics ? Math.min((currentMetrics.responseTime / 3000) * 100, 100) : 0} 
              className="h-2 mt-2" 
            />
            <p className="text-xs text-gray-500 mt-1">
              Target: &lt;{thresholds.responseTime}ms
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Requests/sec</CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {currentMetrics ? currentMetrics.requestsPerSecond.toFixed(1) : '0.0'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Current throughput
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {currentMetrics ? currentMetrics.errorRate.toFixed(1) : '0.0'}%
            </div>
            <Progress 
              value={currentMetrics ? Math.min((currentMetrics.errorRate / 10) * 100, 100) : 0} 
              className="h-2 mt-2" 
            />
            <p className="text-xs text-gray-500 mt-1">
              Target: &lt;{thresholds.errorRate}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Cache Hit Rate</CardTitle>
            <Server className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {currentMetrics ? currentMetrics.cacheHitRate.toFixed(1) : '0.0'}%
            </div>
            <Progress 
              value={currentMetrics ? currentMetrics.cacheHitRate : 0} 
              className="h-2 mt-2" 
            />
            <p className="text-xs text-gray-500 mt-1">
              Target: &gt;{thresholds.cacheHitRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Response Time Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
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
                  dataKey="responseTime"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">System Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
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
                  dataKey="cacheHitRate"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="errorRate"
                  stackId="2"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Feature Performance */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Feature Performance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featurePerformance.map((feature) => (
              <div key={feature.featureId} className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(feature.status)}
                    <h4 className="font-medium text-white">{feature.name}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(feature.trend)}
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(feature.status)}
                    >
                      {feature.status}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400">Avg Response</p>
                    <p className="font-semibold text-white">{feature.avgResponseTime}ms</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Requests</p>
                    <p className="font-semibold text-white">{feature.requestCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Error Rate</p>
                    <p className={`font-semibold ${
                      feature.errorRate > 3 ? 'text-red-400' : 
                      feature.errorRate > 1 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {feature.errorRate}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Current Usage</span>
                <span className="text-white font-semibold">
                  {currentMetrics ? currentMetrics.memoryUsage.toFixed(1) : '0.0'}%
                </span>
              </div>
              <Progress 
                value={currentMetrics ? currentMetrics.memoryUsage : 0} 
                className="h-3" 
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>0%</span>
                <span>Warning: {thresholds.memoryUsage}%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">CPU Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Current Usage</span>
                <span className="text-white font-semibold">
                  {currentMetrics ? currentMetrics.cpuUsage.toFixed(1) : '0.0'}%
                </span>
              </div>
              <Progress 
                value={currentMetrics ? currentMetrics.cpuUsage : 0} 
                className="h-3" 
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>0%</span>
                <span>Warning: {thresholds.cpuUsage}%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

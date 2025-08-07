'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  Brain,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Zap,
  Shield,
  Eye,
  RefreshCw,
  Bell,
  BarChart3,
  PieChart,
  Database,
  Cpu,
  AlertCircle,
  Settings,
  Timer,
  Target,
  Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AISystemMetric {
  id: string
  system_name: string
  metric_type: 'latency' | 'success_rate' | 'error_rate' | 'cost' | 'usage'
  current_value: number
  threshold_warning: number
  threshold_critical: number
  status: 'healthy' | 'warning' | 'critical' | 'offline'
  last_updated: Date
  trend: 'up' | 'down' | 'stable'
}

interface EdgeFunctionMetric {
  function_name: string
  invocations_24h: number
  success_rate: number
  avg_duration: number
  errors_24h: number
  last_error?: string
  status: 'active' | 'warning' | 'error'
}

interface AIModelUsage {
  provider: 'openai' | 'gemini' | 'anthropic'
  model: string
  requests_24h: number
  tokens_used: number
  cost_24h: number
  avg_latency: number
  error_rate: number
}

interface SystemAlert {
  id: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  system: string
  timestamp: Date
  acknowledged: boolean
}

export function AIMonitoringDashboard() {
  const [metrics, setMetrics] = useState<AISystemMetric[]>([])
  const [edgeFunctions, setEdgeFunctions] = useState<EdgeFunctionMetric[]>([])
  const [modelUsage, setModelUsage] = useState<AIModelUsage[]>([])
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadMonitoringData()

    if (autoRefresh) {
      const interval = setInterval(loadMonitoringData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
    return undefined
  }, [autoRefresh])

  const loadMonitoringData = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        loadSystemMetrics(),
        loadEdgeFunctionMetrics(),
        loadModelUsage(),
        loadAlerts()
      ])
    } catch (error) {
      console.error('Failed to load monitoring data:', error)
      toast.error('Failed to refresh monitoring data')
    } finally {
      setRefreshing(false)
    }
  }

  const loadSystemMetrics = async () => {
    // Mock data for demonstration - in production would fetch from monitoring system
    const mockMetrics: AISystemMetric[] = [
      {
        id: '1',
        system_name: 'Predictive Maintenance',
        metric_type: 'success_rate',
        current_value: 98.5,
        threshold_warning: 95,
        threshold_critical: 90,
        status: 'healthy',
        last_updated: new Date(),
        trend: 'stable'
      },
      {
        id: '2',
        system_name: 'Fraud Detection',
        metric_type: 'latency',
        current_value: 1.2,
        threshold_warning: 2.0,
        threshold_critical: 3.0,
        status: 'healthy',
        last_updated: new Date(),
        trend: 'down'
      },
      {
        id: '3',
        system_name: 'Document Intelligence',
        metric_type: 'error_rate',
        current_value: 2.1,
        threshold_warning: 5.0,
        threshold_critical: 10.0,
        status: 'healthy',
        last_updated: new Date(),
        trend: 'up'
      },
      {
        id: '4',
        system_name: 'Sentiment Analysis',
        metric_type: 'cost',
        current_value: 45.67,
        threshold_warning: 100,
        threshold_critical: 200,
        status: 'healthy',
        last_updated: new Date(),
        trend: 'stable'
      }
    ]
    setMetrics(mockMetrics)
  }

  const loadEdgeFunctionMetrics = async () => {
    const mockEdgeFunctions: EdgeFunctionMetric[] = [
      {
        function_name: 'predictive-maintenance',
        invocations_24h: 145,
        success_rate: 98.6,
        avg_duration: 1850,
        errors_24h: 2,
        status: 'active'
      },
      {
        function_name: 'fraud-detection-engine',
        invocations_24h: 89,
        success_rate: 97.8,
        avg_duration: 2100,
        errors_24h: 2,
        status: 'active'
      },
      {
        function_name: 'sentiment-analyzer',
        invocations_24h: 234,
        success_rate: 99.1,
        avg_duration: 980,
        errors_24h: 2,
        status: 'active'
      },
      {
        function_name: 'claim-predictor-ai',
        invocations_24h: 67,
        success_rate: 96.3,
        avg_duration: 2800,
        errors_24h: 2,
        last_error: 'Property not found error',
        status: 'warning'
      }
    ]
    setEdgeFunctions(mockEdgeFunctions)
  }

  const loadModelUsage = async () => {
    const mockModelUsage: AIModelUsage[] = [
      {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        requests_24h: 234,
        tokens_used: 145670,
        cost_24h: 14.56,
        avg_latency: 1.8,
        error_rate: 1.2
      },
      {
        provider: 'openai',
        model: 'gpt-4-vision-preview',
        requests_24h: 89,
        tokens_used: 67890,
        cost_24h: 8.90,
        avg_latency: 2.3,
        error_rate: 2.1
      },
      {
        provider: 'gemini',
        model: 'gemini-pro',
        requests_24h: 156,
        tokens_used: 98543,
        cost_24h: 0, // Free during preview
        avg_latency: 1.1,
        error_rate: 0.8
      }
    ]
    setModelUsage(mockModelUsage)
  }

  const loadAlerts = async () => {
    const mockAlerts: SystemAlert[] = [
      {
        id: '1',
        severity: 'warning',
        message: 'Claim predictor AI error rate increased to 3.7% in the last hour',
        system: 'claim-predictor-ai',
        timestamp: new Date(Date.now() - 900000), // 15 minutes ago
        acknowledged: false
      },
      {
        id: '2',
        severity: 'info',
        message: 'Document intelligence processing time improved by 15%',
        system: 'document-intelligence',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        acknowledged: true
      },
      {
        id: '3',
        severity: 'error',
        message: 'OpenAI API rate limit exceeded for 5 minutes',
        system: 'ai-models',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        acknowledged: false
      }
    ]
    setAlerts(mockAlerts)
  }

  const acknowledgeAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ))
    toast.success('Alert acknowledged')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'active': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'critical': case 'error': return 'text-red-500'
      case 'offline': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': case 'active': return CheckCircle
      case 'warning': return AlertTriangle
      case 'critical': case 'error': return XCircle
      case 'offline': return Clock
      default: return Clock
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp
      case 'down': return TrendingDown
      default: return Activity
    }
  }

  // Sample time series data for charts
  const performanceData = [
    { time: '00:00', predictive_maintenance: 98, fraud_detection: 97, sentiment_analysis: 99, claim_predictor: 95 },
    { time: '06:00', predictive_maintenance: 97, fraud_detection: 98, sentiment_analysis: 98, claim_predictor: 96 },
    { time: '12:00', predictive_maintenance: 99, fraud_detection: 96, sentiment_analysis: 97, claim_predictor: 94 },
    { time: '18:00', predictive_maintenance: 98, fraud_detection: 97, sentiment_analysis: 99, claim_predictor: 97 }
  ]

  const costData = [
    { time: '00:00', openai: 12, gemini: 0, total: 12 },
    { time: '06:00', openai: 15, gemini: 0, total: 15 },
    { time: '12:00', openai: 18, gemini: 0, total: 18 },
    { time: '18:00', openai: 23, gemini: 0, total: 23 }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Activity className="h-6 w-6" />
            <span>AI Systems Monitoring</span>
            <Badge variant="outline" className="ml-2">Real-time</Badge>
          </h2>
          <p className="text-gray-600">Monitor AI system performance, costs, and alerts</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50' : ''}
          >
            <Timer className="h-4 w-4 mr-2" />
            Auto-refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button onClick={loadMonitoringData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const StatusIcon = getStatusIcon(metric.status)
          const TrendIcon = getTrendIcon(metric.trend)

          return (
            <Card key={metric.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <StatusIcon className={`h-5 w-5 ${getStatusColor(metric.status)}`} />
                  <Badge variant={metric.status === 'healthy' ? 'default' : metric.status === 'warning' ? 'secondary' : 'destructive'}>
                    {metric.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">{metric.system_name}</h3>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold">
                      {metric.metric_type === 'cost' ? '$' : ''}
                      {metric.current_value}
                      {metric.metric_type === 'success_rate' || metric.metric_type === 'error_rate' ? '%' : ''}
                      {metric.metric_type === 'latency' ? 's' : ''}
                    </p>
                    <TrendIcon className={`h-4 w-4 ${
                      metric.trend === 'up' ? 'text-green-500' :
                      metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                    }`} />
                  </div>
                  <p className="text-xs text-gray-500 capitalize">
                    {metric.metric_type.replace('_', ' ')}
                  </p>
                  {metric.metric_type !== 'cost' && (
                    <Progress
                      value={metric.metric_type === 'error_rate' ?
                        100 - (metric.current_value / metric.threshold_critical * 100) :
                        (metric.current_value / metric.threshold_warning * 100)
                      }
                      className="h-1"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Active Alerts */}
      {alerts.filter(a => !a.acknowledged).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Active Alerts ({alerts.filter(a => !a.acknowledged).length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.filter(a => !a.acknowledged).map((alert) => (
                <Alert key={alert.id} variant={alert.severity === 'error' || alert.severity === 'critical' ? 'destructive' : 'default'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="flex items-center justify-between">
                    <span>{alert.system} - {alert.severity.toUpperCase()}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {Math.round((Date.now() - alert.timestamp.getTime()) / 60000)}m ago
                      </span>
                      <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(alert.id)}>
                        Acknowledge
                      </Button>
                    </div>
                  </AlertTitle>
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="functions">Edge Functions</TabsTrigger>
          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Performance Over Time</CardTitle>
                <CardDescription>Success rates for all AI systems (24-hour view)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[90, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="predictive_maintenance" stroke="#8884d8" name="Predictive Maintenance" />
                    <Line type="monotone" dataKey="fraud_detection" stroke="#82ca9d" name="Fraud Detection" />
                    <Line type="monotone" dataKey="sentiment_analysis" stroke="#ffc658" name="Sentiment Analysis" />
                    <Line type="monotone" dataKey="claim_predictor" stroke="#ff7300" name="Claim Predictor" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="functions">
          <Card>
            <CardHeader>
              <CardTitle>Edge Function Metrics</CardTitle>
              <CardDescription>Performance metrics for deployed Edge Functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {edgeFunctions.map((func) => (
                  <div key={func.function_name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{func.function_name}</h4>
                        <p className="text-sm text-gray-500">
                          {func.invocations_24h} invocations in 24h
                        </p>
                      </div>
                      <Badge variant={func.status === 'active' ? 'default' : func.status === 'warning' ? 'secondary' : 'destructive'}>
                        {func.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Success Rate</p>
                        <p className="font-medium">{func.success_rate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Avg Duration</p>
                        <p className="font-medium">{func.avg_duration}ms</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Errors (24h)</p>
                        <p className="font-medium">{func.errors_24h}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        <p className="font-medium capitalize">{func.status}</p>
                      </div>
                    </div>

                    {func.last_error && (
                      <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-600">
                        <strong>Last Error:</strong> {func.last_error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>AI Model Usage</CardTitle>
              <CardDescription>Usage statistics and performance for AI models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modelUsage.map((model, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold flex items-center space-x-2">
                          <span className="capitalize">{model.provider}</span>
                          <span className="text-gray-500">•</span>
                          <span>{model.model}</span>
                        </h4>
                        <p className="text-sm text-gray-500">
                          {model.requests_24h} requests, {(model.tokens_used / 1000).toFixed(1)}K tokens
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          ${model.cost_24h.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">24h cost</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Avg Latency</p>
                        <p className="font-medium">{model.avg_latency}s</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Error Rate</p>
                        <p className="font-medium">{model.error_rate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Requests</p>
                        <p className="font-medium">{model.requests_24h}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance Metrics</CardTitle>
              <CardDescription>Comprehensive performance analysis across all systems</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {/* Performance would show detailed charts, logs, etc. */}
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>Performance Insights</AlertTitle>
                  <AlertDescription>
                    All AI systems are performing within normal parameters. Average response times have improved
                    15% over the past week due to optimization efforts.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>AI Cost Analysis</CardTitle>
              <CardDescription>Cost breakdown and trends for AI service usage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="openai" stackId="1" stroke="#8884d8" fill="#8884d8" name="OpenAI" />
                  <Area type="monotone" dataKey="gemini" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Gemini (Free)" />
                </AreaChart>
              </ResponsiveContainer>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">$67.45</p>
                  <p className="text-sm text-gray-500">Total cost (24h)</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">$1,892</p>
                  <p className="text-sm text-gray-500">Monthly projection</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">18%</p>
                  <p className="text-sm text-gray-500">Under budget</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

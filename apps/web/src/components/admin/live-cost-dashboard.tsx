/**
 * Live Cost Dashboard with Real-time WebSocket Updates
 * Shows real-time AI cost monitoring and alerts
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Zap,
  Activity,
  Wifi,
  WifiOff,
  Play,
  Pause,
  RefreshCw,
  Bell,
  BellOff,
  Settings
} from 'lucide-react'
import webSocketCostMonitor, { RealTimeCostUpdate } from '@/services/websocket-cost-monitor'
import alertDeliverySystem, { AlertPayload } from '@/services/alert-delivery-system'

interface LiveMetrics {
  totalCostToday: number
  requestsToday: number
  activeUsers: number
  avgResponseTime: number
  successRate: number
  costPerMinute: number
  requestsPerMinute: number
  errorRate: number
  topSpendingUser: string
  topCostTool: string
  budgetUtilization: number
  alertsCount: number
}

interface RealtimeAlert {
  id: string
  type: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  timestamp: string
  userId?: string
  metadata?: Record<string, unknown>
  isNew: boolean
}

export function LiveCostDashboard() {
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [metrics, setMetrics] = useState<LiveMetrics>({
    totalCostToday: 0,
    requestsToday: 0,
    activeUsers: 0,
    avgResponseTime: 0,
    successRate: 1,
    costPerMinute: 0,
    requestsPerMinute: 0,
    errorRate: 0,
    topSpendingUser: 'Unknown',
    topCostTool: 'None',
    budgetUtilization: 0,
    alertsCount: 0
  })
  const [recentUpdates, setRecentUpdates] = useState<RealTimeCostUpdate[]>([])
  const [realtimeAlerts, setRealtimeAlerts] = useState<RealtimeAlert[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')

  // Initialize WebSocket connection
  useEffect(() => {
    initializeConnection()
    return () => {
      cleanup()
    }
  }, [])

  const initializeConnection = useCallback(async () => {
    setConnectionStatus('connecting')
    
    try {
      const success = await webSocketCostMonitor.initialize()
      
      if (success) {
        // Subscribe to real-time updates
        const subscribed = webSocketCostMonitor.subscribe('live-dashboard', handleRealtimeUpdate)
        
        if (subscribed) {
          setIsConnected(true)
          setConnectionStatus('connected')
          
          // Load initial metrics
          await loadInitialMetrics()
          
          console.log('Live cost dashboard connected')
        } else {
          throw new Error('Failed to subscribe to updates')
        }
      } else {
        throw new Error('Failed to initialize WebSocket monitor')
      }
      
    } catch (error) {
      console.error('Connection failed:', error)
      setIsConnected(false)
      setConnectionStatus('disconnected')
      
      // Retry connection in 30 seconds
      setTimeout(() => {
        if (!isConnected) {
          initializeConnection()
        }
      }, 30000)
    }
  }, [isConnected])

  const cleanup = useCallback(() => {
    if (isConnected) {
      webSocketCostMonitor.unsubscribe('live-dashboard')
      webSocketCostMonitor.destroy()
      setIsConnected(false)
      setConnectionStatus('disconnected')
    }
  }, [isConnected])

  const handleRealtimeUpdate = useCallback((update: RealTimeCostUpdate) => {
    if (isPaused) return

    console.log('Real-time update received:', update)

    // Update metrics based on the update
    setMetrics(prevMetrics => updateMetricsFromUpdate(prevMetrics, update))

    // Add to recent updates (keep last 50)
    setRecentUpdates(prev => [update, ...prev].slice(0, 50))

    // Handle alerts
    if (update.type === 'budget_alert' || update.type === 'usage_spike' || update.type === 'model_error') {
      const alert: RealtimeAlert = {
        id: `${update.type}_${Date.now()}`,
        type: update.type,
        message: update.data.message,
        severity: update.data.severity,
        timestamp: update.data.timestamp,
        userId: update.data.user_id,
        metadata: update.data.metadata,
        isNew: true
      }

      setRealtimeAlerts(prev => [alert, ...prev].slice(0, 20))

      // Play sound for critical alerts
      if (soundEnabled && update.data.severity === 'critical') {
        playAlertSound()
      }

      // Auto-mark as read after 10 seconds
      setTimeout(() => {
        setRealtimeAlerts(prev => 
          prev.map(a => a.id === alert.id ? { ...a, isNew: false } : a)
        )
      }, 10000)
    }
  }, [isPaused, soundEnabled])

  const updateMetricsFromUpdate = (prevMetrics: LiveMetrics, update: RealTimeCostUpdate): LiveMetrics => {
    const newMetrics = { ...prevMetrics }

    if (update.type === 'cost_update' && update.data.cost_delta) {
      newMetrics.totalCostToday += update.data.cost_delta
      newMetrics.requestsToday += 1
      
      if (update.data.tool_name) {
        newMetrics.topCostTool = update.data.tool_name
      }
    }

    if (update.type === 'budget_alert') {
      newMetrics.alertsCount += 1
    }

    return newMetrics
  }

  const loadInitialMetrics = async () => {
    try {
      const response = await fetch('/api/admin/ai-costs/quick-stats')
      if (response.ok) {
        const data = await response.json()
        setMetrics(prev => ({
          ...prev,
          totalCostToday: data.todayCost || 0,
          requestsToday: data.todayRequests || 0,
          activeUsers: data.activeUsers || 0,
          avgResponseTime: data.avgResponseTime || 0,
          successRate: data.successRate || 1,
          topCostTool: data.topCostTool || 'None',
          alertsCount: data.budgetAlertsCount || 0
        }))
      }
    } catch (error) {
      console.error('Failed to load initial metrics:', error)
    }
  }

  const playAlertSound = () => {
    try {
      const audio = new Audio('/sounds/alert.wav')
      audio.volume = 0.3
      audio.play().catch(e => console.log('Could not play alert sound:', e))
    } catch (error) {
      console.log('Alert sound not available')
    }
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled)
  }

  const reconnect = () => {
    cleanup()
    setTimeout(() => {
      initializeConnection()
    }, 1000)
  }

  const testAlert = async (severity: 'info' | 'warning' | 'critical') => {
    const testAlert: AlertPayload = {
      id: `test-${Date.now()}`,
      type: 'system_alert',
      severity,
      title: `Test ${severity.toUpperCase()} Alert`,
      message: `This is a test ${severity} alert from the live cost dashboard`,
      timestamp: new Date().toISOString(),
      channels: ['email', 'slack']
    }

    try {
      await alertDeliverySystem.deliverAlert(testAlert)
      alert(`Test ${severity} alert sent successfully!`)
    } catch (error) {
      alert(`Failed to send test alert: ${error}`)
    }
  }

  const connectionStatusColor = useMemo(() => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400'
      case 'connecting': return 'text-yellow-400'
      default: return 'text-red-400'
    }
  }, [connectionStatus])

  const formatCost = (cost: number) => `$${cost.toFixed(2)}`
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Cost Dashboard</h1>
          <p className="text-gray-400">Real-time AI cost monitoring and alerts</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className={`flex items-center gap-2 ${connectionStatusColor}`}>
            {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span className="text-sm capitalize">{connectionStatus}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePause}
              className="flex items-center gap-2"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleSound}
              className="flex items-center gap-2"
            >
              {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              Sound
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={reconnect}
              disabled={connectionStatus === 'connecting'}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
              Reconnect
            </Button>
          </div>
        </div>
      </div>

      {/* Connection Warning */}
      {!isConnected && (
        <Alert className="border-yellow-500 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Live monitoring is disconnected. Attempting to reconnect...
          </AlertDescription>
        </Alert>
      )}

      {/* Pause Warning */}
      {isPaused && (
        <Alert className="border-blue-500 bg-blue-500/10">
          <Pause className="h-4 w-4" />
          <AlertDescription>
            Live updates are paused. Click "Resume" to continue monitoring.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {realtimeAlerts.filter(a => a.isNew).length > 0 && (
              <Badge variant="destructive" className="ml-2 animate-pulse">
                {realtimeAlerts.filter(a => a.isNew).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-400">Today's Cost</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatCost(metrics.totalCostToday)}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {formatCost(metrics.costPerMinute)}/min
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-400">Requests Today</CardTitle>
                  <Activity className="h-4 w-4 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatNumber(metrics.requestsToday)}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {formatNumber(metrics.requestsPerMinute)}/min
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-400">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {metrics.activeUsers}
                </div>
                <div className="text-xs text-gray-400">
                  Last 24 hours
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-400">Success Rate</CardTitle>
                  <CheckCircle2 className={`h-4 w-4 ${
                    metrics.successRate > 0.95 ? 'text-green-400' : 
                    metrics.successRate > 0.90 ? 'text-yellow-400' : 'text-red-400'
                  }`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {(metrics.successRate * 100).toFixed(1)}%
                </div>
                <Progress 
                  value={metrics.successRate * 100} 
                  className="h-1 mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Avg Response Time</span>
                  <span className="text-white font-medium">{metrics.avgResponseTime}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Error Rate</span>
                  <span className={`font-medium ${
                    metrics.errorRate > 0.10 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {(metrics.errorRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Top Cost Tool</span>
                  <span className="text-white font-medium capitalize">
                    {metrics.topCostTool.replace(/-/g, ' ')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alert Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Active Alerts</span>
                  <Badge variant={metrics.alertsCount > 0 ? 'destructive' : 'outline'}>
                    {metrics.alertsCount}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Connection Status</span>
                  <Badge variant={isConnected ? 'default' : 'outline'}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Subscribers</span>
                  <span className="text-white font-medium">
                    {webSocketCostMonitor.getSubscriberCount()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Real-time Alerts</CardTitle>
                  <CardDescription>
                    Live alerts from cost monitoring system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {realtimeAlerts.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        No alerts yet
                      </div>
                    ) : (
                      realtimeAlerts.map(alert => (
                        <div 
                          key={alert.id}
                          className={`p-4 rounded border ${
                            alert.severity === 'critical' ? 'bg-red-500/10 border-red-500/20' :
                            alert.severity === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                            'bg-blue-500/10 border-blue-500/20'
                          } ${alert.isNew ? 'animate-pulse' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                alert.severity === 'critical' ? 'destructive' :
                                alert.severity === 'warning' ? 'outline' : 'secondary'
                              }>
                                {alert.severity.toUpperCase()}
                              </Badge>
                              <span className="text-gray-400 text-sm">
                                {alert.type.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <span className="text-gray-400 text-xs">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-white mt-2">{alert.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Test Alerts</CardTitle>
                  <CardDescription>
                    Test alert delivery system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    onClick={() => testAlert('info')}
                    className="w-full"
                  >
                    Test Info Alert
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => testAlert('warning')}
                    className="w-full text-yellow-400 border-yellow-400"
                  >
                    Test Warning Alert
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => testAlert('critical')}
                    className="w-full text-red-400 border-red-400"
                  >
                    Test Critical Alert
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Activity Feed Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Live Activity Feed</CardTitle>
              <CardDescription>
                Real-time cost updates and API calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentUpdates.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    No activity yet
                  </div>
                ) : (
                  recentUpdates.map((update, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-2 rounded bg-gray-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          update.data.severity === 'critical' ? 'bg-red-400' :
                          update.data.severity === 'warning' ? 'bg-yellow-400' :
                          'bg-green-400'
                        }`} />
                        <span className="text-white text-sm">
                          {update.data.message}
                        </span>
                      </div>
                      <span className="text-gray-400 text-xs">
                        {new Date(update.data.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Dashboard Settings
              </CardTitle>
              <CardDescription>
                Configure live monitoring preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Sound Alerts</div>
                  <div className="text-gray-400 text-sm">Play sound for critical alerts</div>
                </div>
                <Button
                  variant="outline"
                  onClick={toggleSound}
                  className={soundEnabled ? 'text-green-400 border-green-400' : ''}
                >
                  {soundEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Auto-refresh</div>
                  <div className="text-gray-400 text-sm">Automatically refresh metrics</div>
                </div>
                <Button
                  variant="outline"
                  onClick={togglePause}
                  className={!isPaused ? 'text-green-400 border-green-400' : ''}
                >
                  {!isPaused ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Connection Status</div>
                  <div className="text-gray-400 text-sm">WebSocket connection health</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className={connectionStatusColor}>
                    {connectionStatus}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default LiveCostDashboard
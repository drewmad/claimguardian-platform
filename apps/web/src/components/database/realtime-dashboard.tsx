/**
 * @fileMetadata
 * @purpose "Real-time database updates monitoring dashboard with live connection status and event tracking"
 * @owner backend-team
 * @dependencies ["react", "framer-motion", "@/components/ui", "@/lib/database/realtime-manager"]
 * @exports ["RealtimeDashboard", "ConnectionStatus", "EventStream"]
 * @complexity high
 * @tags ["database", "realtime", "dashboard", "monitoring", "websockets"]
 * @status stable
 */
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Radio,
  Wifi,
  WifiOff,
  Users,
  MessageSquare,
  Activity,
  Clock,
  Zap,
  Database,
  Play,
  Pause,
  Square,
  RefreshCw,
  Settings,
  Eye,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Minus,
  TrendingUp,
  BarChart3
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getRealtimeManager, type RealtimeEvent, type SubscriptionStatus, type RealtimeTable } from '@/lib/database/realtime-manager'
import { useToast } from '@/components/notifications/toast-system'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

interface RealtimeDashboardProps {
  autoStart?: boolean
  showEventStream?: boolean
  maxEvents?: number
  className?: string
}

interface LiveEvent extends RealtimeEvent {
  id: string
  processed: boolean
  latency?: number
}

interface ConnectionMetrics {
  uptime: number
  totalEvents: number
  eventsPerSecond: number
  averageLatency: number
  connectionCount: number
  errorCount: number
  lastError?: string
}

export function RealtimeDashboard({
  autoStart = true,
  showEventStream = true,
  maxEvents = 50,
  className
}: RealtimeDashboardProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([])
  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    uptime: 0,
    totalEvents: 0,
    eventsPerSecond: 0,
    averageLatency: 0,
    connectionCount: 0,
    errorCount: 0
  })
  const [selectedTable, setSelectedTable] = useState<RealtimeTable | 'all'>('all')
  const [isMonitoring, setIsMonitoring] = useState(autoStart)
  const [presenceUsers, setPresenceUsers] = useState<Map<string, any>>(new Map())

  const { success, error, info } = useToast()
  const realtimeManager = useRef(getRealtimeManager())
  const subscriptionIds = useRef<string[]>([])
  const startTime = useRef<Date>(new Date())

  // Initialize monitoring
  useEffect(() => {
    if (isMonitoring && autoStart) {
      startMonitoring()
    }

    return () => {
      stopMonitoring()
    }
  }, [isMonitoring, autoStart])

  // Update metrics periodically
  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      updateMetrics()
    }, 1000)

    return () => clearInterval(interval)
  }, [isMonitoring])

  const startMonitoring = async () => {
    try {
      setIsMonitoring(true)
      startTime.current = new Date()

      // Subscribe to all major tables for monitoring
      const tablesToMonitor: RealtimeTable[] = ['properties', 'claims', 'user_profiles']
      
      const subscribePromises = tablesToMonitor.map(async (table) => {
        const subscriptionId = await realtimeManager.current.subscribe(
          table,
          '*',
          (event) => handleRealtimeEvent(event, table),
          {
            errorCallback: (err) => handleSubscriptionError(table, err)
          }
        )
        return { table, subscriptionId }
      })

      const results = await Promise.all(subscribePromises)
      subscriptionIds.current = results.map(r => r.subscriptionId)

      // Subscribe to presence for user activity
      try {
        const presenceId = await realtimeManager.current.subscribeToPresence(
          'dashboard',
          (presenceState) => {
            setPresenceUsers(presenceState)
          }
        )
        subscriptionIds.current.push(presenceId)
      } catch (presenceError) {
        logger.warn('Presence subscription failed', presenceError as Error)
      }

      setIsConnected(true)
      success('Real-time monitoring started')
      
      // Update presence to show we're monitoring
      await realtimeManager.current.updatePresence('dashboard', {
        userId: 'system',
        userInfo: { name: 'System Monitor' },
        location: { page: 'dashboard', path: '/admin/database' },
        activity: { lastSeen: new Date(), status: 'online', action: 'monitoring' }
      })

    } catch (err) {
      error('Failed to start real-time monitoring')
      logger.error('Real-time monitoring startup failed', err as Error)
    }
  }

  const stopMonitoring = async () => {
    try {
      setIsMonitoring(false)

      // Unsubscribe from all subscriptions
      for (const id of subscriptionIds.current) {
        await realtimeManager.current.unsubscribe(id)
      }
      subscriptionIds.current = []

      setIsConnected(false)
      setSubscriptions([])
      info('Real-time monitoring stopped')

    } catch (err) {
      error('Failed to stop real-time monitoring')
      logger.error('Real-time monitoring shutdown failed', err as Error)
    }
  }

  const handleRealtimeEvent = (event: RealtimeEvent, table: RealtimeTable) => {
    const liveEvent: LiveEvent = {
      ...event,
      processed: false,
      latency: Date.now() - event.timestamp.getTime()
    }

    setLiveEvents(prev => {
      const updated = [liveEvent, ...prev].slice(0, maxEvents)
      return updated
    })

    // Update metrics
    setMetrics(prev => ({
      ...prev,
      totalEvents: prev.totalEvents + 1
    }))

    // Log significant events
    if (event.type === 'INSERT' || event.type === 'DELETE') {
      logger.info('Significant database event', { table, type: event.type, id: event.new?.id || event.old?.id })
    }
  }

  const handleSubscriptionError = (table: RealtimeTable, err: Error) => {
    logger.error('Subscription error', { table }, err)
    setMetrics(prev => ({
      ...prev,
      errorCount: prev.errorCount + 1,
      lastError: err.message
    }))
  }

  const updateMetrics = () => {
    const info = realtimeManager.current.getSubscriptionInfo()
    
    const uptime = Date.now() - startTime.current.getTime()
    const eventsPerSecond = uptime > 0 ? (metrics.totalEvents / (uptime / 1000)) : 0

    setMetrics(prev => ({
      ...prev,
      uptime: uptime / 1000, // Convert to seconds
      eventsPerSecond: Number(eventsPerSecond.toFixed(2)),
      connectionCount: info.channels,
      averageLatency: info.averageLatency
    }))

    setSubscriptions(info.subscriptions)
  }

  const clearEvents = () => {
    setLiveEvents([])
    setMetrics(prev => ({ ...prev, totalEvents: 0 }))
  }

  const exportEvents = () => {
    const data = JSON.stringify(liveEvents, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `realtime-events-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filter events by table
  const filteredEvents = selectedTable === 'all' 
    ? liveEvents 
    : liveEvents.filter(event => event.table === selectedTable)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="w-6 h-6" />
            Real-time Database Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor live database changes and WebSocket connections
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection Control */}
          <div className="flex gap-2">
            {!isMonitoring ? (
              <Button onClick={startMonitoring} className="bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-2" />
                Start Monitoring
              </Button>
            ) : (
              <Button onClick={stopMonitoring} variant="outline">
                <Square className="w-4 h-4 mr-2" />
                Stop Monitoring
              </Button>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={updateMetrics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <Button variant="outline" size="sm" onClick={exportEvents}>
            <Download className="w-4 h-4 mr-2" />
            Export Events
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <ConnectionStatusCard
          title="Connection Status"
          status={isConnected ? 'connected' : 'disconnected'}
          icon={isConnected ? Wifi : WifiOff}
          color={isConnected ? 'text-green-600' : 'text-red-600'}
          description={isConnected ? 'WebSocket connected' : 'Not monitoring'}
        />

        <MetricCard
          title="Active Subscriptions"
          value={subscriptions.length.toString()}
          icon={Database}
          color="text-blue-600"
          description={`${metrics.connectionCount} channels`}
        />

        <MetricCard
          title="Events Processed"
          value={metrics.totalEvents.toLocaleString()}
          icon={Activity}
          color="text-purple-600"
          description={`${metrics.eventsPerSecond}/sec`}
        />

        <MetricCard
          title="Uptime"
          value={`${Math.floor(metrics.uptime / 60)}:${Math.floor(metrics.uptime % 60).toString().padStart(2, '0')}`}
          icon={Clock}
          color="text-orange-600"
          description="mm:ss"
        />
      </div>

      {/* Error Alert */}
      {metrics.lastError && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Connection Error</p>
                <p className="text-sm mt-1">{metrics.lastError}</p>
              </div>
              <Badge variant="destructive">
                {metrics.errorCount} errors
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Live Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Subscriptions Panel */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No active subscriptions</p>
              ) : (
                subscriptions.map((sub) => (
                  <SubscriptionCard key={sub.id} subscription={sub} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Event Stream */}
        {showEventStream && (
          <Card className="xl:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Live Event Stream
                </CardTitle>
                
                <div className="flex items-center gap-2">
                  {/* Table Filter */}
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value as RealtimeTable | 'all')}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Tables</option>
                    <option value="properties">Properties</option>
                    <option value="claims">Claims</option>
                    <option value="user_profiles">User Profiles</option>
                  </select>
                  
                  <Button variant="ghost" size="sm" onClick={clearEvents}>
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <EventStream events={filteredEvents} maxHeight="400px" />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Presence Users */}
      {presenceUsers.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Online Users ({presenceUsers.size})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from(presenceUsers.entries()).map(([userId, presence]) => (
                <div key={userId} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {presence.userInfo?.name?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{presence.userInfo?.name || 'Unknown User'}</p>
                    <p className="text-xs text-gray-600">{presence.location?.page}</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      presence.activity?.status === 'online' && 'border-green-200 text-green-600',
                      presence.activity?.status === 'away' && 'border-yellow-200 text-yellow-600'
                    )}
                  >
                    {presence.activity?.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Connection Status Card
interface ConnectionStatusCardProps {
  title: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  icon: React.ElementType
  color: string
  description: string
}

function ConnectionStatusCard({ title, status, icon: Icon, color, description }: ConnectionStatusCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 border-green-200 text-green-800'
      case 'disconnected': return 'bg-red-100 border-red-200 text-red-800'
      case 'connecting': return 'bg-yellow-100 border-yellow-200 text-yellow-800'
      case 'error': return 'bg-red-100 border-red-200 text-red-800'
      default: return 'bg-gray-100 border-gray-200 text-gray-800'
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={cn('capitalize', getStatusColor(status))}>
                {status}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {description}
            </p>
          </div>
          
          <div className={cn("w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center", color)}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Metric Card Component
interface MetricCardProps {
  title: string
  value: string
  icon: React.ElementType
  color: string
  description?: string
}

function MetricCard({ title, value, icon: Icon, color, description }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold mt-2">
              {value}
            </p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">
                {description}
              </p>
            )}
          </div>
          
          <div className={cn("w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center", color)}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Subscription Card Component
function SubscriptionCard({ subscription }: { subscription: any }) {
  const getStatusIcon = (status: SubscriptionStatus) => {
    switch (status) {
      case 'connected': return CheckCircle
      case 'connecting': return RefreshCw
      case 'error': return XCircle
      case 'disconnected': return WifiOff
      default: return Minus
    }
  }

  const getStatusColor = (status: SubscriptionStatus) => {
    switch (status) {
      case 'connected': return 'text-green-500'
      case 'connecting': return 'text-yellow-500'
      case 'error': return 'text-red-500'
      case 'disconnected': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  const StatusIcon = getStatusIcon(subscription.status)

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div>
        <h4 className="font-medium text-sm capitalize">{subscription.table}</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {subscription.events.join(', ')} • {subscription.eventCount} events
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <StatusIcon className={cn("w-4 h-4", getStatusColor(subscription.status))} />
        <Badge variant="outline" className="text-xs">
          {subscription.status}
        </Badge>
      </div>
    </div>
  )
}

// Event Stream Component
interface EventStreamProps {
  events: LiveEvent[]
  maxHeight?: string
}

function EventStream({ events, maxHeight = '300px' }: EventStreamProps) {
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'INSERT': return <Badge className="bg-green-500">+</Badge>
      case 'UPDATE': return <Badge className="bg-blue-500">~</Badge>
      case 'DELETE': return <Badge className="bg-red-500">-</Badge>
      default: return <Badge className="bg-gray-500">?</Badge>
    }
  }

  return (
    <div className="space-y-2" style={{ maxHeight, overflowY: 'auto' }}>
      <AnimatePresence>
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No events yet...</p>
        ) : (
          events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-l-blue-500"
            >
              {getEventTypeIcon(event.type)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm capitalize">{event.table}</span>
                  <Badge variant="outline" className="text-xs">
                    {event.type}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  ID: {event.new?.id || event.old?.id || 'unknown'}
                  {event.latency && ` • ${event.latency}ms`}
                </p>
              </div>
              
              <div className="text-xs text-gray-500">
                {event.timestamp.toLocaleTimeString()}
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  )
}

export { ConnectionStatusCard, MetricCard, EventStream }
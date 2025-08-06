/**
 * WebSocket Monitoring and Metrics Collection
 * Comprehensive monitoring system for WebSocket services
 */

import { EventEmitter } from 'events'

export interface WebSocketMetrics {
  connectionId: string
  userId?: string
  endpoint: string
  connectedAt: number
  lastActivity: number
  messagesSent: number
  messagesReceived: number
  bytesTransferred: number
  errors: number
  reconnectCount: number
  latency: number[]
  status: 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'error'
}

export interface WebSocketAlert {
  type: 'connection_threshold' | 'error_rate' | 'latency_spike' | 'memory_usage' | 'connection_drop'
  severity: 'info' | 'warning' | 'critical' | 'emergency'
  message: string
  timestamp: number
  metadata: Record<string, unknown>
}

export interface WebSocketServiceMetrics {
  totalConnections: number
  activeConnections: number
  connectionRate: number // connections per second
  disconnectionRate: number // disconnections per second
  messageRate: number // messages per second
  errorRate: number // errors per minute
  avgLatency: number
  p95Latency: number
  bandwidth: number // bytes per second
  memoryUsage: number // bytes
  cpuUsage: number // percentage
  uptime: number // milliseconds
}

export class WebSocketMonitor extends EventEmitter {
  private connections: Map<string, WebSocketMetrics> = new Map()
  private serviceMetrics: WebSocketServiceMetrics
  private metricsHistory: Array<{ timestamp: number; metrics: WebSocketServiceMetrics }> = []
  private alertThresholds: {
    maxConnections: number
    errorRateThreshold: number // errors per minute
    latencyThreshold: number // milliseconds
    memoryThreshold: number // bytes
    connectionDropThreshold: number // percentage
  }
  private isMonitoring = false
  private monitoringInterval?: NodeJS.Timeout

  constructor(alertThresholds?: Partial<WebSocketMonitor['alertThresholds']>) {
    super()
    
    this.alertThresholds = {
      maxConnections: 1000,
      errorRateThreshold: 10, // 10 errors per minute
      latencyThreshold: 5000, // 5 seconds
      memoryThreshold: 500 * 1024 * 1024, // 500MB
      connectionDropThreshold: 15, // 15% drop rate
      ...alertThresholds
    }

    this.serviceMetrics = {
      totalConnections: 0,
      activeConnections: 0,
      connectionRate: 0,
      disconnectionRate: 0,
      messageRate: 0,
      errorRate: 0,
      avgLatency: 0,
      p95Latency: 0,
      bandwidth: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      uptime: Date.now()
    }

    this.startMonitoring()
  }

  // Connection lifecycle tracking
  trackConnection(connectionId: string, userId: string | undefined, endpoint: string): void {
    const metrics: WebSocketMetrics = {
      connectionId,
      userId,
      endpoint,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      messagesSent: 0,
      messagesReceived: 0,
      bytesTransferred: 0,
      errors: 0,
      reconnectCount: 0,
      latency: [],
      status: 'connecting'
    }

    this.connections.set(connectionId, metrics)
    this.serviceMetrics.totalConnections++
    this.emit('connection_tracked', { connectionId, metrics })
  }

  updateConnectionStatus(connectionId: string, status: WebSocketMetrics['status']): void {
    const metrics = this.connections.get(connectionId)
    if (!metrics) return

    const previousStatus = metrics.status
    metrics.status = status
    metrics.lastActivity = Date.now()

    // Handle status transitions
    if (previousStatus !== 'connected' && status === 'connected') {
      this.serviceMetrics.activeConnections++
      this.emit('connection_established', { connectionId, metrics })
    } else if (previousStatus === 'connected' && status !== 'connected') {
      this.serviceMetrics.activeConnections--
      this.emit('connection_lost', { connectionId, metrics })
    }

    // Check for alerts
    this.checkConnectionAlerts(metrics)
  }

  trackMessage(connectionId: string, direction: 'sent' | 'received', messageSize: number, latency?: number): void {
    const metrics = this.connections.get(connectionId)
    if (!metrics) return

    metrics.lastActivity = Date.now()
    metrics.bytesTransferred += messageSize

    if (direction === 'sent') {
      metrics.messagesSent++
    } else {
      metrics.messagesReceived++
    }

    if (latency !== undefined) {
      metrics.latency.push(latency)
      // Keep only last 100 latency measurements
      if (metrics.latency.length > 100) {
        metrics.latency.shift()
      }
    }

    this.emit('message_tracked', { connectionId, direction, messageSize, latency })
  }

  trackError(connectionId: string, error: string, errorType: string): void {
    const metrics = this.connections.get(connectionId)
    if (!metrics) return

    metrics.errors++
    metrics.lastActivity = Date.now()

    this.emit('error_tracked', { connectionId, error, errorType, metrics })

    // Check for error rate alerts
    this.checkErrorRateAlerts()
  }

  trackReconnection(connectionId: string): void {
    const metrics = this.connections.get(connectionId)
    if (!metrics) return

    metrics.reconnectCount++
    metrics.lastActivity = Date.now()
    
    this.emit('reconnection_tracked', { connectionId, metrics })
  }

  removeConnection(connectionId: string): void {
    const metrics = this.connections.get(connectionId)
    if (!metrics) return

    if (metrics.status === 'connected') {
      this.serviceMetrics.activeConnections--
    }

    this.connections.delete(connectionId)
    this.emit('connection_removed', { connectionId, metrics })
  }

  // Metrics calculation
  private calculateServiceMetrics(): void {
    const now = Date.now()
    const connections = Array.from(this.connections.values())
    
    // Connection metrics
    this.serviceMetrics.activeConnections = connections.filter(c => c.status === 'connected').length
    
    // Calculate rates (over last minute)
    const oneMinuteAgo = now - 60000
    const recentConnections = connections.filter(c => c.connectedAt > oneMinuteAgo)
    const recentDisconnections = connections.filter(c => 
      c.status === 'disconnected' && c.lastActivity > oneMinuteAgo
    )
    
    this.serviceMetrics.connectionRate = recentConnections.length / 60 // per second
    this.serviceMetrics.disconnectionRate = recentDisconnections.length / 60 // per second

    // Message and error rates
    const totalMessages = connections.reduce((sum, c) => sum + c.messagesSent + c.messagesReceived, 0)
    const totalErrors = connections.reduce((sum, c) => sum + c.errors, 0)
    
    this.serviceMetrics.messageRate = totalMessages / (now - this.serviceMetrics.uptime) * 1000 // per second
    this.serviceMetrics.errorRate = totalErrors / ((now - this.serviceMetrics.uptime) / 60000) // per minute

    // Latency metrics
    const allLatencies = connections.flatMap(c => c.latency).sort((a, b) => a - b)
    this.serviceMetrics.avgLatency = allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length || 0
    this.serviceMetrics.p95Latency = this.percentile(allLatencies, 95)

    // Bandwidth
    const totalBytes = connections.reduce((sum, c) => sum + c.bytesTransferred, 0)
    this.serviceMetrics.bandwidth = totalBytes / (now - this.serviceMetrics.uptime) * 1000 // bytes per second

    // System metrics (would be integrated with actual system monitoring)
    this.serviceMetrics.memoryUsage = this.estimateMemoryUsage()
    this.serviceMetrics.cpuUsage = this.estimateCpuUsage()

    // Store metrics history
    this.metricsHistory.push({
      timestamp: now,
      metrics: { ...this.serviceMetrics }
    })

    // Keep only last 24 hours of history
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000)
    this.metricsHistory = this.metricsHistory.filter(h => h.timestamp > twentyFourHoursAgo)
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0
    const index = Math.ceil(values.length * (p / 100)) - 1
    return values[Math.max(0, Math.min(index, values.length - 1))]
  }

  private estimateMemoryUsage(): number {
    // Estimate memory usage based on connection count and message queues
    const baseMemory = 10 * 1024 * 1024 // 10MB base
    const perConnectionMemory = 1024 // 1KB per connection
    return baseMemory + (this.connections.size * perConnectionMemory)
  }

  private estimateCpuUsage(): number {
    // Estimate CPU usage based on message rate and connection count
    const baseUsage = 5 // 5% base
    const messageLoad = this.serviceMetrics.messageRate * 0.01 // 0.01% per msg/s
    const connectionLoad = this.serviceMetrics.activeConnections * 0.005 // 0.005% per connection
    return Math.min(100, baseUsage + messageLoad + connectionLoad)
  }

  // Alert checking
  private checkConnectionAlerts(metrics: WebSocketMetrics): void {
    // Check for high latency
    if (metrics.latency.length > 0) {
      const avgLatency = metrics.latency.reduce((a, b) => a + b, 0) / metrics.latency.length
      if (avgLatency > this.alertThresholds.latencyThreshold) {
        this.emitAlert({
          type: 'latency_spike',
          severity: 'warning',
          message: `High latency detected for connection ${metrics.connectionId}: ${avgLatency.toFixed(2)}ms`,
          timestamp: Date.now(),
          metadata: {
            connectionId: metrics.connectionId,
            latency: avgLatency,
            threshold: this.alertThresholds.latencyThreshold
          }
        })
      }
    }

    // Check for excessive errors
    if (metrics.errors > 10) { // More than 10 errors per connection
      this.emitAlert({
        type: 'error_rate',
        severity: 'warning',
        message: `High error count for connection ${metrics.connectionId}: ${metrics.errors} errors`,
        timestamp: Date.now(),
        metadata: {
          connectionId: metrics.connectionId,
          errorCount: metrics.errors
        }
      })
    }
  }

  private checkErrorRateAlerts(): void {
    if (this.serviceMetrics.errorRate > this.alertThresholds.errorRateThreshold) {
      this.emitAlert({
        type: 'error_rate',
        severity: 'critical',
        message: `High error rate detected: ${this.serviceMetrics.errorRate.toFixed(2)} errors/minute`,
        timestamp: Date.now(),
        metadata: {
          errorRate: this.serviceMetrics.errorRate,
          threshold: this.alertThresholds.errorRateThreshold
        }
      })
    }
  }

  private checkServiceAlerts(): void {
    const metrics = this.serviceMetrics

    // Connection threshold
    if (metrics.activeConnections > this.alertThresholds.maxConnections) {
      this.emitAlert({
        type: 'connection_threshold',
        severity: 'warning',
        message: `High connection count: ${metrics.activeConnections} active connections`,
        timestamp: Date.now(),
        metadata: {
          activeConnections: metrics.activeConnections,
          threshold: this.alertThresholds.maxConnections
        }
      })
    }

    // Memory usage
    if (metrics.memoryUsage > this.alertThresholds.memoryThreshold) {
      this.emitAlert({
        type: 'memory_usage',
        severity: 'critical',
        message: `High memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        timestamp: Date.now(),
        metadata: {
          memoryUsage: metrics.memoryUsage,
          threshold: this.alertThresholds.memoryThreshold
        }
      })
    }

    // Connection drop rate
    const dropRate = (metrics.disconnectionRate / (metrics.connectionRate || 1)) * 100
    if (dropRate > this.alertThresholds.connectionDropThreshold) {
      this.emitAlert({
        type: 'connection_drop',
        severity: 'warning',
        message: `High connection drop rate: ${dropRate.toFixed(2)}%`,
        timestamp: Date.now(),
        metadata: {
          dropRate,
          threshold: this.alertThresholds.connectionDropThreshold,
          connectionRate: metrics.connectionRate,
          disconnectionRate: metrics.disconnectionRate
        }
      })
    }
  }

  private emitAlert(alert: WebSocketAlert): void {
    this.emit('alert', alert)
    
    // Log alert
    console.log(`🚨 WebSocket Alert [${alert.severity.toUpperCase()}]: ${alert.message}`)
  }

  // Monitoring lifecycle
  startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.monitoringInterval = setInterval(() => {
      this.calculateServiceMetrics()
      this.checkServiceAlerts()
      this.emit('metrics_updated', this.serviceMetrics)
    }, 10000) // Update every 10 seconds

    console.log('✅ WebSocket monitoring started')
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
    }

    console.log('⏹️ WebSocket monitoring stopped')
  }

  // Public API
  getServiceMetrics(): WebSocketServiceMetrics {
    return { ...this.serviceMetrics }
  }

  getConnectionMetrics(connectionId: string): WebSocketMetrics | undefined {
    const metrics = this.connections.get(connectionId)
    return metrics ? { ...metrics } : undefined
  }

  getAllConnectionMetrics(): WebSocketMetrics[] {
    return Array.from(this.connections.values()).map(m => ({ ...m }))
  }

  getMetricsHistory(duration?: number): Array<{ timestamp: number; metrics: WebSocketServiceMetrics }> {
    if (!duration) return [...this.metricsHistory]
    
    const cutoff = Date.now() - duration
    return this.metricsHistory.filter(h => h.timestamp > cutoff)
  }

  // Health check
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: Record<string, { status: 'pass' | 'fail'; message: string; value?: number }>
  } {
    const checks = {
      connections: {
        status: this.serviceMetrics.activeConnections <= this.alertThresholds.maxConnections ? 'pass' : 'fail' as const,
        message: `${this.serviceMetrics.activeConnections} active connections`,
        value: this.serviceMetrics.activeConnections
      },
      errorRate: {
        status: this.serviceMetrics.errorRate <= this.alertThresholds.errorRateThreshold ? 'pass' : 'fail' as const,
        message: `${this.serviceMetrics.errorRate.toFixed(2)} errors/minute`,
        value: this.serviceMetrics.errorRate
      },
      latency: {
        status: this.serviceMetrics.avgLatency <= this.alertThresholds.latencyThreshold ? 'pass' : 'fail' as const,
        message: `${this.serviceMetrics.avgLatency.toFixed(2)}ms average latency`,
        value: this.serviceMetrics.avgLatency
      },
      memory: {
        status: this.serviceMetrics.memoryUsage <= this.alertThresholds.memoryThreshold ? 'pass' : 'fail' as const,
        message: `${(this.serviceMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB memory usage`,
        value: this.serviceMetrics.memoryUsage
      }
    }

    const failedChecks = Object.values(checks).filter(c => c.status === 'fail').length
    let status: 'healthy' | 'degraded' | 'unhealthy'

    if (failedChecks === 0) {
      status = 'healthy'
    } else if (failedChecks <= 2) {
      status = 'degraded'
    } else {
      status = 'unhealthy'
    }

    return { status, checks }
  }

  // Prometheus metrics export
  exportPrometheusMetrics(): string {
    const metrics = this.serviceMetrics
    const timestamp = Date.now()

    return `
# HELP websocket_connections_total Total number of WebSocket connections
# TYPE websocket_connections_total counter
websocket_connections_total ${metrics.totalConnections} ${timestamp}

# HELP websocket_connections_active Number of active WebSocket connections
# TYPE websocket_connections_active gauge
websocket_connections_active ${metrics.activeConnections} ${timestamp}

# HELP websocket_connection_rate Connections established per second
# TYPE websocket_connection_rate gauge
websocket_connection_rate ${metrics.connectionRate} ${timestamp}

# HELP websocket_disconnection_rate Connections closed per second
# TYPE websocket_disconnection_rate gauge
websocket_disconnection_rate ${metrics.disconnectionRate} ${timestamp}

# HELP websocket_message_rate Messages processed per second
# TYPE websocket_message_rate gauge
websocket_message_rate ${metrics.messageRate} ${timestamp}

# HELP websocket_error_rate Errors per minute
# TYPE websocket_error_rate gauge
websocket_error_rate ${metrics.errorRate} ${timestamp}

# HELP websocket_latency_average Average message latency in milliseconds
# TYPE websocket_latency_average gauge
websocket_latency_average ${metrics.avgLatency} ${timestamp}

# HELP websocket_latency_p95 95th percentile message latency in milliseconds
# TYPE websocket_latency_p95 gauge
websocket_latency_p95 ${metrics.p95Latency} ${timestamp}

# HELP websocket_bandwidth_bytes Bandwidth usage in bytes per second
# TYPE websocket_bandwidth_bytes gauge
websocket_bandwidth_bytes ${metrics.bandwidth} ${timestamp}

# HELP websocket_memory_usage Memory usage in bytes
# TYPE websocket_memory_usage gauge
websocket_memory_usage ${metrics.memoryUsage} ${timestamp}

# HELP websocket_cpu_usage CPU usage percentage
# TYPE websocket_cpu_usage gauge
websocket_cpu_usage ${metrics.cpuUsage} ${timestamp}

# HELP websocket_uptime Service uptime in milliseconds
# TYPE websocket_uptime gauge
websocket_uptime ${Date.now() - metrics.uptime} ${timestamp}
`.trim()
  }
}

// Global WebSocket monitor instance
export const webSocketMonitor = new WebSocketMonitor({
  maxConnections: 500,
  errorRateThreshold: 5,
  latencyThreshold: 3000,
  memoryThreshold: 256 * 1024 * 1024, // 256MB
  connectionDropThreshold: 10
})

// Export monitoring utilities
export function createWebSocketMonitoringMiddleware() {
  return {
    onConnection: (connectionId: string, userId: string | undefined, endpoint: string) => {
      webSocketMonitor.trackConnection(connectionId, userId, endpoint)
    },
    
    onStatusChange: (connectionId: string, status: WebSocketMetrics['status']) => {
      webSocketMonitor.updateConnectionStatus(connectionId, status)
    },
    
    onMessage: (connectionId: string, direction: 'sent' | 'received', size: number, latency?: number) => {
      webSocketMonitor.trackMessage(connectionId, direction, size, latency)
    },
    
    onError: (connectionId: string, error: string, type: string) => {
      webSocketMonitor.trackError(connectionId, error, type)
    },
    
    onReconnect: (connectionId: string) => {
      webSocketMonitor.trackReconnection(connectionId)
    },
    
    onDisconnect: (connectionId: string) => {
      webSocketMonitor.removeConnection(connectionId)
    }
  }
}

export default webSocketMonitor
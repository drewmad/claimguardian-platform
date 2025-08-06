/**
 * React hook for live cost monitoring with WebSocket integration
 * Provides real-time cost updates, alerts, and metrics
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import webSocketCostMonitor, { RealTimeCostUpdate } from '@/services/websocket-cost-monitor'
import alertDeliverySystem, { AlertPayload } from '@/services/alert-delivery-system'

export interface LiveCostMetrics {
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
  lastUpdate: string
}

export interface LiveAlert {
  id: string
  type: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  timestamp: string
  userId?: string
  metadata?: Record<string, unknown>
  isNew: boolean
  acknowledged: boolean
}

export interface ConnectionStatus {
  isConnected: boolean
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastConnectedAt?: string
  reconnectAttempts: number
  subscriberCount: number
}

export interface LiveCostMonitorState {
  metrics: LiveCostMetrics
  alerts: LiveAlert[]
  recentUpdates: RealTimeCostUpdate[]
  connectionStatus: ConnectionStatus
  isLoading: boolean
  error: string | null
}

export interface LiveCostMonitorOptions {
  autoConnect?: boolean
  maxAlerts?: number
  maxUpdates?: number
  soundEnabled?: boolean
  updateInterval?: number // milliseconds for fallback polling
}

export function useLiveCostMonitor(options: LiveCostMonitorOptions = {}) {
  const {
    autoConnect = true,
    maxAlerts = 20,
    maxUpdates = 50,
    soundEnabled = true,
    updateInterval = 30000 // 30 seconds fallback polling
  } = options

  // State
  const [state, setState] = useState<LiveCostMonitorState>({
    metrics: {
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
      alertsCount: 0,
      lastUpdate: new Date().toISOString()
    },
    alerts: [],
    recentUpdates: [],
    connectionStatus: {
      isConnected: false,
      connectionState: 'disconnected',
      reconnectAttempts: 0,
      subscriberCount: 0
    },
    isLoading: true,
    error: null
  })

  // Refs for cleanup and intervals
  const subscriberIdRef = useRef<string>(`live-monitor-${Date.now()}`)
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isCleanedUpRef = useRef(false)

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((update: RealTimeCostUpdate) => {
    if (isCleanedUpRef.current) return

    setState(prevState => {
      const newState = { ...prevState }

      // Update metrics based on the update
      if (update.type === 'cost_update' && update.data.cost_delta) {
        newState.metrics = {
          ...newState.metrics,
          totalCostToday: newState.metrics.totalCostToday + update.data.cost_delta,
          requestsToday: newState.metrics.requestsToday + 1,
          lastUpdate: update.data.timestamp
        }

        if (update.data.tool_name) {
          newState.metrics.topCostTool = update.data.tool_name
        }
      }

      // Add to recent updates
      newState.recentUpdates = [update, ...newState.recentUpdates].slice(0, maxUpdates)

      // Handle alerts
      if (update.type === 'budget_alert' || update.type === 'usage_spike' || update.type === 'model_error') {
        const alert: LiveAlert = {
          id: `${update.type}_${Date.now()}_${Math.random()}`,
          type: update.type,
          message: update.data.message,
          severity: update.data.severity,
          timestamp: update.data.timestamp,
          userId: update.data.user_id,
          metadata: update.data.metadata,
          isNew: true,
          acknowledged: false
        }

        newState.alerts = [alert, ...newState.alerts].slice(0, maxAlerts)
        newState.metrics.alertsCount = newState.alerts.filter(a => !a.acknowledged).length

        // Play sound for critical alerts
        if (soundEnabled && update.data.severity === 'critical') {
          playAlertSound()
        }
      }

      return newState
    })
  }, [maxAlerts, maxUpdates, soundEnabled])

  // Initialize connection
  const connect = useCallback(async () => {
    if (isCleanedUpRef.current) return

    setState(prev => ({
      ...prev,
      connectionStatus: {
        ...prev.connectionStatus,
        connectionState: 'connecting'
      },
      error: null
    }))

    try {
      const success = await webSocketCostMonitor.initialize()
      
      if (success && !isCleanedUpRef.current) {
        const subscribed = webSocketCostMonitor.subscribe(
          subscriberIdRef.current,
          handleRealtimeUpdate
        )

        if (subscribed) {
          setState(prev => ({
            ...prev,
            connectionStatus: {
              ...prev.connectionStatus,
              isConnected: true,
              connectionState: 'connected',
              lastConnectedAt: new Date().toISOString(),
              reconnectAttempts: 0,
              subscriberCount: webSocketCostMonitor.getSubscriberCount()
            },
            isLoading: false
          }))

          // Load initial metrics
          await loadInitialMetrics()
          
          console.log('Live cost monitor connected successfully')
        } else {
          throw new Error('Failed to subscribe to updates')
        }
      } else {
        throw new Error('Failed to initialize WebSocket monitor')
      }

    } catch (error) {
      console.error('Connection failed:', error)
      
      setState(prev => ({
        ...prev,
        connectionStatus: {
          ...prev.connectionStatus,
          isConnected: false,
          connectionState: 'error',
          reconnectAttempts: prev.connectionStatus.reconnectAttempts + 1
        },
        error: error instanceof Error ? error.message : 'Unknown connection error',
        isLoading: false
      }))

      // Schedule reconnection
      scheduleReconnection()
    }
  }, [handleRealtimeUpdate])

  // Schedule reconnection with exponential backoff
  const scheduleReconnection = useCallback(() => {
    if (isCleanedUpRef.current || reconnectTimeoutRef.current) return

    setState(prev => {
      const attempts = prev.connectionStatus.reconnectAttempts
      const delay = Math.min(1000 * Math.pow(2, attempts), 30000) // Max 30 seconds
      
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null
        if (!isCleanedUpRef.current) {
          connect()
        }
      }, delay)

      return {
        ...prev,
        connectionStatus: {
          ...prev.connectionStatus,
          connectionState: 'connecting'
        }
      }
    })
  }, [connect])

  // Load initial metrics from API
  const loadInitialMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/ai-costs/quick-stats')
      if (response.ok) {
        const data = await response.json()
        
        setState(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            totalCostToday: data.todayCost || 0,
            requestsToday: data.todayRequests || 0,
            activeUsers: data.activeUsers || 0,
            avgResponseTime: data.avgResponseTime || 0,
            successRate: data.successRate || 1,
            topCostTool: data.topCostTool || 'None',
            alertsCount: data.budgetAlertsCount || 0,
            lastUpdate: new Date().toISOString()
          }
        }))
      }
    } catch (error) {
      console.error('Failed to load initial metrics:', error)
    }
  }, [])

  // Setup fallback polling
  const setupFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) return

    fallbackIntervalRef.current = setInterval(() => {
      if (!state.connectionStatus.isConnected && !isCleanedUpRef.current) {
        loadInitialMetrics()
      }
    }, updateInterval)
  }, [state.connectionStatus.isConnected, updateInterval, loadInitialMetrics])

  // Disconnect
  const disconnect = useCallback(() => {
    if (state.connectionStatus.isConnected) {
      webSocketCostMonitor.unsubscribe(subscriberIdRef.current)
    }
    
    setState(prev => ({
      ...prev,
      connectionStatus: {
        ...prev.connectionStatus,
        isConnected: false,
        connectionState: 'disconnected',
        subscriberCount: 0
      }
    }))
  }, [state.connectionStatus.isConnected])

  // Manual reconnect
  const reconnect = useCallback(() => {
    disconnect()
    setTimeout(() => {
      if (!isCleanedUpRef.current) {
        connect()
      }
    }, 1000)
  }, [disconnect, connect])

  // Alert management
  const acknowledgeAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert =>
        alert.id === alertId 
          ? { ...alert, acknowledged: true, isNew: false }
          : alert
      )
    }))
  }, [])

  const clearAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.id !== alertId)
    }))
  }, [])

  const clearAllAlerts = useCallback(() => {
    setState(prev => ({
      ...prev,
      alerts: []
    }))
  }, [])

  // Test alert delivery
  const sendTestAlert = useCallback(async (severity: 'info' | 'warning' | 'critical') => {
    const testAlert: AlertPayload = {
      id: `test-${Date.now()}`,
      type: 'system_alert',
      severity,
      title: `Test ${severity.toUpperCase()} Alert`,
      message: `This is a test ${severity} alert from the live cost monitor`,
      timestamp: new Date().toISOString(),
      channels: ['email', 'slack']
    }

    try {
      const results = await alertDeliverySystem.deliverAlert(testAlert)
      return results
    } catch (error) {
      console.error('Failed to send test alert:', error)
      throw error
    }
  }, [])

  // Utility functions
  const playAlertSound = useCallback(() => {
    try {
      const audio = new Audio('/sounds/alert.wav')
      audio.volume = 0.3
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      })
    } catch (error) {
      // Ignore audio creation errors
    }
  }, [])

  // Effects
  useEffect(() => {
    isCleanedUpRef.current = false
    
    if (autoConnect) {
      connect()
    }
    
    setupFallbackPolling()

    return () => {
      isCleanedUpRef.current = true
      
      // Cleanup WebSocket
      if (webSocketCostMonitor.isConnected()) {
        webSocketCostMonitor.unsubscribe(subscriberIdRef.current)
      }
      
      // Cleanup timers
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current)
        fallbackIntervalRef.current = null
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [autoConnect, connect, setupFallbackPolling])

  // Auto-mark alerts as old after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setState(prev => ({
        ...prev,
        alerts: prev.alerts.map(alert => ({ ...alert, isNew: false }))
      }))
    }, 10000)

    return () => clearTimeout(timer)
  }, [state.alerts.filter(a => a.isNew).length])

  // Return hook interface
  return {
    // State
    ...state,
    
    // Connection management
    connect,
    disconnect,
    reconnect,
    
    // Alert management
    acknowledgeAlert,
    clearAlert,
    clearAllAlerts,
    sendTestAlert,
    
    // Metrics
    refreshMetrics: loadInitialMetrics,
    
    // Utility
    playAlertSound
  }
}
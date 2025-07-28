'use client'

import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'

export interface StatusUpdate {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  progress?: number
  timestamp: Date
  metadata?: Record<string, any>
}

export interface SystemStatus {
  ai_services: {
    openai: 'online' | 'offline' | 'degraded'
    gemini: 'online' | 'offline' | 'degraded'
  }
  upload_service: 'online' | 'offline' | 'degraded'
  database: 'online' | 'offline' | 'degraded'
  last_updated: Date
}

class RealTimeStatusManager {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private statusUpdateCallbacks: ((update: StatusUpdate) => void)[] = []
  private systemStatusCallbacks: ((status: SystemStatus) => void)[] = []
  private isConnected = false

  constructor() {
    this.connect()
  }

  private connect() {
    try {
      // Use environment variable for WebSocket URL, fallback to localhost
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws'
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this.isConnected = true
        this.reconnectAttempts = 0
        if (process.env.NODE_ENV === 'development') {
          console.debug('Real-time status connected')
        }
        
        // Subscribe to AI service updates
        this.send({
          type: 'subscribe',
          topics: ['ai_analysis', 'system_status', 'user_actions']
        })
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'status_update') {
            const update: StatusUpdate = {
              ...data.payload,
              timestamp: new Date(data.payload.timestamp)
            }
            this.statusUpdateCallbacks.forEach(cb => cb(update))
          } else if (data.type === 'system_status') {
            const status: SystemStatus = {
              ...data.payload,
              last_updated: new Date(data.payload.last_updated)
            }
            this.systemStatusCallbacks.forEach(cb => cb(status))
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onclose = () => {
        this.isConnected = false
        this.reconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.isConnected = false
      }
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      this.reconnect()
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      if (process.env.NODE_ENV === 'development') {
        console.debug(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      }
      
      setTimeout(() => {
        this.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('Max reconnection attempts reached')
      toast.error('Lost connection to real-time updates')
    }
  }

  private send(message: unknown) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message))
    }
  }

  public subscribeToStatusUpdates(callback: (update: StatusUpdate) => void) {
    this.statusUpdateCallbacks.push(callback)
    
    return () => {
      this.statusUpdateCallbacks = this.statusUpdateCallbacks.filter(cb => cb !== callback)
    }
  }

  public subscribeToSystemStatus(callback: (status: SystemStatus) => void) {
    this.systemStatusCallbacks.push(callback)
    
    return () => {
      this.systemStatusCallbacks = this.systemStatusCallbacks.filter(cb => cb !== callback)
    }
  }

  public sendStatusUpdate(update: Omit<StatusUpdate, 'id' | 'timestamp'>) {
    const fullUpdate: StatusUpdate = {
      ...update,
      id: `status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }
    
    this.send({
      type: 'status_update',
      payload: fullUpdate
    })
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// Singleton instance
let statusManager: RealTimeStatusManager | null = null

export function getRealTimeStatusManager() {
  if (!statusManager) {
    statusManager = new RealTimeStatusManager()
  }
  return statusManager
}

// React hook for status updates
export function useRealTimeStatus() {
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const statusManagerRef = useRef<RealTimeStatusManager | null>(null)

  useEffect(() => {
    statusManagerRef.current = getRealTimeStatusManager()
    
    const unsubscribeUpdates = statusManagerRef.current.subscribeToStatusUpdates((update) => {
      setStatusUpdates(prev => {
        const newUpdates = [update, ...prev].slice(0, 50) // Keep last 50 updates
        return newUpdates
      })
      
      // Show toast for important updates
      if (update.type === 'error') {
        toast.error(update.message)
      } else if (update.type === 'success') {
        toast.success(update.message)
      }
    })
    
    const unsubscribeStatus = statusManagerRef.current.subscribeToSystemStatus((status) => {
      setSystemStatus(status)
    })
    
    return () => {
      unsubscribeUpdates()
      unsubscribeStatus()
    }
  }, [])

  const sendStatusUpdate = (update: Omit<StatusUpdate, 'id' | 'timestamp'>) => {
    statusManagerRef.current?.sendStatusUpdate(update)
  }

  return {
    statusUpdates,
    systemStatus,
    sendStatusUpdate,
    isConnected: !!statusManagerRef.current
  }
}

// Fallback implementation for when WebSocket is not available
export function useFallbackStatus() {
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    ai_services: {
      openai: 'online',
      gemini: 'online'
    },
    upload_service: 'online',
    database: 'online',
    last_updated: new Date()
  })

  const sendStatusUpdate = (update: Omit<StatusUpdate, 'id' | 'timestamp'>) => {
    const fullUpdate: StatusUpdate = {
      ...update,
      id: `status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }
    
    setStatusUpdates(prev => [fullUpdate, ...prev].slice(0, 50))
    
    // Show toast for important updates
    if (update.type === 'error') {
      toast.error(update.message)
    } else if (update.type === 'success') {
      toast.success(update.message)
    }
  }

  return {
    statusUpdates,
    systemStatus,
    sendStatusUpdate,
    isConnected: false
  }
}
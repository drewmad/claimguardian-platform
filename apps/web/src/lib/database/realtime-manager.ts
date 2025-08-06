/**
 * @fileMetadata
 * @purpose "Real-time database synchronization and live updates system with Supabase Realtime"
 * @owner backend-team
 * @dependencies ["@supabase/supabase-js", "@/lib/logger", "@/lib/database/cache-manager"]
 * @exports ["RealtimeManager", "RealtimeSubscription", "RealtimeEvent", "RealtimeConfig"]
 * @complexity high
 * @tags ["database", "realtime", "websockets", "synchronization", "live-updates"]
 * @status stable
 */

import { createClient, SupabaseClient, RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '@claimguardian/db'
import { getCacheManager } from './cache-manager'
import { logger } from '@/lib/logger'

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*'
export type RealtimeTable = keyof Database['public']['Tables']
export type SubscriptionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'closed'

export interface RealtimeConfig {
  enableHeartbeat: boolean
  heartbeatInterval: number
  reconnectDelay: number
  maxReconnectAttempts: number
  bufferMessages: boolean
  bufferSize: number
  enablePresence: boolean
  enableBroadcast: boolean
}

export interface RealtimeEvent<T = any> {
  id: string
  type: RealtimeEventType
  table: string
  schema: string
  new: T | null
  old: T | null
  timestamp: Date
  userId?: string
  metadata?: Record<string, any>
}

export interface RealtimeSubscription {
  id: string
  channel: string
  table: RealtimeTable
  filter?: Record<string, any>
  events: RealtimeEventType[]
  status: SubscriptionStatus
  callback: (event: RealtimeEvent) => void | Promise<void>
  errorCallback?: (error: Error) => void
  created: Date
  lastEvent?: Date
  eventCount: number
}

export interface PresenceState {
  userId: string
  userInfo: {
    email?: string
    name?: string
    avatar?: string
  }
  location: {
    page: string
    path: string
    component?: string
  }
  activity: {
    lastSeen: Date
    status: 'online' | 'away' | 'busy' | 'offline'
    action?: string
  }
  metadata?: Record<string, any>
}

export interface BroadcastMessage {
  id: string
  type: string
  payload: any
  userId?: string
  timestamp: Date
  room?: string
}

export class RealtimeManager {
  private supabase: SupabaseClient<Database>
  private cacheManager = getCacheManager()
  private config: RealtimeConfig
  private subscriptions: Map<string, RealtimeSubscription> = new Map()
  private channels: Map<string, RealtimeChannel> = new Map()
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private messageBuffer: Map<string, RealtimeEvent[]> = new Map()
  private presenceStates: Map<string, PresenceState> = new Map()
  private isInitialized = false
  private heartbeatInterval?: NodeJS.Timeout

  constructor(config: Partial<RealtimeConfig> = {}) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })

    this.config = {
      enableHeartbeat: true,
      heartbeatInterval: 30000, // 30 seconds
      reconnectDelay: 5000,     // 5 seconds
      maxReconnectAttempts: 10,
      bufferMessages: true,
      bufferSize: 100,
      enablePresence: true,
      enableBroadcast: true,
      ...config
    }

    this.initialize()
  }

  /**
   * Initialize the realtime manager
   */
  private async initialize(): Promise<void> {
    logger.info('Initializing realtime manager', { config: this.config })

    try {
      // Start heartbeat if enabled
      if (this.config.enableHeartbeat) {
        this.startHeartbeat()
      }

      this.isInitialized = true
      logger.info('Realtime manager initialized successfully')

    } catch (error) {
      logger.error('Failed to initialize realtime manager', error as Error)
      throw error
    }
  }

  /**
   * Subscribe to real-time changes on a table
   */
  async subscribe<T = any>(
    table: RealtimeTable,
    events: RealtimeEventType | RealtimeEventType[],
    callback: (event: RealtimeEvent<T>) => void | Promise<void>,
    options: {
      filter?: Record<string, any>
      errorCallback?: (error: Error) => void
      channel?: string
      enableCache?: boolean
    } = {}
  ): Promise<string> {
    const {
      filter,
      errorCallback,
      channel: customChannel,
      enableCache = true
    } = options

    const eventArray = Array.isArray(events) ? events : [events]
    const channelName = customChannel || `table:${table}:${this.generateChannelId(filter)}`
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      // Create or get existing channel
      let channel = this.channels.get(channelName)
      if (!channel) {
        channel = this.supabase.channel(channelName)
        this.channels.set(channelName, channel)
      }

      // Set up postgres changes listener
      const postgresFilter: any = {
        event: eventArray.includes('*') ? '*' : eventArray.join(','),
        schema: 'public',
        table
      }

      if (filter) {
        Object.assign(postgresFilter, { filter: this.buildFilterString(filter) })
      }

      channel.on(
        'postgres_changes',
        postgresFilter,
        async (payload: RealtimePostgresChangesPayload<T>) => {
          const event: RealtimeEvent<T> = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: payload.eventType as RealtimeEventType,
            table: payload.table,
            schema: payload.schema,
            new: payload.new,
            old: payload.old,
            timestamp: new Date(),
            metadata: {
              commitTimestamp: payload.commit_timestamp
            }
          }

          // Update cache if enabled
          if (enableCache) {
            await this.updateCache(event)
          }

          // Buffer message if connection is unstable
          if (this.config.bufferMessages) {
            this.bufferMessage(subscriptionId, event)
          }

          // Execute callback
          try {
            await callback(event)
            
            // Update subscription metrics
            const subscription = this.subscriptions.get(subscriptionId)
            if (subscription) {
              subscription.lastEvent = new Date()
              subscription.eventCount++
            }

          } catch (error) {
            logger.error('Realtime callback error', { subscriptionId, event }, error as Error)
            if (errorCallback) {
              errorCallback(error as Error)
            }
          }
        }
      )

      // Subscribe to the channel
      channel.subscribe((status, err) => {
        const subscription = this.subscriptions.get(subscriptionId)
        if (subscription) {
          subscription.status = this.mapChannelStatus(status)
        }

        if (status === 'SUBSCRIBED') {
          logger.info('Realtime subscription established', { subscriptionId, table, channelName })
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Realtime subscription error', { subscriptionId, table, error: err })
          if (errorCallback) {
            errorCallback(err || new Error('Channel subscription failed'))
          }
          this.scheduleReconnect(subscriptionId)
        } else if (status === 'CLOSED') {
          logger.warn('Realtime channel closed', { subscriptionId, table })
          this.scheduleReconnect(subscriptionId)
        }
      })

      // Create subscription record
      const subscription: RealtimeSubscription = {
        id: subscriptionId,
        channel: channelName,
        table,
        filter,
        events: eventArray,
        status: 'connecting',
        callback,
        errorCallback,
        created: new Date(),
        eventCount: 0
      }

      this.subscriptions.set(subscriptionId, subscription)

      logger.info('Realtime subscription created', {
        subscriptionId,
        table,
        events: eventArray,
        filter
      })

      return subscriptionId

    } catch (error) {
      logger.error('Failed to create realtime subscription', { table, events }, error as Error)
      throw error
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      logger.warn('Subscription not found for unsubscribe', { subscriptionId })
      return
    }

    try {
      const channel = this.channels.get(subscription.channel)
      if (channel) {
        await channel.unsubscribe()
      }

      // Clean up resources
      this.subscriptions.delete(subscriptionId)
      this.messageBuffer.delete(subscriptionId)
      
      const timeout = this.reconnectTimeouts.get(subscriptionId)
      if (timeout) {
        clearTimeout(timeout)
        this.reconnectTimeouts.delete(subscriptionId)
      }

      logger.info('Realtime subscription removed', { subscriptionId })

    } catch (error) {
      logger.error('Failed to unsubscribe from realtime', { subscriptionId }, error as Error)
      throw error
    }
  }

  /**
   * Subscribe to presence updates
   */
  async subscribeToPresence(
    channel: string,
    callback: (presenceState: Map<string, PresenceState>) => void
  ): Promise<string> {
    if (!this.config.enablePresence) {
      throw new Error('Presence is disabled in configuration')
    }

    const subscriptionId = `presence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      const realtimeChannel = this.supabase.channel(channel, {
        config: { presence: { key: subscriptionId } }
      })

      realtimeChannel
        .on('presence', { event: 'sync' }, () => {
          const state = realtimeChannel.presenceState()
          const presenceMap = new Map<string, PresenceState>()
          
          Object.entries(state).forEach(([userId, presences]) => {
            const presence = Array.isArray(presences) ? presences[0] : presences
            if (presence) {
              presenceMap.set(userId, presence as PresenceState)
            }
          })

          callback(presenceMap)
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          logger.debug('User joined presence', { newPresences })
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          logger.debug('User left presence', { leftPresences })
        })

      realtimeChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Presence subscription established', { channel, subscriptionId })
        }
      })

      this.channels.set(subscriptionId, realtimeChannel)
      return subscriptionId

    } catch (error) {
      logger.error('Failed to subscribe to presence', { channel }, error as Error)
      throw error
    }
  }

  /**
   * Update presence state for current user
   */
  async updatePresence(
    channel: string,
    presenceState: Partial<PresenceState>
  ): Promise<void> {
    if (!this.config.enablePresence) {
      throw new Error('Presence is disabled in configuration')
    }

    try {
      const realtimeChannel = this.channels.get(channel)
      if (realtimeChannel) {
        await realtimeChannel.track(presenceState)
        logger.debug('Presence state updated', { channel, presenceState })
      }
    } catch (error) {
      logger.error('Failed to update presence', { channel }, error as Error)
      throw error
    }
  }

  /**
   * Subscribe to broadcast messages
   */
  async subscribeToBroadcast(
    channel: string,
    eventType: string,
    callback: (message: BroadcastMessage) => void
  ): Promise<string> {
    if (!this.config.enableBroadcast) {
      throw new Error('Broadcast is disabled in configuration')
    }

    const subscriptionId = `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      let realtimeChannel = this.channels.get(channel)
      if (!realtimeChannel) {
        realtimeChannel = this.supabase.channel(channel)
        this.channels.set(channel, realtimeChannel)
      }

      realtimeChannel.on('broadcast', { event: eventType }, (payload) => {
        const message: BroadcastMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: eventType,
          payload: payload.payload,
          userId: payload.userId,
          timestamp: new Date(),
          room: channel
        }

        callback(message)
        logger.debug('Broadcast message received', { channel, eventType, message })
      })

      realtimeChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Broadcast subscription established', { channel, eventType, subscriptionId })
        }
      })

      return subscriptionId

    } catch (error) {
      logger.error('Failed to subscribe to broadcast', { channel, eventType }, error as Error)
      throw error
    }
  }

  /**
   * Send broadcast message
   */
  async broadcast(
    channel: string,
    eventType: string,
    payload: any,
    options: { userId?: string } = {}
  ): Promise<void> {
    if (!this.config.enableBroadcast) {
      throw new Error('Broadcast is disabled in configuration')
    }

    try {
      let realtimeChannel = this.channels.get(channel)
      if (!realtimeChannel) {
        realtimeChannel = this.supabase.channel(channel)
        this.channels.set(channel, realtimeChannel)
        await new Promise(resolve => {
          realtimeChannel!.subscribe((status) => {
            if (status === 'SUBSCRIBED') resolve(void 0)
          })
        })
      }

      await realtimeChannel.send({
        type: 'broadcast',
        event: eventType,
        payload: {
          ...payload,
          userId: options.userId,
          timestamp: new Date().toISOString()
        }
      })

      logger.debug('Broadcast message sent', { channel, eventType, payload })

    } catch (error) {
      logger.error('Failed to send broadcast message', { channel, eventType }, error as Error)
      throw error
    }
  }

  /**
   * Get subscription status and metrics
   */
  getSubscriptionInfo(): {
    subscriptions: Array<{
      id: string
      table: string
      events: RealtimeEventType[]
      status: SubscriptionStatus
      eventCount: number
      created: Date
      lastEvent?: Date
    }>
    channels: number
    totalEvents: number
    averageLatency: number
  } {
    const subscriptions = Array.from(this.subscriptions.values()).map(sub => ({
      id: sub.id,
      table: sub.table,
      events: sub.events,
      status: sub.status,
      eventCount: sub.eventCount,
      created: sub.created,
      lastEvent: sub.lastEvent
    }))

    const totalEvents = subscriptions.reduce((sum, sub) => sum + sub.eventCount, 0)
    const activeChannels = this.channels.size

    return {
      subscriptions,
      channels: activeChannels,
      totalEvents,
      averageLatency: 0 // Would calculate from metrics
    }
  }

  /**
   * Gracefully shutdown all realtime connections
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down realtime manager')

    try {
      // Stop heartbeat
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval)
      }

      // Clear all reconnect timeouts
      for (const timeout of this.reconnectTimeouts.values()) {
        clearTimeout(timeout)
      }
      this.reconnectTimeouts.clear()

      // Unsubscribe from all channels
      const unsubscribePromises = Array.from(this.channels.values()).map(channel => 
        channel.unsubscribe()
      )
      await Promise.all(unsubscribePromises)

      // Clear all data structures
      this.subscriptions.clear()
      this.channels.clear()
      this.messageBuffer.clear()
      this.presenceStates.clear()

      this.isInitialized = false
      logger.info('Realtime manager shutdown complete')

    } catch (error) {
      logger.error('Realtime manager shutdown failed', error as Error)
      throw error
    }
  }

  // Private methods
  private generateChannelId(filter?: Record<string, any>): string {
    if (!filter) return 'default'
    return Object.entries(filter)
      .map(([key, value]) => `${key}:${value}`)
      .join('_')
  }

  private buildFilterString(filter: Record<string, any>): string {
    return Object.entries(filter)
      .map(([key, value]) => `${key}=eq.${value}`)
      .join(',')
  }

  private mapChannelStatus(status: string): SubscriptionStatus {
    switch (status) {
      case 'SUBSCRIBED': return 'connected'
      case 'CHANNEL_ERROR': return 'error'
      case 'CLOSED': return 'closed'
      default: return 'connecting'
    }
  }

  private async updateCache(event: RealtimeEvent): Promise<void> {
    try {
      const cacheKey = `${event.table}:${event.new?.id || event.old?.id}`
      
      switch (event.type) {
        case 'INSERT':
        case 'UPDATE':
          if (event.new) {
            await this.cacheManager.set(cacheKey, event.new, { ttl: 5 * 60 * 1000 })
          }
          break
          
        case 'DELETE':
          await this.cacheManager.delete(cacheKey)
          break
      }

      logger.debug('Cache updated from realtime event', { event: event.type, table: event.table })

    } catch (error) {
      logger.warn('Failed to update cache from realtime event', event, error as Error)
    }
  }

  private bufferMessage(subscriptionId: string, event: RealtimeEvent): void {
    if (!this.config.bufferMessages) return

    let buffer = this.messageBuffer.get(subscriptionId)
    if (!buffer) {
      buffer = []
      this.messageBuffer.set(subscriptionId, buffer)
    }

    buffer.push(event)

    // Trim buffer if too large
    if (buffer.length > this.config.bufferSize) {
      buffer.shift()
    }
  }

  private scheduleReconnect(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return

    // Clear existing timeout
    const existingTimeout = this.reconnectTimeouts.get(subscriptionId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    const timeout = setTimeout(async () => {
      try {
        logger.info('Attempting to reconnect subscription', { subscriptionId })
        
        // Recreate subscription with same parameters
        const newSubscriptionId = await this.subscribe(
          subscription.table,
          subscription.events,
          subscription.callback,
          {
            filter: subscription.filter,
            errorCallback: subscription.errorCallback,
            channel: subscription.channel
          }
        )

        // Transfer buffered messages
        const bufferedMessages = this.messageBuffer.get(subscriptionId)
        if (bufferedMessages) {
          this.messageBuffer.set(newSubscriptionId, bufferedMessages)
          this.messageBuffer.delete(subscriptionId)
        }

        // Remove old subscription
        this.subscriptions.delete(subscriptionId)
        this.reconnectTimeouts.delete(subscriptionId)

      } catch (error) {
        logger.error('Subscription reconnection failed', { subscriptionId }, error as Error)
      }
    }, this.config.reconnectDelay)

    this.reconnectTimeouts.set(subscriptionId, timeout)
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const activeSubscriptions = Array.from(this.subscriptions.values())
        .filter(sub => sub.status === 'connected').length

      logger.debug('Realtime heartbeat', {
        activeSubscriptions,
        totalChannels: this.channels.size,
        bufferedMessages: Array.from(this.messageBuffer.values())
          .reduce((sum, buffer) => sum + buffer.length, 0)
      })
    }, this.config.heartbeatInterval)
  }
}

// Singleton instance
let realtimeManagerInstance: RealtimeManager | null = null

export function getRealtimeManager(): RealtimeManager {
  if (!realtimeManagerInstance) {
    realtimeManagerInstance = new RealtimeManager()
  }
  return realtimeManagerInstance
}

export async function shutdownRealtimeManager(): Promise<void> {
  if (realtimeManagerInstance) {
    await realtimeManagerInstance.shutdown()
    realtimeManagerInstance = null
  }
}

// Convenience hooks and utilities
export const realtimeUtils = {
  /**
   * Subscribe to table changes with automatic cache invalidation
   */
  subscribeWithCache: async <T = any>(
    table: RealtimeTable,
    events: RealtimeEventType | RealtimeEventType[],
    callback: (event: RealtimeEvent<T>) => void | Promise<void>,
    cacheKeyGenerator?: (event: RealtimeEvent<T>) => string[]
  ): Promise<string> => {
    const manager = getRealtimeManager()
    return manager.subscribe(table, events, async (event) => {
      // Execute original callback
      await callback(event)
      
      // Invalidate related cache keys
      if (cacheKeyGenerator) {
        const cacheManager = getCacheManager()
        const keysToInvalidate = cacheKeyGenerator(event)
        for (const key of keysToInvalidate) {
          await cacheManager.delete(key)
        }
      }
    }, { enableCache: true })
  },

  /**
   * Create a presence channel for a specific page or component
   */
  createPresenceChannel: (page: string, component?: string): string => {
    return `presence:${page}${component ? `:${component}` : ''}`
  },

  /**
   * Create a broadcast channel for real-time collaboration
   */
  createBroadcastChannel: (feature: string, scope?: string): string => {
    return `broadcast:${feature}${scope ? `:${scope}` : ''}`
  }
}
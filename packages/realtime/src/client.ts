import { SupabaseClient, RealtimeChannel, REALTIME_POSTGRES_CHANGES_LISTEN_EVENT } from '@supabase/supabase-js'
import { EventEmitter } from 'eventemitter3'

import type { 
  RealtimeEvent, 
  ChannelConfig, 
  RealtimeSubscription,
  PresenceState,
  BroadcastMessage,
  ChangeType
} from './types'

export class RealtimeClient extends EventEmitter {
  private supabase: SupabaseClient
  private channels: Map<string, RealtimeChannel> = new Map()
  private subscriptions: Map<string, RealtimeSubscription> = new Map()
  private userId?: string

  constructor(supabase: SupabaseClient, userId?: string) {
    super()
    this.supabase = supabase
    this.userId = userId
  }

  setUserId(userId: string) {
    this.userId = userId
  }

  /**
   * Subscribe to database changes
   */
  subscribeToTable<T = unknown>(
    table: string,
    config?: Partial<ChannelConfig>
  ): RealtimeSubscription {
    const channelName = config?.name || `table-${table}`
    
    // Check if already subscribed
    if (this.subscriptions.has(channelName)) {
      console.warn(`Already subscribed to ${channelName}`)
      return this.subscriptions.get(channelName)!
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          const event: RealtimeEvent<T> = {
            type: payload.eventType as ChangeType,
            table: payload.table,
            schema: payload.schema,
            old: payload.old as T,
            new: payload.new as T,
            timestamp: new Date().toISOString()
          }

          // Emit generic event
          this.emit(`${table}:change`, event)

          // Emit specific events
          switch (payload.eventType) {
            case 'INSERT':
              this.emit(`${table}:insert`, event.new)
              config?.onInsert?.(event.new)
              break
            case 'UPDATE':
              this.emit(`${table}:update`, { old: event.old, new: event.new })
              config?.onUpdate?.({ old: event.old, new: event.new })
              break
            case 'DELETE':
              this.emit(`${table}:delete`, event.old)
              config?.onDelete?.(event.old)
              break
          }
        }
      )

    // Handle connection events
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        this.emit(`${channelName}:connected`)
        config?.onConnect?.()
      } else if (status === 'CLOSED') {
        this.emit(`${channelName}:disconnected`)
        config?.onDisconnect?.()
      } else if (status === 'CHANNEL_ERROR') {
        const error = new Error(`Channel error: ${channelName}`)
        this.emit(`${channelName}:error`, error)
        config?.onError?.(error)
      }
    })

    const subscription: RealtimeSubscription = {
      channel,
      unsubscribe: () => this.unsubscribe(channelName)
    }

    this.channels.set(channelName, channel)
    this.subscriptions.set(channelName, subscription)

    return subscription
  }

  /**
   * Subscribe to specific record changes
   */
  subscribeToRecord<T = unknown>(
    table: string,
    id: string,
    config?: Partial<ChannelConfig>
  ): RealtimeSubscription {
    const channelName = config?.name || `record-${table}-${id}`
    
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName)!
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: '*' as REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL, 
          schema: 'public', 
          table,
          filter: `id=eq.${id}`
        },
        (payload) => {
          const event: RealtimeEvent<T> = {
            type: payload.eventType as ChangeType,
            table: payload.table,
            schema: payload.schema,
            old: payload.old as T,
            new: payload.new as T,
            timestamp: new Date().toISOString()
          }

          this.emit(`${table}:${id}:change`, event)

          switch (payload.eventType) {
            case 'UPDATE':
              config?.onUpdate?.({ old: event.old, new: event.new })
              break
            case 'DELETE':
              config?.onDelete?.(event.old)
              break
          }
        }
      )

    channel.subscribe()

    const subscription: RealtimeSubscription = {
      channel,
      unsubscribe: () => this.unsubscribe(channelName)
    }

    this.channels.set(channelName, channel)
    this.subscriptions.set(channelName, subscription)

    return subscription
  }

  /**
   * Create a presence channel for collaboration
   */
  createPresenceChannel(
    name: string,
    initialState?: Record<string, unknown>
  ): RealtimeChannel {
    const channel = this.supabase.channel(name, {
      config: {
        presence: {
          key: this.userId || 'anonymous'
        }
      }
    })

    // Track presence
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      this.emit(`presence:${name}:sync`, state)
    })

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      this.emit(`presence:${name}:join`, { key, newPresences })
    })

    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      this.emit(`presence:${name}:leave`, { key, leftPresences })
    })

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && initialState) {
        await channel.track(initialState)
      }
    })

    this.channels.set(`presence:${name}`, channel)

    return channel
  }

  /**
   * Create a broadcast channel for real-time messaging
   */
  createBroadcastChannel(name: string): RealtimeChannel {
    const channel = this.supabase.channel(name)

    channel.on('broadcast', { event: '*' }, (message: BroadcastMessage) => {
      this.emit(`broadcast:${name}:${message.event}`, message.payload)
    })

    channel.subscribe()

    this.channels.set(`broadcast:${name}`, channel)

    return channel
  }

  /**
   * Send a broadcast message
   */
  async broadcast(
    channelName: string,
    event: string,
    payload: unknown
  ): Promise<void> {
    const channel = this.channels.get(`broadcast:${channelName}`)
    
    if (!channel) {
      throw new Error(`Broadcast channel ${channelName} not found`)
    }

    await channel.send({
      type: 'broadcast',
      event,
      payload
    })
  }

  /**
   * Update presence state
   */
  async updatePresence(
    channelName: string,
    state: Record<string, unknown>
  ): Promise<void> {
    const channel = this.channels.get(`presence:${channelName}`)
    
    if (!channel) {
      throw new Error(`Presence channel ${channelName} not found`)
    }

    await channel.track(state)
  }

  /**
   * Get current presence state
   */
  getPresenceState(channelName: string): PresenceState {
    const channel = this.channels.get(`presence:${channelName}`)
    
    if (!channel) {
      return {}
    }

    return channel.presenceState()
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName) || 
                  this.channels.get(`presence:${channelName}`) ||
                  this.channels.get(`broadcast:${channelName}`)
    
    if (channel) {
      channel.unsubscribe()
      this.channels.delete(channelName)
      this.channels.delete(`presence:${channelName}`)
      this.channels.delete(`broadcast:${channelName}`)
      this.subscriptions.delete(channelName)
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      channel.unsubscribe()
    })
    
    this.channels.clear()
    this.subscriptions.clear()
    this.removeAllListeners()
  }

  /**
   * Get all active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys())
  }

  /**
   * Check if subscribed to a channel
   */
  isSubscribed(channelName: string): boolean {
    return this.channels.has(channelName) || 
           this.channels.has(`presence:${channelName}`) ||
           this.channels.has(`broadcast:${channelName}`)
  }
}

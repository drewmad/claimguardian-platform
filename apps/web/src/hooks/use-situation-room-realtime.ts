/**
 * @fileMetadata
 * @purpose Real-time WebSocket hooks for Situation Room monitoring
 * @owner frontend-team
 * @dependencies ["react", "@supabase/supabase-js", "@/types/situation-room"]
 * @exports ["useSituationRoomRealtime", "useRealtimeSubscription"]
 * @complexity high
 * @tags ["situation-room", "realtime", "websockets"]
 * @status active
 */
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { RealtimeChannel } from '@supabase/supabase-js'

import { useSituationRoom } from '@/lib/stores/situation-room-store'
import type {
  RealtimeEvent,
  ThreatAssessment,
  IntelligenceFeed,
  PropertyStatus,
  CommunityIntelligence,
  AIRecommendation,
  EventType,
  ThreatLevel
} from '@/types/situation-room'

interface RealtimeSubscriptionConfig {
  propertyId: string
  enabledEventTypes?: EventType[]
  reconnectInterval?: number
  maxReconnectAttempts?: number
  onConnectionStateChange?: (state: 'connected' | 'reconnecting' | 'disconnected') => void
  onError?: (error: Error) => void
}

interface SituationRoomRealtimeHook {
  isConnected: boolean
  isReconnecting: boolean
  connectionAttempts: number
  lastHeartbeat: Date | null
  subscribe: (config: RealtimeSubscriptionConfig) => void
  unsubscribe: () => void
  forceReconnect: () => void
}

export function useSituationRoomRealtime(): SituationRoomRealtimeHook {
  const supabase = createClientComponentClient()
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map())
  const connectionStateRef = useRef<'connected' | 'reconnecting' | 'disconnected'>('disconnected')
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const heartbeatRef = useRef<Date | null>(null)
  const configRef = useRef<RealtimeSubscriptionConfig | null>(null)
  
  const {
    addThreat,
    addIntelligenceFeed,
    addRealtimeEvent,
    addRecommendation,
    setConnectionStatus,
    setError,
    refreshPropertyStatus,
    refreshCommunityIntel
  } = useSituationRoom()

  const handleConnectionStateChange = useCallback((state: 'connected' | 'reconnecting' | 'disconnected') => {
    connectionStateRef.current = state
    setConnectionStatus(state)
    configRef.current?.onConnectionStateChange?.(state)
    
    if (state === 'connected') {
      reconnectAttemptsRef.current = 0
      heartbeatRef.current = new Date()
    }
  }, [setConnectionStatus])

  const handleError = useCallback((error: Error) => {
    console.error('Situation Room realtime error:', error)
    setError(error.message)
    configRef.current?.onError?.(error)
  }, [setError])

  const createRealtimeEvent = useCallback((
    type: EventType,
    data: any,
    source: string = 'realtime'
  ): RealtimeEvent => ({
    id: `${type}-${Date.now()}-${Math.random()}`,
    type,
    timestamp: new Date(),
    data,
    priority: determinePriority(type, data),
    requiresAttention: requiresUserAttention(type, data),
    autoProcessed: shouldAutoProcess(type),
    source
  }), [])

  const handleThreatUpdate = useCallback((payload: any) => {
    console.log('Threat update received:', payload)
    
    if (payload.new && payload.eventType === 'INSERT') {
      const threat: ThreatAssessment = payload.new
      addThreat(threat)
      
      const event = createRealtimeEvent(EventType.THREAT_UPDATE, { threat }, 'ai-assessment')
      addRealtimeEvent(event)
      
      // Auto-activate emergency mode for critical threats
      if (threat.severity === ThreatLevel.CRITICAL || threat.severity === ThreatLevel.EMERGENCY) {
        const emergencyEvent = createRealtimeEvent(
          EventType.EMERGENCY_BROADCAST,
          { emergency: true, threat },
          'auto-protocol'
        )
        addRealtimeEvent(emergencyEvent)
      }
    }
  }, [addThreat, addRealtimeEvent, createRealtimeEvent])

  const handleIntelligenceUpdate = useCallback((payload: any) => {
    console.log('Intelligence feed received:', payload)
    
    if (payload.new && payload.eventType === 'INSERT') {
      const feed: IntelligenceFeed = payload.new
      addIntelligenceFeed(feed)
      
      const event = createRealtimeEvent(EventType.INTELLIGENCE_FEED, { feed }, 'intelligence-network')
      addRealtimeEvent(event)
    }
  }, [addIntelligenceFeed, addRealtimeEvent, createRealtimeEvent])

  const handlePropertySystemUpdate = useCallback((payload: any) => {
    console.log('Property system update:', payload)
    
    // Refresh property status when systems change
    refreshPropertyStatus()
    
    const event = createRealtimeEvent(
      EventType.PROPERTY_ALERT,
      { systemUpdate: payload.new },
      'property-monitoring'
    )
    addRealtimeEvent(event)
  }, [refreshPropertyStatus, addRealtimeEvent, createRealtimeEvent])

  const handleCommunityUpdate = useCallback((payload: any) => {
    console.log('Community update received:', payload)
    
    // Refresh community intelligence
    refreshCommunityIntel()
    
    const event = createRealtimeEvent(
      EventType.COMMUNITY_UPDATE,
      { communityData: payload.new },
      'community-network'
    )
    addRealtimeEvent(event)
  }, [refreshCommunityIntel, addRealtimeEvent, createRealtimeEvent])

  const handleAIRecommendation = useCallback((payload: any) => {
    console.log('AI recommendation received:', payload)
    
    if (payload.new && payload.eventType === 'INSERT') {
      const recommendation: AIRecommendation = payload.new
      addRecommendation(recommendation)
      
      const event = createRealtimeEvent(
        EventType.AI_RECOMMENDATION,
        { recommendation },
        'ai-orchestrator'
      )
      addRealtimeEvent(event)
    }
  }, [addRecommendation, addRealtimeEvent, createRealtimeEvent])

  const handleEmergencyBroadcast = useCallback((payload: any) => {
    console.log('Emergency broadcast received:', payload)
    
    const event = createRealtimeEvent(
      EventType.EMERGENCY_BROADCAST,
      payload,
      'emergency-system'
    )
    addRealtimeEvent(event)
  }, [addRealtimeEvent, createRealtimeEvent])

  const setupChannelSubscriptions = useCallback((config: RealtimeSubscriptionConfig) => {
    const { propertyId, enabledEventTypes = Object.values(EventType) } = config
    
    // Clear existing channels
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel)
    })
    channelsRef.current.clear()

    // Threat Assessment Channel
    if (enabledEventTypes.includes(EventType.THREAT_UPDATE)) {
      const threatChannel = supabase
        .channel(`threats:${propertyId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'threat_assessments',
          filter: `property_id=eq.${propertyId}`
        }, handleThreatUpdate)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'ai_analyses',
          filter: `entity_id=eq.${propertyId} AND entity_type=eq.property`
        }, (payload) => {
          if (payload.new?.analysis_type === 'threat_assessment') {
            handleThreatUpdate(payload)
          }
        })
        .subscribe((status) => {
          console.log('Threat channel status:', status)
          if (status === 'SUBSCRIBED') {
            channelsRef.current.set('threats', threatChannel)
          }
        })
    }

    // Intelligence Feed Channel
    if (enabledEventTypes.includes(EventType.INTELLIGENCE_FEED)) {
      const intelligenceChannel = supabase
        .channel(`intelligence:${propertyId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'intelligence_feeds',
          filter: `property_id=eq.${propertyId}`
        }, handleIntelligenceUpdate)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'environmental_data',
          filter: `property_id=eq.${propertyId}`
        }, (payload) => {
          const event = createRealtimeEvent(
            EventType.INTELLIGENCE_FEED,
            { environmentalData: payload.new },
            'environmental-monitoring'
          )
          addRealtimeEvent(event)
        })
        .subscribe((status) => {
          console.log('Intelligence channel status:', status)
          if (status === 'SUBSCRIBED') {
            channelsRef.current.set('intelligence', intelligenceChannel)
          }
        })
    }

    // Property System Monitoring Channel
    if (enabledEventTypes.includes(EventType.PROPERTY_ALERT)) {
      const propertyChannel = supabase
        .channel(`property:${propertyId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'property_systems',
          filter: `property_id=eq.${propertyId}`
        }, handlePropertySystemUpdate)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'property_alerts',
          filter: `property_id=eq.${propertyId}`
        }, (payload) => {
          const event = createRealtimeEvent(
            EventType.PROPERTY_ALERT,
            { alert: payload.new },
            'property-monitoring'
          )
          addRealtimeEvent(event)
        })
        .subscribe((status) => {
          console.log('Property channel status:', status)
          if (status === 'SUBSCRIBED') {
            channelsRef.current.set('property', propertyChannel)
          }
        })
    }

    // Community Intelligence Channel
    if (enabledEventTypes.includes(EventType.COMMUNITY_UPDATE)) {
      // Get neighborhood ID from property
      const neighborhoodId = `neighborhood-${propertyId}` // This would be dynamic
      
      const communityChannel = supabase
        .channel(`community:${neighborhoodId}`)
        .on('broadcast', { event: 'community_update' }, handleCommunityUpdate)
        .on('broadcast', { event: 'incident_report' }, (payload) => {
          const event = createRealtimeEvent(
            EventType.COMMUNITY_UPDATE,
            payload,
            'community-reports'
          )
          addRealtimeEvent(event)
        })
        .subscribe((status) => {
          console.log('Community channel status:', status)
          if (status === 'SUBSCRIBED') {
            channelsRef.current.set('community', communityChannel)
          }
        })
    }

    // AI Recommendations Channel
    if (enabledEventTypes.includes(EventType.AI_RECOMMENDATION)) {
      const aiChannel = supabase
        .channel(`ai:${propertyId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_recommendations',
          filter: `property_id=eq.${propertyId}`
        }, handleAIRecommendation)
        .subscribe((status) => {
          console.log('AI channel status:', status)
          if (status === 'SUBSCRIBED') {
            channelsRef.current.set('ai', aiChannel)
          }
        })
    }

    // Emergency Broadcast Channel
    if (enabledEventTypes.includes(EventType.EMERGENCY_BROADCAST)) {
      const emergencyChannel = supabase
        .channel('emergency:broadcast')
        .on('broadcast', { event: 'emergency_alert' }, handleEmergencyBroadcast)
        .on('broadcast', { event: 'weather_warning' }, (payload) => {
          const event = createRealtimeEvent(
            EventType.EMERGENCY_BROADCAST,
            { weatherWarning: payload },
            'weather-service'
          )
          addRealtimeEvent(event)
        })
        .subscribe((status) => {
          console.log('Emergency channel status:', status)
          if (status === 'SUBSCRIBED') {
            channelsRef.current.set('emergency', emergencyChannel)
          }
        })
    }

    // System Status Channel for connection monitoring
    const statusChannel = supabase
      .channel(`status:${propertyId}`)
      .on('broadcast', { event: 'heartbeat' }, () => {
        heartbeatRef.current = new Date()
        handleConnectionStateChange('connected')
      })
      .subscribe((status) => {
        console.log('Status channel status:', status)
        if (status === 'SUBSCRIBED') {
          channelsRef.current.set('status', statusChannel)
          handleConnectionStateChange('connected')
        }
      })

  }, [
    supabase,
    handleThreatUpdate,
    handleIntelligenceUpdate,
    handlePropertySystemUpdate,
    handleCommunityUpdate,
    handleAIRecommendation,
    handleEmergencyBroadcast,
    handleConnectionStateChange,
    createRealtimeEvent,
    addRealtimeEvent
  ])

  const attemptReconnect = useCallback(() => {
    const config = configRef.current
    if (!config) return

    const maxAttempts = config.maxReconnectAttempts || 10
    const interval = config.reconnectInterval || 5000

    if (reconnectAttemptsRef.current >= maxAttempts) {
      console.error('Max reconnection attempts reached')
      handleConnectionStateChange('disconnected')
      return
    }

    reconnectAttemptsRef.current += 1
    handleConnectionStateChange('reconnecting')

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Reconnection attempt ${reconnectAttemptsRef.current}/${maxAttempts}`)
      setupChannelSubscriptions(config)
    }, interval)

  }, [setupChannelSubscriptions, handleConnectionStateChange])

  const subscribe = useCallback((config: RealtimeSubscriptionConfig) => {
    configRef.current = config
    setupChannelSubscriptions(config)
  }, [setupChannelSubscriptions])

  const unsubscribe = useCallback(() => {
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    // Remove all channels
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel)
    })
    channelsRef.current.clear()

    // Reset state
    configRef.current = null
    reconnectAttemptsRef.current = 0
    heartbeatRef.current = null
    handleConnectionStateChange('disconnected')
  }, [supabase, handleConnectionStateChange])

  const forceReconnect = useCallback(() => {
    unsubscribe()
    if (configRef.current) {
      reconnectAttemptsRef.current = 0
      setTimeout(() => {
        if (configRef.current) {
          setupChannelSubscriptions(configRef.current)
        }
      }, 1000)
    }
  }, [unsubscribe, setupChannelSubscriptions])

  // Monitor connection health
  useEffect(() => {
    const healthCheckInterval = setInterval(() => {
      const lastHeartbeat = heartbeatRef.current
      const now = new Date()
      
      if (lastHeartbeat && (now.getTime() - lastHeartbeat.getTime()) > 30000) {
        // No heartbeat for 30 seconds, attempt reconnect
        console.warn('Connection appears stale, attempting reconnect')
        attemptReconnect()
      }
    }, 15000) // Check every 15 seconds

    return () => clearInterval(healthCheckInterval)
  }, [attemptReconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  return {
    isConnected: connectionStateRef.current === 'connected',
    isReconnecting: connectionStateRef.current === 'reconnecting',
    connectionAttempts: reconnectAttemptsRef.current,
    lastHeartbeat: heartbeatRef.current,
    subscribe,
    unsubscribe,
    forceReconnect
  }
}

// ===== SIMPLIFIED REALTIME HOOK =====

interface UseRealtimeSubscriptionOptions {
  onThreatUpdate?: (threat: ThreatAssessment) => void
  onIntelUpdate?: (intel: IntelligenceFeed) => void
  onPropertyAlert?: (alert: any) => void
  onCommunityUpdate?: (data: any) => void
  onEmergencyBroadcast?: (emergency: any) => void
  onError?: (error: Error) => void
}

export function useRealtimeSubscription(
  propertyId: string,
  options: UseRealtimeSubscriptionOptions = {}
) {
  const realtime = useSituationRoomRealtime()

  useEffect(() => {
    if (!propertyId) return

    realtime.subscribe({
      propertyId,
      enabledEventTypes: Object.values(EventType),
      reconnectInterval: 3000,
      maxReconnectAttempts: 15,
      onConnectionStateChange: (state) => {
        console.log('Realtime connection state:', state)
      },
      onError: options.onError
    })

    return () => {
      realtime.unsubscribe()
    }
  }, [propertyId, realtime, options.onError])

  return {
    isConnected: realtime.isConnected,
    isReconnecting: realtime.isReconnecting,
    forceReconnect: realtime.forceReconnect
  }
}

// ===== HELPER FUNCTIONS =====

function determinePriority(eventType: EventType, data: any): 'low' | 'medium' | 'high' | 'urgent' | 'immediate' {
  switch (eventType) {
    case EventType.EMERGENCY_BROADCAST:
      return 'immediate'
    case EventType.THREAT_UPDATE:
      if (data.threat?.severity === ThreatLevel.CRITICAL || data.threat?.severity === ThreatLevel.EMERGENCY) {
        return 'immediate'
      }
      if (data.threat?.severity === ThreatLevel.HIGH) {
        return 'urgent'
      }
      return 'high'
    case EventType.PROPERTY_ALERT:
      return 'high'
    case EventType.AI_RECOMMENDATION:
      return data.recommendation?.priority || 'medium'
    case EventType.INTELLIGENCE_FEED:
      return data.feed?.urgency || 'medium'
    default:
      return 'medium'
  }
}

function requiresUserAttention(eventType: EventType, data: any): boolean {
  switch (eventType) {
    case EventType.EMERGENCY_BROADCAST:
      return true
    case EventType.THREAT_UPDATE:
      return data.threat?.severity === ThreatLevel.HIGH || 
             data.threat?.severity === ThreatLevel.CRITICAL ||
             data.threat?.severity === ThreatLevel.EMERGENCY
    case EventType.PROPERTY_ALERT:
      return data.alert?.severity === ThreatLevel.HIGH ||
             data.alert?.severity === ThreatLevel.CRITICAL
    case EventType.AI_RECOMMENDATION:
      return data.recommendation?.priority === 'urgent' ||
             data.recommendation?.priority === 'immediate'
    default:
      return false
  }
}

function shouldAutoProcess(eventType: EventType): boolean {
  switch (eventType) {
    case EventType.THREAT_UPDATE:
    case EventType.INTELLIGENCE_FEED:
    case EventType.AI_RECOMMENDATION:
    case EventType.EMERGENCY_BROADCAST:
      return true
    default:
      return false
  }
}
/**
 * @fileMetadata
 * @purpose "Provides React hooks for managing real-time WebSocket subscriptions for the Situation Room."
 * @dependencies ["@/lib","@supabase/supabase-js","react"]
 * @owner frontend-team
 * @status stable
 */
/**
 * @fileMetadata
 * @purpose "Real-time WebSocket hooks for Situation Room monitoring"
 * @owner frontend-team
 * @dependencies ["react", "@supabase/supabase-js", "@/types/situation-room"]
 * @exports ["useSituationRoomRealtime", "useRealtimeSubscription"]
 * @complexity high
 * @tags ["situation-room", "realtime", "websockets"]
 * @status stable
 */
"use client";

import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef, useCallback, useState } from "react";
import { logger } from "@/lib/logger/production-logger";

import { useSituationRoom } from "@/lib/stores/situation-room-store";
import { EventType, ThreatLevel, ActionPriority } from "@/types/situation-room";
import type {
  ThreatAssessment,
  IntelligenceFeed,
  AIRecommendation,
  RealtimeEvent,
} from "@/types/situation-room";

interface SupabasePayload<T = Record<string, unknown>> {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new?: T;
  old?: T;
  table: string;
  schema: string;
}

interface RealtimeEventData {
  threat?: ThreatAssessment;
  feed?: IntelligenceFeed;
  recommendation?: AIRecommendation;
  alert?: { severity: ThreatLevel };
  emergency?: boolean;
  [key: string]: unknown;
}

interface RealtimeSubscriptionConfig {
  propertyId: string;
  enabledEventTypes?: EventType[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onConnectionStateChange?: (
    state: "connected" | "reconnecting" | "disconnected",
  ) => void;
  onError?: (error: Error) => void;
}

interface SituationRoomRealtimeHook {
  isConnected: boolean;
  isReconnecting: boolean;
  connectionAttempts: number;
  lastHeartbeat: Date | null;
  subscribe: (config: RealtimeSubscriptionConfig) => void;
  unsubscribe: () => void;
  forceReconnect: () => void;
}

export function useSituationRoomRealtime(): SituationRoomRealtimeHook {
  const [isClient, setIsClient] = useState(false);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const connectionStateRef = useRef<
    "connected" | "reconnecting" | "disconnected"
  >("disconnected");
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(undefined);
  const heartbeatRef = useRef<Date | null>(null);
  const configRef = useRef<RealtimeSubscriptionConfig | null>(null);

  // Initialize Supabase client only on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        supabaseRef.current = createClient();
        setIsClient(true);
      } catch (error) {
        logger.warn("Failed to initialize Supabase client:", error);
      }
    }
  }, []);

  const {
    addThreat,
    addIntelligenceFeed,
    addRealtimeEvent,
    addRecommendation,
    setConnectionStatus,
    setError,
    refreshPropertyStatus,
    refreshCommunityIntel,
  } = useSituationRoom();

  const handleConnectionStateChange = useCallback(
    (state: "connected" | "reconnecting" | "disconnected") => {
      connectionStateRef.current = state;
      setConnectionStatus(state);
      configRef.current?.onConnectionStateChange?.(state);

      if (state === "connected") {
        reconnectAttemptsRef.current = 0;
        heartbeatRef.current = new Date();
      }
    },
    [setConnectionStatus],
  );

  const handleError = useCallback(
    (error: Error) => {
      logger.error("Situation Room realtime error:", error);
      setError(error.message);
      configRef.current?.onError?.(error);
    },
    [setError],
  );

  const createRealtimeEvent = useCallback(
    (
      type: EventType,
      data: RealtimeEventData,
      source: string = "realtime",
    ): RealtimeEvent => ({
      id: `${type}-${Date.now()}-${Math.random()}`,
      type,
      timestamp: new Date(),
      data,
      priority: determinePriority(type, data),
      requiresAttention: requiresUserAttention(type, data),
      autoProcessed: shouldAutoProcess(type),
      source,
    }),
    [],
  );

  const handleThreatUpdate = useCallback(
    (payload: SupabasePayload<ThreatAssessment>) => {
      logger.info("Threat update received:", payload);

      if (payload.new && payload.eventType === "INSERT") {
        const threat: ThreatAssessment = payload.new;
        addThreat(threat);

        const event = createRealtimeEvent(
          EventType.THREAT_UPDATE,
          { threat },
          "ai-assessment",
        );
        addRealtimeEvent(event);

        // Auto-activate emergency mode for critical threats
        if (
          threat.severity === ThreatLevel.CRITICAL ||
          threat.severity === ThreatLevel.EMERGENCY
        ) {
          const emergencyEvent = createRealtimeEvent(
            EventType.EMERGENCY_BROADCAST,
            { emergency: true, threat },
            "auto-protocol",
          );
          addRealtimeEvent(emergencyEvent);
        }
      }
    },
    [addThreat, addRealtimeEvent, createRealtimeEvent],
  );

  const handleIntelligenceUpdate = useCallback(
    (payload: SupabasePayload<IntelligenceFeed>) => {
      logger.info("Intelligence feed received:", payload);

      if (payload.new && payload.eventType === "INSERT") {
        const feed: IntelligenceFeed = payload.new;
        addIntelligenceFeed(feed);

        const event = createRealtimeEvent(
          EventType.INTELLIGENCE_FEED,
          { feed },
          "intelligence-network",
        );
        addRealtimeEvent(event);
      }
    },
    [addIntelligenceFeed, addRealtimeEvent, createRealtimeEvent],
  );

  const handlePropertySystemUpdate = useCallback(
    (payload: SupabasePayload) => {
      logger.info("Property system update:", payload);

      // Refresh property status when systems change
      refreshPropertyStatus();

      const event = createRealtimeEvent(
        EventType.PROPERTY_ALERT,
        { systemUpdate: payload.new },
        "property-monitoring",
      );
      addRealtimeEvent(event);
    },
    [refreshPropertyStatus, addRealtimeEvent, createRealtimeEvent],
  );

  const handleCommunityUpdate = useCallback(
    (payload: unknown) => {
      logger.info("Community update received:", payload);

      // Refresh community intelligence
      refreshCommunityIntel();

      const event = createRealtimeEvent(
        EventType.COMMUNITY_UPDATE,
        { communityData: payload },
        "community-network",
      );
      addRealtimeEvent(event);
    },
    [refreshCommunityIntel, addRealtimeEvent, createRealtimeEvent],
  );

  const handleAIRecommendation = useCallback(
    (payload: SupabasePayload<AIRecommendation>) => {
      logger.info("AI recommendation received:", payload);

      if (payload.new && payload.eventType === "INSERT") {
        const recommendation: AIRecommendation = payload.new;
        addRecommendation(recommendation);

        const event = createRealtimeEvent(
          EventType.AI_RECOMMENDATION,
          { recommendation },
          "ai-orchestrator",
        );
        addRealtimeEvent(event);
      }
    },
    [addRecommendation, addRealtimeEvent, createRealtimeEvent],
  );

  const handleEmergencyBroadcast = useCallback(
    (payload: RealtimeEventData) => {
      logger.info("Emergency broadcast received:", payload);

      const event = createRealtimeEvent(
        EventType.EMERGENCY_BROADCAST,
        { emergency: true, ...payload },
        "emergency-system",
      );
      addRealtimeEvent(event);
    },
    [addRealtimeEvent, createRealtimeEvent],
  );

  const setupChannelSubscriptions = useCallback(
    (config: RealtimeSubscriptionConfig) => {
      const supabase = supabaseRef.current;
      if (!supabase || !isClient) {
        logger.warn(
          "Supabase client not initialized, skipping subscription setup",
        );
        return;
      }

      const { propertyId, enabledEventTypes = Object.values(EventType) } =
        config;

      // Clear existing channels
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();

      // Threat Assessment Channel
      if (enabledEventTypes.includes(EventType.THREAT_UPDATE)) {
        const threatChannel = supabase
          .channel(`threats:${propertyId}`)
          .on(
            "postgres_changes" as any,
            {
              event: "*",
              schema: "public",
              table: "threat_assessments",
              filter: `property_id=eq.${propertyId}`,
            },
            handleThreatUpdate,
          )
          .on(
            "postgres_changes" as any,
            {
              event: "*",
              schema: "public",
              table: "ai_analyses",
              filter: `entity_id=eq.${propertyId} AND entity_type=eq.property`,
            },
            (
              payload: SupabasePayload<{
                analysis_type: string;
                output_data: ThreatAssessment;
              }>,
            ) => {
              if (payload.new?.analysis_type === "threat_assessment") {
                const threatUpdatePayload: SupabasePayload<ThreatAssessment> = {
                  ...payload,
                  new: payload.new.output_data,
                  old: undefined,
                };
                handleThreatUpdate(threatUpdatePayload);
              }
            },
          )
          .subscribe((status: unknown) => {
            logger.info("Threat channel status:", status);
            if (status === "SUBSCRIBED") {
              channelsRef.current.set("threats", threatChannel);
            }
          });
      }

      // Intelligence Feed Channel
      if (enabledEventTypes.includes(EventType.INTELLIGENCE_FEED)) {
        const intelligenceChannel = supabase
          .channel(`intelligence:${propertyId}`)
          .on(
            "postgres_changes" as any,
            {
              event: "INSERT",
              schema: "public",
              table: "intelligence_feeds",
              filter: `property_id=eq.${propertyId}`,
            },
            handleIntelligenceUpdate,
          )
          .on(
            "postgres_changes" as any,
            {
              event: "INSERT",
              schema: "public",
              table: "environmental_data",
              filter: `property_id=eq.${propertyId}`,
            },
            (payload: SupabasePayload) => {
              const event = createRealtimeEvent(
                EventType.INTELLIGENCE_FEED,
                { environmentalData: payload.new },
                "environmental-monitoring",
              );
              addRealtimeEvent(event);
            },
          )
          .subscribe((status: unknown) => {
            logger.info("Intelligence channel status:", status);
            if (status === "SUBSCRIBED") {
              channelsRef.current.set("intelligence", intelligenceChannel);
            }
          });
      }

      // Property System Monitoring Channel
      if (enabledEventTypes.includes(EventType.PROPERTY_ALERT)) {
        const propertyChannel = supabase
          .channel(`property:${propertyId}`)
          .on(
            "postgres_changes" as any,
            {
              event: "*",
              schema: "public",
              table: "property_systems",
              filter: `property_id=eq.${propertyId}`,
            },
            handlePropertySystemUpdate,
          )
          .on(
            "postgres_changes" as any,
            {
              event: "*",
              schema: "public",
              table: "property_alerts",
              filter: `property_id=eq.${propertyId}`,
            },
            (payload: SupabasePayload) => {
              const event = createRealtimeEvent(
                EventType.PROPERTY_ALERT,
                { alert: payload.new as { severity: ThreatLevel } },
                "property-monitoring",
              );
              addRealtimeEvent(event);
            },
          )
          .subscribe((status: unknown) => {
            logger.info("Property channel status:", status);
            if (status === "SUBSCRIBED") {
              channelsRef.current.set("property", propertyChannel);
            }
          });
      }

      // Community Intelligence Channel
      if (enabledEventTypes.includes(EventType.COMMUNITY_UPDATE)) {
        // Get neighborhood ID from property
        const neighborhoodId = `neighborhood-${propertyId}`; // This would be dynamic

        const communityChannel = supabase
          .channel(`community:${neighborhoodId}`)
          .on("broadcast", { event: "community_update" }, handleCommunityUpdate)
          .on("broadcast", { event: "incident_report" }, (payload) => {
            const event = createRealtimeEvent(
              EventType.COMMUNITY_UPDATE,
              payload,
              "community-reports",
            );
            addRealtimeEvent(event);
          })
          .subscribe((status) => {
            logger.info("Community channel status:", status);
            if (status === "SUBSCRIBED") {
              channelsRef.current.set("community", communityChannel);
            }
          });
      }

      // AI Recommendations Channel
      if (enabledEventTypes.includes(EventType.AI_RECOMMENDATION)) {
        const aiChannel = supabase
          .channel(`ai:${propertyId}`)
          .on(
            "postgres_changes" as any,
            {
              event: "INSERT",
              schema: "public",
              table: "ai_recommendations",
              filter: `property_id=eq.${propertyId}`,
            },
            handleAIRecommendation,
          )
          .subscribe((status) => {
            logger.info("AI channel status:", status);
            if (status === "SUBSCRIBED") {
              channelsRef.current.set("ai", aiChannel);
            }
          });
      }

      // Emergency Broadcast Channel
      if (enabledEventTypes.includes(EventType.EMERGENCY_BROADCAST)) {
        const emergencyChannel = supabase
          .channel("emergency:broadcast")
          .on(
            "broadcast",
            { event: "emergency_alert" },
            handleEmergencyBroadcast,
          )
          .on("broadcast", { event: "weather_warning" }, (payload) => {
            const event = createRealtimeEvent(
              EventType.EMERGENCY_BROADCAST,
              { weatherWarning: payload },
              "weather-service",
            );
            addRealtimeEvent(event);
          })
          .subscribe((status) => {
            logger.info("Emergency channel status:", status);
            if (status === "SUBSCRIBED") {
              channelsRef.current.set("emergency", emergencyChannel);
            }
          });
      }

      // System Status Channel for connection monitoring
      const statusChannel = supabase
        .channel(`status:${propertyId}`)
        .on("broadcast", { event: "heartbeat" }, () => {
          heartbeatRef.current = new Date();
          handleConnectionStateChange("connected");
        })
        .subscribe((status) => {
          logger.info("Status channel status:", status);
          if (status === "SUBSCRIBED") {
            channelsRef.current.set("status", statusChannel);
            handleConnectionStateChange("connected");
          }
        });
    },
    [
      isClient,
      handleThreatUpdate,
      handleIntelligenceUpdate,
      handlePropertySystemUpdate,
      handleCommunityUpdate,
      handleAIRecommendation,
      handleEmergencyBroadcast,
      handleConnectionStateChange,
      createRealtimeEvent,
      addRealtimeEvent,
    ],
  );

  const attemptReconnect = useCallback(() => {
    const config = configRef.current;
    if (!config) return;

    const maxAttempts = config.maxReconnectAttempts || 10;
    const interval = config.reconnectInterval || 5000;

    if (reconnectAttemptsRef.current >= maxAttempts) {
      logger.error("Max reconnection attempts reached");
      handleConnectionStateChange("disconnected");
      return;
    }

    reconnectAttemptsRef.current += 1;
    handleConnectionStateChange("reconnecting");

    reconnectTimeoutRef.current = setTimeout(() => {
      logger.info(
        `Reconnection attempt ${reconnectAttemptsRef.current}/${maxAttempts}`,
      );
      setupChannelSubscriptions(config);
    }, interval);
  }, [setupChannelSubscriptions, handleConnectionStateChange]);

  const subscribe = useCallback(
    (config: RealtimeSubscriptionConfig) => {
      configRef.current = config;
      setupChannelSubscriptions(config);
    },
    [setupChannelSubscriptions],
  );

  const unsubscribe = useCallback(() => {
    const supabase = supabaseRef.current;

    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Remove all channels
    if (supabase) {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    }
    channelsRef.current.clear();

    // Reset state
    configRef.current = null;
    reconnectAttemptsRef.current = 0;
    heartbeatRef.current = null;
    handleConnectionStateChange("disconnected");
  }, [handleConnectionStateChange]);

  const forceReconnect = useCallback(() => {
    unsubscribe();
    if (configRef.current) {
      reconnectAttemptsRef.current = 0;
      setTimeout(() => {
        if (configRef.current) {
          setupChannelSubscriptions(configRef.current);
        }
      }, 1000);
    }
  }, [unsubscribe, setupChannelSubscriptions]);

  // Monitor connection health
  useEffect(() => {
    const healthCheckInterval = setInterval(() => {
      const lastHeartbeat = heartbeatRef.current;
      const now = new Date();

      if (lastHeartbeat && now.getTime() - lastHeartbeat.getTime() > 30000) {
        // No heartbeat for 30 seconds, attempt reconnect
        logger.warn("Connection appears stale, attempting reconnect");
        attemptReconnect();
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(healthCheckInterval);
  }, [attemptReconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    isConnected: connectionStateRef.current === "connected",
    isReconnecting: connectionStateRef.current === "reconnecting",
    connectionAttempts: reconnectAttemptsRef.current,
    lastHeartbeat: heartbeatRef.current,
    subscribe,
    unsubscribe,
    forceReconnect,
  };
}

// ===== SIMPLIFIED REALTIME HOOK =====

interface UseRealtimeSubscriptionOptions {
  onThreatUpdate?: (threat: ThreatAssessment) => void;
  onIntelUpdate?: (intel: IntelligenceFeed) => void;
  onPropertyAlert?: (alert: unknown) => void;
  onCommunityUpdate?: (data: unknown) => void;
  onEmergencyBroadcast?: (emergency: unknown) => void;
  onError?: (error: Error) => void;
}

export function useRealtimeSubscription(
  propertyId: string,
  options: UseRealtimeSubscriptionOptions = {},
) {
  const realtime = useSituationRoomRealtime();

  useEffect(() => {
    if (!propertyId) return;

    realtime.subscribe({
      propertyId,
      enabledEventTypes: Object.values(EventType),
      reconnectInterval: 3000,
      maxReconnectAttempts: 15,
      onConnectionStateChange: (state) => {
        logger.info("Realtime connection state:", state);
      },
      onError: options.onError,
    });

    return () => {
      realtime.unsubscribe();
    };
  }, [propertyId, realtime, options.onError]);

  return {
    isConnected: realtime.isConnected,
    isReconnecting: realtime.isReconnecting,
    forceReconnect: realtime.forceReconnect,
  };
}

// ===== HELPER FUNCTIONS =====

function determinePriority(
  eventType: EventType,
  data: RealtimeEventData,
): ActionPriority {
  switch (eventType) {
    case EventType.EMERGENCY_BROADCAST:
      return ActionPriority.IMMEDIATE;
    case EventType.THREAT_UPDATE:
      if (
        data.threat?.severity === ThreatLevel.CRITICAL ||
        data.threat?.severity === ThreatLevel.EMERGENCY
      ) {
        return ActionPriority.IMMEDIATE;
      }
      if (data.threat?.severity === ThreatLevel.HIGH) {
        return ActionPriority.URGENT;
      }
      return ActionPriority.HIGH;
    case EventType.PROPERTY_ALERT:
      return ActionPriority.HIGH;
    case EventType.AI_RECOMMENDATION:
      return (
        (data.recommendation?.priority as unknown as ActionPriority) ||
        ActionPriority.MEDIUM
      );
    case EventType.INTELLIGENCE_FEED:
      return (
        (data.feed?.urgency as unknown as ActionPriority) ||
        ActionPriority.MEDIUM
      );
    default:
      return ActionPriority.MEDIUM;
  }
}

function requiresUserAttention(
  eventType: EventType,
  data: RealtimeEventData,
): boolean {
  switch (eventType) {
    case EventType.EMERGENCY_BROADCAST:
      return true;
    case EventType.THREAT_UPDATE:
      return (
        data.threat?.severity === ThreatLevel.HIGH ||
        data.threat?.severity === ThreatLevel.CRITICAL ||
        data.threat?.severity === ThreatLevel.EMERGENCY
      );
    case EventType.PROPERTY_ALERT:
      return (
        data.alert?.severity === ThreatLevel.HIGH ||
        data.alert?.severity === ThreatLevel.CRITICAL
      );
    case EventType.AI_RECOMMENDATION:
      return (
        data.recommendation?.priority === "urgent" ||
        data.recommendation?.priority === "immediate"
      );
    default:
      return false;
  }
}

function shouldAutoProcess(eventType: EventType): boolean {
  switch (eventType) {
    case EventType.THREAT_UPDATE:
    case EventType.INTELLIGENCE_FEED:
    case EventType.AI_RECOMMENDATION:
    case EventType.EMERGENCY_BROADCAST:
      return true;
    default:
      return false;
  }
}

/**
 * @fileMetadata
 * @purpose "React hooks for real-time database subscriptions and live data synchronization"
 * @owner frontend-team
 * @dependencies ["react", "@/lib/database/realtime-manager", "@/lib/database/cache-manager"]
 * @exports ["useRealtime", "useRealtimeTable", "usePresence", "useBroadcast", "useRealtimeQuery"]
 * @complexity high
 * @tags ["react", "hooks", "realtime", "websockets", "subscriptions"]
 * @status stable
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getRealtimeManager,
  type RealtimeEvent,
  type RealtimeTable,
  type RealtimeEventType,
  type PresenceState,
  type BroadcastMessage,
} from "@/lib/database/realtime-manager";
import { getCacheManager } from "@/lib/database/cache-manager";
import { logger } from "@/lib/logger";

// Hook for basic real-time table subscriptions
export function useRealtime<T = any>(
  table: RealtimeTable,
  events: RealtimeEventType | RealtimeEventType[] = "*",
  options: {
    filter?: Record<string, any>;
    enabled?: boolean;
    onEvent?: (event: RealtimeEvent<T>) => void;
    onError?: (error: Error) => void;
  } = {},
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent<T> | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const subscriptionIdRef = useRef<string | null>(null);
  const realtimeManager = useRef(getRealtimeManager());

  const { enabled = true, filter, onEvent, onError } = options;

  useEffect(() => {
    if (!enabled) return;

    const subscribe = async () => {
      try {
        setError(null);
        const subscriptionId = await realtimeManager.current.subscribe(
          table,
          events,
          (event) => {
            setLastEvent(event);
            setEventCount((prev) => prev + 1);
            setIsConnected(true);
            onEvent?.(event);
          },
          {
            filter,
            errorCallback: (err) => {
              setError(err);
              setIsConnected(false);
              onError?.(err);
            },
          },
        );

        subscriptionIdRef.current = subscriptionId;
        logger.debug("Realtime subscription created", {
          table,
          subscriptionId,
        });
      } catch (err) {
        const error = err as Error;
        setError(error);
        setIsConnected(false);
        onError?.(error);
        logger.error("Realtime subscription failed", { table }, error);
      }
    };

    subscribe();

    return () => {
      if (subscriptionIdRef.current) {
        realtimeManager.current.unsubscribe(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
        setIsConnected(false);
      }
    };
  }, [table, JSON.stringify(events), JSON.stringify(filter), enabled]);

  const unsubscribe = useCallback(async () => {
    if (subscriptionIdRef.current) {
      await realtimeManager.current.unsubscribe(subscriptionIdRef.current);
      subscriptionIdRef.current = null;
      setIsConnected(false);
      setEventCount(0);
      setLastEvent(null);
    }
  }, []);

  return {
    isConnected,
    lastEvent,
    eventCount,
    error,
    unsubscribe,
  };
}

// Hook for real-time table data with automatic state management
export function useRealtimeTable<T extends { id: string }>(
  table: RealtimeTable,
  initialData: T[] = [],
  options: {
    filter?: Record<string, any>;
    enabled?: boolean;
    sortBy?: keyof T;
    sortOrder?: "asc" | "desc";
  } = {},
) {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { filter, enabled = true, sortBy, sortOrder = "desc" } = options;

  // Sort data helper
  const sortData = useCallback(
    (items: T[]) => {
      if (!sortBy) return items;

      return [...items].sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];

        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    },
    [sortBy, sortOrder],
  );

  // Handle real-time events
  const handleEvent = useCallback(
    (event: RealtimeEvent<T>) => {
      setData((currentData) => {
        let updatedData = [...currentData];

        switch (event.type) {
          case "INSERT":
            if (event.new) {
              // Avoid duplicates
              const exists = updatedData.find(
                (item) => item.id === event.new.id,
              );
              if (!exists) {
                updatedData.push(event.new);
              }
            }
            break;

          case "UPDATE":
            if (event.new) {
              const index = updatedData.findIndex(
                (item) => item.id === event.new.id,
              );
              if (index >= 0) {
                updatedData[index] = event.new;
              } else {
                // Item wasn't in our dataset, add it
                updatedData.push(event.new);
              }
            }
            break;

          case "DELETE":
            if (event.old && 'id' in event.old) {
              updatedData = updatedData.filter(
                (item) => item.id !== (event.old as { id: any }).id,
              );
            }
            break;
        }

        return sortData(updatedData);
      });
    },
    [sortData],
  );

  // Real-time subscription
  const {
    isConnected,
    eventCount,
    error: realtimeError,
  } = useRealtime<T>(table, "*", {
    filter,
    enabled,
    onEvent: handleEvent,
    onError: setError,
  });

  // Update error state
  useEffect(() => {
    if (realtimeError) {
      setError(realtimeError);
    }
  }, [realtimeError]);

  // Sort initial data
  useEffect(() => {
    setData(sortData(initialData));
  }, [initialData, sortData]);

  const addItem = useCallback(
    (item: T) => {
      setData((currentData) => sortData([...currentData, item]));
    },
    [sortData],
  );

  const updateItem = useCallback(
    (id: string, updates: Partial<T>) => {
      setData((currentData) =>
        sortData(
          currentData.map((item) =>
            item.id === id ? { ...item, ...updates } : item,
          ),
        ),
      );
    },
    [sortData],
  );

  const removeItem = useCallback((id: string) => {
    setData((currentData) => currentData.filter((item) => item.id !== id));
  }, []);

  const refetch = useCallback(async () => {
    // This would typically fetch fresh data from the server
    setIsLoading(true);
    setError(null);

    try {
      // Placeholder for actual data fetching
      // In real implementation, this would call your API
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isConnected,
    isLoading,
    error,
    eventCount,
    addItem,
    updateItem,
    removeItem,
    refetch,
  };
}

// Hook for presence functionality
export function usePresence(
  channel: string,
  presenceState?: Partial<PresenceState>,
  options: {
    enabled?: boolean;
    trackSelf?: boolean;
  } = {},
) {
  const [users, setUsers] = useState<Map<string, PresenceState>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const subscriptionIdRef = useRef<string | null>(null);
  const realtimeManager = useRef(getRealtimeManager());

  const { enabled = true, trackSelf = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const setupPresence = async () => {
      try {
        setError(null);

        // Subscribe to presence updates
        const subscriptionId =
          await realtimeManager.current.subscribeToPresence(
            channel,
            (presenceMap) => {
              setUsers(presenceMap);
              setIsConnected(true);
            },
          );

        subscriptionIdRef.current = subscriptionId;

        // Track our own presence if enabled
        if (trackSelf && presenceState) {
          await realtimeManager.current.updatePresence(channel, presenceState);
        }

        logger.debug("Presence subscription created", {
          channel,
          subscriptionId,
        });
      } catch (err) {
        const error = err as Error;
        setError(error);
        setIsConnected(false);
        logger.error("Presence subscription failed", { channel }, error);
      }
    };

    setupPresence();

    return () => {
      if (subscriptionIdRef.current) {
        realtimeManager.current.unsubscribe(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
        setIsConnected(false);
      }
    };
  }, [channel, enabled, trackSelf, JSON.stringify(presenceState)]);

  const updatePresence = useCallback(
    async (updates: Partial<PresenceState>) => {
      try {
        await realtimeManager.current.updatePresence(channel, updates);
      } catch (err) {
        setError(err as Error);
        logger.error("Presence update failed", { channel }, err as Error);
      }
    },
    [channel],
  );

  return {
    users,
    userCount: users.size,
    isConnected,
    error,
    updatePresence,
  };
}

// Hook for broadcast messaging
export function useBroadcast(
  channel: string,
  eventType: string,
  options: {
    enabled?: boolean;
    onMessage?: (message: BroadcastMessage) => void;
  } = {},
) {
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const subscriptionIdRef = useRef<string | null>(null);
  const realtimeManager = useRef(getRealtimeManager());

  const { enabled = true, onMessage } = options;

  useEffect(() => {
    if (!enabled) return;

    const setupBroadcast = async () => {
      try {
        setError(null);

        const subscriptionId =
          await realtimeManager.current.subscribeToBroadcast(
            channel,
            eventType,
            (message) => {
              setMessages((prev) => [message, ...prev].slice(0, 50)); // Keep last 50 messages
              setIsConnected(true);
              onMessage?.(message);
            },
          );

        subscriptionIdRef.current = subscriptionId;
        logger.debug("Broadcast subscription created", {
          channel,
          eventType,
          subscriptionId,
        });
      } catch (err) {
        const error = err as Error;
        setError(error);
        setIsConnected(false);
        logger.error(
          "Broadcast subscription failed",
          { channel, eventType },
          error,
        );
      }
    };

    setupBroadcast();

    return () => {
      if (subscriptionIdRef.current) {
        realtimeManager.current.unsubscribe(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
        setIsConnected(false);
      }
    };
  }, [channel, eventType, enabled]);

  const broadcast = useCallback(
    async (payload: any, userId?: string) => {
      try {
        await realtimeManager.current.broadcast(channel, eventType, payload, {
          userId,
        });
      } catch (err) {
        setError(err as Error);
        logger.error("Broadcast failed", { channel, eventType }, err as Error);
      }
    },
    [channel, eventType],
  );

  return {
    messages,
    isConnected,
    error,
    broadcast,
  };
}

// Hook for real-time queries with cache integration
export function useRealtimeQuery<T = any>(
  queryKey: string,
  queryFn: () => Promise<T>,
  table: RealtimeTable,
  options: {
    enabled?: boolean;
    cacheTime?: number;
    refetchOnReconnect?: boolean;
    invalidateOn?: RealtimeEventType[];
  } = {},
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const cacheManager = useRef(getCacheManager());
  const {
    enabled = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    refetchOnReconnect = true,
    invalidateOn = ["INSERT", "UPDATE", "DELETE"],
  } = options;

  // Fetch data with caching
  const fetchData = useCallback(
    async (fromCache = true) => {
      if (!enabled) return;

      setIsFetching(true);
      setError(null);

      try {
        // Try cache first if enabled
        if (fromCache) {
          const cached = await cacheManager.current.get<T>(queryKey);
          if (cached) {
            setData(cached);
            setLastUpdated(new Date());
            setIsFetching(false);
            return cached;
          }
        }

        // Fetch fresh data
        setIsLoading(true);
        const result = await queryFn();

        // Cache the result
        await cacheManager.current.set(queryKey, result, { ttl: cacheTime });

        setData(result);
        setLastUpdated(new Date());
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        logger.error("Query failed", { queryKey }, error);
        throw error;
      } finally {
        setIsLoading(false);
        setIsFetching(false);
      }
    },
    [queryKey, queryFn, enabled, cacheTime],
  );

  // Handle real-time invalidation
  const handleRealtimeEvent = useCallback(
    async (event: RealtimeEvent) => {
      if (invalidateOn.includes(event.type) || invalidateOn.includes("*")) {
        logger.debug("Invalidating query due to realtime event", {
          queryKey,
          event: event.type,
        });

        // Invalidate cache
        await cacheManager.current.delete(queryKey);

        // Refetch data
        await fetchData(false);
      }
    },
    [queryKey, invalidateOn, fetchData],
  );

  // Real-time subscription for invalidation
  const { isConnected } = useRealtime(table, invalidateOn, {
    enabled,
    onEvent: handleRealtimeEvent,
  });

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [fetchData, enabled]);

  // Refetch on reconnect
  useEffect(() => {
    if (isConnected && refetchOnReconnect && lastUpdated) {
      const timeSinceUpdate = Date.now() - lastUpdated.getTime();
      if (timeSinceUpdate > cacheTime) {
        fetchData(false); // Skip cache on reconnect
      }
    }
  }, [isConnected, refetchOnReconnect, lastUpdated, cacheTime, fetchData]);

  const refetch = useCallback(() => fetchData(false), [fetchData]);
  const invalidate = useCallback(async () => {
    await cacheManager.current.delete(queryKey);
    return fetchData(false);
  }, [queryKey, fetchData]);

  return {
    data,
    isLoading,
    isFetching,
    error,
    isConnected,
    lastUpdated,
    refetch,
    invalidate,
  };
}

// Utility hook for connection status across all subscriptions
export function useRealtimeStatus() {
  const [status, setStatus] = useState({
    isConnected: false,
    subscriptionCount: 0,
    totalEvents: 0,
    errors: 0,
  });

  const realtimeManager = useRef(getRealtimeManager());

  useEffect(() => {
    const updateStatus = () => {
      const info = realtimeManager.current.getSubscriptionInfo();

      setStatus({
        isConnected: info.subscriptions.some(
          (sub) => sub.status === "connected",
        ),
        subscriptionCount: info.subscriptions.length,
        totalEvents: info.totalEvents,
        errors: info.subscriptions.filter((sub) => sub.status === "error")
          .length,
      });
    };

    // Update status periodically
    const interval = setInterval(updateStatus, 5000);
    updateStatus(); // Initial update

    return () => clearInterval(interval);
  }, []);

  return status;
}

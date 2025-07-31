import { SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState, useCallback, useRef } from 'react'

import { RealtimeClient } from './client'
import type { 
  RealtimeEvent, 
  PresenceState, 
  ClaimUpdate,
  DocumentUpdate,
  NotificationEvent,
  TypingIndicator
} from './types'

// Global realtime client instance
let globalRealtimeClient: RealtimeClient | null = null

function getRealtimeClient(supabase: SupabaseClient, userId?: string): RealtimeClient {
  if (!globalRealtimeClient) {
    globalRealtimeClient = new RealtimeClient(supabase, userId)
  }
  if (userId && !globalRealtimeClient['userId']) {
    globalRealtimeClient.setUserId(userId)
  }
  return globalRealtimeClient
}

/**
 * Subscribe to real-time table changes
 */
export function useRealtimeTable<T = unknown>(
  supabase: SupabaseClient,
  table: string,
  options?: {
    onInsert?: (record: T) => void
    onUpdate?: (data: { old: T; new: T }) => void
    onDelete?: (record: T) => void
    enabled?: boolean
  }
) {
  const [events, setEvents] = useState<RealtimeEvent<T>[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef<RealtimeClient>()

  useEffect(() => {
    if (options?.enabled === false) return

    const client = getRealtimeClient(supabase)
    clientRef.current = client

    const subscription = client.subscribeToTable<T>(table, {
      onInsert: (record) => {
        setEvents(prev => [...prev, {
          type: 'INSERT',
          table,
          schema: 'public',
          old: null,
          new: record,
          timestamp: new Date().toISOString()
        }])
        options?.onInsert?.(record)
      },
      onUpdate: (data) => {
        setEvents(prev => [...prev, {
          type: 'UPDATE',
          table,
          schema: 'public',
          old: data.old,
          new: data.new,
          timestamp: new Date().toISOString()
        }])
        options?.onUpdate?.(data)
      },
      onDelete: (record) => {
        setEvents(prev => [...prev, {
          type: 'DELETE',
          table,
          schema: 'public',
          old: record,
          new: null,
          timestamp: new Date().toISOString()
        }])
        options?.onDelete?.(record)
      },
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, table, options?.enabled])

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  return { events, isConnected, clearEvents }
}

/**
 * Subscribe to specific record changes
 */
export function useRealtimeRecord<T = unknown>(
  supabase: SupabaseClient,
  table: string,
  id: string | null,
  options?: {
    onUpdate?: (data: { old: T; new: T }) => void
    onDelete?: (record: T) => void
    enabled?: boolean
  }
) {
  const [record, setRecord] = useState<T | null>(null)
  const [isDeleted, setIsDeleted] = useState(false)
  const clientRef = useRef<RealtimeClient>()

  useEffect(() => {
    if (!id || options?.enabled === false) return

    const client = getRealtimeClient(supabase)
    clientRef.current = client

    const subscription = client.subscribeToRecord<T>(table, id, {
      onUpdate: (data) => {
        setRecord(data.new)
        options?.onUpdate?.(data)
      },
      onDelete: (record) => {
        setIsDeleted(true)
        setRecord(null)
        options?.onDelete?.(record)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, table, id, options?.enabled])

  return { record, isDeleted }
}

/**
 * Subscribe to claim updates
 */
export function useClaimUpdates(
  supabase: SupabaseClient,
  claimId: string | null
) {
  const [updates, setUpdates] = useState<ClaimUpdate[]>([])
  const [latestStatus, setLatestStatus] = useState<string | null>(null)

  const { record } = useRealtimeRecord<ClaimUpdate>(
    supabase,
    'claims',
    claimId,
    {
      onUpdate: ({ new: update }) => {
        setUpdates(prev => [...prev, update])
        if (update.status) {
          setLatestStatus(update.status)
        }
      }
    }
  )

  return { updates, latestStatus, currentClaim: record }
}

/**
 * Subscribe to document processing updates
 */
export function useDocumentProcessing(
  supabase: SupabaseClient,
  documentId: string | null
) {
  const [processingStatus, setProcessingStatus] = useState<string>('pending')
  const [extractedData, setExtractedData] = useState<Record<string, unknown> | null>(null)

  useRealtimeRecord<DocumentUpdate>(
    supabase,
    'documents',
    documentId,
    {
      onUpdate: ({ new: doc }) => {
        if (doc.processing_status) {
          setProcessingStatus(doc.processing_status)
        }
        if (doc.extracted_data) {
          setExtractedData(doc.extracted_data)
        }
      }
    }
  )

  return { processingStatus, extractedData }
}

/**
 * Subscribe to user notifications
 */
export function useNotifications(
  supabase: SupabaseClient,
  userId: string | null
) {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useRealtimeTable<NotificationEvent>(
    supabase,
    'notifications',
    {
      onInsert: (notification) => {
        if (notification.user_id === userId) {
          setNotifications(prev => [notification, ...prev])
          if (!notification.read) {
            setUnreadCount(prev => prev + 1)
          }
        }
      },
      onUpdate: ({ old: oldNotif, new: newNotif }) => {
        if (newNotif.user_id === userId) {
          setNotifications(prev => 
            prev.map(n => n.id === newNotif.id ? newNotif : n)
          )
          if (!oldNotif.read && newNotif.read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
        }
      },
      enabled: !!userId
    }
  )

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
  }, [supabase])

  const markAllAsRead = useCallback(async () => {
    if (!userId) return
    
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
  }, [supabase, userId])

  return { notifications, unreadCount, markAsRead, markAllAsRead }
}

/**
 * Use presence for collaboration
 */
export function usePresence(
  supabase: SupabaseClient,
  channelName: string,
  userId: string,
  userInfo: { email: string; name?: string }
) {
  const [presenceState, setPresenceState] = useState<PresenceState>({})
  const [activeUsers, setActiveUsers] = useState<string[]>([])
  const clientRef = useRef<RealtimeClient>()

  useEffect(() => {
    const client = getRealtimeClient(supabase, userId)
    clientRef.current = client

    const channel = client.createPresenceChannel(channelName, {
      user_id: userId,
      user_email: userInfo.email,
      user_name: userInfo.name,
      online_at: new Date().toISOString()
    })

    const handleSync = (state: PresenceState) => {
      setPresenceState(state)
      setActiveUsers(Object.keys(state))
    }

    client.on(`presence:${channelName}:sync`, handleSync)

    return () => {
      client.off(`presence:${channelName}:sync`, handleSync)
      client.unsubscribe(channel.name)
    }
  }, [supabase, channelName, userId, userInfo.email, userInfo.name])

  const updateStatus = useCallback(async (status: Record<string, unknown>) => {
    if (clientRef.current) {
      await clientRef.current.updatePresence(channelName, {
        user_id: userId,
        user_email: userInfo.email,
        user_name: userInfo.name,
        ...status,
        updated_at: new Date().toISOString()
      })
    }
  }, [channelName, userId, userInfo])

  return { presenceState, activeUsers, updateStatus }
}

/**
 * Use broadcast for real-time messaging
 */
export function useBroadcast(
  supabase: SupabaseClient,
  channelName: string
) {
  const [messages, setMessages] = useState<Array<{ event: string; payload: unknown; timestamp: string }>>([])
  const clientRef = useRef<RealtimeClient>()

  useEffect(() => {
    const client = getRealtimeClient(supabase)
    clientRef.current = client

    client.createBroadcastChannel(channelName)

    const handleMessage = (event: string) => (payload: unknown) => {
      setMessages(prev => [...prev, {
        event,
        payload,
        timestamp: new Date().toISOString()
      }])
    }

    // Listen to all events on this channel
    client.on(`broadcast:${channelName}:*`, handleMessage('*'))

    return () => {
      client.off(`broadcast:${channelName}:*`)
      client.unsubscribe(channelName)
    }
  }, [supabase, channelName])

  const broadcast = useCallback(async (event: string, payload: unknown) => {
    if (clientRef.current) {
      await clientRef.current.broadcast(channelName, event, payload)
    }
  }, [channelName])

  return { messages, broadcast }
}

/**
 * Typing indicator hook for collaborative editing
 */
export function useTypingIndicator(
  supabase: SupabaseClient,
  channelName: string,
  userId: string,
  userName: string
) {
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingIndicator>>(new Map())
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const { broadcast } = useBroadcast(supabase, `typing-${channelName}`)

  useEffect(() => {
    const client = getRealtimeClient(supabase)

    const handleTyping = (indicator: TypingIndicator) => {
      if (indicator.user_id !== userId) {
        setTypingUsers(prev => {
          const updated = new Map(prev)
          if (indicator.is_typing) {
            updated.set(indicator.user_id, indicator)
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
              setTypingUsers(p => {
                const u = new Map(p)
                u.delete(indicator.user_id)
                return u
              })
            }, 3000)
          } else {
            updated.delete(indicator.user_id)
          }
          return updated
        })
      }
    }

    client.on(`broadcast:typing-${channelName}:typing`, handleTyping)

    return () => {
      client.off(`broadcast:typing-${channelName}:typing`, handleTyping)
    }
  }, [supabase, channelName, userId])

  const setTyping = useCallback((isTyping: boolean, field?: string) => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    broadcast('typing', {
      user_id: userId,
      user_name: userName,
      is_typing: isTyping,
      field
    })

    // Auto-stop typing after 2 seconds
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        broadcast('typing', {
          user_id: userId,
          user_name: userName,
          is_typing: false,
          field
        })
      }, 2000)
    }
  }, [broadcast, userId, userName])

  return { typingUsers: Array.from(typingUsers.values()), setTyping }
}

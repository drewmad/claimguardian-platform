import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type ChangeType = 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimeEvent<T = any> {
  type: ChangeType
  table: string
  schema: string
  old: T | null
  new: T | null
  timestamp: string
}

export interface PresenceState {
  [key: string]: any
}

export interface BroadcastMessage {
  event: string
  payload: any
  type: 'broadcast'
}

export interface ChannelConfig {
  name: string
  onInsert?: (payload: any) => void
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

export interface RealtimeSubscription {
  channel: RealtimeChannel
  unsubscribe: () => void
}

export interface ClaimUpdate {
  id: string
  status?: string
  updated_at: string
  updated_by?: string
  notes?: string
}

export interface PropertyUpdate {
  id: string
  updated_at: string
  updated_by?: string
  fields_updated?: string[]
}

export interface DocumentUpdate {
  id: string
  processing_status?: string
  processed_at?: string
  extracted_data?: any
}

export interface NotificationEvent {
  id: string
  user_id: string
  type: 'claim_update' | 'document_processed' | 'payment_received' | 'message_received'
  title: string
  message: string
  data?: any
  read: boolean
  created_at: string
}

export interface CollaborationEvent {
  user_id: string
  user_email: string
  action: 'viewing' | 'editing' | 'left'
  resource_type: 'claim' | 'property' | 'document'
  resource_id: string
  timestamp: string
}

export interface TypingIndicator {
  user_id: string
  user_name: string
  is_typing: boolean
  field?: string
}
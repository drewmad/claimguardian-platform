/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
import type { RealtimeChannel } from '@supabase/supabase-js'

export type ChangeType = 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimeEvent<T = unknown> {
  type: ChangeType
  table: string
  schema: string
  old: T | null
  new: T | null
  timestamp: string
}

export interface PresenceState {
  [key: string]: unknown
}

export interface BroadcastMessage {
  event: string
  payload: unknown
  type: 'broadcast'
}

export interface ChannelConfig {
  name: string
  onInsert?: (payload: unknown) => void
  onUpdate?: (payload: unknown) => void
  onDelete?: (payload: unknown) => void
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
  extracted_data?: Record<string, unknown>
}

export interface NotificationEvent {
  id: string
  user_id: string
  type: 'claim_update' | 'document_processed' | 'payment_received' | 'message_received'
  title: string
  message: string
  data?: Record<string, unknown>
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

export interface RealtimeError {
  message: string
  code?: string
}

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
// Core client
export { RealtimeClient } from './client'

// React hooks
export {
  useRealtimeTable,
  useRealtimeRecord,
  useClaimUpdates,
  useDocumentProcessing,
  useNotifications,
  usePresence,
  useBroadcast,
  useTypingIndicator
} from './hooks'

// Channel utilities
export { channels, channelConfigs, realtimeEvents, parseChannelName } from './channels'

// Types
export * from './types'

// Re-export Supabase realtime types for convenience
export type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  RealtimePresenceState
} from '@supabase/supabase-js'
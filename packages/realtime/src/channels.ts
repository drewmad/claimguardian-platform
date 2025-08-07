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
/**
 * Channel name generators for consistent naming across the app
 */

export const channels = {
  // Table-based channels
  claims: () => "table-claims",
  properties: () => "table-properties",
  documents: () => "table-documents",
  notifications: () => "table-notifications",

  // Record-specific channels
  claim: (id: string) => `record-claims-${id}`,
  property: (id: string) => `record-properties-${id}`,
  document: (id: string) => `record-documents-${id}`,

  // Collaboration channels
  claimCollaboration: (claimId: string) => `collab-claim-${claimId}`,
  propertyCollaboration: (propertyId: string) =>
    `collab-property-${propertyId}`,

  // User-specific channels
  userNotifications: (userId: string) => `user-notifications-${userId}`,
  userActivity: (userId: string) => `user-activity-${userId}`,

  // Organization channels
  orgUpdates: (orgId: string) => `org-updates-${orgId}`,
  orgPresence: (orgId: string) => `org-presence-${orgId}`,

  // Feature-specific channels
  documentProcessing: () => "document-processing",
  aiUpdates: () => "ai-updates",
  systemAlerts: () => "system-alerts",

  // Chat/messaging channels
  chat: (conversationId: string) => `chat-${conversationId}`,
  support: (ticketId: string) => `support-${ticketId}`,

  // Typing indicators
  typingClaim: (claimId: string) => `typing-claim-${claimId}`,
  typingChat: (conversationId: string) => `typing-chat-${conversationId}`,

  // Live data channels
  analytics: () => "analytics-live",
  metrics: () => "metrics-live",

  // Admin channels
  adminBroadcast: () => "admin-broadcast",
  systemStatus: () => "system-status",
};

/**
 * Channel configuration presets
 */
export const channelConfigs = {
  // High-frequency updates
  highFrequency: {
    params: {
      config: {
        broadcast: { self: true },
        presence: { key: "" },
      },
    },
  },

  // Low-frequency updates
  lowFrequency: {
    params: {
      config: {
        broadcast: { self: false },
        presence: { key: "" },
      },
    },
  },

  // Presence-only channels
  presenceOnly: {
    params: {
      config: {
        broadcast: { self: false },
        presence: { key: "" },
      },
    },
  },

  // Broadcast-only channels
  broadcastOnly: {
    params: {
      config: {
        broadcast: { self: true },
        presence: false,
      },
    },
  },
};

/**
 * Event names for consistency
 */
export const realtimeEvents = {
  // Database events
  INSERT: "INSERT",
  UPDATE: "UPDATE",
  DELETE: "DELETE",

  // Presence events
  PRESENCE_SYNC: "sync",
  PRESENCE_JOIN: "join",
  PRESENCE_LEAVE: "leave",

  // Broadcast events
  MESSAGE: "message",
  TYPING: "typing",
  NOTIFICATION: "notification",
  BROADCAST_UPDATE: "update",
  ALERT: "alert",

  // Custom events
  CLAIM_STATUS_CHANGE: "claim_status_change",
  DOCUMENT_PROCESSED: "document_processed",
  PAYMENT_RECEIVED: "payment_received",
  USER_ACTION: "user_action",
  SYSTEM_ALERT: "system_alert",

  // Collaboration events
  USER_JOINED: "user_joined",
  USER_LEFT: "user_left",
  USER_TYPING: "user_typing",
  CONTENT_CHANGED: "content_changed",
  CURSOR_MOVED: "cursor_moved",
  SELECTION_CHANGED: "selection_changed",
};

/**
 * Helper to parse channel names
 */
export function parseChannelName(channel: string): {
  type: string;
  resource?: string;
  id?: string;
} {
  const parts = channel.split("-");

  if (parts[0] === "table") {
    return { type: "table", resource: parts[1] };
  }

  if (parts[0] === "record") {
    return { type: "record", resource: parts[1], id: parts.slice(2).join("-") };
  }

  if (parts[0] === "collab") {
    return {
      type: "collaboration",
      resource: parts[1],
      id: parts.slice(2).join("-"),
    };
  }

  if (parts[0] === "user") {
    return { type: "user", resource: parts[1], id: parts.slice(2).join("-") };
  }

  return { type: "custom", resource: channel };
}

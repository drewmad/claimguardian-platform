/**
 * @fileMetadata
 * @owner backend-team
 * @purpose "Type definitions for permissions and subscription system"
 * @dependencies []
 * @status stable
 */

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string;
  resource: string | null;
  action: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  stripe_product_id: string | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TierPermission {
  id: string;
  tier_id: string;
  permission_id: string;
  limit_value: number | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Relations
  permission?: Permission;
  tier?: SubscriptionTier;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  tier_id: string;
  stripe_subscription_id: string | null;
  status: "active" | "canceled" | "past_due" | "trialing";
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  tier?: SubscriptionTier;
}

export interface UserPermission {
  permission_name: string;
  category: string;
  resource: string | null;
  action: string;
  limit_value: number | null;
  metadata: Record<string, any>;
}

// Permission categories
export const PERMISSION_CATEGORIES = {
  PROPERTIES: "properties",
  AI_TOOLS: "ai_tools",
  CLAIMS: "claims",
  DOCUMENTS: "documents",
  REPORTS: "reports",
  FEATURES: "features",
} as const;

// Permission actions
export const PERMISSION_ACTIONS = {
  VIEW: "view",
  CREATE: "create",
  EDIT: "edit",
  DELETE: "delete",
  EXPORT: "export",
  USE: "use",
  UPLOAD: "upload",
  SHARE: "share",
  ACCESS: "access",
  PRIORITY: "priority",
  CUSTOMIZE: "customize",
} as const;

// Subscription tier names
export const SUBSCRIPTION_TIERS = {
  FREE: "free",
  HOMEOWNER_ESSENTIALS: "homeowner_essentials",
  LANDLORD_PRO: "landlord_pro",
  ENTERPRISE: "enterprise",
} as const;

// AI Tools permissions
export const AI_TOOLS_PERMISSIONS = {
  DAMAGE_ANALYZER: "ai.damage_analyzer",
  POLICY_CHAT: "ai.policy_chat",
  INVENTORY_SCANNER: "ai.inventory_scanner",
  CLAIM_ASSISTANT: "ai.claim_assistant",
  DOCUMENT_GENERATOR: "ai.document_generator",
  SETTLEMENT_ANALYZER: "ai.settlement_analyzer",
  COMMUNICATION_HELPER: "ai.communication_helper",
  EVIDENCE_ORGANIZER: "ai.evidence_organizer",
  MODEL_3D_GENERATOR: "ai.3d_model_generator",
} as const;

export type PermissionCategory =
  (typeof PERMISSION_CATEGORIES)[keyof typeof PERMISSION_CATEGORIES];
export type PermissionAction =
  (typeof PERMISSION_ACTIONS)[keyof typeof PERMISSION_ACTIONS];
export type SubscriptionTierName =
  (typeof SUBSCRIPTION_TIERS)[keyof typeof SUBSCRIPTION_TIERS];
export type AIToolPermission =
  (typeof AI_TOOLS_PERMISSIONS)[keyof typeof AI_TOOLS_PERMISSIONS];

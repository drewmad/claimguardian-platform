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
// Manual TypeScript types for multi-tenant architecture
// This file provides types for the multi-tenant system without relying on auto-generation

export interface EnterpriseOrganizationRow {
  id: string;
  organization_name: string;
  organization_code: string;
  domain: string;
  additional_domains: string[] | null;
  subscription_tier: "standard" | "professional" | "enterprise" | "custom";
  billing_cycle: "monthly" | "quarterly" | "annual";
  subscription_status: "trial" | "active" | "suspended" | "cancelled";
  user_limit: number;
  property_limit: number;
  claim_limit: number;
  ai_request_limit: number;
  storage_limit_gb: number;
  current_users: number;
  current_properties: number;
  current_claims: number;
  current_ai_requests: number;
  current_storage_gb: number;
  configuration: Record<string, any>;
  feature_flags: Record<string, boolean>;
  branding: Record<string, any>;
  integrations: Record<string, any>;
  allowed_states: string[];
  primary_state: string;
  primary_contact_email: string;
  billing_email: string | null;
  technical_contact_email: string | null;
  phone: string | null;
  address: Record<string, any> | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  subscription_start_date: string | null;
  next_billing_date: string | null;
  sso_enabled: boolean;
  sso_provider: string | null;
  sso_configuration: Record<string, any> | null;
  require_2fa: boolean;
  ip_whitelist: string[] | null;
  data_region: string;
  compliance_requirements: string[];
  data_retention_policy: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  last_modified_by: string | null;
  notes: string | null;
}

export interface OrganizationUserRow {
  id: string;
  user_id: string;
  organization_id: string;
  role: "owner" | "admin" | "manager" | "member" | "viewer";
  permissions: Record<string, boolean>;
  status: "invited" | "active" | "suspended" | "deactivated";
  invitation_token: string | null;
  invitation_expires_at: string | null;
  last_login_at: string | null;
  login_count: number;
  last_activity_at: string | null;
  joined_at: string;
  invited_by: string | null;
  deactivated_at: string | null;
  deactivated_by: string | null;
}

export interface OrganizationBillingRow {
  id: string;
  organization_id: string;
  billing_period_start: string;
  billing_period_end: string;
  users_count: number;
  properties_count: number;
  claims_count: number;
  ai_requests_count: number;
  storage_gb: number;
  base_cost: number;
  overage_costs: Record<string, number>;
  total_cost: number;
  invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  paid_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationCustomizationRow {
  id: string;
  organization_id: string;
  theme: Record<string, any>;
  logo_url: string | null;
  favicon_url: string | null;
  custom_css: string | null;
  enabled_features: string[];
  disabled_features: string[];
  feature_limits: Record<string, number>;
  claim_workflow: Record<string, any>;
  approval_workflows: Record<string, any>;
  notification_preferences: Record<string, any>;
  webhook_urls: Record<string, string>;
  api_keys: Record<string, string>;
  external_integrations: Record<string, any>;
  security_policies: Record<string, any>;
  data_export_settings: Record<string, any>;
  audit_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface OrganizationAuditLogRow {
  id: string;
  organization_id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  timestamp: string;
  metadata: Record<string, any>;
}

// Tenant-specific table types (these exist in org_* schemas)
export interface TenantPropertyRow {
  id: string;
  user_id: string;
  organization_id: string;
  property_name: string;
  property_type: string;
  address: Record<string, any>;
  property_details: Record<string, any>;
  images: string[] | null;
  value: number | null;
  square_footage: number | null;
  year_built: number | null;
  insurability_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface TenantClaimRow {
  id: string;
  organization_id: string;
  property_id: string;
  user_id: string;
  claim_number: string;
  claim_type: string;
  status: string;
  incident_date: string;
  reported_date: string;
  estimated_amount: number | null;
  settled_amount: number | null;
  description: string | null;
  damage_categories: string[] | null;
  documents: string[] | null;
  communications: Record<string, any>[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TenantPolicyRow {
  id: string;
  organization_id: string;
  property_id: string;
  user_id: string;
  policy_number: string;
  carrier_name: string;
  policy_type: string;
  coverage_amount: number | null;
  deductible: number | null;
  premium_amount: number | null;
  effective_date: string;
  expiration_date: string;
  status: string;
  policy_details: Record<string, any>;
  documents: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface TenantAIUsageLogRow {
  id: string;
  organization_id: string;
  user_id: string;
  feature_id: string;
  model_name: string | null;
  provider: string | null;
  request_tokens: number | null;
  response_tokens: number | null;
  cost: number | null;
  success: boolean | null;
  created_at: string;
}

// Database function return types
export interface ExpansionReadinessResult {
  state_code: string;
  readiness_score: number;
  regulatory_score: number;
  technical_score: number;
  market_score: number;
  operational_score: number;
  blockers: string[];
  recommendations: string[];
}

// Utility types for the multi-tenant system
export type SubscriptionTier =
  | "standard"
  | "professional"
  | "enterprise"
  | "custom";
export type BillingCycle = "monthly" | "quarterly" | "annual";
export type SubscriptionStatus = "trial" | "active" | "suspended" | "cancelled";
export type UserRole = "owner" | "admin" | "manager" | "member" | "viewer";
export type UserStatus = "invited" | "active" | "suspended" | "deactivated";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

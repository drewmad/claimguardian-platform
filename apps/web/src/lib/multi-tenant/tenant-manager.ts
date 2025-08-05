/**
 * @fileMetadata
 * @purpose "Enterprise multi-tenant architecture for ClaimGuardian"
 * @dependencies ["@/lib"]
 * @owner enterprise-team
 * @status stable
 */

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

// Specific configuration types
interface OrganizationConfiguration {
  customFields?: string[]
  allowedFileTypes?: string[]
  maxFileSize?: number
  timezone?: string
  locale?: string
  notifications?: {
    email?: boolean
    sms?: boolean
    push?: boolean
  }
}

interface OrganizationBranding {
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  customCss?: string
  faviconUrl?: string
}

interface OrganizationIntegrations {
  stripe?: { accountId: string; webhookSecret: string }
  mailgun?: { apiKey: string; domain: string }
  twilio?: { accountSid: string; authToken: string }
  slack?: { webhookUrl: string }
}

interface OrganizationAddress {
  street: string
  city: string
  state: string
  zipCode: string
  country?: string
}

interface SSOConfiguration {
  provider: 'oauth' | 'saml' | 'okta' | 'azure'
  clientId?: string
  clientSecret?: string
  domain?: string
  callbackUrl?: string
}

interface DataRetentionPolicy {
  claimsRetentionDays: number
  documentsRetentionDays: number
  auditLogsRetentionDays: number
  personalDataRetentionDays: number
  backupRetentionDays: number
}

interface ClaimWorkflow {
  stages: Array<{
    id: string
    name: string
    required: boolean
    approvalRequired: boolean
  }>
  notifications: {
    stageChange: boolean
    approval: boolean
    completion: boolean
  }
}

interface ApprovalWorkflows {
  claimApproval: {
    threshold: number
    approvers: string[]
    autoApprove: boolean
  }
  documentApproval: {
    required: boolean
    approvers: string[]
  }
}

interface NotificationPreferences {
  email: {
    enabled: boolean
    frequency: 'immediate' | 'daily' | 'weekly'
  }
  sms: {
    enabled: boolean
    urgentOnly: boolean
  }
  push: {
    enabled: boolean
    categories: string[]
  }
}

interface SecurityPolicies {
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireNumbers: boolean
    requireSymbols: boolean
  }
  sessionTimeout: number
  maxFailedAttempts: number
  lockoutDuration: number
}

interface DataExportSettings {
  allowUserExport: boolean
  exportFormats: string[]
  retentionAfterExport: number
  approvalRequired: boolean
}

interface AuditSettings {
  enabledEvents: string[]
  retentionDays: number
  realTimeNotifications: boolean
  webhookUrl?: string
}

interface OrganizationTheme {
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  backgroundColor?: string
  textColor?: string
  font?: string
}

interface ContactInfo {
  name: string
  email: string
  phone?: string
  role: string
}

// Database row types (match actual database schema)
interface OrganizationRow {
  id: string
  organization_name: string
  organization_code: string
  domain: string
  additional_domains: string[]
  subscription_tier: 'standard' | 'professional' | 'enterprise' | 'custom'
  billing_cycle: 'monthly' | 'quarterly' | 'annual'
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled'
  user_limit: number
  property_limit: number
  claim_limit: number
  ai_request_limit: number
  storage_limit_gb: number
  current_users: number
  current_properties: number
  current_claims: number
  current_ai_requests: number
  current_storage_gb: number
  feature_flags: Record<string, boolean>
  created_at: string
  updated_at: string
  configuration?: OrganizationConfiguration
  branding?: OrganizationBranding
  integrations?: OrganizationIntegrations
  allowed_states?: string[]
  primary_state?: string
  primary_contact_email?: string
  billing_email?: string
  technical_contact_email?: string
  phone?: string
  address?: OrganizationAddress
  sso_enabled?: boolean
  sso_provider?: string
  sso_configuration?: SSOConfiguration
  require_2fa?: boolean
  ip_whitelist?: string[]
  data_region?: string
  compliance_requirements?: string[]
  data_retention_policy?: DataRetentionPolicy
  created_by?: string
  last_modified_by?: string
  notes?: string
}

interface OrganizationUserRow {
  id: string
  user_id: string
  organization_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  permissions: string[]
  department?: string
  cost_center?: string
  join_date: string
  last_active: string
  status: 'active' | 'suspended' | 'invited'
  deactivated_by?: string
  invitation_token?: string
  invitation_expires_at?: string
  last_login_at?: string
  login_count?: number
  last_activity_at?: string
  joined_at: string
  invited_by?: string
  deactivated_at?: string
}

interface TenantCustomizationRow {
  id: string
  organization_id: string
  theme: OrganizationTheme
  logo_url?: string
  favicon_url?: string
  custom_css?: string
  enabled_features: string[]
  disabled_features?: string[]
  feature_limits?: Record<string, number>
  claim_workflow?: ClaimWorkflow
  approval_workflows?: ApprovalWorkflows
  notification_preferences?: NotificationPreferences
  webhook_urls?: Record<string, string>
  api_keys?: Record<string, string>
  external_integrations?: OrganizationIntegrations
  security_policies?: SecurityPolicies
  data_export_settings?: DataExportSettings
  audit_settings?: AuditSettings
  branding_name?: string
  support_email?: string
  contact_info?: ContactInfo
  created_at: string
  created_by?: string
  updated_at: string
}

interface TenantUsageInfoRow {
  organization_id: string
  billing_period_start: string
  billing_period_end: string
  monthly_fee: number
  usage_charges: number
  total_amount: number
  users_count?: number
  properties_count?: number
  claims_count?: number
  ai_requests_count?: number
  storage_gb?: number
  base_cost?: number
  overage_costs?: number
  total_cost?: number
  invoice_status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  invoice_number?: string
  invoice_date?: string
  due_date?: string
  paid_date?: string
}

interface EnterpriseOrganization {
  id: string
  organizationName: string
  organizationCode: string
  domain: string
  additionalDomains: string[]
  
  // Subscription details
  subscriptionTier: 'standard' | 'professional' | 'enterprise' | 'custom'
  billingCycle: 'monthly' | 'quarterly' | 'annual'
  subscriptionStatus: 'trial' | 'active' | 'suspended' | 'cancelled'
  
  // Limits and quotas
  userLimit: number
  propertyLimit: number
  claimLimit: number
  aiRequestLimit: number
  storageLimitGb: number
  
  // Current usage
  currentUsers: number
  currentProperties: number
  currentClaims: number
  currentAiRequests: number
  currentStorageGb: number
  
  // Configuration
  configuration: OrganizationConfiguration
  featureFlags: Record<string, boolean>
  branding: OrganizationBranding
  integrations: OrganizationIntegrations
  
  // Geographic scope
  allowedStates: string[]
  primaryState: string
  
  // Contact information
  primaryContactEmail: string
  billingEmail?: string
  technicalContactEmail?: string
  phone?: string
  address?: OrganizationAddress
  
  // Security settings
  ssoEnabled: boolean
  ssoProvider?: string
  ssoConfiguration?: SSOConfiguration
  require2fa: boolean
  ipWhitelist?: string[]
  
  // Compliance
  dataRegion: string
  complianceRequirements: string[]
  dataRetentionPolicy: DataRetentionPolicy
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastModifiedBy?: string
  notes?: string
}

interface OrganizationUser {
  id: string
  userId: string
  organizationId: string
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer'
  permissions: Record<string, boolean>
  status: 'invited' | 'active' | 'suspended' | 'deactivated'
  invitationToken?: string
  invitationExpiresAt?: Date
  lastLoginAt?: Date
  loginCount: number
  lastActivityAt?: Date
  joinedAt: Date
  invitedBy?: string
  deactivatedAt?: Date
  deactivatedBy?: string
}

interface TenantCustomization {
  id: string
  organizationId: string
  
  // UI Customization
  theme: OrganizationTheme
  logoUrl?: string
  faviconUrl?: string
  customCss?: string
  
  // Feature Configuration
  enabledFeatures: string[]
  disabledFeatures: string[]
  featureLimits: Record<string, number>
  
  // Workflow Customization
  claimWorkflow: ClaimWorkflow
  approvalWorkflows: ApprovalWorkflows
  notificationPreferences: NotificationPreferences
  
  // Integration Settings
  webhookUrls: Record<string, string>
  apiKeys: Record<string, string> // Encrypted
  externalIntegrations: OrganizationIntegrations
  
  // Compliance and Security
  securityPolicies: SecurityPolicies
  dataExportSettings: DataExportSettings
  auditSettings: AuditSettings
  
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

interface TenantUsageInfo {
  organizationId: string
  billingPeriodStart: Date
  billingPeriodEnd: Date
  
  // Usage counts
  usersCount: number
  propertiesCount: number
  claimsCount: number
  aiRequestsCount: number
  storageGb: number
  
  // Costs
  baseCost: number
  overageCosts: Record<string, number>
  totalCost: number
  
  // Invoice details
  invoiceStatus: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  invoiceNumber?: string
  invoiceDate?: Date
  dueDate?: Date
  paidDate?: Date
}

// Define allowed query structure for tenant queries
interface TenantQuery {
  select?: string
  match?: Record<string, string | number | boolean>
  order?: {
    column: string
    ascending: boolean
  }
  limit?: number
}

class TenantManager {
  private supabase: SupabaseClient | null = null
  private organizationCache = new Map<string, EnterpriseOrganization>()
  private userOrgCache = new Map<string, string>() // userId -> organizationId
  private cacheExpiry = 15 * 60 * 1000 // 15 minutes

  constructor() {
    this.initializeSupabase()
  }

  private async initializeSupabase(): Promise<void> {
    this.supabase = await createClient()
  }

  /**
   * Get organization by code (subdomain)
   */
  async getOrganizationByCode(orgCode: string): Promise<EnterpriseOrganization | null> {
    const cacheKey = `org_${orgCode}`
    const cached = this.organizationCache.get(cacheKey)
    if (cached) return cached

    try {
      if (!this.supabase) await this.initializeSupabase()

      const { data, error } = await this.supabase!
        .from('enterprise_organizations')
        .select('*')
        .eq('organization_code', orgCode)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      const organization = this.parseOrganization(data)
      
      // Cache the result
      this.organizationCache.set(cacheKey, organization)
      setTimeout(() => this.organizationCache.delete(cacheKey), this.cacheExpiry)

      return organization
    } catch (error) {
      console.error(`Failed to get organization by code ${orgCode}:`, error)
      return null
    }
  }

  /**
   * Get organization by domain
   */
  async getOrganizationByDomain(domain: string): Promise<EnterpriseOrganization | null> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { data, error } = await this.supabase!
        .from('enterprise_organizations')
        .select('*')
        .or(`domain.eq.${domain},additional_domains.cs.{${domain}}`)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return this.parseOrganization(data)
    } catch (error) {
      console.error(`Failed to get organization by domain ${domain}:`, error)
      return null
    }
  }

  /**
   * Get user's current organization
   */
  async getUserOrganization(userId: string): Promise<EnterpriseOrganization | null> {
    const cacheKey = `user_org_${userId}`
    const cachedOrgId = this.userOrgCache.get(cacheKey)
    
    if (cachedOrgId) {
      return this.getOrganizationById(cachedOrgId)
    }

    try {
      if (!this.supabase) await this.initializeSupabase()

      const { data, error } = await this.supabase!
        .from('organization_users')
        .select(`
          organization_id,
          enterprise_organizations (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      const organization = this.parseOrganization(data.enterprise_organizations)
      
      // Cache user -> organization mapping
      this.userOrgCache.set(cacheKey, organization.id)
      setTimeout(() => this.userOrgCache.delete(cacheKey), this.cacheExpiry)

      return organization
    } catch (error) {
      console.error(`Failed to get user organization for ${userId}:`, error)
      return null
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(orgId: string): Promise<EnterpriseOrganization | null> {
    const cacheKey = `org_id_${orgId}`
    const cached = this.organizationCache.get(cacheKey)
    if (cached) return cached

    try {
      if (!this.supabase) await this.initializeSupabase()

      const { data, error } = await this.supabase!
        .from('enterprise_organizations')
        .select('*')
        .eq('id', orgId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      const organization = this.parseOrganization(data)
      
      // Cache the result
      this.organizationCache.set(cacheKey, organization)
      setTimeout(() => this.organizationCache.delete(cacheKey), this.cacheExpiry)

      return organization
    } catch (error) {
      console.error(`Failed to get organization by ID ${orgId}:`, error)
      return null
    }
  }

  /**
   * Get organization users
   */
  async getOrganizationUsers(orgId: string): Promise<OrganizationUser[]> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { data, error } = await this.supabase!
        .from('organization_users')
        .select(`
          *,
          auth.users (
            email,
            created_at
          )
        `)
        .eq('organization_id', orgId)
        .order('joined_at', { ascending: false })

      if (error) throw error

      return (data || []).map(this.parseOrganizationUser)
    } catch (error) {
      console.error(`Failed to get organization users for ${orgId}:`, error)
      return []
    }
  }

  /**
   * Add user to organization
   */
  async addUserToOrganization(
    orgId: string,
    userEmail: string,
    role: OrganizationUser['role'] = 'member',
    invitedBy: string
  ): Promise<{ success: boolean; userId?: string; invitationToken?: string }> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      // Check organization limits
      const canAddUser = await this.checkOrganizationLimit(orgId, 'users')
      if (!canAddUser) {
        return { success: false }
      }

      // Check if user exists
      const { data: existingUser, error: userError } = await this.supabase!
        .from('auth.users')
        .select('id')
        .eq('email', userEmail)
        .single()

      let userId: string | undefined
      let invitationToken: string | undefined

      if (existingUser) {
        userId = existingUser.id
      } else {
        // Generate invitation token for new users
        invitationToken = crypto.randomUUID()
      }

      // Add to organization_users
      const { error: insertError } = await this.supabase!
        .from('organization_users')
        .insert({
          user_id: userId,
          organization_id: orgId,
          role,
          status: existingUser ? 'active' : 'invited',
          invitation_token: invitationToken,
          invitation_expires_at: invitationToken ? 
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null, // 7 days
          invited_by: invitedBy
        })

      if (insertError) throw insertError

      // Update organization usage
      await this.updateOrganizationUsage(orgId, 'users', 1)

      // Clear cache
      this.clearOrganizationCache(orgId)

      return { success: true, userId, invitationToken }
    } catch (error) {
      console.error('Failed to add user to organization:', error)
      return { success: false }
    }
  }

  /**
   * Update user role in organization
   */
  async updateUserRole(
    orgId: string,
    userId: string,
    newRole: OrganizationUser['role'],
    updatedBy: string
  ): Promise<boolean> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { error } = await this.supabase!
        .from('organization_users')
        .update({
          role: newRole,
          last_activity_at: new Date().toISOString()
        })
        .eq('organization_id', orgId)
        .eq('user_id', userId)

      if (error) throw error

      // Log audit event
      await this.logAuditEvent(orgId, updatedBy, 'update', 'user', userId, {
        role: newRole
      })

      return true
    } catch (error) {
      console.error('Failed to update user role:', error)
      return false
    }
  }

  /**
   * Remove user from organization
   */
  async removeUserFromOrganization(
    orgId: string,
    userId: string,
    removedBy: string
  ): Promise<boolean> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { error } = await this.supabase!
        .from('organization_users')
        .update({
          status: 'deactivated',
          deactivated_at: new Date().toISOString(),
          deactivated_by: removedBy
        })
        .eq('organization_id', orgId)
        .eq('user_id', userId)

      if (error) throw error

      // Update organization usage
      await this.updateOrganizationUsage(orgId, 'users', -1)

      // Log audit event
      await this.logAuditEvent(orgId, removedBy, 'delete', 'user', userId)

      // Clear cache
      this.clearOrganizationCache(orgId)

      return true
    } catch (error) {
      console.error('Failed to remove user from organization:', error)
      return false
    }
  }

  /**
   * Get organization customizations
   */
  async getOrganizationCustomizations(orgId: string): Promise<TenantCustomization | null> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { data, error } = await this.supabase!
        .from('organization_customizations')
        .select('*')
        .eq('organization_id', orgId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return this.parseCustomization(data)
    } catch (error) {
      console.error('Failed to get organization customizations:', error)
      return null
    }
  }

  /**
   * Update organization customizations
   */
  async updateOrganizationCustomizations(
    orgId: string,
    customizations: Partial<TenantCustomization>,
    updatedBy: string
  ): Promise<boolean> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { error } = await this.supabase!
        .from('organization_customizations')
        .upsert({
          organization_id: orgId,
          ...this.serializeCustomization(customizations),
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Log audit event
      await this.logAuditEvent(orgId, updatedBy, 'update', 'customizations', orgId, customizations)

      return true
    } catch (error) {
      console.error('Failed to update organization customizations:', error)
      return false
    }
  }

  /**
   * Get organization usage information
   */
  async getOrganizationUsage(orgId: string, month?: Date): Promise<TenantUsageInfo | null> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const queryMonth = month || new Date()
      const startOfMonth = new Date(queryMonth.getFullYear(), queryMonth.getMonth(), 1)
      const endOfMonth = new Date(queryMonth.getFullYear(), queryMonth.getMonth() + 1, 0)

      const { data, error } = await this.supabase!
        .from('organization_billing')
        .select('*')
        .eq('organization_id', orgId)
        .eq('billing_period_start', startOfMonth.toISOString().split('T')[0])
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return this.parseUsageInfo(data)
    } catch (error) {
      console.error('Failed to get organization usage:', error)
      return null
    }
  }

  /**
   * Check if organization is within limits
   */
  async checkOrganizationLimit(orgId: string, limitType: 'users' | 'properties' | 'claims' | 'ai_requests'): Promise<boolean> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { data, error } = await this.supabase!.rpc('check_organization_limit', {
        org_id: orgId,
        limit_type: limitType
      })

      if (error) throw error

      return data as boolean
    } catch (error) {
      console.error('Failed to check organization limit:', error)
      return false
    }
  }

  /**
   * Update organization usage counters
   */
  async updateOrganizationUsage(
    orgId: string,
    usageType: 'users' | 'properties' | 'claims' | 'ai_requests',
    increment: number = 1
  ): Promise<boolean> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { error } = await this.supabase!.rpc('update_organization_usage', {
        org_id: orgId,
        usage_type: usageType,
        increment_by: increment
      })

      if (error) throw error

      // Clear organization cache to force refresh
      this.clearOrganizationCache(orgId)

      return true
    } catch (error) {
      console.error('Failed to update organization usage:', error)
      return false
    }
  }

  /**
   * Check if user has specific permission
   */
  async userHasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { data, error } = await this.supabase!.rpc('user_has_permission', {
        permission_name: permission
      })

      if (error) throw error

      return data as boolean
    } catch (error) {
      console.error('Failed to check user permission:', error)
      return false
    }
  }

  /**
   * Get tenant-specific database schema name
   */
  getTenantSchema(orgCode: string): string {
    return `org_${orgCode}`
  }

  /**
   * Execute query in tenant context
   */
  async executeTenantQuery(
    orgCode: string,
    tableName: string,
    query: TenantQuery
  ): Promise<{ data: unknown; error: string | null }> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const schemaName = this.getTenantSchema(orgCode)
      const fullTableName = `${schemaName}.${tableName}`

      // Execute query with tenant-specific table
      const result = await this.supabase!
        .from(fullTableName)
        .select(query.select || '*')
        .match(query.match || {})
        .order(query.order?.column || 'created_at', { 
          ascending: query.order?.ascending || false 
        })
        .limit(query.limit || 1000)

      return { data: result.data, error: result.error?.message || null }

    } catch (error) {
      console.error(`Failed to execute tenant query for ${orgCode}:`, error)
      return { data: null, error: (error as Error).message }
    }
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    orgId: string,
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    changes?: Record<string, unknown>
  ): Promise<void> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      await this.supabase!
        .from('organization_audit_log')
        .insert({
          organization_id: orgId,
          user_id: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          new_values: changes,
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }
  }

  /**
   * Clear organization cache
   */
  private clearOrganizationCache(orgId: string): void {
    // Clear all cache entries related to this organization
    for (const key of this.organizationCache.keys()) {
      if (key.includes(orgId)) {
        this.organizationCache.delete(key)
      }
    }
    
    // Clear user organization mappings
    for (const [userId, cachedOrgId] of this.userOrgCache.entries()) {
      if (cachedOrgId === orgId) {
        this.userOrgCache.delete(userId)
      }
    }
  }

  // Private parsing methods
  private parseOrganization(data: OrganizationRow): EnterpriseOrganization {
    return {
      id: data.id,
      organizationName: data.organization_name,
      organizationCode: data.organization_code,
      domain: data.domain,
      additionalDomains: data.additional_domains || [],
      subscriptionTier: data.subscription_tier,
      billingCycle: data.billing_cycle,
      subscriptionStatus: data.subscription_status,
      userLimit: data.user_limit,
      propertyLimit: data.property_limit,
      claimLimit: data.claim_limit,
      aiRequestLimit: data.ai_request_limit,
      storageLimitGb: data.storage_limit_gb,
      currentUsers: data.current_users,
      currentProperties: data.current_properties,
      currentClaims: data.current_claims,
      currentAiRequests: data.current_ai_requests,
      currentStorageGb: data.current_storage_gb,
      configuration: data.configuration || {},
      featureFlags: data.feature_flags || {},
      branding: data.branding || {},
      integrations: data.integrations || {},
      allowedStates: data.allowed_states || [],
      primaryState: data.primary_state || '',
      primaryContactEmail: data.primary_contact_email || '',
      billingEmail: data.billing_email,
      technicalContactEmail: data.technical_contact_email,
      phone: data.phone,
      address: data.address,
      ssoEnabled: data.sso_enabled || false,
      ssoProvider: data.sso_provider,
      ssoConfiguration: data.sso_configuration,
      require2fa: data.require_2fa || false,
      ipWhitelist: data.ip_whitelist,
      dataRegion: data.data_region || '',
      complianceRequirements: data.compliance_requirements || [],
      dataRetentionPolicy: data.data_retention_policy || {
        claimsRetentionDays: 2555, // 7 years
        documentsRetentionDays: 2555,
        auditLogsRetentionDays: 365,
        personalDataRetentionDays: 1095, // 3 years
        backupRetentionDays: 90
      },
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by || '',
      lastModifiedBy: data.last_modified_by,
      notes: data.notes
    }
  }

  private parseOrganizationUser(data: OrganizationUserRow): OrganizationUser {
    return {
      id: data.id,
      userId: data.user_id,
      organizationId: data.organization_id,
      role: data.role,
      permissions: (data.permissions || []).reduce((acc, perm) => ({ ...acc, [perm]: true }), {}),
      status: data.status,
      invitationToken: data.invitation_token,
      invitationExpiresAt: data.invitation_expires_at ? new Date(data.invitation_expires_at) : undefined,
      lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
      loginCount: data.login_count || 0,
      lastActivityAt: data.last_activity_at ? new Date(data.last_activity_at) : undefined,
      joinedAt: new Date(data.joined_at),
      invitedBy: data.invited_by,
      deactivatedAt: data.deactivated_at ? new Date(data.deactivated_at) : undefined,
      deactivatedBy: data.deactivated_by
    }
  }

  private parseCustomization(data: TenantCustomizationRow): TenantCustomization {
    return {
      id: data.id,
      organizationId: data.organization_id,
      theme: data.theme || {},
      logoUrl: data.logo_url,
      faviconUrl: data.favicon_url,
      customCss: data.custom_css,
      enabledFeatures: data.enabled_features || [],
      disabledFeatures: data.disabled_features || [],
      featureLimits: data.feature_limits || {},
      claimWorkflow: data.claim_workflow || {
        stages: [],
        notifications: {
          stageChange: true,
          approval: true,
          completion: true
        }
      },
      approvalWorkflows: data.approval_workflows || {
        claimApproval: {
          threshold: 1000,
          approvers: [],
          autoApprove: false
        },
        documentApproval: {
          required: false,
          approvers: []
        }
      },
      notificationPreferences: data.notification_preferences || {
        email: { enabled: true, frequency: 'immediate' },
        sms: { enabled: false, urgentOnly: true },
        push: { enabled: true, categories: [] }
      },
      webhookUrls: data.webhook_urls || {},
      apiKeys: data.api_keys || {},
      externalIntegrations: data.external_integrations || {},
      securityPolicies: data.security_policies || {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSymbols: false
        },
        sessionTimeout: 3600,
        maxFailedAttempts: 5,
        lockoutDuration: 900
      },
      dataExportSettings: data.data_export_settings || {
        allowUserExport: true,
        exportFormats: ['csv', 'json'],
        retentionAfterExport: 30,
        approvalRequired: false
      },
      auditSettings: data.audit_settings || {
        enabledEvents: ['login', 'logout', 'data_access', 'data_modification'],
        retentionDays: 365,
        realTimeNotifications: false
      },
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by || ''
    }
  }

  private parseUsageInfo(data: TenantUsageInfoRow): TenantUsageInfo {
    return {
      organizationId: data.organization_id,
      billingPeriodStart: new Date(data.billing_period_start),
      billingPeriodEnd: new Date(data.billing_period_end),
      usersCount: data.users_count || 0,
      propertiesCount: data.properties_count || 0,
      claimsCount: data.claims_count || 0,
      aiRequestsCount: data.ai_requests_count || 0,
      storageGb: data.storage_gb || 0,
      baseCost: data.base_cost || 0,
      overageCosts: data.overage_costs ? { total: data.overage_costs } : {},
      totalCost: data.total_cost || 0,
      invoiceStatus: data.invoice_status,
      invoiceNumber: data.invoice_number,
      invoiceDate: data.invoice_date ? new Date(data.invoice_date) : undefined,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      paidDate: data.paid_date ? new Date(data.paid_date) : undefined
    }
  }

  private serializeCustomization(customizations: Partial<TenantCustomization>): Partial<TenantCustomizationRow> {
    return {
      theme: customizations.theme,
      logo_url: customizations.logoUrl,
      favicon_url: customizations.faviconUrl,
      custom_css: customizations.customCss,
      enabled_features: customizations.enabledFeatures,
      disabled_features: customizations.disabledFeatures,
      feature_limits: customizations.featureLimits,
      claim_workflow: customizations.claimWorkflow,
      approval_workflows: customizations.approvalWorkflows,
      notification_preferences: customizations.notificationPreferences,
      webhook_urls: customizations.webhookUrls,
      api_keys: customizations.apiKeys,
      external_integrations: customizations.externalIntegrations,
      security_policies: customizations.securityPolicies,
      data_export_settings: customizations.dataExportSettings,
      audit_settings: customizations.auditSettings
    }
  }
}

// Export singleton instance
export const tenantManager = new TenantManager()

export type {
  EnterpriseOrganization,
  OrganizationUser,
  TenantCustomization,
  TenantUsageInfo,
  OrganizationConfiguration,
  OrganizationBranding,
  OrganizationIntegrations,
  OrganizationAddress,
  SSOConfiguration,
  DataRetentionPolicy,
  ClaimWorkflow,
  ApprovalWorkflows,
  NotificationPreferences,
  SecurityPolicies,
  DataExportSettings,
  AuditSettings,
  OrganizationTheme,
  ContactInfo,
  TenantQuery
}
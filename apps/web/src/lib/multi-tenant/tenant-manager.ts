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
interface OrganizationConfiguration extends Record<string, unknown> {
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
  settings: Record<string, unknown>
  isEnabled: boolean
}

// Database row types
interface OrganizationRow {
  id: string
  organization_name: string
  organization_code: string
  domain: string
  additional_domains?: string[]
  subscription_tier: 'starter' | 'professional' | 'enterprise'
  billing_cycle: 'monthly' | 'annual'
  subscription_status: 'trial' | 'active' | 'past_due' | 'canceled' | 'paused'
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
  configuration?: OrganizationConfiguration
  feature_flags?: Record<string, boolean>
  branding?: OrganizationBranding
  integrations?: OrganizationIntegrations
  allowed_states?: string[]
  primary_state?: string
  address?: OrganizationAddress
  phone?: string
  business_license_number?: string
  insurance_license_number?: string
  tax_id?: string
  is_active: boolean
  trial_ends_at?: string
  subscription_id?: string
  stripe_customer_id?: string
  billing_email?: string
  primary_contact_id?: string
  sso_enabled?: boolean
  sso_provider?: string
  sso_configuration?: SSOConfiguration
  require_2fa?: boolean
  ip_whitelist?: string[]
  data_region?: string
  compliance_requirements?: string[]
  data_retention_policy?: Record<string, unknown>
  created_at: string
  updated_at: string
  last_modified_by?: string
}

interface OrganizationUserRow {
  id: string
  user_id: string
  organization_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  permissions?: string[]
  status: 'active' | 'inactive' | 'pending' | 'banned'
  invitation_token?: string
  invitation_expires_at?: string
  last_login_at?: string
  login_count?: number
  last_activity_at?: string
  joined_at: string
  invited_by?: string
  deactivated_at?: string
  deactivated_by?: string
}

// Application types
export interface EnterpriseOrganization {
  id: string
  organizationName: string
  organizationCode: string
  domain: string
  additionalDomains: string[]
  subscriptionTier: 'starter' | 'professional' | 'enterprise'
  billingCycle: 'monthly' | 'annual'
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled' | 'paused'
  
  // Limits and usage
  userLimit: number
  propertyLimit: number
  claimLimit: number
  aiRequestLimit: number
  storageLimitGb: number
  currentUsers: number
  currentProperties: number
  currentClaims: number
  currentAiRequests: number
  currentStorageGb: number
  
  // Organization details
  configuration: OrganizationConfiguration
  featureFlags: Record<string, boolean>
  branding: OrganizationBranding
  integrations: OrganizationIntegrations
  allowedStates: string[]
  primaryState?: string
  address?: OrganizationAddress
  phone?: string
  businessLicenseNumber?: string
  insuranceLicenseNumber?: string
  taxId?: string
  
  // Security and compliance
  ssoEnabled?: boolean
  ssoProvider?: string
  ssoConfiguration?: SSOConfiguration
  require2fa?: boolean
  ipWhitelist?: string[]
  dataRegion?: string
  complianceRequirements?: string[]
  dataRetentionPolicy?: Record<string, unknown>
  
  // Status and billing
  isActive: boolean
  trialEndsAt?: Date
  subscriptionId?: string
  stripeCustomerId?: string
  billingEmail?: string
  primaryContactId?: string
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

export interface OrganizationUser {
  id: string
  userId: string
  organizationId: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  permissions: Record<string, boolean>
  status: 'active' | 'inactive' | 'pending' | 'banned'
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

export interface TenantContext {
  organization: EnterpriseOrganization
  user: OrganizationUser
  permissions: Record<string, boolean>
  features: Record<string, boolean>
  limits: {
    users: { current: number; limit: number }
    properties: { current: number; limit: number }
    claims: { current: number; limit: number }
    aiRequests: { current: number; limit: number }
    storage: { current: number; limit: number }
  }
  customizations: Record<string, unknown>
}

interface TenantQuery {
  from: string
  select: string
  eq?: { column: string; value: unknown }
  in?: { column: string; values: unknown[] }
  organizationId: string
}

class TenantManager {
  private supabase: SupabaseClient | null = null
  private contextCache = new Map<string, TenantContext>()
  private cacheExpiry = 15 * 60 * 1000 // 15 minutes

  constructor() {
    this.initializeSupabase()
  }

  private async initializeSupabase(): Promise<void> {
    this.supabase = await createClient()
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(organizationId: string): Promise<EnterpriseOrganization | null> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { data, error } = await this.supabase!
        .from('enterprise_organizations')
        .select('*')
        .eq('id', organizationId)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // No organization found
        }
        throw error
      }

      return this.parseOrganization(data as OrganizationRow)
    } catch (error) {
      console.error(`Failed to get organization ${organizationId}:`, error)
      return null
    }
  }

  /**
   * Get organization by code
   */
  async getOrganizationByCode(code: string): Promise<EnterpriseOrganization | null> {
    try {
      if (!this.supabase) await this.initializeSupabase()
      const { data, error } = await this.supabase!
        .from('enterprise_organizations')
        .select('*')
        .eq('org_code', code)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // No organization found
        }
        throw error
      }

      return this.parseOrganization(data as OrganizationRow)
    } catch (error) {
      console.error(`Failed to get organization by code ${code}:`, error)
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
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return this.parseOrganization(data as OrganizationRow)
    } catch (error) {
      console.error(`Failed to get organization by domain ${domain}:`, error)
      return null
    }
  }

  /**
   * Get user's organization
   */
  async getUserOrganization(userId: string): Promise<EnterpriseOrganization | null> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { data: userOrg } = await this.supabase!
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('joined_at', { ascending: true })
        .limit(1)
        .single()

      if (!userOrg) return null

      return this.getOrganizationById(userOrg.organization_id)
    } catch (error) {
      console.error(`Failed to get user organization for ${userId}:`, error)
      return null
    }
  }

  /**
   * Get tenant context for a user
   */
  async getTenantContext(userId: string, organizationId?: string): Promise<TenantContext | null> {
    const cacheKey = `${userId}:${organizationId || 'default'}`
    const cached = this.contextCache.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      if (!this.supabase) await this.initializeSupabase()

      // If organizationId is not provided, get user's default organization
      let targetOrgId = organizationId
      if (!targetOrgId) {
        const { data: userOrg } = await this.supabase!
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('joined_at', { ascending: true })
          .limit(1)
          .single()

        if (!userOrg) return null
        targetOrgId = userOrg.organization_id
      }

      // FIXED: Add null check for targetOrgId before passing to getOrganizationById
      if (!targetOrgId) return null
      // Get organization details
      const organization = await this.getOrganizationById(targetOrgId)
      if (!organization) return null

      // Get user's role and permissions in this organization
      const { data: userRole } = await this.supabase!
        .from('organization_users')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', targetOrgId)
        .eq('status', 'active')
        .single()

      if (!userRole) return null

      const user = this.parseOrganizationUser(userRole as OrganizationUserRow)
      
      // Build permissions map
      const permissions = this.buildPermissions(user.role, userRole.permissions || [])
      
      // Build features map
      const features = organization.featureFlags

      // Build limits
      const limits = {
        users: { current: organization.currentUsers, limit: organization.userLimit },
        properties: { current: organization.currentProperties, limit: organization.propertyLimit },
        claims: { current: organization.currentClaims, limit: organization.claimLimit },
        aiRequests: { current: organization.currentAiRequests, limit: organization.aiRequestLimit },
        storage: { current: organization.currentStorageGb, limit: organization.storageLimitGb }
      }

      const context: TenantContext = {
        organization,
        user,
        permissions,
        features,
        limits,
        customizations: organization.configuration || {}
      }

      // Cache the context
      this.contextCache.set(cacheKey, context)
      setTimeout(() => this.contextCache.delete(cacheKey), this.cacheExpiry)

      return context
    } catch (error) {
      console.error(`Failed to get tenant context for user ${userId}:`, error)
      return null
    }
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(userId: string, permission: string, organizationId?: string): Promise<boolean> {
    const context = await this.getTenantContext(userId, organizationId)
    return context?.permissions[permission] || false
  }

  /**
   * Check if user has specific permission (alias for backward compatibility)
   */
  async userHasPermission(userId: string, permission: string, organizationId?: string): Promise<boolean> {
    return this.hasPermission(userId, permission, organizationId)
  }

  /**
   * Check if feature is enabled for organization
   */
  async isFeatureEnabled(feature: string, organizationId: string): Promise<boolean> {
    const organization = await this.getOrganizationById(organizationId)
    return organization?.featureFlags[feature] || false
  }

  /**
   * Add user to organization
   */
  async addUserToOrganization(
    organizationId: string,
    userEmail: string,
    role: 'owner' | 'admin' | 'member' | 'viewer',
    invitedBy: string
  ): Promise<{ success: boolean; userId?: string; invitationToken?: string }> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      // Check if user already exists - use listUsers with email filter
      const { data: existingUsers } = await this.supabase!.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(user => user.email === userEmail)

      if (existingUser) {
        // Add existing user to organization
        const { error } = await this.supabase!
          .from('organization_users')
          .insert({
            user_id: existingUser.id,
            organization_id: organizationId,
            role,
            status: 'active',
            invited_by: invitedBy,
            joined_at: new Date().toISOString()
          })

        if (error) throw error

        return { success: true, userId: existingUser.id }
      } else {
        // Create invitation for new user
        const invitationToken = crypto.randomUUID()
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

        const { error } = await this.supabase!
          .from('organization_invitations')
          .insert({
            organization_id: organizationId,
            email: userEmail,
            role,
            invitation_token: invitationToken,
            expires_at: expiresAt.toISOString(),
            invited_by: invitedBy
          })

        if (error) throw error

        return { success: true, invitationToken }
      }
    } catch (error) {
      console.error('Failed to add user to organization:', error)
      return { success: false }
    }
  }

  /**
   * Update user role in organization
   */
  async updateUserRole(
    organizationId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member' | 'viewer',
    updatedBy: string
  ): Promise<boolean> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { error } = await this.supabase!
        .from('organization_users')
        .update({
          role,
          updated_at: new Date().toISOString(),
          last_modified_by: updatedBy
        })
        .eq('organization_id', organizationId)
        .eq('user_id', userId)

      if (error) throw error

      // Clear cache for this user
      this.contextCache.delete(`${userId}:${organizationId}`)
      this.contextCache.delete(`${userId}:default`)

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
    organizationId: string,
    userId: string,
    removedBy: string
  ): Promise<boolean> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { error } = await this.supabase!
        .from('organization_users')
        .update({
          status: 'inactive',
          deactivated_at: new Date().toISOString(),
          deactivated_by: removedBy
        })
        .eq('organization_id', organizationId)
        .eq('user_id', userId)

      if (error) throw error

      // Clear cache for this user
      this.contextCache.delete(`${userId}:${organizationId}`)
      this.contextCache.delete(`${userId}:default`)

      return true
    } catch (error) {
      console.error('Failed to remove user from organization:', error)
      return false
    }
  }

  /**
   * Get organization customizations
   */
  async getOrganizationCustomizations(organizationId: string): Promise<Record<string, unknown>> {
    const org = await this.getOrganizationById(organizationId)
    return org?.configuration || {}
  }

  /**
   * Update organization customizations
   */
  async updateOrganizationCustomizations(
    organizationId: string,
    customizations: Record<string, unknown>,
    updatedBy: string
  ): Promise<boolean> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { error } = await this.supabase!
        .from('enterprise_organizations')
        .update({
          configuration: customizations,
          updated_at: new Date().toISOString(),
          last_modified_by: updatedBy
        })
        .eq('id', organizationId)

      if (error) throw error

      // Clear cache
      this.contextCache.clear()

      return true
    } catch (error) {
      console.error('Failed to update organization customizations:', error)
      return false
    }
  }

  /**
   * Get organization usage
   */
  async getOrganizationUsage(organizationId: string, month?: Date): Promise<Record<string, unknown>> {
    const org = await this.getOrganizationById(organizationId)
    if (!org) return {}

    return {
      users: { current: org.currentUsers, limit: org.userLimit },
      properties: { current: org.currentProperties, limit: org.propertyLimit },
      claims: { current: org.currentClaims, limit: org.claimLimit },
      aiRequests: { current: org.currentAiRequests, limit: org.aiRequestLimit },
      storage: { current: org.currentStorageGb, limit: org.storageLimitGb }
    }
  }

  /**
   * Check organization limit
   */
  async checkOrganizationLimit(organizationId: string, limitType: string): Promise<boolean> {
    const org = await this.getOrganizationById(organizationId)
    if (!org) return false

    switch (limitType) {
      case 'users':
        return org.currentUsers < org.userLimit
      case 'properties':
        return org.currentProperties < org.propertyLimit
      case 'claims':
        return org.currentClaims < org.claimLimit
      case 'ai_requests':
        return org.currentAiRequests < org.aiRequestLimit
      default:
        return false
    }
  }

  /**
   * Execute tenant-scoped query
   */
  async executeTenantQuery<T = unknown>(query: TenantQuery): Promise<T[]>
  async executeTenantQuery(organizationCode: string, tableName: string, query: unknown): Promise<{ data: unknown[] | null; error: string | null }>
  async executeTenantQuery<T = unknown>(
    queryOrOrgCode: TenantQuery | string,
    tableName?: string,
    query?: unknown
  ): Promise<T[] | { data: unknown[] | null; error: string | null }> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      // Handle legacy signature
      if (typeof queryOrOrgCode === 'string' && tableName) {
        const organizationCode = queryOrOrgCode
        const org = await this.getOrganizationByDomain(organizationCode)
        if (!org) {
          return { data: null, error: 'Organization not found' }
        }

        // Execute basic query - this would need more implementation based on the query structure
        const { data, error } = await this.supabase!
          .from(tableName)
          .select('*')
          .eq('organization_id', org.id)

        return { data: data || [], error: error?.message || null }
      }

      // Handle new signature
      const tenantQuery = queryOrOrgCode as TenantQuery
      let queryBuilder = this.supabase!
        .from(tenantQuery.from)
        .select(tenantQuery.select)

      // Apply organization filter
      queryBuilder = queryBuilder.eq('organization_id', tenantQuery.organizationId)

      // Apply additional filters
      if (tenantQuery.eq) {
        queryBuilder = queryBuilder.eq(tenantQuery.eq.column, tenantQuery.eq.value)
      }
      if (tenantQuery.in) {
        queryBuilder = queryBuilder.in(tenantQuery.in.column, tenantQuery.in.values)
      }

      const { data, error } = await queryBuilder

      if (error) throw error

      return (data || []) as T[]
    } catch (error) {
      console.error('Failed to execute tenant query:', error)
      if (typeof queryOrOrgCode === 'string') {
        return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
      }
      return [] as T[]
    }
  }

  /**
   * Update organization usage metrics
   */
  async updateUsageMetrics(organizationId: string, metrics: {
    users?: number
    properties?: number
    claims?: number
    aiRequests?: number
    storage?: number
  }): Promise<boolean> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const updates: Record<string, unknown> = {}
      if (metrics.users !== undefined) updates.current_users = metrics.users
      if (metrics.properties !== undefined) updates.current_properties = metrics.properties
      if (metrics.claims !== undefined) updates.current_claims = metrics.claims
      if (metrics.aiRequests !== undefined) updates.current_ai_requests = metrics.aiRequests
      if (metrics.storage !== undefined) updates.current_storage_gb = metrics.storage

      if (Object.keys(updates).length === 0) return true

      const { error } = await this.supabase!
        .from('enterprise_organizations')
        .update(updates)
        .eq('id', organizationId)

      if (error) throw error

      // Clear cache for this organization
      this.contextCache.clear()

      return true
    } catch (error) {
      console.error(`Failed to update usage metrics for ${organizationId}:`, error)
      return false
    }
  }

  /**
   * Get organization users
   */
  async getOrganizationUsers(organizationId: string): Promise<OrganizationUser[]> {
    try {
      if (!this.supabase) await this.initializeSupabase()

      const { data, error } = await this.supabase!
        .from('organization_users')
        .select('*')
        .eq('organization_id', organizationId)
        .order('joined_at', { ascending: false })

      if (error) throw error

      return (data || []).map((row: OrganizationUserRow) => this.parseOrganizationUser(row))
    } catch (error) {
      console.error(`Failed to get users for organization ${organizationId}:`, error)
      return []
    }
  }

  // Private helper methods
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
      primaryState: data.primary_state,
      address: data.address,
      phone: data.phone,
      businessLicenseNumber: data.business_license_number,
      insuranceLicenseNumber: data.insurance_license_number,
      taxId: data.tax_id,
      
      ssoEnabled: data.sso_enabled,
      ssoProvider: data.sso_provider,
      ssoConfiguration: data.sso_configuration,
      require2fa: data.require_2fa,
      ipWhitelist: data.ip_whitelist,
      dataRegion: data.data_region,
      complianceRequirements: data.compliance_requirements,
      dataRetentionPolicy: data.data_retention_policy,
      
      isActive: data.is_active,
      trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : undefined,
      subscriptionId: data.subscription_id,
      stripeCustomerId: data.stripe_customer_id,
      billingEmail: data.billing_email,
      primaryContactId: data.primary_contact_id,
      
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  private parseOrganizationUser(data: OrganizationUserRow): OrganizationUser {
    return {
      id: data.id,
      userId: data.user_id,
      organizationId: data.organization_id,
      role: data.role,
      permissions: this.buildPermissions(data.role, data.permissions || []),
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

  private buildPermissions(role: string, customPermissions: string[]): Record<string, boolean> {
    const permissions: Record<string, boolean> = {}

    // Base permissions by role
    const rolePermissions: Record<string, string[]> = {
      owner: [
        'organization.read', 'organization.update', 'organization.delete',
        'users.read', 'users.create', 'users.update', 'users.delete', 'users.invite',
        'properties.read', 'properties.create', 'properties.update', 'properties.delete',
        'claims.read', 'claims.create', 'claims.update', 'claims.delete',
        'ai.read', 'ai.create', 'ai.update',
        'billing.read', 'billing.update', 'billing.view',
        'settings.read', 'settings.update',
        'audit.read', 'organization.customize'
      ],
      admin: [
        'organization.read',
        'users.read', 'users.create', 'users.update', 'users.invite',
        'properties.read', 'properties.create', 'properties.update', 'properties.delete',
        'claims.read', 'claims.create', 'claims.update', 'claims.delete',
        'ai.read', 'ai.create', 'ai.update',
        'settings.read', 'settings.update'
      ],
      member: [
        'organization.read',
        'properties.read', 'properties.create', 'properties.update',
        'claims.read', 'claims.create', 'claims.update',
        'ai.read', 'ai.create'
      ],
      viewer: [
        'organization.read',
        'properties.read',
        'claims.read',
        'ai.read'
      ]
    }

    // Set role-based permissions
    const basePermissions = rolePermissions[role] || []
    basePermissions.forEach(permission => {
      permissions[permission] = true
    })

    // Apply custom permissions
    customPermissions.forEach(permission => {
      permissions[permission] = true
    })

    return permissions
  }
}

// Export singleton instance
export const tenantManager = new TenantManager()
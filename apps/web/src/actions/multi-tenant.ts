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
'use server'

import { createClient } from '@/lib/supabase/server'
import { tenantManager, EnterpriseOrganization } from '@/lib/multi-tenant/tenant-manager'

export interface CreateOrganizationParams {
  organizationName: string
  organizationCode: string
  domain: string
  primaryContactEmail: string
  subscriptionTier?: string
  allowedStates?: string[]
  primaryState?: string
}

export interface UpdateOrganizationParams {
  organizationId: string
  updates: Partial<EnterpriseOrganization> & Record<string, any>
}

export interface InviteUserParams {
  organizationId: string
  userEmail: string
  role: 'admin' | 'manager' | 'member' | 'viewer'
}

export interface UpdateUserRoleParams {
  organizationId: string
  userId: string
  role: 'admin' | 'manager' | 'member' | 'viewer'
}

/**
 * Create a new enterprise organization
 */
export async function createOrganization({
  organizationName,
  organizationCode,
  domain,
  primaryContactEmail,
  subscriptionTier = 'standard',
  allowedStates = ['FL'],
  primaryState = 'FL'
}: CreateOrganizationParams) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    // Check if organization code is unique
    const { data: existingOrg } = await supabase
      .from('enterprise_organizations')
      .select('id')
      .eq('organization_code', organizationCode)
      .single()

    if (existingOrg) {
      return { data: null, error: 'Organization code already exists' }
    }

    // Check if domain is unique
    const { data: existingDomain } = await supabase
      .from('enterprise_organizations')
      .select('id')
      .eq('domain', domain)
      .single()

    if (existingDomain) {
      return { data: null, error: 'Domain already exists' }
    }

    // Create organization using the database function
    const { data: orgId, error } = await supabase.rpc('initialize_organization', {
      org_name: organizationName,
      org_code: organizationCode,
      domain: domain,
      owner_email: primaryContactEmail,
      subscription_tier: subscriptionTier
    })

    if (error) throw error

    // Update additional fields
    await supabase
      .from('enterprise_organizations')
      .update({
        allowed_states: allowedStates,
        primary_state: primaryState,
        last_modified_by: user.email
      })
      .eq('id', orgId)

    return { data: { organizationId: orgId }, error: null }
  } catch (error) {
    console.error('Failed to create organization:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Update organization details
 */
export async function updateOrganization({
  organizationId,
  updates
}: UpdateOrganizationParams) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    // Check if user has permission to update this organization
    const hasPermission = await tenantManager.hasPermission(user.id, 'organization.update')
    if (!hasPermission) {
      return { data: null, error: 'Insufficient permissions' }
    }

    // Convert updates to database format
    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      last_modified_by: user.email
    }

    if (updates.organizationName) dbUpdates.organization_name = updates.organizationName
    if (updates.domain) dbUpdates.domain = updates.domain
    if (updates.primaryContactId) dbUpdates.primary_contact_id = updates.primaryContactId
    if (updates.billingEmail) dbUpdates.billing_email = updates.billingEmail
    if (updates.phone) dbUpdates.phone = updates.phone
    if (updates.address) dbUpdates.address = updates.address
    if (updates.subscriptionTier) dbUpdates.subscription_tier = updates.subscriptionTier
    if (updates.billingCycle) dbUpdates.billing_cycle = updates.billingCycle
    if (updates.userLimit) dbUpdates.user_limit = updates.userLimit
    if (updates.propertyLimit) dbUpdates.property_limit = updates.propertyLimit
    if (updates.claimLimit) dbUpdates.claim_limit = updates.claimLimit
    if (updates.aiRequestLimit) dbUpdates.ai_request_limit = updates.aiRequestLimit
    if (updates.allowedStates) dbUpdates.allowed_states = updates.allowedStates
    if (updates.ssoEnabled !== undefined) dbUpdates.sso_enabled = updates.ssoEnabled
    if (updates.ssoProvider) dbUpdates.sso_provider = updates.ssoProvider
    if (updates.ssoConfiguration) dbUpdates.sso_configuration = updates.ssoConfiguration
    if (updates.require2fa !== undefined) dbUpdates.require_2fa = updates.require2fa
    if (updates.ipWhitelist) dbUpdates.ip_whitelist = updates.ipWhitelist
    if (updates.dataRegion) dbUpdates.data_region = updates.dataRegion
    if (updates.complianceRequirements) dbUpdates.compliance_requirements = updates.complianceRequirements
    if (updates.dataRetentionPolicy) dbUpdates.data_retention_policy = updates.dataRetentionPolicy
    if (updates.configuration) dbUpdates.configuration = updates.configuration
    if (updates.featureFlags) dbUpdates.feature_flags = updates.featureFlags
    if (updates.branding) dbUpdates.branding = updates.branding
    if (updates.integrations) dbUpdates.integrations = updates.integrations

    const { data, error } = await supabase
      .from('enterprise_organizations')
      .update(dbUpdates)
      .eq('id', organizationId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Failed to update organization:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get organization details
 */
export async function getOrganization(organizationId: string) {
  try {
    const organization = await tenantManager.getOrganizationById(organizationId)
    return { data: organization, error: null }
  } catch (error) {
    console.error('Failed to get organization:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get user's current organization
 */
export async function getCurrentUserOrganization() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    const context = await tenantManager.getTenantContext(user.id)
    const organization = context ? context.organization : null
    return { data: organization, error: null }
  } catch (error) {
    console.error('Failed to get user organization:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get organization users
 */
export async function getOrganizationUsers(organizationId: string) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    // Check if user has permission to view organization users
    const hasPermission = await tenantManager.userHasPermission(user.id, 'users.read')
    if (!hasPermission) {
      return { data: null, error: 'Insufficient permissions' }
    }

    const users = await tenantManager.getOrganizationUsers(organizationId)
    return { data: users, error: null }
  } catch (error) {
    console.error('Failed to get organization users:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Invite user to organization
 */
export async function inviteUserToOrganization({
  organizationId,
  userEmail,
  role
}: InviteUserParams) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    // Check if user has permission to invite users
    const hasPermission = await tenantManager.userHasPermission(user.id, 'users.invite')
    if (!hasPermission) {
      return { data: null, error: 'Insufficient permissions' }
    }

    const result = await tenantManager.addUserToOrganization(
      organizationId,
      userEmail,
      role,
      user.id
    )

    if (!result.success) {
      return { data: null, error: 'Failed to invite user' }
    }

    // If invitation token was generated, you would send email here
    // For now, we'll just return the token
    return { 
      data: { 
        userId: result.userId, 
        invitationToken: result.invitationToken,
        message: result.invitationToken ? 'Invitation sent to new user' : 'User added to organization'
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Failed to invite user:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Update user role in organization
 */
export async function updateUserRole({
  organizationId,
  userId,
  role
}: UpdateUserRoleParams) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    // Check if user has permission to update user roles
    const hasPermission = await tenantManager.userHasPermission(user.id, 'users.update')
    if (!hasPermission) {
      return { data: null, error: 'Insufficient permissions' }
    }

    const success = await tenantManager.updateUserRole(
      organizationId,
      userId,
      role,
      user.id
    )

    if (!success) {
      return { data: null, error: 'Failed to update user role' }
    }

    return { data: { success: true }, error: null }
  } catch (error) {
    console.error('Failed to update user role:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Remove user from organization
 */
export async function removeUserFromOrganization(
  organizationId: string,
  userId: string
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    // Check if user has permission to remove users
    const hasPermission = await tenantManager.userHasPermission(user.id, 'users.delete')
    if (!hasPermission) {
      return { data: null, error: 'Insufficient permissions' }
    }

    // Prevent user from removing themselves
    if (user.id === userId) {
      return { data: null, error: 'Cannot remove yourself from organization' }
    }

    const success = await tenantManager.removeUserFromOrganization(
      organizationId,
      userId,
      user.id
    )

    if (!success) {
      return { data: null, error: 'Failed to remove user' }
    }

    return { data: { success: true }, error: null }
  } catch (error) {
    console.error('Failed to remove user:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get organization customizations
 */
export async function getOrganizationCustomizations(organizationId: string) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    const customizations = await tenantManager.getOrganizationCustomizations(organizationId)
    return { data: customizations, error: null }
  } catch (error) {
    console.error('Failed to get organization customizations:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Update organization customizations
 */
export async function updateOrganizationCustomizations(
  organizationId: string,
  customizations: Record<string, unknown>
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    // Check if user has permission to update customizations
    const hasPermission = await tenantManager.userHasPermission(user.id, 'organization.customize')
    if (!hasPermission) {
      return { data: null, error: 'Insufficient permissions' }
    }

    const success = await tenantManager.updateOrganizationCustomizations(
      organizationId,
      customizations,
      user.id
    )

    if (!success) {
      return { data: null, error: 'Failed to update customizations' }
    }

    return { data: { success: true }, error: null }
  } catch (error) {
    console.error('Failed to update customizations:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get organization usage information
 */
export async function getOrganizationUsage(organizationId: string, month?: Date) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    // Check if user has permission to view billing
    const hasPermission = await tenantManager.userHasPermission(user.id, 'billing.view')
    if (!hasPermission) {
      return { data: null, error: 'Insufficient permissions' }
    }

    const usage = await tenantManager.getOrganizationUsage(organizationId, month)
    return { data: usage, error: null }
  } catch (error) {
    console.error('Failed to get organization usage:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Check organization usage limits
 */
export async function checkOrganizationLimits(organizationId: string) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    const [usersOk, propertiesOk, claimsOk, aiRequestsOk] = await Promise.all([
      tenantManager.checkOrganizationLimit(organizationId, 'users'),
      tenantManager.checkOrganizationLimit(organizationId, 'properties'),
      tenantManager.checkOrganizationLimit(organizationId, 'claims'),
      tenantManager.checkOrganizationLimit(organizationId, 'ai_requests')
    ])

    return { 
      data: {
        users: usersOk,
        properties: propertiesOk,
        claims: claimsOk,
        aiRequests: aiRequestsOk
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Failed to check organization limits:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get organization audit log
 */
export async function getOrganizationAuditLog(
  organizationId: string,
  limit: number = 100,
  offset: number = 0
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    // Check if user has permission to view audit log
    const hasPermission = await tenantManager.userHasPermission(user.id, 'audit.read')
    if (!hasPermission) {
      return { data: null, error: 'Insufficient permissions' }
    }

    const { data, error } = await supabase
      .from('organization_audit_log')
      .select('*')
      .eq('organization_id', organizationId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Failed to get audit log:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Execute tenant-specific query
 */
export async function executeTenantQuery(
  organizationCode: string,
  tableName: string,
  query: unknown
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    // Verify user has access to this organization
    const userOrg = await tenantManager.getUserOrganization(user.id)
    if (!userOrg || userOrg.organizationCode !== organizationCode) {
      return { data: null, error: 'Access denied' }
    }

    const result = await tenantManager.executeTenantQuery(
      organizationCode,
      tableName,
      query as any
    )

    return result
  } catch (error) {
    console.error('Failed to execute tenant query:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
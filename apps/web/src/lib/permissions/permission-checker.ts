/**
 * @fileMetadata
 * @purpose "Permission checking utilities for role-based access control"
 * @dependencies ["@/lib"]
 * @owner admin-team
 * @status stable
 */

import { createClient } from '@/lib/supabase/client'

export type UserTier = 'free' | 'renter' | 'essential' | 'plus' | 'pro'

export type PermissionType = 
  | 'access_dashboard'
  | 'access_damage_analyzer'
  | 'access_policy_chat'
  | 'access_inventory_scanner'
  | 'access_claim_assistant'
  | 'access_document_generator'
  | 'access_communication_helper'
  | 'access_settlement_analyzer'
  | 'access_evidence_organizer'
  | 'access_3d_model_generator'
  | 'access_ar_damage_documenter'
  | 'access_receipt_scanner'
  | 'access_proactive_optimizer'
  | 'create_properties'
  | 'create_claims'
  | 'upload_documents'
  | 'export_data'
  | 'bulk_operations'
  | 'advanced_analytics'
  | 'priority_support'
  | 'custom_integrations'

export interface UserPermissions {
  tier: UserTier
  permissions: PermissionType[]
  aiRequestsLimit: number
  storageLimit: number // in MB
  propertiesLimit: number
  claimsLimit: number
}

export interface PermissionCheckResult {
  hasPermission: boolean
  reason?: string
  currentUsage?: number
  limit?: number
}

class PermissionChecker {
  private supabase = createClient()

  /**
   * Get user's current tier and permissions
   */
  async getUserPermissions(userId: string): Promise<UserPermissions | null> {
    try {
      // First check if user has an active subscription
      const { data: subscription } = await this.supabase
        .from('user_subscriptions')
        .select(`
          tier,
          status,
          user_tiers (
            permissions,
            ai_requests_limit,
            storage_limit_mb,
            properties_limit,
            claims_limit
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (subscription && subscription.user_tiers) {
        const tierData = subscription.user_tiers as Record<string, any>
        return {
          tier: subscription.tier,
          permissions: tierData.permissions || [],
          aiRequestsLimit: tierData.ai_requests_limit || 0,
          storageLimit: tierData.storage_limit_mb || 0,
          propertiesLimit: tierData.properties_limit || 0,
          claimsLimit: tierData.claims_limit || 0
        }
      }

      // Fall back to free tier if no active subscription
      const { data: freeTier } = await this.supabase
        .from('user_tiers')
        .select('*')
        .eq('tier', 'free')
        .single()

      if (freeTier) {
        return {
          tier: 'free',
          permissions: freeTier.permissions,
          aiRequestsLimit: freeTier.ai_requests_limit,
          storageLimit: freeTier.storage_limit_mb,
          propertiesLimit: freeTier.properties_limit,
          claimsLimit: freeTier.claims_limit
        }
      }

      return null
    } catch (error) {
      console.error('Error fetching user permissions:', error)
      return null
    }
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(userId: string, permission: PermissionType): Promise<PermissionCheckResult> {
    try {
      const userPermissions = await this.getUserPermissions(userId)
      
      if (!userPermissions) {
        return {
          hasPermission: false,
          reason: 'Unable to determine user permissions'
        }
      }

      // Check for permission overrides first
      const { data: override } = await this.supabase
        .from('user_permission_overrides')
        .select('*')
        .eq('user_id', userId)
        .eq('permission_type', permission)
        .eq('is_active', true)
        .single()

      if (override) {
        return {
          hasPermission: override.granted,
          reason: override.granted ? 'Permission granted via override' : 'Permission denied via override'
        }
      }

      // Check tier permissions
      const hasBasePermission = userPermissions.permissions.includes(permission)
      
      return {
        hasPermission: hasBasePermission,
        reason: hasBasePermission ? 'Permission granted via tier' : `Permission not available for ${userPermissions.tier} tier`
      }
    } catch (error) {
      console.error('Error checking permission:', error)
      return {
        hasPermission: false,
        reason: 'Error checking permission'
      }
    }
  }

  /**
   * Check usage limits (AI requests, storage, etc.)
   */
  async checkUsageLimit(userId: string, limitType: 'ai_requests' | 'storage' | 'properties' | 'claims'): Promise<PermissionCheckResult> {
    try {
      const userPermissions = await this.getUserPermissions(userId)
      
      if (!userPermissions) {
        return {
          hasPermission: false,
          reason: 'Unable to determine user permissions'
        }
      }

      let currentUsage = 0
      let limit = 0

      switch (limitType) {
        case 'ai_requests':
          // Get current month's AI request count
          const startOfMonth = new Date()
          startOfMonth.setDate(1)
          startOfMonth.setHours(0, 0, 0, 0)

          const { data: aiUsage } = await this.supabase
            .from('user_activity_logs')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)
            .eq('action_type', 'ai_request')
            .gte('created_at', startOfMonth.toISOString())

          currentUsage = aiUsage?.length || 0
          limit = userPermissions.aiRequestsLimit
          break

        case 'storage':
          // Get user's total file storage usage
          const { data: files } = await this.supabase
            .from('policy_documents')
            .select('file_size')
            .eq('user_id', userId)

          currentUsage = files?.reduce((total, file) => total + (file.file_size || 0), 0) || 0
          currentUsage = Math.round(currentUsage / (1024 * 1024)) // Convert to MB
          limit = userPermissions.storageLimit
          break

        case 'properties':
          const { data: properties } = await this.supabase
            .from('properties')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)

          currentUsage = properties?.length || 0
          limit = userPermissions.propertiesLimit
          break

        case 'claims':
          const { data: claims } = await this.supabase
            .from('claims')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)

          currentUsage = claims?.length || 0
          limit = userPermissions.claimsLimit
          break
      }

      const hasCapacity = limit === -1 || currentUsage < limit // -1 means unlimited

      return {
        hasPermission: hasCapacity,
        reason: hasCapacity ? 'Within usage limits' : `Usage limit exceeded (${currentUsage}/${limit})`,
        currentUsage,
        limit: limit === -1 ? undefined : limit
      }
    } catch (error) {
      console.error('Error checking usage limit:', error)
      return {
        hasPermission: false,
        reason: 'Error checking usage limit'
      }
    }
  }

  /**
   * Get user's tier upgrade suggestions
   */
  async getTierUpgradeSuggestions(userId: string): Promise<{ currentTier: UserTier; suggestedTier: UserTier; reasons: string[] } | null> {
    try {
      const userPermissions = await this.getUserPermissions(userId)
      if (!userPermissions) return null

      const suggestions: string[] = []
      let suggestedTier: UserTier = userPermissions.tier

      // Check AI request usage
      const aiCheck = await this.checkUsageLimit(userId, 'ai_requests')
      if (!aiCheck.hasPermission && aiCheck.currentUsage && aiCheck.limit) {
        suggestions.push(`You've used ${aiCheck.currentUsage}/${aiCheck.limit} AI requests this month`)
        if (userPermissions.tier === 'free') suggestedTier = 'renter'
        else if (userPermissions.tier === 'renter') suggestedTier = 'essential'
      }

      // Check storage usage
      const storageCheck = await this.checkUsageLimit(userId, 'storage')
      if (!storageCheck.hasPermission && storageCheck.currentUsage && storageCheck.limit) {
        suggestions.push(`You've used ${storageCheck.currentUsage}MB/${storageCheck.limit}MB of storage`)
        if (userPermissions.tier === 'free') suggestedTier = 'renter'
      }

      // Check properties usage
      const propertiesCheck = await this.checkUsageLimit(userId, 'properties')
      if (!propertiesCheck.hasPermission && propertiesCheck.currentUsage && propertiesCheck.limit) {
        suggestions.push(`You have ${propertiesCheck.currentUsage}/${propertiesCheck.limit} properties`)
        if (userPermissions.tier === 'free') suggestedTier = 'renter'
        else if (userPermissions.tier === 'renter') suggestedTier = 'essential'
      }

      if (suggestions.length > 0) {
        return {
          currentTier: userPermissions.tier,
          suggestedTier,
          reasons: suggestions
        }
      }

      return null
    } catch (error) {
      console.error('Error getting tier upgrade suggestions:', error)
      return null
    }
  }

  /**
   * Log user activity for tracking and analytics
   */
  async logActivity(userId: string, actionType: string, details?: Record<string, any>): Promise<void> {
    try {
      await this.supabase
        .from('user_activity_logs')
        .insert({
          user_id: userId,
          action_type: actionType,
          details,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error logging activity:', error)
    }
  }
}

export const permissionChecker = new PermissionChecker()

/**
 * React hook for checking permissions in components
 */
export function usePermissions(userId: string) {
  const checkPermission = async (permission: PermissionType) => {
    return await permissionChecker.hasPermission(userId, permission)
  }

  const checkUsageLimit = async (limitType: 'ai_requests' | 'storage' | 'properties' | 'claims') => {
    return await permissionChecker.checkUsageLimit(userId, limitType)
  }

  const getUserPermissions = async () => {
    return await permissionChecker.getUserPermissions(userId)
  }

  const logActivity = async (actionType: string, details?: Record<string, any>) => {
    return await permissionChecker.logActivity(userId, actionType, details)
  }

  return {
    checkPermission,
    checkUsageLimit,
    getUserPermissions,
    logActivity
  }
}
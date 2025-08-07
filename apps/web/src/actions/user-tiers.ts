/**
 * @fileMetadata
 * @purpose "Server actions for managing user tiers and subscriptions"
 * @dependencies ["@/lib","next"]
 * @owner admin-team
 * @status stable
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { UserTier, PermissionType } from '@/lib/permissions/permission-checker'
import { emailNotificationService } from '@/lib/services/email-notification-service'

export interface CreateSubscriptionParams {
  userId: string
  tier: UserTier
  stripeSubscriptionId?: string
  stripePriceId?: string
}

export interface UpdateUserTierParams {
  userId: string
  tier: UserTier
  reason?: string
}

export interface BulkUserOperation {
  userIds: string[]
  operation: 'change_tier' | 'suspend' | 'activate' | 'delete'
  tier?: UserTier
  reason?: string
}

/**
 * Create or update user subscription
 */
export async function createUserSubscription({
  userId,
  tier,
  stripeSubscriptionId,
  stripePriceId
}: CreateSubscriptionParams) {
  try {
    const supabase = await createClient()

    // First check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (existingSubscription) {
      // Update existing subscription
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          tier,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_price_id: stripePriceId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } else {
      // Create new subscription
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          tier,
          status: 'active',
          stripe_subscription_id: stripeSubscriptionId,
          stripe_price_id: stripePriceId,
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    }
  } catch (error) {
    console.error('Error creating user subscription:', error)
    return { data: null, error: (error as Error).message }
  }
}

/**
 * Get user's current tier and subscription info
 */
export async function getUserTierInfo(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        user_tiers (
          tier,
          name,
          price_monthly,
          price_yearly,
          permissions,
          ai_requests_limit,
          storage_limit_mb,
          properties_limit,
          claims_limit,
          features
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') throw error

    // If no active subscription, return free tier info
    if (!data) {
      const { data: freeTier, error: freeTierError } = await supabase
        .from('user_tiers')
        .select('*')
        .eq('tier', 'free')
        .single()

      if (freeTierError) throw freeTierError

      return {
        data: {
          tier: 'free' as UserTier,
          status: 'free',
          user_tiers: freeTier
        },
        error: null
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error getting user tier info:', error)
    return { data: null, error: (error as Error).message }
  }
}

/**
 * Update user tier (admin function)
 */
export async function updateUserTier({
  userId,
  tier,
  reason
}: UpdateUserTierParams) {
  try {
    const supabase = await createClient()

    // Get current tier and user info for email notification
    const { data: currentSubscription } = await supabase
      .from('user_subscriptions')
      .select(`
        tier,
        users:user_id (
          id,
          email
        )
      `)
      .eq('user_id', userId)
      .single()

    const { data: userInfo } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    const oldTier = currentSubscription?.tier || 'free'
    const userEmail = userInfo?.email || 'unknown@example.com'

    // Log the tier change
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        action_type: 'tier_change',
        details: {
          old_tier: oldTier,
          new_tier: tier,
          reason,
          changed_by: 'admin' // In production, get from auth context
        }
      })

    // Update or create subscription
    const result = await createUserSubscription({
      userId,
      tier
    })

    // Send email notification if user email is available and tier actually changed
    if (userEmail && oldTier !== tier && result.data) {
      await emailNotificationService.sendTierChangeNotification({
        userEmail,
        oldTier: oldTier as UserTier,
        newTier: tier,
        reason,
        changedBy: 'admin', // In production, get from auth context
        effectiveDate: new Date()
      })
    }

    return result
  } catch (error) {
    console.error('Error updating user tier:', error)
    return { data: null, error: (error as Error).message }
  }
}

/**
 * Get all available tiers
 */
export async function getAllTiers() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_tiers')
      .select('*')
      .order('price_monthly', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error getting all tiers:', error)
    return { data: null, error: (error as Error).message }
  }
}

/**
 * Create permission override for specific user
 */
export async function createPermissionOverride(
  userId: string,
  permissionType: PermissionType,
  granted: boolean,
  reason?: string,
  expiresAt?: string
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_permission_overrides')
      .insert({
        user_id: userId,
        permission_type: permissionType,
        granted,
        reason,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Log the permission override
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        action_type: 'permission_override',
        details: {
          permission_type: permissionType,
          granted,
          reason,
          expires_at: expiresAt
        }
      })

    return { data, error: null }
  } catch (error) {
    console.error('Error creating permission override:', error)
    return { data: null, error: (error as Error).message }
  }
}

/**
 * Bulk operations on users
 */
export async function performBulkUserOperation({
  userIds,
  operation,
  tier,
  reason
}: BulkUserOperation) {
  try {
    const supabase = await createClient()
    const results = []

    for (const userId of userIds) {
      try {
        switch (operation) {
          case 'change_tier':
            if (!tier) throw new Error('Tier is required for change_tier operation')
            const tierResult = await updateUserTier({ userId, tier, reason })
            results.push({ userId, success: !tierResult.error, error: tierResult.error })
            break

          case 'suspend':
            // Update subscription status to suspended
            await supabase
              .from('user_subscriptions')
              .update({
                status: 'suspended',
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId)
              .eq('status', 'active')

            await supabase
              .from('user_activity_logs')
              .insert({
                user_id: userId,
                action_type: 'account_suspended',
                details: { reason }
              })

            results.push({ userId, success: true })
            break

          case 'activate':
            // Reactivate suspended subscription
            await supabase
              .from('user_subscriptions')
              .update({
                status: 'active',
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId)
              .eq('status', 'suspended')

            await supabase
              .from('user_activity_logs')
              .insert({
                user_id: userId,
                action_type: 'account_activated',
                details: { reason }
              })

            results.push({ userId, success: true })
            break

          case 'delete':
            // Note: This would require careful handling of related data
            // For now, just log the request
            await supabase
              .from('user_activity_logs')
              .insert({
                user_id: userId,
                action_type: 'deletion_requested',
                details: { reason }
              })

            results.push({ userId, success: true, note: 'Marked for deletion - manual cleanup required' })
            break

          default:
            results.push({ userId, success: false, error: 'Unknown operation' })
        }
      } catch (error) {
        results.push({ userId, success: false, error: (error as Error).message })
      }
    }

    return { data: results, error: null }
  } catch (error) {
    console.error('Error performing bulk user operation:', error)
    return { data: null, error: (error as Error).message }
  }
}

/**
 * Get user activity logs with pagination
 */
export async function getUserActivityLogs(
  userId: string,
  page: number = 1,
  limit: number = 50
) {
  try {
    const supabase = await createClient()
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('user_activity_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      data: {
        logs: data,
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      },
      error: null
    }
  } catch (error) {
    console.error('Error getting user activity logs:', error)
    return { data: null, error: (error as Error).message }
  }
}

/**
 * Update tier permissions (admin function)
 */
export async function updateTierPermissions(tierPermissions: Array<{
  tier: UserTier
  permissions: PermissionType[]
}>) {
  try {
    const supabase = await createClient()
    const changedTiers = []

    for (const tierData of tierPermissions) {
      // Get current permissions to compare
      const { data: currentTier } = await supabase
        .from('user_tiers')
        .select('permissions')
        .eq('tier', tierData.tier)
        .single()

      const { data, error } = await supabase
        .from('user_tiers')
        .update({
          permissions: tierData.permissions,
          updated_at: new Date().toISOString()
        })
        .eq('tier', tierData.tier)
        .select()
        .single()

      if (error) throw error

      // Track which permissions changed
      const oldPermissions = currentTier?.permissions || []
      const newPermissions = tierData.permissions
      const changedPermissions = [
        ...newPermissions.filter((p: PermissionType) => !oldPermissions.includes(p)).map((p: PermissionType) => ({ permission: p, granted: true })),
        ...oldPermissions.filter((p: PermissionType) => !newPermissions.includes(p)).map((p: PermissionType) => ({ permission: p, granted: false }))
      ]

      if (changedPermissions.length > 0) {
        changedTiers.push({
          tier: tierData.tier,
          changedPermissions
        })
      }

      // Log the permission change
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: 'system', // System-level change
          action_type: 'tier_permissions_updated',
          details: {
            tier: tierData.tier,
            permissions: tierData.permissions,
            changed_by: 'admin' // In production, get from auth context
          }
        })
    }

    // Send email notifications to affected users
    for (const tierChange of changedTiers) {
      // Get all users with this tier
      const { data: users } = await supabase
        .from('user_subscriptions')
        .select(`
          users:user_id (
            id,
            email
          )
        `)
        .eq('tier', tierChange.tier)
        .eq('status', 'active')

      // Send notifications to each user
      if (users) {
        for (const userRecord of users) {
          const user = userRecord.users as unknown as { id: string; email: string }
          if (user?.email) {
            await emailNotificationService.sendPermissionChangeNotification({
              userEmail: user.email,
              tier: tierChange.tier,
              changedPermissions: tierChange.changedPermissions,
              changedBy: 'admin' // In production, get from auth context
            })
          }
        }
      }
    }

    return { data: 'Tier permissions updated successfully', error: null }
  } catch (error) {
    console.error('Error updating tier permissions:', error)
    return { data: null, error: (error as Error).message }
  }
}

/**
 * Get all permission overrides with user info
 */
export async function getPermissionOverrides() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_permission_overrides')
      .select(`
        *,
        users:user_id (
          id,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform data to include user email
    const transformedData = data?.map(override => ({
      ...override,
      user_email: override.users?.email || 'Unknown'
    })) || []

    return { data: transformedData, error: null }
  } catch (error) {
    console.error('Error getting permission overrides:', error)
    return { data: null, error: (error as Error).message }
  }
}

/**
 * Get user ID by email
 */
export async function getUserByEmail(email: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error getting user by email:', error)
    return { data: null, error: (error as Error).message }
  }
}

/**
 * Delete permission override
 */
export async function deletePermissionOverride(overrideId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('user_permission_overrides')
      .delete()
      .eq('id', overrideId)

    if (error) throw error

    return { data: 'Permission override deleted successfully', error: null }
  } catch (error) {
    console.error('Error deleting permission override:', error)
    return { data: null, error: (error as Error).message }
  }
}

/**
 * Create Stripe checkout session for tier upgrade
 */
export async function createTierCheckoutSession({
  tier,
  billingInterval = 'monthly',
  successUrl,
  cancelUrl
}: {
  tier: UserTier
  billingInterval?: 'monthly' | 'yearly'
  successUrl: string
  cancelUrl: string
}) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Price ID mapping for each tier
    const tierPriceIds: Record<UserTier, { monthly: string; yearly: string }> = {
      free: { monthly: '', yearly: '' }, // Free tier doesn't have price IDs
      renter: {
        monthly: 'price_renter_monthly',
        yearly: 'price_renter_yearly'
      },
      essential: {
        monthly: 'price_essential_monthly',
        yearly: 'price_essential_yearly'
      },
      plus: {
        monthly: 'price_plus_monthly',
        yearly: 'price_plus_yearly'
      },
      pro: {
        monthly: 'price_pro_monthly',
        yearly: 'price_pro_yearly'
      }
    }

    if (tier === 'free') {
      return { error: 'Cannot create checkout for free tier' }
    }

    const priceId = tierPriceIds[tier][billingInterval]
    if (!priceId) {
      return { error: 'Invalid tier or billing interval' }
    }

    // This would create a Stripe checkout session
    // For now, return a mock URL
    return {
      sessionId: 'mock-session-id',
      url: `${successUrl}?session_id=mock-session-id&tier=${tier}&billing=${billingInterval}`
    }
  } catch (error) {
    console.error('Error creating tier checkout session:', error)
    return { error: (error as Error).message }
  }
}

/**
 * Get usage statistics for a user
 */
export async function getUserUsageStats(userId: string) {
  try {
    const supabase = await createClient()

    // Get current month start
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // AI requests this month
    const { data: aiRequests } = await supabase
      .from('user_activity_logs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('action_type', 'ai_request')
      .gte('created_at', startOfMonth.toISOString())

    // Storage usage
    const { data: files } = await supabase
      .from('policy_documents')
      .select('file_size')
      .eq('user_id', userId)

    const storageUsed = files?.reduce((total, file) => total + (file.file_size || 0), 0) || 0

    // Properties count
    const { data: properties } = await supabase
      .from('properties')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)

    // Claims count
    const { data: claims } = await supabase
      .from('claims')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)

    return {
      data: {
        aiRequestsThisMonth: aiRequests?.length || 0,
        storageUsedBytes: storageUsed,
        storageUsedMB: Math.round(storageUsed / (1024 * 1024)),
        propertiesCount: properties?.length || 0,
        claimsCount: claims?.length || 0
      },
      error: null
    }
  } catch (error) {
    console.error('Error getting user usage stats:', error)
    return { data: null, error: (error as Error).message }
  }
}

/**
 * Check if user can add more properties based on their tier
 */
export async function checkPropertyLimit(userId: string) {
  try {
    const supabase = await createClient()

    // Get user's current tier info
    const tierResult = await getUserTierInfo(userId)
    if (tierResult.error || !tierResult.data) {
      return { canAdd: false, error: 'Failed to get user tier information' }
    }

    const tierInfo = tierResult.data.user_tiers
    const propertiesLimit = tierInfo?.properties_limit || 3 // Default to 3 for free tier

    // Count current properties
    const { count: currentCount, error: countError } = await supabase
      .from('properties')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)

    if (countError) throw countError

    const canAdd = (currentCount || 0) < propertiesLimit

    return {
      data: {
        canAdd,
        currentCount: currentCount || 0,
        limit: propertiesLimit,
        remaining: Math.max(0, propertiesLimit - (currentCount || 0)),
        tier: tierResult.data.tier,
        requiresUpgrade: !canAdd
      },
      error: null
    }
  } catch (error) {
    console.error('Error checking property limit:', error)
    return { data: null, error: (error as Error).message }
  }
}

/**
 * Get property pricing information for additional properties
 */
export async function getPropertyPricing(userId: string) {
  try {
    const supabase = await createClient()

    // Get user's current tier
    const tierResult = await getUserTierInfo(userId)
    if (tierResult.error || !tierResult.data) {
      return { data: null, error: 'Failed to get user tier information' }
    }

    const currentTier = tierResult.data.tier

    // Pricing per additional property after tier limit
    const propertyPricing: Record<UserTier, { pricePerProperty: number; freeLimit: number }> = {
      free: { pricePerProperty: 15, freeLimit: 3 },
      renter: { pricePerProperty: 12, freeLimit: 1 },
      essential: { pricePerProperty: 10, freeLimit: 5 },
      plus: { pricePerProperty: 8, freeLimit: 15 },
      pro: { pricePerProperty: 0, freeLimit: 999999 } // Unlimited
    }

    const pricing = propertyPricing[currentTier as UserTier]

    // Get current property count
    const { count: currentCount } = await supabase
      .from('properties')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)

    const additionalPropertiesNeeded = Math.max(0, (currentCount || 0) - pricing.freeLimit)
    const monthlyAdditionalCost = additionalPropertiesNeeded * pricing.pricePerProperty

    return {
      data: {
        currentTier,
        pricePerProperty: pricing.pricePerProperty,
        freeLimit: pricing.freeLimit,
        currentCount: currentCount || 0,
        additionalPropertiesNeeded,
        monthlyAdditionalCost,
        nextPropertyCost: pricing.pricePerProperty,
        isUnlimited: currentTier === 'pro'
      },
      error: null
    }
  } catch (error) {
    console.error('Error getting property pricing:', error)
    return { data: null, error: (error as Error).message }
  }
}

/**
 * Create additional property subscription for per-property billing
 */
export async function createAdditionalPropertySubscription({
  userId,
  additionalProperties
}: {
  userId: string
  additionalProperties: number
}) {
  try {
    const supabase = await createClient()

    // Get user's current tier and pricing
    const pricingResult = await getPropertyPricing(userId)
    if (pricingResult.error || !pricingResult.data) {
      return { data: null, error: 'Failed to get property pricing' }
    }

    const { pricePerProperty, currentTier } = pricingResult.data

    if (currentTier === 'pro') {
      return { data: null, error: 'Pro tier has unlimited properties' }
    }

    const monthlyCharge = additionalProperties * pricePerProperty

    // Record the additional property subscription
    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        tier: currentTier,
        status: 'active',
        additional_properties: additionalProperties,
        additional_monthly_cost: monthlyCharge,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Log the property subscription
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        action_type: 'property_subscription_created',
        details: {
          additional_properties: additionalProperties,
          monthly_cost: monthlyCharge,
          price_per_property: pricePerProperty,
          tier: currentTier
        }
      })

    return { data, error: null }
  } catch (error) {
    console.error('Error creating additional property subscription:', error)
    return { data: null, error: (error as Error).message }
  }
}

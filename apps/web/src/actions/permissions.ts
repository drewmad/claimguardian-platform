/**
 * @fileMetadata
 * @owner backend-team
 * @purpose "Server actions for managing permissions and subscriptions"
 * @dependencies ["@supabase/supabase-js"]
 * @status stable
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  Permission,
  SubscriptionTier,
  TierPermission,
  UserSubscription,
  UserPermission
} from '@/types/permissions'

// Get all permissions
export async function getAllPermissions() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('category, name')

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch permissions' }
  }
}

// Get all subscription tiers
export async function getAllTiers() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .order('sort_order')

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching tiers:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch tiers' }
  }
}

// Get tier permissions with full details
export async function getTierPermissions(tierId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tier_permissions')
      .select(`
        *,
        permission:permissions(*)
      `)
      .eq('tier_id', tierId)

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching tier permissions:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch tier permissions' }
  }
}

// Update tier permissions
export async function updateTierPermissions(
  tierId: string,
  permissions: {
    permission_id: string
    limit_value?: number | null
    metadata?: Record<string, any>
  }[]
) {
  try {
    const supabase = await createClient()

    // First, delete existing permissions for this tier
    const { error: deleteError } = await supabase
      .from('tier_permissions')
      .delete()
      .eq('tier_id', tierId)

    if (deleteError) throw deleteError

    // Then insert new permissions
    if (permissions.length > 0) {
      const { data, error: insertError } = await supabase
        .from('tier_permissions')
        .insert(
          permissions.map(p => ({
            tier_id: tierId,
            permission_id: p.permission_id,
            limit_value: p.limit_value || null,
            metadata: p.metadata || {}
          }))
        )
        .select()

      if (insertError) throw insertError

      return { data, error: null }
    }

    return { data: [], error: null }
  } catch (error) {
    console.error('Error updating tier permissions:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update tier permissions' }
  }
}

// Update subscription tier details
export async function updateTier(
  tierId: string,
  updates: Partial<SubscriptionTier>
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('subscription_tiers')
      .update(updates)
      .eq('id', tierId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating tier:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update tier' }
  }
}

// Get current user's permissions
export async function getCurrentUserPermissions(): Promise<{
  data: UserPermission[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .rpc('get_user_permissions', { p_user_id: user.id })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching user permissions:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch user permissions' }
  }
}

// Check if current user has a specific permission
export async function checkUserPermission(permissionName: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return false

    const { data, error } = await supabase
      .rpc('user_has_permission', {
        p_user_id: user.id,
        p_permission_name: permissionName
      })

    if (error) throw error

    return data || false
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

// Get user's current subscription
export async function getCurrentUserSubscription() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching user subscription:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch subscription' }
  }
}

// Create or update user subscription (for testing/admin purposes)
export async function updateUserSubscription(
  userId: string,
  tierId: string,
  status: UserSubscription['status'] = 'active'
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        tier_id: tierId,
        status,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating user subscription:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update subscription' }
  }
}

// Create new permission
export async function createPermission(permission: Omit<Permission, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('permissions')
      .insert(permission)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error creating permission:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create permission' }
  }
}

// Update permission
export async function updatePermission(
  permissionId: string,
  updates: Partial<Permission>
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('permissions')
      .update(updates)
      .eq('id', permissionId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating permission:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update permission' }
  }
}

// Delete permission
export async function deletePermission(permissionId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('permissions')
      .delete()
      .eq('id', permissionId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting permission:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete permission' }
  }
}

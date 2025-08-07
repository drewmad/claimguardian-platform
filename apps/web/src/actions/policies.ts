/**
 * @fileMetadata
 * @purpose "Server actions for managing insurance policies"
 * @owner frontend-team
 * @dependencies ["@supabase/supabase-js"]
 * @exports ["createPolicy", "getPolicies", "getPolicy", "updatePolicy", "getActivePolicies"]
 * @complexity medium
 * @tags ["server-action", "policies", "database"]
 * @status stable
 */
'use server'

import { revalidatePath } from 'next/cache'
import { logger } from "@/lib/logger/production-logger"
import { toError } from '@claimguardian/utils'

import { createClient } from '@/lib/supabase/server'
import type {
  CreatePolicyInput
} from '@/types/database-enhancements'

export async function createPolicy(input: CreatePolicyInput) {
  try {
    const supabase = await await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Verify property ownership
    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('id', input.property_id)
      .eq('user_id', user.id)
      .single()

    if (!property) {
      return { data: null, error: 'Property not found or access denied' }
    }

    // Create the policy
    const { data, error } = await supabase
      .from('policies')
      .insert({
        ...input,
        created_by: user.id,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/policies')
    revalidatePath(`/dashboard/property/${input.property_id}`)

    return { data, error: null }
  } catch (error) {
    logger.error('Error creating policy:', toError(error))
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create policy'
    }
  }
}

export async function getPolicies(propertyId?: string) {
  try {
    const supabase = await await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }

    let query = supabase
      .from('active_policies')
      .select('*')

    // If propertyId is provided, filter by it
    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    // Filter by user's properties
    const { data: userProperties } = await supabase
      .from('properties')
      .select('id')
      .eq('user_id', user.id)

    if (!userProperties || userProperties.length === 0) {
      return { data: [], error: null }
    }

    const propertyIds = userProperties.map((p: { id: string }) => p.id)
    query = query.in('property_id', propertyIds)

    const { data, error } = await query.order('expiration_date', { ascending: true })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching policies:', toError(error))
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch policies'
    }
  }
}

export async function getPolicy(policyId: string) {
  try {
    const supabase = await await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Get policy with property info
    const { data, error } = await supabase
      .from('policies')
      .select(`
        *,
        properties!inner(
          id,
          name,
          street_address,
          city,
          state,
          postal_code,
          user_id
        )
      `)
      .eq('id', policyId)
      .single()

    if (error) throw error

    // Verify ownership through property
    if (data.properties.user_id !== user.id) {
      return { data: null, error: 'Policy not found or access denied' }
    }

    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching policy:', toError(error))
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch policy'
    }
  }
}

export async function updatePolicy(policyId: string, updates: Partial<CreatePolicyInput>) {
  try {
    const supabase = await await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Verify ownership through property
    const { data: policy } = await supabase
      .from('policies')
      .select(`
        id,
        properties!inner(user_id)
      `)
      .eq('id', policyId)
      .single()

    if (!policy || !('properties' in policy) || !Array.isArray(policy.properties) || policy.properties.length === 0 || policy.properties[0].user_id !== user.id) {
      return { data: null, error: 'Policy not found or access denied' }
    }

    // Update the policy
    const { data, error } = await supabase
      .from('policies')
      .update(updates)
      .eq('id', policyId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/policies')
    revalidatePath(`/dashboard/policies/${policyId}`)

    return { data, error: null }
  } catch (error) {
    logger.error('Error updating policy:', toError(error))
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update policy'
    }
  }
}

export async function getActivePolicies() {
  try {
    const supabase = await await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Get all active policies for user's properties
    const { data, error } = await supabase
      .from('active_policies')
      .select('*')
      .order('expiration_date', { ascending: true })

    if (error) throw error

    // Filter by user's properties (RLS should handle this, but double-check)
    const { data: userProperties } = await supabase
      .from('properties')
      .select('id')
      .eq('user_id', user.id)

    const propertyIds = userProperties?.map((p: { id: string }) => p.id) || []
    const userPolicies = data?.filter((p: { property_id: string }) => propertyIds.includes(p.property_id)) || []

    return { data: userPolicies, error: null }
  } catch (error) {
    logger.error('Error fetching active policies:', toError(error))
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch active policies'
    }
  }
}

export async function deactivatePolicy(policyId: string) {
  try {
    const supabase = await await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Verify ownership through property
    const { data: policy } = await supabase
      .from('policies')
      .select(`
        id,
        properties!inner(user_id)
      `)
      .eq('id', policyId)
      .single()

    if (!policy || !('properties' in policy) || !Array.isArray(policy.properties) || policy.properties.length === 0 || policy.properties[0].user_id !== user.id) {
      return { data: null, error: 'Policy not found or access denied' }
    }

    // Deactivate the policy
    const { data, error } = await supabase
      .from('policies')
      .update({ is_active: false })
      .eq('id', policyId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/policies')

    return { data, error: null }
  } catch (error) {
    logger.error('Error deactivating policy:', toError(error))
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to deactivate policy'
    }
  }
}

export async function getPoliciesByProperty(propertyId: string) {
  try {
    const supabase = await await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Verify property ownership
    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .single()

    if (!property) {
      return { data: null, error: 'Property not found or access denied' }
    }

    // Get all policies for the property
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .eq('property_id', propertyId)
      .order('is_active', { ascending: false })
      .order('expiration_date', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching policies by property:', toError(error))
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch policies'
    }
  }
}

/**
 * @fileMetadata
 * @purpose "Server actions for API key management and rate limiting administration"
 * @dependencies ["@/lib","next"]
 * @owner api-team
 * @status stable
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { APIKeyManager } from '@/lib/api/api-key-manager'
import { revalidatePath } from 'next/cache'

const apiKeyManager = APIKeyManager.getInstance()

export interface CreateAPIKeyParams {
  name: string
  permissions: string[]
  expiresAt?: Date
}

export interface UpdateAPIKeyParams {
  keyId: string
  permissions: string[]
}

/**
 * Create a new API key for the authenticated user
 */
export async function createAPIKey(params: CreateAPIKeyParams) {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Validate input
    if (!params.name || params.name.trim().length < 3) {
      return { data: null, error: 'API key name must be at least 3 characters long' }
    }

    // Check if user already has 10 or more API keys (limit)
    const existingKeys = await apiKeyManager.listAPIKeys(user.id)
    if (existingKeys.length >= 10) {
      return { data: null, error: 'Maximum of 10 API keys allowed per user' }
    }

    // Generate the API key
    const result = await apiKeyManager.generateAPIKey(
      user.id,
      params.name.trim(),
      params.permissions,
      params.expiresAt
    )

    revalidatePath('/admin/api-keys')
    revalidatePath('/dashboard/api-keys')

    return {
      data: {
        apiKey: result.key,
        plainTextKey: result.plainTextKey
      },
      error: null
    }
  } catch (error) {
    console.error('Failed to create API key:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create API key'
    }
  }
}

/**
 * List API keys for the authenticated user
 */
export async function listAPIKeys() {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    const apiKeys = await apiKeyManager.listAPIKeys(user.id)

    return { data: apiKeys, error: null }
  } catch (error) {
    console.error('Failed to list API keys:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to list API keys'
    }
  }
}

/**
 * Revoke an API key
 */
export async function revokeAPIKey(keyId: string) {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    await apiKeyManager.revokeAPIKey(user.id, keyId)

    revalidatePath('/admin/api-keys')
    revalidatePath('/dashboard/api-keys')

    return { data: { success: true }, error: null }
  } catch (error) {
    console.error('Failed to revoke API key:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to revoke API key'
    }
  }
}

/**
 * Update API key permissions
 */
export async function updateAPIKeyPermissions(params: UpdateAPIKeyParams) {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    await apiKeyManager.updateAPIKeyPermissions(user.id, params.keyId, params.permissions)

    revalidatePath('/admin/api-keys')
    revalidatePath('/dashboard/api-keys')

    return { data: { success: true }, error: null }
  } catch (error) {
    console.error('Failed to update API key permissions:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update API key permissions'
    }
  }
}

/**
 * Get API usage statistics for the authenticated user
 */
export async function getAPIUsageStats(days: number = 30) {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    const stats = await apiKeyManager.getUsageStats(user.id, days)

    return { data: stats, error: null }
  } catch (error) {
    console.error('Failed to get API usage stats:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to get API usage statistics'
    }
  }
}

/**
 * Admin function to get all API keys and usage across all users
 */
export async function adminListAllAPIKeys() {
  try {
    const supabase = await createClient()

    // Verify user authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return { data: null, error: 'Admin access required' }
    }

    // Get all API keys with user information
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select(`
        *,
        user_profiles!inner(email, full_name, tier)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return { data: apiKeys, error: null }
  } catch (error) {
    console.error('Failed to list all API keys:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to list API keys'
    }
  }
}

/**
 * Admin function to get API usage analytics
 */
export async function adminGetAPIAnalytics(days: number = 30) {
  try {
    const supabase = await createClient()

    // Verify user authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return { data: null, error: 'Admin access required' }
    }

    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Get overall API usage statistics
    const { data: usageLogs, error: logsError } = await supabase
      .from('api_usage_logs')
      .select(`
        *,
        api_keys!inner(name),
        user_profiles!inner(email, full_name, tier)
      `)
      .gte('created_at', sinceDate.toISOString())
      .order('created_at', { ascending: false })

    if (logsError) {
      throw new Error(logsError.message)
    }

    // Get rate limit violations
    const { data: rateLimits, error: limitsError } = await supabase
      .from('api_rate_limits')
      .select(`
        *,
        user_profiles!inner(email, full_name, tier)
      `)
      .gt('limit_exceeded_count', 0)
      .gte('created_at', sinceDate.toISOString())
      .order('limit_exceeded_count', { ascending: false })

    if (limitsError) {
      throw new Error(limitsError.message)
    }

    // Calculate analytics
    const analytics = {
      total_requests: usageLogs?.length || 0,
      successful_requests: usageLogs?.filter(log => log.status_code >= 200 && log.status_code < 400).length || 0,
      failed_requests: usageLogs?.filter(log => log.status_code >= 400).length || 0,
      avg_response_time: usageLogs?.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / (usageLogs?.length || 1) || 0,
      rate_limit_violations: rateLimits?.reduce((sum, limit) => sum + limit.limit_exceeded_count, 0) || 0,
      top_users: calculateTopUsers(usageLogs || []),
      top_endpoints: calculateTopEndpoints(usageLogs || []),
      daily_usage: calculateDailyUsage(usageLogs || []),
      rate_limit_violations_by_user: rateLimits || []
    }

    return { data: analytics, error: null }
  } catch (error) {
    console.error('Failed to get API analytics:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to get API analytics'
    }
  }
}


/**
 * Admin function to update tier limits
 */
export async function adminUpdateTierLimits(
  tier: string,
  endpointPattern: string,
  limits: {
    requests_per_day: number
    requests_per_hour?: number
    requests_per_minute?: number
    burst_limit?: number
  }
) {
  try {
    const supabase = await createClient()

    // Verify user authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return { data: null, error: 'Admin access required' }
    }

    // Update or insert tier limits
    const { error } = await supabase
      .from('api_tier_limits')
      .upsert({
        tier,
        endpoint_pattern: endpointPattern,
        ...limits,
        updated_at: new Date()
      })

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/admin/api-keys')

    return { data: { success: true }, error: null }
  } catch (error) {
    console.error('Failed to update tier limits:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update tier limits'
    }
  }
}

// Helper functions for analytics calculation
function calculateTopUsers(usageLogs: Record<string, unknown>[]): Array<{ user: string; requests: number }> {
  const userCounts = usageLogs.reduce((acc, log) => {
    const userProfiles = log.user_profiles as Record<string, unknown> | null
    const userKey = (userProfiles?.email as string) || 'Unknown'
    acc[userKey] = (acc[userKey] as number || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(userCounts)
    .map(([user, requests]) => ({ user, requests: requests as number }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10)
}

function calculateTopEndpoints(usageLogs: Record<string, unknown>[]): Array<{ endpoint: string; requests: number }> {
  const endpointCounts = usageLogs.reduce((acc, log) => {
    const endpoint = (log.endpoint as string) || 'unknown'
    acc[endpoint] = (acc[endpoint] as number || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(endpointCounts)
    .map(([endpoint, requests]) => ({ endpoint, requests: requests as number }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10)
}

function calculateDailyUsage(usageLogs: Record<string, unknown>[]): Array<{ date: string; requests: number }> {
  const dailyCounts = usageLogs.reduce((acc, log) => {
    const createdAt = log.created_at as string
    const date = new Date(createdAt).toISOString().split('T')[0]
    acc[date] = (acc[date] as number || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(dailyCounts)
    .map(([date, requests]) => ({ date, requests: requests as number }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

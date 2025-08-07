/**
 * @fileMetadata
 * @owner @backend-team
 * @purpose "Server actions for insurance policies management"
 * @dependencies ["@supabase/supabase-js"]
 * @status stable
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface InsurancePolicy {
  id: string
  user_id: string
  property_id?: string
  carrier: string
  policy_number: string
  policy_type: string
  effective_date: string
  expiration_date: string
  premium_annual: number
  premium_monthly?: number
  deductible_standard: number
  deductible_wind?: number
  coverage_dwelling: number
  coverage_other_structures: number
  coverage_personal_property: number
  coverage_loss_of_use: number
  coverage_liability: number
  coverage_medical: number
  status: 'active' | 'expired' | 'pending' | 'cancelled'
  agent_name?: string
  agent_phone?: string
  agent_email?: string
  claims_phone?: string
  riders?: string[]
  created_at: string
  updated_at: string
}

export interface PolicyWithProperty extends InsurancePolicy {
  property?: {
    id: string
    name: string
    address: string
    city: string
    state: string
    zip: string
    type: string
    estimated_value: number
  }
}

export async function getUserPolicies(): Promise<{ data: PolicyWithProperty[] | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('insurance_policies')
      .select(`
        *,
        property:properties!property_id (
          id,
          name,
          address,
          city,
          state,
          zip,
          type,
          estimated_value
        )
      `)
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching policies:', error)
      return { data: null, error: error.message }
    }

    return { data: data as PolicyWithProperty[], error: null }
  } catch (error) {
    console.error('Error in getUserPolicies:', error)
    return { data: null, error: 'Failed to fetch policies' }
  }
}

export async function getPolicyById(policyId: string): Promise<{ data: PolicyWithProperty | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('insurance_policies')
      .select(`
        *,
        property:properties!property_id (
          id,
          name,
          address,
          city,
          state,
          zip,
          type,
          estimated_value
        )
      `)
      .eq('id', policyId)
      .eq('user_id', user.user.id)
      .single()

    if (error) {
      console.error('Error fetching policy:', error)
      return { data: null, error: error.message }
    }

    return { data: data as PolicyWithProperty, error: null }
  } catch (error) {
    console.error('Error in getPolicyById:', error)
    return { data: null, error: 'Failed to fetch policy' }
  }
}

export async function createPolicy(policy: Omit<InsurancePolicy, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<{ data: InsurancePolicy | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('insurance_policies')
      .insert({
        ...policy,
        user_id: user.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating policy:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/dashboard/insurance')
    return { data: data as InsurancePolicy, error: null }
  } catch (error) {
    console.error('Error in createPolicy:', error)
    return { data: null, error: 'Failed to create policy' }
  }
}

export async function updatePolicy(policyId: string, updates: Partial<InsurancePolicy>): Promise<{ data: InsurancePolicy | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('insurance_policies')
      .update(updates)
      .eq('id', policyId)
      .eq('user_id', user.user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating policy:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/dashboard/insurance')
    revalidatePath(`/dashboard/insurance/policy/${policyId}`)
    return { data: data as InsurancePolicy, error: null }
  } catch (error) {
    console.error('Error in updatePolicy:', error)
    return { data: null, error: 'Failed to update policy' }
  }
}

export async function deletePolicy(policyId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) {
      return { error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('insurance_policies')
      .delete()
      .eq('id', policyId)
      .eq('user_id', user.user.id)

    if (error) {
      console.error('Error deleting policy:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/insurance')
    return { error: null }
  } catch (error) {
    console.error('Error in deletePolicy:', error)
    return { error: 'Failed to delete policy' }
  }
}

export async function getPolicyClaims(policyId: string): Promise<{ data: any[] | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('policy_id', policyId)
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching claims:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in getPolicyClaims:', error)
    return { data: null, error: 'Failed to fetch claims' }
  }
}

export async function getPolicyDocuments(policyId: string): Promise<{ data: any[] | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('policy_documents')
      .select('*')
      .eq('policy_id', policyId)
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in getPolicyDocuments:', error)
    return { data: null, error: 'Failed to fetch documents' }
  }
}

// Helper function to calculate policy statistics
export async function getPolicyStatistics(): Promise<{
  data: {
    totalCoverage: number
    totalPremium: number
    activePolicies: number
    expiringPolicies: number
    totalClaims: number
  } | null;
  error: string | null
}> {
  try {
    const { data: policies, error } = await getUserPolicies()

    if (error || !policies) {
      return { data: null, error: error || 'No policies found' }
    }

    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const stats = {
      totalCoverage: policies.reduce((sum, p) => sum + (p.coverage_dwelling || 0), 0),
      totalPremium: policies.reduce((sum, p) => sum + (p.premium_annual || 0), 0),
      activePolicies: policies.filter(p => p.status === 'active').length,
      expiringPolicies: policies.filter(p => {
        const expDate = new Date(p.expiration_date)
        return expDate <= thirtyDaysFromNow && p.status === 'active'
      }).length,
      totalClaims: 0 // This would need to be fetched from claims table
    }

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error in getPolicyStatistics:', error)
    return { data: null, error: 'Failed to calculate statistics' }
  }
}

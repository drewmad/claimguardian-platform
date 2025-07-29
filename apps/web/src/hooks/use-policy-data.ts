import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/auth-provider'

interface PolicyDocument {
  id: string
  carrier_name: string | null
  policy_number: string | null
  policy_type: string | null
  effective_date: string | null
  expiration_date: string | null
  dwelling_coverage: number | null
  other_structures_coverage: number | null
  personal_property_coverage: number | null
  loss_of_use_coverage: number | null
  liability_coverage: number | null
  medical_payments_coverage: number | null
  standard_deductible: number | null
  hurricane_deductible: string | null
  flood_deductible: number | null
  extraction_status: string
  special_coverages: Array<{ type: string; limit?: number; deductible?: string }>
  exclusions: string[]
  endorsements: Array<{ name: string; description?: string }>
  created_at: string
}

interface UsePolicyDataReturn {
  policies: PolicyDocument[]
  activePolicy: PolicyDocument | null
  loading: boolean
  error: string | null
  hasPolicies: boolean
  refetch: () => void
}

export function usePolicyData(propertyId?: string): UsePolicyDataReturn {
  const { user } = useAuth()
  const { supabase } = useSupabase()
  const [policies, setPolicies] = useState<PolicyDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPolicies = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('policy_documents_extended')
        .select('*')
        .eq('user_id', user.id)
        .eq('extraction_status', 'completed')
        .order('created_at', { ascending: false })

      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      setPolicies(data || [])
    } catch (err) {
      console.error('Error fetching policies:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch policies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicies()
  }, [user, propertyId])

  // Find the active policy (not expired)
  const activePolicy = policies.find(policy => {
    if (!policy.expiration_date) return false
    return new Date(policy.expiration_date) > new Date()
  }) || null

  return {
    policies,
    activePolicy,
    loading,
    error,
    hasPolicies: policies.length > 0,
    refetch: fetchPolicies
  }
}

export function formatCoverage(amount: number | null): string {
  if (!amount) return 'Not specified'
  return `$${amount.toLocaleString()}`
}

export function formatDeductible(deductible: string | number | null): string {
  if (!deductible) return 'Not specified'
  if (typeof deductible === 'string') return deductible
  return `$${deductible.toLocaleString()}`
}

export function getPolicyCoverageInfo(policy: PolicyDocument) {
  return {
    dwelling: formatCoverage(policy.dwelling_coverage),
    deductible: formatDeductible(policy.standard_deductible),
    hurricane: formatDeductible(policy.hurricane_deductible),
    hasFloodCoverage: policy.special_coverages?.some(c => 
      c.type?.toLowerCase().includes('flood')
    ) || false,
    hasSinkholeCovetage: policy.special_coverages?.some(c => 
      c.type?.toLowerCase().includes('sinkhole')
    ) || false,
    isActive: policy.expiration_date ? new Date(policy.expiration_date) > new Date() : false
  }
}
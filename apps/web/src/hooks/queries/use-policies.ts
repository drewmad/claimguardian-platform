import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getPolicies, 
  getPolicy, 
  createPolicy, 
  updatePolicy,
  getActivePolicies 
} from '@/actions/policies'
import type { CreatePolicyInput } from '@/types/database-enhancements'
import { toast } from 'sonner'

// Query keys factory
export const policyKeys = {
  all: ['policies'] as const,
  lists: () => [...policyKeys.all, 'list'] as const,
  list: (propertyId?: string) => [...policyKeys.lists(), { propertyId }] as const,
  active: () => [...policyKeys.all, 'active'] as const,
  details: () => [...policyKeys.all, 'detail'] as const,
  detail: (id: string) => [...policyKeys.details(), id] as const,
}

// Fetch all policies
export function usePolicies(propertyId?: string) {
  return useQuery({
    queryKey: policyKeys.list(propertyId),
    queryFn: () => getPolicies(propertyId!),
    enabled: !!propertyId,
    select: (result) => result.data,
  })
}

// Fetch single policy
export function usePolicy(id: string) {
  return useQuery({
    queryKey: policyKeys.detail(id),
    queryFn: () => getPolicy(id),
    enabled: !!id,
    select: (result) => result.data,
  })
}

// Fetch active policies
export function useActivePolicies(propertyId?: string) {
  return useQuery({
    queryKey: policyKeys.active(),
    queryFn: () => getActivePolicies(propertyId!),
    enabled: !!propertyId,
    select: (result) => result.data,
  })
}

// Create policy mutation
export function useCreatePolicy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: CreatePolicyInput) => createPolicy(input),
    onSuccess: (result, variables) => {
      if (result.data) {
        // Invalidate and refetch policies list
        queryClient.invalidateQueries({ queryKey: policyKeys.lists() })
        queryClient.invalidateQueries({ queryKey: policyKeys.active() })
        toast.success('Policy created successfully')
      } else {
        toast.error(result.error || 'Failed to create policy')
      }
    },
    onError: (error) => {
      toast.error('An unexpected error occurred')
      console.error('Policy creation error:', error)
    },
  })
}

// Update policy mutation
export function useUpdatePolicy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      updatePolicy(id, updates),
    onSuccess: (result, variables) => {
      if (result.data) {
        // Update the specific policy in cache
        queryClient.setQueryData(
          policyKeys.detail(variables.id),
          { data: result.data, error: null }
        )
        // Invalidate lists to ensure consistency
        queryClient.invalidateQueries({ queryKey: policyKeys.lists() })
        toast.success('Policy updated successfully')
      } else {
        toast.error(result.error || 'Failed to update policy')
      }
    },
    onError: (error) => {
      toast.error('An unexpected error occurred')
      console.error('Policy update error:', error)
    },
  })
}
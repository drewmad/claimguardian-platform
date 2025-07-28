import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Database } from '@claimguardian/db'

type Property = Database['public']['Tables']['properties']['Row']
type PropertyInsert = Database['public']['Tables']['properties']['Insert']
type PropertyUpdate = Database['public']['Tables']['properties']['Update']

// Query keys factory
export const propertyKeys = {
  all: ['properties'] as const,
  lists: () => [...propertyKeys.all, 'list'] as const,
  list: (userId?: string) => [...propertyKeys.lists(), { userId }] as const,
  details: () => [...propertyKeys.all, 'detail'] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
}

// Fetch user's properties
export function useProperties() {
  const supabase = createClient()
  
  return useQuery({
    queryKey: propertyKeys.lists(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
  })
}

// Fetch single property
export function useProperty(id: string) {
  const supabase = createClient()
  
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

// Create property mutation
export function useCreateProperty() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  
  return useMutation({
    mutationFn: async (input: Omit<PropertyInsert, 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      const { data, error } = await supabase
        .from('properties')
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Add the new property to the list cache
      queryClient.setQueryData<Property[]>(
        propertyKeys.lists(),
        (old) => old ? [data, ...old] : [data]
      )
      toast.success('Property created successfully')
    },
    onError: (error) => {
      toast.error('Failed to create property')
      console.error('Property creation error:', error)
    },
  })
}

// Update property mutation
export function useUpdateProperty() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Omit<PropertyUpdate, 'updated_at'> 
    }) => {
      const { data, error } = await supabase
        .from('properties')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Update the specific property in cache
      queryClient.setQueryData(propertyKeys.detail(data.id), data)
      
      // Update the property in the list cache
      queryClient.setQueryData<Property[]>(
        propertyKeys.lists(),
        (old) => old?.map(p => p.id === data.id ? data : p) || []
      )
      
      toast.success('Property updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update property')
      console.error('Property update error:', error)
    },
  })
}

// Delete property mutation
export function useDeleteProperty() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return id
    },
    onSuccess: (id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: propertyKeys.detail(id) })
      
      // Remove from list cache
      queryClient.setQueryData<Property[]>(
        propertyKeys.lists(),
        (old) => old?.filter(p => p.id !== id) || []
      )
      
      toast.success('Property deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete property')
      console.error('Property deletion error:', error)
    },
  })
}
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logger } from "@/lib/logger/production-logger"

import {
  uploadDocument,
  getDocumentInsights,
  uploadPolicyDocument,
  getPolicyDocuments,
  deletePolicyDocument,
  getDocumentDownloadUrl,
  createDocumentRecord,
} from '@/actions/documents'

// Query keys factory
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters?: { propertyId?: string }) =>
    [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  urls: () => [...documentKeys.all, 'url'] as const,
  url: (id: string) => [...documentKeys.urls(), id] as const,
}

// Fetch documents list
export function useDocuments(propertyId: string) {
  return useQuery({
    queryKey: documentKeys.list({ propertyId }),
    queryFn: () => getPolicyDocuments(propertyId),
    enabled: !!propertyId,
    select: (result) => result.data,
  })
}

// Fetch document URL (with caching)
export function useDocumentUrl(id: string) {
  return useQuery({
    queryKey: documentKeys.url(id),
    queryFn: () => getDocumentDownloadUrl(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    select: (result) => result.data,
  })
}

// Upload document mutation
export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadPolicyDocument,
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate documents list
        queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
        toast.success('Document uploaded successfully')
      } else {
        toast.error(result.error || 'Failed to upload document')
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to upload document')
      logger.error('Document upload error:', error)
    },
  })
}

// Create document record mutation
export function useCreateDocumentRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createDocumentRecord,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
        toast.success('Document record created')
      } else {
        toast.error(result.error || 'Failed to create document record')
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to create document record')
      logger.error('Document record creation error:', error)
    },
  })
}

// Delete document mutation
export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deletePolicyDocument(id),
    onSuccess: (result, id) => {
      if (result.success) {
        // Remove from cache
        queryClient.removeQueries({ queryKey: documentKeys.detail(id) })
        queryClient.removeQueries({ queryKey: documentKeys.url(id) })
        // Invalidate lists
        queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
        toast.success('Document deleted successfully')
      } else {
        toast.error(result.error || 'Failed to delete document')
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to delete document')
      logger.error('Document deletion error:', error)
    },
  })
}

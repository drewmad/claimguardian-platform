import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  uploadDocument,
  getDocuments,
  deleteDocument,
  updateDocument,
  getDocumentUrl,
  getDocument
} from '@/actions/documents'
import { toast } from 'sonner'

// Query keys factory
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters?: { propertyId?: string; claimId?: string; category?: string }) => 
    [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  urls: () => [...documentKeys.all, 'url'] as const,
  url: (id: string) => [...documentKeys.urls(), id] as const,
}

// Fetch documents list
export function useDocuments(filters?: { 
  propertyId?: string; 
  claimId?: string; 
  category?: string 
}) {
  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: () => getDocuments(filters),
    select: (result) => result.data,
  })
}

// Fetch single document
export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => getDocument(id),
    enabled: !!id,
    select: (result) => result.data,
  })
}

// Fetch document URL (with caching)
export function useDocumentUrl(id: string) {
  return useQuery({
    queryKey: documentKeys.url(id),
    queryFn: () => getDocumentUrl(id),
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
    mutationFn: async ({ 
      file, 
      ...metadata 
    }: { 
      file: File;
      name: string;
      category: string;
      property_id?: string;
      claim_id?: string;
      description?: string;
    }) => {
      const formData = new FormData()
      formData.append('file', file)
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, String(value))
        }
      })
      return uploadDocument(formData)
    },
    onSuccess: (result) => {
      if (result.data) {
        // Invalidate documents list
        queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
        toast.success('Document uploaded successfully')
      } else {
        toast.error(result.error || 'Failed to upload document')
      }
    },
    onError: (error) => {
      toast.error('Failed to upload document')
      console.error('Document upload error:', error)
    },
  })
}

// Update document mutation
export function useUpdateDocument() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: unknown }) => 
      updateDocument(id, updates),
    onSuccess: (result, variables) => {
      if (result.data) {
        // Update the specific document in cache
        queryClient.setQueryData(
          documentKeys.detail(variables.id),
          { data: result.data, error: null }
        )
        // Invalidate lists
        queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
        toast.success('Document updated successfully')
      } else {
        toast.error(result.error || 'Failed to update document')
      }
    },
    onError: (error) => {
      toast.error('Failed to update document')
      console.error('Document update error:', error)
    },
  })
}

// Delete document mutation
export function useDeleteDocument() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: (result, id) => {
      if (result.data) {
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
    onError: (error) => {
      toast.error('Failed to delete document')
      console.error('Document deletion error:', error)
    },
  })
}
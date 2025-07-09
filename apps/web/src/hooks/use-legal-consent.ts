/**
 * @fileMetadata
 * @purpose Custom hook for legal consent management
 * @owner legal-team
 * @dependencies ["react", "swr", "@/lib/legal"]
 * @exports ["useLegalConsent"]
 * @complexity medium
 * @tags ["hook", "legal", "consent"]
 * @status active
 */

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { legalService, type LegalDocument } from '@/lib/legal/legal-service'
import { logger } from '@/lib/logger'

interface UseLegalConsentOptions {
  userId?: string
  mode?: 'all' | 'needed'
  autoFetch?: boolean
}

interface UseLegalConsentReturn {
  documents: LegalDocument[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<LegalDocument[] | undefined>
  recordAcceptances: (documentIds: string[]) => Promise<void>
  hasOutstandingConsents: boolean
  acceptanceStatus: Record<string, boolean>
  setAcceptanceStatus: (status: Record<string, boolean>) => void
}

export function useLegalConsent({
  userId,
  mode = 'all',
  autoFetch = true
}: UseLegalConsentOptions = {}): UseLegalConsentReturn {
  const [acceptanceStatus, setAcceptanceStatus] = useState<Record<string, boolean>>({})
  const [recordingAcceptances, setRecordingAcceptances] = useState(false)

  // Create cache key based on parameters
  const cacheKey = userId && mode === 'needed' 
    ? `legal-documents-needed-${userId}`
    : 'legal-documents-active'

  // Fetcher function
  const fetcher = useCallback(async (): Promise<LegalDocument[]> => {
    if (mode === 'needed' && userId) {
      return legalService.getDocumentsNeedingAcceptance(userId)
    }
    return legalService.getActiveLegalDocuments()
  }, [userId, mode])

  // SWR hook for data fetching
  const { 
    data: documents = [], 
    error, 
    isLoading: loading,
    mutate: refetch 
  } = useSWR(
    autoFetch ? cacheKey : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      errorRetryCount: 3,
      onSuccess: (data) => {
        // Initialize acceptance status for new documents
        const newStatus: Record<string, boolean> = {}
        data.forEach(doc => {
          if (!(doc.id in acceptanceStatus)) {
            newStatus[doc.id] = false
          }
        })
        if (Object.keys(newStatus).length > 0) {
          setAcceptanceStatus(prev => ({ ...prev, ...newStatus }))
        }
      }
    }
  )

  // Check if there are outstanding consents needed
  const hasOutstandingConsents = documents.length > 0

  // Record user acceptances
  const recordAcceptances = useCallback(async (documentIds: string[]) => {
    if (!userId || recordingAcceptances) return

    try {
      setRecordingAcceptances(true)
      
      // Get client metadata
      const metadata = legalService.getClientMetadata()
      
      // Prepare acceptance requests
      const acceptances = documentIds.map(docId => ({
        legal_id: docId,
        ...metadata,
        signature_data: {
          timestamp: new Date().toISOString(),
          method: 'hook',
          documents_count: documentIds.length
        }
      }))

      // Record acceptances via service
      await legalService.recordAcceptances(userId, acceptances)

      // Update local state
      const newStatus = { ...acceptanceStatus }
      documentIds.forEach(docId => {
        newStatus[docId] = true
      })
      setAcceptanceStatus(newStatus)

      // Refetch to get updated data
      await refetch()

      logger.track('legal_consent_recorded_via_hook', {
        userId,
        documentCount: documentIds.length,
        documents: documentIds
      })

    } catch (err) {
      logger.error('Failed to record legal acceptances', err)
      throw err
    } finally {
      setRecordingAcceptances(false)
    }
  }, [userId, acceptanceStatus, refetch, recordingAcceptances])

  return {
    documents,
    loading: loading || recordingAcceptances,
    error,
    refetch,
    recordAcceptances,
    hasOutstandingConsents,
    acceptanceStatus,
    setAcceptanceStatus
  }
}

// Hook for checking if user needs to accept documents (for auth guards)
export function useRequiredConsent(userId?: string) {
  const { hasOutstandingConsents, loading, documents } = useLegalConsent({
    userId,
    mode: 'needed',
    autoFetch: !!userId
  })

  return {
    needsConsent: hasOutstandingConsents,
    loading,
    outstandingDocuments: documents,
    documentCount: documents.length
  }
}
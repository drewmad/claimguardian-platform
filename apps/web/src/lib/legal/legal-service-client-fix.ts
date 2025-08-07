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
/**
 * Temporary fix for legal service to use API endpoint
 */

import { LegalDocument, LegalDocumentType } from '@claimguardian/db'

import { logger } from '@/lib/logger'

class LegalServiceClientFix {
  /**
   * Get all active legal documents
   */
  async getActiveLegalDocuments(): Promise<LegalDocument[]> {
    try {
      const response = await fetch('/api/legal/documents')

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch legal documents')
      }

      const { data } = await response.json()
      return data || []
    } catch (error) {
      logger.error('Failed to fetch legal documents', {}, error as Error)
      throw error
    }
  }

  /**
   * Get documents that need user acceptance
   */
  async getDocumentsNeedingAcceptance(userId: string): Promise<LegalDocument[]> {
    try {
      const response = await fetch(`/api/legal/documents?mode=needed&userId=${userId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch documents needing acceptance')
      }

      const { data } = await response.json()
      return data || []
    } catch (error) {
      logger.error('Failed to fetch documents needing acceptance', { userId }, error as Error)
      throw error
    }
  }

  /**
   * Get a specific legal document by type
   */
  async getDocumentByType(type: LegalDocumentType): Promise<LegalDocument | null> {
    try {
      // First try the database endpoint
      let response = await fetch(`/api/legal/documents?type=${type}`)

      if (!response.ok || response.status === 500) {
        // Fallback to static endpoint
        response = await fetch(`/api/legal/static?type=${type}`)

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to fetch legal document')
        }

        const { data } = await response.json()
        return data || null
      }

      const { data } = await response.json()
      return data?.[0] || null
    } catch (error) {
      logger.error('Failed to fetch legal document by type', { type }, error as Error)
      throw error
    }
  }

  /**
   * Get legal document content by slug
   */
  async getDocumentContent(slug: string): Promise<string> {
    try {
      const response = await fetch(`/api/legal/${slug}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch document content')
      }

      // Check if response is HTML or JSON
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('text/html')) {
        return await response.text()
      } else {
        const { data } = await response.json()
        return data?.content || ''
      }
    } catch (error) {
      logger.error('Failed to fetch document content', { slug }, error as Error)
      throw error
    }
  }
}

export const legalServiceClientFix = new LegalServiceClientFix()

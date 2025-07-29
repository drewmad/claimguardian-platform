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
      const response = await fetch(`/api/legal/documents?type=${type}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch legal document')
      }
      
      const { data } = await response.json()
      return data?.[0] || null
    } catch (error) {
      logger.error('Failed to fetch legal document by type', { type }, error as Error)
      throw error
    }
  }
}

export const legalServiceClientFix = new LegalServiceClientFix()
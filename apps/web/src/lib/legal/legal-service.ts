/**
 * @fileMetadata
 * @purpose Legal documents and consent tracking service
 * @owner legal-team
 * @dependencies ["@supabase/supabase-js", "@/lib/logger"]
 * @exports ["legalService"]
 * @complexity medium
 * @tags ["legal", "compliance", "consent", "gdpr"]
 * @status active
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface LegalDocument {
  id: string
  slug: string
  title: string
  version: string
  effective_date: string
  sha256_hash: string
  storage_url: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserLegalAcceptance {
  user_id: string
  legal_id: string
  accepted_at: string
  ip_address: string
  user_agent: string
  signature_data?: Record<string, any>
  revoked_at?: string
}

export interface AcceptanceRequest {
  legal_id: string
  ip_address?: string
  user_agent?: string
  signature_data?: Record<string, any>
}

class LegalService {
  /**
   * Get all active legal documents
   */
  async getActiveLegalDocuments(): Promise<LegalDocument[]> {
    try {
      const { data, error } = await supabase.rpc('get_active_legal_documents')

      if (error) {
        logger.error('Failed to fetch active legal documents', error)
        throw error
      }

      return data || []
    } catch (err) {
      logger.error('Error fetching active legal documents', err)
      throw err
    }
  }

  /**
   * Get documents that need user acceptance
   */
  async getDocumentsNeedingAcceptance(userId: string): Promise<LegalDocument[]> {
    try {
      const { data, error } = await supabase.rpc('needs_reaccept', { uid: userId })

      if (error) {
        logger.error('Failed to fetch documents needing acceptance', error)
        throw error
      }

      return data || []
    } catch (err) {
      logger.error('Error fetching documents needing acceptance', err)
      throw err
    }
  }

  /**
   * Record user acceptance of legal documents
   */
  async recordAcceptances(
    userId: string,
    acceptances: AcceptanceRequest[]
  ): Promise<void> {
    try {
      const acceptancePromises = acceptances.map(acceptance =>
        supabase.rpc('record_legal_acceptance', {
          p_user_id: userId,
          p_legal_id: acceptance.legal_id,
          p_ip_address: acceptance.ip_address,
          p_user_agent: acceptance.user_agent,
          p_signature_data: acceptance.signature_data || null
        })
      )

      const results = await Promise.all(acceptancePromises)
      
      // Check for any errors
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        logger.error('Failed to record some acceptances', errors)
        throw new Error('Failed to record legal acceptances')
      }

      logger.info('Legal acceptances recorded successfully', {
        userId,
        count: acceptances.length,
        documents: acceptances.map(a => a.legal_id)
      })
    } catch (err) {
      logger.error('Error recording legal acceptances', err)
      throw err
    }
  }

  /**
   * Get user's legal acceptance history
   */
  async getUserAcceptanceHistory(userId: string): Promise<UserLegalAcceptance[]> {
    try {
      const { data, error } = await supabase
        .from('user_legal_acceptance')
        .select(`
          *,
          legal_documents (
            slug,
            title,
            version,
            effective_date
          )
        `)
        .eq('user_id', userId)
        .order('accepted_at', { ascending: false })

      if (error) {
        logger.error('Failed to fetch user acceptance history', error)
        throw error
      }

      return data || []
    } catch (err) {
      logger.error('Error fetching user acceptance history', err)
      throw err
    }
  }

  /**
   * Revoke user consent (GDPR compliance)
   */
  async revokeConsent(userId: string, legalId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_legal_acceptance')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('legal_id', legalId)

      if (error) {
        logger.error('Failed to revoke consent', error)
        throw error
      }

      logger.info('Consent revoked successfully', { userId, legalId })
    } catch (err) {
      logger.error('Error revoking consent', err)
      throw err
    }
  }

  /**
   * Check if user has accepted all required documents
   */
  async hasUserAcceptedAllRequired(userId: string): Promise<boolean> {
    try {
      const outstandingDocs = await this.getDocumentsNeedingAcceptance(userId)
      return outstandingDocs.length === 0
    } catch (err) {
      logger.error('Error checking user acceptance status', err)
      return false
    }
  }

  /**
   * Get legal document by slug (for display)
   */
  async getLegalDocumentBySlug(slug: string): Promise<LegalDocument | null> {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null
        }
        logger.error('Failed to fetch legal document by slug', error)
        throw error
      }

      return data
    } catch (err) {
      logger.error('Error fetching legal document by slug', err)
      throw err
    }
  }

  /**
   * Generate compliance report for user (GDPR/CCPA)
   */
  async generateComplianceReport(userId: string): Promise<{
    user_id: string
    acceptances: UserLegalAcceptance[]
    outstanding_documents: LegalDocument[]
    generated_at: string
  }> {
    try {
      const [acceptances, outstanding] = await Promise.all([
        this.getUserAcceptanceHistory(userId),
        this.getDocumentsNeedingAcceptance(userId)
      ])

      return {
        user_id: userId,
        acceptances,
        outstanding_documents: outstanding,
        generated_at: new Date().toISOString()
      }
    } catch (err) {
      logger.error('Error generating compliance report', err)
      throw err
    }
  }

  /**
   * Validate document hash (for integrity verification)
   */
  async validateDocumentHash(documentId: string, expectedHash: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('sha256_hash')
        .eq('id', documentId)
        .single()

      if (error || !data) {
        logger.error('Failed to fetch document for hash validation', error)
        return false
      }

      const isValid = data.sha256_hash === expectedHash
      
      if (!isValid) {
        logger.warn('Document hash validation failed', {
          documentId,
          expected: expectedHash,
          actual: data.sha256_hash
        })
      }

      return isValid
    } catch (err) {
      logger.error('Error validating document hash', err)
      return false
    }
  }

  /**
   * Get client IP and user agent for acceptance recording
   */
  getClientMetadata(request?: Request): {
    ip_address?: string
    user_agent?: string
  } {
    if (typeof window !== 'undefined') {
      // Client side - limited info
      return {
        user_agent: navigator.userAgent
      }
    }

    if (request) {
      // Server side - full info
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') ||
                 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      return {
        ip_address: ip,
        user_agent: userAgent
      }
    }

    return {}
  }
}

export const legalService = new LegalService()
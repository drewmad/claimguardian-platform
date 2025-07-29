/**
 * @fileMetadata
 * @purpose Server-side legal documents and consent tracking service
 * @owner legal-team
 * @dependencies ["@supabase/supabase-js", "@/lib/logger"]
 * @exports ["legalServiceServer"]
 * @complexity medium
 * @tags ["legal", "compliance", "consent", "gdpr", "server"]
 * @status active
 */

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@claimguardian/db'
import { logger } from '@/lib/logger'
import type { LegalDocument, UserConsent } from '@claimguardian/db'

// Define AcceptanceRequest interface
interface AcceptanceRequest {
  legal_id: string
  ip_address?: string
  user_agent?: string
  signature_data?: {
    timestamp: string
    method?: string
    page_url?: string
    request_id?: string
    user_agent_hash?: string | null
  }
}

class LegalServiceServer {
  /**
   * Get all active legal documents
   */
  async getActiveLegalDocuments(): Promise<LegalDocument[]> {
    try {
      // Use service role client to bypass RLS for legal documents
      const supabase = createServiceRoleClient()
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('is_active', true)
        .eq('requires_acceptance', true)
        .order('type')

      if (error) {
        logger.error('Failed to fetch active legal documents', {}, error)
        throw error
      }

      return data || []
    } catch (error) {
      logger.error('Error fetching active legal documents', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * Get documents that need user acceptance
   */
  async getDocumentsNeedingAcceptance(userId: string): Promise<LegalDocument[]> {
    try {
      // Use service role client to bypass RLS for legal documents
      const supabase = createServiceRoleClient()
      
      // For now, return all active documents that require acceptance
      // In the future, this should check user's acceptance history
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('is_active', true)
        .eq('requires_acceptance', true)
        .order('type')

      if (error) {
        logger.error('Failed to fetch documents needing acceptance', { userId }, error)
        throw error
      }

      return data || []
    } catch (error) {
      logger.error('Error fetching documents needing acceptance', { userId }, error instanceof Error ? error : new Error(String(error)))
      throw error
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
      const supabase = await createClient()
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
        logger.error('Failed to record some acceptances', { errors })
        throw new Error('Failed to record legal acceptances')
      }

      logger.info('Legal acceptances recorded successfully', {
        userId,
        count: acceptances.length,
        documents: acceptances.map(a => a.legal_id)
      })
    } catch (error) {
      logger.error('Error recording legal acceptances', { userId }, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * Get user's legal acceptance history
   */
  async getUserAcceptanceHistory(userId: string): Promise<UserConsent[]> {
    try {
      const supabase = await createClient()
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
        logger.error('Failed to fetch user acceptance history', {}, error instanceof Error ? error : new Error(String(error)))
        throw error
      }

      return data || []
    } catch (error) {
      logger.error('Error fetching user acceptance history', { userId }, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * Check if user has accepted all required documents
   */
  async hasUserAcceptedAllRequired(userId: string): Promise<boolean> {
    try {
      const outstandingDocs = await this.getDocumentsNeedingAcceptance(userId)
      return outstandingDocs.length === 0
    } catch (error) {
      logger.error('Error checking user acceptance status', { userId }, error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  /**
   * Get legal document by slug (for display)
   */
  async getLegalDocumentBySlug(slug: string): Promise<LegalDocument | null> {
    try {
      // Use service role client to bypass RLS for legal documents
      const supabase = createServiceRoleClient()
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
        logger.error('Failed to fetch legal document by slug', {}, error instanceof Error ? error : new Error(String(error)))
        throw error
      }

      return data
    } catch (error) {
      logger.error('Error fetching legal document by slug', { slug }, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * Generate compliance report for user (GDPR/CCPA)
   */
  async generateComplianceReport(userId: string): Promise<{
    user_id: string
    acceptances: UserConsent[]
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
    } catch (error) {
      logger.error('Error generating compliance report', { userId }, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * Validate document hash (for integrity verification)
   */
  async validateDocumentHash(documentId: string, expectedHash: string): Promise<boolean> {
    try {
      // Use service role client to bypass RLS for legal documents
      const supabase = createServiceRoleClient()
      const { data, error } = await supabase
        .from('legal_documents')
        .select('sha256_hash')
        .eq('id', documentId)
        .single()

      if (error || !data) {
        logger.error('Failed to fetch document for hash validation', {}, error instanceof Error ? error : new Error(String(error)))
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
    } catch (error) {
      logger.error('Error validating document hash', { documentId }, error instanceof Error ? error : new Error(String(error)))
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

export const legalServiceServer = new LegalServiceServer()
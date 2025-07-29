/**
 * @fileMetadata
 * @purpose Enhanced legal service for comprehensive consent tracking
 * @owner legal-team
 * @status active
 */

import { createClient } from '@/lib/supabase/client'
import type {
  LegalDocument,
  UserConsent,
  ConsentStatus,
  LegalDocumentType,
  ConsentActionType,
  Geolocation
} from '@claimguardian/db'
import { logger } from '@/lib/logger'

class LegalService {
  private supabase = createClient()

  /**
   * Get all active legal documents
   */
  async getActiveLegalDocuments(): Promise<LegalDocument[]> {
    try {
      const { data, error } = await this.supabase
        .from('legal_documents')
        .select('*')
        .eq('is_active', true)
        .eq('requires_acceptance', true)
        .order('type')

      if (error) throw error

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
      // Get user's consent status
      const { data: consentStatus, error: statusError } = await this.supabase
        .rpc('get_user_consent_status', { p_user_id: userId })

      if (statusError) throw statusError

      // Filter documents that need update
      const docsNeedingUpdate = consentStatus
        ?.filter((status: any) => status.needs_update)
        .map((status: any) => status.document_type) || []

      if (docsNeedingUpdate.length === 0) return []

      // Fetch the actual documents
      const { data, error } = await this.supabase
        .from('legal_documents')
        .select('*')
        .eq('is_active', true)
        .in('type', docsNeedingUpdate)

      if (error) throw error

      return data || []
    } catch (error) {
      logger.error('Failed to fetch documents needing acceptance', { userId }, error as Error)
      throw error
    }
  }

  /**
   * Get user's consent status for all document types
   */
  async getUserConsentStatus(userId: string): Promise<ConsentStatus[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_user_consent_status', { p_user_id: userId })

      if (error) throw error

      return data || []
    } catch (error) {
      logger.error('Failed to fetch user consent status', { userId }, error as Error)
      throw error
    }
  }

  /**
   * Record user consent with full tracking data
   */
  async recordConsent({
    userId,
    documentId,
    action,
    ipAddress,
    userAgent,
    deviceFingerprint,
    geolocation,
    sessionId,
    consentMethod,
    referrerUrl,
    pageUrl
  }: {
    userId: string
    documentId: string
    action: ConsentActionType
    ipAddress: string
    userAgent?: string
    deviceFingerprint?: string
    geolocation?: Geolocation
    sessionId?: string
    consentMethod?: string
    referrerUrl?: string
    pageUrl?: string
  }): Promise<string> {
    try {
      const metadata = {
        geolocation,
        sessionId,
        consentMethod,
        referrerUrl,
        pageUrl,
        timestamp: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .rpc('record_user_consent', {
          p_user_id: userId,
          p_document_id: documentId,
          p_action: action,
          p_ip_address: ipAddress,
          p_user_agent: userAgent,
          p_device_fingerprint: deviceFingerprint,
          p_metadata: metadata
        })

      if (error) throw error

      logger.track('legal_consent_recorded', {
        userId,
        documentId,
        action,
        ipAddress
      })

      return data
    } catch (error) {
      logger.error('Failed to record consent', { userId, documentId }, error as Error)
      throw error
    }
  }

  /**
   * Record multiple consents at once (e.g., during signup)
   */
  async recordMultipleConsents({
    userId,
    documentIds,
    ipAddress,
    userAgent,
    deviceFingerprint,
    geolocation,
    consentMethod = 'signup'
  }: {
    userId: string
    documentIds: string[]
    ipAddress: string
    userAgent?: string
    deviceFingerprint?: string
    geolocation?: Geolocation
    consentMethod?: string
  }): Promise<void> {
    try {
      const promises = documentIds.map(documentId =>
        this.recordConsent({
          userId,
          documentId,
          action: 'accepted',
          ipAddress,
          userAgent,
          deviceFingerprint,
          geolocation,
          consentMethod
        })
      )

      await Promise.all(promises)

      logger.track('multiple_consents_recorded', {
        userId,
        documentCount: documentIds.length,
        consentMethod
      })
    } catch (error) {
      logger.error('Failed to record multiple consents', { userId }, error as Error)
      throw error
    }
  }

  /**
   * Get user's consent history
   */
  async getUserConsentHistory(userId: string): Promise<UserConsent[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_consents')
        .select(`
          *,
          legal_documents (
            type,
            version,
            title
          )
        `)
        .eq('user_id', userId)
        .order('consented_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      logger.error('Failed to fetch consent history', { userId }, error as Error)
      throw error
    }
  }

  /**
   * Check if user has accepted all required documents
   */
  async hasAcceptedAllRequiredDocuments(userId: string): Promise<boolean> {
    try {
      const consentStatus = await this.getUserConsentStatus(userId)
      
      return consentStatus.every(status => 
        status.is_accepted && !status.needs_update
      )
    } catch (error) {
      logger.error('Failed to check document acceptance', { userId }, error as Error)
      return false
    }
  }

  /**
   * Get specific document by type
   */
  async getDocumentByType(type: LegalDocumentType): Promise<LegalDocument | null> {
    try {
      const { data, error } = await this.supabase
        .from('legal_documents')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return data
    } catch (error) {
      logger.error('Failed to fetch document by type', { type }, error as Error)
      throw error
    }
  }

  /**
   * Validate document hash for integrity
   */
  async validateDocumentHash(documentId: string, hash: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('legal_documents')
        .select('sha256_hash')
        .eq('id', documentId)
        .single()

      if (error) throw error

      return data?.sha256_hash === hash
    } catch (error) {
      logger.error('Failed to validate document hash', { documentId }, error as Error)
      return false
    }
  }

  /**
   * Get device fingerprint information
   */
  async getDeviceInfo(): Promise<{
    fingerprint: string
    userAgent: string
    timezone: string
    language: string
    platform: string
    screenResolution: string
  }> {
    // This would typically use a library like FingerprintJS
    // For now, we'll create a basic fingerprint
    const nav = navigator
    const screen = window.screen
    
    const fingerprint = await this.generateFingerprint()
    
    return {
      fingerprint,
      userAgent: nav.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: nav.language,
      platform: nav.platform,
      screenResolution: `${screen.width}x${screen.height}`
    }
  }

  /**
   * Generate device fingerprint
   */
  private async generateFingerprint(): Promise<string> {
    // Basic fingerprinting - in production, use FingerprintJS
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px "Arial"'
      ctx.textBaseline = 'alphabetic'
      ctx.fillStyle = '#f60'
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = '#069'
      ctx.fillText('ClaimGuardian', 2, 15)
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
      ctx.fillText('ClaimGuardian', 4, 17)
    }
    
    const canvasData = canvas.toDataURL()
    
    // Combine with other browser properties
    const fingerPrintData = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvasData
    ].join('|')
    
    // Hash the fingerprint data
    const msgUint8 = new TextEncoder().encode(fingerPrintData)
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    return hashHex
  }

  /**
   * Get user's IP and geolocation
   */
  async getUserLocationData(): Promise<{
    ip: string
    geolocation?: Geolocation
  }> {
    try {
      // Use a geolocation API service
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      
      return {
        ip: data.ip,
        geolocation: {
          country: data.country_name,
          country_code: data.country_code,
          region: data.region,
          city: data.city,
          postal_code: data.postal,
          lat: data.latitude,
          lon: data.longitude,
          timezone: data.timezone
        }
      }
    } catch (error) {
      logger.warn('Failed to get location data', {})
      // Fallback to just IP
      return {
        ip: 'unknown'
      }
    }
  }

  /**
   * Get legal document by slug (for display)
   */
  async getLegalDocumentBySlug(slug: string): Promise<LegalDocument | null> {
    try {
      const { data, error } = await this.supabase
        .from('legal_documents')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return data
    } catch (error) {
      logger.error('Failed to fetch document by slug', { slug }, error as Error)
      throw error
    }
  }

  /**
   * Generate compliance report for user (GDPR/CCPA)
   */
  async generateComplianceReport(userId: string): Promise<{
    user_id: string
    consent_status: ConsentStatus[]
    consent_history: UserConsent[]
    generated_at: string
  }> {
    try {
      const [consentStatus, consentHistory] = await Promise.all([
        this.getUserConsentStatus(userId),
        this.getUserConsentHistory(userId)
      ])

      return {
        user_id: userId,
        consent_status: consentStatus,
        consent_history: consentHistory,
        generated_at: new Date().toISOString()
      }
    } catch (error) {
      logger.error('Error generating compliance report', { userId }, error as Error)
      throw error
    }
  }
}

export const legalService = new LegalService()
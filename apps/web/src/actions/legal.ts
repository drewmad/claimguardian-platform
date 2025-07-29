/**
 * @fileMetadata
 * @purpose Server actions for legal compliance and consent management
 * @owner legal-team
 * @status active
 */
'use server'

import { headers } from 'next/headers'
import { legalServiceServer } from '@/lib/legal/legal-service-server'
import { logger } from '@/lib/logger'

/**
 * Record legal document acceptances with client metadata
 */
export async function recordLegalAcceptances(
  userId: string,
  acceptedDocuments: string[]
) {
  try {
    // Get client metadata from headers
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || 
               headersList.get('x-real-ip') ||
               'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'
    
    const metadata = {
      ip_address: ip,
      user_agent: userAgent
    }
    
    // Prepare acceptance requests
    const acceptances = acceptedDocuments.map(docId => ({
      legal_id: docId,
      ...metadata,
      signature_data: {
        timestamp: new Date().toISOString(),
        method: 'update_page',
        page_url: headersList.get('referer') || 'unknown'
      }
    }))

    // Record acceptances using server service
    await legalServiceServer.recordAcceptances(userId, acceptances)

    logger.track('legal_acceptances_recorded', {
      userId,
      documentCount: acceptedDocuments.length,
      source: 'server_action'
    })

    return { success: true }
  } catch (error) {
    logger.error('Failed to record legal acceptances', { userId }, error instanceof Error ? error : new Error(String(error)))
    throw new Error('Failed to record legal acceptances')
  }
}
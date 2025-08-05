/**
 * @fileMetadata
 * @purpose "API route to record legal document acceptance"
 * @owner legal-team
 * @dependencies ["next", "@supabase/supabase-js", "@/lib/legal"]
 * @exports ["POST"]
 * @complexity medium
 * @tags ["api", "legal", "consent", "compliance"]
 * @status stable
 */

import { NextRequest, NextResponse } from 'next/server'

import { legalServiceServer } from '@/lib/legal/legal-service-server'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Get authentication token from headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify the user with the token
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      logger.warn('Unauthorized legal acceptance attempt', { authError })
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { acceptances }: { acceptances: { legal_id: string }[] } = body

    if (!acceptances || !Array.isArray(acceptances)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected acceptances array.' },
        { status: 400 }
      )
    }

    if (acceptances.length === 0) {
      return NextResponse.json(
        { error: 'No acceptances provided' },
        { status: 400 }
      )
    }

    // Get client metadata for audit trail
    const clientMetadata = legalServiceServer.getClientMetadata(request)
    
    // Prepare acceptance requests with metadata
    const acceptanceRequests = await Promise.all(
      acceptances.map(async (acceptance) => ({
        legal_id: acceptance.legal_id,
        ip_address: clientMetadata.ip_address,
        user_agent: clientMetadata.user_agent,
        signature_data: {
          timestamp: new Date().toISOString(),
          request_id: crypto.randomUUID(),
          user_agent_hash: clientMetadata.user_agent ? 
            await hashString(clientMetadata.user_agent) : null
        }
      }))
    )

    // Record acceptances
    await legalServiceServer.recordAcceptances(user.id, acceptanceRequests)

    // Log successful acceptance
    logger.info('Legal acceptances recorded', {
      userId: user.id,
      documentCount: acceptances.length,
      documentsAccepted: acceptances.map(a => a.legal_id),
      ipAddress: clientMetadata.ip_address,
      userAgent: clientMetadata.user_agent?.substring(0, 100) // Truncate for logs
    })

    // Track analytics event
    logger.track('legal_documents_accepted', {
      userId: user.id,
      documentCount: acceptances.length,
      acceptanceMethod: 'api'
    })

    return NextResponse.json({ 
      success: true,
      accepted_count: acceptances.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Failed to record legal acceptances', {}, error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to hash strings for privacy
async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
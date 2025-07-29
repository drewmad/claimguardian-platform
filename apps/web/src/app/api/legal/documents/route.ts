/**
 * @fileMetadata
 * @purpose API route to fetch active legal documents
 * @owner legal-team
 * @dependencies ["next", "@/lib/legal"]
 * @exports ["GET"]
 * @complexity low
 * @tags ["api", "legal", "documents"]
 * @status active
 */

import { NextRequest, NextResponse } from 'next/server'
import { legalServiceServer } from '@/lib/legal/legal-service-server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const mode = searchParams.get('mode') // 'all' | 'needed'

    let documents
    
    if (mode === 'needed' && userId) {
      // Get documents that need user acceptance
      documents = await legalServiceServer.getDocumentsNeedingAcceptance(userId)
    } else {
      // Get all active documents (default)
      documents = await legalServiceServer.getActiveLegalDocuments()
    }

    // Add cache headers for better performance
    const response = NextResponse.json({ 
      data: documents,
      count: documents.length,
      timestamp: new Date().toISOString()
    })

    // Cache for 5 minutes
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
    
    return response

  } catch (error) {
    logger.error('Failed to fetch legal documents', {}, error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { error: 'Failed to fetch legal documents' },
      { status: 500 }
    )
  }
}
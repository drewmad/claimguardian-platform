/**
 * @fileMetadata
 * @purpose Static legal document API route - serves markdown files directly
 * @owner frontend-team
 * @status active
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

const LEGAL_DOCS = {
  'privacy_policy': {
    file: 'privacy-policy.md',
    title: 'Privacy Policy',
    summary: 'Learn how ClaimGuardian protects your personal information and privacy rights.'
  },
  'terms_of_service': {
    file: 'terms-of-service.md',
    title: 'Terms of Service',
    summary: 'Understand the terms and conditions for using ClaimGuardian services.'
  },
  'ai_use_agreement': {
    file: 'ai-disclaimer.md',
    title: 'AI Use Agreement',
    summary: 'Important information about our AI-powered features and limitations.'
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    if (!type || !LEGAL_DOCS[type as keyof typeof LEGAL_DOCS]) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      )
    }
    
    const docConfig = LEGAL_DOCS[type as keyof typeof LEGAL_DOCS]
    const filePath = join(process.cwd(), 'legal', docConfig.file)
    
    const content = await readFile(filePath, 'utf-8')
    
    // Create a document object that matches the expected interface
    const document = {
      id: `static-${type}`,
      type,
      title: docConfig.title,
      content,
      summary: docConfig.summary,
      version: '1.0.0',
      effective_date: '2025-08-03T00:00:00Z',
      created_at: new Date().toISOString(),
      sha256_hash: 'static-hash-' + Date.now(),
      storage_url: null
    }
    
    return NextResponse.json({ data: document })
    
  } catch (error) {
    console.error('Failed to load legal document:', error)
    return NextResponse.json(
      { error: 'Document not found' },
      { status: 404 }
    )
  }
}
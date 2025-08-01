/**
 * @fileMetadata
 * @purpose Component for displaying legal documents
 * @owner legal-team
 * @status active
 */
'use client'

import type { LegalDocument, LegalDocumentType } from '@claimguardian/db'
import { FileText, Calendar, Hash, Shield, ChevronLeft, Download, Printer } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

import { legalService } from '@/lib/legal/legal-service'
import { logger } from '@/lib/logger'


interface LegalDocumentViewProps {
  documentType: LegalDocumentType
}

export function LegalDocumentView({ documentType }: LegalDocumentViewProps) {
  const [document, setDocument] = useState<LegalDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true)
        setError('')
        
        const doc = await legalService.getDocumentByType(documentType)
        
        if (!doc) {
          setError('Document not found')
          return
        }
        
        setDocument(doc)
        
        logger.track('legal_document_viewed', {
          documentType,
          documentId: doc.id,
          version: doc.version
        })
        
      } catch (err) {
        logger.error('Failed to load legal document', { documentType }, err instanceof Error ? err : new Error(String(err)))
        setError('Failed to load document. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadDocument()
  }, [documentType])


  const handlePrint = () => {
    window.print()
    logger.track('legal_document_printed', {
      documentType,
      version: document?.version
    })
  }

  const handleDownload = () => {
    if (document?.storage_url) {
      window.open(document.storage_url, '_blank')
      logger.track('legal_document_downloaded', {
        documentType,
        version: document.version
      })
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-slate-700 rounded w-64 mb-4"></div>
        <div className="h-4 bg-slate-700 rounded w-32 mb-8"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-slate-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="text-center py-16">
        <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-300 mb-2">Document Not Available</h2>
        <p className="text-slate-400 mb-6">{error || 'The requested document could not be found.'}</p>
        <Link href="/" className="btn-primary">
          Return Home
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{document.title}</h1>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Effective: {new Date(document.effective_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Version {document.version}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                <span className="font-mono text-xs">{document.sha256_hash.substring(0, 8)}...</span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all border border-slate-600 hover:border-slate-500"
              title="Print document"
            >
              <Printer className="w-4 h-4" />
              <span className="text-sm font-medium">Print</span>
            </button>
            {document.storage_url && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all border border-slate-600 hover:border-slate-500"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Download PDF</span>
              </button>
            )}
            <Link
              href="/auth/signup"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium"
            >
              <Shield className="w-4 h-4" />
              <span className="text-sm">Create Account</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Box */}
      {document.summary && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-400 mb-2">Summary</h2>
          <p className="text-slate-300">{document.summary}</p>
        </div>
      )}

      {/* Document Content */}
      <div className="prose prose-invert max-w-none">
        <div 
          className="bg-slate-800/50 rounded-lg p-8 border border-slate-700"
          dangerouslySetInnerHTML={{ __html: formatContent(document.content) }}
        />
      </div>

      {/* Call to Action Section */}
      <div className="mt-8 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Ready to Get Started?</h3>
            <p className="text-slate-300">Join thousands of Florida property owners protecting their assets with ClaimGuardian.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="px-4 py-2 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-all"
            >
              Have Questions?
            </Link>
            <Link
              href="/auth/signup-advanced"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-slate-700">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <p>Last updated: {new Date(document.created_at).toLocaleDateString()}</p>
          <div className="flex items-center gap-4">
            <Link 
              href="/legal/privacy-policy"
              className="hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/legal/terms-of-service"
              className="hover:text-slate-300 transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              href="/legal/ai-use-agreement"
              className="hover:text-slate-300 transition-colors"
            >
              AI Use Agreement
            </Link>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .prose-invert {
            color: black !important;
          }
          .bg-slate-800\\/50 {
            background: white !important;
            border: 1px solid #ccc !important;
          }
          button, a {
            display: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

// Format content with proper HTML structure
function formatContent(content: string): string {
  // This is a simple formatter. In production, you'd use a proper markdown parser
  // or store HTML content directly
  return content
    .split('\n\n')
    .map(paragraph => {
      if (paragraph.startsWith('#')) {
        const level = paragraph.match(/^#+/)?.[0].length || 1
        const text = paragraph.replace(/^#+\s*/, '')
        return `<h${level} class="text-white font-semibold mb-4 mt-8">${text}</h${level}>`
      }
      if (paragraph.startsWith('- ')) {
        const items = paragraph.split('\n').map(item => 
          `<li class="mb-2">${item.replace(/^-\s*/, '')}</li>`
        ).join('')
        return `<ul class="list-disc list-inside space-y-2 mb-6">${items}</ul>`
      }
      if (paragraph.startsWith('1. ')) {
        const items = paragraph.split('\n').map(item => 
          `<li class="mb-2">${item.replace(/^\d+\.\s*/, '')}</li>`
        ).join('')
        return `<ol class="list-decimal list-inside space-y-2 mb-6">${items}</ol>`
      }
      return `<p class="mb-6 text-slate-300 leading-relaxed">${paragraph}</p>`
    })
    .join('')
}
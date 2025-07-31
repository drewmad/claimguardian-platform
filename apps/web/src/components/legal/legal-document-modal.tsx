/**
 * @fileMetadata
 * @purpose Modal component for displaying legal documents
 * @owner legal-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["LegalDocumentModal"]
 * @complexity medium
 * @tags ["legal", "modal", "document", "ui"]
 * @status active
 */
'use client'

import type { LegalDocument } from '@claimguardian/db'
import { X, FileText, Calendar, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'

import { legalServiceClientFix } from '@/lib/legal/legal-service-client-fix'
import { logger } from '@/lib/logger'


interface LegalDocumentModalProps {
  document: LegalDocument
  isOpen: boolean
  onClose: () => void
  onAccept?: () => void
  showAcceptButton?: boolean
}

export function LegalDocumentModal({
  document,
  isOpen,
  onClose,
  onAccept,
  showAcceptButton = false
}: LegalDocumentModalProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDocumentContent = async () => {
      try {
        setLoading(true)
        setError('')
        
        // Try to fetch content from Supabase via our legal service
        const htmlContent = await legalServiceClientFix.getDocumentContent(document.slug)
        setContent(htmlContent)
        
        logger.track('legal_document_modal_opened', {
          documentId: document.id,
          slug: document.slug,
          version: document.version
        })
        
      } catch (err) {
        logger.error('Failed to load document content', { documentId: document.id }, err instanceof Error ? err : new Error(String(err)))
        setError('Failed to load document content.')
        
        // Fallback to direct content if available from the document object
        if (document.content) {
          setContent(document.content)
        } else if (document.storage_url) {
          // If we have a storage URL, try to load from there
          try {
            const response = await fetch(document.storage_url)
            if (response.ok) {
              const fallbackContent = await response.text()
              setContent(fallbackContent)
              setError('') // Clear error if fallback succeeds
            } else {
              setContent('Document content is not available at this time.')
            }
          } catch {
            setContent('Document content is not available at this time.')
          }
        } else {
          setContent('Document content is not available.')
        }
      } finally {
        setLoading(false)
      }
    }

    if (isOpen && document) {
      loadDocumentContent()
    }
  }, [isOpen, document])

  const loadDocumentContent = async () => {
    // This function is now only used for retry button
    if (!document) return
    
    try {
      setLoading(true)
      setError('')
      
      const htmlContent = await legalServiceClientFix.getDocumentContent(document.slug)
      setContent(htmlContent)
      
    } catch (err) {
      logger.error('Failed to reload document content', { documentId: document.id }, err instanceof Error ? err : new Error(String(err)))
      setError('Failed to load document content.')
      setContent('Document content is not available.')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = () => {
    onAccept?.()
    onClose()
    logger.track('legal_document_accepted_from_modal', {
      documentId: document.id,
      slug: document.slug,
      version: document.version
    })
  }

  const openInNewTab = () => {
    const url = `/legal/${document.slug}`
    window.open(url, '_blank', 'noopener,noreferrer')
    logger.track('legal_document_opened_new_tab', {
      documentId: document.id,
      slug: document.slug
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-800 rounded-lg shadow-xl border border-slate-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">{document.title}</h2>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Version {document.version}
                </span>
                <span>Effective: {new Date(document.effective_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={openInNewTab}
              className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-slate-400">Loading document...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={loadDocumentContent}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <div 
              className="prose prose-slate prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700 bg-slate-800/50">
          <div className="text-xs text-slate-500 font-mono">
            Document Hash: {document.sha256_hash}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-300 border border-slate-600 hover:border-slate-500 rounded-lg transition-colors"
            >
              Close
            </button>
            {showAcceptButton && (
              <button
                onClick={handleAccept}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Accept & Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
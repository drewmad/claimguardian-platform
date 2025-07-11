/**
 * @fileMetadata
 * @purpose Legal consent form component for signup and updates
 * @owner legal-team
 * @dependencies ["react", "lucide-react", "@/lib/legal"]
 * @exports ["LegalConsentForm"]
 * @complexity medium
 * @tags ["legal", "consent", "compliance", "form"]
 * @status active
 */
'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, FileText, Shield, AlertCircle, CheckCircle } from 'lucide-react'
import { legalService, type LegalDocument } from '@/lib/legal/legal-service'
import { logger } from '@/lib/logger'

interface LegalConsentFormProps {
  userId?: string
  onConsentChange?: (hasAllConsents: boolean) => void
  onSubmit?: (acceptedDocuments: string[]) => Promise<void>
  showSubmitButton?: boolean
  disabled?: boolean
  mode?: 'signup' | 'update' | 'view'
}

interface DocumentState {
  [documentId: string]: boolean
}

export function LegalConsentForm({
  userId,
  onConsentChange,
  onSubmit,
  showSubmitButton = true,
  disabled = false,
  mode = 'signup'
}: LegalConsentFormProps) {
  const [documents, setDocuments] = useState<LegalDocument[]>([])
  const [acceptedDocs, setAcceptedDocs] = useState<DocumentState>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true)
        setError('')

        let docs: LegalDocument[]
        
        if (mode === 'update' && userId) {
          // Load only documents that need acceptance
          docs = await legalService.getDocumentsNeedingAcceptance(userId)
        } else {
          // Load all active documents (for signup or view)
          docs = await legalService.getActiveLegalDocuments()
        }

        setDocuments(docs)
        
        // Initialize acceptance state
        const initialState: DocumentState = {}
        docs.forEach(doc => {
          initialState[doc.id] = false
        })
        setAcceptedDocs(initialState)

      } catch (err) {
        logger.error('Failed to load legal documents', err)
        setError('Failed to load legal documents. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    loadDocuments()
  }, [userId, mode])

  useEffect(() => {
    const allAccepted = documents.length > 0 && 
      documents.every(doc => acceptedDocs[doc.id] === true)
    onConsentChange?.(allAccepted)
  }, [acceptedDocs, documents, onConsentChange])

  const handleDocumentToggle = (documentId: string, accepted: boolean) => {
    if (disabled) return

    setAcceptedDocs(prev => ({
      ...prev,
      [documentId]: accepted
    }))

    logger.track('legal_document_toggled', {
      documentId,
      accepted,
      userId
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!onSubmit || submitting) return

    const acceptedDocumentIds = Object.entries(acceptedDocs)
      .filter(([, accepted]) => accepted)
      .map(([docId]) => docId)

    if (acceptedDocumentIds.length !== documents.length) {
      setError('Please accept all required legal documents to continue.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      
      await onSubmit(acceptedDocumentIds)
      setSuccess(true)
      
      logger.track('legal_consent_submitted', {
        userId,
        documentCount: acceptedDocumentIds.length,
        mode
      })

    } catch (err) {
      logger.error('Failed to submit legal consent', err)
      setError('Failed to record consent. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const openDocument = (doc: LegalDocument) => {
    window.open(doc.storage_url, '_blank', 'noopener,noreferrer')
    logger.track('legal_document_viewed', {
      documentId: doc.id,
      slug: doc.slug,
      version: doc.version,
      userId
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-400">
          <FileText className="w-5 h-5" />
          <span>Loading legal documents...</span>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-slate-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error Loading Legal Documents</p>
            <p className="text-red-400/80 text-sm mt-1">{error}</p>
            <button
              onClick={loadDocuments}
              className="text-red-400 hover:text-red-300 text-sm underline mt-2"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-400">All legal documents are up to date!</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-400">Legal consent recorded successfully!</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <Shield className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-400 mb-1">
            {mode === 'signup' ? 'Required Consents' : 'Updated Legal Documents'}
          </h3>
          <p className="text-sm text-blue-300/80">
            {mode === 'signup' 
              ? 'By creating an account, you confirm you have read and agree to:'
              : 'We\'ve updated our legal documents. Please review and accept the new versions:'
            }
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {documents.map((doc) => (
          <LegalDocumentItem
            key={doc.id}
            document={doc}
            accepted={acceptedDocs[doc.id] || false}
            onToggle={(accepted) => handleDocumentToggle(doc.id, accepted)}
            onView={() => openDocument(doc)}
            disabled={disabled}
          />
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {showSubmitButton && (
        <button
          type="submit"
          disabled={submitting || disabled || Object.values(acceptedDocs).some(v => !v)}
          className="w-full btn-primary py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Recording Consent...' : 
           mode === 'signup' ? 'Accept and Create Account' : 'Accept Updated Terms'}
        </button>
      )}
    </form>
  )
}

interface LegalDocumentItemProps {
  document: LegalDocument
  accepted: boolean
  onToggle: (accepted: boolean) => void
  onView: () => void
  disabled?: boolean
}

function LegalDocumentItem({
  document,
  accepted,
  onToggle,
  onView,
  disabled = false
}: LegalDocumentItemProps) {
  return (
    <div className="border border-slate-600 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id={`consent-${document.id}`}
          checked={accepted}
          onChange={(e) => onToggle(e.target.checked)}
          disabled={disabled}
          className="w-5 h-5 bg-slate-700 border border-slate-600 rounded text-blue-500 focus:ring-2 focus:ring-blue-500 mt-0.5"
        />
        
        <div className="flex-1 min-w-0">
          <label 
            htmlFor={`consent-${document.id}`}
            className="block text-sm cursor-pointer"
          >
            <span className="text-slate-300">I have read and agree to the </span>
            <button
              type="button"
              onClick={onView}
              className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
            >
              {document.title}
              <ExternalLink className="w-3 h-3" />
            </button>
            <span className="text-slate-400"> ({document.version})</span>
          </label>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            <span>Version: {document.version}</span>
            <span>Effective: {new Date(document.effective_date).toLocaleDateString()}</span>
            <span className="font-mono">Hash: {document.sha256_hash.substring(0, 8)}...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
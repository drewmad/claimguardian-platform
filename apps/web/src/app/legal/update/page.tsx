/**
 * @fileMetadata
 * @purpose Legal document update consent page
 * @owner legal-team
 * @dependencies ["react", "next", "@/components/legal"]
 * @exports ["default"]
 * @complexity medium
 * @tags ["legal", "consent", "page", "compliance"]
 * @status active
 */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield, FileText } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { LegalConsentForm } from '@/components/legal/legal-consent-form'
import { legalService } from '@/lib/legal/legal-service'
import { logger } from '@/lib/logger'
import Link from 'next/link'

export default function LegalUpdatePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleConsentSubmit = async (acceptedDocuments: string[]) => {
    if (!user) return

    try {
      setSubmitting(true)
      
      // Get client metadata
      const metadata = legalService.getClientMetadata()
      
      // Prepare acceptance requests
      const acceptances = acceptedDocuments.map(docId => ({
        legal_id: docId,
        ...metadata,
        signature_data: {
          timestamp: new Date().toISOString(),
          method: 'update_page',
          page_url: window.location.href
        }
      }))

      // Record acceptances
      await legalService.recordAcceptances(user.id, acceptances)

      logger.track('legal_update_completed', {
        userId: user.id,
        documentCount: acceptedDocuments.length
      })

      // Redirect to dashboard after successful consent
      router.push('/dashboard')

    } catch (error) {
      logger.error('Failed to submit legal consent', error)
      throw error
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800 rounded-lg shadow-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>

          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Legal Documents Updated</h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              We've updated our legal documents. Please review and accept the new versions 
              to continue using your account.
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-400 mb-1">
                  Action Required
                </h3>
                <p className="text-sm text-yellow-300/80">
                  Your continued use of ClaimGuardian requires acceptance of updated legal documents. 
                  These changes may include important updates to your rights and our services.
                </p>
              </div>
            </div>
          </div>

          <LegalConsentForm
            userId={user.id}
            mode="update"
            onSubmit={handleConsentSubmit}
            disabled={submitting}
            showSubmitButton={true}
          />

          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
            <h3 className="text-sm font-medium mb-2">What happens next?</h3>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Your acceptance will be recorded with timestamp and IP address</li>
              <li>• You'll be redirected to your dashboard</li>
              <li>• You can view your consent history in account settings</li>
              <li>• We'll notify you of any future document updates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
/**
 * @fileMetadata
 * @purpose "Terms of Service page"
 * @dependencies ["@/components","next"]
 * @owner legal-team
 * @status stable
 */

import { Metadata } from 'next'

import { LegalDocumentView } from '@/components/legal/legal-document-view'

export const metadata: Metadata = {
  title: 'Terms of Service | ClaimGuardian',
  description: 'Terms and conditions for using ClaimGuardian services',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <LegalDocumentView documentType="terms_of_service" />
      </div>
    </div>
  )
}
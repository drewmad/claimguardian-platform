/**
 * @fileMetadata
 * @purpose "Privacy Policy page"
 * @dependencies ["@/components","next"]
 * @owner legal-team
 * @status stable
 */

import { Metadata } from 'next'

import { LegalDocumentView } from '@/components/legal/legal-document-view'

export const metadata: Metadata = {
  title: 'Privacy Policy | ClaimGuardian',
  description: 'Learn how ClaimGuardian protects your personal information and privacy',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <LegalDocumentView documentType="privacy_policy" />
      </div>
    </div>
  )
}
/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { ClaimCreationWizard } from '@/components/claims/claim-creation-wizard'

export default function NewClaimPage() {
  return (
    <ProtectedRoute>
      <ClaimCreationWizard />
    </ProtectedRoute>
  )
}
